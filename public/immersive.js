import {readingGraph, futureCards, followPath, MOVE_COLORS} from './immersive-model.js';
import {createPlaytestChat} from './playtest-chat.js';

const J = window.Jootsy;
let view = null;
const graphNow = () => readingGraph(J.S.cards.values(), J.S.paths.values());
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function movement(kind, leaving) {
  const direction = leaving ? 1 : -1;
  const end = {opacity: leaving ? 0 : 1, transform: 'translate3d(0,0,0) rotate(0) scale(1)', filter: 'blur(0)'};
  const displaced = {
    destiny: `translate3d(0,0,${direction * 160}px) scale(${leaving ? 1.12 : .88})`,
    fork: `translate3d(${direction * -30}px,0,${direction * 100}px) scale(${leaving ? 1.06 : .94})`,
    dream: `translate3d(0,${direction * -22}px,0) rotate(${direction * .8}deg) scale(${leaving ? 1.025 : .975})`,
    wormhole: `translate3d(${direction * 18}px,0,${direction * -190}px) scale(${leaving ? .84 : 1.16})`,
    jootsy: `translate3d(${direction * -65}px,0,0) rotateY(${direction * 5}deg)`
  };
  const away = {opacity: leaving ? 0 : 0, transform: displaced[kind] || displaced.destiny,
    filter: kind === 'dream' ? 'blur(3px)' : 'blur(0)'};
  return leaving ? [{...end, opacity: 1}, away] : [away, end];
}

