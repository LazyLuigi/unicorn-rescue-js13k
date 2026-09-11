// Checks the real deliverables and the isolation of the fast modes / failures.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync,spawnSync}=require('node:child_process');
const root=process.cwd(),zip=fs.readFileSync('js13k-game.zip');
assert(zip.length<=13312);
assert.equal(execFileSync('unzip',['-Z1','js13k-game.zip'],{encoding:'utf8'}).trim(),'index.html');
assert(execFileSync('unzip',['-p','js13k-game.zip','index.html']).equals(fs.readFileSync('dist/js13k/index.html')));
assert(fs.readFileSync('dist/wavedash/index.html').equals(fs.readFileSync('src/index.html')));
assert.deepEqual(fs.readdirSync('dist').sort(),['js13k','wavedash']);
for(const target of ['js13k','wavedash'])assert.deepEqual(fs.readdirSync('dist/'+target),['index.html']);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'unicorn-build-'));
try{
 for(const file of ['build.js','build-options.cjs','src','tools/autopilot.js','dist','js13k-game.zip']){
  fs.mkdirSync(path.dirname(path.join(tmp,file)),{recursive:true});
  fs.cpSync(file,path.join(tmp,file),{recursive:true});
 }
 fs.symlinkSync(path.join(root,'node_modules'),path.join(tmp,'node_modules'),'dir');
 const files=['js13k-game.zip','dist/js13k/index.html','dist/wavedash/index.html'];
 const before=files.map(f=>fs.readFileSync(path.join(tmp,f)));
 const unchanged=()=>files.forEach((f,i)=>assert(fs.readFileSync(path.join(tmp,f)).equals(before[i]),f+' preserved'));
 for(const flag of ['--no-rr','--autopilot']){
  execFileSync(process.execPath,['build.js',flag],{cwd:tmp});
  unchanged();
 }
 assert(fs.existsSync(path.join(tmp,'.build/fast/index.html')));
 assert(fs.existsSync(path.join(tmp,'.build/autopilot/index.html')));
 // A compilation error must not erase any already valid target.
 const source=path.join(tmp,'src/index.html');
 fs.writeFileSync(source,fs.readFileSync(source,'utf8').replace('<script>','<script>const = ;'));
 const failed=spawnSync(process.execPath,['build.js'],{cwd:tmp,encoding:'utf8'});
 assert.notEqual(failed.status,0);
 unchanged();
 assert(!fs.readdirSync(path.join(tmp,'.build')).some(f=>f.startsWith('stage-')));
 console.log('PASS: ZIP <= 13312, exact archive, only the two targets, Wavedash source untouched; fast modes and failure preserve deliverables.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
