import {strict as assert} from 'node:assert';
import {buildWires,wirePoint,wireVisible} from '../public/wires.js';
const a={id:'a',x:0,y:0,radius:0,angle:0},b={id:'b',parentId:'a',kind:'destiny',x:0,y:100,radius:100,angle:Math.PI/2},paths=[{id:'link',kind:'wormhole',from_card_id:'b',to_card_id:'a'},{id:'private',kind:'jootsy',from_card_id:'a',to_card_id:'b',draft:true}];
const edges=buildWires([a,b],paths);assert.equal(edges.length,2);for(const edge of edges){assert.deepEqual(wirePoint(edge,0),{x:edge.points[0].x,y:edge.points[0].y});assert.deepEqual(wirePoint(edge,1),{x:edge.points[3].x,y:edge.points[3].y});assert(edge.duration>=3300&&edge.duration<=4000);assert(wireVisible(edge,{minX:-1,maxX:1,minY:-1,maxY:1}));assert(!wireVisible(edge,{minX:500,maxX:600,minY:500,maxY:600}));}assert.deepEqual(buildWires([a,b],paths),edges);
console.log('PASS cached wire geometry, source-to-target travel, staggered 3.3–4s phases, viewport bounds and private-link exclusion.');
