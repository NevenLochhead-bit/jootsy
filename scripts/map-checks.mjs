import { strict as assert } from 'node:assert';
import { getDatabase } from '@netlify/database';
import { readFile } from 'node:fs/promises';
globalThis.window={Jootsy:{}};globalThis.d3=await import('d3-hierarchy');
const {layout}=await import('../public/map.js');
if(!process.env.CI_TEST_DATABASE)throw Error('Only run against the disposable CI Postgres service.');
const db=getDatabase({connectionString:process.env.NETLIFY_DB_URL});
// api-checks.mjs has already seeded and migrated the disposable stress world.
const w=(await db.pool.query("SELECT id FROM worlds WHERE slug='stress'")).rows[0];
const cs=(await db.pool.query('SELECT * FROM cards WHERE world_id=$1 ORDER BY seq',[w.id])).rows,ps=(await db.pool.query('SELECT * FROM paths WHERE world_id=$1 ORDER BY position',[w.id])).rows;
assert.equal(cs.filter(c=>c.type!=='scenario').length,300);assert.equal(ps.filter(p=>p.kind==='wormhole').length,40);assert.equal(ps.filter(p=>!p.to_card_id&&!p.deleted).length,0);assert.equal(Math.max(...cs.map(c=>c.depth)),12);
const before=performance.now(),a=layout(cs,ps),elapsed=performance.now()-before,b=layout(cs,ps);assert.deepEqual(a,b);assert.equal(a.nodes.length,307);
for(const n of a.nodes)assert(Math.abs(Math.hypot(n.x,n.y)-(240+170*n.depth)*a.factor)<.00001);
for(let i=0;i<a.nodes.length;i++)for(let j=i+1;j<a.nodes.length;j++){const x=a.nodes[i],y=a.nodes[j],wx=x.card?.type==='scenario'?40:20,wy=y.card?.type==='scenario'?40:20;assert(Math.abs(x.x-y.x)>=(wx+wy)/2||Math.abs(x.y-y.y)>=(wx+wy)*.7,`Overlapping nodes ${x.id} / ${y.id}`);}
assert(elapsed<1000,`Layout took ${elapsed} ms`);console.log(`PASS: stress 33 players, 300 cards, no blank Board paths, 40 wormholes, depth 12; deterministic layout; radial depth; no world-space node overlap. Layout ${elapsed.toFixed(1)} ms.`);await db.pool.end();
