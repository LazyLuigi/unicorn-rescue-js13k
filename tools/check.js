// Checks that no shot is fired during the title or during the descent.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(390*2,844*2); const L={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=844; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G;
const key=(k,d)=>L[d?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
let T=0, maxTitle=0, maxDive=0, firstShotLand=null;
function run(n,tag){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=1000/60; f(T);
  const ns=G('shots').length;
  if(tag=='title') maxTitle=Math.max(maxTitle,ns);
  if(tag=='dive'){ maxDive=Math.max(maxDive,ns);
    if(ns&&firstShotLand==null) firstShotLand=G('land'); } } }
run(120,'title');
// the briefing must now be skipped before diving
for(let i=0;i<16 && G('mode')=='title';i++){ key(' ',1); key(' ',0); run(3,'title'); }
console.log('mode after the briefing:',G('mode'));
run(200,'dive');
console.log('shots during the title:',maxTitle);
console.log('shots during the descent:',maxDive,'| land at first shot:',firstShotLand==null?'-':firstShotLand.toFixed(2));
console.log('final land',G('land').toFixed(2),'| mode',G('mode'),'| ERR',G('ERR')||'-');
