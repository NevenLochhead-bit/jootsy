import { getDatabase } from '@netlify/database';
import { getStore } from '@netlify/blobs';
import {soundType,videoType,mediaResponse,SOUND_ERROR,VIDEO_ERROR,IMAGE_LIMIT,SOUND_LIMIT,VIDEO_LIMIT} from './lib/media.mjs';
let testMediaStore;
const mediaStore=()=>testMediaStore??getStore({name:'jootsy-images',consistency:'strong'});
export function setTestMediaStore(store){if(!process.env.CI_TEST_DATABASE)throw Error('Disposable CI only.');testMediaStore=store;}
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(scryptCb);
const env=k=>globalThis.Netlify?.env.get(k) ?? process.env[k];
let database;
const db=()=>database??=getDatabase(env('NETLIFY_DB_URL')?{connectionString:env('NETLIFY_DB_URL')}:undefined);
class Fault extends Error { constructor(status,error,message,extra={}){super(message);Object.assign(this,{status,error,extra});} }
const fail=(status,code,message,extra)=>{throw new Fault(status,code,message,extra);};
const text=(v,max,label)=>{if(label==='Choice'&&(typeof v!=='string'||!v.trim()))fail(400,'invalid','Give this card a choice.');if(typeof v!=='string'||!v.trim()||Array.from(v.trim()).length>max)fail(400,'invalid',`${label} must be 1–${max} characters.`,label==='Name'?{field:'name'}:{});return v.trim();};
const uid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v);
const requireId=v=>{if(!uid(v))fail(400,'invalid','That card or path is not valid.');return v;};
async function hash(pass){const salt=randomBytes(16).toString('hex');return `${salt}:${Buffer.from(await scrypt(pass,salt,32)).toString('hex')}`;}
async function matches(pass,stored){const [salt,key]=stored.split(':');if(!salt||!key)return false;const actual=Buffer.from(await scrypt(pass,salt,32));const expected=Buffer.from(key,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
function signature(data){const key=env('TOKEN_SECRET');if(!key||key.length<32)fail(503,'setup','Token signing has not been configured.');return createHmac('sha256',key).update(data).digest('base64url');}
function token(player){const data=Buffer.from(JSON.stringify({id:player.id,w:player.world_id,v:player.token_version,exp:Date.now()+1000*60*60*24*90})).toString('base64url');return `${data}.${signature(data)}`;}
function decode(value){try{const [data,sig]=value.split('.');const expected=Buffer.from(signature(data));const actual=Buffer.from(sig||'');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw 0;const parsed=JSON.parse(Buffer.from(data,'base64url'));if(parsed.exp<Date.now())throw 0;return parsed;}catch{fail(401,'login','Please enter your name and passcode again.');}}
const publicPlayer=p=>({id:p.id,name:p.name,is_instructor:p.is_instructor,last_seen_at:p.last_seen_at});
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
async function transaction(slug,callback,read=false){const c=await db().pool.connect();try{await c.query(read?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');const w=(await c.query(`SELECT * FROM worlds WHERE slug=$1 ${read?'':'FOR UPDATE'}`,[slug])).rows[0];if(!w)fail(404,'world','This world does not exist.');const result=await callback(c,w);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
const bump=async(c,w)=>{const row=(await c.query('UPDATE worlds SET rev=rev+1 WHERE id=$1 RETURNING rev',[w.id])).rows[0];w.rev=row.rev;return row.rev;};
async function auth(c,w,req){const t=decode((req.headers.get('authorization')||'').replace(/^Bearer /,''));if(t.w!==w.id)fail(401,'login','Log into this world first.');const p=(await c.query('SELECT * FROM players WHERE id=$1 AND world_id=$2',[t.id,w.id])).rows[0];if(!p||p.token_version!==t.v)fail(401,'login','Your passcode was reset. Please log in again.');return p;}
const instructor=p=>{if(!p.is_instructor)fail(403,'forbidden','Only the instructor can do that.');};
const own=(card,p)=>{if(card.author_id!==p.id)fail(403,'forbidden','Only the author can change this card.');};
async function card(c,w,id){const a=(await c.query('SELECT * FROM cards WHERE id=$1 AND world_id=$2 AND NOT deleted',[requireId(id),w.id])).rows[0];if(!a)fail(404,'card','This card is no longer here.');return a;}
async function path(c,w,id){const a=(await c.query('SELECT * FROM paths WHERE id=$1 AND world_id=$2 AND NOT deleted',[requireId(id),w.id])).rows[0];if(!a)fail(404,'path','This path is no longer here.');await card(c,w,a.from_card_id);return a;}
const pathsOf=async(c,id)=>(await c.query('SELECT * FROM paths WHERE from_card_id=$1 AND NOT deleted ORDER BY position',[id])).rows;
const links=['wormhole','jootsy'],kinds=['fork','destiny','dream'];
const optionalText=(v,max,label)=>{if(typeof v!=='string'||Array.from(v.trim()).length>max)fail(400,'invalid',`${label} must be at most ${max} characters.`);return v.trim();};
async function activeSession(c,w,p){return (await c.query("SELECT * FROM edit_sessions WHERE world_id=$1 AND player_id=$2 AND status='open'",[w.id,p.id])).rows[0]||null;}
async function editable(c,w,p,a){if(a.draft){own(a,p);const session=await activeSession(c,w,p);if(!session||session.id!==a.session_id)fail(409,'session','This session is no longer open.');}return a;}
async function sessionSource(c,w,p,source,rev,change=false){
 let session=await activeSession(c,w,p);
 if(source.draft){await editable(c,w,p,source);const parent=await path(c,w,source.parent_path_id);if(parent.from_card_id!==session.anchor_card_id)fail(409,'stage','Commit to the board, then keep going.');}
 else if(session){if(session.anchor_card_id!==source.id)fail(409,'session_open','Resume or discard your open session first.',{anchor_id:session.anchor_card_id,session_id:session.id});}
 else {if(change)fail(409,'session','Start a session first.');session=(await c.query('INSERT INTO edit_sessions(world_id,player_id,anchor_card_id,rev) VALUES($1,$2,$3,$4) RETURNING *',[w.id,p.id,source.id,rev])).rows[0];}
 return session;
}
async function linkTarget(c,w,p,source,kind,targetId){
 own(source,p);const target=await card(c,w,targetId);if(target.draft)fail(403,'target','Choose a committed card.');
 if(target.id===source.id)fail(400,'target','Choose another card.');
 if(kind==='wormhole'){own(target,p);}
 else {if(!w.jootsy_enabled)fail(409,'locked','Jootsy! is not enabled yet.');const n=Number((await c.query('SELECT count(*) AS n FROM cards WHERE world_id=$1 AND author_id=$2 AND NOT deleted AND NOT draft',[w.id,p.id])).rows[0].n);if(!p.is_instructor&&n<w.jootsy_min_cards)fail(409,'locked',`${n} of ${w.jootsy_min_cards} cards played.`);if(!target.author_id||target.author_id===p.id||target.hidden)fail(403,'target',"Choose a visible committed card by another player.");}
 return target;
}
async function makeDraftPath(c,w,p,source,session,kind,rev,cutId,target=null){
 const n=(await c.query('SELECT COALESCE(max(position),-1)+1 AS n FROM paths WHERE from_card_id=$1',[source.id])).rows[0].n;
 let label='';if(target)label=target.type==='scenario'?target.scenario_title:(await path(c,w,target.parent_path_id)).label;
 return (await c.query('INSERT INTO paths(world_id,from_card_id,label,created_by,position,rev,kind,cut_id,to_card_id,draft,session_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10) RETURNING *',[w.id,source.id,label,p.id,n,rev,kind,cutId,target?.id||null,session.id])).rows[0];
}
async function removeDraftPath(c,w,p,a,rev){
 if(!a.draft||a.created_by!==p.id)fail(403,'forbidden','Only your own draft transition can change.');
 if(a.to_card_id&&!links.includes(a.kind)){const child=await card(c,w,a.to_card_id);await editable(c,w,p,child);for(const next of await pathsOf(c,child.id))await removeDraftPath(c,w,p,next,rev);await c.query('UPDATE cards SET deleted=true,rev=$2,updated_at=now() WHERE id=$1',[child.id,rev]);}
 await c.query('UPDATE paths SET deleted=true,rev=$2 WHERE id=$1',[a.id,rev]);
}
async function transition(c,w,p,source,b,rev,change=false){
 if(![...kinds,...links].includes(b.kind))fail(400,'kind','Choose Fork, Destiny, Dream, Wormhole or Jootsy!.');
 const session=await sessionSource(c,w,p,source,rev,change),existing=(await pathsOf(c,source.id)).filter(a=>a.draft&&a.session_id===session.id);
 if(!change&&existing.length)fail(409,'transition','Use Change on this transition.',{anchor_id:session.anchor_card_id});
 if(change&&!existing.length)fail(409,'transition','Only a draft transition can change.');
 const target=links.includes(b.kind)?await linkTarget(c,w,p,source,b.kind,b.to_card_id):null;
 const old=existing[0]?.kind,cutId=existing[0]?.cut_id||randomUUID();let kept=[];
 if(change&&kinds.includes(old)&&kinds.includes(b.kind)){
  kept=existing.slice(0,b.kind==='fork'?2:1);for(const a of existing.slice(kept.length))await removeDraftPath(c,w,p,a,rev);
  for(const a of kept)await c.query('UPDATE paths SET kind=$2,rev=$3 WHERE id=$1',[a.id,b.kind,rev]);
 }else if(change)for(const a of existing)await removeDraftPath(c,w,p,a,rev);
 const n=b.kind==='fork'?2:1;while(kept.length<n)kept.push(await makeDraftPath(c,w,p,source,session,b.kind,rev,cutId,target));
 await c.query('UPDATE edit_sessions SET rev=$2,updated_at=now() WHERE id=$1',[session.id,rev]);return {session,paths:kept,rev:Number(rev)};
}
async function event(c,w,type,p,cardId,pathId,target=null){await c.query('INSERT INTO events(world_id,type,actor_id,target_player_id,card_id,path_id,rev) VALUES($1,$2,$3,$4,$5,$6,$7)',[w.id,type,p.id,target,cardId,pathId,w.rev]);}
function media(b){if(!b.media_url)return {kind:null,url:null};let u;try{u=new URL(b.media_url);}catch{fail(400,'media','Paste a complete https link.');}if(u.protocol!=='https:')fail(400,'media','Media links must use https.');if(u.href.length>2048)fail(400,'media','That link is too long.');if(!['image','embed'].includes(b.media_kind))fail(400,'media','Choose an image or a media link.');return {kind:b.media_kind,url:u.href};}
async function audioUrl(c,w,value,origin,kind='audio'){if(value==null||value==='')return null;let u;try{u=new URL(value);}catch{fail(400,kind,kind==='video'?VIDEO_ERROR:SOUND_ERROR);}if(u.protocol!=='https:'||u.href.length>2048)fail(400,kind,kind==='video'?VIDEO_ERROR:SOUND_ERROR);const key=u.pathname.startsWith('/media/')?u.pathname.slice(7):'';const found=(await c.query("SELECT key FROM media_uploads WHERE key=$1 AND world_id=$2 AND kind=$3 AND status='ready'",[key,w.id,kind])).rows[0];if(!found)fail(400,kind,kind==='video'?VIDEO_ERROR:'Upload an MP3 or M4A under 2 MB first.');return `${origin}/media/${key}`;}
async function removeCard(c,w,a,rev){
 await c.query('UPDATE cards SET deleted=true,rev=$2,updated_at=now() WHERE id=$1',[a.id,rev]);
 await c.query("UPDATE paths SET deleted=true,rev=$2 WHERE kind IN ('wormhole','jootsy') AND (from_card_id=$1 OR to_card_id=$1)",[a.id,rev]);
 if(a.parent_path_id)await c.query('UPDATE paths SET deleted=true,to_card_id=NULL,taken_at=NULL,rev=$2 WHERE id=$1',[a.parent_path_id,rev]);
}
export default async function handler(req){
 try{
  const url=new URL(req.url);
  if(url.pathname.startsWith('/media/')){if(!['GET','HEAD'].includes(req.method))return new Response('Method not allowed',{status:405});const key=url.pathname.slice(7);if(!/^[a-z0-9-]+\/[a-z0-9-]+\.(jpg|mp3|m4a|mp4)$/i.test(key))return new Response('Not found',{status:404});const entry=await mediaStore().get(key,{type:'arrayBuffer'});return entry?mediaResponse(req,entry,key.endsWith('.mp4')?'video/mp4':key.endsWith('.mp3')?'audio/mpeg':key.endsWith('.m4a')?'audio/mp4':'image/jpeg'):new Response('Not found',{status:404});}
  const parts=url.pathname.split('/').filter(Boolean);const slug=parts[2],route=parts.slice(3),method=req.method;
  if(parts[0]!=='api'||parts[1]!=='w')fail(404,'route','This address does not exist.');
  if(route[0]==='join'&&method==='POST'){
   const b=await req.json();if(!['new','returning'].includes(b.mode))fail(400,'mode',"Choose 'I'm new' or 'I've played before'.",{field:'name'});
   const name=text(typeof b.name==='string'?b.name.trim().replace(/\s+/g,' '):b.name,40,'Name'),key=name.toLocaleLowerCase('en-CA');
   if(typeof b.passcode!=='string'||b.passcode.length<4||b.passcode.length>128)fail(400,'passcode','Choose a passcode with 4–128 characters.',{field:'passcode'});
   const adminPass=env('INSTRUCTOR_PASSCODE');if(!adminPass)fail(503,'setup','The instructor passcode has not been configured.');
   const [newHash,adminHash]=await Promise.all([hash(b.passcode),hash(adminPass)]);
   return json(await transaction(slug,async(c,w)=>{
    let p=(await c.query("SELECT * FROM players WHERE world_id=$1 AND regexp_replace(name_key,'\\s+',' ','g')=$2 LIMIT 1",[w.id,key])).rows[0];
    if(b.mode==='new'&&(p||key==='neven'))fail(409,'name_taken',"That name is taken. Add an initial, or choose 'I've played before'.",{field:'name'});
    if(b.mode==='returning'&&!p&&key!=='neven')fail(404,'name_missing',`No player called '${name}' in this game. Check the spelling, or choose 'I'm new'.`,{field:'name'});
    if(b.mode==='returning'&&!await matches(b.passcode,p?.pass_hash||adminHash))fail(401,'passcode',"That passcode doesn't match. Ask your instructor to reset it.",{field:'passcode'});
    const rev=await bump(c,w);
    if(p)p=(await c.query('UPDATE players SET last_seen_at=now(),rev=$2 WHERE id=$1 RETURNING *',[p.id,rev])).rows[0];
    else p=(await c.query('INSERT INTO players(world_id,name,name_key,pass_hash,is_instructor,rev) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[w.id,name,key,key==='neven'?adminHash:newHash,key==='neven',rev])).rows[0];
    return {token:token(p),player:publicPlayer(p)};
   }));
  }
  if(route[0]==='state'&&method==='GET')return json(await transaction(slug,async(c,w)=>{
   const p=await auth(c,w,req);const n=Number(url.searchParams.get('since')||0);if(!Number.isSafeInteger(n)||n<0)fail(400,'revision','That revision is not valid.');const since=n>Number(w.rev)?0:n;
   const cards=(await c.query('SELECT * FROM cards WHERE world_id=$1 AND rev>$2 AND (NOT draft OR author_id=$3) ORDER BY seq',[w.id,since,p.id])).rows.map(a=>a.hidden&&!p.is_instructor?{...a,scenario_title:a.type==='scenario'?'Hidden':a.scenario_title,body:'Hidden by the instructor',media_kind:null,media_url:null,audio_url:null,video_url:null,door_label:null,target_card_id:null}:a);
   const paths=(await c.query("SELECT p.*, CASE WHEN target.hidden AND NOT $4 THEN 'Hidden' ELSE p.label END AS label FROM paths p LEFT JOIN cards target ON target.id=p.to_card_id WHERE p.world_id=$1 AND p.rev>$2 AND (NOT p.draft OR p.created_by=$3) ORDER BY p.position",[w.id,since,p.id,p.is_instructor])).rows;
   const players=(await c.query('SELECT id,name,is_instructor,last_seen_at FROM players WHERE world_id=$1',[w.id])).rows.map(q=>p.is_instructor?q:{id:q.id,name:q.name});
   const events=(await c.query("SELECT * FROM events WHERE world_id=$1 AND rev>$2 AND (target_player_id=$3 OR actor_id=$3 OR type IN ('session_committed','jootsy')) ORDER BY created_at DESC",[w.id,since,p.id])).rows;
   return {world:w,rev:Number(w.rev),cards,paths,players,events,player:publicPlayer(p),edit_session:await activeSession(c,w,p),full:since===0};
  },true));
  if(route[0]==='uploads'&&method==='POST'){
   await transaction(slug,async(c,w)=>{await auth(c,w,req);},true);
   const bytes=await req.arrayBuffer(),data=new Uint8Array(bytes),kind=url.searchParams.get('kind')||'image';let type;
   if(kind==='audio'){type=soundType(bytes);if(bytes.byteLength>SOUND_LIMIT||!type)fail(400,'sound',SOUND_ERROR);}
   else if(kind==='video'){type=videoType(bytes);if(bytes.byteLength>VIDEO_LIMIT||!type)fail(400,'video',VIDEO_ERROR);}
   else{if(kind!=='image')fail(400,'media','Choose image, sound or video.');if(bytes.byteLength>IMAGE_LIMIT)fail(400,'image','Image is over 1.5 MB after resizing. Choose a smaller image.');if(data[0]!==255||data[1]!==216||data[2]!==255)fail(400,'image','Choose a JPEG image under 1.5 MB.');type={extension:'jpg',contentType:'image/jpeg'};}
   const reservation=await transaction(slug,async(c,w)=>{const p=await auth(c,w,req),count=Number((await c.query("SELECT count(*) AS n FROM media_uploads WHERE world_id=$1 AND player_id=$2 AND status<>'failed'",[w.id,p.id])).rows[0].n);if(count>=60)fail(429,'upload_limit',"You've reached 60 uploads in this game. Continue with text, or ask your instructor for help.");const key=`${w.id}/${randomUUID()}.${type.extension}`;await c.query('INSERT INTO media_uploads(key,world_id,player_id,kind,byte_count) VALUES($1,$2,$3,$4,$5)',[key,w.id,p.id,kind,bytes.byteLength]);return {key,worldId:w.id,playerId:p.id};});
   try{await mediaStore().set(reservation.key,bytes,{metadata:{player_id:reservation.playerId,world_id:reservation.worldId,content_type:type.contentType}});await db().pool.query("UPDATE media_uploads SET status='ready' WHERE key=$1",[reservation.key]);}
   catch(error){await db().pool.query("UPDATE media_uploads SET status='failed' WHERE key=$1",[reservation.key]);throw error;}
   return json({url:`${url.origin}/media/${reservation.key}`,kind:kind},201);

  }
  return json(await transaction(slug,async(c,w)=>{
   const p=await auth(c,w,req);let b={};if(['POST','PATCH','PUT'].includes(method)&&req.headers.get('content-type')?.includes('json'))b=await req.json();
   const rev=await bump(c,w);await c.query('UPDATE players SET last_seen_at=now(),rev=$2 WHERE id=$1',[p.id,rev]);
   if(route[0]==='session'){
    const session=await activeSession(c,w,p);if(!session)fail(409,'session','There is no open session.');
    const offered=(await c.query('SELECT * FROM paths WHERE session_id=$1 AND draft AND NOT deleted ORDER BY position',[session.id])).rows;
    if(route[1]==='commit'&&method==='POST'){
     if(!offered.length)fail(409,'empty','Add a card or link before committing.');
     if(offered.some(a=>!a.to_card_id))fail(409,'blank','Write every cell before committing. To keep one Fork card, Change to Destiny.');
     const written=(await c.query('SELECT * FROM cards WHERE session_id=$1 AND draft AND NOT deleted ORDER BY seq',[session.id])).rows;
     for(const a of written){text(a.body,600,'Narrative Fragment');text((await path(c,w,a.parent_path_id)).label,60,'Choice');}
     for(const a of offered){await card(c,w,a.from_card_id);if(links.includes(a.kind))await linkTarget(c,w,p,await card(c,w,a.from_card_id),a.kind,a.to_card_id);else await card(c,w,a.to_card_id);}
     await c.query('UPDATE cards SET draft=false,rev=$2,updated_at=now() WHERE session_id=$1 AND NOT deleted',[session.id,rev]);await c.query('UPDATE paths SET draft=false,rev=$2,taken_at=COALESCE(taken_at,now()) WHERE session_id=$1 AND NOT deleted',[session.id,rev]);
     await c.query("UPDATE edit_sessions SET status='committed',rev=$2,updated_at=now() WHERE id=$1",[session.id,rev]);
     for(const a of written)await event(c,w,'card_played',p,a.id,a.parent_path_id);
     const anchor=await card(c,w,session.anchor_card_id),first=offered.find(a=>a.from_card_id===anchor.id);
     if(anchor.author_id&&anchor.author_id!==p.id)await event(c,w,'card_cut',p,anchor.id,first?.id||null,anchor.author_id);
     for(const a of offered.filter(a=>a.kind==='jootsy')){const target=await card(c,w,a.to_card_id);await event(c,w,'jootsy',p,a.from_card_id,a.id,target.author_id);}
     await event(c,w,'session_committed',p,written.at(-1)?.id||anchor.id,null);
     return {card_ids:written.map(a=>a.id),link_ids:offered.filter(a=>links.includes(a.kind)).map(a=>a.id),anchor_id:anchor.id,rev:Number(rev)};
    }
    if(route.length===1&&method==='DELETE'){
     await c.query('UPDATE paths SET deleted=true,rev=$2 WHERE session_id=$1 AND draft',[session.id,rev]);await c.query('UPDATE cards SET deleted=true,rev=$2,updated_at=now() WHERE session_id=$1 AND draft',[session.id,rev]);await c.query("UPDATE edit_sessions SET status='discarded',rev=$2,updated_at=now() WHERE id=$1",[session.id,rev]);return {ok:true};
    }
   }
   if(route[0]==='plays'&&method==='POST'){
    const a=await path(c,w,b.path_id),session=await activeSession(c,w,p);if(a.created_by!==p.id)fail(403,'forbidden','Only the dealer can write this cell.');
    if(!a.draft||!session||session.id!==a.session_id)fail(409,'session','Write inside your open session.');
    if(a.to_card_id)fail(409,'taken','This cell is already written.',{card_id:a.to_card_id});if(!kinds.includes(a.kind))fail(400,'path','Choose a cell.');
    const label=text(b.label,60,'Choice'),body=text(b.body,600,'Narrative Fragment'),m=media(b),sound=await audioUrl(c,w,b.audio_url,url.origin),video=await audioUrl(c,w,b.video_url,url.origin,'video'),parent=await card(c,w,a.from_card_id);
    if(video&&m.url)fail(400,'media','Choose an image or a video, plus a sound.');
    const made=(await c.query("INSERT INTO cards(world_id,type,author_id,body,media_kind,media_url,parent_path_id,depth,rev,draft,session_id,audio_url,video_url) VALUES($1,'open',$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11) RETURNING *",[w.id,p.id,body,m.kind,m.url,a.id,parent.depth+1,rev,session.id,sound,video])).rows[0];
    await c.query('UPDATE paths SET label=$2,to_card_id=$3,rev=$4 WHERE id=$1',[a.id,label,made.id,rev]);return {card:made,rev:Number(rev)};
   }
   if(route[0]==='scenarios'){
    instructor(p);
    if(method==='POST'){const title=text(b.title,60,'Scenario name'),body=text(b.body,600,'Opening text');const a=(await c.query("INSERT INTO cards(world_id,type,scenario_title,body,depth,rev) VALUES($1,'scenario',$2,$3,0,$4) RETURNING *",[w.id,title,body,rev])).rows[0];return {card:a};}
    const a=await card(c,w,route[1]);if(a.type!=='scenario')fail(400,'scenario','Choose a scenario.');
    if(method==='PATCH'){const title=text(b.title??a.scenario_title,60,'Scenario name'),body=text(b.body??a.body,600,'Opening text');return {card:(await c.query('UPDATE cards SET scenario_title=$2,body=$3,rev=$4,updated_at=now() WHERE id=$1 RETURNING *',[a.id,title,body,rev])).rows[0]};}
    if(method==='DELETE'){if((await pathsOf(c,a.id)).length)fail(409,'written','This scenario already has a story growing from it.');await removeCard(c,w,a,rev);return {ok:true};}
   }
   if(route[0]==='cards'){
    const a=await card(c,w,route[1]);await editable(c,w,p,a);
    if(route[2]==='hide'&&method==='POST'){instructor(p);if(typeof b.value!=='boolean')fail(400,'hidden','Choose hide or unhide.');await c.query('UPDATE cards SET hidden=$2,rev=$3,updated_at=now() WHERE id=$1',[a.id,b.value,rev]);await c.query('UPDATE paths SET rev=$2 WHERE to_card_id=$1',[a.id,rev]);await event(c,w,'card_hidden',p,a.id,null,a.author_id);return {ok:true};}
    if(route[2]==='cuts'&&method==='POST')return transition(c,w,p,a,b,rev);
    if(route[2]==='cut'&&method==='PUT')return transition(c,w,p,a,b,rev,true);
    if(route[2]==='dead-end'&&method==='POST')fail(410,'retired','A card with nowhere to go is already a dead end.');
    own(a,p);
    if(route.length===2&&method==='PATCH'){
     const body=(a.draft?optionalText:text)(b.body??a.body,600,'Narrative Fragment'),m=media({media_kind:b.media_kind===undefined?a.media_kind:b.media_kind,media_url:b.media_url===undefined?a.media_url:b.media_url});
     const sound=b.audio_url===undefined?a.audio_url:await audioUrl(c,w,b.audio_url,url.origin);
     const video=b.video_url===undefined?a.video_url:await audioUrl(c,w,b.video_url,url.origin,'video');if(video&&m.url)fail(400,'media','Choose an image or a video, plus a sound.');
     if(b.label!==undefined)await c.query('UPDATE paths SET label=$2,rev=$3 WHERE id=$1',[a.parent_path_id,(a.draft?optionalText:text)(b.label,60,'Choice'),rev]);
     return {card:(await c.query('UPDATE cards SET body=$2,media_kind=$3,media_url=$4,rev=$5,audio_url=$6,video_url=$7,updated_at=now() WHERE id=$1 RETURNING *',[a.id,body,m.kind,m.url,rev,sound,video])).rows[0]};
    }
    if(route.length===2&&method==='DELETE'){
     if((await pathsOf(c,a.id)).some(x=>!links.includes(x.kind)))fail(409,'written','A path leaves this card, so it cannot be deleted.');
     if(a.draft)fail(409,'session','Change the transition or discard the session.');await removeCard(c,w,a,rev);return {ok:true};
    }
   }
   if(route[0]==='paths'&&route.length===2&&['PATCH','DELETE'].includes(method)){
    const a=await path(c,w,route[1]);if(a.created_by!==p.id)fail(403,'forbidden','Only the dealer can change this blank card.');
    if(a.draft)fail(409,'session','Change the transition or discard the session.');
    if(a.to_card_id&&!links.includes(a.kind))fail(409,'written','A written path cannot be changed.');
    if(method==='PATCH')await c.query('UPDATE paths SET label=$2,rev=$3 WHERE id=$1',[a.id,(a.draft?optionalText:text)(b.label,60,'Choice'),rev]);
    else await c.query('UPDATE paths SET deleted=true,rev=$2 WHERE id=$1',[a.id,rev]);return {ok:true};
   }
   if(route[0]==='settings'&&method==='PATCH'){instructor(p);for(const key of ['jootsy_min_cards'])if(b[key]!==undefined&&(!Number.isInteger(b[key])||b[key]<1||b[key]>100))fail(400,'settings','The card threshold must be a whole number from 1 to 100.');if(b.jootsy_enabled!==undefined&&typeof b.jootsy_enabled!=='boolean')fail(400,'settings','Choose on or off.');await c.query('UPDATE worlds SET jootsy_ring=$2,jootsy_min_cards=$3,end_ring=$4,jootsy_enabled=$5 WHERE id=$1',[w.id,w.jootsy_ring,b.jootsy_min_cards??w.jootsy_min_cards,w.end_ring,b.jootsy_enabled??w.jootsy_enabled]);return {ok:true};}
   if(route[0]==='players'&&route[2]==='reset-passcode'&&method==='POST'){instructor(p);const target=(await c.query('SELECT * FROM players WHERE id=$1 AND world_id=$2',[requireId(route[1]),w.id])).rows[0];if(!target)fail(404,'player','This player does not exist.');if(target.is_instructor)fail(400,'instructor','Change the instructor passcode through the environment settings.');const passcode=randomBytes(6).toString('base64url');await c.query('UPDATE players SET pass_hash=$2,token_version=token_version+1,rev=$3 WHERE id=$1',[target.id,await hash(passcode),rev]);return {passcode};}
   fail(404,'route','This action does not exist.');
  }));
 }catch(e){if(e instanceof Fault)return json({error:e.error,message:e.message,...e.extra},e.status);if(e instanceof SyntaxError)return json({error:'invalid',message:'Please check the form and try again.'},400);console.error('Jootsy API error',e);return json({error:'server',message:'The table could not be reached. Your writing is still here; try again.'},500);}
}
export const config={path:['/api/w/*','/media/*']};

// Close the SDK pool when the disposable integration runner finishes.
export async function closeDatabase(){if(database){await database.pool.end();database=undefined;}}
