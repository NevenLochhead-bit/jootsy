const J=window.Jootsy,{S,e,btn,paths,cards,title,player,go,api,refresh,mine,toast}=J;
let panel=null;
const close=()=>{panel=null;J.closeModal();};
const x=()=>btn('×',close,'close',{'aria-label':'Close'});
const seenKey=()=>`jootsy-seen:${S.world.slug}:${S.player.id}`;
const news=()=>[...S.events.values()].filter(a=>a.type==='path_taken'&&a.target_player_id===S.player.id).sort((a,b)=>Number(b.rev)-Number(a.rev));
window.meBadge=()=>{const seen=Number(localStorage.getItem(seenKey())||0),n=news().filter(a=>Number(a.rev)>seen).length;return n?e('span',{class:'news-badge'},n):null;};
window.backStyle=name=>{let h=2166136261;for(const c of name.toLowerCase()){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}const patterns=[
 'repeating-linear-gradient(45deg,#ffffff20 0 2px,transparent 2px 12px)',
 'radial-gradient(circle,#ffffff33 1px,transparent 2px)',
 'repeating-linear-gradient(0deg,#ffffff22 0 1px,transparent 1px 10px)',
 'repeating-linear-gradient(90deg,#ffffff22 0 2px,transparent 2px 13px)',
 'repeating-linear-gradient(45deg,#ffffff18 0 1px,transparent 1px 10px),repeating-linear-gradient(-45deg,#ffffff18 0 1px,transparent 1px 10px)',
 'repeating-radial-gradient(circle at 50% 50%,transparent 0 6px,#ffffff18 7px 8px)',
 'linear-gradient(30deg,#ffffff14 25%,transparent 25% 75%,#ffffff14 75%)',
 'repeating-linear-gradient(135deg,#ffffff25 0 5px,transparent 5px 16px)'
 ];return `--back-hue:${h%360};--back-pattern:${patterns[(h>>>8)%8]};--back-size:${(h>>>8)%8===1?'12px 12px':(h>>>8)%8===6?'25px 25px':'auto'}`;};
