// Compares two sources with the same inputs, random numbers and clocks.
// Checks pixels, game state, Web Audio events and Wavedash calls.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const {createCanvas}=require('canvas');
const {minify}=require('terser');
const baseline=process.argv[2],candidate=process.argv[3]||'src/index.html';
if(!baseline)throw Error('Usage: node tools/equivalence.cjs baseline.html [candidate.html] [--minified] [--offline]');
const probe=`
window.__probe={
 state:function(){return [mode,t,scroll,land,score,lives,charge,hyper,ultra,freed,graze,combo,freeze,paused,seed,schedI,
  [P.x,P.y,P.tx,P.ty,P.bank],enemies.map(function(e){return[e.ty,e.x,e.y,e.hp,e.age,e.pat,e.pt]}),
  buls.map(function(b){return[b.x,b.y,b.vx,b.vy,b.r,b.gz]}),shots.map(function(s){return[s.x,s.y,s.dmg]}),
  picks.map(function(p){return[p.x,p.y,p.age,p.mag]}),unis.map(function(u){return[u.x,u.y,u.age,u.jump]}),parts.length,pops.length,ERR];},
 drive:function(i){if(mode!='play')return;invul=999;var target=enemies.filter(function(e){return e.y<P.y-20&&e.y>0}).sort(function(a,b){return abs(a.x-P.x)-abs(b.x-P.x)})[0];P.tx=target?target.x:LW/2;P.ty=LH-45;if(canAct()&&charge>=(i%1200<600?160:298))actP=1;},
 command:function(c){
  if(c=='start'){newGame();mist=0;}
  if(c=='blade'){charge=160;hyperOn(false);}
  if(c=='blast'){hyperOff();charge=300;hyperOn(true);}
  if(c=='enemies'){for(var i=0;i<7;i++)spawn(i,25+i*23,40+i*17,{uni:4});}
  if(c=='rescue'){var e=spawn(3,70,130,{uni:4});hitEnemy(e,999);}
  if(c=='hit'){hurt();}
  if(c=='death'){hyperOff();charge=0;invul=0;hurt();}
  if(c=='win'){var e=spawn(4,96,60);hitEnemy(e,999);}
  if(c=='music'){for(var i=0;i<64;i++)musStep(i,AC.currentTime+i*E8);}
  if(c=='touch'){isTouch=1;charge=300;}
 }
};`;
function execute(code,width,height,seedValue){
 let rng=seedValue>>>0,calls=0,frame=0,now=0,nextFrame,timers=[],listeners={},audioHash=2166136261,audioEvents=0,nodeId=0,audioContext;
 const digest=v=>{const s=JSON.stringify(v);for(let i=0;i<s.length;i++)audioHash=Math.imul(audioHash^s.charCodeAt(i),16777619)>>>0;audioEvents++;};
 const canvas=createCanvas(width,height),randMath=Object.create(Math);randMath.random=()=>{calls++;return(rng=Math.imul(rng,1664525)+1013904223>>>0)/4294967296;};
 const listen=(name,f)=>(listeners[name]||=[]).push(f);canvas.addEventListener=listen;
 function param(id,key){let val=1;const p={get value(){return val},set value(v){assert(Number.isFinite(v));val=v;digest([id,key,'value',v]);}};
  for(const k of ['setValueAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime','setTargetAtTime'])p[k]=(...a)=>{assert(a.every(Number.isFinite));digest([id,key,k,...a]);};return p;}
 function node(type){const id=++nodeId,n={__id:id,connect(other){digest([id,'connect',other.__id]);},start(at){digest([id,'start',at,this.type]);if(this.buffer){const a=this.buffer.__samples;for(let i=0;i<a.length;i+=31)digest(a[i]);}},stop(at){digest([id,'stop',at]);}};digest([id,type]);
  for(const k of ['gain','frequency','detune','threshold','ratio','Q'])n[k]=param(id,k);return n;}
 function Audio(){audioContext=this;this.currentTime=0;this.state='running';this.sampleRate=8000;this.destination={__id:0};
  this.resume=()=>{this.state='running';};this.suspend=()=>{this.state='suspended';};
  for(const type of ['Oscillator','Gain','DynamicsCompressor','BiquadFilter','BufferSource'])this['create'+type]=()=>node(type);
  this.createBuffer=(channels,n,rate)=>{const a=new Float32Array(n);digest(['buffer',channels,n,rate]);return{__samples:a,getChannelData:()=>a};};}
 const ctx={console,Math:randMath,innerWidth:width,innerHeight:height,devicePixelRatio:1,navigator:{maxTouchPoints:0},
  document:{getElementById:()=>canvas,createElement:()=>createCanvas(1,1)},addEventListener:listen,localStorage:{},AudioContext:Audio,
  setTimeout:(f,delay=0)=>timers.push({f,at:now+delay}),setInterval:(f,delay)=>timers.push({f,at:now+delay,delay}),
  requestAnimationFrame:f=>{nextFrame=f;},Wavedash:{init(){digest(['WD','init']);},getOrCreateLeaderboard(name,sort,display){digest(['WD','leaderboard',name,sort,display]);return{then(f){return f({success:true,data:{id:'test'}})}};}}
 };
 // Keep the public boundaries in the test, notably the score boolean.
 ctx.Wavedash.uploadLeaderboardScore=(id,score,force)=>{assert.equal(typeof force,'boolean');digest(['WD','score',id,score,force]);};
 if(process.argv.includes('--offline'))delete ctx.Wavedash;
 ctx.window=ctx;ctx.self=ctx;vm.runInNewContext(code,ctx);
 const api=ctx.__probe,records=[];
 function snapshot(label){records.push({label,pixels:crypto.createHash('sha256').update(canvas.toBuffer('raw')).digest('hex'),state:JSON.stringify(api.state()),rng,calls,audioHash,audioEvents});}
 function advance(n,drive){for(let i=0;i<n;i++){frame++;now=frame*1000/60;if(audioContext&&audioContext.state==='running')audioContext.currentTime+=1/60;
  const due=timers.filter(q=>q.at<=now);timers=timers.filter(q=>q.at>now);for(const q of due){q.f();if(q.delay){q.at+=q.delay;timers.push(q);}}
  if(drive)api.drive(i);nextFrame(now);if(frame%120===0)snapshot('frame '+frame);}}
 function key(k){for(const type of ['keydown','keyup'])for(const f of listeners[type]||[])f({key:k,preventDefault(){}});}
 advance(120);snapshot('title');key(' ');advance(160);snapshot('briefing');
 for(let i=0;i<12&&api.state()[0]==='title';i++){key(' ');advance(3);}advance(240);snapshot('dive');
 api.command('enemies');advance(120);snapshot('enemy types');
 api.command('music');api.command('blade');advance(90);snapshot('blade');api.command('music');
 api.command('hit');advance(100);snapshot('hit during blade');
 api.command('blast');advance(110);snapshot('blast');api.command('music');
 api.command('rescue');advance(50);snapshot('rescue');
 key('p');advance(60);snapshot('pause');key(' ');
 for(let i=0;i<3;i++){api.command('death');advance(45);}snapshot('game over');
 api.command('start');advance(11500,true);snapshot('complete level');
 api.command('win');advance(180);snapshot('victory');
 api.command('start');api.command('touch');advance(250);snapshot('touch');
 key('m');advance(60);snapshot('muted');return records;
}
(async()=>{
 const source=file=>fs.readFileSync(file,'utf8').match(/<script>([\s\S]*)<\/script>/)[1]+probe;
 let a=source(baseline),b=source(candidate);
 if(process.argv.includes('--minified')){
  const options=require('../build-options.cjs');
  a=(await minify(a,{compress:{passes:3,unsafe:true,unsafe_math:true,toplevel:true},mangle:{toplevel:true},format:{quote_style:1}})).code;
  b=(await minify(b,options)).code;
 }
 for(const [w,h,seed] of [[192,256,12345],[192,336,98765]]){
  const before=execute(a,w,h,seed),after=execute(b,w,h,seed);
  assert.equal(after.length,before.length);
  for(let i=0;i<before.length;i++)assert.deepEqual(after[i],before[i],`${w}x${h} ${before[i].label}`);
  console.log(`PASS ${w}x${h}: ${before.length} captures/states/audio/PRNG identical`);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
