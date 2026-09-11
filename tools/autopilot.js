// ============================================================================
//  AUTOPILOT: video capture tool, outside the js13k budget.
//  Injected at the end of the game script by `node build.js --autopilot`, so it
//  has access to every game variable (P, enemies, buls, charge, canAct...).
//
//  It plays like a decent human: it moves at a bounded speed toward its
//  objectives, dodges bullets by anticipating their path, goes for close-range
//  kills to get the multiplier, collects stars, and strictly alternates the
//  two powers: one Horn Blade, then one Rainbow Blast (it waits for a full
//  gauge), then a Blade, and so on. It also hesitates on purpose now and then
//  so as not to be perfect.
//
//  Keys: A = autopilot on/off, H = debug overlay, L = loop on/off.
// ============================================================================
var AUTO={on:1, loop:1, debug:0, seq:0, vmax:2.1, think:2, lapse:1, saves:.6,
          deaths:0, uses:[], t:0};
var AP={tx:LW/2, ty:LH-60, cand:[], ready:0, lapseT:0, nextLapse:2400, menuT:0, lives:3, wait:0};

// ---- threat along the path to a point: both the bullets and the ship are
// projected forward, since the ship takes several frames to get there ----
function apThreat(cx,cy){ var d=0, i, b, e, dx=cx-P.x, dy=cy-P.y, L=Math.hypot(dx,dy)||1, tt, f, sx, sy, ex, ey, r2;
  for(tt=0;tt<=36;tt+=3){ f=min(1,tt*AUTO.vmax/L); sx=P.x+dx*f; sy=P.y+dy*f;
    var disc=1-tt/48;
    for(i=0;i<buls.length;i++){ b=buls[i]; ex=b.x+b.vx*tt-sx; ey=b.y+b.vy*tt-sy; r2=ex*ex+ey*ey;
      if(r2<441){ var q=1-r2/441; d+=q*q*disc*(b.r>2?1.3:1); } }
    for(i=0;i<enemies.length;i++){ e=enemies[i]; if(e.y<-10) continue;
      ex=e.x-sx; ey=e.y+(e.ty==0?1.6:.5)*tt-sy; r2=ex*ex+ey*ey; var rr=(e.r+12)*(e.r+12);
      if(r2<rr*2) d+=1.5*(1-r2/(rr*2))*disc; } }
  if(cx<10||cx>LW-10) d+=.6; if(cy<LH*.45) d+=1; if(cy>LH-14) d+=.6;
  return d; }

// ---- target: the base first, then the boss, then the closest ----
function apTarget(){ var best=null, bs=-1e9;
  for(var i=0;i<enemies.length;i++){ var e=enemies[i];
    if(e.y<-8||e.y>P.y-14) continue;
    var s=(e.ty==3?300:(e.ty|1)==5?250:e.ty==6?120:e.ty==2?100:e.ty==1?60:30)
          -abs(e.x-P.x)*.6-(P.y-e.y)*.2;
    if(s>bs){ bs=s; best=e; } }
  return best; }

var AP_DX=[-70,-55,-40,-30,-20,-10,0,10,20,30,40,55,70], AP_DY=[-24,-12,0,12,24];
function apThink(){
  var T=apTarget(), safeY=LH-58, i;
  // while invulnerable or powered up, go for the close-range kill (x3, x4)
  var bold=invul>40||hyper, wantX=P.x, wantY=safeY;
  if(T){ wantX=T.x+sin(t*.03)*4; wantY=bold?min(safeY,T.y+34):min(safeY,T.y+52); }
  AP.cand=[]; var bestC=null, bestS=1e9;
  for(var ix=0;ix<AP_DX.length;ix++) for(var iy=0;iy<AP_DY.length;iy++){
    var cx=clamp(P.x+AP_DX[ix],8,LW-8), cy=clamp(P.y+AP_DY[iy],40,LH-16);
    var th=apThreat(cx,cy);
    var s=th*10 + abs(AP_DX[ix])*.012 + abs(AP_DY[iy])*.012;   // moving costs a little
    s+=abs(cx-wantX)*.02+abs(cy-wantY)*.012;                    // objective
    for(i=0;i<picks.length;i++){ var p=picks[i], dd=dist(p.x,p.y,cx,cy);   // stars
      if(dd<50&&th<.3) s-=.12*(1-dd/50); }
    AP.cand.push([cx,cy,th]);
    if(s<bestS){ bestS=s; bestC=[cx,cy,th]; } }
  // smoothing: out of danger, glide toward the new intent; in danger, jump straight to it
  AP.threat=apThreat(P.x,P.y); var k=AP.threat>.4?1:.4;
  AP.tx+=(bestC[0]-AP.tx)*k; AP.ty+=(bestC[1]-AP.ty)*k; }

