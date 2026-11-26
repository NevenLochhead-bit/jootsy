import {installSoloMedia} from './media.js';

const app = document.querySelector('#app'), overlay = document.querySelector('#overlay');
const S = {cards: new Map(), paths: new Map(), players: new Map(), events: new Map(), rev: 0, world: null, player: null, editSession: null};
const T = {scenario: ['◇', 'Scenario'], destiny: ['🔮', 'Destiny'], fork: ['🔀', 'Fork'], dream: ['✨', 'Dream'], wormhole: ['⚫', 'Wormhole'], jootsy: ['🎆', 'Jootsy!']};
const order = ['destiny', 'fork', 'dream', 'wormhole', 'jootsy'];
const definitions = {destiny: 'One way forward', fork: 'Two paths forward', dream: 'Anything can happen', wormhole: 'Return to a previous card', jootsy: 'Jump to another branch'};
let account = null, project = null, mode = 'projects', selectedCard = null, mutations = Promise.resolve(), refreshing = null, noticeTimer;

const e = (tag, attributes = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'value') node.value = value;
    else if (key.startsWith('aria-')) node.setAttribute(key, String(value));
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) if (child !== null && child !== undefined) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
};
const btn = (label, action, className = '', extra = {}) => e('button', {type: 'button', class: className, onclick: action, ...extra}, label);
const alive = card => card && !card.deleted;
const allCards = () => [...S.cards.values()].filter(alive).sort((a, b) => Number(a.seq) - Number(b.seq));
const cards = () => allCards().filter(card => !card.draft);
const mine = () => cards().filter(card => card.type !== 'scenario');
const paths = id => [...S.paths.values()].filter(path => !path.deleted && path.from_card_id === id).sort((a, b) => a.position - b.position);
const title = card => card?.type === 'scenario' ? card.scenario_title : S.paths.get(card?.parent_path_id)?.label || 'Card';
const cardKind = card => card?.type === 'scenario' ? 'scenario' : S.paths.get(card?.parent_path_id)?.kind || 'destiny';
const suit = kind => `--suit:var(--${kind || 'scenario'})`;
const closeModal = () => {window.panelActive = false; overlay.replaceChildren();};
const modal = (content, className = '') => {
  window.panelActive = true;
  overlay.replaceChildren(e('div', {class: 'modal-shade'}, e('section', {class: `modal ${className}`, role: 'dialog', 'aria-modal': true}, content)));
};
const toast = message => {
  const notice = document.querySelector('#notice');
  notice.textContent = message; notice.style.display = 'block';
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => {notice.style.display = 'none';}, 6500);
};
async function request(route, method = 'GET', body, headers = {}) {
  const response = await fetch(`/api/solo/${route}`, {method, credentials: 'same-origin',
    headers: {...(body === undefined ? {} : {'content-type': 'application/json'}), ...headers},
    body: body === undefined ? undefined : JSON.stringify(body)});
  let data;
  try {data = await response.json();} catch {throw Error('Jootsy Solo could not be reached. Keep this window open and try again.');}
  if (!response.ok) throw Object.assign(Error(data.message || 'Please try again.'), data, {status: response.status});
  return data;
}
function mergeState(state) {
  if (project?.id === state.project.id && Number(state.rev) < S.rev) return;
  project = state.project;
  for (const key of ['cards', 'paths', 'players', 'events']) {
    S[key].clear();
    for (const value of state[key]) S[key].set(value.id, value);
  }
  S.world = state.world; S.player = state.player; S.editSession = state.edit_session; S.rev = state.rev;
  const saved = document.querySelector('#solo-save-state');
  if (saved) saved.textContent = `Saved ${new Date(project.updated_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
}
async function api(route, method = 'GET', body) {
  if (!project) throw Error('Open a project first.');
  const id = project.id;
  const perform = async () => {
    const result = await request(`projects/${id}/${route}`, method, body, method === 'GET' ? {} : {'if-match': String(S.rev)});
    if (result.state && project?.id === id) mergeState(result.state);
    return result;
  };
  if (method === 'GET') return perform();
  const task = mutations.then(perform);
  mutations = task.catch(() => {});
  return task;
}
async function refresh() {
  if (!project) return;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      await mutations;
      const prior = S.rev;
      await api('state');
      if (!window.editorActive) {
        if (mode === 'play') window.immersiveStateChanged?.();
        else if (mode === 'board') window.mapStateChanged?.({cards: cards(), paths: [...S.paths.values()]});
        else if (prior !== S.rev) render();
      }
    } finally {refreshing = null;}
  })();
  return refreshing;
}
async function upload(file, kind) {
  const id = project?.id;
  if (!id) throw Error('Open a project first.');
  const query = new URLSearchParams({kind, name: file.name || `file.${kind === 'image' ? 'jpg' : kind}`});
  const response = await fetch(`/api/solo/projects/${id}/assets?${query}`, {method: 'POST', credentials: 'same-origin',
    headers: {'content-type': 'application/octet-stream'}, body: file});
  const result = await response.json();
  if (!response.ok) throw Error(result.message || 'The file could not be saved.');
  return result;
}
function face(card, options = {}) {
  return e('article', {class: `playing-card ${cardKind(card)}`, style: suit(cardKind(card))},
    e('span', {class: 'suit', 'aria-hidden': true}, T[cardKind(card)][0]), e('h2', {}, title(card)),
    window.renderMedia?.(card), window.renderVideo?.(card), window.renderSound?.(card), window.renderModel?.(card),
    e('p', {class: 'fragment'}, card.body), options.children,
    e('span', {class: 'suit bottom', 'aria-hidden': true}, T[cardKind(card)][0]));
}
function transitionButtons(card, choose, stage = 1) {
  if (stage >= 3) return null;
  return e('aside', {class: 'transition-buttons'}, e('h3', {}, 'What happens next?'), order.map(kind => {
    const disabled = !card || (LINK_KINDS.includes(kind) && !cards().some(candidate => candidate.id !== card.id));
    return e('span', {class: 'transition-choice'}, btn(`${T[kind][0]} ${T[kind][1]}`, () => choose?.(kind), `cut-option ${kind}`,
      {style: suit(kind), disabled, title: card ? definitions[kind] : 'Write this card first.'}),
      e('small', {class: 'transition-help'}, definitions[kind]));
  }));
}
const LINK_KINDS = ['wormhole', 'jootsy'];
async function leaveCurrent() {
  await window.flushEditor?.();
  if (window.editorActive) window.leaveEditor();
  await mutations;
  window.closeBoard?.(); window.closeImmersive?.(); closeModal();
}
async function selectMode(next, cardId) {
  try {
    await leaveCurrent();
    mode = next; selectedCard = cardId || selectedCard;
    if (project) history.replaceState(null, '', `/solo/#project=${project.id}${selectedCard ? `&card=${selectedCard}` : ''}`);
    render();
    return true;
  } catch (error) {
    if (error.revision_conflict) modal([e('h2', {}, 'This project changed in another window'), e('p', {}, 'Your current writing is kept in this browser. Reload to review the saved project and recovered local changes.'),
      btn('Reload saved project', () => location.reload(), 'primary wide'), btn('Keep this window', closeModal, 'wide')]);
    else toast(error.message);
    return false;
  }
}
const go = id => selectMode('board', id).then(opened => {if (opened) openReader(id);});
function openReader(id) {
  const card = S.cards.get(id);
  if (!alive(card) || card.draft) return;
  selectedCard = id;
  window.centreBoard?.(id);
  const choices = paths(id).filter(path => !path.draft && path.to_card_id && alive(S.cards.get(path.to_card_id)));
  modal([e('div', {class: 'reader-bar'}, btn('Close', closeModal), btn('Play from here', () => selectMode('play', id))),
    e('div', {class: 'reader-content'}, face(card, {children: choices.length ? e('section', {class: 'choices-section'}, e('h3', {}, 'Choices'),
      choices.map(path => btn(path.label, () => openReader(path.to_card_id), `option-link ${path.kind}`, {style: suit(path.kind)}))) : null}),
      transitionButtons(card, kind => window.beginSession(card, kind))), cardTools(card)], 'board-reader');
}
function cardTools(card) {
  return e('div', {class: 'tools'}, btn('Edit', () => editCard(card)),
    !paths(card.id).some(path => ['destiny', 'fork', 'dream'].includes(path.kind)) ? btn('Delete', () => {
      modal([e('h2', {}, 'Delete this card?'), e('p', {}, 'This removes the leaf card from this project.'), btn('Delete card', async () => {
        try {await api(`cards/${card.id}`, 'DELETE'); closeModal(); selectedCard = null; render();} catch (error) {toast(error.message);}
      }, 'primary wide'), btn('Keep card', closeModal, 'wide')]);
    }) : null);
}
function editCard(card = null) {
  const scenario = !card || card.type === 'scenario';
  const name = e('input', {value: card ? title(card) : '', maxlength: 60, required: true});
  const body = e('textarea', {maxlength: 600, required: true}, card?.body || '');
  const attachment = window.composerMedia(card || {}), error = e('p', {class: 'error', role: 'alert'});
  const save = e('button', {type: 'submit', class: 'primary wide'}, 'Save card');
  modal(e('form', {onsubmit: async event => {
    event.preventDefault(); save.disabled = true;
    try {
      await api(card ? `cards/${card.id}` : 'scenarios', card ? 'PATCH' : 'POST',
        {[scenario ? 'title' : 'label']: name.value, body: body.value, ...attachment.value()});
      closeModal(); render();
    } catch (err) {error.textContent = err.message;} finally {save.disabled = false;}
  }}, btn('×', closeModal, 'close', {'aria-label': 'Close'}), e('h2', {}, card ? 'Edit card' : 'Add scenario'),
    e('label', {}, scenario ? 'Scenario title' : 'Choice', name), e('label', {}, 'Narrative fragment', body), attachment.element, save, error));
}
function readerSidebar(J, open) {
  const element = e('aside', {class: 'playtest-chat solo-reader-sidebar'});
  return {element, setCard(current) {
    element.replaceChildren(e('h2', {}, project.title), e('p', {class: 'muted'}, 'Your cards'),
      e('div', {class: 'scroll-list'}, cards().map(card => btn(title(card), () => open(card.id), card.id === current.id ? 'active' : ''))));
  }, pause() {}, reset() {}, close() {element.remove();}};
}
const headerObserver = new ResizeObserver(entries => {
  for (const entry of entries) document.documentElement.style.setProperty('--header-height', `${entry.target.getBoundingClientRect().height}px`);
});
function header() {
  const node = e('header', {class: 'top solo-top'}, btn(e('span', {class: 'wordmark'}, 'JOOTSY!', e('small', {}, 'Solo')), () => selectMode('projects'), 'brand'),
    e('nav', {class: 'view-toggle', 'aria-label': 'Project views'}, btn('Projects', () => selectMode('projects'), mode === 'projects' ? 'active' : ''),
      ...['board', 'cards', 'play'].map(view => btn(view[0].toUpperCase() + view.slice(1), () => selectMode(view), mode === view ? 'active' : '', {disabled: !project}))),
    project ? e('nav', {class: 'account-actions'}, btn('Add Scenario', () => editCard()), btn(project.title, projectSettings, 'solo-project-title', {'aria-label': 'World settings'}),
      btn('Refresh', async () => {try {await window.flushEditor?.(); await refresh(); toast('Project synced.');} catch (error) {toast(error.message);}})) : null,
    e('div', {class: 'signed-as'}, e('span', {}, account.email), btn('Sign out', async () => {
      try {await leaveCurrent(); await request('auth/logout', 'POST', {}); location.replace('/solo/');} catch (error) {toast(error.message);}
    }, 'small-button'), project ? e('span', {id: 'solo-save-state'}, `Saved ${new Date(project.updated_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`) : null),
    S.editSession && mode !== 'editor' ? e('div', {class: 'resume-banner'}, e('span', {}, 'You have an unfinished writing session.'), btn('Resume', showEditor)) : null);
  headerObserver.disconnect(); headerObserver.observe(node);
  return node;
}
function render() {
  if (!account) {login(); return;}
  if (window.editorActive) return;
  if (mode === 'play' && window.immersiveActive) {window.immersiveStateChanged(); return;}
  window.closeBoard?.(); window.closeImmersive?.();
  app.replaceChildren(header(), e('main', {id: 'view'}));
  if (mode === 'projects') {projectList(); return;}
  if (!project) {mode = 'projects'; projectList(); return;}
  if (mode === 'play') {window.openImmersive(selectedCard); return;}
  if (mode === 'cards') {
    document.querySelector('#view').append(e('section', {class: 'solo-card-library'}, e('h1', {}, 'Your cards'),
      cards().length ? e('div', {class: 'solo-library-grid'}, cards().map(card => e('section', {}, face(card),
        e('div', {class: 'tools'}, btn('Open', () => openReader(card.id)), btn('Edit', () => editCard(card)))))) : e('p', {}, 'Add a scenario to begin.')));
    return;
  }
  window.openMap(selectedCard);
  for (const button of document.querySelectorAll('.map-controls button')) if (['Players', 'My Cards'].includes(button.textContent)) button.hidden = true;
}
function showEditor() {
  closeModal(); window.closeBoard?.(); window.closeImmersive?.(); mode = 'editor';
  app.replaceChildren(header(), e('main', {id: 'view'})); window.openSessionEditor();
}
async function projectList() {
  const container = e('section', {class: 'solo-projects'}, e('div', {class: 'solo-projects-heading'}, e('h1', {}, 'Your projects'), btn('New world', newProject, 'primary')),
    e('p', {class: 'muted', role: 'status'}, 'Opening your saved projects…'));
  document.querySelector('#view').append(container);
  try {
    const {projects} = await request('projects');
    if (!container.isConnected) return;
    container.lastChild.remove();
    if (!projects.length) container.append(e('p', {class: 'muted'}, 'Create a world to start your first story.'));
    container.append(e('div', {class: 'solo-project-grid'}, projects.map(item => btn([
      e('span', {class: 'suit'}, '◇'), e('h2', {}, item.title), e('p', {}, `${item.card_count} ${Number(item.card_count) === 1 ? 'card' : 'cards'}`),
      e('time', {datetime: item.updated_at}, `Saved ${new Date(item.updated_at).toLocaleString()}`), e('span', {class: 'solo-project-open'}, 'Open →')
    ], () => openProject(item.id), 'solo-project-card'))));
  } catch (error) {container.lastChild.textContent = error.message;}
}
async function openProject(id, preferredView = 'board', cardId = null) {
  try {
    await leaveCurrent();
    const {state} = await request(`projects/${id}/state`);
    mergeState(state); mode = preferredView === 'play' ? 'play' : 'board'; selectedCard = S.cards.has(cardId) ? cardId : null;
    history.replaceState(null, '', `/solo/#project=${project.id}${mode === 'play' ? '&view=play' : ''}${selectedCard ? `&card=${selectedCard}` : ''}`); render();
  } catch (error) {toast(error.message);if (!project) {mode = 'projects'; render();}}
}
const starters = [
  ['Object', 'Having looked everywhere for it, I finally hold in my hand…'],
  ['Window', 'I turn to the window. Following the sound with my eyes, I see outside…'],
  ['Voicemail', 'My phone shows one new voicemail. I press play and hear…'],
  ['Door', 'I walk through the door and step into…'],
  ['Knock', 'I hear a knock at the door. I open it, and standing there is…'],
  ['Photograph', 'I raise my camera and take a photo of…']
];
function newProject() {
  const id = crypto.randomUUID(), name = e('input', {required: true, maxlength: 80, placeholder: 'Name your world'});
  const scenario = e('input', {value: 'Beginning', required: true, maxlength: 60});
  const body = e('textarea', {required: true, maxlength: 600, placeholder: 'Write the first words…'});
  const prompt = e('select', {'aria-label': 'Starting prompt', onchange: () => {
    const choice = starters[Number(prompt.value)];
    if (choice) {scenario.value = choice[0]; body.value = choice[1];}
  }}, e('option', {value: '-1'}, 'Write my own beginning'), starters.map(([label], index) => e('option', {value: index}, label)));
  const error = e('p', {class: 'error', role: 'alert'}), save = e('button', {type: 'submit', class: 'primary wide'}, 'Create world');
  modal(e('form', {onsubmit: async event => {
    event.preventDefault(); save.disabled = true;
    try {
      const result = await request('projects', 'POST', {id, title: name.value, scenario_title: scenario.value, body: body.value});
      mergeState(result.state); closeModal(); mode = 'board'; selectedCard = null;
      history.replaceState(null, '', `/solo/#project=${project.id}`); render();
    } catch (err) {error.textContent = err.message;} finally {save.disabled = false;}
  }}, btn('×', closeModal, 'close', {'aria-label': 'Close'}), e('h2', {}, 'New world'), e('label', {}, 'Project title', name),
    e('label', {}, 'Starting prompt', prompt), e('label', {}, 'Scenario title', scenario), e('label', {}, 'Opening text', body), save, error));
}
function projectSettings() {
  const name = e('input', {value: project.title, required: true, maxlength: 80}), error = e('p', {class: 'error', role: 'alert'});
  let model = S.world.default_model_url, busy = false;
  const preview = e('div'), paint = () => {preview.replaceChildren(model ? window.renderModel({model_mode: 'card', model_url: model}) : e('p', {class: 'muted'}, 'No project-wide model.'));
    if (model) preview.append(btn('Remove project model', () => {model = null; paint();}, 'small-button'));};
  const file = e('input', {type: 'file', accept: '.glb,model/gltf-binary', hidden: true, onchange: async () => {
    if (!file.files?.[0]) return;
    busy = true; error.textContent = 'Saving 3D object…';
    try {const result = await upload(file.files[0], 'model'); model = result.url; error.textContent = ''; paint();}
    catch (err) {error.textContent = err.message;} finally {busy = false; file.value = '';}
  }});
  paint();
  modal(e('form', {onsubmit: async event => {
    event.preventDefault();
    if (busy) {error.textContent = 'Wait for the GLB to finish saving.'; return;}
    const save = event.submitter; save.disabled = true;
    try {await api('', 'PATCH', {title: name.value, default_model_url: model}); closeModal(); if (mode === 'play') window.closeImmersive(); render();}
    catch (err) {error.textContent = err.message;} finally {save.disabled = false;}
  }}, btn('×', closeModal, 'close', {'aria-label': 'Close'}), e('h2', {}, 'World settings'), e('label', {}, 'Project title', name),
    e('h3', {}, '3D object on every card'), e('p', {class: 'muted'}, 'Individual cards can use a different model or turn the object off.'),
    btn('Upload GLB', () => file.click()), file, preview, e('button', {type: 'submit', class: 'primary wide'}, 'Save settings'), error));
}
function login(email = '') {
  window.closeBoard?.(); window.closeImmersive?.(); closeModal();
  const input = e('input', {type: 'email', value: email, required: true, autocomplete: 'email', maxlength: 254});
  const error = e('p', {class: 'error', role: 'alert'}), submit = e('button', {type: 'submit', class: 'primary wide'}, 'Email me a code');
  app.replaceChildren(e('main', {class: 'join solo-login'}, e('div', {class: 'wordmark'}, 'JOOTSY!', e('small', {}, 'Solo')),
    e('h1', {}, 'Sign in'), e('p', {class: 'muted'}, 'Use your email to save stories and return to your projects.'),
    e('form', {onsubmit: async event => {
      event.preventDefault(); submit.disabled = true; error.textContent = '';
      try {await request('auth/code', 'POST', {email: input.value}); verifyCode(input.value);}
      catch (err) {error.textContent = err.message;} finally {submit.disabled = false;}
    }}, e('label', {}, 'Email', input), submit, error)));
}
function verifyCode(email) {
  const code = e('input', {inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]{6}', maxlength: 6, required: true});
  const error = e('p', {class: 'error', role: 'alert'}), submit = e('button', {type: 'submit', class: 'primary wide'}, 'Open my projects');
  app.replaceChildren(e('main', {class: 'join solo-login'}, e('div', {class: 'wordmark'}, 'JOOTSY! Solo'), e('h1', {}, 'Check your email'), e('p', {}, `Enter the code sent to ${email}.`),
    e('form', {onsubmit: async event => {
      event.preventDefault(); submit.disabled = true;
      try {const result = await request('auth/verify', 'POST', {email, code: code.value}); account = result.account; await start();}
      catch (err) {error.textContent = err.message;} finally {submit.disabled = false;}
    }}, e('label', {}, 'Six-digit code', code), submit, error), btn('Resend or change email', () => login(email), 'wide')));
  code.focus();
}
async function start() {
  const savedLocation = new URLSearchParams(location.hash.slice(1));
  const id = savedLocation.get('project');
  if (id) await openProject(id, savedLocation.get('view'), savedLocation.get('card')); else {mode = 'projects'; render();}
}

window.Jootsy = {isSolo: true, S, T, e, btn, api, refresh, paths, cards, allCards, mine, title, cardKind, player: () => 'You', alive, suit,
  order, definitions, go, openReader, closeReader: closeModal, closeModal, modal, toast, face, transitionButtons,
  current: () => S.cards.get(selectedCard), render, selectMode, showEditor, startSound() {}, commitSound() {},
  createReaderSidebar: readerSidebar, readerSidebarLabel: 'Your world',
  readerLocation(id) {
    selectedCard = id;
    const hash = new URLSearchParams({project: project.id, view: 'play'});
    if (id) hash.set('card', id);
    return `/solo/#${hash}`;
  },
  afterCommit(result) {window.editorActive = false;mode = 'board';selectedCard = result.card_ids.at(-1) || result.anchor_id;closeModal();render();},
  uploadImage: file => upload(file, 'image'), uploadSound: file => upload(file, 'audio'), uploadVideo: file => upload(file, 'video')};

await import('/extras.js');
installSoloMedia(window.Jootsy, upload);
await Promise.all([import('/map.js'), import('/immersive.js'), import('./editor.js')]);
try {account = (await request('auth/session')).account; await start();}
catch (error) {if (error.status === 401) login(); else app.replaceChildren(e('main', {class: 'join'}, e('h1', {}, 'Jootsy Solo'), e('p', {role: 'alert'}, error.message), btn('Try again', () => location.reload())));}
setInterval(() => {if (account && project && !document.hidden && !window.editorActive && !window.panelActive && mode !== 'projects') refresh().catch(error => toast(error.message));}, 12_000);
