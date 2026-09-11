// Checks that nothing is left on screen after the final death, and that
const fs_=require('fs'); fs_.mkdirSync('.shots',{recursive:true});
// stars are preserved after an intermediate death.
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
function clutter(){                     // fill the screen with everything that could linger
  const P=G('P');
  for(let i=0;i<15;i++) G('picks').push({x:20+i*10,y:60+i*8,vx:0,vy:.5,age:20,c:i%7,mag:0});
  for(let i=0;i<4;i++) G('unis').push({x:30+i*40,y:80+i*20,vx:.6,vy:-.4,age:5,jump:0});
  G('pop')(96,120,'X4 2400','#ffe27a',1); G('pop')(60,90,'CHAIN 20','#8ed0ff');
  G('spawn')(0,40,40); G('spawn')(6,150,60);
}
function state(t){ return t.padEnd(24)+' stars '+String(G('picks').length).padStart(2)+
  ' | unicorns '+G('unis').length+' | popups '+G('pops').length+
  ' | enemies '+G('enemies').length+' | particles '+String(G('parts').length).padStart(3)+
  ' | lives '+G('lives')+' | mode '+G('mode'); }
function kill(){ SET('invul',0); const P=G('P');
  for(let i=0;i<40;i++) G('buls').push({x:P.x,y:P.y-16-i*2,vx:0,vy:6,r:2,age:0}); run(50); }
run(20); for(let i=0;i<12;i++){ key(' ',1); key(' ',0); run(3); }
run(400); SET('invul',9999); SET('lives',3);
SET('picks',[]); SET('unis',[]); SET('pops',[]); clutter(); run(2);
console.log(state('before the 1st death'));
kill(); console.log(state('intermediate death'));
console.log('   -> the stars must have been preserved');
SET('lives',0); SET('invul',9999); run(80); clutter(); run(2);
console.log(state('before the final death'));
kill(); run(20); console.log(state('final death'));
run(200); console.log(state('4 s later'));
fs.writeFileSync('.shots/wipe.png',main.toBuffer('image/png'));
console.log('ERR', G('ERR')||'-');