window.openImmersive = startId => {
  if (view) return;
  const {e, btn, S} = J;
  let graph = graphNow(), journey = [], activeId = null, busy = false, closed = false, navigation = 0;
  let soundOn = true, chatOpen = true, arrivalKind = null, activeFingerprint = '', choicesFingerprint = '', chat, animations = [];
  const frame = e('div', {class: 'immersive-reading'});
  const distance = e('div', {class: 'immersive-distance', 'aria-hidden': true});
  const floor = e('div', {class: 'immersive-floor', 'aria-hidden': true});
  const passage = e('p', {class: 'immersive-arrival', role: 'status', 'aria-live': 'polite'});
  const mediaStatus = e('div', {class: 'immersive-media-status', role: 'status'});
  const choices = e('div', {class: 'immersive-options', role: 'group', 'aria-label': 'Choose what happens next'});
  const back = btn('← Back', () => goBack(), '', {disabled: true});
  const beginnings = btn('Beginnings', () => showBeginnings());
  const sound = btn('Sound on', () => {
    soundOn = !soundOn;
    sound.textContent = soundOn ? 'Sound on' : 'Sound off';
    sound.setAttribute('aria-pressed', String(soundOn));
    stopMedia(false);
    if (activeId) startMedia();
  }, '', {'aria-pressed': true});
  const chatToggle = btn('Chat', () => {
    chatOpen = !chatOpen;
    shell.classList.toggle('chat-hidden', !chatOpen);
    chat.element.hidden = !chatOpen;
    chatToggle.setAttribute('aria-expanded', String(chatOpen));
  }, '', {'aria-expanded': true, 'aria-controls': 'immersive-chat'});
  const scene = e('section', {class: 'immersive-scene', 'aria-label': 'Immersive story'},
    e('div', {class: 'immersive-sky', 'aria-hidden': true}),
    e('div', {class: 'immersive-horizon', 'aria-hidden': true}), floor,
    e('div', {class: 'immersive-depth'}, distance), frame);
  const stage = e('div', {class: 'immersive-main'},
    e('div', {class: 'immersive-toolbar'}, e('div', {}, back, beginnings), e('div', {}, sound, chatToggle)),
    passage, scene, mediaStatus, choices);
  chat = createPlaytestChat(J, id => jumpFromChat(id));
  chat.element.id = 'immersive-chat';
  const shell = e('div', {class: 'immersive-shell'}, stage, chat.element);
  document.querySelector('#view').append(shell);
  window.immersiveActive = true;

  function stopMedia(remove = true) {
    for (const media of frame.querySelectorAll('audio,video')) media.pause();
    for (const embed of frame.querySelectorAll('iframe')) {
      embed.dataset.mediaSource ||= embed.src;
      embed.src = 'about:blank';
    }
    if (remove) mediaStatus.replaceChildren();
  }

  function startMedia() {
    if (document.hidden || closed) return;
    mediaStatus.replaceChildren();
    const native = [...frame.querySelectorAll('audio,video')];
    const retry = btn('Play this card’s media', () => startMedia(), 'immersive-media-play');
    const onBlocked = media => {
      if (closed || !frame.contains(media)) return;
      if (!mediaStatus.contains(retry)) mediaStatus.append(retry);
    };
    for (const media of native) {
      media.autoplay = true;
      // Uploaded video keeps Jootsy's muted, looping presentation. Sound is its own track.
      media.muted = !soundOn || (media.tagName === 'VIDEO' && Boolean(S.cards.get(activeId)?.video_url));
      if (media.tagName === 'AUDIO' && !soundOn) continue;
      const playing = media.play();
      playing?.catch(() => onBlocked(media));
      media.addEventListener('error', () => {
        if (closed || !frame.contains(media)) return;
        mediaStatus.replaceChildren(e('span', {}, 'This media could not load. You can keep reading.'), retry);
      }, {once: true});
    }
    for (const embed of frame.querySelectorAll('iframe')) {
      const source = embed.dataset.mediaSource || embed.src;
      let url;
      try {url = new URL(source);} catch {continue;}
      embed.dataset.mediaSource = source;
      if (url.hostname === 'www.youtube-nocookie.com') {
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', soundOn ? '0' : '1');
      } else if (url.hostname === 'player.vimeo.com') {
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('muted', soundOn ? '0' : '1');
      } else if (url.hostname === 'w.soundcloud.com') {
        url.searchParams.set('auto_play', String(soundOn));
      }
      const permissions = new Set((embed.getAttribute('allow') || '').split(';').map(value => value.trim()).filter(Boolean));
      permissions.add('autoplay');
      embed.setAttribute('allow', [...permissions].join('; '));
      embed.src = url.href;
    }
  }

  async function animate(kind, leaving) {
    if (motion.matches || closed || !frame.animate) return;
    const duration = kind === 'dream' ? 300 : kind === 'wormhole' ? 220 : 200;
    const cardAnimation = frame.animate(movement(kind, leaving), {duration, easing: 'ease-in-out', fill: 'both'});
    const gridAnimation = floor.animate([
      {backgroundPosition: '0 0'},
      {backgroundPosition: kind === 'jootsy' ? '36px 0' : `0 ${kind === 'wormhole' ? '-36' : '36'}px`}
    ], {duration, easing: 'ease-in-out'});
    animations.push(cardAnimation, gridAnimation);
    try {await cardAnimation.finished;} catch {}
  }

  function finishAnimations() {
    for (const animation of animations) animation.cancel();
    animations = [];
  }

  function markPlace() {
    const hash = new URLSearchParams({view: 'play'});
    if (activeId) hash.set('card', activeId);
    history.replaceState(null, '', `${location.pathname}${location.search}#${hash}`);
    back.disabled = journey.length < 2;
    chatToggle.disabled = !activeId;
  }

  function drawDistance() {
    const previews = activeId ? futureCards(graph, activeId) : [];
    distance.replaceChildren(...previews.map(node => {
      const card = graph.cards.get(node.cardId);
      const color = MOVE_COLORS[node.path.kind] || MOVE_COLORS.fork;
      return e('div', {class: `immersive-future depth-${node.depth}`,
        style: `--future-x:${node.x}px;--future-z:${-node.depth * 640}px;--future-y:${-120 + node.depth * 20}px;--future-color:${color}`},
        e('span', {class: 'immersive-future-type'}, J.T[node.path.kind]?.[1] || 'Card'),
        e('span', {class: 'immersive-future-title'}, J.title(card)),
        e('span', {class: 'immersive-future-lines'}),
        node.continues ? e('span', {class: 'immersive-future-more'}, `${node.continues} ${node.continues === 1 ? 'path' : 'paths'} beyond`) : null);
    }));
  }

  function paintCard(announce = true) {
    const card = graph.cards.get(activeId);
    if (!card) {showBeginnings(); return;}
    const kind = arrivalKind || J.cardKind(card);
    shell.classList.remove('is-beginnings');
    frame.classList.remove('is-lobby');
    shell.style.setProperty('--immersive-tint', MOVE_COLORS[kind] || MOVE_COLORS.scenario);
    shell.dataset.move = kind;
    activeFingerprint = JSON.stringify([card, J.title(card)]);
    const face = J.face(card, {readonly: true});
    face.classList.add('immersive-card');
    const heading = face.querySelector('h2');
    heading.tabIndex = -1;
    frame.replaceChildren(face);
    paintChoices();
    passage.textContent = announce ? (kind === 'wormhole' ? 'Back through the wormhole.' : kind === 'jootsy' ? 'Into another timeline.' : J.title(card)) : '';
    drawDistance();
    chat.element.hidden = !chatOpen;
    chat.setCard(card);
    markPlace();
    startMedia();
    if (announce) heading.focus({preventScroll: true});
  }

  function offeredFingerprint() {
    return JSON.stringify((graph.outgoing.get(activeId) || []).map(path =>
      [path.id, path.kind, path.label, path.to_card_id, (graph.outgoing.get(path.to_card_id) || []).length]));
  }

  function paintChoices() {
    const card = graph.cards.get(activeId);
    const offered = graph.outgoing.get(card.id) || [];
    choicesFingerprint = offeredFingerprint();
    choices.replaceChildren(...offered.map(path => {
      const target = graph.cards.get(path.to_card_id);
      const continuation = (graph.outgoing.get(target.id) || []).length;
      return btn([
        e('span', {class: 'immersive-choice-kind'}, J.T[path.kind]?.[0], ' ', J.T[path.kind]?.[1]),
        e('span', {class: 'immersive-choice-label'}, path.label || J.title(target)),
        e('span', {class: 'immersive-choice-beyond'}, continuation ?
          `${continuation} ${continuation === 1 ? 'path' : 'paths'} beyond` : 'Last card on this path'),
        e('span', {class: 'immersive-choice-arrow', 'aria-hidden': true}, path.kind === 'wormhole' ? '↶' : '↗')
      ], () => walk(path), 'immersive-choice', {'data-path-id': path.id,
        style: `--choice-color:${MOVE_COLORS[path.kind] || MOVE_COLORS.fork}`});
    }));
    if (!offered.length) choices.append(e('p', {class: 'immersive-end'}, 'This is where this path ends for now.'),
      btn('Try another beginning', () => showBeginnings()));
  }

  async function travel(nextJourney, kind) {
    if (busy || closed) return;
    busy = true;
    const token = ++navigation;
    choices.setAttribute('aria-busy', 'true');
    for (const button of choices.querySelectorAll('button')) button.disabled = true;
    stopMedia();
    await animate(kind, true);
    if (closed || token !== navigation) return;
    journey = nextJourney;
    activeId = journey.at(-1).cardId;
    arrivalKind = kind;
    finishAnimations();
    paintCard();
    await animate(kind, false);
    if (closed || token !== navigation) return;
    finishAnimations();
    busy = false;
    choices.removeAttribute('aria-busy');
    choices.scrollTop = 0;
    update();
  }

  function walk(path) {
    // Re-check live visibility rather than following a removed or newly hidden path.
    graph = graphNow();
    const fresh = graph.outgoing.get(activeId)?.find(candidate => candidate.id === path.id);
    if (!fresh) {update(); return;}
    travel(followPath(journey, fresh), fresh.kind);
  }

  function goBack() {
    if (journey.length < 2 || busy) return;
    let previous = journey.slice(0, -1);
    while (previous.length && !graph.cards.has(previous.at(-1).cardId)) previous.pop();
    if (previous.length) travel(previous, 'wormhole'); else showBeginnings();
  }

  function jumpFromChat(id) {
    if (id === activeId || busy || !graph.cards.has(id)) return;
    const next = [...journey, {cardId: id, kind: 'jootsy'}];
    if (!journey.length) {journey = next; activeId = id; arrivalKind = 'jootsy'; paintCard();}
    else travel(next, 'jootsy');
  }

  function showBeginnings() {
    if (closed) return;
    navigation++;
    busy = false;
    finishAnimations();
    stopMedia();
    graph = graphNow();
    activeId = null;
    arrivalKind = null;
    journey = [];
    chat.pause();
    frame.classList.add('is-lobby');
    shell.dataset.move = 'scenario';
    shell.style.setProperty('--immersive-tint', MOVE_COLORS.scenario);
    distance.replaceChildren();
    choices.replaceChildren();
    choices.removeAttribute('aria-busy');
    passage.textContent = 'Choose a beginning.';
    frame.replaceChildren(e('div', {class: 'immersive-beginnings'}, graph.scenarios.map(card =>
      btn([e('span', {class: 'immersive-source-glow', 'aria-hidden': true}, '◇'), e('h2', {}, J.title(card)),
        e('p', {}, card.body), e('span', {class: 'immersive-start'}, 'Begin →')], () => {
        frame.classList.remove('is-lobby');
        journey = [{cardId: card.id, kind: 'scenario'}];
        activeId = card.id;
        arrivalKind = 'scenario';
        paintCard();
      }, 'immersive-beginning'))));
    if (!graph.scenarios.length) frame.append(e('p', {}, 'A beginning will appear here when a scenario is ready.'));
    chat.element.hidden = true;
    shell.classList.add('is-beginnings');
    markPlace();
  }

  function update() {
    if (closed || busy) return;
    const previouslyVisible = new Set(graph.cards.keys());
    graph = graphNow();
    if (!activeId) {showBeginnings(); return;}
    if (!graph.cards.has(activeId)) {showBeginnings(); chat.reset(); return;}
    if ([...previouslyVisible].some(id => !graph.cards.has(id))) chat.reset();
    const card = graph.cards.get(activeId);
    // Comments and background board polling must never restart a playing sound or video.
    if (JSON.stringify([card, J.title(card)]) !== activeFingerprint) {stopMedia(); paintCard(false);}
    else {
      drawDistance();
      if (choicesFingerprint !== offeredFingerprint()) paintChoices();
    }
    shell.classList.remove('is-beginnings');
    frame.classList.remove('is-lobby');
  }

  const onVisibility = () => {
    if (document.hidden) stopMedia();
    else if (activeId && !closed) startMedia();
  };
  document.addEventListener('visibilitychange', onVisibility);
  view = {update, close() {
    closed = true;
    navigation++;
    finishAnimations();
    stopMedia();
    chat.close();
    document.removeEventListener('visibilitychange', onVisibility);
    shell.remove();
    window.immersiveActive = false;
    view = null;
  }};
  if (graph.cards.has(startId)) {
    journey = [{cardId: startId, kind: J.cardKind(graph.cards.get(startId))}];
    activeId = startId;
    paintCard(false);
  } else showBeginnings();
};

window.closeImmersive = () => view?.close();
window.immersiveStateChanged = () => view?.update();
