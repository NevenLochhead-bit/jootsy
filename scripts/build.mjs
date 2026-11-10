import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await mkdir('dist/vendor', { recursive: true });
await cp('node_modules/d3-hierarchy/dist/d3-hierarchy.min.js', 'dist/vendor/d3-hierarchy.js');
console.log('Jootsy static client ready.');
