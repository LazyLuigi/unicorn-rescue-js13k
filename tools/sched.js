// Safeguard: the schedule table must stay sorted, and enemies must
// show up from the very start of the level.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(780,1400); const L={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=700; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G, SET=window.SET;
const key=(k,d)=>L[d?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
const SCHED=G('SCHED');
let sorted=true, prev=-1;
SCHED.forEach(w=>{ if(w[0]<prev) sorted=false; prev=w[0]; });
console.log('table sorted:', sorted?'yes':'NO (the level will stall)', '|', SCHED.length, 'entries');
let T=0; function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=1000/60; f(T); } }
run(20); for(let i=0;i<12;i++){ key(' ',1); key(' ',0); run(3); }
// record the enemy types met per progression slice
const seen={}; let firstSpawn=null;
for(let k=0;k<560;k++){ SET('invul',99); run(20);
  G('enemies').forEach(e=>{ seen[e.ty]=(seen[e.ty]||0)+0; if(!seen[e.ty]) seen[e.ty]=0; });
  G('enemies').forEach(e=>{ if(!(e.ty in seen)) seen[e.ty]=0; seen[e.ty]++; });
  if(firstSpawn===null&&G('enemies').length) firstSpawn=(G('scroll')-G('scr0'))|0;
}
console.log('first enemy at progression', firstSpawn, '(must be < 100)');
console.log('types met:', Object.keys(seen).sort().join(', '), '| final mode', G('mode'));
