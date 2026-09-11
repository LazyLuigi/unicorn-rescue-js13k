const {createCanvas}=require('canvas'); const fs=require('fs');
const fs_=require('fs'); fs_.mkdirSync('.shots',{recursive:true});
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(390,780); const listeners={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=780; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(listeners[k]=listeners[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G, SET=window.SET;
const key=(k,d)=>listeners[d?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
let T=0; function run(n){ for(let i=0;i<n;i++){ const P=G('P'); if(P&&G('mode')=='play'){ let b=null,bd=1e9;
  G('enemies').forEach(e=>{ if(e.y<P.y-20&&e.y>-10){const d=Math.abs(e.x-P.x); if(d<bd){bd=d;b=e}} });
  P.tx=b?b.x:G('LW')/2; P.ty=G('LH')-50; SET('invul',9); } const f=frames.shift(); T+=1000/60; f(T); } }
function snap(n){ fs.writeFileSync('.shots/'+n+'.png',main.toBuffer('image/png')); console.log(n,'|mode',G('mode'),'|scroll',G('scroll')|0,'|score',G('score'),'|freed',G('freed'),'|ERR:',G('ERR')||'-'); }
snap('t0'); run(90); snap('title');
key(' ',1); key(' ',0); run(3); key(' ',1);
run(20); snap('intro1'); run(60); snap('intro2');
run(600); SET('charge',160); key(' ',1); key(' ',0); run(25); snap('hyper');
run(400); SET('charge',300); key(' ',1); key(' ',0); run(25); snap('ultra');
run(60); snap('ultra2');
let g=0; while(G('scroll')<2100&&g++<200) run(60);
run(240); snap('mini');
while(!G('boss')&&G('scroll')<4700&&g++<400) run(60);
run(200); snap('boss'); console.log('final ERR:',G('ERR')||'-');
