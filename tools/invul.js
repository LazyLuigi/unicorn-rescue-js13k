// Checks the 3 s of invulnerability when either power is activated.
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
run(500);
function trial(name, charge){
  SET('hyper',0); SET('ultra',0); SET('invul',0); SET('charge',charge);
  SET('buls',[]); SET('enemies',[]); run(2);
  const lives0=G('lives');
  key(' ',1); key(' ',0); run(2);
  const inv0=G('invul');
  // spray the ship for the whole window
  let hitAt=null;
  for(let f=0;f<230;f++){
    const P=G('P'); G('buls').push({x:P.x,y:P.y-6,vx:0,vy:4,r:2,age:0});
    run(1);
    if(hitAt===null&&(G('lives')<lives0||!G('hyper'))) hitAt=f;
  }
  console.log(name.padEnd(16),'invul at activation',String(inv0).padStart(3),
    '('+(inv0/60).toFixed(1)+' s) | first hit taken at frame',
    hitAt===null?'never':hitAt, '| lives',G('lives'));
}
trial('HORN BLADE', 160);
trial('RAINBOW BLAST', 300);
console.log('ERR', G('ERR')||'-');
