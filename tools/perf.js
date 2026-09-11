// Measures the cost of each frame around a base rescue, to tell a real
// computation spike from a deliberate hitstop.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(390*2,844*2); const L={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=844; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G, SET=window.SET;
const key=(k,d)=>L[d?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
let T=0; const times=[];
function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); const a=process.hrtime.bigint();
  T+=1000/60; f(T); times.push(Number(process.hrtime.bigint()-a)/1e6); } }
run(30); key(' ',1); key(' ',0); run(3);
let g=0; while(!G('enemies').some(e=>e.ty==3) && g++<400){ SET('invul',9); run(10); }
console.log('base found after',g*10,'frames');
let base=G("enemies").find(e=>e.ty==3); if(!base){ base=G("spawn")(3,96,60,{uni:4}); run(40); }
SET('invul',999);
// two rescues in a row: if the spike does not reappear, it is noise
for(let k=0;k<2;k++){
  times.length=0; run(30);
  const before=times.reduce((a,b)=>a+b,0)/times.length;
  const b2=G('spawn')(3,96,60,{uni:4}); run(30);
  times.length=0; G('hitEnemy')(b2,999); run(60);
  const mx=Math.max(...times);
  console.log('trial',k,'| before',before.toFixed(2),'ms | after avg',
    (times.reduce((a,b)=>a+b,0)/times.length).toFixed(2),'ms | peak',mx.toFixed(2),'ms at frame',times.indexOf(mx),
    '| parts',G('parts').length); }
