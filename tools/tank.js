// Checks the ground tank: shells originate below the hull, and it never fires backward.
const fs_=require('fs'); fs_.mkdirSync('.shots',{recursive:true});
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
run(20); for(let i=0;i<12;i++){ key(' ',1); key(' ',0); run(3); }
run(400); SET('invul',99999);
const P=G('P');
function trial(name, py){
  SET('enemies',[]); SET('buls',[]); P.ty=py; P.y=py; run(3);
  const e=G('spawn')(6, 96, 80); e.cd=1;
  let ok=true, below=0, tot=0, backward=0, minY=99;
  for(let f=0;f<8;f++){ const n0=G('buls').length; run(1);
    const nb=G('buls');
    for(let i=n0;i<nb.length;i++){ tot++;
      const b=nb[i];
      if(b.y>e.y) below++; else minY=Math.min(minY,b.y-e.y);
      if(b.vy<0) backward++; }
  }
  console.log(name.padEnd(26),'shells',String(tot).padStart(2),
    '| fired from below the hull',below+'/'+tot,
    '| shots fired backward',backward);
}
trial('player below (normal)', 240);
trial('player right behind', 40);
console.log('ERR', G('ERR')||'-');
// screenshot with a tank on screen
SET('enemies',[]); P.ty=G('LH')-40; run(4); const e=G('spawn')(6,96,70); e.cd=1; run(30);
fs.writeFileSync('.shots/tank_game.png',main.toBuffer('image/png'));
