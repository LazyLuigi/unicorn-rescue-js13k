// Checks that the game music schedules correctly in all 4 phases, with no invalid parameter.
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};window.SET=function(n,v){eval(n+'=v')};";
const main=createCanvas(390,780); const L={};
let ev=0, bad=[];
function chk(v,n){ if(!isFinite(v)) bad.push(n+'='+v); }
function param(n){ return {value:1,setValueAtTime(v,t){chk(v,n);chk(t,'t')},
  linearRampToValueAtTime(v,t){chk(v,n);chk(t,'t')},
  exponentialRampToValueAtTime(v,t){chk(v,n);chk(t,'t'); if(v<=0)bad.push('exp<=0 '+n);},
  setTargetAtTime(){}}; }
function node(){ return {connect(){},start(t){chk(t,'start');ev++},stop(t){chk(t,'stop')},
  frequency:param('f'),gain:param('g'),detune:param('d'),Q:param('q'),
  threshold:param('th'),ratio:param('r'),type:'',buffer:null}; }
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=780; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(L[k]=L[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0};
global.AudioContext=function(){ this.currentTime=0; this.state='running'; this.sampleRate=44100;
  this.destination={}; this.resume=()=>{};
  this.createOscillator=node; this.createGain=node; this.createBufferSource=node;
  this.createBiquadFilter=node; this.createDynamicsCompressor=node;
  this.createBuffer=(c,n)=>({getChannelData:()=>new Float32Array(n)}); };
new Function(js)(); const G=window.G, SET=window.SET;
L.keydown.forEach(f=>f({key:' ',preventDefault(){}}));   // starts the audio
const AC=G('AC'); G('startMusic')();
[['intro',()=>{SET('mode','title');SET('mist',1)}],
 ['run',()=>{SET('mode','play');SET('mist',0);SET('boss',null);SET('hyper',0)}],
 ['boss',()=>{SET('boss',{});SET('hyper',0)}],
 ['hyper',()=>{SET('boss',null);SET('hyper',1)}]].forEach(([n,set])=>{
  set(); ev=0; bad=[]; SET('musI',0); SET('musNext',0);
  for(let i=0;i<64;i++){ AC.currentTime=i*G('E8'); G('musTick')(); }
  console.log(n.padEnd(6),'events:',ev, bad.length?('PROBLEM '+bad.slice(0,3)):'ok'); });