function apPower(){
  // strict alternation: seq 0 = Horn Blade (half gauge), seq 1 = Rainbow Blast (full)
  if(apWant()){ AP.ready++;
    // wait a little, less when things heat up, and not at all if the Blade
    // is about to turn into a Blast because the gauge is filling up
    if(AP.ready>(AP.threat>.4?6:40+R()*60)||(!AUTO.seq&&charge>CHMAX*.85)) apFire(); }
  else AP.ready=0; }
// is the wanted power available? seq 0 = Blade (gauge >= half), seq 1 = Blast (full)
function apWant(){ return canAct()&&(AUTO.seq?charge>=CHMAX-2:charge<CHMAX-2); }
function apFire(){ var full=charge>=CHMAX-2; actP=1; AP.ready=0;
  AUTO.uses.push(full?'BLAST':'BLADE'); AUTO.seq=full?0:1; }

function apStep(){ if(!AUTO.on) return; AUTO.t++;
  if(mode=='title'){ if(++AP.menuT>(dstart?95:70)){ AP.menuT=0; menuOk(); } return; }
  if(mode!='play'){ if(AUTO.loop&&++AP.menuT>300){ AP.menuT=0; menuOk(); } return; }
  AP.menuT=0;
  if(lives<AP.lives) AUTO.deaths++; AP.lives=lives;
  // last-chance window: a human does not always think of it
  if(freeze&&coyote){ if(apWant()&&R()<AUTO.saves) apFire(); return; }
  if(freeze||land<1) return;
  // deliberate hesitation, now and then, so as not to play like a machine
  if(AUTO.lapse){ if(--AP.nextLapse<=0){ AP.lapseT=14; AP.nextLapse=3000+R()*2400; }
    if(AP.lapseT>0){ AP.lapseT--; return; } }
  if(AUTO.t%AUTO.think==0) apThink();
  // movement at a bounded speed, like a stick
  var v=AUTO.vmax*(AP.threat>.5?1.25:1);
  P.tx=clamp(P.tx+clamp(AP.tx-P.tx,-v,v),6,LW-6);
  P.ty=clamp(P.ty+clamp(AP.ty-P.ty,-v,v),14,LH-10);
  apPower(); }

// ---- every run starts over with a Horn Blade ----
var _apNew=newGame;
newGame=function(){ _apNew(); AUTO.seq=0; AUTO.deaths=0; AUTO.uses=[]; AP.lives=3; AP.ready=0; AP.tx=P.tx; AP.ty=P.ty; };

// ---- hooks: before the player update, and on the HUD for debugging ----
var _apUpd=updPlayer;
updPlayer=function(){ apStep(); _apUpd(); };
var _apHud=drawHUD;
drawHUD=function(){ _apHud(); if(!AUTO.debug||mode!='play') return;
  AP.cand.forEach(function(c){ X.globalAlpha=.5; X.fillStyle=c[2]>1?'#ff6b8a':'#9be8c3';
    X.fillRect(c[0]-1|0,c[1]-1|0,2,2); }); X.globalAlpha=1;
  X.strokeStyle='#ffe27a'; X.lineWidth=1; X.beginPath(); X.arc(AP.tx|0,AP.ty|0,4,0,PI2); X.stroke();
  txt('AUTO '+(AUTO.seq?'NEXT BLAST':'NEXT BLADE')+' D'+AUTO.deaths,LW/2,28,'#ffe27a','center'); };
addEventListener('keydown',function(e){ var k=e.key.toLowerCase();
  if(k=='a') AUTO.on=!AUTO.on; if(k=='h') AUTO.debug=!AUTO.debug; if(k=='l') AUTO.loop=!AUTO.loop; });
