import {strict as assert} from 'node:assert';
import {inspectGLB, inspectSoloMedia} from '../netlify/functions/lib/solo-media.mjs';
import {triangleGLB} from './solo-fixtures.mjs';

const glb = triangleGLB();
assert(inspectGLB(glb));
assert.equal(inspectSoloMedia('model', glb).contentType, 'model/gltf-binary');
assert(!inspectGLB(Buffer.from('a renamed model.glb')));
assert(!inspectGLB(Buffer.alloc(4_000_001)));
for (const offset of [0, 4, 8, 12, 16]) {
  const corrupted = Buffer.from(glb); corrupted.writeUInt32LE(1, offset);
  assert(!inspectGLB(corrupted));
}
assert(!inspectGLB(triangleGLB({meshes: []})));
assert(!inspectGLB(triangleGLB({buffers: [{byteLength: 44, uri: 'https://example.test/private.bin'}]})));
assert(!inspectGLB(triangleGLB({images: [{uri: 'file:///private/texture.png'}]})));
assert(!inspectGLB(triangleGLB({buffers: [{byteLength: 9000}]})));
assert(inspectGLB(triangleGLB({images: [{uri: 'data:image/png;base64,AAAA'}]})));
console.log('PASS Solo GLB inspection: valid embedded geometry; header, version, size, chunk bounds and buffer lengths; external files and renamed uploads rejected.');
