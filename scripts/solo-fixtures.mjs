export function triangleGLB(overrides = {}) {
  const document = {asset: {version: '2.0'}, scene: 0, scenes: [{nodes: [0]}], nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1}]}], buffers: [{byteLength: 44}],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 36, target: 34962}, {buffer: 0, byteOffset: 36, byteLength: 6, target: 34963}],
    accessors: [{bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, 0, 0], max: [1, 1, 0]},
      {bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR'}], ...overrides};
  const source = Buffer.from(JSON.stringify(document));
  const json = Buffer.alloc(Math.ceil(source.length / 4) * 4, 32); source.copy(json);
  const binary = Buffer.alloc(44);
  [-1, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, index) => binary.writeFloatLE(value, index * 4));
  [0, 1, 2].forEach((value, index) => binary.writeUInt16LE(value, 36 + index * 2));
  const result = Buffer.alloc(12 + 8 + json.length + 8 + binary.length);
  result.writeUInt32LE(0x46546c67, 0); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12); result.writeUInt32LE(0x4e4f534a, 16); json.copy(result, 20);
  result.writeUInt32LE(binary.length, 20 + json.length); result.writeUInt32LE(0x004e4942, 24 + json.length); binary.copy(result, 28 + json.length);
  return result;
}
