// Checks the end loop: the shaking stops, the island sinks back, the clouds
const fs_=require('fs'); fs_.mkdirSync('.shots',{recursive:true});
// return, and the title screen is clean.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(390*3,844*3); const L={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=844; global.devicePixelRatio=3;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G, SET=window.SET;
const key=(k,d)=>L[d?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
let T=0; function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=1000/60; f(T); } }
function st(tag){ console.log(tag.padEnd(22),'mode',G('mode').padEnd(6),
  '| shake',G('shake').toFixed(2).padStart(5),'| land',G('land').toFixed(2),
  '| clouds',String(G('clouds').length).padStart(3),
  '| enemies',G('enemies').length,'| enemy bullets',String(G('buls').length).padStart(2),
  '| my shots',String(G('shots').length).padStart(2),
  '| stars',String(G('picks').length).padStart(2),'| particles',String(G('parts').length).padStart(3),
  '| unicorns',G('unis').length,'| popups',G('pops').length,
  '| ERR',G('ERR')||'-'); }
run(20); for(let i=0;i<12;i++){ key(' ',1); key(' ',0); run(3); }
run(500); st('in game');
// force the death
// deliberately clutter the screen before dying
const P=G('P');
for(let i=0;i<20;i++) G('picks').push({x:20+i*8,y:60+i*6,vx:0,vy:.5,age:20,c:i%7,mag:0});
G('spawn')(0,40,40); G('spawn')(0,150,60);
G('shots').push({x:96,y:100,vx:0,vy:-6,dmg:1,c:0},{x:90,y:80,vx:0,vy:-6,dmg:1,c:1});
run(2); st('before death');
// a unicorn in flight and a popup in progress, as in the screenshot
G('unis').push({x:60,y:80,vx:.6,vy:-.4,age:10,jump:0});
G('pops').push({x:96,y:120,s:'2000',c:'#fff',vy:-1,l:40,big:0});
SET('lives',1); SET('invul',0); SET('charge',0); run(2); st('before second-to-last');
// a death with lives remaining: the stars must survive
for(let i=0;i<30;i++) G('buls').push({x:P.x,y:P.y-20-i*2,vx:0,vy:6,r:2,age:0});
run(50); st('death, 1 life left');
SET('lives',0); SET('invul',0);
for(let i=0;i<30;i++) G('buls').push({x:P.x,y:P.y-20-i*2,vx:0,vy:6,r:2,age:0});
run(45); st('right after death');
run(60); st('+1 s');  run(180); st('+4 s'); run(240); st('+8 s');
fs.writeFileSync('.shots/loop1.png',main.toBuffer('image/png'));
// back to the title
key(' ',1); key(' ',0); run(30); st('back to title');
fs.writeFileSync('.shots/loop2.png',main.toBuffer('image/png'));
