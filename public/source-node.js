export const SOURCE_RADIUS=36;

function wrap(text,width,measure){
 const lines=[];let line='';
 for(const word of text.trim().split(/\s+/u).filter(Boolean)){
  const candidate=line?`${line} ${word}`:word;
  if(measure(candidate)<=width){line=candidate;continue;}
  if(line){lines.push(line);line='';}
  for(const letter of Array.from(word)){if(line&&measure(line+letter)>width){lines.push(line);line='';}line+=letter;}
 }
 if(line)lines.push(line);return lines;
}

// All text fits an inset square inscribed in the circle. Measure only on graph/font changes.
export function sourceText(measure,title,body='',detail=false){
 const inset=SOURCE_RADIUS/Math.sqrt(2)-2,width=inset*2;
 let size=6.6,lines=[];
 do{lines=wrap(title,width,text=>measure(text,size,700));if(lines.length*size*1.25<=(detail?30:inset*2))break;size-=.2;}while(size>3);
 const bodySize=4.5,bodyLines=detail?wrap(body,width,text=>measure(text,bodySize,500)).slice(0,2):[];
 if(bodyLines.length&&wrap(body,width,text=>measure(text,bodySize,500)).length>2){let last=bodyLines.at(-1);while(last&&measure(last+'…',bodySize,500)>width)last=last.slice(0,-1);bodyLines[bodyLines.length-1]=last.trimEnd()+'…';}
 const height=lines.length*size*1.25+(bodyLines.length?3+bodyLines.length*bodySize*1.25:0),top=-height/2;
 return [...lines.map((text,i)=>({text,size,weight:700,y:top+size+i*size*1.25})),...bodyLines.map((text,i)=>({text,size:bodySize,weight:500,y:top+lines.length*size*1.25+3+bodySize+i*bodySize*1.25}))];
}

export function sourceSprites(makeCanvas){
 const halo=makeCanvas(),core=makeCanvas();halo.width=halo.height=256;core.width=core.height=128;
 let g=halo.getContext('2d'),gradient=g.createRadialGradient(128,128,0,128,128,128);
 for(const [stop,color]of [[0,'#fff5bd99'],[.32,'#dfffc966'],[.56,'#9bf4d436'],[.8,'#8ba8ce12'],[1,'#8ba8ce00']])gradient.addColorStop(stop,color);
 g.fillStyle=gradient;g.fillRect(0,0,256,256);
 g=core.getContext('2d');gradient=g.createRadialGradient(58,43,5,64,64,64);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.65,'#fffde5');gradient.addColorStop(1,'#c8eddc');
 g.fillStyle=gradient;g.beginPath();g.arc(64,64,63,0,Math.PI*2);g.fill();return {halo,core};
}

export function drawSource(ctx,lines,k,sprites,selected=false){
 const r=SOURCE_RADIUS;ctx.drawImage(sprites.halo,-r*2.25,-r*2.25,r*4.5,r*4.5);ctx.drawImage(sprites.core,-r,-r,r*2,r*2);
 ctx.strokeStyle='#eaffcb';ctx.lineWidth=1.2/k;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#bbf5df';ctx.lineWidth=.8/k;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r+3/k,i*Math.PI*2/3+.08,(i+1)*Math.PI*2/3-.08);ctx.stroke();}
 ctx.fillStyle='#172b2c';ctx.textAlign='center';ctx.textBaseline='alphabetic';
 for(const line of lines){ctx.font=`${line.weight} ${line.size}px "Space Grotesk",system-ui,sans-serif`;ctx.fillText(line.text,0,line.y);}
 if(selected){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5/k;ctx.beginPath();ctx.arc(0,0,r+7/k,0,Math.PI*2);ctx.stroke();}
}
