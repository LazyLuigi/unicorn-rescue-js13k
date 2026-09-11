// Lets the autopilot play full runs, without rendering, and measures what
// matters for the capture: deaths, victory, power alternation.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8');
let js=html.match(/<script>([\s\S]*)<\/script>/)[1]+"\n"+fs.readFileSync('tools/autopilot.js','utf8');
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(780,1400); const L={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=700; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0}; global.AudioContext=undefined;
new Function(js)(); const G=window.G, SET=window.SET;
SET('render',function(){});                // no rendering: only the game is measured
// record the cause of every hit taken
let causes=[]; const _hurt=G('hurt');
SET('hurt',function(){ const P=G('P'); let db=1e9,de=1e9,te=null;
  G('buls').forEach(b=>{ db=Math.min(db,Math.hypot(b.x-P.x,b.y-P.y)); });
  G('enemies').forEach(e=>{ const d=Math.hypot(e.x-P.x,e.y-P.y); if(d<de){de=d;te=e.ty;} });
  causes.push((db<de?'bullet':'body t'+te)+'@'+((G('scroll')-G('scr0'))|0)+(G('hyper')?'(power)':''));
  _hurt(); });
const runs=+(process.argv[2]||3);
let T=0; function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=1000/60; f(T); } }
for(let r=0;r<runs;r++){
  SET('AUTO.loop',0); causes=[];
  if(r>0){ SET('endT',999); G('menuOk')(); }      // back to the title for the next run
  let f=0; while(f<60*60*9){ run(60); f+=60; if(G('mode')=='over'||G('mode')=='win') break; }
  const uses=G('AUTO.uses'), alt=uses.every((u,i)=>i==0||u!=uses[i-1]);
  console.log('run',r+1,'|',G('mode').padEnd(5),'| duration',(f/60|0)+'s',
    '| deaths',G('AUTO.deaths'),'| score',G('score'),'| unicorns',G('freed'),
    '| powers',uses.join('>')||'-','| alternation',alt?'ok':'BROKEN','| ERR',G('ERR')||'-');
  console.log('        hits:',causes.join('  ')||'none');
}