window.renderMedia=c=>{
 if(!c.media_url)return null;let u;try{u=new URL(c.media_url);}catch{return null;}if(u.protocol!=='https:')return null;
 const host=u.hostname.replace(/^www\./,''),pathname=u.pathname.toLowerCase();
 if(c.media_kind==='image'||/\.(jpe?g|png|gif|webp|avif)$/.test(pathname))return e('img',{class:'card-media',src:u.href,alt:'Image on this card',loading:'lazy'});
 if(/\.(mp3|wav|ogg|m4a|flac)$/.test(pathname))return e('audio',{class:'card-media',src:u.href,controls:true,preload:'metadata'});
 if(/\.(mp4|webm|mov|m4v)$/.test(pathname))return e('video',{class:'card-media',src:u.href,controls:true,playsinline:true,preload:'metadata'});
 let embed;if(['youtube.com','m.youtube.com','youtu.be'].includes(host)){const id=host==='youtu.be'?u.pathname.slice(1).split('/')[0]:u.searchParams.get('v')||u.pathname.split('/').filter(Boolean)[1];if(/^[\w-]{11}$/.test(id||''))embed=`https://www.youtube-nocookie.com/embed/${id}`;}
 else if(['vimeo.com','player.vimeo.com'].includes(host)){const id=u.pathname.split('/').filter(Boolean).findLast(p=>/^\d+$/.test(p));if(id)embed=`https://player.vimeo.com/video/${id}`;}
 else if(host==='soundcloud.com'||host==='m.soundcloud.com')embed=`https://w.soundcloud.com/player/?url=${encodeURIComponent(u.href)}&auto_play=false`;
 if(embed)return e('iframe',{class:'card-media embed',src:embed,title:'Media on this card',loading:'lazy',allow:'encrypted-media; fullscreen; picture-in-picture',allowfullscreen:true,referrerpolicy:'strict-origin-when-cross-origin'});
 return e('a',{class:'media-link',href:u.href,target:'_blank',rel:'noopener noreferrer'},u.hostname+' ↗');
};
window.composerMedia=(initial={},onChange=()=>{})=>{
 const state={media_kind:initial?.media_kind||null,media_url:initial?.media_url||null};let busy=false;
 const preview=e('div',{class:'media-preview'}),error=e('div',{class:'error'}),link=e('input',{type:'url',placeholder:'https://…','aria-label':'Media link'}),linkRow=e('div',{class:'link-row',hidden:true});
 const raw=()=>({...state});
 const paint=()=>{preview.replaceChildren();if(state.media_url){preview.append(window.renderMedia(state),btn('Remove media',()=>{state.media_url=null;state.media_kind=null;paint();onChange();},'small-button'));}};
 const choose=e('input',{type:'file',accept:'image/*',hidden:true,'aria-label':'Choose image',onchange:async()=>{
  const file=choose.files?.[0];if(!file)return;busy=true;error.textContent='Preparing image…';
  try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));if(!blob)throw Error('This image could not be prepared.');error.textContent='Uploading image…';const result=await J.uploadImage(blob);state.media_kind='image';state.media_url=result.url;error.textContent='';paint();onChange();}
  catch(err){error.textContent=err.message||'Choose a different image.';}finally{busy=false;choose.value='';}
 }});
 linkRow.append(link,btn('Use link',()=>{try{const u=new URL(link.value);if(u.protocol!=='https:')throw 0;state.media_kind='embed';state.media_url=u.href;linkRow.hidden=true;error.textContent='';paint();onChange();}catch{error.textContent='Paste a complete https link.';}}));
 const element=e('div',{class:'media-fields'},e('div',{class:'row'},btn('Add image',()=>choose.click()),btn('Paste a link',()=>{linkRow.hidden=!linkRow.hidden;if(!linkRow.hidden)link.focus();})),choose,linkRow,preview,error);paint();
 return {element,raw,value:()=>{if(busy)throw Error('Wait for the image to finish uploading, then play your card.');return raw();}};
};
function errorBox(){return e('div',{class:'error',role:'alert'});}
function labelDialog(heading,value,submit){panel=null;const field=e('input',{value,maxlength:60,required:true,'aria-label':'Path name'}),error=errorBox(),save=e('button',{type:'submit',class:'primary wide'},'Save');J.modal(e('form',{onsubmit:async ev=>{ev.preventDefault();save.disabled=true;try{await submit(field.value);close();await refresh();}catch(err){error.textContent=err.message;}finally{save.disabled=false;}}},x(),e('h2',{},heading),e('label',{},'Path name',field),save,error));field.focus();}
window.pathSlot=(p,tile)=>{
 const wrap=e('div',{class:'path-slot'},tile),parent=S.cards.get(p.from_card_id);
 if(!p.to_card_id&&parent?.author_id===S.player.id){const min=parent.type==='fork'?2:1;wrap.append(e('div',{class:'path-tools'},btn('Rename',()=>labelDialog('Rename this path',p.label,label=>api(`paths/${p.id}`,'PATCH',{label})),'small-button',{disabled:J.claimed(p)}),paths(parent.id).length>min?btn('Remove',async()=>{try{await api(`paths/${p.id}`,'DELETE');await refresh();}catch(err){toast(err.message);}},'small-button',{disabled:J.claimed(p)}):null));}
 return wrap;
};
window.cardTools=c=>{
 const row=e('div',{class:'tools'});
 if(c.author_id===S.player.id){if(!c.hidden||S.player.is_instructor)row.append(btn('Edit',()=>editCard(c)));if(!paths(c.id).some(p=>p.to_card_id))row.append(btn('Delete',()=>confirmDelete(c)));if(['fork','dream'].includes(c.type)&&paths(c.id).length<6)row.append(btn('＋ Deal a path',()=>labelDialog('Deal a face-down path','',label=>api(`cards/${c.id}/paths`,'POST',{label}))));}
 if(S.player.is_instructor)row.append(btn(c.hidden?'Unhide':'Hide',async()=>{try{await api(`cards/${c.id}/hide`,'POST',{value:!c.hidden});await refresh();toast(c.hidden?'Card is visible again.':'Card hidden. Its paths remain open.');}catch(err){toast(err.message);}}));
 return row;
};
function editCard(c){panel=null;const body=e('textarea',{maxlength:600,required:true,'aria-label':'Fragment'},c.body),attachment=window.composerMedia(c),door=e('input',{value:c.door_label||'',maxlength:60,'aria-label':'Door name',required:c.type==='wormhole'}),error=errorBox(),save=e('button',{type:'submit',class:'primary wide'},'Save card');J.modal(e('form',{onsubmit:async ev=>{ev.preventDefault();save.disabled=true;try{await api(`cards/${c.id}`,'PATCH',{body:body.value,...attachment.value(),...(c.type==='wormhole'?{door_label:door.value}:{})});close();await refresh();}catch(err){error.textContent=err.message;}finally{save.disabled=false;}}},x(),e('h2',{},`Edit: ${title(c)}`),e('label',{},'Fragment',body),attachment.element,c.type==='wormhole'?e('label',{},'Door name',door):null,save,error));}
function confirmDelete(c){panel=null;const error=errorBox();J.modal([x(),e('h2',{},'Delete this card?'),e('p',{},'The path you played on becomes face-down again. Doors pointing to this card are removed too.'),btn('Delete card',async()=>{try{const parent=S.paths.get(c.parent_path_id)?.from_card_id;await api(`cards/${c.id}`,'DELETE');close();await refresh();go(parent);}catch(err){error.textContent=err.message;}},'primary wide'),btn('Keep card',close,'wide'),error]);}
window.openMe=()=>{
 panel='me';const own=mine(),far=Math.max(0,...own.map(c=>c.depth)),available=[...S.paths.values()].filter(p=>!p.deleted&&!p.to_card_id&&S.cards.get(p.from_card_id)?.author_id===S.player.id),items=news();localStorage.setItem(seenKey(),String(S.rev));
 const progress=Math.min(1,far/S.world.jootsy_ring,own.length/S.world.jootsy_min_cards);
 J.modal([x(),e('h2',{},S.player.name),e('p',{},`${own.length} cards played · furthest ring ${far}`),e('progress',{max:1,value:progress,'aria-label':'Progress to the Jootsy Perimeter'}),e('p',{class:'muted'},`Jootsy! Perimeter: ring ${S.world.jootsy_ring} · ${own.length} of ${S.world.jootsy_min_cards} cards`),e('h3',{},'Face-down on my cards'),available.length?e('div',{class:'scroll-list'},available.map(p=>btn([e('strong',{},p.label),e('small',{},`From ${title(S.cards.get(p.from_card_id))}${J.claimed(p)?` · ${player(p.claimed_by)} is writing…`:''}`)],()=>{close();go(p.from_card_id);J.startComposer('fork',{path_id:p.id});},'',{disabled:J.claimed(p)}))):e('p',{class:'muted'},'Play a Fork or Dream to deal new face-down cards.'),e('h3',{},'News'),items.length?e('div',{class:'scroll-list'},items.map(a=>btn(`${player(a.actor_id)} played on your path '${S.paths.get(a.path_id)?.label||'a path'}'`,()=>{close();go(a.card_id);}))) :e('p',{class:'muted'},'When someone plays on your paths, their card appears here.'),btn('Log out',()=>{close();const logout=()=>{localStorage.removeItem(`jootsy:${S.world.slug}`);location.reload();};logout();},'wide')]);J.render();
};
function relativeTime(value){const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(value))/60000));return minutes<1?'just now':minutes<60?`${minutes}m ago`:`${Math.floor(minutes/60)}h ago`;}
window.openInstructor=()=>{
 panel='instructor';const all=cards(),players=[...S.players.values()].sort((a,b)=>a.name.localeCompare(b.name)),error=errorBox();
 const settings={};for(const [key,label]of [['jootsy_ring','Jootsy ring'],['jootsy_min_cards','Cards before Jootsy'],['end_ring','End of Game ring']])settings[key]=e('input',{type:'number',min:1,max:100,required:true,value:S.world[key],'aria-label':label});
 const enabled=e('input',{type:'checkbox',checked:S.world.jootsy_enabled,'aria-label':'Jootsy enabled'}),save=e('button',{type:'submit',class:'primary wide'},'Save settings');
 const form=e('form',{onsubmit:async ev=>{ev.preventDefault();save.disabled=true;try{await api('settings','PATCH',{...Object.fromEntries(Object.entries(settings).map(([k,n])=>[k,Number(n.value)])),jootsy_enabled:enabled.checked});await refresh();toast('Settings saved.');}catch(err){error.textContent=err.message;}finally{save.disabled=false;}}},e('label',{},'Jootsy ring',settings.jootsy_ring),e('label',{},'Cards before Jootsy',settings.jootsy_min_cards),e('label',{},'End of Game ring',settings.end_ring),e('label',{class:'check-label'},enabled,'Jootsy enabled'),e('p',{class:'muted'},'The Jootsy! card stays face-down in Tuesday’s game.'),save,error);
 const table=e('table',{},e('thead',{},e('tr',{},['Player','Cards','Ring','Last active','Passcode'].map(t=>e('th',{},t)))),e('tbody',{},players.map(p=>{const own=all.filter(c=>c.author_id===p.id),far=own.sort((a,b)=>b.depth-a.depth)[0];return e('tr',{},e('td',{},btn(p.name,()=>{close();window.openMap(far?.id,{player:p.id});},'small-button')),e('td',{},own.length),e('td',{},far?.depth||0),e('td',{},relativeTime(p.last_seen_at)),e('td',{},!p.is_instructor?btn('Reset',()=>resetPasscode(p),'small-button'):null));})));
 J.modal([x(),e('h2',{},'Instructor'),e('h3',{},'Scenarios'),btn('＋ New scenario',()=>{panel=null;J.scenarioForm();},'primary'),e('div',{class:'scroll-list scenario-admin'},all.filter(c=>c.type==='scenario').map(c=>btn(title(c),()=>{panel=null;J.scenarioForm(c);}))),e('h3',{},'Players'),e('p',{class:'muted'},'Choose a name to see their timeline. Last active records login and card actions.'),e('div',{class:'table-wrap'},table),e('h3',{},'Settings'),form]);
};
function resetPasscode(p){panel=null;const error=errorBox();J.modal([x(),e('h2',{},`Reset ${p.name}'s passcode?`),e('p',{},'This replaces their passcode and signs out their existing devices.'),btn('Reset passcode',async()=>{try{const data=await api(`players/${p.id}/reset-passcode`,'POST',{});J.modal([x(),e('h2',{},`New passcode for ${p.name}`),e('p',{class:'passcode'},data.passcode),e('p',{class:'muted'},'Give this passcode to the player so they can log in again.')]);await refresh();}catch(err){error.textContent=err.message;}},'primary wide'),error]);}
window.extrasStateChanged=()=>{if(panel==='me')window.openMe();};
if(S.world)J.render();
