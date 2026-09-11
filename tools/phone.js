// Renders the title screen at the exact geometry of an iPhone (390x844 @3), then crops
const fs_=require('fs'); fs_.mkdirSync('.shots',{recursive:true});
// a strip to judge real-world legibility.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(390*3,844*3); const L={};
global.window=global; global.self=global;
global.innerWidth=390; global.innerHeight=844; global.devicePixelRatio=3;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G;
const key=(k,d)=>L[d?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
let T=0; function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=16.7; f(T); } }
run(60);
if(process.argv[2]=='game'){ key(' ',1); key(' ',0); run(700);
  window.SET('charge',160); window.SET('isTouch',1); run(4); }
console.log('LW',G('LW'),'LH',G('LH'),'SC',G('SC').toFixed(3),'OX',G('OX'),'OY',G('OY'));
fs.writeFileSync('.shots/phone.png',main.toBuffer('image/png'));
