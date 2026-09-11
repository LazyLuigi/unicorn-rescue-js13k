// Builds isolated candidates. Only a ZIP <= 13,312 bytes replaces the deliverable.
const {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,renameSync,existsSync}=require('fs');
const {execFileSync}=require('child_process');
const {resolve,join}=require('path');
const LIMIT=13312,args=process.argv.slice(2),NORR=args.includes('--no-rr');
const BEST=+(args.find(a=>a.startsWith('--best='))||'').slice(7)||1;
const ALPHA=args.includes('--alpha');
const ZIP=ALPHA?'.build/alpha/game.zip':'js13k-game.zip';
const html=readFileSync('src/index.html','utf8');
mkdirSync('.build',{recursive:true});
if(args.includes('--autopilot')){
  mkdirSync('.build/autopilot',{recursive:true});
  writeFileSync('.build/autopilot/index.html',html.replace('</script>','\n'+readFileSync('tools/autopilot.js','utf8')+'\n</script>'));
  console.log('.build/autopilot/index.html (capture build, outside the budget)');
  process.exit(0);
}
let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
// The main version already has translucent clouds; this variant is even lighter.
if(ALPHA) js=js.replace('c.amb?.38:1','c.amb?.2:1');
const stage=mkdtempSync(resolve('.build/stage-'));
(async()=>{ try{
  writeFileSync(join(stage,'raw.js'),js);
  execFileSync(process.execPath,['--check',join(stage,'raw.js')]);
  const bin=n=>resolve('node_modules/.bin/'+n);
  const minified=(await require('terser').minify(js,require('./build-options.cjs'))).code;
  const wrap=code=>'<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,user-scalable=no,viewport-fit=cover"><title>Unicorn Rescue</title><link rel=icon href=data:,><style>'+css+'</style><canvas id=c aria-label="Unicorn Rescue"></canvas><script>'+code+'</script>';
  if(NORR){
    mkdirSync('.build/fast',{recursive:true});
    writeFileSync('.build/fast/index.html',wrap(minified));
    console.log('.build/fast/index.html | minified JS',Buffer.byteLength(minified),'bytes | deliverables preserved');
  } else {
    writeFileSync(join(stage,'min.js'),minified);
    let best;
    for(let i=0;i<BEST;i++){
      // Eight contexts: faster startup; the ZIP size is still checked.
      const packed=execFileSync(bin('roadroller'),[join(stage,'min.js'),'-Sx8','-O2','-q'],{encoding:'utf8',maxBuffer:1<<26});
      const candidate=wrap(packed),zipPath=join(stage,'candidate.zip');
      writeFileSync(join(stage,'index.html'),candidate);
      rmSync(zipPath,{force:true});
      execFileSync('zip',['-X','-9','-q',zipPath,'index.html'],{cwd:stage});
      try{execFileSync('advzip',['-z','-4','-i','100',zipPath],{stdio:'pipe'});}catch(e){if(e.code!=='ENOENT') throw e;}
      execFileSync('unzip',['-t',zipPath],{stdio:'pipe'});
      const zip=readFileSync(zipPath);
      if(!execFileSync('unzip',['-p',zipPath,'index.html']).equals(Buffer.from(candidate))) throw Error('ZIP content differs from the HTML');
      console.log('Candidate',i+1,'| ZIP',zip.length,'/',LIMIT);
      if(!best||zip.length<best.zip.length) best={zip,html:candidate};
    }
    if(best.zip.length>LIMIT) throw Error('Over the limit by '+(best.zip.length-LIMIT)+' bytes. Previous deliverables preserved.');
    if(ALPHA){
      mkdirSync('.build/alpha',{recursive:true});
      writeFileSync('.build/alpha/index.html',best.html);
      writeFileSync(ZIP,best.zip);
    }else{
      // dist/ belongs to the build: only the two delivery targets live there.
      // Both pages come from the same html snapshot read at startup.
      const release=join(stage,'release'),backup=join(stage,'previous-dist');
      mkdirSync(join(release,'js13k'),{recursive:true});
      mkdirSync(join(release,'wavedash'),{recursive:true});
      writeFileSync(join(release,'js13k/index.html'),best.html);
      writeFileSync(join(release,'wavedash/index.html'),html);
      writeFileSync(join(stage,'release.zip'),best.zip);
      const hadDist=existsSync('dist');
      if(hadDist)renameSync('dist',backup);
      try{
        renameSync(release,'dist');
        renameSync(join(stage,'release.zip'),ZIP);
      }catch(e){
        rmSync('dist',{recursive:true,force:true});
        if(hadDist)renameSync(backup,'dist');
        throw e;
      }
      console.log('dist/js13k/index.html (Roadroller) | dist/wavedash/index.html (untouched source, host-injected SDK)');
    }
    console.log(ZIP,'|',best.zip.length,'bytes | headroom',LIMIT-best.zip.length,'| source JS',Buffer.byteLength(js),'| terser',Buffer.byteLength(minified));
  }
} finally {rmSync(stage,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
