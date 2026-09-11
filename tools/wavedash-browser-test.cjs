// Real ZIP, fake SDK: no interaction with the account or the platform.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{chromium,firefox}=require('playwright');
const ids=require('../wavedash/achievements.json').achievements.map(a=>a.identifier);
const boards=require('../wavedash/leaderboards.json').leaderboards;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'unicorn-sdk-'));
execFileSync('unzip',['-q',path.resolve('js13k-game.zip'),'-d',tmp]);
assert(fs.readFileSync(path.join(tmp,'index.html')).equals(fs.readFileSync('dist/js13k/index.html')));
(async()=>{
 for(const engine of [chromium,firefox]){
  const browser=await engine.launch({executablePath:engine.executablePath()});
  try{for(const target of [path.join(tmp,'index.html'),path.resolve('dist/wavedash/index.html')])for(const enabled of [false,true]){
   const page=await browser.newPage({viewport:{width:384,height:512}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.addInitScript(({enabled,ids,boards})=>{
    let seed=76543,ts=0;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    window.AudioContext=window.webkitAudioContext=undefined;window.requestAnimationFrame=f=>window.nextFrame=f;
    window.advance=n=>{for(let i=0;i<n;i++)nextFrame(ts+=1000/60)};
    window.sdkCalls=[];window.badArgs=[];const unlocked=new Set();
    if(enabled)window.Wavedash={
     init(){sdkCalls.push(['init']);},requestStats(){sdkCalls.push(['stats']);return Promise.resolve({success:true,data:true})},
     getAchievement(id){return unlocked.has(id)},
     setAchievement(id,persist){if(!ids.includes(id)||persist!==true)badArgs.push('achievement');unlocked.add(id);sdkCalls.push(['award',id]);return true},
     getOrCreateLeaderboard(name,sort,display){
      const b=boards.find(b=>b.name===name);if(!b||b.sort_order!==sort||b.display_type!==display)badArgs.push('board');
      sdkCalls.push(['board',name]);return Promise.resolve({success:true,data:{id:name}});
     },
     uploadLeaderboardScore(id,value,keep){
      if(!boards.some(b=>b.name===id)||!Number.isInteger(value)||keep!==true)badArgs.push('score');
      sdkCalls.push(['score',id,value]);return Promise.resolve({success:true,data:true});
     }
    };
   },{enabled,ids,boards});
   await page.goto('file://'+target);
   for(let i=0;i<12;i++){await page.keyboard.press('Space');await page.evaluate(()=>advance(3));}
   for(let i=0;i<40;i++){
    await page.evaluate(()=>advance(600));
    if(enabled&&await page.evaluate(()=>sdkCalls.some(c=>c[0]==='score')))break;
    if(!enabled&&i===5)break;
   }
   const {calls,bad}=await page.evaluate(()=>({calls:sdkCalls,bad:badArgs}));
   assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
   if(enabled){
    assert.equal(calls.filter(c=>c[0]==='init').length,1);assert.equal(calls.filter(c=>c[0]==='stats').length,1);
    assert(calls.some(c=>c[0]==='score'&&c[1]==='high-score'),'end-of-run score in the real ZIP');
   }else assert.deepEqual(calls,[],'no platform call without SDK');
   console.log('PASS '+engine.name()+': '+(target.startsWith(tmp)?'ZIP':'raw Wavedash')+', fake SDK '+(enabled?'injected: automatic init, contract and score submission valid':'absent: 0 calls'));
   await page.close();
  }}finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(tmp,{recursive:true,force:true}));
