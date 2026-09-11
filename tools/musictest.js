// Checks that the 3 tracks x 4 phases schedule notes without error, and
// counts events per phase to spot a silent or saturated phase.
const fs=require('fs');
const html=fs.readFileSync('lab/music-lab.html','utf8'); const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
let ev=0, bad=[];
function chk(v,name){ if(!isFinite(v)) bad.push(name+'='+v); }
function param(n){ return {value:1,setValueAtTime(v,t){chk(v,n);chk(t,'t')},
  linearRampToValueAtTime(v,t){chk(v,n);chk(t,'t')},
  exponentialRampToValueAtTime(v,t){chk(v,n);chk(t,'t'); if(v<=0) bad.push('exp<=0 '+n);}}; }
function node(){ return {connect(){},start(t){chk(t,'start');ev++},stop(t){chk(t,'stop')},
  frequency:param('freq'),gain:param('gain'),detune:param('det'),Q:param('Q'),
  threshold:param('th'),ratio:param('ra'),type:'',buffer:null,fftSize:0,frequencyBinCount:64,
  getByteFrequencyData(){}}; }
global.window=global; global.self=global;
const els={vol:{value:70,oninput:null},info:{textContent:''},foot:{innerHTML:''},
  grid:{innerHTML:'',appendChild(){}},stopAll:{onclick:null}};
function fake(){ return {style:{},className:'',textContent:'',innerHTML:'',width:0,height:0,
  appendChild(){},classList:{toggle(){}},children:[],onclick:null,
  getContext(){ return {fillRect(){},fillStyle:''}; }}; }
global.document={getElementById:(id)=>els[id]||fake(),createElement:fake};
global.requestAnimationFrame=()=>0;
let timers=[]; global.setInterval=(f)=>{timers.push(f);return timers.length}; global.clearInterval=()=>{};
global.AudioContext=function(){ this.currentTime=0; this.state='running'; this.sampleRate=44100;
  this.destination={}; this.resume=()=>{};
  this.createOscillator=node; this.createGain=node; this.createBufferSource=node;
  this.createBiquadFilter=node; this.createDynamicsCompressor=node; this.createAnalyser=node;
  this.createBuffer=(c,n)=>({getChannelData:()=>new Float32Array(n)}); };
const api=new Function(js+"\nreturn {TRACKS:TRACKS,start:start,stop:stop,tick:tick,PHASES:PHASES,cur:()=>cur,AC:()=>AC};")();
Object.keys(api.TRACKS).forEach(k=>{
  api.PHASES.forEach(p=>{ ev=0; api.stop(); api.start(k,p); const c=api.cur(); c.phase=p; c.step=0; c.next=0;
    const ac=api.AC();
    for(let i=0;i<64;i++){ ac.currentTime=i*c.S; api.tick(); }   // 4 bars
    console.log(k,p.padEnd(6),'audio events:',ev, bad.length?('PROBLEM '+bad.slice(0,3)):'ok');
    bad=[]; });
});
