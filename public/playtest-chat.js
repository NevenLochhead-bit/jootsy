import {mergeComments} from './immersive-model.js';

export function createPlaytestChat(J, onCard) {
  const {e, btn, S} = J;
  const slug = S.world.slug;
  let card = null, scope = 'card', comments = [], epoch = 0, nextBefore = null, latestFetched = null, loading = false, closed = false;
  const drafts = new Map(), pending = new Map();
  const remembered = (() => {try {return localStorage.getItem(`jootsy-chat-name:${slug}`) || '';} catch {return '';}})();
  const name = e('input', {id: 'playtest-name', value: remembered || S.player.name, maxlength: 40,
    autocomplete: 'nickname', required: true, placeholder: 'Your name'});
  const message = e('textarea', {id: 'playtest-message', rows: 3, maxlength: 1000, required: true,
    placeholder: 'Leave a comment on this card…'});
  const heading = e('p', {class: 'playtest-context'});
  const feed = e('div', {class: 'playtest-feed', role: 'log', 'aria-label': 'Playtest comments',
    'aria-live': 'polite', 'aria-relevant': 'additions', tabindex: 0});
  const status = e('p', {class: 'playtest-status', role: 'status'});
  const error = e('p', {class: 'playtest-error', role: 'alert'});
  const count = e('span', {class: 'playtest-count'}, '0 / 1000');
  const submit = e('button', {type: 'submit'}, 'Send comment');
  const older = btn('Earlier comments', () => load('older'), 'playtest-earlier');
  older.hidden = true;
  const cardTab = btn('This card', () => changeScope('card'), '', {'aria-pressed': true});
  const allTab = btn('All cards', () => changeScope('all'), '', {'aria-pressed': false});
  const retry = btn('Retry', () => load('reset'), 'playtest-retry');
  retry.hidden = true;
  const updateCount = () => {count.textContent = `${Array.from(message.value).length} / 1000`;};
  message.addEventListener('input', () => {
    if (card) drafts.set(card.id, message.value);
    updateCount();
  });
  name.addEventListener('change', () => {
    try {localStorage.setItem(`jootsy-chat-name:${slug}`, name.value.trim());} catch {}
  });

  function paint(reset = false, loadingOlder = false) {
    const nearBottom = reset || feed.scrollHeight - feed.scrollTop - feed.clientHeight < 64;
    const oldHeight = feed.scrollHeight, oldTop = feed.scrollTop;
    const existing = new Set([...feed.children].map(node => node.dataset.commentId));
    if (reset) feed.replaceChildren();
    const nodes = [];
    for (const comment of comments) {
      if (!reset && existing.has(comment.id)) continue;
      const target = S.cards.get(comment.card_id);
      const stamp = new Date(comment.created_at);
      const item = e('article', {class: 'playtest-comment', 'data-comment-id': comment.id, 'data-sequence': comment.seq},
        e('div', {class: 'playtest-comment-meta'}, e('strong', {}, comment.display_name),
          e('time', {datetime: comment.created_at, title: stamp.toLocaleString()},
            stamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}))),
        scope === 'all' && target ? btn(J.title(target), () => onCard(comment.card_id), 'playtest-card-link') : null,
        e('p', {}, comment.body));
      nodes.push(item);
    }
    if (loadingOlder) feed.prepend(...nodes);
    else for (const node of nodes) {
      const next = [...feed.children].find(child => BigInt(child.dataset.sequence) > BigInt(node.dataset.sequence));
      feed.insertBefore(node, next || null);
    }
    if (loadingOlder) feed.scrollTop = oldTop + feed.scrollHeight - oldHeight;
    else if (nearBottom) feed.scrollTop = feed.scrollHeight;
    status.textContent = comments.length ? '' : 'No comments yet. Be the first to leave one.';
    older.hidden = !nextBefore;
  }

  async function load(kind = 'new') {
    if (closed || !card || loading || document.hidden) return;
    loading = true;
    const requestEpoch = epoch;
    const query = new URLSearchParams();
    if (scope === 'card') query.set('card', card.id);
    if (kind === 'older' && nextBefore) query.set('before', nextBefore);
    if (kind === 'new' && latestFetched) query.set('after', latestFetched);
    if (!comments.length) status.textContent = 'Loading comments…';
    try {
      const data = await J.api(`playtest/comments?${query}`);
      if (closed || requestEpoch !== epoch) return;
      if (kind !== 'new' || !comments.length) nextBefore = data.nextBefore;
      if (kind !== 'older' && data.comments.length) latestFetched = data.comments.at(-1).seq;
      comments = mergeComments(kind === 'reset' ? [] : comments, data.comments);
      paint(kind === 'reset', kind === 'older');
      error.textContent = '';
      retry.hidden = true;
      // A busy chat may have more than a page of new comments between polls.
      if (kind === 'new' && data.hasMore) queueMicrotask(() => load('new'));
    } catch (err) {
      if (requestEpoch !== epoch || closed) return;
      status.textContent = '';
      error.textContent = err.message;
      retry.hidden = false;
    } finally {
      if (requestEpoch === epoch) loading = false;
    }
  }

  function changeScope(value) {
    if (scope === value) return;
    scope = value;
    cardTab.setAttribute('aria-pressed', String(scope === 'card'));
    allTab.setAttribute('aria-pressed', String(scope === 'all'));
    resetFeed();
  }

  function resetFeed() {
    epoch++;
    loading = false;
    comments = [];
    nextBefore = null;
    latestFetched = null;
    feed.replaceChildren();
    older.hidden = true;
    error.textContent = '';
    retry.hidden = true;
    load('reset');
  }

  async function send(event) {
    event.preventDefault();
    if (!card || submit.disabled) return;
    const target = card;
    const body = message.value.trim(), displayName = name.value.trim();
    const previous = pending.get(target.id);
    const payload = previous?.body === body && previous.name === displayName ? previous :
      {id: crypto.randomUUID(), card_id: target.id, name: displayName, body};
    pending.set(target.id, payload);
    submit.disabled = true;
    submit.textContent = 'Sending…';
    error.textContent = '';
    try {
      const data = await J.api('playtest/comments', 'POST', payload);
      pending.delete(target.id);
      if ((drafts.get(target.id) || '').trim() === body) drafts.delete(target.id);
      try {localStorage.setItem(`jootsy-chat-name:${slug}`, displayName);} catch {}
      if (closed) return;
      if (card?.id === target.id && message.value.trim() === body) {
        message.value = '';
        updateCount();
      }
      if (card && (scope === 'all' || card.id === target.id)) {
        comments = mergeComments(comments, [data.comment]);
        paint();
      }
    } catch (err) {
      if (!closed && card?.id === target.id) error.textContent = err.message;
    } finally {
      if (!closed) {
        submit.disabled = false;
        submit.textContent = 'Send comment';
      }
    }
  }

  const element = e('aside', {class: 'playtest-chat', 'aria-label': 'Playtest chat'},
    e('header', {class: 'playtest-heading'}, e('h2', {}, 'Playtest chat'),
      e('div', {class: 'playtest-scope', role: 'group', 'aria-label': 'Comments shown'}, cardTab, allTab)),
    heading, older, feed, status, retry,
    e('form', {class: 'playtest-compose', onsubmit: send},
      e('label', {for: 'playtest-name'}, 'Your name'), name,
      e('label', {for: 'playtest-message'}, 'Comment on this card'), message,
      e('div', {class: 'playtest-send'}, count, submit), error));
  const timer = setInterval(() => load('new'), 6000);
  const onVisible = () => {if (!document.hidden) load('new');};
  document.addEventListener('visibilitychange', onVisible);

  return {
    element,
    setCard(next) {
      const changed = next.id !== card?.id;
      card = next;
      heading.textContent = J.title(next);
      message.value = drafts.get(next.id) || '';
      message.setAttribute('aria-label', `Comment on ${J.title(next)}`);
      updateCount();
      if (changed && scope === 'card') resetFeed();
      else if (changed && !comments.length) load('reset');
    },
    reset: resetFeed,
    pause() {
      card = null;
      resetFeed();
    },
    close() {
      closed = true;
      epoch++;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}
