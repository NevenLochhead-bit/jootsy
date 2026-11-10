import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {soundType,mediaResponse} from '../netlify/functions/lib/media.mjs';
const mp3=await readFile('tests/fixtures/tone.mp3'),m4a=await readFile('tests/fixtures/tone.m4a'),wav=await readFile('tests/fixtures/refused.wav');
assert.equal(soundType(mp3).contentType,'audio/mpeg');assert.equal(soundType(m4a).contentType,'audio/mp4');assert.equal(soundType(wav),null);assert.equal(soundType(Buffer.from('ID3fake')),null);assert.equal(soundType(Buffer.alloc(3_000_000)),null);
for(const [range,status,size]of [['bytes=0-1',206,2],['bytes=-10',206,10],['bytes=10-',206,mp3.length-10],['bytes=9999999-',416,0],['bytes=2-1',416,0],['bytes=-0',416,0]]){const r=mediaResponse(new Request('https://example.test/media',{headers:{range}}),mp3,'audio/mpeg');assert.equal(r.status,status);assert.equal((await r.arrayBuffer()).byteLength,size);}
const head=mediaResponse(new Request('https://example.test/media',{method:'HEAD'}),m4a,'audio/mp4');assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),String(m4a.length));assert.equal((await head.arrayBuffer()).byteLength,0);
console.log('PASS content-sniffed MP3/M4A; WAV/fake/oversize rejection; bounded/open/suffix ranges; 416; HEAD metadata.');
const {videoType,VIDEO_ERROR}=await import('../netlify/functions/lib/media.mjs');
const clip=await readFile('tests/fixtures/clip.mp4'),mov=await readFile('tests/fixtures/refused.mov');
assert.equal(videoType(clip).contentType,'video/mp4');
for(const bytes of [mov,m4a,Buffer.from('ftypfake'),Buffer.alloc(6_000_000)])assert.equal(videoType(bytes),null);
const vr=mediaResponse(new Request('https://example.test/media',{headers:{range:'bytes=0-1'}}),clip,'video/mp4');assert.equal(vr.status,206);assert.equal(vr.headers.get('content-type'),'video/mp4');
console.log('PASS content-inspected MP4 video; QuickTime MOV/audio-only/fake/6 MB rejection; shared video Range handling.');
