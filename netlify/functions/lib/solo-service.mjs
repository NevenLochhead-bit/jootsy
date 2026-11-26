import {randomBytes, randomInt, randomUUID, createHash, createHmac, timingSafeEqual} from 'node:crypto';
import {mediaResponse} from './media.mjs';
import {inspectSoloMedia, MEDIA_HELP, MODEL_LIMIT} from './solo-media.mjs';

const COOKIE = 'jootsy_solo';
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const TREE_KINDS = ['destiny', 'fork', 'dream'];
const LINK_KINDS = ['wormhole', 'jootsy'];
const digest = text => createHash('sha256').update(text).digest('hex');
const json = (body, status = 200, headers = {}) => Response.json(body, {status,
  headers: {'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers}});
class SoloError extends Error {
  constructor(status, message, extra = {}) {super(message); this.status = status; this.extra = extra;}
}
const fail = (status, message, extra) => {throw new SoloError(status, message, extra);};
const uuid = value => {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) fail(400, 'Choose a valid project, card or file.');
  return value;
};
const text = (value, maximum, label, empty = false) => {
  if (typeof value !== 'string' || value.includes('\0') || (!empty && !value.trim()) || Array.from(value.trim()).length > maximum) {
    fail(400, `${label} must be ${empty ? 'at most ' : '1–'}${maximum} characters.`);
  }
  return value.trim();
};
const cookie = value => `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${value ? SESSION_SECONDS : 0}`;
const tokenFrom = request => (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';

async function readBytes(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) fail(400, 'There is nothing to save.');
  const chunks = [];
  let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {await reader.cancel(); fail(413, 'This file or request is too large.');}
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
async function bodyOf(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) fail(415, 'Send this form as JSON.');
  const data = JSON.parse((await readBytes(request, 24_000)).toString('utf8'));
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Check the form and try again.');
  return data;
}

export function createSoloService({getPool, getAssets, getSecret, emailReady, sendCode}) {
  const transaction = async (operation, read = false) => {
    const client = await getPool().connect();
    try {
      await client.query(read ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {await client.query('ROLLBACK'); throw error;}
    finally {client.release();}
  };
  const authenticate = async (client, request) => {
    const token = tokenFrom(request);
    if (!/^[A-Za-z0-9_-]{64}$/.test(token)) fail(401, 'Sign in with your email to open your projects.');
    const account = (await client.query(`SELECT a.* FROM solo_accounts a JOIN solo_auth_sessions s ON s.account_id=a.id
      WHERE s.token_hash=$1 AND s.expires_at>now()`, [digest(token)])).rows[0];
    if (!account) fail(401, 'Your sign-in has expired. Enter your email to continue.');
    return account;
  };
  const projectFor = async (client, account, id, write = false) => {
    const project = (await client.query(`SELECT * FROM solo_projects WHERE id=$1 AND account_id=$2 ${write ? 'FOR UPDATE' : ''}`,
      [uuid(id), account.id])).rows[0];
    if (!project) fail(404, 'That project could not be found.');
    return project;
  };
  const activeSession = async (client, project) => (await client.query("SELECT * FROM solo_edit_sessions WHERE project_id=$1 AND status='open'", [project.id])).rows[0] || null;
  const cardFor = async (client, project, id) => {
    const card = (await client.query('SELECT * FROM solo_cards WHERE id=$1 AND project_id=$2 AND NOT deleted', [uuid(id), project.id])).rows[0];
    if (!card) fail(404, 'That card is no longer in this project.');
    return card;
  };
  const pathsFrom = async (client, id) => (await client.query('SELECT * FROM solo_paths WHERE from_card_id=$1 AND NOT deleted ORDER BY position', [id])).rows;
  const assetURL = id => id ? `/solo-media/${id}` : null;
  const publicCard = (card, account) => ({...card, author_id: card.type === 'scenario' ? null : account.id,
    media_url: card.image_asset_id ? assetURL(card.image_asset_id) : card.media_url,
    audio_url: assetURL(card.audio_asset_id), video_url: assetURL(card.video_asset_id), model_url: assetURL(card.model_asset_id)});
  const stateFor = async (client, project, account) => {
    const cards = (await client.query('SELECT * FROM solo_cards WHERE project_id=$1 ORDER BY seq', [project.id])).rows;
    const paths = (await client.query('SELECT * FROM solo_paths WHERE project_id=$1 ORDER BY position', [project.id])).rows;
    return {project, world: {id: project.id, slug: `solo-${project.id}`, name: project.title,
      default_model_url: assetURL(project.default_model_asset_id), jootsy_enabled: true, jootsy_min_cards: 0},
      rev: Number(project.rev), player: {id: account.id, name: 'You', is_instructor: false},
      players: [{id: account.id, name: 'You'}], cards: cards.map(card => publicCard(card, account)),
      paths: paths.map(path => ({...path, created_by: account.id})), events: [], edit_session: await activeSession(client, project), full: true};
  };
  const ownedAsset = async (client, project, url, kind) => {
    if (!url) return null;
    const match = typeof url === 'string' && /^\/solo-media\/([a-f0-9-]+)$/i.exec(url);
    if (!match) fail(400, 'Upload this file into the current project first.');
    const asset = (await client.query("SELECT * FROM solo_assets WHERE id=$1 AND project_id=$2 AND kind=$3 AND status='ready'", [uuid(match[1]), project.id, kind])).rows[0];
    if (!asset) fail(400, 'Choose a saved file from this project.');
    return asset.id;
  };
  const mediaFields = async (client, project, body, current = {}) => {
    const mediaURL = body.media_url === undefined ? (current.image_asset_id ? assetURL(current.image_asset_id) : current.media_url) : body.media_url;
    if (mediaURL != null && typeof mediaURL !== 'string') fail(400, 'Choose a saved image or a complete HTTPS link.');
    let image = null, embed = null, kind = null;
    if (mediaURL) {
      if (mediaURL.startsWith('/solo-media/')) {image = await ownedAsset(client, project, mediaURL, 'image'); kind = 'image';}
      else {
        let url;
        try {url = new URL(mediaURL);} catch {fail(400, 'Paste a complete HTTPS media link.');}
        if (url.protocol !== 'https:' || url.href.length > 2048) fail(400, 'Paste a complete HTTPS media link.');
        embed = url.href; kind = 'embed';
      }
    }
    const audio = await ownedAsset(client, project, body.audio_url === undefined ? assetURL(current.audio_asset_id) : body.audio_url, 'audio');
    const video = await ownedAsset(client, project, body.video_url === undefined ? assetURL(current.video_asset_id) : body.video_url, 'video');
    if (video && (image || embed)) fail(400, 'Choose an image or video for this card. Sound and a 3D model can be added separately.');
    const modelMode = body.model_mode ?? current.model_mode ?? 'inherit';
    if (!['inherit', 'card', 'none'].includes(modelMode)) fail(400, 'Choose a 3D model setting.');
    const model = modelMode === 'card' ? await ownedAsset(client, project, body.model_url === undefined ? assetURL(current.model_asset_id) : body.model_url, 'model') : null;
    if (modelMode === 'card' && !model) fail(400, 'Upload a GLB model first.');
    return [kind, embed, image, audio, video, modelMode, model];
  };
  const saveCard = async (client, project, account, card, body) => {
    const content = text(body.body ?? card.body, 600, 'Narrative fragment', card.draft);
    const media = await mediaFields(client, project, body, card);
    if (body.label !== undefined && card.parent_path_id) await client.query('UPDATE solo_paths SET label=$2 WHERE id=$1', [card.parent_path_id, text(body.label, 60, 'Choice', card.draft)]);
    const updated = (await client.query(`UPDATE solo_cards SET body=$2,media_kind=$3,media_url=$4,image_asset_id=$5,
      audio_asset_id=$6,video_asset_id=$7,model_mode=$8,model_asset_id=$9 WHERE id=$1 RETURNING *`, [card.id, content, ...media])).rows[0];
    return {card: publicCard(updated, account)};
  };
  const removeDraft = async (client, path) => {
    if (path.to_card_id && TREE_KINDS.includes(path.kind)) {
      for (const child of (await pathsFrom(client, path.to_card_id)).filter(value => value.draft)) await removeDraft(client, child);
      await client.query('UPDATE solo_cards SET deleted=true WHERE id=$1 AND draft', [path.to_card_id]);
    }
    await client.query('UPDATE solo_paths SET deleted=true WHERE id=$1 AND draft', [path.id]);
  };
  const transition = async (client, project, source, body, change) => {
    if (![...TREE_KINDS, ...LINK_KINDS].includes(body.kind)) fail(400, 'Choose a move.');
    let session = await activeSession(client, project);
    if (source.draft) {
      const parent = (await client.query('SELECT * FROM solo_paths WHERE id=$1', [source.parent_path_id])).rows[0];
      if (!session || source.session_id !== session.id || parent.from_card_id !== session.anchor_card_id) fail(409, 'Commit these cards before continuing further.');
    } else if (session && session.anchor_card_id !== source.id) fail(409, 'Resume or discard your current writing session first.');
    if (!session) session = (await client.query('INSERT INTO solo_edit_sessions(project_id,anchor_card_id) VALUES($1,$2) RETURNING *', [project.id, source.id])).rows[0];
    const existing = (await pathsFrom(client, source.id)).filter(path => path.draft && path.session_id === session.id);
    if ((!change && existing.length) || (change && !existing.length)) fail(409, 'Use Change on the current transition.');
    let target = null;
    if (LINK_KINDS.includes(body.kind)) {
      target = await cardFor(client, project, body.to_card_id);
      if (target.draft || target.id === source.id) fail(400, 'Choose another committed card in this world.');
    }
    let kept = [];
    if (change && TREE_KINDS.includes(existing[0].kind) && TREE_KINDS.includes(body.kind)) {
      kept = existing.slice(0, body.kind === 'fork' ? 2 : 1);
      for (const path of existing.slice(kept.length)) await removeDraft(client, path);
      for (const path of kept) await client.query('UPDATE solo_paths SET kind=$2 WHERE id=$1', [path.id, body.kind]);
    } else for (const path of existing) await removeDraft(client, path);
    while (kept.length < (body.kind === 'fork' ? 2 : 1)) {
      const position = (await client.query('SELECT COALESCE(max(position),-1)+1 AS n FROM solo_paths WHERE from_card_id=$1', [source.id])).rows[0].n;
      const label = target ? target.scenario_title || (await client.query('SELECT label FROM solo_paths WHERE id=$1', [target.parent_path_id])).rows[0]?.label || 'Jump' : '';
      kept.push((await client.query(`INSERT INTO solo_paths(project_id,from_card_id,to_card_id,kind,label,position,session_id)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [project.id, source.id, target?.id || null, body.kind, label, position, session.id])).rows[0]);
    }
    return {session, paths: kept};
  };

  return async function handler(request, context = {}) {
    try {
      const url = new URL(request.url), method = request.method;
      if (!['GET', 'HEAD'].includes(method) && request.headers.get('origin') && request.headers.get('origin') !== url.origin) fail(403, 'Open Jootsy Solo directly to save changes.');
      if (url.pathname.startsWith('/solo-media/')) {
        if (!['GET', 'HEAD'].includes(method)) fail(405, 'Use GET or HEAD for saved files.');
        const id = uuid(url.pathname.split('/')[2]);
        const asset = await transaction(async client => {
          const account = await authenticate(client, request);
          return (await client.query(`SELECT a.* FROM solo_assets a JOIN solo_projects p ON p.id=a.project_id
            WHERE a.id=$1 AND p.account_id=$2 AND a.status='ready'`, [id, account.id])).rows[0];
        }, true);
        if (!asset) fail(404, 'That file could not be found.');
        const bytes = await getAssets().get(asset.id, {type: 'arrayBuffer'});
        if (!bytes) fail(404, 'That file could not be found.');
        const response = mediaResponse(request, bytes, asset.content_type);
        response.headers.set('cache-control', 'private,no-store');
        return response;
      }
      if (!url.pathname.startsWith('/api/solo/')) fail(404, 'That page could not be found.');
      const route = url.pathname.slice('/api/solo/'.length).split('/').filter(Boolean);
      if (route[0] === 'auth' && route[1] === 'code' && method === 'POST') {
        if (!emailReady()) fail(503, 'Email sign-in is awaiting the Jootsy Solo email sender setup.');
        const body = await bodyOf(request), email = text(body.email, 254, 'Email').toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a complete email address.');
        const secret = getSecret();
        if (!secret || secret.length < 32) fail(503, 'Sign-in is awaiting server configuration.');
        const code = String(randomInt(1_000_000)).padStart(6, '0'), challenge = randomUUID();
        const hash = createHmac('sha256', secret).update(`${email}:${challenge}:${code}`).digest('hex');
        await transaction(async client => {
          const bucket = digest(`${context.ip || 'unknown'}:${Math.floor(Date.now() / 600_000)}`);
          const limit = (await client.query(`INSERT INTO solo_auth_limits(bucket,requests,expires_at) VALUES($1,1,now()+interval '20 minutes')
            ON CONFLICT(bucket) DO UPDATE SET requests=solo_auth_limits.requests+1 RETURNING requests`, [bucket])).rows[0];
          if (limit.requests > 120) fail(429, 'Please wait a few minutes before requesting another code.');
          const emailBucket = digest(`email:${email}:${Math.floor(Date.now() / 60_000)}`);
          const emailLimit = (await client.query(`INSERT INTO solo_auth_limits(bucket,requests,expires_at) VALUES($1,1,now()+interval '2 minutes')
            ON CONFLICT(bucket) DO UPDATE SET requests=solo_auth_limits.requests+1 RETURNING requests`, [emailBucket])).rows[0];
          if (emailLimit.requests > 1) fail(429, 'A code was just sent. Check your inbox, or wait a minute to resend.');
          const prior = (await client.query('SELECT * FROM solo_login_codes WHERE email=$1 FOR UPDATE', [email])).rows[0];
          if (prior && Date.now() - new Date(prior.sent_at).getTime() < 60_000) fail(429, 'A code was just sent. Check your inbox, or wait a minute to resend.');
          await client.query(`INSERT INTO solo_login_codes(email,challenge_id,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes')
            ON CONFLICT(email) DO UPDATE SET challenge_id=$2,code_hash=$3,attempts=0,expires_at=now()+interval '10 minutes',sent_at=now()`, [email, challenge, hash]);
        });
        try {await sendCode(email, code);} catch {
          await getPool().query('DELETE FROM solo_login_codes WHERE email=$1 AND challenge_id=$2', [email, challenge]);
          fail(503, 'The code could not be emailed. Please try again in a moment.');
        }
        return json({ok: true});
      }
      if (route[0] === 'auth' && route[1] === 'verify' && method === 'POST') {
        const body = await bodyOf(request), email = text(body.email, 254, 'Email').toLowerCase();
        if (!/^\d{6}$/.test(body.code || '')) fail(400, 'Enter the six-digit code from your email.');
        const secret = getSecret();
        if (!secret || secret.length < 32) fail(503, 'Sign-in is awaiting server configuration.');
        const verified = await transaction(async client => {
          const challenge = (await client.query('SELECT * FROM solo_login_codes WHERE email=$1 FOR UPDATE', [email])).rows[0];
          if (!challenge || challenge.attempts >= 5 || new Date(challenge.expires_at).getTime() <= Date.now()) return null;
          await client.query('UPDATE solo_login_codes SET attempts=attempts+1 WHERE email=$1', [email]);
          const hash = createHmac('sha256', secret).update(`${email}:${challenge.challenge_id}:${body.code}`).digest('hex');
          if (!timingSafeEqual(Buffer.from(hash), Buffer.from(challenge.code_hash))) return null;
          await client.query('DELETE FROM solo_login_codes WHERE email=$1', [email]);
          const account = (await client.query('INSERT INTO solo_accounts(email) VALUES($1) ON CONFLICT(email) DO UPDATE SET email=excluded.email RETURNING *', [email])).rows[0];
          const token = randomBytes(48).toString('base64url');
          await client.query("INSERT INTO solo_auth_sessions(token_hash,account_id,expires_at) VALUES($1,$2,now()+interval '30 days')", [digest(token), account.id]);
          return {account, token};
        });
        if (!verified) fail(401, 'That code is incorrect or expired. Request a new code after five attempts.');
        return json({account: verified.account}, 200, {'set-cookie': cookie(verified.token)});
      }
      if (route[0] === 'auth' && route[1] === 'logout' && method === 'POST') {
        await getPool().query('DELETE FROM solo_auth_sessions WHERE token_hash=$1', [digest(tokenFrom(request))]);
        return json({ok: true}, 200, {'set-cookie': cookie('')});
      }
      if (route[0] === 'auth' && route[1] === 'session' && method === 'GET') return json(await transaction(async client => ({account: await authenticate(client, request)}), true));
      if (route[0] !== 'projects') fail(404, 'That action could not be found.');
      if (route.length === 1) {
        if (method === 'GET') return json(await transaction(async client => {
          const account = await authenticate(client, request);
          const projects = (await client.query(`SELECT p.*, (SELECT count(*) FROM solo_cards c WHERE c.project_id=p.id AND NOT c.deleted AND NOT c.draft AND c.type='open') AS card_count
            FROM solo_projects p WHERE p.account_id=$1 ORDER BY p.updated_at DESC`, [account.id])).rows;
          return {projects};
        }, true));
        if (method === 'POST') {
          const body = await bodyOf(request);
          return json(await transaction(async client => {
            const account = await authenticate(client, request), id = uuid(body.id);
            let project = (await client.query('SELECT * FROM solo_projects WHERE id=$1', [id])).rows[0];
            if (project && project.account_id !== account.id) fail(404, 'That project could not be found.');
            if (!project) {
              const inserted = (await client.query('INSERT INTO solo_projects(id,account_id,title) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING RETURNING *', [id, account.id, text(body.title, 80, 'Project title')])).rows[0];
              project = inserted || await projectFor(client, account, id);
              if (inserted) await client.query("INSERT INTO solo_cards(project_id,type,scenario_title,body) VALUES($1,'scenario',$2,$3)",
                [project.id, text(body.scenario_title, 60, 'Scenario title'), text(body.body, 600, 'Opening text')]);
            }
            return {state: await stateFor(client, project, account)};
          }), 201);
        }
        fail(405, 'Use GET or POST for projects.');
      }
      const projectId = uuid(route[1]), action = route.slice(2);
      if (action[0] === 'assets' && method === 'POST') {
        const kind = url.searchParams.get('kind');
        if (!Object.hasOwn(MEDIA_HELP, kind)) fail(400, 'Choose an image, sound, video or GLB.');
        // Check ownership before accepting a binary request or allocating storage.
        await transaction(async client => projectFor(client, await authenticate(client, request), projectId), true);
        const bytes = await readBytes(request, MODEL_LIMIT), type = inspectSoloMedia(kind, bytes);
        if (!type) fail(400, MEDIA_HELP[kind]);
        const id = randomUUID(), name = text(Array.from(url.searchParams.get('name') || `File.${type.extension}`).slice(0, 180).join(''), 180, 'File name');
        await transaction(async client => {
          await projectFor(client, await authenticate(client, request), projectId, true);
          await client.query('INSERT INTO solo_assets(id,project_id,kind,content_type,byte_count,name) VALUES($1,$2,$3,$4,$5,$6)', [id, projectId, kind, type.contentType, bytes.length, name]);
        });
        try {
          await getAssets().set(id, bytes, {onlyIfNew: true});
          await getPool().query("UPDATE solo_assets SET status='ready' WHERE id=$1", [id]);
        } catch (error) {await getPool().query("UPDATE solo_assets SET status='failed' WHERE id=$1", [id]); throw error;}
        return json({url: assetURL(id), kind, name}, 201);
      }
      if (method === 'GET' && (action.length === 0 || action[0] === 'state')) return json(await transaction(async client => {
        const account = await authenticate(client, request), project = await projectFor(client, account, projectId);
        return {state: await stateFor(client, project, account)};
      }, true));
      const body = method === 'DELETE' ? {} : await bodyOf(request);
      return json(await transaction(async client => {
        const account = await authenticate(client, request), project = await projectFor(client, account, projectId, true);
        if (request.headers.get('if-match') !== String(project.rev)) fail(409, 'This project changed in another window. Your writing is still here. Reload the saved project before continuing.', {revision_conflict: true});
        let result = {};
        if (action.length === 0 && method === 'PATCH') {
          const model = body.default_model_url === undefined ? project.default_model_asset_id : await ownedAsset(client, project, body.default_model_url, 'model');
          await client.query('UPDATE solo_projects SET title=$2,default_model_asset_id=$3 WHERE id=$1', [project.id, body.title === undefined ? project.title : text(body.title, 80, 'Project title'), model]);
        } else if (action[0] === 'scenarios' && method === 'POST') {
          const media = await mediaFields(client, project, body);
          const card = (await client.query(`INSERT INTO solo_cards(project_id,type,scenario_title,body,media_kind,media_url,image_asset_id,audio_asset_id,video_asset_id,model_mode,model_asset_id)
            VALUES($1,'scenario',$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [project.id, text(body.title, 60, 'Scenario title'), text(body.body, 600, 'Opening text'), ...media])).rows[0];
          result = {card: publicCard(card, account)};
        } else if (action[0] === 'cards') {
          const card = await cardFor(client, project, action[1]);
          if (['cut', 'cuts'].includes(action[2]) && ['POST', 'PUT'].includes(method)) result = await transition(client, project, card, body, action[2] === 'cut');
          else if (action.length === 2 && method === 'PATCH') {
            if (card.type === 'scenario' && body.title !== undefined) await client.query('UPDATE solo_cards SET scenario_title=$2 WHERE id=$1', [card.id, text(body.title, 60, 'Scenario title')]);
            result = await saveCard(client, project, account, card, body);
          } else if (action.length === 2 && method === 'DELETE') {
            const session = await activeSession(client, project);
            const drafts = (await client.query('SELECT id FROM solo_paths WHERE project_id=$1 AND draft AND NOT deleted AND (from_card_id=$2 OR to_card_id=$2)', [project.id, card.id])).rows;
            if (session?.anchor_card_id === card.id || drafts.length) fail(409, 'Finish or discard the writing session using this card first.');
            if (card.draft || (await pathsFrom(client, card.id)).some(path => TREE_KINDS.includes(path.kind))) fail(409, 'Keep this card while a story or draft grows from it.');
            await client.query('UPDATE solo_cards SET deleted=true WHERE id=$1', [card.id]);
            await client.query('UPDATE solo_paths SET deleted=true WHERE from_card_id=$1 OR to_card_id=$1', [card.id]);
          } else fail(404, 'That card action could not be found.');
        } else if (action[0] === 'plays' && method === 'POST') {
          const session = await activeSession(client, project);
          const path = (await client.query('SELECT * FROM solo_paths WHERE id=$1 AND project_id=$2 AND NOT deleted', [uuid(body.path_id), project.id])).rows[0];
          if (!path?.draft || path.session_id !== session?.id || !TREE_KINDS.includes(path.kind)) fail(409, 'Write inside your current session.');
          if (path.to_card_id) fail(409, 'This cell is already written.');
          const parent = await cardFor(client, project, path.from_card_id);
          const media = await mediaFields(client, project, body);
          const card = (await client.query(`INSERT INTO solo_cards(project_id,type,body,parent_path_id,depth,draft,session_id,media_kind,media_url,image_asset_id,audio_asset_id,video_asset_id,model_mode,model_asset_id)
            VALUES($1,'open',$2,$3,$4,true,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [project.id, text(body.body ?? '', 600, 'Narrative fragment', true), path.id, parent.depth + 1, session.id, ...media])).rows[0];
          await client.query('UPDATE solo_paths SET to_card_id=$2,label=$3 WHERE id=$1', [path.id, card.id, text(body.label ?? '', 60, 'Choice', true)]);
          result = {card: publicCard(card, account)};
        } else if (action[0] === 'session') {
          const session = await activeSession(client, project);
          if (!session) fail(409, 'There is no open writing session.');
          if (action[1] === 'commit' && method === 'POST') {
            const offered = (await client.query('SELECT * FROM solo_paths WHERE session_id=$1 AND NOT deleted', [session.id])).rows;
            const written = (await client.query('SELECT * FROM solo_cards WHERE session_id=$1 AND NOT deleted ORDER BY seq', [session.id])).rows;
            if (!offered.length || offered.some(path => !path.to_card_id || (!LINK_KINDS.includes(path.kind) && !path.label.trim())) || written.some(card => !card.body.trim())) fail(409, 'Write every cell before committing.');
            for (const path of offered) await cardFor(client, project, path.to_card_id);
            await client.query('UPDATE solo_cards SET draft=false WHERE session_id=$1 AND NOT deleted', [session.id]);
            await client.query('UPDATE solo_paths SET draft=false WHERE session_id=$1 AND NOT deleted', [session.id]);
            await client.query("UPDATE solo_edit_sessions SET status='committed' WHERE id=$1", [session.id]);
            result = {card_ids: written.map(card => card.id), anchor_id: session.anchor_card_id};
          } else if (action.length === 1 && method === 'DELETE') {
            await client.query('UPDATE solo_cards SET deleted=true WHERE session_id=$1 AND draft', [session.id]);
            await client.query('UPDATE solo_paths SET deleted=true WHERE session_id=$1 AND draft', [session.id]);
            await client.query("UPDATE solo_edit_sessions SET status='discarded' WHERE id=$1", [session.id]);
          } else fail(404, 'That session action could not be found.');
        } else fail(404, 'That project action could not be found.');
        const updated = (await client.query('UPDATE solo_projects SET rev=rev+1,updated_at=now() WHERE id=$1 RETURNING *', [project.id])).rows[0];
        return {...result, state: await stateFor(client, updated, account)};
      }));
    } catch (error) {
      if (error instanceof SoloError) return json({message: error.message, ...error.extra}, error.status);
      if (error instanceof SyntaxError) return json({message: 'Check the form and try again.'}, 400);
      console.error('Jootsy Solo request failed', error);
      return json({message: 'Your project could not be reached. Keep this window open and try again.'}, 500);
    }
  };
}
