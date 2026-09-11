// Legacy generator: game sprites into media/native/, outside the js13k archive.
// Node >= 20. No external graphic asset.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const outDir=path.resolve('media/native');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:384,height:512}});
  await page.addInitScript(()=>{
   let seed=12345;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
   window.AudioContext=window.webkitAudioContext=undefined;
   window.requestAnimationFrame=()=>0;
  });
  await page.goto('file://'+path.resolve('src/index.html'));
  const images=await page.evaluate(()=>{
   // A frozen title, then composition in canvases separate from the game.
   for(let i=0;i<45;i++)step();P.x=P.tx=LW/2;P.y=P.ty=150;render();
   const title=mk(192,176);title.getContext('2d').drawImage(B,0,0);
   const old=X,images={};
   function finish(name,canvas,w,h){
    const out=mk(w,h),g=out.getContext('2d');g.imageSmoothingEnabled=false;
    g.drawImage(canvas,0,0,w,h);images[name]=out.toDataURL('image/png');
   }
   const cover=mk(400,250);X=cover.getContext('2d');X.imageSmoothingEnabled=false;
   X.fillStyle='#2b1d33';X.fillRect(0,0,400,250);
   RB.forEach((color,i)=>{X.fillStyle=color;X.fillRect(0,i*2,400,2);X.fillRect(0,236+i*2,400,2)});
   X.fillStyle='#fff1e8';X.fillRect(100,22,200,184);
   X.drawImage(title,104,26);
   dr(S.uni,49,105,0,4);dr(S.uni,351,105,1,4);
   dr(S.star,49,159,0,2);dr(S.star,351,159,0,2);
   txt('FREE THE UNICORNS',200,223,'#ffe27a','center',1);
   finish('cover',cover,800,500);
   const thumbnail=mk(192,192);X=thumbnail.getContext('2d');X.imageSmoothingEnabled=false;
   X.fillStyle='#fff1e8';X.fillRect(0,0,192,192);X.drawImage(title,0,0);
   RB.forEach((color,i)=>{X.fillStyle=color;X.fillRect(0,178+i*2,192,2)});
   finish('thumbnail',thumbnail,320,320);
   X=old;return images;
  });
  fs.mkdirSync(outDir,{recursive:true});
  for(const [name,data] of Object.entries(images)){
   const bytes=Buffer.from(data.split(',')[1],'base64');fs.writeFileSync(path.join(outDir,name+'.png'),bytes);
   console.log(path.join(outDir,name+'.png')+': '+bytes.length+' bytes');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
