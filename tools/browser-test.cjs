// Regression on the source AND on the real HTML extracted from the ZIP. Node >= 20.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {chromium,firefox}=require('playwright');
const http=require('node:http');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'unicorn-check-'));
execFileSync('unzip',['-q',path.resolve('js13k-game.zip'),'-d',tmp]);
assert(fs.statSync('js13k-game.zip').size<=13312);
assert.equal(fs.readFileSync(path.join(tmp,'index.html'),'utf8'),fs.readFileSync('dist/js13k/index.html','utf8'));
const source=fs.readFileSync('src/index.html','utf8');
assert.equal(fs.readFileSync('dist/wavedash/index.html','utf8'),source);
const compiled=fs.readFileSync(path.join(tmp,'index.html'),'utf8');
fs.mkdirSync('.dream-loop',{recursive:true});
const server=http.createServer((req,res)=>{
 if(!['/','/source'].includes(req.url)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url==='/source'?source:compiled);
});
const results=[];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
  const browser=await engine.launch({headless:true,executablePath:engine.executablePath()});
  try{
   for(const built of [false,true]){
    const page=await browser.newPage({viewport:{width:768,height:1024}}),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('request',r=>{if(!r.url().startsWith(base))external.push(r.url());});
    await page.addInitScript(()=>{let seed=12345,ts=0;Math.random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
     window.requestAnimationFrame=f=>window.__frame=f;
     window.__advance=n=>{for(let i=0;i<n;i++)window.__frame(ts+=1000/60);};
    });
    await page.goto(base+(built?'/':'/source'));
    await page.evaluate(()=>__advance(120));
    if(!built)assert.equal(await page.evaluate(()=>shots.length),0,'no shots on title');
    await page.screenshot({path:'.dream-loop/'+name+(built?'-built-title':'-source-title')+'.png'});
    for(let i=0;i<12;i++){await page.keyboard.press('Space');await page.evaluate(()=>__advance(3));}
    if(!built){
     assert.equal(await page.evaluate(()=>mode),'play','briefing can be skipped');
     await page.evaluate(()=>__advance(80));
     assert.equal(await page.evaluate(()=>shots.length),0,'no shots during dive');
     await page.evaluate(()=>__advance(180));
     assert(await page.evaluate(()=>shots.length>0),'automatic fire after dive');
    }else await page.evaluate(()=>__advance(260));
    await page.keyboard.press('p');
    const frozen=await page.evaluate(()=>document.querySelector('canvas').toDataURL());
    if(!built){
     const state=await page.evaluate(()=>JSON.stringify([t,scroll,P.x,P.y,enemies,buls]));
     await page.evaluate(()=>__advance(120));
     assert.equal(await page.evaluate(()=>!!paused),true);
     assert.equal(await page.evaluate(()=>JSON.stringify([t,scroll,P.x,P.y,enemies,buls])),state,'pause freezes simulation');
     await page.screenshot({path:'.dream-loop/'+name+'-pause.png'});
    }
    await page.keyboard.press('Space');await page.keyboard.down('ArrowRight');
    await page.evaluate(()=>__advance(12));await page.keyboard.up('ArrowRight');
    assert.notEqual(await page.evaluate(()=>document.querySelector('canvas').toDataURL()),frozen,'resume redraws gameplay');
    if(!built){
     await page.evaluate(()=>dispatchEvent(new Event('blur')));
     assert.equal(await page.evaluate(()=>!!paused),true,'blur pauses');
     assert.deepEqual(await page.evaluate(()=>Object.keys(keys).filter(k=>keys[k])),[],'blur clears held keys');
     await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>paused),false);
     const init=()=>{newGame();land=1;mist=0;clouds=[];flyin=0;invul=999;P.x=P.tx=50;P.y=P.ty=180;};
     await page.evaluate(init);await page.keyboard.down('ArrowRight');await page.evaluate(()=>__advance(10));await page.keyboard.up('ArrowRight');
     const fast=await page.evaluate(()=>P.tx-50);
     await page.evaluate(init);await page.keyboard.down('Shift');await page.keyboard.down('ArrowRight');await page.evaluate(()=>__advance(10));
     const slow=await page.evaluate(()=>P.tx-50);
     await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');assert(slow>0&&slow<fast*.6,'focus movement is precise');
     await page.evaluate(()=>{charge=150;invul=0;hurt();});await page.keyboard.press('Space');await page.evaluate(()=>__advance(2));
     assert(await page.evaluate(()=>hyper&&lives===3&&!coyote),'last chance saves life');
     await page.evaluate(()=>{freeze=0;hurt();__advance(25);});
     assert(await page.evaluate(()=>!hyper&&lives===3&&!flashShip),'hyper absorbs hit without permanent white ship');
     await page.evaluate(()=>{newGame();for(let i=0;i<3;i++){hurt();for(let n=0;n<31;n++)step();}});
     assert(await page.evaluate(()=>mode==='over'&&lives===0),'three hearts mean three lives');
     await page.evaluate(()=>{charge=300;deadCb=()=>{throw Error('stale death callback')};wasRdy=2;shotWait=99;newGame();});
     assert(await page.evaluate(()=>deadCb===null&&wasRdy===0&&shotWait===0&&charge===0),'restart clears transient state');
     await page.evaluate(()=>{land=1;mist=0;flyin=0;invul=999;P.y=P.ty=LH-30;clouds=[];scroll=4000;render();});
     const seed=await page.evaluate(()=>window.seed);
     await page.setViewportSize({width:390,height:844});
     await page.waitForFunction(()=>C.width===390&&C.height===844,null,{polling:20});
     await page.evaluate(()=>__advance(3));
     assert.equal(await page.evaluate(()=>window.seed),seed,'resize keeps island');
     assert.equal(await page.evaluate(()=>clouds.length),0,'resize does not restore intro clouds');
     await page.evaluate(()=>{P.y=P.ty=LH-20;});
     await page.setViewportSize({width:844,height:390});
     await page.waitForFunction(()=>C.width===844&&C.height===390,null,{polling:20});
     await page.evaluate(()=>__advance(30));
     assert(await page.evaluate(()=>P.y<=LH-10),'player stays visible after rotation');
     await page.evaluate(()=>{newGame();land=1;mist=0;flyin=0;clouds=[];P.x=P.tx=96;P.y=P.ty=180;
      const point=(x,y)=>({clientX:(x*SC+OX)/DPR,clientY:(y*SC+OY)/DPR});
      const ev=touches=>({touches,preventDefault(){}});
      tstart(ev([point(90,150)]));tmove(ev([point(100,140)]));
      window.__drag=P.tx;
      tend(ev([point(100,140)]));tmove(ev([point(110,140)]));
     });
     assert(await page.evaluate(()=>isTouch&&P.tx>__drag),'touch keeps moving after second finger lifts');
     await page.setViewportSize({width:768,height:1024});
     await page.evaluate(()=>{newGame();mist=0;for(let i=0;i<1800;i++){invul=9;step();}invul=0;render();});
     await page.screenshot({path:'.dream-loop/'+name+'-final-game.png'});
     const timing=await page.evaluate(()=>{let costs=[];for(let i=0;i<240;i++){invul=9;const a=performance.now();step();render();costs.push(performance.now()-a);}costs.sort((a,b)=>a-b);return {mean:costs.reduce((a,b)=>a+b,0)/costs.length,p95:costs[Math.floor(costs.length*.95)]};});
     results.push({name,kind:'source',frameMs:timing});
     assert.equal(await page.evaluate(()=>ERR),'','no caught game errors');
    } else {
     await page.evaluate(()=>__advance(900));
     await page.screenshot({path:'.dream-loop/'+name+'-built-game.png'});
     results.push({name,kind:'ZIP',canvas:await page.evaluate(()=>[document.querySelector('canvas').width,document.querySelector('canvas').height])});
    }
    assert.deepEqual(errors,[],name+' errors');assert.deepEqual(external,[],name+' external requests');
    await page.close();
   }
  }finally{await browser.close();}
 }
 console.log(JSON.stringify(results,null,2));
 console.log('PASS: Chromium + Firefox, source + extracted ZIP, inputs, pause, focus, lives, powers, resize, touch; no console errors or external requests.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{server.close();fs.rmSync(tmp,{recursive:true,force:true});});
