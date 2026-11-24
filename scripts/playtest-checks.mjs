import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

export async function runPlaytestChecks({pool, handler, player, cardId, otherCardId, peers}) {
  if (!process.env.CI_TEST_DATABASE) throw Error('Playtest checks require disposable Postgres.');
  const world = (await pool.query("SELECT id FROM worlds WHERE slug='sandbox'")).rows[0];
  const inaccessible = [];
  for (const flag of ['hidden', 'draft', 'deleted']) {
    inaccessible.push((await pool.query(`INSERT INTO cards(world_id,type,scenario_title,body,depth,rev,${flag})
      VALUES($1,'scenario','Disposable visibility fixture','Private fixture.',0,1,true) RETURNING id`, [world.id])).rows[0].id);
  }
  const snapshot = async () => {
    const result = {};
    for (const table of ['worlds', 'players', 'cards', 'paths', 'events', 'edit_sessions', 'media_uploads']) {
      result[table] = (await pool.query(`SELECT * FROM ${table} ORDER BY ${table === 'media_uploads' ? 'key' : 'id'}`)).rows;
    }
    return result;
  };
  const beforeMigration = await snapshot();
  await pool.query(await readFile('netlify/database/migrations/20261124153000_playtest_comments.sql', 'utf8'));
  assert.deepEqual(await snapshot(), beforeMigration);
  const call = async (query = '', method = 'GET', body, owner = player, slug = 'sandbox') => {
    const headers = {};
    if (owner) headers.authorization = `Bearer ${owner.token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await handler(new Request(`https://jootsy.test/api/w/${slug}/playtest/comments${query}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    }));
    return {status: response.status, ...await response.json()};
  };
  const payload = (card = cardId, body = 'The next choice surprised me.') =>
    ({id: randomUUID(), card_id: card, name: '  Test   reader  ', body});
  assert.equal((await call('', 'GET', undefined, null)).status, 401);
  const original = payload();
  const first = await call('', 'POST', original);
  assert.equal(first.status, 200);
  assert.equal(first.comment.display_name, 'Test reader');
  assert.equal(first.comment.body, original.body);
  assert.equal((await call('', 'POST', original)).comment.id, first.comment.id);
  assert.equal((await call('', 'POST', {...original, body: 'Overwrite attempted.'})).status, 409);
  assert.equal((await call('', 'POST', original, peers[0])).status, 409);
  assert.equal((await call(`?card=${cardId}`)).comments.length, 1);
  assert.equal((await call(`?card=${otherCardId}`)).comments.length, 0);
  for (const [key, value] of [['name', ''], ['name', 'x'.repeat(41)], ['body', ''], ['body', 'x'.repeat(1001)], ['id', '-'.repeat(36)]]) {
    assert.equal((await call('', 'POST', {...payload(), [key]: value})).status, 400);
  }
  assert.equal((await call('', 'POST', null)).status, 400);
  assert.equal((await call('', 'POST', {...payload(), body: 'x'.repeat(9000)})).status, 413);
  for (const id of inaccessible) {
    assert.equal((await call('', 'POST', payload(id))).status, 404);
    assert.equal((await call(`?card=${id}`)).status, 404);
  }
  const foreign = (await pool.query("SELECT id FROM cards WHERE world_id=(SELECT id FROM worlds WHERE slug='mdst1050') LIMIT 1")).rows[0];
  assert.equal((await call('', 'POST', payload(foreign.id))).status, 404);
  assert.equal((await call('', 'GET', undefined, player, 'mdst1050')).status, 401);
  for (const query of ['?after=-1', '?before=0', '?after=9223372036854775808', '?after=1&before=2', '?card=bad']) {
    assert.equal((await call(query)).status, 400);
  }
  assert.equal((await call('', 'DELETE')).status, 405);
  const concurrent = await Promise.all(peers.map(owner => call('', 'POST', payload(otherCardId), owner)));
  assert(concurrent.every(result => result.status === 200));
  const concurrentRetry = payload(otherCardId);
  const retries = await Promise.all([call('', 'POST', concurrentRetry, peers[0]), call('', 'POST', concurrentRetry, peers[0])]);
  assert(retries.every(result => result.status === 200));
  assert.equal(retries[0].comment.id, retries[1].comment.id);
  for (let index = 1; index < 8; index++) assert.equal((await call('', 'POST', payload())).status, 200);
  assert.equal((await call('', 'POST', payload())).status, 429);
  // More than a page of fixtures verifies complete history and catch-up without live users.
  for (let index = 0; index < 72; index++) {
    await pool.query('INSERT INTO playtest_comments(id,world_id,card_id,player_id,display_name,body) VALUES($1,$2,$3,$4,$5,$6)',
      [randomUUID(), world.id, cardId, player.player.id, 'Fixture reader', `Comment ${index}`]);
  }
  const page = await call(`?card=${cardId}`);
  assert.equal(page.comments.length, 60);
  assert(page.hasMore && page.nextBefore);
  const older = await call(`?card=${cardId}&before=${page.nextBefore}`);
  assert.equal(new Set([...older.comments, ...page.comments].map(comment => comment.id)).size, 80);
  const caughtUp = await call(`?card=${cardId}&after=${first.comment.seq}`);
  assert.equal(caughtUp.comments.length, 60);
  assert(caughtUp.hasMore);
  const remaining = await call(`?card=${cardId}&after=${caughtUp.comments.at(-1).seq}`);
  assert.equal(remaining.comments.length, 19);
  assert((await call()).comments.some(comment => comment.card_id === otherCardId) === false);
  // Filtering hidden cards also applies to the full chat, even to old comments.
  await pool.query('UPDATE cards SET hidden=true WHERE id=$1', [cardId]);
  assert((await call()).comments.every(comment => comment.card_id !== cardId));
  await pool.query('UPDATE cards SET hidden=false WHERE id=$1', [cardId]);
  assert.deepEqual(await snapshot(), beforeMigration);
  console.log('PASS playtest API: additive migration preserves all story rows; authentication and world isolation; display names; idempotent retry; concurrent posts; hidden/draft/deleted exclusion; rate and size limits; complete pagination and catch-up; comments leave game revisions, authors, cards, paths and media unchanged.');
}
