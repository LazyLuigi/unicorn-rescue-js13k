// Measures the tank's lateral drift: peak speed and sway amplitude.
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
const e=G('spawn')(6,96,60); e.ph=0; e.cd=9999;
let prev=e.x, vmax=0, xmin=9e9, xmax=-9e9;
for(let f=0;f<400;f++){ run(1); const dx=Math.abs(e.x-prev); if(dx>vmax) vmax=dx;
  prev=e.x; xmin=Math.min(xmin,e.x); xmax=Math.max(xmax,e.x); if(e.y>G('LH')) break; }
console.log('peak lateral speed :', (vmax*60).toFixed(1), 'px/s');
console.log('sway width         :', (xmax-xmin).toFixed(1), 'px out of 192 wide');
console.log('vertical speed     :', (G('spd')*60).toFixed(1), 'px/s (= ground speed, it does not slide)');
