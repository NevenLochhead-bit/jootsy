import {strict as assert} from 'node:assert';
import {readingGraph, futureCards, followPath, mergeComments, travelMotion} from '../public/immersive-model.js';

const cards = [
  {id: 'root', type: 'scenario'}, {id: 'a'}, {id: 'b'},
  {id: 'hidden', hidden: true}, {id: 'draft', draft: true}, {id: 'deleted', deleted: true}
];
const paths = [
  {id: 'start-a', from_card_id: 'root', to_card_id: 'a', kind: 'fork', position: 0},
  {id: 'start-b', from_card_id: 'root', to_card_id: 'b', kind: 'fork', position: 1},
  {id: 'a-b', from_card_id: 'a', to_card_id: 'b', kind: 'destiny', position: 0},
  {id: 'b-a', from_card_id: 'b', to_card_id: 'a', kind: 'jootsy', position: 0},
  {id: 'home', from_card_id: 'b', to_card_id: 'root', kind: 'wormhole', position: 1},
  ...['hidden', 'draft', 'deleted', 'missing'].map((id, position) =>
    ({id, from_card_id: 'a', to_card_id: id, position: position + 1})),
  {id: 'draft-path', from_card_id: 'a', to_card_id: 'b', draft: true},
  {id: 'deleted-path', from_card_id: 'a', to_card_id: 'b', deleted: true}
];
const snapshot = JSON.stringify({cards, paths});
const graph = readingGraph(cards, paths);
assert.deepEqual([...graph.cards.keys()], ['root', 'a', 'b']);
assert.equal(graph.outgoing.get('a').length, 1);
assert.equal(graph.scenarios.length, 1);
const previews = futureCards(graph, 'root');
assert.equal(previews.filter(card => card.depth === 1).length, 2);
assert(previews.some(card => card.cardId === 'a' && card.depth === 3));
assert.equal(new Set(previews.map(card => card.key)).size, previews.length);
assert(futureCards(graph, 'a', 100, 30).length <= 30);
assert.deepEqual(futureCards(readingGraph([{id: 'end'}], []), 'end'), []);
let journey = [{cardId: 'root'}];
journey = followPath(journey, paths[0]);
for (let index = 0; index < 1000; index++) journey = followPath(journey, index % 2 ? paths[3] : paths[2]);
assert.equal(journey.length, 1002);
assert.equal(journey.at(-1).cardId, 'a');
journey = followPath(journey, paths[2]);
assert.equal(followPath(journey, paths[4]).length, 1);
assert.strictEqual(followPath(journey, paths[0]), journey);
const repeated = [{cardId: 'a'}, {cardId: 'b'}, {cardId: 'a'}, {cardId: 'b'}];
assert.equal(followPath(repeated, {from_card_id: 'b', to_card_id: 'a', kind: 'wormhole'}).length, 3);
assert.equal(JSON.stringify({cards, paths}), snapshot);
const comment = (id, seq) => ({id, seq});
const merged = mergeComments([comment('later', '9007199254740995'), comment('first', '1')],
  [comment('middle', '9007199254740994'), comment('first', '1')]);
assert.deepEqual(merged.map(entry => entry.id), ['first', 'middle', 'later']);
for (const kind of ['destiny', 'fork', 'dream', 'wormhole', 'jootsy']) {
  for (const side of [-1, 1]) {
    const moving = travelMotion(kind, side);
    assert.equal(moving.departing[0].transform, 'translate3d(0,0,0) rotateY(0deg)');
    assert.equal(moving.arriving.at(-1).transform, 'translate3d(0,0,0) rotateY(0deg)');
    assert.equal(moving.arriving.at(-1).filter, 'blur(0px)');
    assert.equal(moving.arriving[0].filter, 'blur(12px)');
    for (const frame of [...moving.departing, ...moving.arriving, ...moving.distance, ...moving.floor]) {
      assert.equal(frame.opacity, undefined, 'Travel must preserve the physical card instead of fading it.');
    }
    assert(moving.departing.at(-1).transform.includes(kind === 'wormhole' ? '-1100px' : '960px'));
    assert(moving.duration >= 700 && moving.duration <= 900);
  }
}
console.log('PASS immersive graph: committed visible cards only; actual continuations; bounded route previews; 1,000 repeated moves; Wormhole return; immutable stories; lossless comment cursors.');
console.log('PASS spatial travel: simultaneous card approach and departure; no opacity fades; blurred arrivals; reverse Wormhole depth; both branch directions.');
