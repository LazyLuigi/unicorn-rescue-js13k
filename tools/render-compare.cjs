// Compares the real rendering of the before/after HTML, in both engines.
// Audio is neutralized here to pin down randomness; equivalence.cjs tests it separately.
const {chromium,firefox}=require('playwright'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const before=process.argv[2],after=process.argv[3]||'dist/js13k/index.html';
if(!before)throw Error('Usage: node tools/render-compare.cjs before.html [after.html]');
(async()=>{for(const engine of [chromium,firefox]){
 const browser=await engine.launch();try{
  async function capture(file){
   const page=await browser.newPage({viewport:{width:384,height:512}}),out=[],errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
   await page.addInitScript(()=>{let seed=78123,ts=0;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    window.AudioContext=window.webkitAudioContext=undefined;window.requestAnimationFrame=f=>window.__next=f;
    window.__advance=n=>{for(let i=0;i<n;i++)__next(ts+=1000/60);};});
   await page.goto('file://'+path.resolve(file));
   async function snap(label){const png=await page.evaluate(()=>document.querySelector('canvas').toDataURL());out.push([label,crypto.createHash('sha256').update(png).digest('hex')]);}
   const run=n=>page.evaluate(n=>__advance(n),n);
   await run(120);await snap('title');await page.keyboard.press('Space');await run(160);await snap('briefing');
   for(let i=0;i<12;i++){await page.keyboard.press('Space');await run(3);}
   await run(240);await snap('dive');
   for(const key of ['ArrowLeft','ArrowRight','ArrowUp']){await page.keyboard.down(key);await run(30);await page.keyboard.up(key);}
   await run(500);await snap('waves');await page.keyboard.press('p');await run(60);await snap('pause');await page.keyboard.press('Space');
   await page.keyboard.down('Shift');await page.keyboard.down('ArrowRight');await run(15);await page.keyboard.up('ArrowRight');await page.keyboard.up('Shift');
   await run(1000);await snap('combat');
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);await run(30);await snap('portrait');
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(80);await run(30);await snap('landscape');
   assert.deepEqual(errors,[]);await page.close();return out;
  }
  const a=await capture(before),b=await capture(after);assert.deepEqual(b,a,engine.name()+' pixel difference');
  console.log(engine.name()+': '+a.length+' pixel-identical captures; no console errors.');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
