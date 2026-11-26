import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createSoloService} from '../netlify/functions/lib/solo-service.mjs';
import {triangleGLB} from './solo-fixtures.mjs';

export async function runSoloChecks(pool) {
  if (!process.env.CI_TEST_DATABASE) throw Error('Solo checks require a disposable database.');
  const snapshot = async () => {
    const result = {};
    for (const table of ['worlds', 'players', 'cards', 'paths', 'events', 'edit_sessions', 'media_uploads', 'playtest_comments']) {
      result[table] = (await pool.query(`SELECT * FROM ${table} ORDER BY ${table === 'media_uploads' ? 'key' : 'id'}`)).rows;
    }
    return result;
  };
  const multiplayerBefore = await snapshot();
  await pool.query(await readFile('netlify/database/migrations/20261127001000_jootsy_solo.sql', 'utf8'));
  const files = new Map(), delivered = new Map();
  const options = {getPool: () => pool, getSecret: () => 'disposable_solo_signing_secret_0123456789', emailReady: () => true,
    sendCode: async (email, code) => delivered.set(email, code),
    getAssets: () => ({set: async (id, bytes) => files.set(id, Buffer.from(bytes)), get: async id => files.get(id) || null})};
  const handler = createSoloService(options);
  const call = async (route, method = 'GET', body, cookie = '', rev) => {
    const headers = {cookie};
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (rev !== undefined) headers['if-match'] = String(rev);
    const response = await handler(new Request(`https://jootsy.test/api/solo/${route}`, {method, headers,
      body: body === undefined ? undefined : JSON.stringify(body)}), {ip: 'disposable-test'});
    return {status: response.status, cookie: response.headers.get('set-cookie'), ...await response.json()};
  };
  const signIn = async email => {
    assert.equal((await call('auth/code', 'POST', {email})).status, 200);
    const signed = await call('auth/verify', 'POST', {email, code: delivered.get(email)});
    assert.equal(signed.status, 200);
    assert.match(signed.cookie, /HttpOnly; Secure; SameSite=Lax/);
    return {cookie: signed.cookie.split(';')[0], account: signed.account};
  };
  assert.equal((await call('projects')).status, 401);
  const noSender = createSoloService({...options, emailReady: () => false});
  const unavailable = await noSender(new Request('https://jootsy.test/api/solo/auth/code', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({email: 'test@example.test'})}));
  assert.equal(unavailable.status, 503);
  const a = await signIn('solo-a@example.test'), b = await signIn('solo-b@example.test');
  assert.equal((await call('auth/code', 'POST', {email: 'solo-a@example.test'})).status, 429);
  assert.equal((await call('auth/verify', 'POST', {email: 'solo-a@example.test', code: delivered.get('solo-a@example.test')})).status, 401);
  const id = randomUUID();
  let created = await call('projects', 'POST', {id, title: 'Private world', scenario_title: 'Object', body: 'I finally hold…'}, a.cookie);
  assert.equal(created.status, 201);
  let state = created.state, root = state.cards[0];
  const projectCall = async (route, method = 'GET', body) => {
    const result = await call(`projects/${id}/${route}`, method, body, a.cookie, state.rev);
    if (result.state) state = result.state;
    return result;
  };
  assert.equal((await call(`projects/${id}/state`, 'GET', undefined, b.cookie)).status, 404);
  assert.equal((await call('projects', 'GET', undefined, b.cookie)).projects.length, 0);
  assert.equal((await call('projects', 'POST', {id, title: 'Duplicate', scenario_title: 'No', body: 'No'}, a.cookie)).state.cards.length, 1);
  let cut = await projectCall(`cards/${root.id}/cuts`, 'POST', {kind: 'fork'});
  assert.equal(cut.paths.length, 2);
  assert.equal((await projectCall('session/commit', 'POST', {})).status, 409);
  const draft = await projectCall('plays', 'POST', {path_id: cut.paths[0].id, label: 'First choice', body: ''});
  const first = draft.card;
  const reopened = await call(`projects/${id}/state`, 'GET', undefined, a.cookie);
  assert(reopened.state.edit_session);
  assert(reopened.state.cards.some(card => card.id === first.id && card.draft));
  assert.equal(reopened.state.cards.find(card => card.id === first.id).body, '');
  assert.equal((await projectCall('session/commit', 'POST', {})).status, 409);
  await projectCall(`cards/${first.id}`, 'PATCH', {body: 'First fragment.'});
  const second = (await projectCall('plays', 'POST', {path_id: cut.paths[1].id, label: 'Other choice', body: 'Other fragment.'})).card;
  const nested = await projectCall(`cards/${first.id}/cuts`, 'POST', {kind: 'dream'});
  const third = (await projectCall('plays', 'POST', {path_id: nested.paths[0].id, label: 'Beyond', body: 'Deeper in the world.'})).card;
  assert.equal((await projectCall(`cards/${third.id}/cuts`, 'POST', {kind: 'destiny'})).status, 409);
  const commit = await projectCall('session/commit', 'POST', {});
  assert.equal(commit.card_ids.length, 3);
  assert(state.cards.filter(card => !card.deleted).every(card => !card.draft));
  const stale = await call(`projects/${id}/cards/${first.id}`, 'PATCH', {body: 'Stale overwrite'}, a.cookie, state.rev - 1);
  assert.equal(stale.status, 409); assert(stale.revision_conflict);
  assert.equal((await call(`projects/${id}/state`, 'GET', undefined, a.cookie)).state.cards.find(card => card.id === first.id).body, 'First fragment.');
  assert.equal((await projectCall(`cards/${root.id}`, 'DELETE')).status, 409);
  const jump = await projectCall(`cards/${second.id}/cuts`, 'POST', {kind: 'jootsy', to_card_id: first.id});
  assert.equal(jump.status, 200);
  assert.equal((await projectCall(`cards/${second.id}`, 'DELETE')).status, 409);
  assert.equal((await projectCall('session/commit', 'POST', {})).status, 200);
  await projectCall(`cards/${third.id}/cuts`, 'POST', {kind: 'wormhole', to_card_id: first.id});
  await projectCall('session/commit', 'POST', {});
  const asset = async (kind, bytes, owner = a.cookie) => {
    const response = await handler(new Request(`https://jootsy.test/api/solo/projects/${id}/assets?kind=${kind}&name=fixture`,
      {method: 'POST', headers: {cookie: owner}, body: bytes}));
    return {status: response.status, ...await response.json()};
  };
  const glb = triangleGLB(), model = await asset('model', glb);
  assert.equal(model.status, 201);
  assert.equal((await asset('model', glb, b.cookie)).status, 404);
  assert.equal((await asset('model', Buffer.from('renamed.glb'))).status, 400);
  await projectCall('', 'PATCH', {default_model_url: model.url});
  assert.equal(state.world.default_model_url, model.url);
  const modified = await projectCall(`cards/${first.id}`, 'PATCH', {model_mode: 'card', model_url: model.url});
  assert.equal(modified.card.model_url, model.url);
  await projectCall(`cards/${second.id}`, 'PATCH', {model_mode: 'none'});
  assert.equal(state.cards.find(card => card.id === second.id).model_mode, 'none');
  const mp3 = await asset('audio', await readFile('tests/fixtures/tone.mp3'));
  const video = await asset('video', await readFile('tests/fixtures/clip.mp4'));
  assert.equal(mp3.status, 201); assert.equal(video.status, 201);
  await projectCall(`cards/${first.id}`, 'PATCH', {audio_url: mp3.url, video_url: video.url});
  const restored = (await call(`projects/${id}/state`, 'GET', undefined, a.cookie)).state;
  const restoredCard = restored.cards.find(card => card.id === first.id);
  assert.equal(restoredCard.model_url, model.url); assert.equal(restoredCard.audio_url, mp3.url); assert.equal(restoredCard.video_url, video.url);
  const changeCut = await projectCall(`cards/${root.id}/cuts`, 'POST', {kind: 'fork'});
  const keptModel = (await projectCall('plays', 'POST', {path_id: changeCut.paths[0].id, label: 'Keep model', body: 'The model stays.', model_mode: 'card', model_url: model.url})).card;
  const removedModel = (await projectCall('plays', 'POST', {path_id: changeCut.paths[1].id, label: 'Restore model', body: 'Another model card.', model_mode: 'card', model_url: model.url})).card;
  await projectCall(`cards/${root.id}/cut`, 'PUT', {kind: 'destiny'});
  assert.equal(state.cards.find(card => card.id === keptModel.id).model_url, model.url);
  assert(state.cards.find(card => card.id === removedModel.id).deleted);
  const restoredFork = await projectCall(`cards/${root.id}/cut`, 'PUT', {kind: 'fork'});
  const restoredModel = (await projectCall('plays', 'POST', {path_id: restoredFork.paths[1].id, label: 'Restore model', body: 'Another model card.', model_mode: 'card', model_url: model.url})).card;
  assert.equal(restoredModel.model_url, model.url);
  await projectCall('session', 'DELETE');
  const privateFile = await handler(new Request(`https://jootsy.test${model.url}`, {headers: {cookie: a.cookie, range: 'bytes=0-3'}}));
  assert.equal(privateFile.status, 206); assert.equal(privateFile.headers.get('content-type'), 'model/gltf-binary');
  assert.equal(privateFile.headers.get('cache-control'), 'private,no-store');
  assert.deepEqual(Buffer.from(await privateFile.arrayBuffer()), glb.subarray(0, 4));
  assert.equal((await handler(new Request(`https://jootsy.test${model.url}`, {headers: {cookie: b.cookie}}))).status, 404);
  assert.equal((await handler(new Request(`https://jootsy.test${model.url}`))).status, 401);
  const bProject = await call('projects', 'POST', {id: randomUUID(), title: 'Other private world', scenario_title: 'Door', body: 'I walk through…'}, b.cookie);
  const badAsset = await call(`projects/${bProject.state.project.id}/cards/${bProject.state.cards[0].id}`, 'PATCH', {model_mode: 'card', model_url: model.url}, b.cookie, bProject.state.rev);
  assert.equal(badAsset.status, 400);
  assert.equal((await projectCall(`cards/${first.id}`, 'PATCH', {media_url: 42})).status, 400);
  await pool.query('DELETE FROM solo_auth_limits'); // Advance the disposable rate-limit fixture.
  const resumed = await signIn('solo-a@example.test');
  assert.equal(resumed.account.id, a.account.id);
  assert.equal((await call('projects', 'GET', undefined, resumed.cookie)).projects[0].id, id);
  assert.equal((await call(`projects/${id}/state`, 'GET', undefined, resumed.cookie)).state.cards.find(card => card.id === first.id).model_url, model.url);
  await pool.query("UPDATE solo_login_codes SET sent_at=now()-interval '2 minutes' WHERE email=$1", ['bad-code@example.test']);
  await call('auth/code', 'POST', {email: 'bad-code@example.test'});
  let wrong = delivered.get('bad-code@example.test') === '000000' ? '111111' : '000000';
  for (let index = 0; index < 5; index++) assert.equal((await call('auth/verify', 'POST', {email: 'bad-code@example.test', code: wrong})).status, 401);
  assert.equal((await call('auth/verify', 'POST', {email: 'bad-code@example.test', code: delivered.get('bad-code@example.test')})).status, 401);
  assert.equal((await pool.query('SELECT attempts FROM solo_login_codes WHERE email=$1', ['bad-code@example.test'])).rows[0].attempts, 5);
  for (let index = 0; index < 33; index++) assert.equal((await call('auth/code', 'POST', {email: `class-fixture-${index}@example.test`})).status, 200);
  await call('auth/logout', 'POST', {}, a.cookie);
  assert.equal((await call('auth/session', 'GET', undefined, a.cookie)).status, 401);
  assert.deepEqual(await snapshot(), multiplayerBefore);
  console.log('PASS Solo API: verified email and single-use codes; attempt limits; private projects and media; saved drafts and reopen; atomic Fork and three-stage commit; Solo Jootsy/Wormhole links; stale-write refusal; persisted audio/video/GLB; default model and overrides; byte ranges; sign-out; multiplayer rows unchanged.');
}
