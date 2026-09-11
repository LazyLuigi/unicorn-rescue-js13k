// Pits hyper and ultra against an identical curtain of bullets.
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
run(60);
// the briefing must be skipped before the run starts
for(let i=0;i<16 && G('mode')=='title';i++){ key(' ',1); key(' ',0); run(3); }
run(700);
function trial(mode){
  SET('enemies',[]); SET('buls',[]); SET('picks',[]); SET('parts',[]); SET('queue',[]); SET('schedI',9999);
  SET('hyper',0); SET('ultra',0); SET('charge',mode=='ultra'?300:160);
  key(' ',1); key(' ',0); run(2);
  SET('invul',9999); const c0=G('charge');
  // curtain of 60 bullets straight onto the beam
  for(let i=0;i<60;i++) G('buls').push({x:G('P').x+(i%7-3)*2,y:-i*4,vx:0,vy:2,r:2,age:0});
  for(let k=0;k<120;k++){ G('queue').length=0; G('enemies').length=0; run(1); }
  console.log(mode.padEnd(5),'| bullets left',String(G('buls').length).padStart(3),
    '| stars spawned',String(G('picks').length).padStart(3),
    '| charge',c0.toFixed(0),'->',G('charge').toFixed(0)); }
trial('hyper'); trial('ultra');
