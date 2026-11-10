import {strict as assert} from 'node:assert';
import {SOURCE_RADIUS,sourceText} from '../public/source-node.js';
// Wide glyphs deliberately make the measurement conservative; check every rendered line's bounds.
const measure=(text,size)=>Array.from(text).reduce((width,c)=>width+(c===' '?.35:.95)*size,0),inset=SOURCE_RADIUS/Math.sqrt(2)-2;
for(const title of ['1 · Observatory','The door beyond the extraordinarily distant observatory','W'.repeat(60)])for(const detail of [false,true]){
 const lines=sourceText(measure,title,'I open the observatory and the sky is in a different place.',detail),heading=lines.filter(l=>l.weight===700);
 assert.equal(heading.map(l=>l.text).join('').replace(/\s/gu,''),title.replace(/\s/gu,''));
 for(const line of lines){assert(measure(line.text,line.size)<=inset*2+.01);assert(line.y-line.size>=-inset-.01);assert(line.y+line.size*.25<=inset+.01);}
}
console.log('PASS scenario titles retain every character and all title/body lines fit safely inside the enlarged circular source.');
