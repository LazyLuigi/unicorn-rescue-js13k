// Plots enemy density over the whole first half of the level.
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
SET('shots',[]);   // no shooting, to see the waves as they are
const orig=G('shoot'); window.shoot=function(){};
let line='';
for(let k=0;k<44;k++){ SET('invul',99); run(60);
  const prog=(G('scroll')-G('scr0'))|0, n=G('enemies').length;
  line+= n===0?'.':(n<3?String(n):(n<10?String(n):'+'));
  if(k%11==10) { console.log(String(prog).padStart(5), line); line=''; }
}
