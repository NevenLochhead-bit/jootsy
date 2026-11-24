export const MOVE_COLORS = {
  scenario: '#a9e9e0', destiny: '#a26bff', fork: '#4c8dff',
  dream: '#ffd84a', wormhole: '#a8b9c8', jootsy: '#ff5fb0'
};

export function travelMotion(kind, side = 1) {
  const lane = side < 0 ? -1 : 1;
  const reverse = kind === 'wormhole';
  const drift = kind === 'dream' ? -30 : 0;
  const turn = kind === 'jootsy' ? 11 : kind === 'fork' ? 6 : 3;
  const centered = {transform: 'translate3d(0,0,0) rotateY(0deg)', filter: 'blur(0px)'};
  const past = {transform: `translate3d(${-lane * 760}px,${80 + drift}px,960px) rotateY(${-lane * turn}deg)`, filter: 'blur(12px)'};
  const ahead = {transform: `translate3d(${lane * 430}px,${-20 + drift}px,-1100px) rotateY(${lane * turn}deg)`, filter: 'blur(12px)'};
  const between = {transform: `translate3d(${lane * 150}px,${drift}px,-420px) rotateY(${lane * turn / 2}deg)`, filter: 'blur(7px)', offset: .65};
  return {
    duration: kind === 'dream' ? 880 : kind === 'jootsy' ? 760 : 720,
    departing: [centered, reverse ? ahead : past],
    arriving: reverse ? [past, centered] : [ahead, between, centered],
    distance: [{transform: 'translate3d(0,0,0)'},
      {transform: `translate3d(${-lane * 180}px,0,${reverse ? -580 : 580}px)`}],
    floor: [{backgroundPosition: '0 0'},
      {backgroundPosition: kind === 'jootsy' ? `${lane * 144}px 72px` : `0 ${reverse ? -144 : 144}px`}]
  };
}

export function readingGraph(cardValues, pathValues) {
  const cards = new Map([...cardValues]
    .filter(card => !card.deleted && !card.draft && !card.hidden)
    .map(card => [card.id, card]));
  const outgoing = new Map();
  for (const path of [...pathValues].sort((a, b) => a.position - b.position)) {
    if (path.deleted || path.draft || !cards.has(path.from_card_id) || !cards.has(path.to_card_id)) continue;
    if (!outgoing.has(path.from_card_id)) outgoing.set(path.from_card_id, []);
    outgoing.get(path.from_card_id).push(path);
  }
  return {cards, outgoing, scenarios: [...cards.values()].filter(card => card.type === 'scenario')};
}

// Preview occurrences belong to a route, so a Jootsy loop can appear again at the next depth.
// Only the distant preview is bounded. Walking the graph has no depth or repeat limit.
export function futureCards(graph, cardId, levels = 3, limit = 42) {
  const result = [];
  let frontier = [{cardId, x: 0, key: 'now'}];
  for (let depth = 1; depth <= levels && result.length < limit; depth++) {
    const next = [];
    for (const parent of frontier) {
      const choices = graph.outgoing.get(parent.cardId) || [];
      for (const [index, path] of choices.entries()) {
        if (result.length >= limit) break;
        const spread = depth === 1 ? 660 : 310 / depth;
        const offset = choices.length === 1 ? (depth === 1 ? 460 : 0) : (index - (choices.length - 1) / 2) * spread;
        const node = {cardId: path.to_card_id, path, depth, x: parent.x + offset, parentX: parent.x,
          key: `${parent.key}/${path.id}`, continues: (graph.outgoing.get(path.to_card_id) || []).length};
        result.push(node);
        next.push(node);
      }
    }
    frontier = next;
  }
  return result;
}

export function followPath(journey, path) {
  if (journey.at(-1)?.cardId !== path.from_card_id) return journey;
  if (path.kind === 'wormhole') {
    const previous = journey.findLastIndex(stop => stop.cardId === path.to_card_id);
    if (previous >= 0) return journey.slice(0, previous + 1);
  }
  return [...journey, {cardId: path.to_card_id, pathId: path.id, kind: path.kind}];
}

export function mergeComments(existing, incoming) {
  const byId = new Map(existing.map(comment => [comment.id, comment]));
  for (const comment of incoming) byId.set(comment.id, comment);
  return [...byId.values()].sort((a, b) => {
    const first = BigInt(a.seq), second = BigInt(b.seq);
    return first < second ? -1 : first > second ? 1 : 0;
  });
}
