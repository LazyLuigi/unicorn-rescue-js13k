// Killing the tank must never trigger the victory, nor the boss alert.
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
run(20); for(let i=0;i<12;i++){ key(' ',1); key(' ',0); run(3); }
run(400); SET('invul',99999); SET('enemies',[]);
const e=G('spawn')(6,96,70);
console.log('at spawn        | boss =',G('boss')?'YES (bug)':'no','| y',e.y,'(must stay 70)');
const sc0=G('score');
G('hitEnemy')(e,99); run(6);
console.log('after its death | mode',G('mode'),'| boss',G('boss')?'YES (bug)':'no',
  '| score +'+(G('score')-sc0),'| unicorns',G('freed'),'| ERR',G('ERR')||'-');
// and the real level sequence, up to the final boss
let g=0; while(G('mode')=='play'&&g++<600){ SET('invul',99); run(30); }
console.log('full run        | mode',G('mode'),'| unicorns',G('freed'),'| ERR',G('ERR')||'-');
