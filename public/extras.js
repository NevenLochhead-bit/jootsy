const J=window.Jootsy,{S,e,btn,paths,cards,title,player,go,api,refresh,mine,toast}=J;
let panel=null;
const close=()=>{panel=null;J.closeModal();};
const show=(content,cls)=>{window.panelActive=true;J.modal(content,cls);};
const x=()=>btn('×',close,'close',{'aria-label':'Close'});
const seenKey=()=>`jootsy-seen:${S.world.slug}:${S.player.id}`;
const news=()=>[...S.events.values()].filter(a=>['card_cut','jootsy'].includes(a.type)&&a.target_player_id===S.player.id).sort((a,b)=>Number(b.rev)-Number(a.rev));
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
window.renderSound=c=>c.audio_url?e('audio',{class:'card-sound',src:c.audio_url,controls:true,preload:'metadata','aria-label':'Card sound'}):null;
window.composerMedia=(initial={},onChange=()=>{})=>{
 const state={media_kind:initial?.media_kind||null,media_url:initial?.media_url||null,audio_url:initial?.audio_url||null};let busy=0;
 const preview=e('div',{class:'media-preview'}),error=e('div',{class:'error',role:'alert'}),raw=()=>({...state});
 const paint=()=>{preview.replaceChildren();if(state.media_url)preview.append(window.renderMedia(state),btn(state.media_kind==='image'?'Remove image':'Remove media',()=>{state.media_url=null;state.media_kind=null;paint();onChange();},'small-button'));if(state.audio_url)preview.append(window.renderSound(state),btn('Remove sound',()=>{state.audio_url=null;paint();onChange();},'small-button'));};
 const image=e('input',{type:'file',accept:'image/*',hidden:true,'aria-label':'Choose image',onchange:async()=>{const file=image.files?.[0];if(!file)return;busy++;error.textContent='Preparing image…';try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));if(!blob)throw Error('This image could not be prepared.');if(blob.size>1_500_000)throw Error('Image is over 1.5 MB after resizing. Choose a smaller image.');error.textContent='Uploading image…';const result=await J.uploadImage(blob);state.media_kind='image';state.media_url=result.url;error.textContent='';paint();onChange();}catch(err){error.textContent=err.message||'Choose a different image.';}finally{busy--;image.value='';}}});
 const sound=e('input',{type:'file',accept:'.mp3,.m4a,audio/mpeg,audio/mp4',hidden:true,'aria-label':'Choose sound',onchange:async()=>{const file=sound.files?.[0];if(!file)return;busy++;error.textContent='Uploading sound…';try{if(file.size>2_000_000)throw Error('Use an MP3 or M4A under 2 MB.');const result=await J.uploadSound(file);state.audio_url=result.url;error.textContent='';paint();onChange();}catch(err){error.textContent=err.message||'Use an MP3 or M4A under 2 MB.';}finally{busy--;sound.value='';}}});
 const element=e('div',{class:'media-fields'},e('div',{class:'row'},btn('Add image',()=>image.click()),btn('Add sound',()=>sound.click())),image,sound,preview,error);paint();return {element,raw,value:()=>{if(busy)throw Error('Wait for the upload to finish, then commit.');return raw();}};
};
function errorBox(){return e('div',{class:'error',role:'alert'});}
window.cardTools=c=>{
 const row=e('div',{class:'tools'});
 if(c.draft)return row;
 if(c.author_id===S.player.id){if(!c.hidden||S.player.is_instructor)row.append(btn('Edit',()=>editCard(c)));if(!paths(c.id).some(p=>!['wormhole','jootsy'].includes(p.kind)))row.append(btn('Delete',()=>confirmDelete(c)));}
 if(S.player.is_instructor)row.append(btn(c.hidden?'Unhide':'Hide',async()=>{try{await api(`cards/${c.id}/hide`,'POST',{value:!c.hidden});await refresh();toast(c.hidden?'Card is visible again.':'Card hidden.');}catch(err){toast(err.message);}}));
 for(const p of paths(c.id).filter(p=>!p.draft&&['wormhole','jootsy'].includes(p.kind)&&p.created_by===S.player.id))row.append(btn(`Discard ${J.T[p.kind][1]}`,async()=>{try{await api(`paths/${p.id}`,'DELETE');await refresh();}catch(err){toast(err.message);}}));
 return row;
};
function editCard(c){panel=null;const body=e('textarea',{maxlength:600,required:true,'aria-label':'Narrative Fragment'},c.body),attachment=window.composerMedia(c),name=e('input',{value:title(c),maxlength:60,'aria-label':'Choice',required:true}),error=errorBox(),save=e('button',{type:'submit',class:'primary wide'},'Save card');show(e('form',{onsubmit:async ev=>{ev.preventDefault();save.disabled=true;try{await api(`cards/${c.id}`,'PATCH',{body:body.value,...attachment.value(),label:name.value});close();await refresh();}catch(err){error.textContent=err.message;}finally{save.disabled=false;}}},x(),e('h2',{},`Edit: ${title(c)}`),e('label',{},'Choice',name),e('label',{},'Narrative Fragment',body),attachment.element,save,error));}
function confirmDelete(c){panel=null;const error=errorBox();show([x(),e('h2',{},'Delete this card?'),e('p',{},'This leaf card and links pointing to it will be removed.'),btn('Delete card',async()=>{try{const parent=S.paths.get(c.parent_path_id)?.from_card_id;await api(`cards/${c.id}`,'DELETE');close();await refresh();go(parent);}catch(err){error.textContent=err.message;}},'primary wide'),btn('Keep card',close,'wide'),error]);}
window.openMe=()=>{
 panel='me';const own=mine(),items=news(),muted=e('input',{type:'checkbox',checked:localStorage.getItem('jootsy-muted')==='true','aria-label':'Mute commit sound',onchange:ev=>localStorage.setItem('jootsy-muted',String(ev.target.checked))}),jootsies=[...S.paths.values()].filter(p=>!p.deleted&&!p.draft&&p.kind==='jootsy'&&p.created_by===S.player.id).length;localStorage.setItem(seenKey(),String(S.rev));
 show([x(),e('h2',{},S.player.name),e('p',{},`${own.length} of ${S.world.jootsy_min_cards} cards played · ${jootsies} Jootsies`),e('progress',{max:S.world.jootsy_min_cards,value:Math.min(S.world.jootsy_min_cards,own.length),'aria-label':'Progress to Jootsy!'}),e('p',{class:'muted'},(S.player.is_instructor||own.length>=S.world.jootsy_min_cards)?'Jootsy! is ready. Keep playing.':'Keep playing to unlock Jootsy!'),e('label',{class:'check-label'},muted,'Mute commit sound'),S.editSession?btn('Resume session',()=>{panel=null;J.showEditor();},'primary wide'):null,e('h3',{},'News'),items.length?e('div',{class:'scroll-list'},items.map(a=>btn(a.type==='jootsy'?`🎆 Jootsy! ${player(a.actor_id)} jumped into your timeline.`:`${player(a.actor_id)} continued from your card ${title(S.cards.get(a.card_id))}`,()=>{close();go(a.type==='jootsy'?S.paths.get(a.path_id)?.to_card_id:a.card_id);}))) :e('p',{class:'muted'},'When someone continues from your card or Jootsies into your timeline, it appears here.'),btn('Log out',J.signOut,'wide')]);
};
function relativeTime(value){const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(value))/60000));return minutes<1?'just now':minutes<60?`${minutes}m ago`:`${Math.floor(minutes/60)}h ago`;}
window.openInstructor=()=>{
 panel='instructor';const all=cards(),players=[...S.players.values()].sort((a,b)=>a.name.localeCompare(b.name)),error=errorBox();
 const settings={};for(const [key,label]of [['jootsy_min_cards','Cards before Jootsy']])settings[key]=e('input',{type:'number',min:1,max:100,required:true,value:S.world[key],'aria-label':label});
 const enabled=e('input',{type:'checkbox',checked:S.world.jootsy_enabled,'aria-label':'Jootsy enabled'}),save=e('button',{type:'submit',class:'primary wide'},'Save settings');
 const form=e('form',{onsubmit:async ev=>{ev.preventDefault();save.disabled=true;try{await api('settings','PATCH',{...Object.fromEntries(Object.entries(settings).map(([k,n])=>[k,Number(n.value)])),jootsy_enabled:enabled.checked});await refresh();toast('Settings saved.');}catch(err){error.textContent=err.message;}finally{save.disabled=false;}}},e('label',{},'Cards before Jootsy',settings.jootsy_min_cards),e('label',{class:'check-label'},enabled,'Jootsy enabled'),e('p',{class:'muted'},'Jootsy! links committed cards across players’ timelines.'),save,error);
 const table=e('table',{},e('thead',{},e('tr',{},['Player','Cards','Last active','Passcode'].map(t=>e('th',{},t)))),e('tbody',{},players.map(p=>{const own=all.filter(c=>c.author_id===p.id),far=own.sort((a,b)=>b.depth-a.depth)[0];return e('tr',{},e('td',{},btn(p.name,()=>{close();window.openMap(far?.id,{player:p.id});},'small-button')),e('td',{},`${own.length}${own.length>=5?' ✓':''}`),e('td',{},relativeTime(p.last_seen_at)),e('td',{},!p.is_instructor?btn('Reset',()=>resetPasscode(p),'small-button'):null));})));
 show([x(),e('h2',{},'Instructor'),e('h3',{},'Scenarios'),btn('＋ New scenario',()=>{panel=null;J.scenarioForm();},'primary'),e('div',{class:'scroll-list scenario-admin'},all.filter(c=>c.type==='scenario').map(c=>btn(title(c),()=>{panel=null;J.scenarioForm(c);}))),e('h3',{},'Players'),e('p',{class:'muted'},'Choose a name to see their timeline. Last active records login and card actions.'),e('div',{class:'table-wrap'},table),e('h3',{},'Settings'),form]);
};
function resetPasscode(p){panel=null;const error=errorBox();show([x(),e('h2',{},`Reset ${p.name}'s passcode?`),e('p',{},'This replaces their passcode and signs out their existing devices.'),btn('Reset passcode',async()=>{try{const data=await api(`players/${p.id}/reset-passcode`,'POST',{});show([x(),e('h2',{},`New passcode for ${p.name}`),e('p',{class:'passcode'},data.passcode),btn('Copy',async()=>{try{await navigator.clipboard.writeText(data.passcode);toast('Passcode copied.');}catch{toast('Select the passcode above to copy it.');}}),e('p',{class:'muted'},'Give this passcode to the player so they can log in again.')]);await refresh();}catch(err){error.textContent=err.message;}},'primary wide'),error]);}
window.extrasStateChanged=()=>{if(window.panelActive&&panel==='me')window.openMe();};
if(S.world)J.render();
