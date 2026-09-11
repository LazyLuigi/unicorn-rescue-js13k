// Test in strict mode + fake AudioContext that validates parameters (like Safari)
const {createCanvas}=require('canvas'); const fs=require('fs');
const html=fs.readFileSync('src/index.html','utf8'); let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
js+="\n;window.G=function(n){return eval(n)};";
const main=createCanvas(390,700); const listeners={};
global.window=global; global.self=global; global.innerWidth=390; global.innerHeight=700; global.devicePixelRatio=2;
global.document={getElementById:()=>main,createElement:()=>createCanvas(1,1)};
global.addEventListener=(k,f)=>{(listeners[k]=listeners[k]||[]).push(f)}; main.addEventListener=global.addEventListener;
global.localStorage={}; let frames=[]; global.requestAnimationFrame=f=>frames.push(f);
global.setInterval=()=>0; global.setTimeout=(f)=>{f();return 0};
function param(){ return {value:1,setValueAtTime(v,t){chk(v,t)},linearRampToValueAtTime(v,t){chk(v,t)},exponentialRampToValueAtTime(v,t){chk(v,t); if(v<=0) throw new RangeError('exp ramp <=0');},setTargetAtTime(){}}; }
function chk(v,t){ if(!isFinite(v)||!isFinite(t)) throw new TypeError('non-finite audio param '+v+' '+t); }
function node(){ return {connect(){},start(t){if(t!=null)chk(t,0)},stop(t){chk(t,0)},frequency:param(),gain:param(),detune:param(),type:'',buffer:null}; }
global.AudioContext=function(){ this.currentTime=0; this.state='running'; this.sampleRate=44100; this.destination={}; this.resume=()=>{};
  this.createOscillator=node; this.createGain=node; this.createBufferSource=node; this.createBiquadFilter=node;
  this.createBuffer=(c,n,r)=>{ if(!(n>0)) throw new Error('bad buffer len'); return {getChannelData:()=>new Float32Array(n)}; }; };
new Function(js)();
const G=window.G; const key=(k,down)=>listeners[down?'keydown':'keyup'].forEach(f=>f({key:k,preventDefault(){}}));
let T=0;
function run(n){ for(let i=0;i<n;i++){ const f=frames.shift(); T+=1000/60; f(T); } }
run(10); key(' ',1); key(' ',0); run(5); key(' ',1);
G('P').tx=96; let g=0, lastL=3;
while(G('mode')=='play'&&g++<400){ run(30); if(G('lives')<lastL){ lastL=G('lives'); console.log('death, lives',lastL,'ok'); } }
console.log('end mode',G('mode'),'score',G('score'));
// test hyper + bomb + death during hyper
key(' ',1); key(' ',0); run(5); G('window').charge=300; key(' ',1); key(' ',0); run(20); key(' ',1); key(' ',0); run(60); console.log('hyper/bomb ok');
