const PAGE_SIZE = 60;

export async function playtestComments({c, w, p, req, url, fail, text}) {
  if (!['GET', 'POST'].includes(req.method)) fail(405, 'method', 'Use GET or POST for playtest comments.');
  const cardId = url.searchParams.get('card');
  const before = url.searchParams.get('before');
  const after = url.searchParams.get('after');
  const uuid = value => {
    if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      fail(400, 'invalid', 'That card or comment ID is not valid.');
    }
    return value;
  };
  for (const value of [before, after]) {
    if (value !== null && (!/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n)) {
      fail(400, 'cursor', 'That comment position is not valid.');
    }
  }
  if (before && after) fail(400, 'cursor', 'Choose one comment position.');
  const visibleCard = async id => {
    const found = (await c.query('SELECT id FROM cards WHERE id=$1 AND world_id=$2 AND NOT deleted AND NOT draft AND NOT hidden', [uuid(id), w.id])).rows[0];
    if (!found) fail(404, 'card', 'Comments are available on visible, committed cards.');
  };
  if (req.method === 'GET') {
    if (cardId) await visibleCard(cardId);
    const rows = (await c.query(`
      SELECT m.id, m.seq::text, m.card_id, m.display_name, m.body, m.created_at
      FROM playtest_comments m JOIN cards a ON a.id=m.card_id AND a.world_id=m.world_id
      WHERE m.world_id=$1 AND NOT a.deleted AND NOT a.draft AND NOT a.hidden
        AND ($2::uuid IS NULL OR m.card_id=$2)
        AND ($3::bigint IS NULL OR m.seq<$3)
        AND ($4::bigint IS NULL OR m.seq>$4)
      ORDER BY m.seq ${after ? 'ASC' : 'DESC'} LIMIT ${PAGE_SIZE + 1}
    `, [w.id, cardId, before, after])).rows;
    const hasMore = rows.length > PAGE_SIZE;
    const comments = rows.slice(0, PAGE_SIZE);
    if (!after) comments.reverse();
    return {comments, hasMore, nextBefore: !after && hasMore ? comments[0].seq : null};
  }
  if (!req.headers.get('content-type')?.includes('application/json')) fail(415, 'content', 'Send a comment as JSON.');
  const input = req.body?.getReader();
  if (!input) fail(400, 'comment', 'Write a comment first.');
  const chunks = [];
  let bytes = 0;
  while (true) {
    const {done, value} = await input.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 8192) {
      await input.cancel();
      fail(413, 'size', 'Keep your comment under 1,000 characters.');
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  const body = JSON.parse(raw);
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'comment', 'Write a comment first.');
  const id = uuid(body.id);
  const name = text(typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : body.name, 40, 'Display name');
  const message = text(body.body, 1000, 'Comment');
  if (name.includes('\0') || message.includes('\0')) fail(400, 'comment', 'Remove null characters from your comment.');
  await visibleCard(body.card_id);
  const previous = (await c.query('SELECT * FROM playtest_comments WHERE id=$1', [id])).rows[0];
  if (previous) {
    if (previous.player_id !== p.id || previous.world_id !== w.id || previous.card_id !== body.card_id || previous.body !== message || previous.display_name !== name) {
      fail(409, 'comment', 'This comment ID has already been used.');
    }
    return {comment: publicComment(previous)};
  }
  const recent = (await c.query("SELECT count(*) AS n FROM playtest_comments WHERE player_id=$1 AND created_at>now()-interval '1 minute'", [p.id])).rows[0];
  if (Number(recent.n) >= 8) fail(429, 'rate', 'Give the chat a moment, then try again.');
  const added = (await c.query(`INSERT INTO playtest_comments(id,world_id,card_id,player_id,display_name,body)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`, [id, w.id, body.card_id, p.id, name, message])).rows[0];
  return {comment: publicComment(added)};
}

function publicComment(row) {
  return {id: row.id, seq: String(row.seq), card_id: row.card_id, display_name: row.display_name,
    body: row.body, created_at: row.created_at};
}
