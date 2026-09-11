// Reproduces the reported crash: taking a hit during HYPER, which empties the
// bullet array in the middle of its own traversal.
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
let T=0; function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=1000/60; f(T); } }
run(30); for(let i=0;i<12;i++){ key(' ',1); key(' ',0); run(3); }   // skips the briefing
run(700);
// force hyper, then a wall of bullets right onto the ship
SET('charge',160); key(' ',1); key(' ',0); run(4);
console.log('hyper active:',!!G('hyper'));
SET('invul',0);
const P=G('P');
for(let i=0;i<40;i++) G('buls').push({x:P.x+(i%5-2),y:P.y-30-i*2,vx:0,vy:6,r:2,age:0});
run(40);
console.log('after impact: hyper',G('hyper'),'| lives',G('lives'),'| bullets',G('buls').length);
console.log('ERR:',G('ERR')||'none');
// and a second time, outside hyper this time, to check a normal death
SET('invul',0); SET('charge',0);
for(let i=0;i<40;i++) G('buls').push({x:P.x+(i%5-2),y:P.y-30-i*2,vx:0,vy:6,r:2,age:0});
run(80);
console.log('normal death: lives',G('lives'),'| ERR:',G('ERR')||'none');
