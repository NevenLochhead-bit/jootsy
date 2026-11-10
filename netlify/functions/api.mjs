import { getDatabase } from '@netlify/database';
import { getStore } from '@netlify/blobs';
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(scryptCb);
const env=k=>globalThis.Netlify?.env.get(k) ?? process.env[k];
let database;
const db=()=>database??=getDatabase(env('NETLIFY_DB_URL')?{connectionString:env('NETLIFY_DB_URL')}:undefined);
class Fault extends Error { constructor(status,error,message,extra={}){super(message);Object.assign(this,{status,error,extra});} }
const fail=(status,code,message,extra)=>{throw new Fault(status,code,message,extra);};
const text=(v,max,label)=>{if(typeof v!=='string'||!v.trim()||Array.from(v.trim()).length>max)fail(400,'invalid',`${label} must be 1–${max} characters.`);return v.trim();};
const uid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v);
const requireId=v=>{if(!uid(v))fail(400,'invalid','That card or path is not valid.');return v;};
async function hash(pass){const salt=randomBytes(16).toString('hex');return `${salt}:${Buffer.from(await scrypt(pass,salt,32)).toString('hex')}`;}
async function matches(pass,stored){const [salt,key]=stored.split(':');if(!salt||!key)return false;const actual=Buffer.from(await scrypt(pass,salt,32));const expected=Buffer.from(key,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
function signature(data){const key=env('TOKEN_SECRET')||env('INSTRUCTOR_PASSCODE');if(!key)fail(503,'setup','The instructor passcode has not been configured.');return createHmac('sha256',key).update(data).digest('base64url');}
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
function claimable(a,p){if(a.to_card_id)fail(409,'taken','Someone just played here.',{card_id:a.to_card_id});if(a.claimed_by&&a.claimed_by!==p.id&&new Date(a.claimed_until)>new Date())fail(409,'claimed','Someone is writing here. Choose another path.',{claimed_by:a.claimed_by});}
async function addPath(c,w,parent,label,p,rev){const n=(await c.query('SELECT COALESCE(max(position),-1)+1 AS n FROM paths WHERE from_card_id=$1',[parent.id])).rows[0].n;return (await c.query('INSERT INTO paths(world_id,from_card_id,label,created_by,position,rev) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[w.id,parent.id,text(label,60,'Path name'),p?.id||null,n,rev])).rows[0];}
async function event(c,w,type,p,cardId,pathId,target=null){await c.query('INSERT INTO events(world_id,type,actor_id,target_player_id,card_id,path_id,rev) VALUES($1,$2,$3,$4,$5,$6,$7)',[w.id,type,p.id,target,cardId,pathId,w.rev]);}
const kinds=['fork','destiny','dream','wormhole','dead_end'];
function media(b){if(!b.media_url)return {kind:null,url:null};let u;try{u=new URL(b.media_url);}catch{fail(400,'media','Paste a complete https link.');}if(u.protocol!=='https:')fail(400,'media','Media links must use https.');if(u.href.length>2048)fail(400,'media','That link is too long.');if(!['image','embed'].includes(b.media_kind))fail(400,'media','Choose an image or a media link.');return {kind:b.media_kind,url:u.href};}
async function removeCard(c,w,a,rev){await c.query('UPDATE cards SET deleted=true,rev=$2,updated_at=now() WHERE id=$1',[a.id,rev]);await c.query('UPDATE paths SET deleted=true,claimed_by=NULL,claimed_until=NULL,rev=$2 WHERE from_card_id=$1',[a.id,rev]);if(a.parent_path_id)await c.query('UPDATE paths SET to_card_id=NULL,taken_at=NULL,rev=$2 WHERE id=$1',[a.parent_path_id,rev]);const wormholes=(await c.query("SELECT * FROM cards WHERE target_card_id=$1 AND type='wormhole' AND NOT deleted",[a.id])).rows;for(const wh of wormholes)await removeCard(c,w,wh,rev);}
export default async function handler(req){
 try{
  const url=new URL(req.url);
  if(url.pathname.startsWith('/media/')){const key=url.pathname.slice(7);if(!/^[a-z0-9-]+\/[a-z0-9-]+\.jpg$/i.test(key))return new Response('Not found',{status:404});const entry=await getStore({name:'jootsy-images',consistency:'strong'}).get(key,{type:'arrayBuffer'});return entry?new Response(entry,{headers:{'content-type':'image/jpeg','cache-control':'public,max-age=31536000,immutable','x-content-type-options':'nosniff'}}):new Response('Not found',{status:404});}
  const parts=url.pathname.split('/').filter(Boolean);const slug=parts[2],route=parts.slice(3),method=req.method;
  if(parts[0]!=='api'||parts[1]!=='w')fail(404,'route','This address does not exist.');
  if(route[0]==='join'&&method==='POST'){
   const b=await req.json(),name=text(b.name,40,'Name'),key=name.toLocaleLowerCase('en-CA');
   if(typeof b.passcode!=='string'||b.passcode.length<4||b.passcode.length>128)fail(400,'passcode','Choose a passcode with 4–128 characters.');
   return json(await transaction(slug,async(c,w)=>{
    const adminPass=env('INSTRUCTOR_PASSCODE');if(!adminPass)fail(503,'setup','The instructor passcode has not been configured.');
    const existingAdmin=(await c.query("SELECT id FROM players WHERE world_id=$1 AND name_key='neven'",[w.id])).rows[0];
    const rev=await bump(c,w);
    if(!existingAdmin)await c.query("INSERT INTO players(world_id,name,name_key,pass_hash,is_instructor,rev) VALUES($1,'Neven','neven',$2,true,$3)",[w.id,await hash(adminPass),rev]);
    let p=(await c.query('SELECT * FROM players WHERE world_id=$1 AND name_key=$2',[w.id,key])).rows[0];
    if(p){if(!await matches(b.passcode,p.pass_hash))fail(401,'passcode','That name already exists. The passcode does not match.');p=(await c.query('UPDATE players SET last_seen_at=now(),rev=$2 WHERE id=$1 RETURNING *',[p.id,rev])).rows[0];}
    else p=(await c.query('INSERT INTO players(world_id,name,name_key,pass_hash,rev) VALUES($1,$2,$3,$4,$5) RETURNING *',[w.id,name,key,await hash(b.passcode),rev])).rows[0];
    return {token:token(p),player:publicPlayer(p)};
   }));
  }
  if(route[0]==='state'&&method==='GET')return json(await transaction(slug,async(c,w)=>{
   const p=await auth(c,w,req);const n=Number(url.searchParams.get('since')||0);if(!Number.isSafeInteger(n)||n<0)fail(400,'revision','That revision is not valid.');const since=n>Number(w.rev)?0:n;
   const cards=(await c.query('SELECT * FROM cards WHERE world_id=$1 AND rev>$2 ORDER BY seq',[w.id,since])).rows.map(a=>a.hidden&&!p.is_instructor?{...a,body:'Hidden by the instructor',media_kind:null,media_url:null,door_label:null,target_card_id:null}:a);
   const paths=(await c.query('SELECT * FROM paths WHERE world_id=$1 AND rev>$2 ORDER BY position',[w.id,since])).rows;
   const players=(await c.query('SELECT id,name,is_instructor,last_seen_at FROM players WHERE world_id=$1',[w.id])).rows;
   const events=(await c.query('SELECT * FROM events WHERE world_id=$1 AND rev>$2 AND (target_player_id=$3 OR actor_id=$3) ORDER BY created_at DESC',[w.id,since,p.id])).rows;
   return {world:w,rev:Number(w.rev),cards,paths,players,events,player:publicPlayer(p),full:since===0};
  },true));
  if(route[0]==='uploads'&&method==='POST'){
   const identity=await transaction(slug,async(c,w)=>({p:await auth(c,w,req),w}),true);const bytes=await req.arrayBuffer();const b=new Uint8Array(bytes);if(bytes.byteLength>3500000||b[0]!==255||b[1]!==216||b[2]!==255)fail(400,'image','Choose a JPEG image smaller than 3.5 MB.');const key=`${identity.w.id}/${randomUUID()}.jpg`;await getStore({name:'jootsy-images',consistency:'strong'}).set(key,bytes,{metadata:{player_id:identity.p.id,world_id:identity.w.id}});return json({url:`${url.origin}/media/${key}`},201);
  }
  return json(await transaction(slug,async(c,w)=>{
   const p=await auth(c,w,req);let b={};if(['POST','PATCH'].includes(method)&&req.headers.get('content-type')?.includes('json'))b=await req.json();
   const rev=await bump(c,w);await c.query('UPDATE players SET last_seen_at=now(),rev=$2 WHERE id=$1',[p.id,rev]);
   if(route[0]==='paths'&&route[2]==='claim'){
    const a=await path(c,w,route[1]);
    if(method==='POST'){claimable(a,p);return {path:(await c.query("UPDATE paths SET claimed_by=$2,claimed_until=now()+interval '10 minutes',rev=$3 WHERE id=$1 RETURNING *",[a.id,p.id,rev])).rows[0]};}
    if(method==='DELETE'){if(a.claimed_by===p.id)await c.query('UPDATE paths SET claimed_by=NULL,claimed_until=NULL,rev=$2 WHERE id=$1',[a.id,rev]);return {ok:true};}
   }
   if(route[0]==='plays'&&method==='POST'){
    if(!kinds.includes(b.type))fail(400,'type','Choose a face-up card from your hand.');
    const body=text(b.body,600,'Fragment');const labels=b.paths??[];if(!Array.isArray(labels))fail(400,'paths','Name the paths on your card.');
    const [min,max]=({fork:[2,4],destiny:[1,1],dream:[1,4],wormhole:[0,0],dead_end:[0,0]})[b.type];if(labels.length<min||labels.length>max)fail(400,'paths',`This card needs ${min===max?min:`${min}–${max}`} paths.`);labels.forEach(l=>text(l,60,'Path name'));
    let a,parent;
    if(b.path_id&&b.new_path)fail(400,'path','Choose one path.');
    if(b.new_path){parent=await card(c,w,b.new_path.from_card_id);if(parent.type!=='scenario'){own(parent,p);if(!['fork','dream'].includes(parent.type))fail(403,'forbidden','This card cannot offer another path.');if((await pathsOf(c,parent.id)).length>=6)fail(400,'paths','A card can offer at most six paths.');}a=await addPath(c,w,parent,b.new_path.label,p,rev);}
    else {a=await path(c,w,b.path_id);parent=await card(c,w,a.from_card_id);}
    claimable(a,p);
    let doorLabel=null,target=null;
    if(b.type==='wormhole'){doorLabel=text(b.door?.label,60,'Door name');target=await card(c,w,b.door?.to_card_id);if(target.author_id!==p.id)fail(403,'target','A wormhole must lead to one of your own cards.');}
    else if(b.door)fail(400,'door','Only a wormhole has a door.');
    const m=media(b);const aCard=(await c.query('INSERT INTO cards(world_id,type,author_id,body,media_kind,media_url,parent_path_id,depth,door_label,target_card_id,rev) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',[w.id,b.type,p.id,body,m.kind,m.url,a.id,parent.depth+1,doorLabel,target?.id||null,rev])).rows[0];
    await c.query('UPDATE paths SET to_card_id=$2,taken_at=now(),claimed_by=NULL,claimed_until=NULL,rev=$3 WHERE id=$1',[a.id,aCard.id,rev]);for(const l of labels)await addPath(c,w,aCard,l,p,rev);
    await event(c,w,'card_played',p,aCard.id,a.id);if(parent.author_id&&parent.author_id!==p.id)await event(c,w,'path_taken',p,aCard.id,a.id,parent.author_id);return {card:aCard,rev:Number(rev)};
   }
   if(route[0]==='scenarios'){
    instructor(p);
    if(method==='POST'){const title=text(b.title,60,'Scenario name'),body=text(b.body,600,'Opening text');if(b.paths&&!Array.isArray(b.paths))fail(400,'paths','Enter a list of starting paths.');const a=(await c.query("INSERT INTO cards(world_id,type,scenario_title,body,depth,rev) VALUES($1,'scenario',$2,$3,0,$4) RETURNING *",[w.id,title,body,rev])).rows[0];for(const l of b.paths||[])await addPath(c,w,a,l,p,rev);return {card:a};}
    const a=await card(c,w,route[1]);if(a.type!=='scenario')fail(400,'scenario','Choose a scenario.');
    if(method==='PATCH'){const title=text(b.title??a.scenario_title,60,'Scenario name'),body=text(b.body??a.body,600,'Opening text');return {card:(await c.query('UPDATE cards SET scenario_title=$2,body=$3,rev=$4,updated_at=now() WHERE id=$1 RETURNING *',[a.id,title,body,rev])).rows[0]};}
    if(method==='DELETE'){if((await pathsOf(c,a.id)).some(x=>x.to_card_id))fail(409,'written','This scenario already has a story growing from it.');await removeCard(c,w,a,rev);return {ok:true};}
   }
   if(route[0]==='cards'){
    const a=await card(c,w,route[1]);
    if(route[2]==='hide'&&method==='POST'){instructor(p);if(typeof b.value!=='boolean')fail(400,'hidden','Choose hide or unhide.');await c.query('UPDATE cards SET hidden=$2,rev=$3,updated_at=now() WHERE id=$1',[a.id,b.value,rev]);await event(c,w,'card_hidden',p,a.id,null,a.author_id);return {ok:true};}
    own(a,p);
    if(route[2]==='paths'&&method==='POST'){if(!['fork','dream'].includes(a.type))fail(403,'forbidden','Only Fork and Dream can add a path.');if((await pathsOf(c,a.id)).length>=6)fail(400,'paths','A card can offer at most six paths.');return {path:await addPath(c,w,a,b.label,p,rev)};}
    if(method==='PATCH'){const body=text(b.body??a.body,600,'Fragment');const m=media({media_kind:b.media_kind===undefined?a.media_kind:b.media_kind,media_url:b.media_url===undefined?a.media_url:b.media_url});const dl=b.door_label===undefined?a.door_label:text(b.door_label,60,'Door name');if(b.door_label!==undefined&&a.type!=='wormhole')fail(400,'door','This card has no door.');return {card:(await c.query('UPDATE cards SET body=$2,media_kind=$3,media_url=$4,door_label=$5,rev=$6,updated_at=now() WHERE id=$1 RETURNING *',[a.id,body,m.kind,m.url,dl,rev])).rows[0]};}
    if(method==='DELETE'){if((await pathsOf(c,a.id)).some(x=>x.to_card_id))fail(409,'written','Someone has written on a path from this card, so it cannot be deleted.');await removeCard(c,w,a,rev);return {ok:true};}
   }
   if(route[0]==='paths'&&['PATCH','DELETE'].includes(method)){
    const a=await path(c,w,route[1]),parent=await card(c,w,a.from_card_id);own(parent,p);if(a.to_card_id)fail(409,'written','A written path cannot be changed.');if(a.claimed_by&&a.claimed_by!==p.id&&new Date(a.claimed_until)>new Date())fail(409,'claimed','Someone is writing on this path.');
    if(method==='PATCH')await c.query('UPDATE paths SET label=$2,rev=$3 WHERE id=$1',[a.id,text(b.label,60,'Path name'),rev]);
    else {const min=parent.type==='fork'?2:1;if((await pathsOf(c,parent.id)).length<=min)fail(400,'paths',`This card must keep at least ${min} paths.`);await c.query('UPDATE paths SET deleted=true,claimed_by=NULL,claimed_until=NULL,rev=$2 WHERE id=$1',[a.id,rev]);}return {ok:true};
   }
   if(route[0]==='settings'&&method==='PATCH'){instructor(p);for(const key of ['jootsy_ring','jootsy_min_cards','end_ring'])if(b[key]!==undefined&&(!Number.isInteger(b[key])||b[key]<1||b[key]>100))fail(400,'settings','Ring and card thresholds must be whole numbers from 1 to 100.');if(b.jootsy_enabled!==undefined&&typeof b.jootsy_enabled!=='boolean')fail(400,'settings','Choose on or off.');await c.query('UPDATE worlds SET jootsy_ring=$2,jootsy_min_cards=$3,end_ring=$4,jootsy_enabled=$5 WHERE id=$1',[w.id,b.jootsy_ring??w.jootsy_ring,b.jootsy_min_cards??w.jootsy_min_cards,b.end_ring??w.end_ring,b.jootsy_enabled??w.jootsy_enabled]);return {ok:true};}
   if(route[0]==='players'&&route[2]==='reset-passcode'&&method==='POST'){instructor(p);const target=(await c.query('SELECT * FROM players WHERE id=$1 AND world_id=$2',[requireId(route[1]),w.id])).rows[0];if(!target)fail(404,'player','This player does not exist.');if(target.is_instructor)fail(400,'instructor','Change the instructor passcode through the environment settings.');const passcode=randomBytes(6).toString('base64url');await c.query('UPDATE players SET pass_hash=$2,token_version=token_version+1,rev=$3 WHERE id=$1',[target.id,await hash(passcode),rev]);return {passcode};}
   fail(404,'route','This action does not exist.');
  }));
 }catch(e){if(e instanceof Fault)return json({error:e.error,message:e.message,...e.extra},e.status);if(e instanceof SyntaxError)return json({error:'invalid',message:'Please check the form and try again.'},400);console.error('Jootsy API error',e);return json({error:'server',message:'The table could not be reached. Your writing is still here; try again.'},500);}
}
export const config={path:['/api/w/*','/media/*']};
