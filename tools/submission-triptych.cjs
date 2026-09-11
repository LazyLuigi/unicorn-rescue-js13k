// Screenshots of the real autopiloted game, then assembled without retouching the game pixels.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {createCanvas,loadImage}=require('canvas');
const out=path.resolve('media/screens');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch();
 let captures;
 try{
  const page=await browser.newPage({viewport:{width:384,height:512}});
  await page.addInitScript(()=>{let seed=12345;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);window.AudioContext=window.webkitAudioContext=undefined;window.requestAnimationFrame=()=>0;});
  await page.goto('file://'+path.resolve('src/index.html'));
  await page.addScriptTag({content:fs.readFileSync('tools/autopilot.js','utf8')});
  captures=await page.evaluate(()=>{
   const result={};
   function snap(name){render();result[name]={png:C.toDataURL('image/png'),frame:t,score,freed};}
   for(let i=0;i<45;i++){step();render();}snap('intro');
   newGame();AUTO.loop=0;
   for(let i=0;i<15000&&mode==='play';i++){
    if(freeze&&coyote)apStep();step();render();
    if(!result.combat&&t>1400&&enemies.length>=4&&hyper&&wflash<=0&&!flashShip)snap('combat');
    if(!result.boss&&boss&&!boss.mini&&boss.y>30&&boss.pt>200&&wflash<=0&&!flashShip){snap('boss');break;}
   }
   if(!result.combat||!result.boss)throw Error('Incomplete capture: '+JSON.stringify({captures:Object.keys(result),mode,t,scroll,lives}));
   return result;
  });
 }finally{await browser.close();}
 const canvas=createCanvas(1200,568),g=canvas.getContext('2d');
 g.fillStyle='#2b1d33';g.fillRect(0,0,1200,568);
 const labels=['THE MISSION','FREE THE UNICORNS','FACE THE BOSS'];
 let i=0;
 for(const [name,data] of Object.entries(captures)){
  const bytes=Buffer.from(data.png.split(',')[1],'base64');fs.writeFileSync(path.join(out,name+'.png'),bytes);
  const x=12+i*396;
  g.imageSmoothingEnabled=false;g.drawImage(await loadImage(bytes),x,12);
  g.fillStyle=['#ff6ad5','#9be8c3','#ffe27a'][i];g.fillRect(x,530,384,3);
  g.font='bold 15px monospace';g.textAlign='center';g.fillText(labels[i],x+192,554);
  delete data.png;i++;
 }
 fs.writeFileSync('media/gameplay-triptych.png',canvas.toBuffer('image/png'));
 fs.writeFileSync('media/screens/capture.json',JSON.stringify({seed:12345,viewport:[384,512],captures},null,2)+'\n');
 console.log(captures);console.log('media/gameplay-triptych.png: '+fs.statSync('media/gameplay-triptych.png').size+' bytes');
})().catch(e=>{console.error(e);process.exitCode=1});
