// Real game + strict fake SDK: no platform connection or initialization.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('canvas');
const ids=new Set(require('../wavedash/achievements.json').achievements.map(a=>a.identifier));
const boards=require('../wavedash/leaderboards.json').leaderboards;
const source=fs.readFileSync(process.argv[2]||'src/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const probe=`
self.test={
 start:function(){newGame();mist=0;},
 landed:function(){newGame();mist=0;land=1;flyin=0;P.x=P.tx=96;P.y=P.ty=180;},
 clock:function(){return [t,runStart,land,paused];},
 pause:function(v){setPause(v);},
 rescue:function(){freeBase(spawn(3,70,80,{uni:2}));},
 power:function(full){charge=full?300:150;hyperOn(full);},
 combo:function(n){combo=n-1;hitEnemy(spawn(0,20,40),99);},
 graze:function(n){graze=n-1;hyper=freeze=invul=flyin=0;P.x=P.tx=96;P.y=P.ty=180;buls=[{x:101,y:180,vx:0,vy:0,r:1}];updPlayer();},
 save:function(){hyper=freeze=0;charge=150;hurt();actP=1;step();},
 defeatMiniboss:function(){bossDie(spawn(5,96,40));},
 win:function(n,s,l){freed=n-7;score=s;lives=l;bossDie(spawn(4,96,40));},
 loss:function(){hyper=0;charge=0;lives=1;score=12345;hurt();for(var i=0;i<31;i++)step();},
 finish:function(n,s,l){mode='win';freed=n;score=s;lives=l;LB();},
 error:function(){return ERR;}
};`;
const tick=()=>new Promise(r=>setTimeout(r,10));
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function make(code,{absent=false,scenario='',statsGate,boardGate}={}){
 const calls=[],violations=[],unlocked=new Set();
 const validate=(x,message)=>{if(!x)violations.push(message)};
 const sdk={
  init(){calls.push(['init']);},
  requestStats(){calls.push(['stats']);return statsGate?statsGate.promise:Promise.resolve({success:true,data:true});},
  getAchievement(id){validate(ids.has(id),'unknown achievement '+id);return unlocked.has(id);},
  setAchievement(id,store){validate(ids.has(id)&&store===true,'achievement arguments');calls.push(['award',id]);unlocked.add(id);return true;},
  getOrCreateLeaderboard(name,sort,display){
   const b=boards.find(b=>b.name===name);validate(b&&b.sort_order===sort&&b.display_type===display,'board options '+name);
   calls.push(['board',name]);return (boardGate?boardGate.promise:Promise.resolve()).then(()=>({success:true,data:{id:name}}));
  },
  uploadLeaderboardScore(id,value,keep){
   validate(boards.some(b=>b.name===id)&&Number.isInteger(value)&&value>=0&&keep===true,'score arguments');
   calls.push(['score',id,value]);return Promise.resolve({success:true});
  }
 };
 const [method,failure]=scenario.split(':');
 if(failure==='missing')delete sdk[method];
 if(failure==='throw')sdk[method]=()=>{throw Error(scenario)};
 if(failure==='reject')sdk[method]=()=>Promise.reject(Error(scenario));
 if(failure==='false')sdk[method]=()=>Promise.resolve({success:false});
 const canvas=createCanvas(192,256),ctx={console,innerWidth:192,innerHeight:256,devicePixelRatio:1,
  document:{getElementById:()=>canvas,createElement:()=>createCanvas(1,1)},addEventListener(){},
  localStorage:{},setInterval(){},setTimeout(){},requestAnimationFrame(f){ctx.frame=f}};
 canvas.addEventListener=()=>{};
 ctx.window=ctx.self=ctx;if(!absent)ctx.Wavedash=sdk;vm.runInNewContext(code,ctx);let ts=0;
 return {api:ctx.test,calls,violations,unlocked,advance(n){for(let i=0;i<n;i++)ctx.frame(ts+=1000/60)}};
}
(async()=>{
 const errors=[];process.on('unhandledRejection',e=>errors.push(e.message));
 const input=source+probe,minified=(await require('terser').minify(input,require('../build-options.cjs'))).code;
 for(const [label,code] of [['source',input],['minified',minified]]){
  for(const options of [{absent:true}]){
   const g=make(code,options);g.api.landed();g.api.rescue();g.api.power(true);g.api.win(43,100000,3);await tick();
   assert.deepEqual(g.calls,[],'no platform calls without the SDK');assert.equal(g.api.error(),'');
  }
  for(const response of [{success:true,data:false},{success:true},{success:true,data:1},{success:false,data:true}]){
   const gate=deferred(),r=make(code,{statsGate:gate});r.api.landed();r.api.rescue();
   gate.resolve(response);await tick();assert.equal(r.unlocked.size,0,'stats must confirm data === true');
  }
  const statsGate=deferred(),g=make(code,{statsGate});g.api.landed();
  assert.deepEqual(g.calls.slice(0,2),[['init'],['stats']],'host injection initializes without an extra flag');
  g.api.rescue();g.api.rescue();g.api.power(false);g.api.power(true);
  g.api.combo(9);g.api.graze(29);await tick();assert.equal(g.unlocked.size,0,'trophies waiting for stats');
  statsGate.resolve({success:true,data:true});await tick();assert.deepEqual([...g.unlocked].sort(),['BLADE','BLAST','RESCUE']);
  assert.equal(g.calls.filter(c=>c[0]==='award'&&c[1]==='RESCUE').length,1,'deduplication');
  g.api.combo(10);g.api.graze(30);g.api.save();g.api.defeatMiniboss();g.advance(120);g.api.win(43,100000,3);await tick();
  assert.deepEqual([...g.unlocked].sort(),[...ids].sort(),'the ten real conditions');
  assert.deepEqual(g.calls.filter(c=>c[0]==='score').map(c=>c[1]).sort(),boards.map(b=>b.name).sort());
  assert.deepEqual(g.violations,[]);
  for(const n of [42,43]){
   const gate=deferred(),r=make(code,{boardGate:gate});r.api.start();r.advance(400);
   const a=Array.from(r.api.clock());assert(a[1]>0&&a[2]===1,'start after the descent');
   r.api.pause(true);r.advance(120);assert.deepEqual(Array.from(r.api.clock()).slice(0,3),a.slice(0,3),'pause excluded from the timer');
   r.api.pause(false);r.advance(60);const end=Array.from(r.api.clock());
   r.api.win(n,111111,2);r.api.start();gate.resolve();await tick();
   const sent=r.calls.filter(c=>c[0]==='score');
   assert(sent.some(c=>c[1]==='high-score'&&c[2]===111111),'score frozen before restart');
   assert(sent.some(c=>c[1]==='fastest-rescue'&&c[2]===((end[0]-end[1])*1000/60|0)),'active time frozen');
   assert.equal(sent.some(c=>c[1]==='perfect-rescue-score'&&c[2]===111111),n===43);
   assert.equal(r.unlocked.has('ALL'),n===43);assert(!r.unlocked.has('ACE'));assert.deepEqual(r.violations,[]);
  }
  const loss=make(code);loss.api.landed();loss.api.loss();await tick();
  assert.deepEqual(loss.calls.filter(c=>c[0]==='score'),[['score','high-score',12345]]);
  assert(!loss.unlocked.has('WIN')&&!loss.unlocked.has('ALL')&&!loss.unlocked.has('ACE'));
  let failureCount=0;
  for(const method of ['init','requestStats','getAchievement','setAchievement','getOrCreateLeaderboard','uploadLeaderboardScore']){
   const variants=['missing','throw'];if(method!=='getAchievement')variants.push('reject');
   if(['requestStats','getOrCreateLeaderboard'].includes(method))variants.push('false');
   for(const failure of variants){
    const r=make(code,{scenario:method+':'+failure});r.api.landed();r.api.rescue();r.api.win(43,99999,3);await tick();
    assert.equal(r.api.error(),'');assert.deepEqual(r.violations,[]);failureCount++;
   }
  }
  assert.deepEqual(errors,[],'no unhandled rejection');
  console.log('PASS '+label+': SDK absent/present, 10 trophies, 3 leaderboards, thresholds, win/loss, timer/pause, restart, deferred stats, '+failureCount+' SDK failures');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
