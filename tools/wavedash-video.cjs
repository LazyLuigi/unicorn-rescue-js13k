// Video of the real game and its audio, outside the build; no Wavedash connection.
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
 fs.mkdirSync('.build/video',{recursive:true});
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   let seed=12345;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
   window.realRAF=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
   window.realAC=window.AudioContext;window.AudioContext=window.webkitAudioContext=undefined;
  });
  await page.goto('file://'+path.resolve('src/index.html'));
  await page.addScriptTag({content:fs.readFileSync('tools/autopilot.js','utf8')});
  const start=await page.evaluate(()=>{
   for(let i=0;i<45;i++){step();render();}newGame();AUTO.loop=0;
   for(let i=0;i<15000&&mode==='play';i++){
    if(freeze&&coyote)apStep();step();render();
    if(canAct()&&!hyper&&!AUTO.uses.length&&enemies.length>=2&&wflash<=0&&!flashShip)return {frame:t,score,freed,charge,enemies:enemies.length};
   }
   throw Error('First power charge not reached');
  });
  console.log('Capture start',start);
  const result=await page.evaluate(async()=>{
   window.AudioContext=realAC;
   AC=new AudioContext();await AC.resume();
   const sound=AC.createMediaStreamDestination(),connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(to,...args){return connect.call(this,to===AC.destination?sound:to,...args)};
   ensureAudio();startMusic();
   const stream=C.captureStream(60);for(const track of sound.stream.getAudioTracks())stream.addTrack(track);
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:8000000});
   const chunks=[],timeline=[],powers=[];
   const begin=performance.now(),originalHyperOn=hyperOn;
   hyperOn=function(full){powers.push({seconds:(performance.now()-begin)/1000,power:full?'Rainbow Blast':'Horn Blade'});return originalHyperOn(full)};recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   const done=new Promise(resolve=>recorder.onstop=resolve);
   const timer=setInterval(()=>timeline.push({frame:t,mode,freed,hyper,ultra,bossHP:boss&&boss.hp}),1000);
   recorder.start();window.requestAnimationFrame=realRAF;last=performance.now();acc=0;requestAnimationFrame(loop);
   await new Promise(resolve=>setTimeout(resolve,14000));recorder.stop();clearInterval(timer);await done;
   const blob=new Blob(chunks,{type:'video/webm'});
   const base64=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob)});
   return {base64,timeline,powers};
  });
  if(errors.length)throw Error(errors.join('\n'));
  if(!result.powers.some(p=>p.seconds<10))throw Error('No power in the first ten seconds');
  if(result.timeline.some(s=>s.bossHP))throw Error('A boss appears during the capture');
  fs.writeFileSync('.build/video/gameplay.webm',Buffer.from(result.base64,'base64'));
  fs.writeFileSync('.build/video/timeline.json',JSON.stringify({start,timeline:result.timeline,powers:result.powers},null,2));
  execFileSync('ffmpeg',['-y','-i','.build/video/gameplay.webm','-t','12','-vf','fps=60','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','media/wavedash-gameplay.mp4'],{stdio:'pipe'});
  console.log(result.powers);console.log(result.timeline);console.log('media/wavedash-gameplay.mp4',fs.statSync('media/wavedash-gameplay.mp4').size,'bytes');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
