"use strict";
import { on } from "./core/bus.js";
import { clamp, fmt, pct, r05 } from "./core/util.js";
import { rnd, pick, gauss, wpick, srand } from "./core/rng.js";
import { RAR, RMAP, COND, DEFAULT_SETS, LEGACY, DAYLEN, RENT, LV, VOL, CT, ERA, RORD, GMULT, GTXT, GSVC, NAMES, MT, ACH, LTK, ALBR, DECOR, STAFF, UPS, PTYPES, ACC, PPREF, REGS, DIFFS, TIERS, SEAS, RECO } from "./core/constants.js";
import { cget, cput, IDB, cacheGet } from "./core/cards/cache.js";
import { step, initPrice, rvr } from "./core/cards/prices.js";
import { setCards, hue, SETDEF, setName, setCol, mkSetDef, rarOf, mapCard, offlineCards, indexCards, CARDS, BYID, BYSR, BYR, BYS } from "./core/cards/sets.js";
import { API, jget, SETLIST_ST, loadSetList, refreshSetList, FAILED, STALE, fetchSetCards, loadMany } from "./core/cards/api.js";
import { S, G, hasState, replaceState, SETS, slotCount, syncSets, assignSlots } from "./core/state.js";
import { skey, save, saveNow, exportStr } from "./core/save.js";
import { DF } from "./core/difficulty.js";
import { season, evMul, evLabel, evShort } from "./core/events.js";
import { dayT } from "./core/day.js";
import { price, itemVal, invValue, sealedCount, netWorth, level, caseCap, caseItems, repv, dsum, spMul, patMul, tolMul, why, accP, packAcc, prodAcc, recPack, recProd, caseAcc, pInfo, pStock, pPrice, prodValue, luxItems, gk, tierOf } from "./core/economy.js";
import { EVC, calcEV, refreshPacks, roll, eraCfg, poolR, avgL, rvPool, rvAvg } from "./core/packs.js";
import { rollGrade } from "./core/grading.js";
import { RG, regS, hearts } from "./core/regulars.js";
import { genOrder, ownFor } from "./core/orders.js";
import { genMissions, track } from "./core/missions.js";
import { achVal, checkAch, albPct, claimables } from "./core/achievements.js";
import { MEDALS, checkMedals, medCount } from "./core/medals.js";
import { mkTells, mkWt } from "./core/fakes.js";
import { tipsList, dedupTips } from "./core/tips.js";
import { CHAP, chapVal, story, chapProg } from "./core/story.js";
import { rivalUpd, myIdx, rivalMul } from "./core/rival.js";
import { trophies, trophyOn, trophyRep } from "./core/trophies.js";
import { delivSummary, deliverNow } from "./core/delivery.js";
import { today, giftCheck } from "./core/gift.js";
import { mgLeft, mgReward, pool4, mgNew, mgHL, wname, mgWho, power, TYPEW, mgEnd } from "./core/minigames.js";
import { makeDeal, makeTrade } from "./core/deals.js";
import { ensure, newState } from "./core/state.js";
import { loadOrNew } from "./core/save.js";
import { loadSetsFor, retrySets, addSets } from "./core/cards/api.js";
import { seriesList } from "./core/cards/sets.js";
/* ===================== DATOS ===================== */
const $=s=>document.querySelector(s);

/* Sets: lista completa desde pokemontcg.io. Los 3 primeros conservan su id antiguo para no perder partidas. */
/* --- modo sin conexión --- */

/* ===================== ESTADO ===================== */
let speed=1;

/* valor esperado y apertura según la época del set */
function evBreak(sid){
  const e=eraCfg(sid),R=[[e.C+" comunes",e.C*avgL(poolR(sid,"C"))],[e.U+" poco comunes",e.U*avgL(poolR(sid,"U"))]];
  if(e.rv)R.push(["1 reverse",rvAvg(sid)]);
  e.slot.forEach(([r,p])=>R.push([(p*100).toFixed(1).replace(".",",")+" % "+RAR[r].n,p*avgL(poolR(sid,r))]));
  return `<details><summary class="mu">Probabilidades y valor esperado</summary><p class="mu">${e.d}</p><table class="tb">${R.map(x=>`<tr><td>${x[0]}</td><td>${fmt(x[1])}</td></tr>`).join("")}<tr><td><b>Total</b></td><td><b>${fmt(R.reduce((a,x)=>a+x[1],0))}</b></td></tr></table></details>`;
}

/* ===================== CLIENTES ===================== */
const W=800,H=640;
const LAY={
  shelf:i=>({x:40+(i%3)*205,y:i<3?46:170,w:150,h:54}),
  cs:()=>({x:60,y:390,w:270,h:caseCap()>8?92:58}),
  counter:{x:650,y:190,w:56,h:250},
  qx:622,qy:262,qs:32,door:{x:355,y:650},cashier:{x:748,y:330}
};
let custs=[],queue=[],cid=0,spawnT=3,deal=null;
const say=(c,t)=>{c.bub=t;c.bt=2.2};
function shelfSpot(i){const s=LAY.shelf(i);return {x:s.x+s.w/2+rnd(40)-20,y:s.y+s.h+44+rnd(14)}}
function caseSpot(){const c=LAY.cs();return {x:c.x+c.w/2+rnd(80)-40,y:c.y+c.h+40+rnd(14)}}
function spawn(){
  const wts={};for(const k in CT)wts[k]=CT[k].w;wts.seller=(S.stats.sellers||0)>=4?0:.14;{const t=dayT();if(S.phase!=="closed"&&(t<.18||(t>.55&&t<.72)))wts.kid*=1.8;if(S.school&&S.school.until>=S.day)wts.kid*=1.6}wts.lot=S.day>=2&&!custs.some(x=>x.type==="lot")?.05:0;if(S.tour)wts.collector*=2;
  let type=wpick(wts),reg=null;
  if(S.ev&&S.ev.t==="vip"&&!S.vipDone&&S.clock>12){type="whale";S.vipDone=true}
  else if(S.tut&&S.tut.on&&!(S.lt.served>0)&&caseItems().length)type="collector";
  else if(Math.random()<.28){reg=pickReg();if(reg)type=RG(reg).t}
  if(type==="seller")S.stats.sellers=(S.stats.sellers||0)+1;
  if(performance.now()-bellT>1500){bellT=performance.now();sfx.bell()}
  const R=reg?RG(reg):null,rs=reg?regS(reg):null;
  const c={id:++cid,type,reg,x:358+(Math.random()<.5?-1:1)*(170+rnd(260)),y:590+rnd(16),st:"in",tx:0,ty:0,sp:(type==="kid"?76:55)+rnd(20),phoneP:Math.random()<.45,ph:rnd(6),bub:null,bt:0,skin:R?R.skin:pick(["#f2c9a0","#e0a878","#a9714b","#7a4a2b"]),hold:null,wt:0,pat:(28+rnd(10))*patMul()*(S.tut&&S.tut.on?3:1)*(rs?1+rs.loy/100*.6:1),t:0,mv:false,paid:0};
  c.out=R?Object.assign({},regS(reg).out||(()=>{const o=mkOutfit(type,R);delete o.hat;return regS(reg).out=o})()):mkOutfit(type,R);if(R){say(c,rs.met?pick(["¡Buenas! 👋","¡Hola otra vez!","¿Qué hay de nuevo?"]):`¡Hola! Soy ${R.n} 😄`);rs.met=true;rs.visits++;if(!S.sets.includes(rs.fav))rs.fav=pick(S.sets)}
  const ROUTE=[{x:353,y:505}];
  if(reg&&["lucia","iker","hugo"].includes(reg)&&S.day>=2&&Math.random()<.35){const tr=makeTrade();if(tr){c.want={k:"trade"};c.trade=tr;c.st="toq";routeTo(c,LAY.qx,LAY.qy+queue.length*LAY.qs);custs.push(c);S.stats.cust++;return}}
  if(type==="seller"||type==="lot"){c.want={k:type==="lot"?"lot":"sell"};if(type==="seller")c.deal=makeDeal(reg);c.st="toq";routeTo(c,LAY.qx,LAY.qy+queue.length*LAY.qs);custs.push(c);S.stats.cust++;return}
  const ptry=S.tut&&S.tut.on?0:R&&R.acc?.6:({kid:.25,collector:.3,investor:.4,whale:.45}[type]||0);
  const pid=Math.random()<ptry?pickProd(R&&R.acc?"player":type):null;
  if(pid){c.want={k:"prod",pid};const b=LAY.prod;c.tx=b.x+20+rnd(b.w-40);c.ty=b.y+b.h+34+rnd(10);}
  else if((type==="kid"||type==="whale")&&S.slots.some(Boolean)){
    const w={};S.slots.forEach(id=>{if(id)w[id]=(S.sealed[id]>0?3:1)*(S.ev&&S.ev.t==="launch"&&S.ev.s===id?6:1)*(rs&&rs.fav===id?4:1)});
    const s=wpick(w),i=S.slots.indexOf(s);c.want={k:"pack",s};const p=shelfSpot(i);c.tx=p.x;c.ty=p.y;
  }else{c.want={k:"single"};const p=caseSpot();c.tx=p.x;c.ty=p.y;c.wps=[]}
  if((c.type==="collector"||c.type==="kid")&&!c.reg&&!c.thief&&trophyOn()&&Math.random()<.14){c.want={k:"admire"};const a=admireSpot();c.tx=a.x;c.ty=a.y}
  if(c.type==="collector"&&!c.reg&&c.want.k!=="admire"&&theftOK()&&Math.random()<(S.cams?.035:.07)*DF().theft)makeThief(c);
  routeTo(c,c.tx,c.ty);
  custs.push(c);S.stats.cust++;
}
function leave(c,angry){
  if(c.hold){if(c.hold.k==="pack")S.sealed[c.hold.s]+=c.hold.qty;else if(c.hold.k==="prod")S.prod[c.hold.pid]=pStock(c.hold.pid)+c.hold.qty;else c.hold.it.res=false;c.hold=null}
  const qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);
  if(angry){S.sales=Math.max(0,S.sales-1);S.stats.lost++;if(c.reg)loy(c.reg,-8,"Se fue enfadado de la tienda")}
  c.st="leave";
}
function decide(c){
  if(c.thief&&!c.run)return startTheft(c);
  if(c.want.k==="admire"){S.admire=(S.admire||0)+1;say(c,pick(["😍 ¡Qué colección!","🤩 ¡Menudas cartas!","📸 ¡Le hago una foto!","✨ ¡Qué pasada!"]));heartsAt(c.x,c.y-30,2);const tl=trophies().filter(i=>itemVal(i)>=3);if(tl.length&&Math.random()<.12&&!G.M){TOF={c,it:pick(tl)};TOF.price=r05(itemVal(TOF.it)*(1.25+Math.random()*.2));openM("toffer")}return leave(c,false)}
  const m=CT[c.type].mult*(c.reg?1+regS(c.reg).loy/1000:1);
  if(c.want.k==="prod"){
    const pid=c.want.pid,i=pInfo(pid);if(!i||pStock(pid)<1){say(c,"😕 Sin stock");why("ps:"+pid);return leave(c,true)}
    const pr=pPrice(pid),ref=i.ref*m*tolMul()*(.9+Math.random()*.25);
    if(pr>ref){say(c,"💸 Muy caro");why("pp:"+pid);return leave(c,true)}
    S.prod[pid]--;c.hold={k:"prod",pid,qty:1,total:pr};
  }else if(c.want.k==="pack"){
    const s=c.want.s,st=S.sealed[s],ref=S.pack[s].ref*m*tolMul()*(S.ev&&S.ev.t==="launch"&&S.ev.s===s?1.2:1)*(.9+Math.random()*.25),sh=r05(S.shelf[s]*(S.myPromo&&S.myPromo.day===S.day&&S.myPromo.s===s?.85:1));
    if(st<1){say(c,"😕 Sin stock");why("ks:"+s);return leave(c,true)}
    if(S.rival&&S.rival.on&&DF().rival&&S.rival.promo&&S.rival.promo.s===s&&!(S.myPromo&&S.myPromo.day===S.day&&S.myPromo.s===s)&&Math.random()<.3){say(c,"🏪 Enfrente está más barato");why("rv:"+s);return leave(c,true)}
    if(sh>ref){say(c,"💸 Muy caro");why("kp:"+s);return leave(c,true)}
    let qty=c.type==="whale"?3+rnd(4):c.type==="investor"?2+rnd(3):c.type==="collector"?1+rnd(3):1+(Math.random()<.35?1:0);qty=Math.min(qty,st);
    if(c.type==="kid"&&sh>14){say(c,"😢 No me llega");return leave(c,false)}
    S.sealed[s]-=qty;c.hold={k:"pack",s,qty,total:sh*qty};
  }else{
    let its=S.items.filter(i=>i.case!=null&&!i.res&&!i.fkK);
    if(!its.length){say(c,"😕 Vitrina vacía");why("ce");return leave(c,true)}
    if(c.type==="investor")its=its.sort((a,b)=>itemVal(b)-itemVal(a)).slice(0,3);
    const it=pick(its),f=(.95+Math.random()*.3)*m*tolMul()*(it.lux?1.12:1);
    if(it.case>f&&!(S.tut&&S.tut.on)){say(c,"💸 Muy caro");why("cp");return leave(c,true)}
    it.res=true;c.hold={k:"single",it,total:itemVal(it)*it.case};
  }
  c.st="toq";routeTo(c,LAY.qx,LAY.qy+queue.length*LAY.qs);
}
function qpos(c){const i=queue.indexOf(c);return {x:LAY.qx,y:LAY.qy+Math.max(0,i)*LAY.qs}}
function front(){const c=queue[0];if(!c)return null;const p=qpos(c);return Math.hypot(c.x-p.x,c.y-p.y)<5&&(c.st==="wait")?c:null}
function pay(c,got){
  const h=c.hold;if(got==null)got=h.total;
  S.money+=got;S.stats.inc+=got;S.sales++;
  if(h.k==="single"){const i=S.items.indexOf(h.it);if(i>=0)S.items.splice(i,1);track("bigsale",got);if(h.it.fk)S.fkRet.push({got,reg:c.reg||null})}else if(h.k==="prod")track("sellprod",h.qty);else{track("sellpack",h.qty);S.lt.setSold=S.lt.setSold||{};S.lt.setSold[h.s]=(S.lt.setSold[h.s]||0)+h.qty}
  if(c.reg)loy(c.reg,3+(c.wt<c.pat*.4?2:0));
  track("earn",got);track("serve");if(got>=50)shake(3);
  toast("+ "+fmt(got));fx(LAY.counter.x+28,LAY.counter.y+40,"+"+fmt(got),"#4cc98a");coinBurst(c.x,c.y-30,got);c.bought=true;VIS.drawer=1.4;c.hold=null;say(c,"❤️");
  const qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.st="leave";hud();
}
function serveFront(){
  const c=front();if(!c||G.M||paused)return;
  if(c.want.k==="sell"){deal=c.deal;deal.cust=c;openM("sell");return}
  if(c.want.k==="lot"){makeLot(c);openM("lot");return}
  if(c.want.k==="trade"){TRD={c,mine:c.trade.mine,give:c.trade.give,say:pick(["¡Hola! ¿Me cambias esta carta? 🙏","Tengo una que te puede gustar…","¿Hacemos un cambio?"])};openM("trade");return}
  if(S.staff.cashier){pay(c);sfx.chaching();return}
  if(canHaggle(c))openHaggle(c);else openCheckout(c);
}
function updateCusts(dt){
  for(const c of custs){
    c.t+=dt;if(c.bt>0){c.bt-=dt;if(c.bt<=0)c.bub=null}
    let tx=c.tx,ty=c.ty;
    if(c.st==="toq"||c.st==="wait"){if(c.st==="toq"&&queue.indexOf(c)<0)queue.push(c);const p=qpos(c);tx=p.x;ty=p.y}
    if(c.st==="leave"){if(c.ex==null){c.ex=358+(Math.random()<.5?-1:1)*(380+rnd(220));c.ey=588+rnd(18)}tx=c.ex;ty=c.ey}
    if(c.st==="leave"&&!c.lv){c.lv=1;if(c.ex==null){c.ex=358+(Math.random()<.5?-1:1)*(380+rnd(220));c.ey=588+rnd(18)}routeTo(c,c.ex,c.ey)}
    const wp=c.wps&&c.wps.length?c.wps[0]:null;if(wp){tx=wp.x;ty=wp.y}
    if(c.st==="browse"){c.mv=false;c.bw-=dt;if(c.bw<=0)decide(c);continue}
    const dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy),stp=c.sp*dt;
    if(d>2){const k=Math.min(stp,d)/d;c.x+=dx*k;c.y+=dy*k;c.mv=true;c.ph+=dt*(c.run?24:c.type==="kid"?15:11);if(Math.abs(dx)>.5)c.face=dx>0?1:-1}else c.mv=false;
    if(!c.waved&&c.st!=="leave"&&c.y<568&&c.y>540){c.waved=1;c.wave=1.3}if(c.wave>0)c.wave-=dt;
    if(wp){if(d<=3)c.wps.shift();continue}
    if(c.st==="in"&&d<=3){c.st="browse";c.bw=1.4+Math.random()*1.6}
    if(c.st==="toq"&&d<=4)c.st="wait";
    if(c.st==="wait"){
      c.wt+=dt;
      if(c.wt>c.pat){say(c,"😠");why("pat");leave(c,true)}
      else if(front()===c&&c.hold&&S.staff.cashier){c.paid+=dt;if(c.paid>1.6){pay(c);sfx.coin()}}
    }
  }
  custs=custs.filter(c=>{const g=c.st==="leave"&&c.ex!=null&&!(c.wps&&c.wps.length)&&Math.hypot(c.x-c.ex,c.y-c.ey)<4;if(g&&c.run)thiefGone(c);return !g});
}
function endDay(){
  const rent=r05(RENT*DF().rent);S.money-=rent;
  const sal=STAFF.reduce((a,x)=>a+(S.staff[x.k]?x.sal:0),0);S.money-=sal;
  let tourInc=null;if(S.tour){const pl=8+rnd(10);tourInc=pl*5-40;S.money+=tourInc;S.repB+=2;track("tour")}
  if(S.staff.cm)S.repB+=1;
  Object.keys(S.prices).forEach(id=>step(S.prices[id],VOL[(BYID[id]||{}).r]||.5));
  let news="";
  if(Math.random()<.08&&SETS.length){
    const sd=pick(SETS),up=Math.random()<.5,m=up?1.06+Math.random()*.1:.86+Math.random()*.08;
    CARDS.forEach(c=>{if(c.s===sd.id&&["DR","IR","UR","SIR","HR"].includes(c.r))S.prices[c.id].p*=m});
    news=up?`📰 Un torneo popular impulsa ${sd.n}: las cartas raras suben.`:`📰 Reimpresión anunciada de ${sd.n}: las cartas raras bajan.`;
  }
  refreshPacks();S.slots=S.slots.map(id=>id&&S.sealed[id]>0?id:null);assignSlots();
  let loanPay=0;if(S.loan&&S.loan.left>0){loanPay=Math.min(S.loan.left,S.loan.daily);S.money-=loanPay;S.loan.left=r05(S.loan.left-loanPay)}
  let mkN=0,mkInc=0;if(S.market&&S.market.day===S.day&&!S.market.res){S.market.res=1;const pr=accP(S.market.mk,.9,1.25)*.9;S.market.items.forEach(id=>{const it=S.items.find(i=>i.i===id);if(!it)return;it.res=false;if(Math.random()<pr){mkInc+=itemVal(it)*S.market.mk;mkN++;S.items.splice(S.items.indexOf(it),1)}});S.money+=mkInc}
  if(S.myPromo&&S.myPromo.day===S.day&&S.rival&&S.rival.promo&&S.myPromo.s===S.rival.promo.s)S.rival.str=Math.max(0,S.rival.str-5);
  const rivMsg=rivalUpd();
  const st=S.stats;S.hist=(S.hist||[]).concat([{d:S.day,inc:Math.round(st.inc*100)/100,net:Math.round(netWorth()),cust:st.cust,lost:st.lost}]).slice(-60);
  S.day++;
  let grN=0,fkN=0;S.items.forEach(i=>{if(i.gq&&i.gq.due<=S.day){if(i.fk){delete i.gq;i.fkK=true;fkN++;return}i.gr=rollGrade(i.k);delete i.gq;S.grNew.push(i.i);grN++;if(i.gr===10)track("gem");if(i.gr>=9)track("gem9")}});
  const nOrd=S.orders.length;S.orders=S.orders.filter(o=>o.due>=S.day);const exp=nOrd-S.orders.length;
  let newOrd=false;if(S.orders.length<3&&Math.random()<.6){genOrder();newOrd=true}
  let refund=0,refN=0;S.fkRet.forEach(x=>{if(Math.random()<.45){refund+=x.got;refN++;S.repB=Math.max(0,S.repB-3);loy(x.reg,-25,"Le vendiste una carta falsa")}});S.money-=refund;S.fkRet=[];
  S.ev=null;S.tour=false;S.vipDone=false;
  if(S.day%7===0&&S.sets.length)S.ev={t:"launch",s:pick(S.sets)};else{const r=Math.random();if(r<.12)S.ev={t:"rain"};else if(r<.22)S.ev={t:"vip"}}
  genMissions();
  S.lastWhy=st.why||{};S.lastTips=dedupTips(tipsList(st));
  S.summary={loanPay,mkN,mkInc,rivMsg,rivNew:S.newsRival?(S.newsRival=0,1):0,day:S.day-1,inc:st.inc,cust:st.cust,lost:st.lost,bought:st.bought,rent,sal,tourInc,news,net:netWorth(),grN,newOrd,exp,fkN,refund,refN};
  S.phase="closed";S.clock=0;S.stats={inc:0,cust:0,lost:0,bought:0};
  checkAch();saveNow();VIS.dawn=1;openM("sum");sfx.print();hud();
}

/* ===================== DIBUJO (base) ===================== */
const CV=$("#cv");let cx=CV.getContext("2d");
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function txt(t,x,y,size,col,al){cx.font=`600 ${size}px 'Fredoka','Trebuchet MS',system-ui,sans-serif`;cx.fillStyle=col;cx.textAlign=al||"left";cx.fillText(t,x,y)}
const IMGS={};
function timg(u){if(!u)return null;let i=IMGS[u];if(!i){i=IMGS[u]=new Image();i.src=u}return i.complete&&i.naturalWidth?i:null}
let FX=[];const fx=(x,y,t,col)=>FX.push({x,y,t,col,a:1.6});
function updFx(dt){FX.forEach(f=>{f.y-=24*dt;f.a-=dt});FX=FX.filter(f=>f.a>0)}
function lamp(x,y,r,a){const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,244,205,${a})`);g.addColorStop(1,"rgba(255,244,205,0)");cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2)}
function pokeball(x,y,r){cx.fillStyle="#e3350d";cx.beginPath();cx.arc(x,y,r,Math.PI,0);cx.fill();cx.fillStyle="#fff";cx.beginPath();cx.arc(x,y,r,0,Math.PI);cx.fill();cx.fillStyle="#222";cx.fillRect(x-r,y-1,r*2,2);cx.beginPath();cx.arc(x,y,r*.34,0,7);cx.fillStyle="#fff";cx.fill();cx.strokeStyle="#222";cx.lineWidth=1;cx.stroke()}
function plant(x,y){cx.fillStyle="rgba(0,0,0,.18)";cx.beginPath();cx.ellipse(x,y+16,13,4,0,0,7);cx.fill();cx.fillStyle="#7a4a2b";cx.beginPath();cx.moveTo(x-9,y);cx.lineTo(x+9,y);cx.lineTo(x+6,y+16);cx.lineTo(x-6,y+16);cx.fill();cx.fillStyle="#2f7d43";[[-8,-4],[8,-4],[0,-12],[-3,-2],[5,-9]].forEach(p=>{cx.beginPath();cx.arc(x+p[0],y+p[1],8,0,7);cx.fill()});cx.fillStyle="#48a862";cx.beginPath();cx.arc(x,y-8,6,0,7);cx.fill()}
/* ===================== DIBUJO 2.5D ===================== */
const FLOOR_T=48,FRONT_Y=556;
const VIS={shut:1,endAt:0,lastRep:null,ped:[],pedT:1,lt:0};
let BG=null,BGk=-1;
function buildBG(t){
  const c=document.createElement("canvas");c.width=W*2;c.height=FRONT_Y*2;const g=c.getContext("2d");g.scale(2,2);const R=srand(11+t*7);
  const fy=FLOOR_T;
  if(t===0){
    for(let y=fy;y<FRONT_Y;y+=40)for(let x=0;x<W;x+=40){g.fillStyle=((x+y)/40)%2?"#bcb6aa":"#b2ac9f";g.fillRect(x,y,40,40)}
    g.strokeStyle="rgba(60,50,40,.2)";g.lineWidth=1;g.beginPath();for(let x=0;x<=W;x+=40){g.moveTo(x,fy);g.lineTo(x,FRONT_Y)}for(let y=fy;y<=FRONT_Y;y+=40){g.moveTo(0,y);g.lineTo(W,y)}g.stroke();
    for(let i=0;i<16;i++){g.fillStyle="rgba(90,70,50,.08)";g.beginPath();g.ellipse(R()*W,fy+R()*(FRONT_Y-fy),8+R()*22,4+R()*10,R()*3,0,7);g.fill()}
    g.fillStyle="#d8c7a3";g.fillRect(0,0,W,fy);for(let i=0;i<10;i++){g.fillStyle="rgba(120,90,50,.1)";g.beginPath();g.ellipse(R()*W,R()*fy,6+R()*16,3+R()*8,0,0,7);g.fill()}
    g.fillStyle="#8a6a44";g.fillRect(0,fy-6,W,6);
  }else if(t===1){
    for(let y=fy;y<FRONT_Y;y+=18){let x=-R()*120;while(x<W){const w=80+R()*90,l=42+R()*12;g.fillStyle=`hsl(30,42%,${l}%)`;g.fillRect(x,y,w,18);g.fillStyle="rgba(60,35,15,.35)";g.fillRect(x,y,1.2,18);x+=w}g.fillStyle="rgba(60,35,15,.3)";g.fillRect(0,y,W,1)}
    g.fillStyle="#9cc3d9";g.fillRect(0,0,W,22);g.fillStyle="#eef3f5";g.fillRect(0,22,W,fy-22);g.strokeStyle="rgba(0,0,0,.08)";g.beginPath();for(let x=0;x<W;x+=12){g.moveTo(x,24);g.lineTo(x,fy-6)}g.stroke();
    g.fillStyle="#fff";g.fillRect(0,21,W,3);g.fillStyle="#f7f7f7";g.fillRect(0,fy-6,W,6);
  }else if(t===2){
    for(let y=fy;y<FRONT_Y;y+=50)for(let x=0;x<W;x+=50){g.fillStyle=((x+y)/50)%2?"#ebe5d9":"#e0d9cb";g.fillRect(x,y,50,50)}
    g.strokeStyle="rgba(0,0,0,.07)";g.beginPath();for(let x=0;x<=W;x+=50){g.moveTo(x,fy);g.lineTo(x,FRONT_Y)}for(let y=fy;y<=FRONT_Y;y+=50){g.moveTo(0,y);g.lineTo(W,y)}g.stroke();
    g.globalAlpha=.3;g.fillStyle="#e3350d";g.beginPath();g.arc(470,215,58,Math.PI,0);g.fill();g.fillStyle="#fff";g.beginPath();g.arc(470,215,58,0,Math.PI);g.fill();g.fillStyle="#222";g.fillRect(412,211,116,8);g.beginPath();g.arc(470,215,17,0,7);g.fill();g.fillStyle="#fff";g.beginPath();g.arc(470,215,10,0,7);g.fill();g.globalAlpha=1;
    g.fillStyle="#f4e7c8";g.fillRect(0,0,W,fy);for(let y=6;y<fy-8;y+=14)for(let x=(y/14%2)*11;x<W;x+=22){g.fillStyle="rgba(227,53,13,.18)";g.beginPath();g.arc(x,y,2.6,0,7);g.fill()}
    g.fillStyle="#c0392b";g.fillRect(0,fy-6,W,6);
  }else{
    g.fillStyle="#efeee9";g.fillRect(0,fy,W,FRONT_Y-fy);g.strokeStyle="rgba(120,120,135,.2)";g.lineWidth=1;
    for(let i=0;i<70;i++){const x=R()*W,y=fy+R()*(FRONT_Y-fy);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+R()*80-40,y+R()*40-20,x+R()*120-60,y+R()*50-25);g.stroke()}
    g.strokeStyle="rgba(0,0,0,.06)";g.beginPath();for(let x=0;x<=W;x+=80){g.moveTo(x,fy);g.lineTo(x,FRONT_Y)}for(let y=fy;y<=FRONT_Y;y+=80){g.moveTo(0,y);g.lineTo(W,y)}g.stroke();
    g.fillStyle="#7a1f2a";g.fillRect(332,300,44,FRONT_Y-300);g.strokeStyle="#c9a227";g.lineWidth=2;g.strokeRect(334,302,40,FRONT_Y-304);
    g.fillStyle="#1f2a44";g.fillRect(0,0,W,fy);g.fillStyle="#c9a227";g.fillRect(0,7,W,1.5);g.fillRect(0,fy-11,W,1.5);g.fillStyle="#0d1322";g.fillRect(0,fy-6,W,6);
  }
  g.fillStyle="rgba(0,0,0,.28)";g.fillRect(0,0,W,3);
  const sh=g.createLinearGradient(0,fy,0,fy+18);sh.addColorStop(0,"rgba(0,0,0,.2)");sh.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=sh;g.fillRect(0,fy,W,18);
  g.fillStyle="rgba(0,0,0,.22)";if(!S.annex)g.fillRect(0,fy,6,FRONT_Y-fy);g.fillRect(W-6,fy,6,FRONT_Y-fy);
  {const st=STYLES[S.style||"clasico"];if(st&&st.c){g.globalCompositeOperation="color";g.globalAlpha=.45;g.fillStyle=st.c;g.fillRect(0,0,W,FRONT_Y);g.globalAlpha=1;g.globalCompositeOperation="source-over"}}
  return c;
}
function box3d(x,y,w,d,h,top,front,edge){
  {const sx=SUN.dx,L=7+Math.abs(sx)*.25;cx.fillStyle=`rgba(0,0,0,${SUN.a})`;cx.beginPath();cx.moveTo(x+2,y+d);cx.lineTo(x+w+2,y+d);cx.lineTo(x+w+2+sx,y+d+L);cx.lineTo(x+2+sx,y+d+L);cx.closePath();cx.fill();const ex=sx>0?x+w:x;cx.beginPath();cx.moveTo(ex,y+d-h*.25);cx.lineTo(ex+sx*.9,y+d-h*.25+L*.6);cx.lineTo(ex+sx,y+d+L);cx.lineTo(ex,y+d);cx.closePath();cx.fill()}
  cx.fillStyle=front;cx.fillRect(x,y+d-h,w,h);cx.fillStyle=top;cx.fillRect(x,y-h,w,d);
  cx.fillStyle=edge||"rgba(255,255,255,.2)";cx.fillRect(x,y+d-h,w,1.5);cx.fillStyle="rgba(0,0,0,.18)";cx.fillRect(x+w-3,y+d-h,3,h);
}
function packIcon(px,py,sd,w,h){
  w=w||14;h=h||20;const g=cx.createLinearGradient(px,py,px+w,py+h);g.addColorStop(0,"#fff");g.addColorStop(.15,sd.col);g.addColorStop(.75,sd.col);g.addColorStop(1,"#0006");
  cx.fillStyle=g;rr(px,py,w,h,2);cx.fill();cx.fillStyle="rgba(255,255,255,.45)";cx.fillRect(px,py,w,2.5);cx.fillRect(px,py+h-2.5,w,2.5);
  const im=timg(sd.sym);if(im)cx.drawImage(im,px+w/2-4,py+h/2-4,8,8);else{cx.fillStyle="rgba(255,255,255,.85)";cx.beginPath();cx.arc(px+w/2,py+h/2,3.4,0,7);cx.fill()}
}
function drawWall(){
  const t=tierOf(level()),T=TIERS[t],now=performance.now()/1000;
  [[36,"#e3350d"],[74,"#3f7fc4"],[690,"#f2b705"],[728,"#2fa557"]].forEach(p=>{cx.fillStyle=t===3?"#c9a227":"#fff";rr(p[0],7,28,26,3);cx.fill();cx.fillStyle=p[1];cx.fillRect(p[0]+3,10,22,20);pokeball(p[0]+14,20,6)});
  const cxm=W/2;
  if(t===0){cx.fillStyle="#6b4527";rr(cxm-112,9,224,27,4);cx.fill();cx.fillStyle="#8a5a33";rr(cxm-108,11,216,23,3);cx.fill();txt(shopName().toUpperCase(),cxm,28,fitS(shopName(),16,200),"#f4e2c0","center")}
  else if(t===1){cx.fillStyle="#f2b705";rr(cxm-130,7,260,29,7);cx.fill();cx.strokeStyle="#a37a00";cx.lineWidth=2;cx.stroke();pokeball(cxm-108,21,8);txt(shopName().toUpperCase(),cxm+10,27,fitS(shopName(),15,210),"#2a2000","center")}
  else if(t===2){cx.fillStyle="#fff";rr(cxm-140,5,280,33,6);cx.fill();cx.fillStyle="#e3350d";rr(cxm-140,5,280,15,6);cx.fill();cx.fillRect(cxm-140,12,280,8);cx.fillStyle="#222";cx.fillRect(cxm-140,19,280,2);pokeball(cxm-118,21,10);txt(shopName().toUpperCase(),cxm+12,33,fitS(shopName(),14,220),"#1b1f2a","center")}
  else{cx.fillStyle="#0b0f1a";rr(cxm-160,4,320,36,6);cx.fill();for(let i=0;i<32;i++){const on=Math.floor(now*6+i)%4===0;cx.fillStyle=on?"#fff6c0":"#8a6d1a";cx.beginPath();cx.arc(cxm-154+i*9.9,7,1.6,0,7);cx.arc(cxm-154+i*9.9,37,1.6,0,7);cx.fill()}
    const g=cx.createLinearGradient(0,12,0,32);g.addColorStop(0,"#fff3b0");g.addColorStop(1,"#c9a227");cx.save();cx.shadowColor="#ffd54a";cx.shadowBlur=8;txt(shopName().toUpperCase(),cxm,29,fitS(shopName(),16,290),g,"center");cx.restore()}
  if(t===3)[180,620].forEach(x=>{cx.fillStyle="#c9a227";cx.fillRect(x-4,18,8,10);cx.fillStyle="#fff6c0";cx.beginPath();cx.arc(x,16,5,Math.PI,0);cx.fill()});
  const D=S.decor;
  if(D.poster)[[112,"#3f7fc4"],[164,"#d65fae"],[216,"#2fa557"]].forEach(([x,c])=>{cx.fillStyle="#fff";rr(x,6,40,32,3);cx.fill();cx.fillStyle=c;cx.fillRect(x+3,9,34,26);cx.fillStyle="#fffa";cx.beginPath();cx.arc(x+20,22,7,0,7);cx.fill()});
  if(D.neon){cx.save();cx.shadowColor="#ff4fd8";cx.shadowBlur=12;txt("★ ABIERTO ★",612,28,13,S.phase==="closed"?"#8a5a80":"#ffc4f3","center");cx.restore()}
  const se=season();
  if(se==="xmas"){cx.strokeStyle="#1f6b35";cx.lineWidth=4;cx.beginPath();for(let x=0;x<=W;x+=40){cx.moveTo(x,2);cx.quadraticCurveTo(x+20,12,x+40,2)}cx.stroke();
    for(let x=10;x<W;x+=20){const c=["#ff4d4d","#ffd54a","#4dd2ff","#7dff7a"][(x/20)%4|0],on=Math.sin(now*3+x)>0;cx.fillStyle=on?c:"#555";cx.beginPath();cx.arc(x,4+Math.sin((x%40)/40*Math.PI)*6,2.4,0,7);cx.fill()}}
  if(se==="hallo"){cx.strokeStyle="rgba(255,255,255,.55)";cx.lineWidth=.8;[[8,FLOOR_T,1],[W-8,FLOOR_T,-1]].forEach(([x,y,s])=>{cx.beginPath();for(let a=0;a<5;a++){cx.moveTo(x,y-40);cx.lineTo(x+s*(a*9),y-40+ (4-a)*9)}for(let r=8;r<40;r+=9){cx.moveTo(x,y-40+r);cx.quadraticCurveTo(x+s*r*.5,y-40+r*.6,x+s*r,y-40)}cx.stroke()});
    for(let x=10;x<W;x+=24){cx.fillStyle=(x/24|0)%2?"#ff8a1f":"#9b4dff";cx.beginPath();cx.arc(x,5,2.4,0,7);cx.fill()}}
}
function drawShelf(i){
  const s=LAY.shelf(i),id=S.slots[i],sd=id&&SETS.find(d=>d.id===id),t=tierOf(level());
  const top=["#8a5a33","#b88b5c","#f2efe8","#2a2f3a"][t],fr=["#5c3b20","#8a5f38","#d9d3c7","#161a22"][t];
  const d=26,h=58,y0=s.y+s.h-d,ft=s.y+s.h-h;
  box3d(s.x-4,y0,s.w+8,d,h,top,fr);
  cx.fillStyle="#241609";cx.fillRect(s.x,ft+6,s.w,h-10);cx.fillStyle="rgba(255,255,255,.08)";cx.fillRect(s.x,ft+6,s.w,3);
  cx.fillStyle=top;cx.fillRect(s.x,ft+29,s.w,3);
  if(!sd){cx.fillStyle="rgba(255,255,255,.18)";rr(s.x+6,y0-h+4,s.w-12,15,4);cx.fill();txt("Estantería libre",s.x+s.w/2,y0-h+15,10,"#fff","center");return}
  cx.fillStyle=sd.col;rr(s.x+4,y0-h+3,s.w-8,16,4);cx.fill();txt(sd.n.length>22?sd.n.slice(0,21)+"…":sd.n,s.x+s.w/2,y0-h+15,10,"#fff","center");
  {const ref=S.pack[id]&&S.pack[id].ref,nuevo=sd.date&&Date.now()-new Date(String(sd.date).replace(/\//g,"-")).getTime()<200*864e5;if(ref&&S.shelf[id]<ref*.95){cx.fillStyle="#e3350d";rr(s.x+s.w-40,y0-h-9,42,13,3);cx.fill();txt("OFERTA",s.x+s.w-19,y0-h+1,8,"#fff","center")}else if(nuevo){cx.fillStyle="#f2b705";rr(s.x+s.w-44,y0-h-9,46,13,3);cx.fill();txt("¡NUEVO!",s.x+s.w-21,y0-h+1,8,"#2a2000","center")}}
  const q=S.sealed[id];
  for(let k=0;k<Math.min(q,14);k++)packIcon(s.x+6+(k%7)*20,k<7?ft+8:ft+33,sd);
  if(q<1){cx.fillStyle="rgba(0,0,0,.5)";cx.fillRect(s.x,ft+6,s.w,h-10);txt("AGOTADO",s.x+s.w/2,ft+34,12,"#fff","center")}
  cx.fillStyle="#fff";rr(s.x+s.w/2-40,s.y+s.h+3,80,14,4);cx.fill();txt(`${q} · ${fmt(S.shelf[id])}`,s.x+s.w/2,s.y+s.h+13,10,q?"#1b1f2a":"#c0392b","center");
}
function drawDesk(){
  box3d(642,98,130,30,24,"#8a5a33","#5c3b20");
  cx.fillStyle="#222";rr(676,34,64,40,4);cx.fill();cx.fillStyle="#0d2b1b";cx.fillRect(680,38,56,30);
  cx.strokeStyle="#4cc98a";cx.lineWidth=1.5;cx.beginPath();[[684,62],[694,56],[702,59],[712,48],[722,52],[732,42]].forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();
  cx.fillStyle="#333";cx.fillRect(704,74,8,5);cx.fillStyle="#555";rr(686,82,48,8,2);cx.fill();
}
function drawProd(){
  const b=LAY.prod,ids=Object.keys(S.prod).filter(p=>pStock(p)>0&&pInfo(p));
  if(!ids.length&&!S.prodSeen)return;
  const d=26,h=58,y0=b.y+b.h-d,ft=b.y+b.h-h;box3d(b.x-4,y0,b.w+8,d,h,"#8a5a33","#5c3b20");
  cx.fillStyle="#241609";cx.fillRect(b.x,ft+6,b.w,h-10);cx.fillStyle="#8a5a33";cx.fillRect(b.x,ft+29,b.w,3);
  let k=0;
  for(const pid of ids){const i=pInfo(pid),n=Math.min(pStock(pid),i.t==="acc"?3:2),sd=i.s&&SETS.find(z=>z.id===i.s);
    for(let j=0;j<n&&k<14;j++,k++){const px=b.x+4+(k%7)*23.5,py=k<7?ft+8:ft+33;
      if(i.t==="box"){cx.fillStyle=i.col;rr(px,py,21,20,2);cx.fill();cx.fillStyle="#fff9";cx.fillRect(px+2,py+2,17,3);const im=sd&&timg(sd.sym);if(im)cx.drawImage(im,px+6,py+7,9,9);else pokeball(px+10.5,py+12,4)}
      else if(i.t==="etb"){cx.fillStyle="#3b2a66";rr(px,py,21,20,2);cx.fill();cx.fillStyle=i.col;cx.fillRect(px,py+7,21,6)}
      else if(i.t==="tin"){cx.fillStyle="#b8c0cc";rr(px+2,py+1,17,19,6);cx.fill();cx.fillStyle=i.col;cx.beginPath();cx.arc(px+10.5,py+10,5,0,7);cx.fill()}
      else if(i.t==="col"){cx.fillStyle="#d4a017";rr(px,py,21,20,2);cx.fill();cx.fillStyle=i.col;cx.fillRect(px+3,py+3,15,10)}
      else{cx.fillStyle=i.col;rr(px+3,py+4,15,16,2);cx.fill();cx.fillStyle="#fff7";cx.fillRect(px+5,py+6,11,3)}}}
  cx.fillStyle="#fff";rr(b.x+b.w/2-54,y0-h+3,108,15,4);cx.fill();txt("Sellado y accesorios",b.x+b.w/2,y0-h+14,10,"#1b1f2a","center");
}
function drawCase(){
  const c=LAY.cs(),cap=caseCap(),its=caseItems(),h=24,t=tierOf(level());
  box3d(c.x-6,c.y,c.w+12,c.h,h,"#cfe6ef",["#3b3f4a","#4a3a2a","#e9e4da","#15181f"][t]);
  const g=cx.createLinearGradient(0,c.y-h,0,c.y+c.h-h);g.addColorStop(0,"#f2fbff");g.addColorStop(1,"#bfdbe8");cx.fillStyle=g;cx.fillRect(c.x-4,c.y-h+2,c.w+8,c.h-4);
  for(let k=0;k<cap;k++){
    const px=c.x+6+(k%8)*32,py=c.y-h+5+Math.floor(k/8)*44,it=its[k];
    if(it){const cd=BYID[it.c],im=timg(cd.img);cx.fillStyle="rgba(0,0,0,.18)";cx.fillRect(px+2,py+2,24,33);
      if(im)cx.drawImage(im,px,py,24,33);else{cx.fillStyle=RAR[cd.r].c;cx.fillRect(px,py,24,33);cx.fillStyle="#fff8";cx.fillRect(px+3,py+4,18,12)}
      cx.strokeStyle=it.gr?"#c0392b":RAR[cd.r].c;cx.lineWidth=it.gr?2.5:1.5;cx.strokeRect(px,py,24,33);
      if(it.res){cx.fillStyle="rgba(255,255,255,.55)";cx.fillRect(px,py,24,33)}
      const pv=itemVal(it)*it.case;cx.fillStyle="#fff";rr(px-2,py+34,28,9,2);cx.fill();txt(pv>=100?Math.round(pv)+"€":pv.toFixed(pv>=10?1:2).replace(".",",")+"€",px+12,py+41,7,"#123","center");
    }else{cx.fillStyle="rgba(0,0,0,.06)";rr(px,py,24,33,3);cx.fill()}
  }
  {const o=(performance.now()/22)%(c.w+260)-120;cx.fillStyle="rgba(255,255,255,.4)";cx.beginPath();cx.moveTo(c.x+o,c.y+c.h-h);cx.lineTo(c.x+o+50,c.y-h);cx.lineTo(c.x+o+80,c.y-h);cx.lineTo(c.x+o+30,c.y+c.h-h);cx.fill()}
  cx.fillStyle="#7fe3ff";cx.fillRect(c.x-6,c.y+c.h-h+3,c.w+12,2);
  txt(`Vitrina · ${its.length}/${cap}`,c.x,c.y+c.h-6,11,t===2?"#1b1f2a":"#fff");
}
function drawCounter(){
  const c=LAY.counter,h=30,t=tierOf(level());
  box3d(c.x-4,c.y,c.w+8,c.h,h,["#9a6a40","#b88b5c","#f2efe8","#2a2f3a"][t],["#6b4527","#8a5f38","#d9d3c7","#161a22"][t]);
  if(t===3){cx.fillStyle="#c9a227";cx.fillRect(c.x-4,c.y+c.h-h,c.w+8,2)}
  const ry=c.y+76;
  cx.fillStyle="#2b2f38";cx.fillRect(c.x+8,ry+12,40,16);cx.fillStyle="#3a3f4b";cx.fillRect(c.x+8,ry-12,40,24);cx.fillStyle="#7fe3a0";cx.fillRect(c.x+13,ry-8,30,10);txt("€",c.x+28,ry+1,9,"#0d2b1b","center");
  cx.fillStyle="#aaa";for(let i=0;i<3;i++)cx.fillRect(c.x+13+i*10,ry+5,8,4);
  if(VIS.drawer>0){const k=Math.min(1,(1.4-VIS.drawer)*7,VIS.drawer*5);cx.fillStyle="#2b2f38";cx.fillRect(c.x+8-14*k,ry+12,40,14);cx.fillStyle="#555";for(let i=0;i<4;i++)cx.fillRect(c.x+10-14*k+i*9,ry+14,7,10);cx.fillStyle="#6cc070";cx.fillRect(c.x+11-14*k,ry+15,5,8);cx.fillStyle="#f2c14e";cx.fillRect(c.x+29-14*k,ry+17,5,5);cx.fillStyle="#fff";cx.fillRect(c.x+30,ry-12-14*k,8,14*k)}
  cx.fillStyle="#111";rr(c.x+14,ry+40,20,28,3);cx.fill();cx.fillStyle="#a8f0b8";cx.fillRect(c.x+17,ry+43,14,9);
  cx.fillStyle="#f2b705";cx.beginPath();cx.arc(c.x+14,c.y+20,6,0,7);cx.arc(c.x+14,c.y+14,6,0,7);cx.fill();
  txt("CAJA",c.x+c.w/2,c.y+c.h-10,11,t===2?"#1b1f2a":"#fff","center");
}
function drawDecorFloor(){
  const D=S.decor;
  if(D.rug){cx.save();cx.translate(262,505);cx.scale(1,.42);cx.fillStyle="#e3350d";cx.beginPath();cx.arc(0,0,60,Math.PI,0);cx.fill();cx.fillStyle="#f4f4f4";cx.beginPath();cx.arc(0,0,60,0,Math.PI);cx.fill();cx.fillStyle="#1d1d1d";cx.fillRect(-60,-6,120,12);cx.beginPath();cx.arc(0,0,17,0,7);cx.fill();cx.fillStyle="#f4f4f4";cx.beginPath();cx.arc(0,0,10,0,7);cx.fill();cx.restore()}
  cx.fillStyle="#6b4527";rr(328,536,54,16,3);cx.fill();txt("BIENVENIDO",355,547,7,"#e8d5b0","center");
}
function decorObjs(L){
  const D=S.decor,se=season(),open=S.phase!=="closed";
  if(D.table){L.push({y:330,f:()=>{
    if(!(S.tour&&open))[[175,262],[300,262]].forEach(([x,y])=>box3d(x-8,y-6,16,10,12,"#8a5a33","#5c3b20"));
    box3d(140,276,196,54,18,"#5c3b20","#4a2f18");cx.fillStyle="#2f7d4a";cx.fillRect(146,262,184,42);
    [[180,270],[210,276],[270,268],[296,279]].forEach(([x,y],i)=>{cx.fillStyle=["#fff","#d9402a","#4a86c9","#f2b705"][i];cx.fillRect(x,y,12,16)})}});
    if(!(S.tour&&open))[[175,356],[300,356]].forEach(([x,y])=>L.push({y,f:()=>box3d(x-8,y-10,16,10,12,"#8a5a33","#5c3b20")}));
  }
  if(D.coffee)L.push({y:330,f:()=>{box3d(560,306,38,24,44,"#3a3d46","#2d2f36");cx.fillStyle="#c0392b";cx.fillRect(564,292,30,7);cx.fillStyle="#111";cx.fillRect(570,303,18,12);cx.fillStyle="#fff";rr(574,311,10,8,2);cx.fill();txt("CAFÉ",579,326,8,"#fff","center")}});
  if(D.sofa)L.push({y:518,f:()=>{box3d(510,488,100,12,34,"#b23a3a","#8e2f2f");box3d(510,500,100,18,14,"#c24545","#8e2f2f")}});
  if(D.plants)[[562,248],[20,300],[610,450]].forEach(([x,y])=>L.push({y:y+16,f:()=>plant(x,y)}));
  [[20,490],[782,500],[610,118]].forEach(([x,y])=>L.push({y:y+16,f:()=>plant(x,y)}));
  if(se==="xmas")L.push({y:530,f:()=>{const x=470,y=530;cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(x,y,18,5,0,0,7);cx.fill();cx.fillStyle="#7a4a2b";cx.fillRect(x-3,y-8,6,8);
    [[26,-8,-26],[21,-22,-38],[15,-34,-50]].forEach(([w,y1,y2])=>{cx.fillStyle="#1f7a3a";cx.beginPath();cx.moveTo(x-w,y+y1);cx.lineTo(x+w,y+y1);cx.lineTo(x,y+y2);cx.fill()});
    const t=performance.now()/400;[[-12,-14],[10,-18],[-6,-30],[7,-36],[0,-24],[-14,-12]].forEach(([dx,dy],i)=>{cx.fillStyle=["#ff4d4d","#ffd54a","#4dd2ff"][i%3];cx.globalAlpha=.6+.4*Math.sin(t+i);cx.beginPath();cx.arc(x+dx,y+dy,2.4,0,7);cx.fill();cx.globalAlpha=1});
    star(x,y-52,5,"#ffd54a")}});
  if(se==="hallo")[[300,548],[412,548]].forEach(([x,y],i)=>L.push({y,f:()=>{cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(x,y+1,12,4,0,0,7);cx.fill();cx.fillStyle="#ff8a1f";cx.beginPath();cx.ellipse(x,y-7,12,9,0,0,7);cx.fill();cx.fillStyle="#e06a00";cx.fillRect(x-1,y-16,2,18);cx.fillStyle="#3b6b1f";cx.fillRect(x-1.5,y-19,3,4);
    const on=S.phase!=="closed"||i;cx.fillStyle=on?"#ffe27a":"#5a2a00";cx.beginPath();cx.moveTo(x-6,y-9);cx.lineTo(x-3,y-12);cx.lineTo(x-1,y-9);cx.moveTo(x+6,y-9);cx.lineTo(x+3,y-12);cx.lineTo(x+1,y-9);cx.fill();cx.fillRect(x-5,y-5,10,2)}}));
}
function drawFrontWall(){
  const t=tierOf(level()),se=season(),wc=["#b9a57f","#d9e6ee","#e9dcc0","#26324f"][t],wt=["#d8c7a3","#eef3f5","#f4e7c8","#1f2a44"][t];
  const g=cx.createLinearGradient(0,520,0,548);g.addColorStop(0,"rgba(190,225,245,.05)");g.addColorStop(1,"rgba(190,225,245,.28)");
  if(S.annex){cx.fillStyle=g;cx.fillRect(-276,520,272,30);cx.fillStyle="#5b6470";for(let x=-276;x<=-4;x+=68)cx.fillRect(x,518,3,32);cx.fillStyle=wt;cx.fillRect(-276,548,276,8);cx.fillStyle=wc;cx.fillRect(-276,556,276,14);cx.fillStyle="rgba(0,0,0,.25)";cx.fillRect(-276,569,276,2)}
  [[6,316],[396,794]].forEach(([a,b])=>{cx.fillStyle=g;cx.fillRect(a,520,b-a,30);cx.fillStyle="rgba(255,255,255,.35)";for(let x=a+30;x<b;x+=90){cx.beginPath();cx.moveTo(x,548);cx.lineTo(x+14,520);cx.lineTo(x+22,520);cx.lineTo(x+8,548);cx.fill()}
    cx.fillStyle="#5b6470";for(let x=a;x<=b;x+=78)cx.fillRect(Math.min(x,b-3),518,3,32)});
  const deco={xmas:"❄",winter:"❄",hallo:"🎃",spring:"✿",summer:"☀",autumn:"🍁"}[se];
  cx.fillStyle="rgba(255,255,255,.75)";cx.font="700 13px system-ui,sans-serif";cx.textAlign="center";
  if(se==="summer")txt("¡REBAJAS DE VERANO!",160,538,11,"rgba(255,120,40,.85)","center");else if(deco){[70,150,230,470,560,650,730].forEach((x,i)=>{cx.globalAlpha=.55;cx.fillText(deco,x,532+(i%2)*9);cx.globalAlpha=1})}
  txt(shopName().toUpperCase(),610,544,10,"rgba(255,255,255,.7)","center");
  cx.fillStyle=wt;cx.fillRect(0,548,316,8);cx.fillRect(396,548,W-396,8);cx.fillStyle=wc;cx.fillRect(0,556,316,14);cx.fillRect(396,556,W-396,14);
  cx.fillStyle="rgba(0,0,0,.25)";cx.fillRect(0,569,316,2);cx.fillRect(396,569,W-396,2);
  cx.fillStyle="#5b6470";cx.fillRect(314,516,6,54);cx.fillRect(392,516,6,54);cx.fillRect(314,514,84,4);
  if(se==="spring")[[40,"#ff9ecf"],[200,"#ffe066"],[470,"#ff9ecf"],[690,"#b39dff"]].forEach(([x,c])=>{cx.fillStyle="#6b4527";cx.fillRect(x,550,60,8);for(let i=0;i<6;i++){cx.fillStyle="#3b8a3b";cx.fillRect(x+5+i*10,544,2,6);cx.fillStyle=c;cx.beginPath();cx.arc(x+6+i*10,543,3,0,7);cx.fill()}});
  const op=S.phase!=="closed";cx.fillStyle="#fff";rr(372,524,18,12,2);cx.fill();txt(op?"OPEN":"CLOSED",381,533,5,op?"#2fa557":"#c0392b","center");
}
function drawShutter(){
  const now=performance.now(),dt=Math.min(.05,(now-(VIS.lt||now))/1000);VIS.lt=now;if(VIS.dawn>0&&!VIS.endAt)VIS.dawn=Math.max(0,VIS.dawn-dt/2.8);
  const tgt=(S.phase==="closed"||VIS.endAt)?1:0;VIS.shut+=clamp(tgt-VIS.shut,-dt*1.4,dt*1.4);const a=AX(),ww=W-a;
  cx.fillStyle="#3b4049";cx.fillRect(a,506,ww,9);cx.fillStyle="rgba(255,255,255,.12)";cx.fillRect(a,506,ww,2);
  const hh=VIS.shut*56;if(hh<1)return;
  const g=cx.createLinearGradient(0,515,0,515+hh);g.addColorStop(0,"#9aa3ad");g.addColorStop(1,"#7b838e");cx.fillStyle=g;cx.fillRect(a,515,ww,hh);
  cx.fillStyle="rgba(0,0,0,.15)";for(let y=515+4;y<515+hh;y+=6)cx.fillRect(a,y,ww,1.5);
  cx.fillStyle="#5b6470";cx.fillRect(a,515+hh-3,ww,3);
  if(VIS.shut>.8){cx.globalAlpha=(VIS.shut-.8)*5;txt("CERRADO · VOLVEMOS PRONTO",W/2,515+hh/2+5,14,"#2a2f3a","center");cx.globalAlpha=1}
}
/* ----- ciudad ----- */
const CX0=-560,CX1=W+560,CY0=-300,CY1=980;
let CITY=null,CITYk="",CITYWIN=[];
function roofDraw(g,x,y,w,h,R,se){
  const cols=["#8a8f96","#9a7b5f","#7d8a7a","#a86b5a","#868c9c"];g.fillStyle=cols[Math.floor(R()*cols.length)];g.fillRect(x,y,w,h);
  g.strokeStyle="rgba(0,0,0,.28)";g.lineWidth=4;g.strokeRect(x+2,y+2,w-4,h-4);
  for(let i=0;i<w*h/220;i++){g.fillStyle=`rgba(${R()<.5?0:255},${R()<.5?0:255},${R()<.5?0:255},.04)`;g.fillRect(x+R()*w,y+R()*h,2,2)}
  const n=1+Math.floor(R()*3);for(let i=0;i<n;i++){const ax=x+12+R()*(w-50),ay=y+12+R()*(h-50),t=R();
    if(t<.45){g.fillStyle="#c9ccd2";g.fillRect(ax,ay,30,22);g.fillStyle="#9aa0a8";g.beginPath();g.arc(ax+15,ay+11,8,0,7);g.fill();g.strokeStyle="#6d737c";g.lineWidth=1;g.stroke()}
    else if(t<.75){g.fillStyle="#a8d4e8";g.fillRect(ax,ay,34,24);g.strokeStyle="#5b6470";g.lineWidth=2;g.strokeRect(ax,ay,34,24);g.beginPath();g.moveTo(ax+17,ay);g.lineTo(ax+17,ay+24);g.stroke()}
    else{g.fillStyle="#6b4527";g.beginPath();g.arc(ax+14,ay+14,13,0,7);g.fill();g.strokeStyle="#4a2f18";g.lineWidth=2;g.stroke()}}
  if(se==="xmas"||se==="winter"){g.fillStyle="rgba(255,255,255,.72)";g.fillRect(x+3,y+3,w-6,h-6);for(let i=0;i<8;i++){g.fillStyle="rgba(200,215,230,.6)";g.beginPath();g.ellipse(x+R()*w,y+R()*h,10+R()*20,5+R()*8,0,0,7);g.fill()}}
  if(se==="autumn")for(let i=0;i<w*h/900;i++){g.fillStyle=["#d9822b","#b5451b","#e0b43a"][i%3];g.beginPath();g.ellipse(x+R()*w,y+R()*h,3,1.6,R()*3,0,7);g.fill()}
}
function facadeDraw(g,x,y,w,name,col,R){
  g.fillStyle="#e8e1d3";g.fillRect(x,y,w,54);
  g.fillStyle=col;g.fillRect(x+8,y+2,w-16,13);g.fillStyle="#fff";g.font="700 10px 'Fredoka',system-ui,sans-serif";g.textAlign="center";g.fillText(name,x+w/2,y+12);
  for(let i=0;i<w-16;i+=14){g.fillStyle=(i/14)%2?col:"#fff";g.fillRect(x+8+i,y+16,14,9)}g.fillStyle="rgba(0,0,0,.18)";g.fillRect(x+8,y+25,w-16,2);
  const dw=26,dx=x+w/2-dw/2;g.fillStyle="#3a2a20";g.fillRect(dx,y+28,dw,26);g.fillStyle="#d9b36c";g.fillRect(dx+dw-6,y+40,2,4);
  [[x+10,dx-6],[dx+dw+6,x+w-10]].forEach(([a,b])=>{if(b-a<12)return;g.fillStyle="#9fc3d6";g.fillRect(a,y+29,b-a,20);g.fillStyle="rgba(255,255,255,.35)";g.fillRect(a+6,y+29,6,20);g.strokeStyle="#5b6470";g.lineWidth=2;g.strokeRect(a,y+29,b-a,20);CITYWIN.push([a,y+29,b-a,20])});
}
function drawTree(x,y){const se=season();cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(x+6,y+2,20,7,0,0,7);cx.fill();cx.fillStyle="#6b4527";cx.fillRect(x-3,y-18,6,20);
  const c1=se==="autumn"?"#c9661f":se==="xmas"||se==="winter"?"#4f6b5a":"#2f7d43",c2=se==="autumn"?"#e0a13a":se==="xmas"||se==="winter"?"#e8eef2":"#48a862";
  cx.fillStyle=c1;[[-10,-26],[10,-26],[0,-38],[-4,-22],[6,-32]].forEach(([dx,dy])=>{cx.beginPath();cx.arc(x+dx,y+dy,13,0,7);cx.fill()});cx.fillStyle=c2;cx.beginPath();cx.arc(x-4,y-36,7,0,7);cx.fill()}
function drawStreet(){
  const se=season(),snow=se==="xmas"||se==="winter",a=CX0,w=CX1-CX0;
  cx.fillStyle="#9aa0a8";cx.fillRect(a,570,w,42);cx.fillRect(a,694,w,44);
  cx.strokeStyle="rgba(0,0,0,.12)";cx.lineWidth=1;cx.beginPath();for(let x=a;x<=CX1;x+=32){cx.moveTo(x,570);cx.lineTo(x,612);cx.moveTo(x,694);cx.lineTo(x,738)}cx.moveTo(a,591);cx.lineTo(CX1,591);cx.moveTo(a,716);cx.lineTo(CX1,716);cx.stroke();
  cx.fillStyle="#6d737c";cx.fillRect(a,612,w,4);cx.fillRect(a,690,w,4);cx.fillStyle="#3a3e46";cx.fillRect(a,616,w,74);
  cx.fillStyle="#e8e8e8";for(let x=a+10;x<CX1;x+=60)cx.fillRect(x,652,30,3);cx.fillStyle="rgba(255,255,255,.5)";cx.fillRect(a,620,w,2);cx.fillRect(a,686,w,2);
  cx.fillStyle="#f2f2f2";for(let y=622;y<686;y+=10)cx.fillRect(560,y,70,6);
  if(snow){cx.fillStyle="rgba(255,255,255,.75)";for(let x=a;x<CX1;x+=46){cx.beginPath();cx.ellipse(x+20,572,26,5,0,0,7);cx.fill();cx.beginPath();cx.ellipse(x+10,736,26,5,0,0,7);cx.fill()}cx.fillStyle="rgba(255,255,255,.3)";cx.fillRect(a,610,w,4);cx.fillRect(a,692,w,4)}
  if(se==="autumn")for(let i=0;i<120;i++){cx.fillStyle=["#d9822b","#b5451b","#e0b43a"][i%3];cx.beginPath();cx.ellipse(a+(i*97)%w,(i%2?575:698)+(i*37)%34,3,1.6,i,0,7);cx.fill()}
}
function streetFx(){
  const se=season(),t=performance.now()/1000,V=VIEW,vx0=-V.ox/V.s,vy0=-V.oy/V.s,vw=V.cw/V.s,vh=V.ch/V.s;
  const inShop=(x,y)=>x>AX()&&x<W&&y>0&&y<FRONT_Y;
  if(S.ev&&S.ev.t==="rain"){cx.strokeStyle="rgba(170,200,255,.6)";cx.lineWidth=1.2;cx.beginPath();for(let i=0,n=LITE()?40:140;i<n;i++){const x=vx0+((i*97+t*60)%vw),y=vy0+((i*37+t*300)%vh);if(inShop(x,y))continue;cx.moveTo(x,y);cx.lineTo(x-3,y+9)}cx.stroke()}
  let k=null;if(se==="xmas"||se==="winter")k="snow";else if(se==="autumn")k="leaf";else if(se==="spring")k="petal";if(!k)return;
  for(let i=0,n=LITE()?30:90;i<n;i++){const x=vx0+((i*71+t*(k==="snow"?12:25)+Math.sin(t+i)*14)%vw),y=vy0+((i*43+t*(k==="snow"?24:18))%vh);if(inShop(x,y))continue;
    if(k==="snow"){cx.fillStyle="rgba(255,255,255,.9)";cx.beginPath();cx.arc(x,y,1.8,0,7);cx.fill()}else{cx.fillStyle=k==="leaf"?["#d9822b","#b5451b","#e0b43a"][i%3]:"#ffb3d9";cx.beginPath();cx.ellipse(x,y,3,1.6,t*2+i,0,7);cx.fill()}}
}
const LAMPS=(()=>{const l=[];for(let x=CX0+90;x<CX1;x+=200)l.push([x,612,1],[x+100,694,-1]);return l.filter(([x])=>x<1066||x>1184)})();
function streetLamp(x,y,s){y=y||612;s=s||1;cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(x+2,y,8,3,0,0,7);cx.fill();cx.fillStyle="#2b2f38";cx.fillRect(x-2,y-64,4,64);cx.fillRect(s>0?x-2:x-12,y-64,14,3);cx.fillStyle="#3a3f4b";rr(s>0?x+6:x-18,y-66,12,7,2);cx.fill();cx.fillStyle=nightK()>.2?"#fff3b0":"#c9ccd2";cx.fillRect(s>0?x+8:x-16,y-59,8,2)}
function drawCar(c){
  if(c.bike){drawBike(c);return}
  if(c.van){drawVan(c);return}
  const L=c.bus?100:c.len,Wd=c.bus?28:22,x=c.x-L/2,y=c.y-Wd/2,f=c.dir>0?x+L:x,n=nightK();
  cx.fillStyle="rgba(0,0,0,.3)";rr(x+3,y+4,L,Wd,6);cx.fill();
  cx.fillStyle=c.bus?"#2f6fb3":c.col;rr(x,y,L,Wd,6);cx.fill();cx.fillStyle="rgba(255,255,255,.18)";cx.fillRect(x+4,y+2,L-8,3);
  if(c.bus){cx.fillStyle="#bfe3f5";for(let i=0;i<6;i++)cx.fillRect(x+8+i*15,y+4,10,Wd-8);cx.fillStyle="#fff";cx.fillRect(x,y+Wd/2-1,L,2)}
  else{cx.fillStyle="#1d2633";rr(x+L*.28,y+3,L*.44,Wd-6,4);cx.fill();cx.fillStyle="#9fc3d6";cx.fillRect(c.dir>0?x+L*.62:x+L*.28,y+4,L*.1,Wd-8)}
  cx.fillStyle="#fff6c0";cx.fillRect(c.dir>0?f-3:f,y+2,3,4);cx.fillRect(c.dir>0?f-3:f,y+Wd-6,3,4);cx.fillStyle="#d62828";cx.fillRect(c.dir>0?x:x+L-3,y+2,3,4);cx.fillRect(c.dir>0?x:x+L-3,y+Wd-6,3,4);
  if(n>.2){cx.save();cx.globalCompositeOperation="lighter";const g=cx.createLinearGradient(f,0,f+c.dir*90,0);g.addColorStop(0,`rgba(255,240,190,${.35*n})`);g.addColorStop(1,"rgba(255,240,190,0)");cx.fillStyle=g;cx.beginPath();cx.moveTo(f,y+2);cx.lineTo(f+c.dir*90,y-14);cx.lineTo(f+c.dir*90,y+Wd+14);cx.lineTo(f,y+Wd-2);cx.fill();cx.restore()}
}
function lighting(){
  const t=dayT(),n=nightK(),gold=t>.45&&t<.9?Math.sin((t-.45)/.45*Math.PI):0,A=CX0,B=CY0,Wd=CX1-CX0,Hd=CY1-CY0;
  if(t<.1&&S.phase!=="closed"){cx.fillStyle=`rgba(255,230,190,${.08*(1-t/.1)})`;cx.fillRect(A,B,Wd,Hd)}
  if(gold>0){cx.fillStyle=`rgba(255,140,50,${.12*gold})`;cx.fillRect(A,B,Wd,Hd)}
  if(n>0){
    cx.fillStyle=`rgba(12,18,52,${.62*n})`;cx.fillRect(AX(),0,W-AX(),FRONT_Y);
    cx.fillStyle=`rgba(8,12,40,${.66*n})`;cx.fillRect(A,B,Wd,-B);cx.fillRect(A,0,AX()-A,FRONT_Y);cx.fillRect(W,0,CX1-W,FRONT_Y);cx.fillRect(A,FRONT_Y,Wd,CY1-FRONT_Y);
    cx.save();cx.globalCompositeOperation="lighter";
    const pool=(x,y,r,a,c)=>{const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2)};
    [[170,190],[450,190],[170,430],[450,430],[700,300]].forEach(([x,y])=>pool(x,y,150,.075*n,"255,236,190"));
    pool(195,430,140,(S.decor.lights?.2:.08)*n,"190,235,255");
    LAMPS.forEach(([x,y,s])=>pool(x+(s>0?12:-12),y-30,85,.3*n,"255,230,160"));
    CITYWIN.forEach(([x,y,w,h],i)=>{if((i*7)%5===0)return;cx.fillStyle=`rgba(255,200,110,${.42*n})`;cx.fillRect(x,y,w,h);pool(x+w/2,y+h,40,.12*n,"255,200,120")});
    pool(W/2,600,200,.18*n,"255,230,190");
    if(S.decor.neon)pool(612,24,70,.35*n,"255,90,220");
    if(tierOf(level())===3)pool(W/2,22,180,.25*n,"255,215,90");
    cx.restore();
  }
}
function drawPed(p){const o=p.out;o.skin=p.skin;o.mv=true;o.ph=p.ph;o.mood="neutral";o.arm=null;o.bag=false;o.face=p.cross?0:p.dir;o.phone=false;if(p.dog)drawDog(p);drawPerson(p.x,p.y,o);
  if(S.ev&&S.ev.t==="rain"){cx.fillStyle=o.shirt;cx.beginPath();cx.arc(p.x,p.y-54,17,Math.PI,0);cx.fill();cx.strokeStyle="#222";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(p.x,p.y-54);cx.lineTo(p.x,p.y-30);cx.stroke()}}
function nightK(){if(VIS.endAt)return 1;if(S.phase==="closed"&&VIS.dawn>0)return VIS.dawn;return clamp((dayT()-.72)/.28,0,1)}
/* ----- personajes ----- */
const SHIRTS=["#4a90d9","#e3350d","#2fa557","#f2b705","#8e4cb5","#e07a2f","#1abc9c","#34495e","#d65fae","#95a5a6"],PANTS=["#2c3350","#3b3b3b","#5a4632","#1f3a5f","#6b6b6b"],HAIRC=["#2a1a0a","#6b3a1e","#c47a45","#111","#d9b36c","#8a8a8a"];
function mkOutfit(type,R){
  const o={shirt:pick(SHIRTS),pants:pick(PANTS),shoes:pick(["#141414","#f4f4f4","#7a3b1a"]),hair:pick(HAIRC),hs:rnd(5),sc:type==="kid"?.82:1,seed:Math.random()*4};
  if(type==="kid"){o.hat=Math.random()<.5?"cap":null;o.hatc=pick(["#d9534f","#3f7fc4","#2fa557"]);o.acc=Math.random()<.6?"backpack":null;o.bp=pick(["#c0392b","#f2b705","#3f7fc4"]);o.logo=Math.random()<.5}
  if(type==="investor"){o.shirt=pick(["#2d3142","#3d4257","#1f2233"]);o.suit=true;o.hs=0}
  if(type==="whale"){o.chain=true;o.shades=Math.random()<.7;o.shirt=pick(["#d0a52a","#f5f5f5","#111"])}
  if(type==="collector"){o.glasses=Math.random()<.5;o.acc=Math.random()<.35?"backpack":null;o.bp="#555"}
  if(type==="seller"){o.shirt=pick(["#a25fb5","#555","#6b4527"]);o.hs=4}
  if(type==="lot"){o.hs=3;o.hair="#cfcfcf";o.shirt="#8a5a2b";o.glasses=true}
  if(R){o.shirt=R.col;o.hair=R.hair;({rafa:()=>{o.shades=true;o.hs=0},lucia:()=>{o.hs=2;o.glasses=true},iker:()=>{o.hat="cap";o.hatc="#3f7fc4";o.acc="backpack";o.bp="#f2b705"},marcos:()=>{o.suit=true;o.hs=0},aitana:()=>{o.hs=1;o.chain=true;o.shades=true},hugo:()=>{o.logo=true;o.acc="backpack";o.bp="#2f2f38"},paco:()=>{o.hs=3;o.glasses=true}}[R.id]||(()=>{}))()}
  const se=season();if(!o.hat){if(se==="xmas"&&Math.random()<.35)o.hat="santa";if(se==="hallo"&&Math.random()<.25)o.hat="witch"}if(se==="summer"&&Math.random()<.35)o.shades=true;
  return o;
}
function drawHair(o,hy){
  if(o.hat==="cap"){cx.fillStyle=o.hatc||"#d9534f";cx.beginPath();cx.arc(0,hy-1.5,8.7,Math.PI,0);cx.fill();rr(-1,hy-4.5,12.5,3,1.5);cx.fill();return}
  cx.fillStyle=o.hair;
  if(o.hs===0){cx.beginPath();cx.arc(0,hy-1.5,8.6,Math.PI*1.02,Math.PI*1.98);cx.fill();cx.fillRect(-8.6,hy-2.5,3,4)}
  else if(o.hs===1){cx.beginPath();cx.arc(0,hy-1.5,8.9,Math.PI,0);cx.fill();cx.fillRect(-8.9,hy-2,4,12);cx.fillRect(4.9,hy-2,4,12)}
  else if(o.hs===2){cx.beginPath();cx.arc(0,hy-1.5,8.6,Math.PI,0);cx.fill();cx.beginPath();cx.arc(9,hy-3,3.6,0,7);cx.fill()}
  else if(o.hs===3){cx.fillRect(-8.6,hy-3,3,5);cx.fillRect(5.6,hy-3,3,5)}
  else{cx.beginPath();cx.arc(0,hy-2,9,Math.PI,0);cx.fill();for(let i=-7;i<=7;i+=3.5){cx.beginPath();cx.arc(i,hy-8,2.7,0,7);cx.fill()}}
  if(o.hat==="santa"){cx.fillStyle="#d62828";cx.beginPath();cx.moveTo(-9,hy-3);cx.quadraticCurveTo(0,hy-19,13,hy-12);cx.lineTo(8,hy-3);cx.fill();cx.fillStyle="#fff";rr(-9.5,hy-5,19,3.6,1.5);cx.fill();cx.beginPath();cx.arc(13,hy-12,2.6,0,7);cx.fill()}
  if(o.hat==="witch"){cx.fillStyle="#3a1f5c";cx.beginPath();cx.ellipse(0,hy-5,13,3,0,0,7);cx.fill();cx.beginPath();cx.moveTo(-7,hy-5);cx.lineTo(3,hy-22);cx.lineTo(7,hy-5);cx.fill();cx.fillStyle="#ff8a1f";cx.fillRect(-6,hy-8,13,2)}
}
function drawPerson(x,y,o){
  const mv=o.mv,ph=o.ph||0,sw=mv?Math.sin(ph):0,bob=mv?-Math.abs(Math.sin(ph))*1.5:0;
  cx.save();cx.translate(x,y);cx.scale(o.sc||1,o.sc||1);
  cx.fillStyle=`rgba(0,0,0,${SUN.a+.06})`;cx.beginPath();cx.ellipse(SUN.dx*.35,1,12+Math.abs(SUN.dx)*.3,4.5,0,0,7);cx.fill();
  if(o.acc==="backpack"){cx.fillStyle=o.bp||"#c0392b";rr(-10,-31+bob,20,17,4);cx.fill()}
  cx.fillStyle=o.pants;rr(-6,-15,5,15-sw*2.2,2);cx.fill();rr(1,-15,5,15+sw*2.2,2);cx.fill();
  cx.fillStyle=o.shoes;rr(-7.5,-3-sw*2.2,7,3.5,1.5);cx.fill();rr(.5,-3+sw*2.2,7,3.5,1.5);cx.fill();
  const aL=sw*2.4,aR=-sw*2.4;
  cx.fillStyle=o.shirt;rr(-13,-30+bob+aL,4.5,13,2);cx.fill();
  if(o.arm==="up"||o.arm==="wave"){cx.save();cx.translate(10.5,-29+bob);cx.rotate(o.arm==="wave"?-2.75+Math.sin(performance.now()/90)*.45:-2.5+Math.sin(performance.now()/250)*.15);cx.fillStyle=o.shirt;rr(-2.2,0,4.5,13,2);cx.fill();cx.fillStyle=o.skin;cx.beginPath();cx.arc(0,14,2.6,0,7);cx.fill();cx.restore()}
  else if(o.phone){rr(8.5,-30+bob,4.5,8,2);cx.fill()}
  else{rr(8.5,-30+bob+aR,4.5,13,2);cx.fill();cx.fillStyle=o.skin;cx.beginPath();cx.arc(10.8,-16+bob+aR,2.5,0,7);cx.fill()}
  cx.fillStyle=o.skin;cx.beginPath();cx.arc(-10.8,-16+bob+aL,2.5,0,7);cx.fill();
  cx.fillStyle=o.shirt;rr(-9,-32+bob,18,21,5);cx.fill();
  cx.fillStyle="rgba(0,0,0,.16)";cx.fillRect(-9,-17+bob,18,6);cx.fillStyle="rgba(255,255,255,.12)";cx.fillRect(-9,-30+bob,4,13);
  if(o.suit){cx.fillStyle="#fff";cx.beginPath();cx.moveTo(-4,-32+bob);cx.lineTo(4,-32+bob);cx.lineTo(0,-23+bob);cx.fill();cx.fillStyle="#c0392b";cx.fillRect(-1.3,-30+bob,2.6,9)}
  if(o.phone){cx.fillStyle=o.shirt;rr(2,-24+bob,10,4,2);cx.fill();cx.fillStyle=o.skin;cx.beginPath();cx.arc(2.5,-22+bob,2.4,0,7);cx.fill();cx.fillStyle="#222";rr(-1,-29+bob,6,9,1.5);cx.fill();cx.fillStyle="#9fe3ff";cx.fillRect(0,-28+bob,4,6)}
  if(o.chain){cx.strokeStyle="#ffd54a";cx.lineWidth=1.4;cx.beginPath();cx.arc(0,-31+bob,5,.25,Math.PI-.25);cx.stroke()}
  if(o.logo)pokeball(0,-23+bob,3.2);
  if(o.acc==="backpack"){cx.fillStyle=o.bp||"#c0392b";cx.fillRect(-9,-31+bob,2,13);cx.fillRect(7,-31+bob,2,13)}
  if(o.bag){const by=-19+bob+aR;cx.fillStyle="#fff";rr(8,by,11,12,1.5);cx.fill();cx.strokeStyle="#9aa";cx.lineWidth=1;cx.beginPath();cx.arc(13.5,by,3,Math.PI,0);cx.stroke();pokeball(13.5,by+6.5,2.6)}
  const hy=-40+bob;
  cx.fillStyle=o.skin;cx.beginPath();cx.arc(0,hy,8.2,0,7);cx.fill();
  if(o.mood==="angry"){cx.fillStyle="rgba(220,40,40,.3)";cx.beginPath();cx.arc(0,hy,8.2,0,7);cx.fill()}
  drawHair(o,hy);
  const blink=((performance.now()/1000+(o.seed||0))%4)<.12;
  cx.fillStyle="#1a1a1a";
  const ex=(o.face||0)*1.4,ey=o.phone?1.3:0;
  if(o.shades){rr(-7+ex,hy-2.8,14,4.2,1.5);cx.fill()}
  else if(blink){cx.fillRect(-4.5+ex,hy-.5,3,1);cx.fillRect(1.5+ex,hy-.5,3,1)}
  else{cx.beginPath();cx.arc(-3+ex,hy+ey,1.3,0,7);cx.arc(3+ex,hy+ey,1.3,0,7);cx.fill()}
  if(o.glasses&&!o.shades){cx.strokeStyle="#222";cx.lineWidth=1;cx.strokeRect(-6,hy-2.5,5,5);cx.strokeRect(1,hy-2.5,5,5)}
  if(o.mood==="angry"){cx.strokeStyle="#1a1a1a";cx.lineWidth=1.2;cx.beginPath();cx.moveTo(-5.5,hy-5);cx.lineTo(-1.5,hy-3);cx.moveTo(5.5,hy-5);cx.lineTo(1.5,hy-3);cx.stroke()}
  cx.strokeStyle="#5a2a1a";cx.lineWidth=1.2;cx.beginPath();
  if(o.mood==="happy")cx.arc(0,hy+2.4,2.8,.15*Math.PI,.85*Math.PI);
  else if(o.mood==="sad"||o.mood==="angry")cx.arc(0,hy+6.2,2.6,1.2*Math.PI,1.8*Math.PI);
  else{cx.moveTo(-2,hy+4);cx.lineTo(2,hy+4)}
  cx.stroke();
  if(o.mood==="impatient"){cx.fillStyle="#7fd3ff";cx.beginPath();cx.moveTo(9,hy-7);cx.quadraticCurveTo(12,hy-1,9,hy);cx.quadraticCurveTo(6,hy-1,9,hy-7);cx.fill()}
  cx.restore();
}
function drawPersonAt(x,y,ct,skin,ph,mv,type){drawPerson(x,y,{shirt:ct.col,pants:"#2c3350",shoes:"#141414",hair:ct.hair,hs:type==="cashier"?0:1,sc:ct.sc||1,skin,ph,mv,mood:"happy",hat:type==="cashier"?"cap":null,hatc:ct.cap||"#e3350d",glasses:type==="collector",seed:x%4})}
function moodOf(c){
  if(c.bub&&/😠|😤|💸|😕|😢/.test(c.bub))return /😠|😤/.test(c.bub)?"angry":"sad";
  if(c.st==="leave")return c.bought?"happy":"neutral";
  if(c.st==="wait"){const f=1-c.wt/c.pat;return f<.35?"impatient":f>.75?"happy":"neutral"}
  return c.st==="browse"?"happy":"neutral";
}
function drawCust(c){
  const o=c.out||(c.out=mkOutfit(c.type,c.reg?RG(c.reg):null));
  o.skin=c.skin;o.mv=c.mv;o.ph=c.ph;o.mood=moodOf(c);o.face=c.face||0;o.phone=!!(c.phoneP&&c.st==="wait"&&c.wt>2&&front()!==c);o.arm=c.st==="browse"?"up":c.wave>0?"wave":null;o.bag=!!c.bought&&c.st==="leave";
  drawPerson(c.x,c.y,o);
  if(c.hold&&c.st!=="leave"){
    if(c.hold.k==="pack"){const sd=SETS.find(z=>z.id===c.hold.s);if(sd)packIcon(c.x+8,c.y-33,sd,12,17)}
    else if(c.hold.k==="prod"){const i=pInfo(c.hold.pid);cx.fillStyle=i?i.col:"#888";rr(c.x+6,c.y-34,17,16,2);cx.fill();cx.fillStyle="#fff8";cx.fillRect(c.x+8,c.y-32,13,3)}
    else{const cd=BYID[c.hold.it.c],im=cd&&timg(cd.img);if(im)cx.drawImage(im,c.x+8,c.y-34,13,18);else{cx.fillStyle="#fff";rr(c.x+8,c.y-34,13,18,2);cx.fill()}}
  }
  if(c.want&&c.want.k==="lot"&&c.st!=="leave"){cx.fillStyle="#a8763f";rr(c.x+4,c.y-35,23,18,2);cx.fill();cx.fillStyle="#6b4527";cx.fillRect(c.x+4,c.y-29,23,2)}
  if(c.want&&c.want.k==="sell"&&c.st==="wait"){cx.fillStyle="#fff";rr(c.x+8,c.y-33,13,18,2);cx.fill();cx.fillStyle=c.deal?RAR[c.deal.c.r].c:"#888";cx.fillRect(c.x+10,c.y-31,9,8)}
  if(c.st==="wait"){const f=1-c.wt/c.pat;cx.fillStyle="#0007";cx.fillRect(c.x-12,c.y-62,24,4);cx.fillStyle=f>.5?"#4cc98a":f>.25?"#f2b705":"#ff7a6b";cx.fillRect(c.x-12,c.y-62,24*Math.max(0,f),4)}
  if(c.reg){const n=RG(c.reg).n;cx.font="700 10px system-ui,sans-serif";const w=cx.measureText(n).width+10;cx.fillStyle="rgba(0,0,0,.62)";rr(c.x-w/2,c.y-77,w,13,6);cx.fill();txt(n,c.x,c.y-67,10,"#fff","center")}
  let b=c.bub;if(!b&&front()===c)b=c.want.k==="sell"?"🃏 ¿Compras?":c.want.k==="lot"?"📦 ¿Un lote?":c.want.k==="trade"?"🔄 ¿Cambiamos?":"💶";
  if(b){cx.font="700 13px system-ui,sans-serif";const w=cx.measureText(b).width+14;cx.fillStyle="#fff";rr(c.x-w/2,c.y-100,w,22,8);cx.fill();cx.beginPath();cx.moveTo(c.x-4,c.y-78);cx.lineTo(c.x+4,c.y-78);cx.lineTo(c.x,c.y-73);cx.fill();txt(b,c.x,c.y-84,13,"#111","center")}
}
/* ----- partículas ----- */
let PFX=[];
function coinBurst(x,y,v){const n=clamp(Math.round(Math.log2(v+1)*2),3,12),tx=LAY.counter.x+28,ty=LAY.counter.y+66;for(let i=0;i<n;i++)PFX.push({k:"coin",x0:x+rnd(10)-5,y0:y,x1:tx+rnd(10)-5,y1:ty,t:-i*.05,d:.55+Math.random()*.15})}
function heartsAt(x,y,n){for(let i=0;i<n;i++)PFX.push({k:"heart",x:x+rnd(16)-8,y,vx:(Math.random()-.5)*14,vy:-26-rnd(14),t:-i*.14,d:1.3})}
function starsAt(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=40+rnd(50);PFX.push({k:"star",x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,t:-i*.02,d:1.1})}}
function updPfx(dt){PFX.forEach(p=>{p.t+=dt;if(p.t<0||p.vx==null)return;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==="star")p.vy+=70*dt});PFX=PFX.filter(p=>p.t<p.d)}
function heart(x,y,s,c){cx.fillStyle=c;cx.beginPath();cx.moveTo(x,y+s*.9);cx.bezierCurveTo(x-s*1.6,y-s*.2,x-s*.6,y-s*1.4,x,y-s*.5);cx.bezierCurveTo(x+s*.6,y-s*1.4,x+s*1.6,y-s*.2,x,y+s*.9);cx.fill()}
function star(x,y,r,c){cx.fillStyle=c;cx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}cx.closePath();cx.fill()}
function drawPfx(){PFX.forEach(p=>{if(p.t<0)return;const k=p.t/p.d;
  if(p.k==="coin"){const x=p.x0+(p.x1-p.x0)*k,y=p.y0+(p.y1-p.y0)*k-Math.sin(k*Math.PI)*55;cx.fillStyle="#f2c14e";cx.beginPath();cx.ellipse(x,y,4.5,Math.max(.8,4.5*Math.abs(Math.cos(p.t*14))),0,0,7);cx.fill();cx.strokeStyle="#b8860b";cx.lineWidth=1;cx.stroke()}
  else if(p.k==="heart"){cx.globalAlpha=1-k;heart(p.x,p.y,5,"#ff4f7b");cx.globalAlpha=1}
  else{cx.globalAlpha=1-k;star(p.x,p.y,4.5,"#ffd54a");cx.globalAlpha=1}})}
let VIG=null;
function draw(){
  sunUpd();emitStatic();
  const V=VIEW,t=tierOf(level()),se=season();cx.setTransform(1,0,0,1,0,0);cx.fillStyle="#0b0e14";cx.fillRect(0,0,CV.width,CV.height);
  const sk=VIS.shake||0,sx=(Math.random()-.5)*sk,sy=(Math.random()-.5)*sk;VIS.shake=sk>.2?sk*.88:0;
  cx.setTransform(V.dpr*V.s,0,0,V.dpr*V.s,V.dpr*(V.ox+sx),V.dpr*(V.oy+sy));
  cx.save();cx.beginPath();cx.rect(CX0,CY0,CX1-CX0,CY1-CY0);cx.clip();
  {const ck=se+(S.annex?"A":"");if(CITYk!==ck){CITY=buildCity(se);CITYk=ck}}
  {const bk=t+"|"+(S.style||"clasico")+"|"+(S.annex?1:0);if(BGk!==bk){BG=buildBG(t);BGk=bk}}
  cx.drawImage(CITY,CX0,CY0);drawStreet();drawCross();
  cx.drawImage(BG,0,0,W,FRONT_Y);if(S.annex){cx.drawImage(BG,40,0,552,FRONT_Y*2,-276,0,276,FRONT_Y);drawAnnex()}drawWall();drawCams();drawDecorFloor();drawHunt();
  custs.forEach(reflect);
  const f=front();if(f){cx.strokeStyle="#f2b705";cx.lineWidth=3;cx.beginPath();cx.ellipse(f.x,f.y,18,8,0,0,7);cx.stroke()}
  const L=[];
  if((S.pet||"cat")!=="none")L.push({y:CAT.y,f:drawPet});if(S.decor.lux)for(let i=0;i<3;i++)L.push({y:LUX[i][1],f:()=>drawLux(i)});
  {const lq=launchQ();if(lq)lq.forEach(p=>L.push({y:p.y,f:()=>drawLQ(p)}))}
  for(let i=0;i<slotCount();i++){const s=LAY.shelf(i);L.push({y:s.y+s.h,f:()=>drawShelf(i)})}
  L.push({y:128,f:drawDesk});L.push({y:LAY.prod.y+LAY.prod.h,f:drawProd});
  {const c=LAY.cs();L.push({y:c.y+c.h,f:drawCase})}
  L.push({y:LAY.counter.y+LAY.counter.h,f:drawCounter});
  L.push({y:LAY.cashier.y,f:()=>drawPersonAt(LAY.cashier.x,LAY.cashier.y,{col:meCfg().shirt,hair:meCfg().hair,cap:meCfg().cap,sc:1},"#f2c9a0",0,false,"cashier")});
  if(S.staff.cashier)L.push({y:250,f:()=>drawPersonAt(748,250,{col:"#2fa557",hair:"#5a3a2a",sc:1,cap:"#2fa557"},"#e0a878",0,false,"cashier")});
  if(S.staff.appraiser)L.push({y:150,f:()=>drawPersonAt(706,150,{col:"#6b4ea8",hair:"#ddd",sc:1},"#f2c9a0",0,false,"collector")});
  if(S.tour&&S.decor.table&&S.phase!=="closed")[[175,262],[300,262],[175,356],[300,356]].forEach(([x,y],i)=>L.push({y,f:()=>drawPersonAt(x,y,{col:["#3d7bd9","#d9402a","#2fa557","#8e4cb5"][i],hair:"#222",sc:.9},["#f2c9a0","#e0a878","#a9714b","#f2c9a0"][i],0,false,i%2?"collector":"kid")}));
  decorObjs(L);if(trophyOn())L.push({y:TROPHY.y+TROPHY.d,f:drawTrophy});
  custs.forEach(c=>L.push({y:c.y,f:()=>drawCust(c)}));custs.forEach(c=>{if(c.run&&!c.caught)L.push({y:c.y+.5,f:()=>drawThiefFx(c)})});
  L.push({y:FRONT_Y+1,f:drawFrontWall});L.push({y:FRONT_Y+2,f:drawShutter});
  VIS.ped.forEach(p=>L.push({y:p.y,f:()=>drawPed(p)}));
  (VIS.cars||[]).forEach(c=>L.push({y:c.y,f:()=>drawCar(c)}));
  cityTrees().forEach(([x,y])=>L.push({y,f:()=>drawTree(x,y)}));
  LAMPS.forEach(([x,y,s])=>L.push({y,f:()=>streetLamp(x,y,s)}));
  L.push({y:606,f:drawBusStop});L.push({y:600,f:drawTerrace});L.push({y:598,f:drawSweeper});L.push({y:871,f:drawFountain});L.push({y:800,f:drawSwings});L.push({y:860,f:drawColeKids});L.push({y:781,f:drawMarket});L.push({y:740,f:drawRival});if(VIS.van)L.push({y:612,f:()=>drawVanExtras(VIS.van)});(VIS.vcars||[]).forEach(c=>L.push({y:c.y,f:()=>drawVCar(c)}));
  L.push({y:612,f:()=>drawTL(546,612)});L.push({y:694,f:()=>drawTL(642,694)});
  if(!LITE())(VIS.birds||[]).forEach(b=>L.push({y:b.y+(b.st==="fly"?400:0),f:()=>drawBird(b)}));
  L.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  streetFx();ambient();lighting();drawPfx();
  FX.forEach(f=>{cx.globalAlpha=Math.min(1,f.a);txt(f.t,f.x,f.y,18,f.col,"center");cx.globalAlpha=1});
  cx.restore();
  bloom();
  cx.save();cx.setTransform(V.dpr,0,0,V.dpr,0,0);drawAlarm();if(S.ui&&S.ui.fps){cx.fillStyle="#000a";cx.fillRect(6,6,104,20);txt(`${Math.round(VIS.fpsE||0)} FPS${LITE()?" · ahorro":""}`,12,21,12,"#7fe3a0")}cx.restore();
  cx.setTransform(V.dpr,0,0,V.dpr,0,0);
  const vg=cx.createRadialGradient(V.cw/2,V.ch/2,Math.min(V.cw,V.ch)*.35,V.cw/2,V.ch/2,Math.max(V.cw,V.ch)*.75);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.25)");cx.fillStyle=vg;cx.fillRect(0,0,V.cw,V.ch);
  drawEvBanner();
  if(paused){cx.fillStyle="rgba(10,14,22,.6)";cx.fillRect(0,0,V.cw,V.ch);txt("PAUSA",V.cw/2,V.ch/2,46,"#fff","center");txt("Pulsa ⏸ o el botón de abajo para seguir",V.cw/2,V.ch/2+30,14,"#cbd5e1","center")}
}

/* ===================== HUD ===================== */
/* ----- avisos de core por el bus ----- */
on("toast",(t,o)=>toast(t,o));on("sets",()=>{if(G.M==="sets")renderM()});
on("hud",()=>hud());on("renderM",()=>renderM());on("openM",t=>openM(t));on("closeM",()=>closeM());
on("sfx",(k,...a)=>sfx[k](...a));on("confetti",(...a)=>confetti(...a));
on("medal",id=>(VIS.medQ=VIS.medQ||[]).push(id));
function toast(t,o){o=o||{};if(!o.nolog){VIS.notes=VIS.notes||[];VIS.notes.unshift({t,at:Date.now()});if(VIS.notes.length>40)VIS.notes.length=40;VIS.unread=(VIS.unread||0)+1;if(typeof updBadges==="function")updBadges()}
  const e=$("#toast");if(!e)return;const d=document.createElement("div");d.className="toast";d.innerHTML=t+(o.undo?' <button class="undo" data-a="undo">Deshacer</button>':"");if(o.undo)d.style.pointerEvents="auto";e.appendChild(d);while(e.children.length>2)e.firstChild.remove();setTimeout(()=>d.remove(),o.undo?7000:2600)}
let paused=false;
function setPause(v){paused=v;paintNav();hud()}
function hud(){
  if(VIS.mShown==null)VIS.mShown=S.money;$("#money").innerHTML=fmt(VIS.mShown)+`<small>empresa ${Math.round(netWorth()).toLocaleString("es-ES")} €</small>`;
  {const rv=repv();if(VIS.lastRep!=null&&rv>VIS.lastRep)starsAt(LAY.counter.x+28,LAY.counter.y-30,8+Math.min(12,(rv-VIS.lastRep)*4));VIS.lastRep=rv;
   const tr=tierOf(level());if(S.tierSeen==null)S.tierSeen=tr;if(tr>S.tierSeen){S.tierSeen=tr;VIS.pendTier=tr;starsAt(W/2,30,24)}if(VIS.pendTier!=null&&!G.M){VIS.showTier=VIS.pendTier;VIS.pendTier=null;openM("tierup")}
   document.documentElement.dataset.tier=tr;}
  {const hb=$("#hud b");if(hb)hb.textContent=(S.shopName||"").trim()||"Pokémon Card Shop"}storyBadge();storyTick();
  if(!G.M&&!front()&&VIS.medQ&&VIS.medQ.length){VIS.showMed=VIS.medQ.shift();openM("medal")}
  $("#lv").textContent=`Nivel ${level()} · Día ${S.day} · ⭐ ${repv()}`;
  updBadges();checklist();applyUI();
  $("#clk").style.width=(S.phase==="closed"?0:Math.min(100,S.clock/DAYLEN*100))+"%";
  const a=$("#act"),f=front();a.classList.remove("pulse");
  if(paused){a.disabled=false;a.textContent="⏸ En pausa · pulsa para continuar"}
  else if(f){a.disabled=false;a.classList.add("pulse");a.textContent=f.want.k==="sell"?"🃏 Atender: quiere vender una carta":f.want.k==="lot"?"📦 Atender: vende un lote":f.want.k==="trade"?"🔄 Atender: quiere cambiar una carta":(S.staff.cashier?"Cobrando… ":"💶 Cobrar ")+fmt(f.hold.total)}
  else if(S.phase==="closed"){a.disabled=false;a.textContent=`Abrir la tienda (día ${S.day})`}
  else{a.disabled=true;a.textContent=S.phase==="open"?"Tienda abierta · esperando clientes…":"Cerrando…"}
  let h="";
  if(S.phase==="closed"){
    if(sealedCount()===0&&caseItems().length===0)h="📦 Compra sobres en «Sobres» y ponles precio. Puedes abrirlos para sacar cartas y ponerlas en la vitrina.";
    else{const tp=tipsList(null)[0];h=tp?"💡 "+tp:"Todo listo. Ajusta precios, coloca cartas en la vitrina y abre la tienda."}
  }else if(S.phase==="open")h="Los clientes hacen cola en la caja: toca «Cobrar» o pulsa sobre el cliente. Cuidado con el aburrimiento de la cola.";
  else h="No entran más clientes. Atiende a los que quedan.";
  const ev=evLabel();$("#hint").textContent=(ev?ev+" ":"")+h+(S.phase==="closed"?" Pellizca la tienda para hacer zoom.":"")+(G.NOTE?"  ·  "+G.NOTE:"");
}
$("#act").addEventListener("click",()=>{
  if(G.M)return;if(paused){setPause(false);return}const f=front();
  if(f)return serveFront();
  if(S.phase==="closed"){sfx.shutter();S.phase="open";S.clock=0;spawnT=1;S.burst=S.ev&&S.ev.t==="launch"?6:0;S.vipDone=false;
    {const lq=VIS.lq&&VIS.lq.day===S.day&&S.ev&&S.ev.t==="launch"?VIS.lq.p:null;if(lq){S.burst=0;VIS.lq=null;shake(5);tone(880,0,.25,"triangle",.05);tone(1175,.12,.3,"triangle",.05);lq.forEach((p,i)=>setTimeout(()=>{if(S.phase!=="open")return;spawn();const c=custs[custs.length-1];if(c){c.x=p.x;c.y=p.y;if(!c.reg){c.out=p.out;c.skin=p.skin}routeTo(c,c.st==="toq"?LAY.qx:c.tx,c.st==="toq"?LAY.qy+queue.length*LAY.qs:c.ty)}},250+i*260))}}S.stats={inc:0,cust:0,lost:0,bought:0};hud()}
});


/* ===================== MODALES ===================== */
function face(c,rv){
  return `<div class="cf" style="--rc:${RAR[c.r].c}"><div class="fb"><b>${c.name}</b><i>${RAR[c.r].n}</i><span>${setName(c.s)}${c.num?" · "+c.num:""}</span></div>${c.img?`<img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.remove()">`:""}${rv?'<u class="rvb">Reverse</u>':""}</div>`;
}
function spark(id){
  const h=S.prices[id].h.slice(-30),mn=Math.min(...h),mx=Math.max(...h);
  const pts=h.map((v,i)=>(i/(h.length-1)*84).toFixed(1)+","+(24-(mx===mn?.5:(v-mn)/(mx-mn))*22).toFixed(1)).join(" ");
  return `<svg class="spark" viewBox="0 0 84 26"><polyline fill="none" stroke="${h[h.length-1]>=h[0]?"#4cc98a":"#ff7a6b"}" stroke-width="2" points="${pts}"/></svg>`;
}
const chg=(id,d)=>{const h=S.prices[id].h;return h[h.length-1]/h[Math.max(0,h.length-1-d)]-1};
const cls=x=>x>=0?"up":"down";
let prevM=null;
function openM(t){G.M=t;renderM();navAct()}
function closeM(){G.M=null;prevM=null;setTimeout(navAct);$("#ovh").innerHTML="";TILT.el=null;saveNow();hud()}
function renderM(){
  if(!G.M){$("#ovh").innerHTML="";TILT.el=null;return}
  if(G.M==="open"&&openState&&openState.mode==="seq"){prevM=G.M;mountPX();return}
  if(G.M==="grev"){prevM=G.M;mountGR();return}
  if(G.M==="boxo"){prevM=G.M;mountBox();return}
  if(G.M==="tierup"){prevM=G.M;mountTier();return}
  if(G.M==="medal"){prevM=G.M;mountMedal();return}
  TILT.el=null;
  const old=$("#ovh .sheet"),sc=old&&prevM===G.M?old.scrollTop:0;
  let body={card:mCard,notes:mNotes,packs:mPacks,coll:mColl,mkt:mMkt,up:mUp,open:mOpen,sell:mSell,sum:mSum,sets:mSets,album:mAlbum,tasks:mTasks,more:mMore,grading:mGrading,backup:mBackup,lot:mLot,hag:mHag,ck:mCk,insp:mInsp,custc:mCust,tips:mTips,diff:mDiff,trophy:mTrophy,toffer:mTOffer,stats:mStats,bank:mBank,cafe:mCafe,cole:mCole,rival:mRival,market:mMarket,annex:mAnnex,medals:mMedals,gift:mGift,custom:mCustom,trade:mTrade,games:mGames,hunt:mHunt,mg:mMG,story:mStory}[G.M]();
  const isNew=prevM!==G.M;
  {const hk=HINT1[G.M];if(hk&&!(S.seen&&(S.seen[G.M]||S.seen.all))&&!(S.tut&&S.tut.on))body=`<div class="hint1"><img src="${guideImg()}" alt=""><div><b>Carla</b><p>${hk}</p></div><div style="display:flex;flex-direction:column;gap:4px"><button class="b pri" data-a="seen" data-k="${G.M}">¡Vale!</button><button class="b mini" data-a="seen" data-k="all">No más</button></div></div>`+body}
  const lock=G.M==="ck"||G.M==="hag"||G.M==="lot"||G.M==="sell"||G.M==="insp"||G.M==="trade"||G.M==="toffer";
  $("#ovh").innerHTML=`<div class="ov${isNew?" in":""}"${lock?"":' data-a="close"'}><div class="sheet${G.M==="open"?" wide":""}${isNew?" in":""}"><div class="grab"></div><button class="xbtn" data-a="close" aria-label="Cerrar">✕</button>${body}<button class="b big" data-a="close">${G.M==="ck"?"Atender luego":G.M==="insp"?"Volver":G.M==="lot"&&!(LOT&&LOT.done)?"Rechazar y cerrar":"Cerrar"}</button></div></div>`;
  const nw=$("#ovh .sheet");if(nw&&sc)nw.scrollTop=sc;prevM=G.M;if(G.M==="insp")bindInsp();if(G.M==="album")bindAlbum();if(G.M==="card")bindCard();
}
function mPacks(){
  if(pTab==="sealed")return `<h2>📦 Stock</h2>${packTabs()}<p class="mu">Se venden en el mueble central. Si abres uno, sus sobres pasan a tu stock de sobres.</p>`+(SETS.map(sd=>{const ids=Object.keys(PTYPES).map(t=>t+":"+sd.id).filter(pid=>pF==="all"||pStock(pid)>0);return ids.length?`<h3>${sd.n}</h3>`+ids.map(prodRow).join(""):""}).join("")||'<p class="mu">No tienes producto sellado en stock.</p>');
  if(pTab==="acc")return `<h2>📦 Stock</h2>${packTabs()}<p class="mu">Poco dinero por unidad pero mucho margen. Los compran sobre todo niños y jugadores.</p>`+(ACC.filter(a=>pF==="all"||pStock("acc:"+a.id)>0).map(a=>prodRow("acc:"+a.id)).join("")||'<p class="mu">No tienes accesorios en stock.</p>');
  const SL=SETS.filter(sd=>pF==="all"||(pF==="stock"?S.sealed[sd.id]>0:S.slots.includes(sd.id)));
  return `<h2>📦 Stock</h2>${packTabs()}`+(SL.length?"":'<p class="mu">Nada con este filtro.</p>')+SL.map(sd=>{const s=sd.id,p=S.pack[s],q=S.sealed[s],on=S.slots.includes(s);
    return `<div class="pn stk"><div class="stkh"><div class="mpack" style="--sc:${sd.col}">${sd.sym?`<img src="${sd.sym}" alt="" onerror="this.remove()">`:""}</div><div style="flex:1;min-width:0"><b>${sd.n}</b><div class="mu">${q} en stock${on?" · en estantería":q>0?" · ⚠️ sin hueco":""}</div></div><div class="step"><button class="b" data-a="shelf" data-k="${s}" data-n="-.25">−</button><b>${fmt(S.shelf[s])}</b><button class="b" data-a="shelf" data-k="${s}" data-n=".25">+</button></div></div>
    <div>${accTag(packAcc(s))}${Math.abs(S.shelf[s]-recPack(s))>.04?` <button class="b mini" data-a="recp" data-k="${s}">🎯 ${fmt(recPack(s))}</button>`:""}</div>
    <div class="btns"><button class="b pri" data-a="buyp" data-k="${s}" data-n="6"${S.money<p.w*6?" disabled":""}>🛒 Comprar 6 · ${fmt(p.w*6)}</button><button class="b" data-a="open" data-k="${s}" data-n="1"${q<1?" disabled":""}>✨ Abrir 1</button></div>
    <details><summary class="mu">Detalles y más opciones</summary><div class="mu">Mayorista ${fmt(p.w)} por sobre · los clientes pagan ~${fmt(p.ref)} · valor esperado ${fmt(EVC[s]||0)}</div><div class="btns">${[1,36].map(n=>{const c=p.w*n*(n>=36?.93:1);return `<button class="b" data-a="buyp" data-k="${s}" data-n="${n}"${S.money<c?" disabled":""}>${n===36?"Caja 36":"×1"} · ${fmt(c)}</button>`}).join("")}<button class="b" data-a="open" data-k="${s}" data-n="10"${q<1?" disabled":""}>Abrir 10 (rápido)</button></div>${evBreak(s)}</details></div>`}).join("")+`<p class="mu">Abrir sobres tiene azar: de media sale algo menos de lo que cuestan. Se gana más vendiéndolos cerrados o comprando cartas a buen precio.</p>`;
}
let openState=null,collSel=null,collF="all";
const big=u=>u.replace(/\.png$/,"_hires.png");
function faceBig(c,rv){
  return `<div class="cf" style="--rc:${RAR[c.r].c}"><div class="fb"><b>${c.name}</b><i>${RAR[c.r].n}</i><span>${setName(c.s)}${c.num?" · "+c.num:""}</span></div>${c.img?`<img src="${big(c.img)}" alt="${c.name}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${c.img}'}else this.remove()">`:""}${rv?'<u class="rvb">Reverse</u>':""}</div>`;
}
function mOpen(){
  const o=openState;
  if(o.mode==="seq"){
    const x=o.cards[o.idx],c=x.c,hit=["DR","IR","UR","SIR","HR"].includes(c.r),v=price(c.id)*(x.rv?rvr(c):1);
    [o.cards[o.idx+1],o.cards[o.idx+2]].forEach(y=>{if(y&&y.c.img)new Image().src=big(y.c.img)});
    const last=o.idx>=o.cards.length-1;
    return `<div class="seqhead"><h2 style="margin:0">${setName(o.s)}</h2><span class="mu">Carta ${o.idx+1} de ${o.cards.length}</span></div>
    <div class="stage" data-a="nextc"><div class="bigcard ${o.fl?(hit?"hit":""):"bk"}" style="--rc:${RAR[c.r].c}">${o.fl?faceBig(c,x.rv):""}</div></div>
    <div class="seqinfo">${o.fl?`<b>${c.name}</b> · ${RAR[c.r].n} · <b>${fmt(v)}</b>${hit?" ✨":""}`:'<span class="mu">Toca la carta para girarla</span>'}</div>
    <div class="btns"><button class="b pri" data-a="nextc">${o.fl?(last?"Ver resumen":"Siguiente carta"):"Girar"}</button><button class="b" data-a="skip">Saltar al resumen</button></div>`;
  }
  const vv=x=>price(x.c.id)*(x.rv?rvr(x.c):1),best=0,sorted=o.cards.slice().sort((a,b)=>vv(b)-vv(a));
  const tiles=sorted.map((x,i)=>`<div class="tile zoomable${i===best?" best":""}" data-a="zoom" data-k="${x.c.id}" data-n="${x.rv?1:0}">${face(x.c,x.rv)}<div class="pt">${fmt(vv(x))}</div>${x.nw?'<div class="nw">NUEVA</div>':""}</div>`).join("");
  const more=o.total>o.cards.length?`<p class="mu">+${o.total-o.cards.length} cartas más, ya en tu inventario.</p>`:"";
  return `<h2>${o.n} sobre${o.n>1?"s":""} de ${setName(o.s)}</h2><div class="tiles lg">${tiles}</div>${more}<p id="osum">${osum()}</p><p class="mu">Toca una carta para verla en grande.</p><div class="btns">${S.sealed[o.s]>0?`<button class="b pri" data-a="open" data-k="${o.s}" data-n="1">Abrir otro</button>`:""}</div>`;
}
function osum(){const o=openState,cost=o.n*S.pack[o.s].w,d=o.val-cost;return `<b>Valor: ${fmt(o.val)}</b> · Coste: ${fmt(cost)} · <span class="${cls(d)}">${d>=0?"+":""}${fmt(d)}</span>`}
function groups(){
  const g={};S.items.forEach(it=>{const k=gk(it);(g[k]=g[k]||{key:k,c:BYID[it.c],k:it.k,rv:it.rv,its:[]}).its.push(it)});
  return Object.values(g).sort((a,b)=>itemVal(b.its[0])*b.its.length-itemVal(a.its[0])*a.its.length);
}
function mMkt(){
  const pool=CARDS.filter(c=>c.b>=1),arr=pool.map(c=>({c,d:chg(c.id,7)})).sort((a,b)=>b.d-a.d);
  const row=x=>`<div class="pn row"><div style="min-width:0"><b>${x.c.name}</b> <span class="mu">${setName(x.c.s)} · ${RAR[x.c.r].n}</span><div>${fmt(price(x.c.id))} · 7 d <span class="${cls(x.d)}">${pct(x.d)}</span> · 30 d <span class="${cls(chg(x.c.id,30))}">${pct(chg(x.c.id,30))}</span></div></div>${spark(x.c.id)}</div>`;
  return `<h2>Mercado</h2><p class="mu">${G.MODE==="real"?"Precios de Cardmarket (tendencia, €) vía pokemontcg.io, con movimientos diarios del juego encima.":"Modo sin conexión: precios simulados."}</p><h3>Top subidas (7 días)</h3>${arr.slice(0,6).map(row).join("")}<h3>Top bajadas (7 días)</h3>${arr.slice(-6).reverse().map(row).join("")}`;
}
let setQ="";
function setRows(){
  const q=setQ.trim().toLowerCase();
  let l=SETDEF.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  if(q)l=l.filter(d=>(d.n+" "+(d.series||"")+" "+d.year).toLowerCase().includes(q));
  const tot=l.length;l=l.slice(0,60);
  return l.map(d=>{
    const inn=S.sets.includes(d.id),used=S.sealed[d.id]>0||S.items.some(i=>BYID[i.c]&&BYID[i.c].s===d.id);
    return `<div class="srow">${d.sym?`<img src="${d.sym}" alt="" onerror="this.remove()">`:'<span style="width:30px"></span>'}<div style="flex:1;min-width:0"><b>${d.n}</b><div class="mu">${d.series||""} · ${d.year}${d.total?" · "+d.total+" cartas":""}</div></div>${inn&&!BYS[d.id]?`<button class="b pri" data-a="retrysets">⚠️ Reintentar</button>`:inn?`<button class="b"${used?" disabled":""} data-a="delset" data-k="${d.id}">${used?"En uso":"Quitar"}</button>`:`<button class="b pri" data-a="addset" data-k="${d.id}">Añadir</button>`}</div>`;
  }).join("")+(tot>60?`<p class="mu">Mostrando 60 de ${tot}. Usa el buscador.</p>`:"")||'<p class="mu">Sin resultados.</p>';
}
function mSets(){
  const ser=seriesList(),cur=ser.find(x=>x.n===setQ.trim()),miss=cur?SETDEF.filter(d=>d.series===cur.n&&!S.sets.includes(d.id)).length:0,reco=RECO.filter(id=>SETDEF.some(d=>d.id===id)&&!S.sets.includes(id));
  return `<h2>Colecciones</h2>${SETLIST_ST!=="ok"||SETDEF.length<=3?`<div class="pn">${SETLIST_ST==="loading"?"⏳ Descargando la lista completa de colecciones… La API puede tardar hasta un minuto.":`⚠️ No se ha podido descargar la lista completa de colecciones: la API de pokemontcg.io va lenta o no responde ahora mismo.<div class="btns"><button class="b pri" data-a="setlist">Reintentar</button></div>`}</div>`:""}${FAILED.size?`<div class="pn"><div class="down">⚠️ ${FAILED.size} colección(es) de tu catálogo no han cargado (la API va lenta o limita peticiones).</div><div class="btns"><button class="b pri" data-a="retrysets">Reintentar ahora</button></div></div>`:""}<p class="mu">Añade sets a tu catálogo para comprar sus sobres. En catálogo: <b>${S.sets.length}</b> de ${SETDEF.length}. ${G.MODE==="real"?"":"Sin conexión: solo están los 3 sets básicos."}</p>
  ${G.MODE==="real"&&reco.length?`<button class="b pri big" data-a="addreco" style="margin:0 0 10px">⭐ Añadir ${reco.length} sets populares (Base Set, Evolving Skies…)</button>`:""}
  <div class="serchips"><button class="b ${setQ?"":"on"}" data-a="serf" data-k="">Todas</button>${ser.map(x=>`<button class="b ${cur&&cur.n===x.n?"on":""}" data-a="serf" data-k="${x.n.replace(/"/g,"")}">${x.n} (${x.c})</button>`).join("")}</div>
  ${cur&&miss?`<button class="b pri big" data-a="addseries" style="margin:0 0 10px">➕ Añadir ${miss===1?"el set que falta":"los "+miss+" sets"} de ${cur.n}</button>`:""}<input class="inp" data-i="setq" placeholder="Buscar: Evolving Skies, Base Set, 2019…" value="${setQ.replace(/"/g,"")}"><p class="mu">Cada set trae todas sus cartas con precio de Cardmarket. Muchos sets a la vez pueden tardar en cargar al abrir el juego.</p><div id="setlist">${setRows()}</div>`;
}
function mUp(){
  const dec=DECOR.map(d=>`<div class="pn"><div class="row"><b>${d.ic} ${d.n}</b>${S.decor[d.k]?'<span class="up">Colocado ✔</span>':`<button class="b pri" data-a="decor" data-k="${d.k}"${S.money<d.cost?" disabled":""}>${fmt(d.cost)}</button>`}</div><div class="mu">${d.d}</div></div>`).join("");
  const stf=STAFF.map(x=>`<div class="pn"><div class="row"><b>${x.ic} ${x.n}</b><button class="b ${S.staff[x.k]?"on":"pri"}" data-a="staff" data-k="${x.k}">${S.staff[x.k]?"Contratado · despedir":"Contratar"}</button></div><div class="mu">${x.d} Sueldo: ${fmt(x.sal)}/día.</div></div>`).join("");
  return `<h2>Mejoras</h2>`+UPS.map(u=>{const lv=S.up[u.k],done=lv>=u.max,c=u.cost[lv];return `<div class="pn"><div class="row"><b>${u.n}${u.max>1?` (${lv}/${u.max})`:""}</b>${done?'<span class="up">Comprada</span>':`<button class="b pri" data-a="upg" data-k="${u.k}"${S.money<c?" disabled":""}>${fmt(c)}</button>`}</div><div class="mu">${u.d}</div></div>`}).join("")+`<h3>Decoración</h3>${dec}<h3>Personal</h3>${stf}<h3>Seguridad</h3><div class="pn row"><span>📹 Cámaras de seguridad<br><span class="mu">Menos robos y el ladrón corre más despacio.</span></span><button class="b pri" data-a="buycams"${S.cams||S.money<250?" disabled":""}>${S.cams?"Instaladas ✔":"250 €"}</button></div><h3>Ampliación</h3><div class="pn row"><span>🏗️ Comprar el local de al lado (la panadería)</span><button class="b pri" data-a="m" data-k="annex">${S.annex?"Hecho ✔":"Ver"}</button></div>`;
}
function mSell(){
  const d=deal,mn=r05(d.val*.3),mx=r05(d.val*1.1);
  return `<h2>${d.reg?RG(d.reg).e+" "+RG(d.reg).n+" quiere venderte":"Un cliente quiere vender"}</h2><div class="pn" style="display:flex;gap:12px"><div style="width:120px;flex:none">${face(d.c,d.rv)}</div><div style="flex:1"><b>${d.c.name}</b> <span class="mu">${d.k}${d.rv?" · Reverse":""}</span><div class="mu">${RAR[d.c.r].n} · ${setName(d.c.s)}</div><div>Valor de mercado: <b>${fmt(d.val)}</b></div><div>Pide: <b>${fmt(d.ask)}</b></div>${d.msg?`<div style="margin-top:8px;background:var(--panel2);border-radius:8px;padding:8px">🗣️ ${d.msg}</div>`:""}</div></div>
  ${!d.chk&&d.val>=2?'<div class="pn" style="border-color:#f2b705"><b>🕵️ ¡Ojo!</b> Algunas cartas que te ofrecen son falsas. Pulsa <b>🔍 Examinar</b> antes de pagar.</div>':""}${(()=>{const r=d.ask/d.val,tr=chg(d.c.id,7);return `<div class="pn"><div><b>${r<=.7?"🟢 Chollo":r<=.9?"🟡 Precio razonable":"🔴 Caro para revender"}</b> · pide el ${Math.round(r*100)} % del valor de mercado</div><div class="mu">Tendencia 7 días: <span class="${cls(tr)}">${pct(tr)}</span>. Para ganar revendiendo, ofrece como mucho ${fmt(r05(d.val*.75))} (75 %).${d.val<1?" Es una carta de poco valor: no compensa comprarla.":""}</div></div>`})()}
  <div class="pn"><div class="row"><span>Tu oferta</span><b id="olab">${fmt(d.offer)}</b></div><input type="range" data-i="offer" min="${mn}" max="${mx}" step="0.05" value="${clamp(d.offer,mn,mx)}"><div class="mu">Si compras por debajo de mercado, luego lo vendes con margen.</div>
  <div class="btns"><button class="b pri" data-a="dealoffer">Ofrecer</button><button class="b" data-a="dealask"${S.money<d.ask?" disabled":""}>Pagar lo que pide (${fmt(d.ask)})</button>${d.counter?`<button class="b pri" data-a="dealcounter"${S.money<d.counter?" disabled":""}>Cerrar por ${fmt(d.counter)}</button>`:""}<button class="b" data-a="inspd">🔍 Examinar${d.chk?" ✔":""}</button><button class="b" data-a="dealno">Rechazar</button></div></div>`;
}
/* ===================== APERTURA "WOW" ===================== */
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
let AC=null,SOUND=(()=>{try{return localStorage.getItem("pcs-sound")!=="0"}catch(e){return true}})();
function ac(){if(!SOUND)return null;if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==="suspended")AC.resume();return AC}
function tone(f,d,dur,type,vol){const a=ac();if(!a)return;const t=a.currentTime+d,o=a.createOscillator(),g=a.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.15,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function nz(dur,f0,f1,vol,type,q){const a=ac();if(!a)return;const t=a.currentTime,n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),dd=b.getChannelData(0);for(let i=0;i<n;i++)dd[i]=Math.random()*2-1;const sN=a.createBufferSource();sN.buffer=b;const f=a.createBiquadFilter();f.type=type||"bandpass";f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=a.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);sN.connect(f);f.connect(g);g.connect(a.destination);sN.start(t)}
const sfx={alarm(){for(let i=0;i<3;i++){tone(880,i*.34,.15,"square",.022);tone(660,i*.34+.17,.15,"square",.022)}},
  tick:()=>nz(.05,2600,1800,.22,"bandpass",2),
  rip:()=>{nz(.35,900,4200,.5,"bandpass",.8);nz(.22,3000,6500,.2,"highpass")},
  swish:()=>nz(.22,1800,500,.16,"bandpass",1.2),
  flip:()=>{nz(.04,4000,3000,.14,"highpass");tone(1200,0,.04,"square",.03)},
  charge:lv=>{for(let i=0;i<(lv>=3?5:3);i++)tone(260+i*70,i*.1,.35,"sine",.06)},
  hit:lv=>{const N=[523.25,659.25,783.99,1046.5,1318.51,1567.98,2093];const k=lv>=3?7:lv===2?5:3;
    for(let i=0;i<k;i++){tone(N[i],i*.07,.6,"triangle",.14);if(lv>=2)tone(N[i]*2,i*.07+.02,.4,"sine",.04)}
    if(lv>=3){[523.25,659.25,783.99].forEach(f=>tone(f,.55,1.7,"sine",.08));nz(1.2,6000,9000,.05,"highpass")}}
};
const vibe=pt=>{try{navigator.vibrate&&navigator.vibrate(pt)}catch(e){}};

/* inclinación: dedo, giroscopio o balanceo automático */
const TILT={el:null,cx:.5,cy:.5,tx:.5,ty:.5,pl:0,g:null,b0:null};
window.addEventListener("deviceorientation",e=>{if(e.gamma!=null)TILT.g={g:e.gamma,b:e.beta,t:performance.now()}});
function askGyro(){if(askGyro.d)return;askGyro.d=1;try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==="function")DeviceOrientationEvent.requestPermission().catch(()=>{})}catch(e){}}
function ptTilt(e){if(!TILT.el)return;const r=TILT.el.getBoundingClientRect();TILT.tx=clamp((e.clientX-r.left)/r.width,0,1);TILT.ty=clamp((e.clientY-r.top)/r.height,0,1);TILT.pl=performance.now()}
(function tiltLoop(){
  const el=TILT.el;
  if(el&&el.isConnected){
    const now=performance.now();let tx=.5,ty=.5;
    if(now-TILT.pl<1500){tx=TILT.tx;ty=TILT.ty}
    else if(TILT.g&&now-TILT.g.t<600){if(TILT.b0==null)TILT.b0=TILT.g.b;TILT.b0+=(TILT.g.b-TILT.b0)*.005;tx=clamp(.5+TILT.g.g/32,0,1);ty=clamp(.5+(TILT.g.b-TILT.b0)/32,0,1)}
    else if(!RM){const t=now/1000;tx=.5+.24*Math.sin(t*1.1);ty=.5+.15*Math.cos(t*.9)}
    TILT.cx+=(tx-TILT.cx)*.12;TILT.cy+=(ty-TILT.cy)*.12;
    const sp=el.style;sp.setProperty("--mx",(TILT.cx*100).toFixed(1)+"%");sp.setProperty("--my",(TILT.cy*100).toFixed(1)+"%");
    sp.setProperty("--rx",((.5-TILT.cy)*22).toFixed(2)+"deg");sp.setProperty("--ry",((TILT.cx-.5)*26).toFixed(2)+"deg");
  }
  requestAnimationFrame(tiltLoop);
})();

function holoOf(c,rv){
  const t={R:[.18,""],DR:[.36,""],IR:[.4,""],UR:[.45,"sp"],SIR:[.5,"sp"],HR:[.52,"gold sp"]}[c.r]||[0,""];
  return {ho:Math.max(t[0],rv?.34:0),cl:t[1]};
}
const cardVal=x=>price(x.c.id)*(x.rv?rvr(x.c):1);
function hitLv(x){
  const v=cardVal(x);let lv={DR:1,IR:2,UR:2,SIR:3,HR:3}[x.c.r]||0;
  if(v>=5)lv=Math.max(lv,1);if(v>=25)lv=Math.max(lv,2);if(v>=90)lv=3;return lv;
}
function pcHTML(c,rv,back,lv){
  const h=holoOf(c,rv);
  return `<div class="pc${back?" back charge":""}${back&&lv>=3?" l3":""}" style="--rc:${RAR[c.r].c};--ho:${h.ho}"><div class="ent"><div class="wob"><div class="inner"><div class="fr">${faceBig(c,rv)}<div class="holo ${h.cl}"></div><div class="glare"></div></div><div class="bk"><div class="pball"></div></div></div></div></div></div>`;
}
function confetti(lv,col){
  if(RM||(hasState()&&S.ui&&S.ui.calm))return;const root=$("#px")||$("#zv");if(!root)return;
  const cv=document.createElement("canvas");cv.className="conf";root.appendChild(cv);
  const dpr=Math.min(2,devicePixelRatio||1),W0=innerWidth,H0=innerHeight;cv.width=W0*dpr;cv.height=H0*dpr;const g=cv.getContext("2d");g.scale(dpr,dpr);
  const cols=[col,"#ffd54a","#ffffff","#7fe3ff","#ff7ab8"],n=lv>=3?190:lv===2?90:40,P=[];
  for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*2.3,v=6+Math.random()*(lv>=3?13:8);P.push({x:W0/2,y:H0*.45,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:Math.random()*6,vr:(Math.random()-.5)*.4,w:5+Math.random()*6,h:3+Math.random()*4,c:pick(cols)})}
  const t0=performance.now();
  (function f(t){const k=(t-t0)/1000;g.clearRect(0,0,W0,H0);
    P.forEach(p=>{p.vy+=.25;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.globalAlpha=Math.max(0,1-k/3);g.fillStyle=p.c;g.fillRect(-p.w/2,-p.h/2,p.w,p.h);g.restore()});
    if(k<3&&cv.isConnected)requestAnimationFrame(f);else cv.remove()})(t0);
}
function countUp(el,v,ms){const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms);el.textContent=fmt(v*(1-Math.pow(1-k,3)));if(k<1&&el.isConnected)requestAnimationFrame(f)})(t0)}

let CUR=null;
function mountPX(){
  const o=openState,sd=SETDEF.find(d=>d.id===o.s)||{},cost=o.n*S.pack[o.s].w;
  o.cost=cost;
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:${sd.col||"#888"}">
    <div class="pxbar"><div><b>${sd.n||setName(o.s)}</b><div class="pxrun" id="pxrun">Coste del sobre ${fmt(cost)}</div></div>
    <div class="step"><button class="ib" id="pxsnd" aria-label="Sonido">${SOUND?"🔊":"🔇"}</button><button class="ib" id="pxskip">Saltar</button></div></div>
    <div class="dots" id="pxdots">${o.cards.map(()=>"<i></i>").join("")}</div>
    <div class="pxstage" id="pxst"><div class="rays" id="pxrays"></div></div>
    <div class="pxhint" id="pxhint"></div>
    <div class="flash" id="pxflash"></div></div>`;
  o.cards.forEach(y=>{if(y.c.img)new Image().src=big(y.c.img)});
  $("#pxsnd").onclick=e=>{SOUND=!SOUND;try{localStorage.setItem("pcs-sound",SOUND?"1":"0")}catch(_){}e.currentTarget.textContent=SOUND?"🔊":"🔇"};
  $("#pxskip").onclick=()=>{o.mode="sum";TILT.el=null;CUR=null;renderM()};
  const st=$("#pxst");let P=null;
  st.addEventListener("pointerdown",e=>{ac();askGyro();P={x:e.clientX,moved:false};try{st.setPointerCapture(e.pointerId)}catch(_){}});
  st.addEventListener("pointermove",e=>{
    ptTilt(e);if(!P)return;const dx=e.clientX-P.x;if(Math.abs(dx)>8)P.moved=true;
    if(o.phase==="pack"&&!o.torn){const w=$("#pxpack").getBoundingClientRect().width;tearTo(o.tb+Math.abs(dx)/(w*.75))}
    else if(o.phase==="cards"&&o.rev&&CUR){CUR.classList.remove("snap");CUR.style.setProperty("--dx",dx+"px");CUR.style.setProperty("--dr",(dx/18).toFixed(1)+"deg")}
  });
  const up=e=>{
    if(!P)return;const dx=e.clientX-P.x,pp=P;P=null;
    if(o.phase==="pack"){if(o.torn)return;if(!pp.moved)autoTear();else o.tb=o.tp;return}
    if(o.phase!=="cards"||!CUR)return;
    if(!o.rev){if(Math.abs(dx)<40)reveal();return}
    if(Math.abs(dx)>70)nextCard(Math.sign(dx));
    else if(!pp.moved)nextCard(1);
    else{CUR.classList.add("snap");CUR.style.setProperty("--dx","0px");CUR.style.setProperty("--dr","0deg")}
  };
  st.addEventListener("pointerup",up);st.addEventListener("pointercancel",up);
  for(let i=0;i<o.idx;i++)markDot(i,RAR[o.cards[i].c.r].c);
  $("#pxrun").innerHTML=runTxt();
  if(o.phase==="pack")buildPack();else{buildStack();showCard(o.idx)}
}
function runTxt(){const o=openState,d=o.run-o.cost;return o.phase==="pack"?`Coste del sobre ${fmt(o.cost)}`:`Llevas <b class="${cls(d)}">${fmt(o.run)}</b> de ${fmt(o.cost)}`}
function markDot(i,col){const d=$("#pxdots");if(!d)return;const e=d.children[i];if(e){e.style.background=col;e.style.color=col;e.classList.add("on")}}
function buildPack(){
  const o=openState,sd=SETDEF.find(d=>d.id===o.s)||{};
  $("#pxst").insertAdjacentHTML("beforeend",`<div class="packwrap" id="pxpw"><div class="bobw"><div class="pack" id="pxpack">
    <div class="pbody"><div class="pcnt">${sd.sym?`<img class="psym" src="${sd.sym}" alt="" onerror="this.remove()">`:""}<div class="pball"></div><div class="pname">${sd.n||setName(o.s)}</div><div class="psub">Sobre de ampliación · ${o.cards.length} cartas</div></div><div class="holo" style="--ho:.3"></div><div class="sweep"></div><div class="glare"></div></div>
    <div class="ptop">POKÉ CARDS</div><div class="tear"></div></div></div></div>`);
  TILT.el=$("#pxpack");
  $("#pxhint").innerHTML=`<div style="font-size:16px;color:#fff;font-weight:700">Desliza el dedo por el sobre para abrirlo</div><div class="mu">o tócalo · inclina el móvil para ver el brillo</div>`;
}
function tearTo(v){
  const o=openState;o.tp=clamp(v,0,1);const pk=$("#pxpack");if(!pk)return;pk.style.setProperty("--tp",o.tp);
  const stp=Math.floor(o.tp*8);if(stp>o.tstep){o.tstep=stp;sfx.tick();vibe(6)}
  if(o.tp>=1&&!o.torn)tear();
}
function autoTear(){const o=openState,a=o.tp,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/380);tearTo(a+(1-a)*k);if(k<1&&!o.torn)requestAnimationFrame(f)})(t0)}
function tear(){
  const o=openState;o.torn=true;sfx.rip();vibe(25);
  const pk=$("#pxpack");pk.querySelector(".ptop").classList.add("fly");pk.querySelector(".tear").style.opacity=0;
  $("#pxhint").innerHTML="";
  setTimeout(()=>{const w=$("#pxpw");if(w)w.classList.add("done");sfx.swish()},450);
  setTimeout(()=>{const w=$("#pxpw");if(w)w.remove();if(!$("#px"))return;o.phase="cards";buildStack();showCard(o.idx)},950);
}
function buildStack(){
  $("#pxst").insertAdjacentHTML("beforeend",`<div class="cstack" id="pxcs">${[3,2,1].map(i=>`<div class="under" style="--i:${i}"></div>`).join("")}</div>`);
}
function showCard(i){
  const o=openState,x=o.cards[i],c=x.c,lv=hitLv(x),rc=RAR[c.r].c,cs=$("#pxcs");if(!cs)return;
  const left=o.cards.length-i-1;cs.querySelectorAll(".under").forEach(u=>u.classList.toggle("off",+u.style.getPropertyValue("--i")>left));
  cs.insertAdjacentHTML("beforeend",pcHTML(c,x.rv,lv>0,lv));
  const all=cs.querySelectorAll(".pc");CUR=all[all.length-1];
  const old=[...all].filter(e=>e!==CUR&&!e.classList.contains("fly"));old.forEach(e=>e.remove());
  const fl=cs.querySelector(".pc.fly");if(fl)cs.appendChild(fl);
  TILT.el=CUR;o.lv=lv;o.rev=!lv;
  $("#pxrays").classList.remove("on");const bn=$("#px .banner");if(bn)bn.remove();
  if(!lv){sfx.flip();markDot(i,rc);o.run+=cardVal(x);$("#pxrun").innerHTML=runTxt();setInfo(x,false)}
  else{
    sfx.charge(lv);vibe(lv>=3?[20,40,20,40,20]:15);
    $("#pxhint").innerHTML=`<div class="cinfo"><div class="cv" style="color:${rc}">${lv>=3?"¡¡Algo brilla muchísimo!!":lv===2?"¡Algo brilla!":"Esto brilla…"}</div><div class="mu">Toca la carta para revelarla · ${i+1}/${o.cards.length}</div></div>`;
  }
}
function setInfo(x,anim){
  const o=openState,c=x.c,v=cardVal(x);
  $("#pxhint").innerHTML=`<div class="cinfo" style="--rc:${RAR[c.r].c}"><div><b style="color:#fff">${c.name}</b> <span class="rchip">${RAR[c.r].n}</span>${x.rv?' <span class="rchip rv">Reverse</span>':""}${x.nw?' <span class="nwb">NUEVA</span>':""}</div><div class="cv" id="pxcv">${anim?fmt(0):fmt(v)}</div><div class="mu">${o.idx>=o.cards.length-1?"Toca para ver el resumen":"Desliza o toca para la siguiente"} · ${o.idx+1}/${o.cards.length}</div></div>`;
  if(anim)countUp($("#pxcv"),v,lv2ms(o.lv));
}
const lv2ms=lv=>lv>=3?1400:lv===2?900:600;
function reveal(){
  const o=openState,x=o.cards[o.idx],c=x.c,lv=o.lv,rc=RAR[c.r].c,el=CUR;
  o.rev=true;el.classList.remove("back");sfx.flip();
  setTimeout(()=>{
    if(!$("#px"))return;
    el.classList.remove("charge","l3");
    const fl=$("#pxflash");fl.classList.remove("on");void fl.offsetWidth;fl.classList.add("on");
    const ry=$("#pxrays");ry.style.setProperty("--rc",rc);ry.classList.add("on");
    const base={DR:1,IR:2,UR:2,SIR:3,HR:3}[c.r];
    $("#pxst").insertAdjacentHTML("beforeend",`<div class="banner" style="--rc:${rc}">${lv>=3?"✨ ":""}${base?RAR[c.r].n:"¡Carta valiosa!"}${lv>=3?" ✨":""}</div>`);
    confetti(lv,rc);sfx.hit(lv);vibe(lv>=3?[60,40,140]:lv===2?[40,30,60]:30);
    markDot(o.idx,rc);o.run+=cardVal(x);$("#pxrun").innerHTML=runTxt();setInfo(x,true);
  },280);
}
function nextCard(dir){
  const o=openState,el=CUR;if(!el)return;
  el.classList.remove("snap");el.classList.add("fly");el.style.setProperty("--dx",(dir*innerWidth*1.1)+"px");el.style.setProperty("--dr",(dir*28)+"deg");
  sfx.swish();CUR=null;setTimeout(()=>el.remove(),450);
  o.idx++;
  if(o.idx>=o.cards.length){$("#pxrays").classList.remove("on");setTimeout(()=>{if(openState!==o||!$("#px"))return;o.mode="sum";TILT.el=null;renderM()},320)}
  else showCard(o.idx);
}
function zoom(id,rv){
  const c=BYID[id];if(!c)return;const old=$("#zv");if(old)old.remove();
  const el=document.createElement("div");el.id="zv";el.className="px zv";el.style.setProperty("--sc",RAR[c.r].c);
  el.innerHTML=`<div class="pxstage"><div class="cstack">${pcHTML(c,rv,false,0)}</div></div><div class="pxhint"><div class="cinfo" style="--rc:${RAR[c.r].c}"><div><b style="color:#fff">${c.name}</b> <span class="rchip">${RAR[c.r].n}</span>${rv?' <span class="rchip rv">Reverse</span>':""}</div><div class="cv">${fmt(price(id)*(rv?rvr(c):1))}</div><div class="mu">Mueve el dedo o inclina el móvil · toca para cerrar</div></div></div>`;
  document.body.appendChild(el);
  const prev=TILT.el;TILT.el=el.querySelector(".pc");
  el.addEventListener("pointerdown",()=>askGyro());
  el.addEventListener("pointermove",ptTilt);
  el.addEventListener("click",()=>{el.remove();TILT.el=prev&&prev.isConnected?prev:null});
}

/* ===================== V5: SISTEMAS ===================== */

/* ----- épocas de sobres ----- */

/* ----- gradeo ----- */

/* ----- encargos, misiones y logros ----- */

/* ----- sonido extra y música ----- */
Object.assign(sfx,{
  bell:()=>{tone(1318.5,0,.45,"sine",.05);tone(1046.5,.18,.6,"sine",.05)},
  coin:()=>{tone(2300+rnd(500),0,.08,"triangle",.07);tone(3400,.03,.07,"sine",.03)},
  bill:()=>nz(.13,1600,700,.12,"bandpass",1),
  drawer:()=>{nz(.2,320,120,.25,"lowpass",1);tone(2637,.14,.55,"sine",.07)},
  key:()=>tone(1000,0,.05,"square",.035),
  ok:()=>{tone(1400,0,.1,"square",.05);tone(1400,.16,.12,"square",.05);nz(.6,2600,2400,.04,"bandpass",8)},
  err:()=>{tone(220,0,.22,"sawtooth",.05);tone(180,.12,.25,"sawtooth",.05)},
  chaching:()=>{tone(1568,0,.12,"triangle",.1);tone(2093,.1,.45,"triangle",.1);nz(.12,5000,6500,.06,"highpass")},
  ach:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,i*.08,.4,"triangle",.08))},
  sad:()=>{tone(392,0,.28,"triangle",.08);tone(370,.28,.28,"triangle",.08);tone(349,.56,.6,"triangle",.08)}
});
let MUSIC=(()=>{try{return localStorage.getItem("pcs-music")==="1"}catch(e){return false}})(),musT=null,musN=0,musAt=0,bellT=0;
function musicTick(){
  if(!MUSIC||paused||document.hidden)return;const a=ac();if(!a||a.state!=="running")return;
  const now=a.currentTime;if(musAt<now)musAt=now+.05;
  const f=n=>261.63*Math.pow(2,n/12),CH=[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]];
  while(musAt<now+.6){const st=musN%16,ch=CH[Math.floor(musN/16)%4],t=musAt-now;
    if(st%8===0)tone(f(ch[0]-12),t,1,"sine",.045);
    if(st%2===0)tone(f(ch[(st/2)%4]+12),t,.35,"triangle",.016);
    musAt+=.25;musN++}
}
function setMusic(v){MUSIC=v;try{localStorage.setItem("pcs-music",v?"1":"0")}catch(e){}clearInterval(musT);if(v)musT=setInterval(musicTick,200)}

/* ----- vista de la tienda: zoom, arrastre y cámara ----- */
const VIEW={s:1,ox:0,oy:0,cw:W,ch:H,dpr:2,min:1,max:2,cover:1,init:false,user:0};
function clampView(){const V=VIEW,x0=CX0*V.s,x1=CX1*V.s,y0=CY0*V.s,y1=CY1*V.s;
  V.ox=x1-x0<=V.cw?(V.cw-(x1+x0))/2:clamp(V.ox,V.cw-x1,-x0);V.oy=y1-y0<=V.ch?(V.ch-(y1+y0))/2:clamp(V.oy,V.ch-y1,-y0)}
function fitCanvas(){
  const r=CV.getBoundingClientRect();if(!r.width||!r.height)return;const V=VIEW,dpr=Math.min(LITE()?1.25:2,devicePixelRatio||1);
  const cx0=V.init?(V.cw/2-V.ox)/V.s:W/2,cy0=V.init?(V.ch/2-V.oy)/V.s:H*.45;
  CV.width=Math.round(r.width*dpr);CV.height=Math.round(r.height*dpr);
  V.cw=r.width;V.ch=r.height;V.dpr=dpr;V.min=Math.min(r.width/(CX1-CX0),r.height/(CY1-CY0));V.shop=Math.min(r.width/W,r.height/H);V.cover=Math.max(r.width/W,r.height/(FRONT_Y+40));V.max=Math.max(V.cover*2.2,V.shop*2.5);
  if(!V.init){V.s=V.cover;V.init=true}
  V.s=clamp(V.s,V.min,V.max);V.ox=V.cw/2-cx0*V.s;V.oy=V.ch/2-cy0*V.s;clampView();
}
function zoomAt(ns,sx,sy){const V=VIEW;ns=clamp(ns,V.min,V.max);const wx=(sx-V.ox)/V.s,wy=(sy-V.oy)/V.s;V.s=ns;V.ox=sx-wx*ns;V.oy=sy-wy*ns;clampView();V.user=performance.now();V.mode="manual"}
(function(){
  const PT=new Map();let pinch=null,drag=null,moved=false;
  const pos=e=>{const r=CV.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
  CV.addEventListener("pointerdown",e=>{ac();const p=pos(e);PT.set(e.pointerId,p);try{CV.setPointerCapture(e.pointerId)}catch(_){}
    if(PT.size===1){drag={x:p.x,y:p.y,ox:VIEW.ox,oy:VIEW.oy};moved=false}
    else if(PT.size===2){const [a,b]=[...PT.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,s:VIEW.s};moved=true}});
  CV.addEventListener("pointermove",e=>{if(!PT.has(e.pointerId))return;const p=pos(e);PT.set(e.pointerId,p);
    if(pinch&&PT.size>=2){const [a,b]=[...PT.values()];zoomAt(pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,(a.x+b.x)/2,(a.y+b.y)/2);return}
    if(drag){const dx=p.x-drag.x,dy=p.y-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)moved=true;if(moved){VIEW.ox=drag.ox+dx;VIEW.oy=drag.oy+dy;clampView();VIEW.user=performance.now();VIEW.mode="manual"}}});
  const up=e=>{const p=PT.get(e.pointerId);PT.delete(e.pointerId);if(PT.size<2)pinch=null;
    if(PT.size===1){const q=[...PT.values()][0];drag={x:q.x,y:q.y,ox:VIEW.ox,oy:VIEW.oy}}
    if(PT.size===0){if(!moved&&p&&e.type==="pointerup")tapWorld((p.x-VIEW.ox)/VIEW.s,(p.y-VIEW.oy)/VIEW.s);drag=null}};
  CV.addEventListener("pointerup",up);CV.addEventListener("pointercancel",up);
  CV.addEventListener("wheel",e=>{e.preventDefault();const p=pos(e);zoomAt(VIEW.s*(e.deltaY<0?1.12:1/1.12),p.x,p.y)},{passive:false});
  window.addEventListener("resize",fitCanvas);
})();
function tapWorld(x,y){
  {const th=custs.find(c=>c.run&&!c.caught&&Math.hypot(c.x-x,c.y-14-y)<34);if(th){catchThief(th);return}}
  const f=front();if(f&&Math.hypot(x-f.x,y-(f.y-20))<40){serveFront();return}
  if(huntTap(x,y))return;
  if((S.pet||"cat")!=="none"&&Math.hypot(x-CAT.x,y-(CAT.y-8))<24){petSound();return}
  let best=null,bd=26;custs.forEach(c=>{const d=Math.hypot(x-c.x,y-(c.y-22));if(d<bd){bd=d;best=c}});
  if(best&&!G.M){CUSTC=best;openM("custc");return}
  tapBuilding(x,y);
}

function drawEvBanner(){const t=evShort();if(!t)return;cx.font="700 13px system-ui,sans-serif";const w=cx.measureText(t).width+20;cx.fillStyle="rgba(0,0,0,.7)";rr(8,8,w,26,13);cx.fill();cx.fillStyle="#fff";cx.textAlign="left";cx.fillText(t,18,26)}

/* ----- caja: efectivo con cambio y TPV ----- */
let CK=null;
function payWith(tc){
  if(Math.random()<.15)return tc;
  const cands=[500,1000,2000,5000,10000].map(u=>Math.ceil(tc/u)*u).filter((v,i,a)=>v>=tc&&a.indexOf(v)===i&&v-tc<10000).sort((a,b)=>a-b);
  const w=[6,3,1.4,.6,.3],o={};cands.forEach((v,i)=>o[i]=w[i]||.2);return cands[+wpick(o)];
}
function openCheckout(c){
  const tc=Math.round(c.hold.total*100),card=Math.random()<(c.type==="whale"?.7:c.type==="kid"?.12:c.type==="investor"?.6:.42);
  CK={c,tc,m:card?"card":"cash",given:[],typed:"",st:"pay",msg:""};
  if(card)CK.say=pick(["Con tarjeta, porfa 💳","¿Aceptas tarjeta?","Pago con el móvil 📱"]);
  else{CK.paid=payWith(tc);CK.say=CK.paid===tc?"Te lo doy justo 👌":pick(["Aquí tienes 💶","Tome, cóbrese","¿Tienes cambio?"]);sfx.drawer()}
  openM("ck");
}
const denCls=v=>v>=500?"bill e"+v/100:v===200?"coin cb2":v===100?"coin cb":v>=10?"coin cg":"coin cc";
const denLab=v=>v>=100?(v/100)+" €":v+" c";
function mCk(){
  const k=CK,c=k.c,h=c.hold;
  const items=h.k==="prod"?`${pInfo(h.pid).ic} ${pInfo(h.pid).n}`:h.k==="pack"?`${h.qty} × sobre ${setName(h.s)} · ${fmt(S.shelf[h.s])} c/u`:`${BYID[h.it.c].name}${h.it.gr?" · PGS "+h.it.gr:""} · carta suelta`;
  const R=c.reg?RG(c.reg):null,av=R?R.e:({kid:"🧒",collector:"🧑",investor:"🧑‍💼",whale:"🤑"}[c.type]||"🙂");
  const top=`<div class="cust"><div class="av">${av}</div><div class="sp">${R?`<b>${R.n}</b> <span style="font-size:11px">${hearts(regS(c.reg).loy)}</span><br>`:""}${k.say}</div></div><div class="lcd"><span>TOTAL</span><b>${fmt(k.tc/100)}</b></div><div class="ckitems">${items}</div>`;
  if(k.m==="cash"){
    const due=k.paid-k.tc,giv=k.given.reduce((a,b)=>a+b,0),df=giv-due;
    const paid=`<div class="pn" style="text-align:center;margin:0"><div class="mu">Te paga con</div><div class="paid"><div class="${denCls(Math.min(k.paid,10000))}">${fmt(k.paid/100)}</div></div></div>`;
    if(due===0)return `<h2>Caja</h2><div class="ckwrap">${top}${paid}<button class="b go big" data-a="ckgive">✔ Cobrar · importe exacto</button></div>`;
    return `<h2>Caja</h2><div class="ckwrap">${top}${paid}
      <div class="chg"><div class="pn"><span class="mu">Cambio a devolver</span><b>${fmt(due/100)}</b></div><div class="pn"><span class="mu">Entregado</span><b class="${df===0?"up":df>0?"down":""}">${fmt(giv/100)}</b></div></div>
      <div class="tray">${k.given.length?k.given.map((v,i)=>`<button class="${denCls(v)}" data-a="ckrem" data-n="${i}">${denLab(v)}</button>`).join(""):'<span class="mu">Toca billetes y monedas del cajón para dar el cambio. Toca aquí uno para quitarlo.</span>'}</div>
      <div class="drawer">${[[5000,2000,1000,500],[200,100,50,20],[10,5,2,1]].map(r=>`<div class="drow">${r.map(v=>`<button class="${denCls(v)}" data-a="ckadd" data-n="${v}">${denLab(v)}</button>`).join("")}</div>`).join("")}</div>
      <div class="btns"><button class="b" data-a="ckclr"${k.given.length?"":" disabled"}>Borrar</button><button class="b go" data-a="ckgive" style="flex:1">✔ Entregar cambio</button></div></div>`;
  }
  const busy=k.st==="tap"||k.st==="ok";
  return `<h2>Caja</h2><div class="ckwrap">${top}<div class="tpv${k.st==="ok"?" appr":""}${k.err?" shake":""}"><div class="tpvscr"><div class="ms">${k.msg||"IMPORTE"}</div><div class="amt">${fmt((+k.typed||0)/100)}</div></div>
  ${busy?`<div class="card3"></div><div class="nfc">${k.st==="ok"?"✔ Pago aprobado · imprimiendo ticket…":"📶 Esperando la tarjeta…"}</div>`:`<div class="keys">${["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(x=>`<button class="key${x==="C"?" cl":x==="⌫"?" bs":""}" data-a="ckkey" data-k="${x}">${x}</button>`).join("")}</div><button class="key ok" style="width:100%;margin-top:8px" data-a="ckok">OK</button><div class="nfc">Teclea el total (en céntimos: 735 = 7,35 €) y pulsa OK</div>`}</div></div>`;
}
function finishCK(recv){const c=CK.c;CK=null;closeM();pay(c,recv);sfx.chaching()}

/* ----- regateo al vender ----- */
let HG=null;
function canHaggle(c){return c.hold.k==="single"&&c.hold.total>=5&&!c.hg&&Math.random()<({investor:.6,collector:.4,whale:.2,kid:.3}[c.type]||.3)}
function openHaggle(c){c.hg=true;const full=r05(c.hold.total),offer=r05(full*(.74+Math.random()*.14));HG={c,full,offer,max:offer+(full-offer)*(.3+Math.random()*.7),x:r05((offer+full)/2),tries:0,msg:`¿Me la dejas en ${fmt(offer)}?`};openM("hag")}
function mHag(){
  const h=HG,it=h.c.hold.it,cd=BYID[it.c];
  return `<h2>Regateo</h2><div class="pn" style="display:flex;gap:12px"><div style="width:100px;flex:none">${face(cd,it.rv)}</div><div style="flex:1;min-width:0"><b>${cd.name}</b>${it.gr?` <span class="mu">PGS ${it.gr}</span>`:""}<div>En vitrina: <b>${fmt(h.full)}</b></div><div class="mu">Mercado: ${fmt(itemVal(it))}</div><div style="margin-top:8px;background:var(--panel2);border-radius:8px;padding:8px">🗣️ ${h.msg}</div></div></div>
  <div class="pn"><div class="row"><span>Tu contraoferta</span><b id="hglab">${fmt(h.x)}</b></div><input type="range" data-i="hgx" min="${h.offer}" max="${h.full}" step="0.05" value="${h.x}">
  <div class="btns"><button class="b" data-a="hgacc">Aceptar ${fmt(h.offer)}</button><button class="b pri" data-a="hgcnt">Contraofertar</button><button class="b" data-a="hgfix">Precio fijo</button></div></div>`;
}
function dealHg(v){const c=HG.c;c.hold.total=v;HG=null;openCheckout(c)}

/* ----- lotes misteriosos ----- */
let LOT=null;
function makeLot(c){
  const n=40+rnd(220),cards=[],W8={C:52,U:26,R:11,DR:6,IR:2.2,UR:1.2,SIR:.9,HR:.7};
  const pools={};Object.keys(W8).forEach(r=>pools[r]=(BYR[r]||[]).filter(x=>S.sets.includes(x.s)));
  for(let i=0;i<n;i++){let r=wpick(W8);if(!pools[r].length)r="C";const l=pools[r].length?pools[r]:CARDS,cd=pick(l),k=wpick({NM:45,LP:38,MP:17}),rv=(r==="C"||r==="U"||r==="R")&&Math.random()<.15;cards.push({c:cd,k,rv,v:price(cd.id)*(rv?rvr(cd):1)*COND[k]})}
  const v=cards.reduce((a,x)=>a+x.v,0),ask=Math.max(5,r05(v*(.5+Math.random()*.8)));
  LOT={c,n,cards,v,ask,floor:r05(ask*(.72+Math.random()*.18)),rev:[],expert:false,lo:v*(.35+Math.random()*.3),hi:v*(1.35+Math.random()*.8),tries:0,msg:"",offer:ask,done:false,counter:0,free:!!S.staff.appraiser};
}
function lotEst(){const L=LOT;if(L.expert)return [L.v,L.v];if(!L.rev.length)return [L.lo,L.hi];const k=L.rev.length,m=L.rev.reduce((a,i)=>a+L.cards[i].v,0)/k,e=m*L.n,b=clamp(1.3/Math.sqrt(k)*(S.staff.appraiser?.5:1),.08,.9);return [e*(1-b),e*(1+b)]}
function lotReview(k){const L=LOT,rest=L.cards.map((_,i)=>i).filter(i=>!L.rev.includes(i));for(let j=0;j<k&&rest.length;j++)L.rev.push(rest.splice(rnd(rest.length),1)[0])}
const expCost=()=>Math.max(20,r05(LOT.ask*.08));
function mLot(){
  const L=LOT;
  if(L.done){const d=L.v-L.paid,top=L.cards.slice().sort((a,b)=>b.v-a.v).slice(0,9);
    return `<h2>¡Lote comprado!</h2><div class="pn"><div>Has pagado <b>${fmt(L.paid)}</b> por ${L.n} cartas.</div><div class="est">Valor real: <b>${fmt(L.v)}</b> <span class="${cls(d)}">(${d>=0?"+":""}${fmt(d)})</span></div><div class="mu">${d>L.paid*.5?"¡Menudo chollo! 🤑":d>=0?"Buen negocio 👍":"Vaya, te la han colado 😅"}</div></div><h3>Lo mejor del lote</h3><div class="tiles">${top.map(x=>`<div class="tile zoomable" data-a="zoom" data-k="${x.c.id}" data-n="${x.rv?1:0}">${face(x.c,x.rv)}<div class="pt">${fmt(x.v)}</div></div>`).join("")}</div><p class="mu">Las cartas ya están en tu colección.</p>`}
  const [lo,hi]=lotEst(),rv=L.rev.map(i=>L.cards[i]).sort((a,b)=>b.v-a.v),mn=r05(L.ask*.4);
  return `<h2>Lote misterioso</h2><div class="cust"><div class="av">👴</div><div class="sp">Vendo mi colección: ${L.n} cartas. Te la dejo en ${fmt(L.ask)}.</div></div>
  <div class="pn" style="margin-top:10px"><div class="mu">${L.expert?"Valor exacto (experto)":L.rev.length?`Estimación tras revisar ${L.rev.length} cartas`:"Estimación a ojo"}</div><div class="est"><b>${L.expert?fmt(L.v):fmt(lo)+" – "+fmt(hi)}</b></div>
  <div class="btns"><button class="b" data-a="lotrev" data-n="10"${L.rev.length>=L.n?" disabled":""}>🔎 Revisar 10 · ${L.free?"gratis":fmt(10)}</button><button class="b" data-a="lotrev" data-n="50"${L.rev.length>=L.n?" disabled":""}>🔎 Revisar 50 · ${fmt(35)}</button><button class="b" data-a="lotexp"${L.expert?" disabled":""}>🧐 Experto · ${fmt(expCost())}</button></div>
  ${rv.length?`<div class="rev">${rv.slice(0,60).map(x=>`<div class="tile">${face(x.c,x.rv)}<div class="pt">${fmt(x.v)}</div></div>`).join("")}</div>`:""}</div>
  ${L.msg?`<div class="pn">🗣️ ${L.msg}</div>`:""}
  <div class="pn"><div class="row"><span>Tu oferta</span><b id="lotlab">${fmt(L.offer)}</b></div><input type="range" data-i="lotx" min="${mn}" max="${L.ask}" step="0.05" value="${clamp(L.offer,mn,L.ask)}">
  <div class="btns"><button class="b pri" data-a="lotbuy"${S.money<L.ask?" disabled":""}>Comprar por ${fmt(L.ask)}</button><button class="b" data-a="lotoff">Ofrecer</button>${L.counter?`<button class="b pri" data-a="lotcnt"${S.money<L.counter?" disabled":""}>Cerrar por ${fmt(L.counter)}</button>`:""}<button class="b" data-a="lotno">Rechazar</button></div></div>`;
}
function lotBuy(p){
  const L=LOT;if(S.money<p){toast("No tienes dinero suficiente");return}
  S.money-=p;const each=p/L.n;L.cards.forEach(x=>{S.items.push({i:S.nid++,c:x.c.id,k:x.k,rv:x.rv,cost:each,case:null,res:false});S.dex[x.c.id]=1});
  L.done=true;L.paid=p;sfx.chaching();if(L.v-p>p*.5)shake(6);track("lot");hud();renderM();
}
function endLot(){const L=LOT;if(!L)return;const c=L.c;LOT=null;if(c){const qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.hold=null;say(c,L.done?"❤️":"👋");c.st="leave";if(L.done)S.sales++}}

/* ----- revelación de gradeo ----- */
let GR=null;
function slabHTML(c,rv,g,hide){const h=holoOf(c,rv);return `<div class="slab" style="--ho:${h.ho}"><div class="slab-lb"><div><b>${c.name}</b><span>${setName(c.s)}${c.num?" #"+c.num:""}${rv?" · Reverse":""}</span></div><div class="gnum">${hide?"?":g}</div><div class="gtx">${hide?"":GTXT[g]}</div></div><div class="slab-card">${faceBig(c,rv)}<div class="holo ${h.cl}"></div><div class="glare"></div></div><div class="glare2"></div></div>`}
function openGrades(){if(!S.grNew||!S.grNew.length){toast("No hay resultados nuevos");return}GR={ids:S.grNew.slice(),idx:0};S.grNew=[];save();openM("grev")}
function mountGR(){
  const g=GR;let it=null;while(g.idx<g.ids.length&&!(it=S.items.find(i=>i.i===g.ids[g.idx])))g.idx++;
  if(!it){GR=null;TILT.el=null;closeM();return}
  const c=BYID[it.c];g.ready=false;
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:#c0392b"><div class="pxbar"><div><b>Resultados de gradeo</b><div class="pxrun">${g.idx+1} de ${g.ids.length}</div></div><div class="step"><button class="ib" id="grclose">Cerrar</button></div></div><div class="pxstage" id="pxst"><div class="rays" id="pxrays"></div>${slabHTML(c,it.rv,it.gr,true)}</div><div class="pxhint" id="pxhint"><div class="cinfo"><div class="cv">Calificando…</div></div></div><div class="flash" id="pxflash"></div></div>`;
  const sl=$("#pxst .slab"),gn=sl.querySelector(".gnum");TILT.el=sl;
  $("#grclose").onclick=()=>{GR=null;TILT.el=null;closeM()};
  $("#pxst").addEventListener("pointermove",ptTilt);$("#pxst").addEventListener("pointerdown",askGyro);
  sfx.charge(it.gr>=9?3:1);
  const iv=setInterval(()=>{gn.textContent=1+rnd(10);sfx.tick()},85);
  setTimeout(()=>{
    clearInterval(iv);if(!$("#px")||GR!==g)return;
    gn.textContent=it.gr;gn.classList.add("land");sl.querySelector(".gtx").textContent=GTXT[it.gr];
    const lv=it.gr>=10?3:it.gr===9?2:it.gr===8?1:0,v=itemVal(it),before=price(it.c)*(it.rv?rvr(c):1)*COND[it.k];
    if(lv){const fl=$("#pxflash");fl.classList.add("on");const ry=$("#pxrays");ry.style.setProperty("--rc",lv>=3?"#ffd54a":"#e3350d");ry.classList.add("on");confetti(lv,"#e3350d");sfx.hit(lv);vibe(lv>=3?[60,40,140]:40);$("#pxst").insertAdjacentHTML("beforeend",`<div class="banner" style="--rc:#c0392b">${it.gr>=10?"💎 GEM MINT 10 💎":it.gr===9?"MINT 9":"NM-MT 8"}</div>`)}else sfx.sad();
    $("#pxhint").innerHTML=`<div class="cinfo"><div><b style="color:#fff">${c.name}</b> · PGS ${it.gr} ${GTXT[it.gr]}</div><div class="cv ${v>=before?"up":"down"}">${fmt(v)}</div><div class="mu">Antes ${fmt(before)} · toca para ${g.idx<g.ids.length-1?"la siguiente":"terminar"}</div></div>`;
    g.ready=true;
  },1500);
  $("#pxst").addEventListener("click",()=>{if(!g.ready)return;g.idx++;if(g.idx>=g.ids.length){GR=null;TILT.el=null;closeM()}else mountGR()});
}

/* ----- modales nuevos ----- */
let albS=null,tTab="ord";
function mTasks(){
  const tabs=[["ord","📋 Encargos"],["mis","✅ Misiones"],["ach","🏆 Logros"],["reg","👥 Clientes"]].map(([k,n])=>`<button class="b ${tTab===k?"on":""}" data-a="ttab" data-k="${k}">${n}</button>`).join("");
  let b="";
  if(tTab==="ord")b=S.orders.length?S.orders.map(o=>{const c=BYID[o.c];if(!c)return "";const own=ownFor(o),dl=o.due-S.day;return `<div class="pn" style="display:flex;gap:10px"><div class="zoomable" style="width:70px;flex:none" data-a="zoom" data-k="${c.id}" data-n="0">${face(c,false)}</div><div style="flex:1;min-width:0"><b>${o.who}</b> busca <b>${c.name}</b><div class="mu">${setName(c.s)} · ${RAR[c.r].n} · mercado ${fmt(price(c.id))}</div><div>Paga <b class="up">${fmt(o.pay)}</b> · ${dl<=0?"último día":dl===1?"queda 1 día":"quedan "+dl+" días"}</div><div class="btns">${own?`<button class="b pri" data-a="deliver" data-n="${o.id}">Entregar</button>`:'<span class="mu">Aún no la tienes: ábrela en sobres o cómprala.</span>'}</div></div></div>`}).join(""):'<p class="mu">No hay encargos ahora. Irán llegando peticiones de clientes.</p>';
  else if(tTab==="mis")b=S.dm.list.map((m,i)=>`<div class="pn"><div class="row"><b>${m.t}</b><span class="up">+${fmt(m.r)}</span></div><div class="prog"><i style="width:${m.p/m.g*100}%"></i></div><div class="row"><span class="mu">${Math.floor(m.p)}/${m.g}</span>${m.cl?'<span class="up">Cobrada ✔</span>':m.done?`<button class="b pri" data-a="mclaim" data-n="${i}">Cobrar</button>`:""}</div></div>`).join("")+'<p class="mu">Las misiones se renuevan cada día.</p>';
  else if(tTab==="reg")b=mRegs();
  else b=ACH.map(a=>{const d=S.ach[a.id],v=achVal(a);return `<div class="pn" style="${d?"":"opacity:.78"}"><div class="row"><b>${d?"🏆":"🔒"} ${a.n}</b><span class="up">+${fmt(a.r)}</span></div><div class="mu">${a.d}</div>${d?"":`<div class="prog"><i style="width:${Math.min(1,v/a.g)*100}%"></i></div>`}</div>`}).join("");
  return retoTabs("tasks")+`<div class="tabs t4">${tabs}</div>${b}`;
}
function mGrading(){
  const q=S.items.filter(i=>i.gq),g=S.items.filter(i=>i.gr).sort((a,b)=>itemVal(b)-itemVal(a));
  return cardTabs("grading")+`<p class="mu">Envía cartas desde «Cartas»: selecciona una y pulsa Gradear. La nota depende del estado (una NM tiene más opciones de 9 o 10). Un 10 multiplica el valor ×4; una nota baja lo reduce.</p>
  ${S.grNew&&S.grNew.length?`<button class="b pri big" data-a="grades">📬 Ver ${S.grNew.length} resultado(s)</button>`:""}
  <h3>En camino (${q.length})</h3>${q.length?q.map(i=>{const c=BYID[i.c],d=i.gq.due-S.day;return `<div class="pn row"><span><b>${c.name}</b> <span class="mu">${i.k} · ${GSVC[i.gq.svc].n}</span></span><span class="mu">${d<=1?"llega mañana":"llega en "+d+" días"}</span></div>`}).join(""):'<p class="mu">Nada en gradeo.</p>'}
  <h3>Cartas gradeadas (${g.length})</h3><div class="tiles">${g.slice(0,120).map(i=>{const c=BYID[i.c];return `<div class="tile zoomable" data-a="zoom" data-k="${c.id}" data-n="${i.rv?1:0}">${face(c,i.rv)}<div class="pt">${fmt(itemVal(i))}</div><div class="gb">PGS ${i.gr}</div></div>`}).join("")}</div>`;
}
function gradeBtns(sel){
  const it=sel.its[0];if(it.fkK)return '<div class="mu" style="margin-top:8px">🚫 Falsificación detectada por el servicio de gradeo. No vale nada: puedes deshacerte de ella con «Vender».</div>';
  if(it.gq)return '<div class="mu" style="margin-top:8px">📮 En gradeo. Mira el estado en Más → Gradeo.</div>';if(it.gr)return "";
  return `<div class="btns"><button class="b" data-a="inspc">🔍 Examinar</button><button class="b" data-a="grade" data-k="std"${S.money<GSVC.std.cost?" disabled":""}>🔍 Gradear · ${fmt(GSVC.std.cost)} · ${GSVC.std.days} días</button><button class="b" data-a="grade" data-k="exp"${S.money<GSVC.exp.cost?" disabled":""}>⚡ Exprés · ${fmt(GSVC.exp.cost)} · 1 día</button></div>`;
}
function mBackup(){
  return `<h2>Partida</h2><div class="pn"><div>Se guarda sola cada 10 segundos, al cerrar y al terminar el día.</div><div class="mu">Último guardado: ${S.savedAt?new Date(S.savedAt).toLocaleString("es-ES"):"—"}</div><div class="btns"><button class="b pri" data-a="savebtn">💾 Guardar ahora</button></div></div>
  <div class="pn"><b>Copia de seguridad</b><div class="mu">Si el navegador borra sus datos, perderías la partida. Descarga una copia de vez en cuando.</div><div class="btns"><button class="b pri" data-a="export">⬇️ Exportar archivo</button><button class="b" data-a="importf">⬆️ Importar archivo</button><button class="b" data-a="copycode">📋 Copiar código</button></div>
  <textarea class="inp" id="impcode" rows="3" placeholder="…o pega aquí un código de partida"></textarea><button class="b" data-a="importc">Cargar código</button></div>
  <div class="pn"><b>Empezar de cero</b><div class="btns"><button class="b danger" data-a="reset">🗑️ Borrar partida</button></div></div>`;
}

/* ----- guardado y copias ----- */
function importData(txt){
  let o=null;txt=(txt||"").trim();
  try{o=JSON.parse(txt)}catch(e){try{o=JSON.parse(decodeURIComponent(escape(atob(txt))))}catch(e2){}}
  const ns=o&&(o.S||o);
  if(!ns||typeof ns.money!=="number"||!Array.isArray(ns.items)){toast("⚠️ Ese archivo o código no es una partida válida");return}
  if(!confirm(`¿Cargar la partida del día ${ns.day} con ${fmt(ns.money)}? Se sustituirá la actual.`))return;
  toast("Cargando partida…");
  loadSetsFor(ns.sets).then(()=>{replaceState(ns);S.phase="closed";S.clock=0;custs=[];queue=[];ensure();saveNow();closeM();hud();toast("✅ Partida cargada")});
}

/* ===================== V6: PRODUCTOS, HABITUALES Y FALSIFICACIONES ===================== */
LAY.prod={x:372,y:258,w:170,h:62};
function pickProd(type){const pf=PPREF[type]||{acc:1},w={};Object.keys(S.prod).forEach(pid=>{if(pStock(pid)<1)return;const i=pInfo(pid);if(!i)return;const v=pf[i.t]||0;if(v)w[pid]=v});return Object.keys(w).length?wpick(w):null}
let pTab="packs";
let pF="all";
function packTabs(){return `${S.deliv&&S.deliv.length?`<div class="pn">🚚 En camino: ${delivSummary()}</div>`:""}<div class="row" style="margin-bottom:8px"><span class="mu">Entrega: ${S.express?"⚡ al momento (+8 %)":"🚚 furgoneta gratis (tarda unos segundos)"}</span><button class="b" data-a="exptog">Cambiar</button></div><div class="tabs">${[["packs","🎴 Sobres"],["sealed","🗃️ Sellado"],["acc","🛡️ Accesorios"]].map(([k,n])=>`<button class="b ${pTab===k?"on":""}" data-a="ptab" data-k="${k}">${n}</button>`).join("")}</div><button class="b pri" data-a="recall" style="width:100%;margin:2px 0 8px">🎯 Poner todo a precio recomendado</button><div class="chips">${[["all","Todos"],["stock","Con stock"]].concat(pTab==="packs"?[["shelf","En estanterías"]]:[]).map(([k,n])=>`<button class="b ${pF===k?"on":""}" data-a="pfilt" data-k="${k}">${n}</button>`).join("")}</div>`}
function prodRow(pid){
  const i=pInfo(pid);if(!i)return "";const q=pStock(pid),pr=pPrice(pid),st=pr>=20?1:pr>=5?.5:.25,buys=i.t==="acc"?[6,24]:i.t==="box"?[1,3]:[1,4];
  return `<div class="pn"><div class="row"><b>${i.ic} ${i.n}</b><span class="mu">Stock: <b>${q}</b></span></div><div class="row"><span class="mu">Mayorista ${fmt(i.w)} · clientes ~${fmt(i.ref)}${i.packs?` · ${i.packs} sobres`:""}</span><span class="step"><button class="b" data-a="pp" data-k="${pid}" data-n="-${st}">−</button><b>${fmt(pr)}</b><button class="b" data-a="pp" data-k="${pid}" data-n="${st}">+</button></span></div><div>${accTag(prodAcc(pid))}${Math.abs(pr-recProd(pid))>.04?` <button class="b" style="min-height:30px;padding:4px 10px;font-size:13px" data-a="recq" data-k="${pid}">🎯 ${fmt(recProd(pid))}</button>`:""}</div><div class="btns">${buys.map(n=>`<button class="b" data-a="buyprod" data-k="${pid}" data-n="${n}"${S.money<i.w*n?" disabled":""}>×${n} · ${fmt(i.w*n)}</button>`).join("")}${i.packs?`<button class="b pri" data-a="openprod" data-k="${pid}"${q<1?" disabled":""}>Abrir → ${i.packs} sobres</button>`:""}</div></div>`;
}

/* ----- clientes habituales ----- */
function loy(id,d,note){if(!id)return;const r=regS(id);r.loy=clamp(r.loy+d,0,100);if(note)r.note=note;if(d>0){const c=custs.find(x=>x.reg===id);if(c)heartsAt(c.x,c.y-54,Math.min(4,Math.ceil(d/3)))}}
function pickReg(){
  const here=new Set(custs.map(c=>c.reg).filter(Boolean)),w={};
  REGS.forEach(r=>{if(here.has(r.id))return;const s=regS(r.id);if(s.loy<5)return;if(r.t==="lot"&&(S.day<2||custs.some(c=>c.type==="lot")))return;w[r.id]=.5+s.loy/50});
  return Object.keys(w).length?wpick(w):null;
}
function mRegs(){
  return REGS.map(r=>{const s=regS(r.id);return `<div class="pn" style="display:flex;gap:10px;align-items:center${s.met?"":";opacity:.6"}">${s.met?`<img class="rgimg" src="${regImg(r.id)}" alt="">`:'<div style="font-size:34px">❔</div>'}<div style="flex:1;min-width:0"><div class="row"><b>${s.met?r.n:"Aún no le conoces"}</b><span style="font-size:12px">${s.met?hearts(s.loy):""}</span></div>${s.met?`<div class="mu">${r.d}${(r.t==="kid"||r.t==="whale")&&s.fav?" Favorito: "+setName(s.fav)+".":""} Visitas: ${s.visits}.</div>${s.note?`<div class="mu">📝 ${s.note}</div>`:""}`:""}</div></div>`}).join("")
  +'<p class="mu">Trátales bien (rápido, buen precio, cambio exacto, encargos) y volverán más, aceptarán precios algo más altos, dejarán propina y traerán amigos. Si se enfadan, dejarán de venir.</p>';
}

/* ----- falsificaciones: examinar con lupa, luz y balanza ----- */
let INSP=null;
function mInsp(){
  const I=INSP,c=I.c,t=I.tells,lensFk=I.fake&&t.includes("lens"),lightFk=I.fake&&t.includes("light");
  const tabs=[["lens","🔍 Lupa"],["light","💡 Luz"],["scale","⚖️ Balanza"]].map(([k,n])=>`<button class="b ${I.mode===k?"on":""}" data-a="imode" data-k="${k}">${n}</button>`).join("");
  const info={lens:"Mueve el dedo por la carta. Las auténticas tienen el texto y los bordes nítidos, sin trama de puntos de colores.",light:"Luz por detrás: las auténticas tienen una capa interior negra y casi no deja pasar la luz.",scale:"Una carta auténtica pesa unos 1,75 g."}[I.mode];
  const stage=I.mode==="scale"?`<div class="scale"><div class="scl-card">${face(c,I.rv)}</div><div class="scl-base"><div class="scl-lcd">${I.wt.toFixed(2).replace(".",",")} g</div></div></div>`
    :`<div class="insp${I.mode==="light"?" light":""}${I.mode==="light"&&lightFk?" thru":""}${lensFk?" fk":""}" id="insp"><div class="ic">${faceBig(c,I.rv)}</div>${I.mode==="lens"?`<div class="lens" id="lens"><div class="lin">${faceBig(c,I.rv)}</div>${lensFk?'<div class="ldots"></div>':""}</div>`:""}</div>`;
  return `<h2>Examinar carta</h2><div class="tabs">${tabs}</div><div class="mu" style="margin-bottom:10px">${info}</div>${stage}
  ${(()=>{I.seen=I.seen||{};I.seen[I.mode]=1;const bad={lens:I.fake&&t.includes("lens"),light:I.fake&&t.includes("light"),scale:I.fake&&t.includes("scale")};
    const L={lens:["🔍 Lupa",b=>b?"⚠️ se ve una trama de puntos de colores":"✅ texto y bordes nítidos"],light:["💡 Luz",b=>b?"⚠️ la luz la atraviesa":"✅ casi no pasa la luz"],scale:["⚖️ Balanza",b=>(b?"⚠️ pesa poco: ":"✅ peso correcto: ")+I.wt.toFixed(2).replace(".",",")+" g"]};
    const ks=Object.keys(L).filter(k=>I.seen[k]),nb=ks.filter(k=>bad[k]).length,left=Object.keys(L).filter(k=>!I.seen[k]);
    return `<div class="pn clues"><b>🕵️ Pistas encontradas</b>${ks.map(k=>`<div class="${bad[k]?"down":"up"}">${L[k][0]}: ${L[k][1](bad[k])}</div>`).join("")}${left.length?`<div class="mu">Prueba también: ${left.map(k=>L[k][0]).join(" y ")}</div>`:""}<div style="margin-top:6px;font-family:var(--fd);font-size:16px">${nb>=2?"❌ Muy probablemente es FALSA":nb===1?"🤔 Sospechosa: revisa las otras pruebas":ks.length>=2?"✅ Parece auténtica":"Sigue examinando…"}</div></div>`})()}
  <div class="pn" style="margin-top:12px"><b>${c.name}</b> <span class="mu">${RAR[c.r].n} · ${setName(c.s)}</span><div class="mu">Una falsificación falla en dos de las tres pruebas.</div><div class="btns"><button class="b pri" data-a="iok">✅ Es auténtica</button><button class="b" data-a="ifake">❌ Es falsa</button></div></div>`;
}
function bindInsp(){
  const el=$("#insp"),ln=$("#lens");if(!el||!ln)return;
  const r0=el.getBoundingClientRect(),li=ln.querySelector(".lin");li.style.setProperty("--cw0",r0.width+"px");li.style.setProperty("--ch0",r0.height+"px");
  const mv=(x,y)=>{ln.style.setProperty("--lx",x+"px");ln.style.setProperty("--ly",y+"px");li.style.setProperty("--tx",(65-x*2.6)+"px");li.style.setProperty("--ty",(65-y*2.6)+"px")};
  mv(r0.width*.5,r0.height*.3);
  const h=e=>{const r=el.getBoundingClientRect();mv(clamp(e.clientX-r.left,0,r.width),clamp(e.clientY-r.top,0,r.height))};
  el.addEventListener("pointermove",h);el.addEventListener("pointerdown",h);
}

let albPg=0;
function albCards(sid){return (BYS[sid]||[]).slice().sort((a,b)=>(parseInt(a.num)||9999)-(parseInt(b.num)||9999))}
function albPages(sid){return 1+Math.ceil(albCards(sid).length/9)}
function albPageHTML(sid,pg){
  const sd=SETDEF.find(d=>d.id===sid)||{},l=albCards(sid);
  if(pg===0){const own=l.filter(c=>S.dex[c.id]).length;return `<div class="bcover"><div class="bc-in">${sd.sym?`<img src="${sd.sym}" alt="" onerror="this.remove()">`:'<div class="pball" style="width:74px;margin:0"></div>'}<b>${sd.n||setName(sid)}</b><span>${sd.series||""} ${sd.year||""}</span><div class="bc-pc">${own}/${l.length}</div><span>Desliza o pulsa ▶ para pasar página</span></div></div>`}
  const part=l.slice((pg-1)*9,pg*9);
  return `<div class="bgrid">${part.map(c=>S.dex[c.id]?`<div class="pk own" data-a="zoom" data-k="${c.id}" data-n="0">${face(c,false)}</div>`:`<div class="pk miss"><span>${c.num||"?"}</span></div>`).join("")}${'<div class="pk empty"></div>'.repeat(9-part.length)}</div>`;
}
function mAlbum(){
  if(!albS||!S.sets.includes(albS))albS=S.sets[0];
  const sid=albS,l=albCards(sid),own=l.filter(c=>S.dex[c.id]).length,pc=l.length?own/l.length:0,cl=S.albR[sid]||[],np=albPages(sid);albPg=clamp(albPg,0,np-1);
  const chips=S.sets.map(s=>`<button class="b ${s===sid?"on":""}" data-a="albset" data-k="${s}">${setName(s)} · ${Math.round(albPct(s)*100)} %</button>`).join("");
  const rw=ALBR.map(([t,m],i)=>`<button class="b ${!cl.includes(i)&&pc>=t?"pri":""}" data-a="albclaim" data-n="${i}"${cl.includes(i)||pc<t?" disabled":""}>${t*100} % · ${fmt(m)}${cl.includes(i)?" ✔":""}</button>`).join("");
  return cardTabs("album")+`<div class="chips">${chips}</div><div class="pn"><div class="row"><b>${setName(sid)}</b><span>${own}/${l.length} · ${Math.round(pc*100)} %</span></div><div class="prog"><i style="width:${pc*100}%"></i></div><div class="btns">${rw}</div></div>
  <div class="binder" id="binder" style="--bc:${setCol(sid)}"><div class="rings"></div><div class="bpage" id="bpage">${albPageHTML(sid,albPg)}</div></div>
  <div class="row" style="margin-top:10px"><button class="b" data-a="albprev"${albPg<=0?" disabled":""}>◀ Anterior</button><span class="mu" id="albpn">${albPg===0?"Portada":"Página "+albPg+" de "+(np-1)}</span><button class="b" data-a="albnext"${albPg>=np-1?" disabled":""}>Siguiente ▶</button></div>
  <p class="mu">Cuenta cada carta que hayas tenido alguna vez, aunque la hayas vendido. Toca una carta para verla en grande.</p>`;
}
function albTurn(dir){
  const sid=albS,np=albPages(sid),nx=albPg+dir;if(nx<0||nx>=np)return;
  const b=$("#binder"),bp=$("#bpage");if(!b||!bp||b.dataset.busy)return;b.dataset.busy=1;
  const oldH=bp.innerHTML,newH=albPageHTML(sid,nx);albPg=nx;sfx.page();
  const ov=document.createElement("div");ov.className="bpage bflip "+(dir>0?"fnext":"fprev");
  if(dir>0){ov.innerHTML=oldH;bp.innerHTML=newH}else ov.innerHTML=newH;
  b.appendChild(ov);
  setTimeout(()=>{if(dir<0)bp.innerHTML=newH;ov.remove();delete b.dataset.busy},620);
  const pn=$("#albpn");if(pn)pn.textContent=albPg===0?"Portada":"Página "+albPg+" de "+(np-1);
  document.querySelectorAll("[data-a=albprev]").forEach(e=>e.disabled=albPg<=0);document.querySelectorAll("[data-a=albnext]").forEach(e=>e.disabled=albPg>=np-1);
}
function bindAlbum(){
  const b=$("#binder");if(!b)return;let x0=null;
  b.addEventListener("pointerdown",e=>{x0=e.clientX});
  b.addEventListener("pointerup",e=>{if(x0==null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>45){b._sw=1;albTurn(dx<0?1:-1)}});
  b.addEventListener("click",e=>{if(b._sw){e.stopPropagation();e.preventDefault();b._sw=0}},true);
}
function ticketHTML(s){
  const T=TIERS[tierOf(level())],res=s.inc+(s.tourInc||0)-s.rent-(s.sal||0)-(s.refund||0);
  const L=(a,b,c)=>`<div class="tl${c?" "+c:""}"><span>${a}</span><i></i><span>${b}</span></div>`;
  const hist=(S.hist||[]).slice(-7),mx=Math.max(1,...hist.map(h=>h.inc));
  const bars=hist.map((h,i)=>{const bh=Math.max(2,h.inc/mx*44);return `<rect x="${i*28+4}" y="${50-bh}" width="18" height="${bh}" rx="2" fill="${i===hist.length-1?"#e3350d":"#9aa0a8"}"/><text x="${i*28+13}" y="62" font-size="8" text-anchor="middle" fill="#666">D${h.d}</text>`}).join("");
  return `<div class="ticket"><div class="tc"><b>${shopName().toUpperCase()}</b><br>${T.sub}<br>TICKET DE CIERRE · DÍA ${s.day}</div><div class="tdash"></div>
  ${L("Clientes",s.cust)}${L("Se fueron sin comprar",s.lost)}<div class="tdash"></div>
  ${L("Ventas",fmt(s.inc),"pos")}${s.tourInc!=null?L("Torneo",(s.tourInc>=0?"+":"")+fmt(s.tourInc),s.tourInc>=0?"pos":"neg"):""}${L("Alquiler","−"+fmt(s.rent),"neg")}${s.sal?L("Sueldos","−"+fmt(s.sal),"neg"):""}${s.refund?L("Devoluciones","−"+fmt(s.refund),"neg"):""}
  <div class="tdash"></div>${L("<b>RESULTADO DEL DÍA</b>",`<b>${res>=0?"+":""}${fmt(res)}</b>`,res>=0?"pos":"neg")}${L("Valor de la empresa",fmt(s.net))}
  ${hist.length>1?`<div class="tchart">Ventas de los últimos días<svg viewBox="0 0 ${hist.length*28+4} 66" width="100%" height="72">${bars}</svg></div>`:""}
  <div class="tdash"></div><div class="tc">¡GRACIAS POR SU VISITA!<br>${new Date().toLocaleDateString("es-ES")}</div></div>`;
}
function mSum(){
  const s=S.summary;
  return `<h2>Fin del día ${s.day}</h2>${ticketHTML(s)}${s.mkInc?`<div class="pn">🧺 Mercadillo: vendiste ${s.mkN} carta(s) por ${fmt(s.mkInc)}.</div>`:""}${s.loanPay?`<div class="pn">🏦 Cuota del préstamo: −${fmt(s.loanPay)} (quedan ${fmt(S.loan.left)}).</div>`:""}${s.rivNew?`<div class="pn down">🏪 ¡Ha abierto una tienda rival enfrente: Cartas El Rayo! Toca su local en la calle para ver sus precios.</div>`:""}${s.rivMsg?`<div class="pn up">${s.rivMsg}</div>`:""}${marketDay()?`<div class="pn">🧺 ¡Hoy hay mercadillo en la plaza! Aleja la cámara y toca la plaza para montar tu puesto.</div>`:""}<div class="pn"><b>💡 Consejos de Carla</b>${tipsHTML(S.lastTips||[])}</div>
  ${s.news?`<div class="pn">${s.news}</div>`:""}
  ${s.grN?`<div class="pn"><div>📬 Han llegado ${s.grN} carta(s) del gradeo.</div><div class="btns"><button class="b pri" data-a="grades">Ver resultados</button></div></div>`:""}
  ${s.fkN?`<div class="pn">🚫 El servicio de gradeo ha detectado ${s.fkN} falsificación(es). Esas cartas ya no valen nada.</div>`:""}${s.refN?`<div class="pn down">😡 ${s.refN} cliente(s) descubrieron que les vendiste una carta falsa: devuelves ${fmt(s.refund)} y pierdes reputación.</div>`:""}
  ${s.newOrd?`<div class="pn">📋 Hay un encargo nuevo en Tareas.</div>`:""}${s.exp?`<div class="pn mu">⌛ ${s.exp} encargo(s) han caducado.</div>`:""}
  <div class="pn"><b>Día ${S.day}</b><div>${evLabel()||"Un día normal."}</div>${S.decor.table?`<div class="btns"><button class="b ${S.tour?"on":""}" data-a="tourtog">🏆 ${S.tour?"Torneo organizado ✔":"Organizar torneo (40 € en premios)"}</button></div>`:'<div class="mu">Con la mesa de juego (Más → Mejoras) podrás organizar torneos.</div>'}</div>
  <p class="mu">Misiones nuevas en Tareas. Repón stock y ajusta la vitrina antes de abrir.</p>`;
}
Object.assign(sfx,{
  page:()=>nz(.28,900,3200,.14,"bandpass",.7),
  shutter:()=>{for(let i=0;i<9;i++)setTimeout(()=>nz(.07,700+rnd(300),500,.12,"bandpass",3),i*110)},
  print:()=>{for(let i=0;i<10;i++)setTimeout(()=>nz(.08,2600,2300,.05,"bandpass",6),i*120)}
});

/* ===================== V8: CÁMARA, VIDA Y MOMENTOS ===================== */
const ICON={
  packs:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  coll:'<rect x="3" y="5" width="11" height="15" rx="2"/><path d="M10 4.5l7.5-1.3a2 2 0 012.3 1.6l2 11.6a2 2 0 01-1.6 2.3L14 19.8"/>',
  album:'<path d="M5 3h12a2 2 0 012 2v16H7a2 2 0 01-2-2z"/><path d="M5 17a2 2 0 012-2h12M9 7h6"/>',
  tasks:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 12l2 2 4-4M9 17h6"/>',
  more:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play:'<path d="M7 4l13 8-13 8z"/>',
  speed:'<path d="M3 5l9 7-9 7zM12 5l9 7-9 7z"/>'
};
const svgI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
/* ----- cámara y temblor ----- */
VIEW.mode="auto";
function camFollow(dt){
  const V=VIEW;if(V.mode!=="auto"||performance.now()-V.user<4000)return;
  const f=front(),want=clamp(V.cover*(f?1.08:1),V.min,V.max);
  const cw=(V.cw/2-V.ox)/V.s,ch=(V.ch/2-V.oy)/V.s,tx=f?640:(queue.length?560:W/2),ty=f?300:H*.46,k=Math.min(1,dt*.7);
  const ns=V.s+(want-V.s)*k,nx=cw+(tx-cw)*k,ny=ch+(ty-ch)*k;V.s=ns;V.ox=V.cw/2-nx*ns;V.oy=V.ch/2-ny*ns;clampView();
}
const shake=v=>{if(hasState()&&S.ui&&S.ui.calm)return;VIS.shake=Math.max(VIS.shake||0,Math.min(4,v*.4))};
/* ----- gato de la tienda ----- */
const CAT={x:120,y:470,tx:120,ty:470,st:"sleep",t:6,ph:0,dir:1,z:0};
function catSpots(){const l=[[262,500],[80,470],[240,340],[470,480],[700,470],[160,240]];if(S.decor.sofa)l.push([560,522],[560,522]);return l}
function updCat(dt){
  CAT.t-=dt;CAT.z+=dt;
  if(CAT.st==="walk"){const wp=CAT.path&&CAT.path.length?CAT.path[0]:{x:CAT.tx,y:CAT.ty},dx=wp.x-CAT.x,dy=wp.y-CAT.y,d=Math.hypot(dx,dy);
    if(d<2){if(CAT.path&&CAT.path.length)CAT.path.shift();else{CAT.st=Math.random()<.6?"sleep":"sit";CAT.t=CAT.st==="sleep"?10+Math.random()*10:3+Math.random()*4}}
    else{const k=Math.min(d,34*dt);CAT.x+=dx/d*k;CAT.y+=dy/d*k;CAT.dir=dx>=0?1:-1;CAT.ph+=dt*12}}
  else if(CAT.t<=0){const q=pick(catSpots());CAT.tx=q[0];CAT.ty=q[1];CAT.path=navPath(CAT.x,CAT.y,q[0],q[1]);CAT.st="walk"}
}
function drawCat(){
  const x=CAT.x,y=CAT.y,d=CAT.dir,t=performance.now()/1000;
  cx.save();cx.translate(x,y);cx.scale(d,1);
  cx.fillStyle="rgba(0,0,0,.22)";cx.beginPath();cx.ellipse(0,0,13,4,0,0,7);cx.fill();
  if(CAT.st==="sleep"){
    cx.fillStyle="#e8913a";cx.beginPath();cx.ellipse(0,-6,12,7,0,0,7);cx.fill();cx.fillStyle="#c96f22";[-5,0,5].forEach(s=>{cx.fillRect(s-1,-12,2,6)});
    cx.fillStyle="#e8913a";cx.beginPath();cx.arc(8,-7,5.5,0,7);cx.fill();cx.beginPath();cx.moveTo(6,-11);cx.lineTo(8,-15);cx.lineTo(10,-11);cx.moveTo(10,-11);cx.lineTo(12.5,-14);cx.lineTo(13,-9);cx.fill();
    cx.strokeStyle="#5a2a0a";cx.lineWidth=1;cx.beginPath();cx.moveTo(8,-7);cx.lineTo(10,-7);cx.stroke();
    cx.strokeStyle="#e8913a";cx.lineWidth=3;cx.lineCap="round";cx.beginPath();cx.moveTo(-11,-4);cx.quadraticCurveTo(-14,4,0,2);cx.stroke();cx.lineCap="butt";
    cx.restore();const zz=(CAT.z%2)/2;cx.globalAlpha=1-zz;txt("z",x+10,y-18-zz*14,10+zz*4,"#fff","center");cx.globalAlpha=1;return;
  }
  const w=CAT.st==="walk"?Math.sin(CAT.ph)*2.5:0;
  cx.fillStyle="#d97e2b";[[-7,w],[-3,-w],[5,-w],[9,w]].forEach(([lx,o])=>cx.fillRect(lx,-7+o*.3,2.5,7));
  cx.fillStyle="#e8913a";cx.beginPath();cx.ellipse(1,-10,11,6,0,0,7);cx.fill();cx.fillStyle="#c96f22";[-4,1,6].forEach(s=>cx.fillRect(s,-15.5,2,5));
  cx.strokeStyle="#e8913a";cx.lineWidth=3;cx.lineCap="round";cx.beginPath();cx.moveTo(-9,-11);cx.quadraticCurveTo(-16,-18+Math.sin(t*3)*3,-12,-24);cx.stroke();cx.lineCap="butt";
  const hy=CAT.st==="sit"?-20:-15;cx.fillStyle="#e8913a";cx.beginPath();cx.arc(12,hy,6,0,7);cx.fill();
  cx.beginPath();cx.moveTo(8,hy-3);cx.lineTo(9,hy-9);cx.lineTo(12,hy-5);cx.moveTo(12,hy-5);cx.lineTo(15.5,hy-9);cx.lineTo(16,hy-3);cx.fill();
  cx.fillStyle="#1a1a1a";cx.beginPath();cx.arc(10.5,hy-.5,1,0,7);cx.arc(14.5,hy-.5,1,0,7);cx.fill();cx.fillStyle="#ff9eb0";cx.fillRect(12,hy+1.5,1.6,1.2);
  cx.restore();
}
function meow(){tone(760,0,.12,"triangle",.07);tone(620,.1,.3,"triangle",.06);heartsAt(CAT.x,CAT.y-26,2);CAT.st="sit";CAT.t=3}
/* ----- cola de lanzamiento ----- */
function launchQ(){
  if(!(S.phase==="closed"&&S.ev&&S.ev.t==="launch"))return null;
  if(!VIS.lq||VIS.lq.day!==S.day)VIS.lq={day:S.day,p:Array.from({length:8},(_,i)=>({x:420+i*34,y:590+(i%2)*10,out:mkOutfit(pick(["kid","collector","whale","kid"]),null),skin:pick(["#f2c9a0","#e0a878","#a9714b","#7a4a2b"]),sign:i%3===0,seed:Math.random()*6}))};
  return VIS.lq.p;
}
function drawLQ(p){
  const t=performance.now()/1000,o=p.out;o.skin=p.skin;o.mv=false;o.ph=0;o.mood=Math.sin(t+p.seed)>.6?"impatient":"happy";o.arm=p.sign?"up":null;o.bag=false;
  const hop=Math.max(0,Math.sin(t*3+p.seed))*2;drawPerson(p.x,p.y-hop,o);
  if(p.sign){const sd=SETS.find(z=>z.id===S.ev.s);cx.fillStyle="#fff";rr(p.x+2,p.y-hop-66,34,16,2);cx.fill();cx.strokeStyle="#333";cx.lineWidth=1;cx.stroke();txt("¡"+(sd?sd.n.slice(0,6):"YA")+"!",p.x+19,p.y-hop-54,8,"#c0392b","center")}
}
/* ----- peanas de lujo ----- */
const LUX=[[452,452],[512,452],[572,452]];
function drawLux(i){
  const [x,y]=LUX[i],it=luxItems()[i],n=nightK();
  box3d(x-17,y-20,34,20,34,"#23283a","#141824");cx.fillStyle="#c9a227";cx.fillRect(x-17,y-34,34,1.5);cx.fillRect(x-17,y-1,34,1.5);
  cx.save();cx.globalCompositeOperation="lighter";const g=cx.createLinearGradient(0,y-150,0,y-50);g.addColorStop(0,`rgba(255,244,200,0)`);g.addColorStop(1,`rgba(255,244,200,${.14+.18*n})`);cx.fillStyle=g;cx.beginPath();cx.moveTo(x-4,y-150);cx.lineTo(x+4,y-150);cx.lineTo(x+22,y-50);cx.lineTo(x-22,y-50);cx.fill();cx.restore();
  if(!it){txt("Libre",x,y-40,8,"#9aa3b5","center");return}
  const cd=BYID[it.c],im=timg(cd.img),cy=y-86;
  if(it.gr){cx.fillStyle="rgba(255,255,255,.3)";rr(x-13,cy-8,26,44,3);cx.fill();cx.fillStyle="#fff";cx.fillRect(x-11,cy-6,22,7);cx.fillStyle="#c0392b";cx.fillRect(x-11,cy-6,22,1.5);txt(""+it.gr,x+7,cy,6,"#c0392b","center")}
  if(im)cx.drawImage(im,x-10,cy+2,20,28);else{cx.fillStyle=RAR[cd.r].c;cx.fillRect(x-10,cy+2,20,28)}
  cx.fillStyle="#2b2f38";cx.fillRect(x-5,cy+30,10,4);
  const tw=Math.sin(performance.now()/300+i*2);if(tw>.6)star(x+9,cy+4,3,"#fff");
  const pv=itemVal(it)*it.case;cx.fillStyle="#c9a227";rr(x-15,y-18,30,9,2);cx.fill();txt(pv>=100?Math.round(pv)+"€":pv.toFixed(1).replace(".",",")+"€",x,y-11.5,7,"#1a1406","center");
}
/* ----- vida en la tienda: brillo, polvo y reflejos ----- */
function ambient(){
  if(LITE())return;
  const t=dayT(),now=performance.now()/1000;
  if(S.phase==="closed"||t<.35){const k=S.phase==="closed"?.7:1-t/.35;
    cx.save();cx.globalCompositeOperation="lighter";
    [[120,560],[250,560],[520,560],[660,560]].forEach(([x,y],i)=>{const g=cx.createLinearGradient(x,y,x-90,y-260);g.addColorStop(0,`rgba(255,240,200,${.1*k})`);g.addColorStop(1,"rgba(255,240,200,0)");cx.fillStyle=g;cx.beginPath();cx.moveTo(x-30,y);cx.lineTo(x+30,y);cx.lineTo(x-60,y-260);cx.lineTo(x-140,y-260);cx.fill()});
    for(let i=0;i<36;i++){const bx=[120,250,520,660][i%4],ph=i*1.7,yy=560-((now*9+i*23)%240),xx=bx-(560-yy)*.35+Math.sin(now*.7+ph)*10;cx.fillStyle=`rgba(255,250,220,${.5*k*(.4+.6*Math.sin(now*2+ph)**2)})`;cx.beginPath();cx.arc(xx,yy,1.1,0,7);cx.fill()}
    cx.restore();}
}
function reflect(c){
  if(tierOf(level())<2||c.y>FRONT_Y-4)return;const o=c.out;if(!o)return;
  cx.save();cx.globalAlpha=.1;cx.translate(0,2*c.y);cx.scale(1,-1);drawPerson(c.x,c.y,o);cx.restore();
}
/* ----- retrato y ficha de cliente ----- */
function portrait(o){
  const c=document.createElement("canvas");c.width=160;c.height=200;const g=c.getContext("2d"),prev=cx;cx=g;
  try{g.scale(3.4,3.4);drawPerson(23.5,56,Object.assign({},o,{mv:false,mood:"happy",arm:null,bag:false}))}finally{cx=prev}
  return c.toDataURL();
}
const TDESC={kid:"Niño/a: sobres y accesorios baratos.",collector:"Coleccionista: busca cartas sueltas.",investor:"Inversor: cartas caras y cajas.",whale:"Gasta mucho: sobres en cantidad y productos premium.",seller:"Viene a venderte cartas.",lot:"Viene a venderte una colección."};
let CUSTC=null;
function wantTxt(c){const w=c.want||{};if(w.k==="pack")return "Quiere sobres de "+setName(w.s);if(w.k==="prod"){const i=pInfo(w.pid);return "Busca: "+(i?i.n:"un producto")}if(w.k==="sell")return "Quiere venderte una carta";if(w.k==="lot")return "Quiere venderte una colección";if(w.k==="trade")return "Quiere cambiarte una carta";return "Mira la vitrina"}
function mCust(){
  const c=CUSTC,R=c.reg?RG(c.reg):null,rs=R?regS(c.reg):null,img=portrait(c.out||mkOutfit(c.type,R));
  const st=c.st==="wait"?`Esperando en la cola · paciencia ${Math.round(Math.max(0,1-c.wt/c.pat)*100)} %`:c.st==="browse"?"Mirando productos":c.st==="leave"?(c.bought?"Se va contento 🛍️":"Se va"):"Entrando";
  return `<div class="ccard"><img src="${img}" alt=""><div style="min-width:0"><h3>${R?R.n:"Cliente"}</h3>${R?`<div>${hearts(rs.loy)}</div><div class="mu">${R.d} Visitas: ${rs.visits}.</div>`:`<div class="mu">${TDESC[c.type]||""}</div>`}</div></div>
  <div class="ccw"><div><b>${wantTxt(c)}</b></div><div class="mu">${st}</div>${rs&&(R.t==="kid"||R.t==="whale")&&rs.fav?`<div class="mu">Set favorito: ${setName(rs.fav)}</div>`:""}${rs&&rs.note?`<div class="mu">📝 ${rs.note}</div>`:""}</div>
  ${front()===c?'<div class="btns"><button class="b pri big" data-a="custserve">Atender ahora</button></div>':""}`;
}
function regImg(id){const r=RG(id),rs=regS(id);if(!rs.out){const o=mkOutfit(r.t,r);delete o.hat;rs.out=o}VIS.pt=VIS.pt||{};return VIS.pt[id]||(VIS.pt[id]=portrait(Object.assign({},rs.out,{skin:r.skin})))}
/* ----- apertura de cajas ----- */
let BOXO=null;
function mountBox(){
  const B=BOXO,i=B.i,sd=SETS.find(z=>z.id===i.s)||{};
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:${i.col}"><div class="pxbar"><div><b>${i.ic} ${i.n}</b><div class="pxrun">${i.packs} sobres dentro</div></div><div class="step"><button class="ib" id="bxclose">Cerrar</button></div></div>
  <div class="pxstage" id="bxst"><div class="rays" id="pxrays" style="--rc:${i.col}"></div><div class="bxw" id="bxw"><div class="bx-lid"></div><div class="bx-body">${sd.sym?`<img src="${sd.sym}" alt="" onerror="this.remove()">`:'<div class="pball" style="width:56px;margin:0"></div>'}<b>${setName(i.s)}</b><span>${PTYPES[i.t].n}</span></div><div class="tape"><i></i></div></div></div>
  <div class="pxhint" id="bxhint"><div style="font-size:16px;color:#fff;font-weight:700">Desliza por la cinta para cortarla</div><div class="mu">o toca la caja</div></div><div class="flash" id="pxflash"></div></div>`;
  const w=$("#bxw"),st=$("#bxst");let x0=null;
  $("#bxclose").onclick=()=>{BOXO=null;closeM()};
  const cut=()=>{if(B.done)return;B.done=true;sfx.rip();vibe(25);w.classList.add("cut");
    setTimeout(()=>{w.classList.add("open");sfx.swish()},250);
    setTimeout(()=>{if(!$("#px"))return;$("#pxrays").classList.add("on");const n=i.packs,rows=n>12?3:n>6?2:1,per=Math.ceil(n/rows);let h="";
      for(let k=0;k<n;k++){const r=Math.floor(k/per),j=k%per,cnt=Math.min(per,n-r*per),a=(-65+130*(cnt>1?j/(cnt-1):.5))*Math.PI/180,R=95+r*38;
        h+=`<div class="fp" style="--tx:${(Math.sin(a)*R).toFixed(1)}px;--ty:${(-Math.cos(a)*R+30).toFixed(1)}px;--r:${(a*57.3).toFixed(0)}deg;animation-delay:${k*28}ms">${sd.sym?`<img src="${sd.sym}" alt="">`:""}</div>`}
      w.insertAdjacentHTML("beforeend",h);for(let k=0;k<Math.min(n,14);k++)setTimeout(()=>sfx.tick(),k*60);confetti(n>=20?2:1,i.col);
      $("#bxhint").innerHTML=`<div class="cinfo"><div class="cv">+${n} sobres</div><div class="mu">de ${setName(i.s)} añadidos a tu stock</div><div class="btns" style="justify-content:center"><button class="b pri" id="bxok">¡Genial!</button></div></div>`;
      $("#bxok").onclick=()=>{BOXO=null;closeM()}},900);
  };
  const tape=w.querySelector(".tape i");
  st.addEventListener("pointerdown",e=>{ac();x0=e.clientX});
  st.addEventListener("pointermove",e=>{if(x0==null||B.done)return;const p=clamp(Math.abs(e.clientX-x0)/(w.getBoundingClientRect().width*.7),0,1);tape.style.setProperty("--cut",(p*100)+"%");if(p>=1)cut()});
  st.addEventListener("pointerup",()=>{if(x0!=null&&!B.done&&!(+getComputedStyle(tape).getPropertyValue("--cut").replace("%","")>5))cut();x0=null});
}
/* ----- nueva categoría ----- */
function mountTier(){
  const t=VIS.showTier,T=TIERS[t];
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:#c9a227"><div class="pxstage"><div class="rays on" style="--rc:#ffd54a"></div><div class="tier"><div class="ttl">¡NUEVA CATEGORÍA!</div><div class="tsign ts${t}">${T.n.toUpperCase()}</div><div style="font-family:var(--fd);font-size:20px;color:#fff">${T.sub}</div>
  <div class="tlist">🏗️ Suelo, paredes y cartel nuevos<br>🎨 La interfaz cambia de estilo<br>⭐ Más prestigio para atraer clientes</div><button class="b pri" id="tierok" style="font-size:18px;padding:12px 26px">¡Vamos!</button></div></div></div>`;
  confetti(3,"#ffd54a");sfx.hit(3);vibe([60,40,140]);shake(8);
  $("#tierok").onclick=()=>{VIS.showTier=null;closeM()};
}

function luxBtns(sel){if(!S.decor.lux)return "";const it=sel.its[0];if(it.gq||it.fkK)return "";const inl=sel.its.filter(i=>i.lux).length,used=luxItems().length;return `<div class="btns"><button class="b" data-a="luxadd"${used>=3||inl>=sel.its.length?" disabled":""}>💎 A peana (${used}/3)</button>${inl?'<button class="b" data-a="luxrem">Quitar de peana</button>':""}</div>`}
/* ===================== V9: TUTORIAL Y MÁS CARTAS ===================== */
const TUT=[
  {t:"¡Hola! Soy Carla, tu socia 👋 Vamos a montar la tienda de cartas más top de la isla. Te enseño lo básico en un par de minutos.",next:true},
  {t:"Primero necesitas producto. Toca «Stock».",sel:()=>G.M&&G.M!=="packs"?"[data-a=close]":"#nav [data-k=packs]",done:()=>G.M==="packs"},
  {t:"Compra 6 sobres de este set. Los clientes los cogen de las estanterías.",sel:()=>G.M==="packs"?'[data-a=buyp][data-n="6"]':'#nav [data-k=packs]',done:()=>sealedCount()>0},
  {t:"Este es el precio de venta de cada sobre. Si lo pones muy alto, los clientes se van sin comprar. Se ajusta con − y +.",sel:()=>G.M==="packs"?".pn .step":null,next:true},
  {t:"¡Ahora lo divertido! Abre un sobre.",sel:()=>G.M==="packs"?'[data-a=open][data-n="1"]':'#nav [data-k=packs]',done:()=>G.M==="open"},
  {t:"Desliza el dedo por el sobre para abrirlo y pasa las cartas. Las buenas brillan 😉",float:true,done:()=>G.M!=="open"||(openState&&openState.mode==="sum")},
  {t:"Vamos a poner una carta a la venta. Cierra y toca «Cartas».",sel:()=>G.M&&G.M!=="coll"?"[data-a=close]":"#nav [data-k=coll]",done:()=>G.M==="coll"},
  {t:"Toca una carta y luego «A la vitrina». Lo que está en la vitrina lo pueden comprar los clientes.",sel:()=>G.M==="card"?"[data-a=caseadd]":G.M!=="coll"?"#nav [data-k=coll]":".tiles .tile",done:()=>caseItems().length>0},
  {t:"¡Todo listo! Cierra el panel y abre la tienda.",sel:()=>G.M?"[data-a=close]":"#act",done:()=>S.phase!=="closed"},
  {t:"Los clientes entran, cogen lo que quieren y hacen cola en la caja. Cuando haya alguien esperando, pulsa «Cobrar».",sel:()=>front()&&!G.M?"#act":null,float:true,done:()=>G.M==="ck"||G.M==="hag"||(S.lt.served||0)>=1},
  {t:"Si paga en efectivo, dale el cambio exacto tocando billetes y monedas del cajón. Si paga con tarjeta, teclea el total en el TPV y pulsa OK.",float:true,done:()=>(S.lt.served||0)>=1},
  {t:"¡Primera venta! 🎉 Últimos consejos: en «Tareas» tienes encargos, misiones y logros; en «Álbum», tu colección; y en «Más» → Colecciones puedes añadir cualquier set de Pokémon. Ojo con las cartas falsas: examínalas antes de comprar. ¡Te regalo 100 € para empezar!",next:true,last:true}
];
let TUTV={i:-1,el:null};
function guideImg(){return VIS.guide||(VIS.guide=portrait({shirt:"#e3350d",pants:"#2c3350",shoes:"#141414",hair:"#6b3a1e",hs:2,skin:"#f2c9a0",logo:true,sc:1,seed:1}))}
function tutEnd(done){if(!S.tut)return;S.tut.on=false;const r=$("#tut");if(r)r.remove();TUTV.i=-1;if(done){S.money+=100;toast("🎓 Tutorial completado · +100 €");sfx.ach()}saveNow();hud()}
function tutStep(){
  const T=S.tut,st=TUT[T.i];let r=$("#tut");
  if(!r){r=document.createElement("div");r.id="tut";document.body.appendChild(r)}
  r.innerHTML=`<div class="tdim" id="tdim"></div><div class="tspot" id="tspot" style="display:none"></div><div class="tbub" id="tbub"><img src="${guideImg()}" alt=""><div style="flex:1;min-width:0"><b>Carla</b><p>${st.t}</p><div class="tbtn"><span class="n">${T.i+1}/${TUT.length}</span>${st.last?"":'<button id="tskip">Saltar tutorial</button>'}${st.next?`<button class="go" id="tnext">${st.last?"¡A jugar!":"Siguiente"}</button>`:""}</div></div></div>`;
  const nx=$("#tnext");if(nx)nx.onclick=()=>{if(st.last)tutEnd(true);else{T.i++;TUTV.i=-1}};
  const sk=$("#tskip");if(sk)sk.onclick=()=>{if(confirm("¿Saltar el tutorial? Puedes repetirlo en Más."))tutEnd(false)};
  TUTV.i=T.i;TUTV.scrolled=false;
}
function tutTick(){
  const T=hasState()&&S.tut;if(!T||!T.on){const r=$("#tut");if(r){r.remove();TUTV.i=-1}return}
  if(T.i>=TUT.length){tutEnd(true);return}
  const st=TUT[T.i];
  if(st.done&&st.done()){T.i++;TUTV.i=-1;saveNow();return}
  if(TUTV.i!==T.i)tutStep();
  const sel=st.sel?st.sel():null,el=sel?document.querySelector(sel):null,sp=$("#tspot"),dim=$("#tdim"),bub=$("#tbub");if(!bub)return;
  const H0=innerHeight,bh=bub.offsetHeight;
  if(el&&el.offsetParent!==null){
    if(!TUTV.scrolled||TUTV.el!==el){TUTV.scrolled=true;TUTV.el=el;const rr0=el.getBoundingClientRect();if(rr0.top<60||rr0.bottom>H0-90)el.scrollIntoView({block:"center",behavior:"smooth"})}
    const q=el.getBoundingClientRect(),pd=6;sp.style.display="block";dim.style.display="none";
    sp.style.left=(q.left-pd)+"px";sp.style.top=(q.top-pd)+"px";sp.style.width=(q.width+pd*2)+"px";sp.style.height=(q.height+pd*2)+"px";
    let top=q.top+q.height/2>H0/2?q.top-bh-18:q.bottom+18;top=clamp(top,8,H0-bh-8);bub.style.top=top+"px";bub.style.bottom="auto";
  }else{
    sp.style.display="none";dim.style.display=st.float?"none":"block";
    if(st.float){bub.style.top=(G.M==="open"?62:8)+"px";bub.style.bottom="auto"}else{bub.style.top=Math.max(8,(H0-bh)/2)+"px";bub.style.bottom="auto"}
  }
}
/* ----- más cartas: rarezas sin mapear y series completas ----- */

/* ===================== V11: NAVEGACIÓN, SOL, BRILLO Y VIDA ===================== */
const NG={cs:10,x0:-280,y0:44,cols:108,rows:54,g:null,sig:""};
function navSig(){return [trophyOn()?1:0,S.annex?1:0,slotCount(),caseCap(),S.decor.table,S.decor.sofa,S.decor.coffee,S.decor.lux,S.decor.plants,season(),!!(S.prodSeen||Object.keys(S.prod||{}).some(k=>S.prod[k]>0))].join("|")}
function navObstacles(){
  const o=[],P=(x0,y0,x1,y1,pad)=>o.push([x0,y0,x1,y1,pad==null?9:pad]);
  P(-600,0,AX()+8,620,0);P(792,0,840,620,0);P(-600,-40,840,54,0);P(-600,544,322,584,0);if(S.annex){[[-215,365],[-150,405],[-85,362]].forEach(([x,y])=>P(x-16,y-12,x+16,y+10,4));P(-14,44,14,64,2);P(-14,510,14,560,2)}P(394,544,840,584,0);
  for(let i=0;i<slotCount();i++){const s=LAY.shelf(i);P(s.x-4,s.y+s.h-26,s.x+s.w+4,s.y+s.h)}
  if(S.prodSeen||Object.keys(S.prod||{}).some(k=>S.prod[k]>0)){const b=LAY.prod;P(b.x-4,b.y+b.h-26,b.x+b.w+4,b.y+b.h)}
  {const c=LAY.cs();P(c.x-6,c.y,c.x+c.w+6,c.y+c.h)}
  {const c=LAY.counter;P(c.x-4,c.y-4,c.x+c.w+4,c.y+c.h)}
  P(712,120,800,480,0);P(642,98,772,128);
  [[20,490],[782,500],[610,118]].concat(S.decor.plants?[[562,248],[20,300],[610,450]]:[]).forEach(([x,y])=>P(x-10,y+2,x+10,y+18,6));
  if(S.decor.table){P(140,276,336,330);[[175,256],[300,256],[175,346],[300,346]].forEach(([x,y])=>P(x-8,y,x+8,y+10,4))}
  if(S.decor.sofa)P(510,488,610,518);
  if(trophyOn())P(TROPHY.x,TROPHY.y-6,TROPHY.x+TROPHY.w,TROPHY.y+TROPHY.d);
  if(S.decor.coffee)P(560,306,598,330);
  if(S.decor.lux)LUX.forEach(([x,y])=>P(x-17,y-20,x+17,y));
  const se=season();if(se==="xmas")P(452,512,488,532,6);if(se==="hallo")[[300,548],[412,548]].forEach(([x,y])=>P(x-12,y-10,x+12,y+2,4));
  return o;
}
function navBuild(){
  const g=new Uint8Array(NG.cols*NG.rows);
  navObstacles().forEach(([x0,y0,x1,y1,p])=>{const c0=Math.max(0,Math.floor((x0-p-NG.x0)/NG.cs)),c1=Math.min(NG.cols-1,Math.floor((x1+p-NG.x0)/NG.cs)),r0=Math.max(0,Math.floor((y0-p-NG.y0)/NG.cs)),r1=Math.min(NG.rows-1,Math.floor((y1+p-NG.y0)/NG.cs));for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)g[r*NG.cols+c]=1});
  NG.g=g;NG.sig=navSig();
}
const navOk=(c,r)=>c>=0&&r>=0&&c<NG.cols&&r<NG.rows&&!NG.g[r*NG.cols+c];
const navCell=(x,y)=>[Math.floor((x-NG.x0)/NG.cs),Math.floor((y-NG.y0)/NG.cs)];
function navFree(c,r){if(navOk(c,r))return [c,r];for(let d=1;d<10;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;if(navOk(c+dx,r+dy))return [c+dx,r+dy]}return [c,r]}
function navLOS(x0,y0,x1,y1){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/4);for(let i=1;i<=n;i++){const [c,r]=navCell(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);if(!navOk(c,r))return false}return true}
function navPath(sx,sy,gx,gy){
  if(!NG.g||navSig()!==NG.sig)navBuild();
  if(navLOS(sx,sy,gx,gy))return [];
  const [sc,sr]=navFree(...navCell(sx,sy)),[gc,gr]=navFree(...navCell(gx,gy)),C=NG.cols,N=C*NG.rows;
  const gs=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),cl=new Uint8Array(N),hp=[];
  const h=(c,r)=>{const dx=Math.abs(c-gc),dy=Math.abs(r-gr);return dx+dy-.586*Math.min(dx,dy)};
  const push=(f,i)=>{hp.push([f,i]);let k=hp.length-1;while(k){const p=(k-1)>>1;if(hp[p][0]<=hp[k][0])break;[hp[p],hp[k]]=[hp[k],hp[p]];k=p}};
  const pop=()=>{const t=hp[0],l=hp.pop();if(hp.length){hp[0]=l;let k=0;for(;;){const a=2*k+1,b=a+1;let m=k;if(a<hp.length&&hp[a][0]<hp[m][0])m=a;if(b<hp.length&&hp[b][0]<hp[m][0])m=b;if(m===k)break;[hp[m],hp[k]]=[hp[k],hp[m]];k=m}}return t};
  const si=sr*C+sc,gi=gr*C+gc;gs[si]=0;push(h(sc,sr),si);
  const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(hp.length){const [,i]=pop();if(cl[i])continue;cl[i]=1;if(i===gi)break;const c=i%C,r=(i-c)/C;
    for(const [dx,dy,w] of D){const nc=c+dx,nr=r+dy;if(!navOk(nc,nr))continue;if(dx&&dy&&(!navOk(c+dx,r)||!navOk(c,r+dy)))continue;const ni=nr*C+nc,ng=gs[i]+w;if(ng<gs[ni]){gs[ni]=ng;par[ni]=i;push(ng+h(nc,nr),ni)}}}
  if(gi!==si&&par[gi]<0)return [];
  const cells=[];for(let i=gi;i!==si&&i>=0;i=par[i])cells.push(i);cells.reverse();
  const pts=cells.map(i=>({x:NG.x0+(i%C+.5)*NG.cs,y:NG.y0+(Math.floor(i/C)+.5)*NG.cs}));
  const out=[];let cur={x:sx,y:sy},k=0;
  while(k<pts.length){let j=pts.length-1;while(j>k&&!navLOS(cur.x,cur.y,pts[j].x,pts[j].y))j--;out.push(pts[j]);cur=pts[j];k=j+1}
  while(out.length&&Math.hypot(out[out.length-1].x-gx,out[out.length-1].y-gy)<16&&navLOS(out.length>1?out[out.length-2].x:sx,out.length>1?out[out.length-2].y:sy,gx,gy))out.pop();
  return out;
}
function routeTo(c,gx,gy){
  const inS=(x,y)=>x>AX()+4&&x<W-4&&y<FRONT_Y-6,si=inS(c.x,c.y),gi=inS(gx,gy),pts=[];
  if(!si&&!gi){c.wps=[];return}
  let sx=c.x,sy=c.y;if(!si){pts.push({x:358,y:600},{x:358,y:560});sx=358;sy=560}
  pts.push(...navPath(sx,sy,gi?gx:358,gi?gy:560));
  if(!gi)pts.push({x:358,y:560},{x:358,y:600});
  c.wps=pts;
}
/* ----- sol, sombras y brillo ----- */
const SUN={dx:10,a:.2};
function sunUpd(){const t=S.phase==="closed"?(VIS.endAt?1:.18):dayT(),n=nightK();SUN.dx=(.5-t)*30;SUN.a=.2*(1-n*.7)}
const EMIS=[];let BLM=null;
function emitStatic(){
  EMIS.length=0;const n=nightK(),t=tierOf(level()),E=(x,y,w,h,c,a)=>EMIS.push({x,y,w,h,c,a});
  const c=LAY.counter,ry=c.y+76;E(c.x+13,ry-8,30,10,"#7fe3a0",.7);E(c.x+17,ry+43,14,9,"#a8f0b8",.6);E(680,38,56,30,"#4cc98a",.45);
  const cs=LAY.cs();E(cs.x-6,cs.y+cs.h-21,cs.w+12,2,"#7fe3ff",.9);
  if(S.decor.neon)E(566,16,92,14,"#ff4fd8",.85);
  if(t===3)E(W/2-160,4,320,36,"#ffd54a",.4);else if(t===2)E(W/2-140,5,280,33,"#ff6a5d",.2);
  LAMPS.forEach(([x,y,s])=>E(s>0?x+6:x-18,y-66,12,8,"#fff3b0",n));
  CITYWIN.forEach(([x,y,w,h],i)=>{if((i*7)%5)E(x,y,w,h,"#ffc070",.75*n)});
  (VIS.cars||[]).forEach(cr=>{if(cr.bike)return;const L=cr.bus?100:cr.len,f=cr.dir>0?cr.x+L/2:cr.x-L/2,b=cr.dir>0?cr.x-L/2:cr.x+L/2;E(f-3,cr.y-11,6,22,"#fff6c0",n);E(b-2,cr.y-11,4,22,"#ff3030",.6*n+(cr.v<cr.sp*.5?.5:0))});
  if(S.decor.lux)LUX.forEach(([x,y])=>E(x-6,y-118,12,64,"#fff4c8",.2+.3*n));
  E(6,520,310,28,"#ffe0a0",.3*n);E(396,520,398,28,"#ffe0a0",.3*n);
  if(season()==="xmas")for(let x=10;x<W;x+=20)if(Math.sin(performance.now()/333+x)>0)E(x-2,2,4,6,["#ff4d4d","#ffd54a","#4dd2ff","#7dff7a"][(x/20)%4|0],.8);
}
function bloom(){
  if(!EMIS.length||LITE())return;const V=VIEW,q=4,bw=Math.ceil(V.cw/q),bh=Math.ceil(V.ch/q);
  if(!BLM)BLM=document.createElement("canvas");if(BLM.width!==bw||BLM.height!==bh){BLM.width=bw;BLM.height=bh}
  const b=BLM.getContext("2d"),k=.35+.65*nightK();b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,bw,bh);b.setTransform(V.s/q,0,0,V.s/q,V.ox/q,V.oy/q);
  EMIS.forEach(e=>{const a=Math.min(1,e.a*k);if(a<.02)return;b.globalAlpha=a;b.fillStyle=e.c;b.fillRect(e.x,e.y,e.w,e.h)});b.globalAlpha=1;
  cx.save();cx.setTransform(V.dpr,0,0,V.dpr,0,0);cx.globalCompositeOperation="lighter";cx.filter="blur(5px)";cx.drawImage(BLM,0,0,V.cw,V.ch);cx.filter="none";cx.restore();
}
/* ----- semáforo, coches que paran, bicis, perros y pájaros ----- */
const tlT=()=>(performance.now()/1000)%17,tl=()=>{const c=tlT();return c<9?"g":c<11?"y":"r"};
function drawTL(x,y){cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(x+2,y,6,2.5,0,0,7);cx.fill();cx.fillStyle="#2b2f38";cx.fillRect(x-1.5,y-56,3,56);rr(x-5,y-80,10,26,3);cx.fill();
  const st=tl();[["r","#ff3b30",-75],["y","#ffcc00",-67],["g","#34c759",-59]].forEach(([k,c,o])=>{cx.fillStyle=st===k?c:"#444";cx.beginPath();cx.arc(x,y+o,3,0,7);cx.fill();if(st===k)EMIS.push({x:x-3,y:y+o-3,w:6,h:6,c,a:1})})}
const SKINS=["#f2c9a0","#e0a878","#a9714b","#7a4a2b"];
function updCars(dt){
  VIS.carT=(VIS.carT||0)-dt;VIS.cars=VIS.cars||[];
  if(VIS.carT<=0){VIS.carT=1.6+Math.random()*3.2;if(VIS.cars.length<(LITE()?4:8)){const dir=Math.random()<.5?1:-1,bike=Math.random()<.16,sp=bike?140:85+rnd(60);VIS.cars.push({x:dir>0?CX0-90:CX1+90,y:bike?(dir>0?625:681):(dir>0?637:671),dir,sp,v:sp,col:pick(["#e3350d","#3f7fc4","#f2b705","#2fa557","#eeeeee","#222","#8e4cb5","#e07a2f"]),len:bike?22:pick([46,50,58]),bus:!bike&&Math.random()<.1,bike,out:bike?mkOutfit("collector",null):null,skin:pick(SKINS),ph:0})}}
  const Ln=c=>c.bus?100:c.len,st=tl();
  VIS.cars.forEach(c=>{let tgt=c.van&&c.st==="unload"?0:c.sp;if(c.bus&&c.dir>0){if(!c.stopped&&c.x>=725&&c.x<770){c.stopped=1;c.hold=3;VIS.busP=null}if(c.hold>0){c.hold-=dt;tgt=0}}const fr=c.x+c.dir*Ln(c)/2;
    if(st!=="g")(c.dir>0?[552,1084]:[638,1166]).forEach(stop=>{const dist=(stop-fr)*c.dir;if(dist>-3&&dist<80)tgt=dist<3?0:Math.min(tgt,dist*1.6)});
    VIS.cars.forEach(o=>{if(o===c||o.dir!==c.dir||Math.abs(o.y-c.y)>8)return;const gap=(o.x-c.x)*c.dir-(Ln(o)+Ln(c))/2;if(gap>-5&&gap<70)tgt=Math.min(tgt,Math.max(0,(gap-12)*2))});
    c.v+=clamp(tgt-c.v,-240*dt,110*dt);c.x+=c.dir*c.v*dt;c.ph+=c.v*dt*.25});
  VIS.cars=VIS.cars.filter(c=>c.x>CX0-140&&c.x<CX1+140);
}
function drawBike(c){
  const x=c.x,y=c.y;cx.fillStyle="rgba(0,0,0,.25)";cx.beginPath();cx.ellipse(x+2,y+2,14,3,0,0,7);cx.fill();
  cx.strokeStyle="#222";cx.lineWidth=2;[-8,8].forEach(d=>{cx.beginPath();cx.arc(x+d,y-4,5,0,7);cx.stroke()});cx.beginPath();cx.moveTo(x-8,y-4);cx.lineTo(x,y-11);cx.lineTo(x+8,y-4);cx.stroke();
  const o=c.out;o.skin=c.skin;o.mv=true;o.ph=c.ph;o.mood="happy";o.face=c.dir;o.arm=null;o.bag=false;o.phone=false;o.sc=.85;drawPerson(x-c.dir*2,y-8,o);
  cx.fillStyle="#e07a2f";rr(x-c.dir*14-7,y-34,14,13,2);cx.fill();cx.fillStyle="#fff";cx.fillRect(x-c.dir*14-4,y-29,8,2);
}
function drawDog(p){
  const dx=p.x-p.dir*20,dy=p.y+1,ph=p.ph,c=p.dogc,l=Math.sin(ph*1.4)*1.5;
  cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(dx,dy,8,2.5,0,0,7);cx.fill();
  cx.save();cx.translate(dx,dy);cx.scale(p.dir,1);cx.fillStyle=c;cx.fillRect(-6,-4+l*.3,2,4);cx.fillRect(3,-4-l*.3,2,4);rr(-7,-10,13,7,3);cx.fill();cx.beginPath();cx.arc(7,-11,4,0,7);cx.fill();cx.fillRect(9,-10,3,2);
  cx.fillStyle="#222";cx.fillRect(7.5,-12.5,1.3,1.3);cx.strokeStyle=c;cx.lineWidth=1.6;cx.beginPath();cx.moveTo(-7,-9);cx.lineTo(-10,-13+Math.sin(ph*3)*2);cx.stroke();cx.restore();
  cx.strokeStyle="#c0392b";cx.lineWidth=.8;cx.beginPath();cx.moveTo(dx+p.dir*9,dy-12);cx.quadraticCurveTo((dx+p.x)/2,dy-6,p.x-p.dir*10,p.y-16);cx.stroke();
}
function updPed(dt){
  VIS.pedT-=dt;const nk=nightK();
  if(VIS.pedT<=0){VIS.pedT=(1+Math.random()*2.2)*(1+nk*2);if(VIS.ped.length<(LITE()?6:14)){const dir=Math.random()<.5?1:-1,far=Math.random()<.45;VIS.ped.push({x:dir>0?CX0-20:CX1+20,y:far?700+rnd(30):582+rnd(24),dir,sp:30+rnd(22),ph:rnd(6),out:mkOutfit(pick(["kid","collector","investor","whale","seller"]),null),skin:pick(SKINS),dog:Math.random()<.22,dogc:pick(["#c47a2c","#f4f4f4","#3a2a20","#d9b36c"])})}}
  if(S.rival&&S.rival.on)VIS.ped.forEach(p=>{if(!p.cross&&!p.into&&p.y>=698&&Math.abs(p.x-950)<6&&Math.random()<.35*S.rival.str/60)p.into={x:950,y:742}});
  {const t=dayT();if(S.phase!=="closed"&&t>.55&&t<.7&&Math.random()<dt*.5&&VIS.ped.length<18)VIS.ped.push({x:1250,y:712,dir:-1,sp:40,ph:0,out:Object.assign(mkOutfit("kid",null),{acc:"backpack"}),skin:pick(SKINS)})}
  const ct=tlT();if(ct>11&&ct<13.5&&Math.random()<dt*.8&&VIS.ped.filter(p=>p.cross).length<3){const up=Math.random()<.5;VIS.ped.push({x:568+rnd(54),y:up?702:604,cross:up?-1:1,dir:1,sp:34,ph:0,out:mkOutfit(pick(["kid","collector","investor"]),null),skin:pick(SKINS)})}
  VIS.ped.forEach(p=>{p.ph+=dt*9;if(p.into){const dx=p.into.x-p.x,dy=p.into.y-p.y,d=Math.hypot(dx,dy);if(d<3){p.gone=1;return}p.x+=dx/d*p.sp*dt;p.y+=dy/d*p.sp*dt;p.dir=dx>0?1:-1;return}if(p.cross){p.y+=p.cross*36*dt;if((p.cross>0&&p.y>=702)||(p.cross<0&&p.y<=600)){p.cross=0;p.dir=Math.random()<.5?1:-1;p.sp=30+rnd(20)}}else p.x+=p.dir*p.sp*dt});
  VIS.ped=VIS.ped.filter(p=>p.x>CX0-30&&p.x<CX1+30&&!p.gone);
}
function initBirds(){VIS.birds=[];for(let f=0;f<4;f++){const bx=CX0+260+f*400,by=-170+rnd(80);for(let i=0;i<4+rnd(3);i++)VIS.birds.push({x:bx+rnd(50),y:by+rnd(24),st:"sit",t:Math.random()*5,vx:0,vy:0,h:0})}
  [[200,600],[470,604],[700,598],[-140,600],[940,602],[260,712],[820,716]].forEach(([x,y])=>VIS.birds.push({x,y,st:"sit",t:Math.random()*5,ground:1,vx:0,vy:0,h:0}))}
function updBirds(dt){
  if(!VIS.birds)initBirds();const movers=VIS.ped.concat(custs);
  VIS.birds.forEach(b=>{b.t-=dt;
    if(b.st==="sit"){
      if(b.ground&&movers.some(p=>Math.hypot(p.x-b.x,p.y-b.y)<30)){b.st="fly";b.vx=(Math.random()<.5?-1:1)*(70+rnd(50));b.t=1.5+Math.random()*1.5;sfx&&Math.random()<.3&&tone(2600,0,.05,"sine",.012)}
      else if(b.t<=0){if(!b.ground&&Math.random()<.12){b.st="fly";b.vx=(Math.random()<.5?-1:1)*(50+rnd(40));b.t=2.5+Math.random()*3}else{b.t=.6+Math.random()*2.5;b.x+=(Math.random()-.5)*6;b.peck=.3}}
      if(b.peck>0)b.peck-=dt;
    }else{b.x+=b.vx*dt;b.h=Math.min(70,b.h+50*dt);if(b.t<=0){b.st="sit";b.h=0;b.t=2+Math.random()*4;b.x=clamp(b.x,CX0+20,CX1-20)}}
  });
}
function drawBird(b){
  const x=b.x,y=b.y-b.h;
  if(b.st==="fly"){const f=Math.sin(performance.now()/60+x)*4;cx.strokeStyle="#3a3f4b";cx.lineWidth=1.6;cx.beginPath();cx.moveTo(x-6,y-f);cx.lineTo(x,y);cx.lineTo(x+6,y-f);cx.stroke();return}
  const pk=b.peck>0?2:0;cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(x,y+1,4,1.5,0,0,7);cx.fill();cx.fillStyle="#7d8794";cx.beginPath();cx.ellipse(x,y-3,4,2.6,0,0,7);cx.fill();cx.beginPath();cx.arc(x+3,y-5+pk,2,0,7);cx.fill();cx.fillStyle="#f2b705";cx.fillRect(x+4.5,y-5+pk,1.6,1)
}

/* ===================== V14: CONSEJOS Y PRECIOS ===================== */
function accTag(p){const c=p>=.7?"ok":p>=.4?"mid":"bad",t=p>=.7?"✅ Buen precio":p>=.4?"⚠️ Algo caro":"❌ Muy caro";return `<span class="acc ${c}">${t} · lo compraría ~${Math.round(p*100)} % de los clientes</span>`}
const tipsHTML=l=>l.length?l.map(t=>`<div class="tip">${t}</div>`).join(""):'<div class="tip">👍 Todo en orden. ¡Sigue así!</div>';
function mTips(){
  const l=tipsList(S.phase==="closed"?null:S.stats);
  return `<h2>💡 Consejos de Carla</h2><div class="pn">${tipsHTML(l)}</div>
  <h3>Cómo saber si un precio está bien</h3>
  <div class="pn"><div class="tip">En <b>Stock</b> y en <b>Cartas</b>, cada precio lleva una etiqueta: <span class="acc ok">✅ Buen precio</span> <span class="acc mid">⚠️ Algo caro</span> <span class="acc bad">❌ Muy caro</span>, con el % aproximado de clientes que lo comprarían.</div>
  <div class="tip">Sobres y productos: los clientes pagan alrededor del <b>precio de referencia</b> que ves en Stock. Un poco por debajo vende casi siempre; un 15 % por encima casi nunca.</div>
  <div class="tip">Cartas en vitrina: conocen el precio de mercado. Entre 100 % y 105 % se venden rápido; a 120 % o más, muy poco.</div>
  <div class="tip">Comprar a clientes: el negocio está en pagar <b>menos del 75 %</b> del valor de mercado y revenderlas en la vitrina. Las cartas de menos de 1 € no compensan.</div></div>`;
}

/* ===================== V15: PARA JUGAR EN FAMILIA ===================== */
/* ----- medallas ----- */
function mMedals(){
  return retoTabs("medals")+`<p class="mu">Consigue las 8 medallas de la ciudad. Cada una da dinero y reputación.</p><div class="medgrid">${MEDALS.map(m=>{const got=S.med&&S.med[m.id],v=m.v(),p=Math.min(1,v/m.g);
    return `<div class="medc${got?" got":""}"><div class="medal" style="--mc:${m.c}">${got?m.e:"?"}</div><b>${m.n}</b><span>${m.d}</span>${got?`<em>¡Conseguida! +${fmt(m.r)}</em>`:`<div class="prog"><i style="width:${p*100}%"></i></div><span>${m.eur?fmt(v):v}${m.pc?" %":""} / ${m.eur?fmt(m.g):m.g}${m.pc?" %":""}</span>`}</div>`}).join("")}</div>`;
}
function mountMedal(){
  const m=MEDALS.find(x=>x.id===VIS.showMed);if(!m){closeM();return}
  $("#ovh").innerHTML=`<div class="px" id="px" style="--sc:${m.c}"><div class="pxstage"><div class="rays on" style="--rc:${m.c}"></div><div class="tier"><div class="ttl">¡NUEVA MEDALLA!</div><div class="medal big" style="--mc:${m.c}">${m.e}</div><div class="tsign ts1" style="animation:none;background:${m.c};color:#fff;box-shadow:0 0 30px ${m.c}">${m.n}</div><div class="tlist">${m.d}<br>+${fmt(m.r)} · +2 ⭐ · llevas ${medCount()}/8</div><button class="b pri" id="medok" style="font-size:18px;padding:12px 26px">¡Genial!</button></div></div></div>`;
  confetti(3,m.c);sfx.hit(3);vibe([60,40,140]);shake(6);$("#medok").onclick=()=>{VIS.showMed=null;closeM()};
}
/* ----- regalo diario ----- */
function mGift(){const g=S.gift,days=[1,2,3,4,5,6,7].map(d=>`<div class="gday${d<=((g.streak-1)%7)+1?" on":""}">${d===7?"🎁":d===3?"💰":"🎴"}<span>Día ${d}</span></div>`).join("");
  return `<h2>🎁 Regalo diario</h2><div class="pn" style="text-align:center"><div style="font-size:54px">🎴</div><b style="font-family:var(--fd);font-size:20px">¡Un sobre gratis de ${g.set?setName(g.set):"tu colección"}!</b>${g.bonus?`<div class="up" style="font-family:var(--fd);font-size:18px">+ ${fmt(g.bonus)} de premio por tu racha</div>`:""}<div class="mu">Racha: ${g.streak} día${g.streak>1?"s":""} seguidos. Vuelve mañana para seguir sumando.</div><div class="gdays">${days}</div></div>
  ${g.set?`<button class="b pri big" data-a="giftopen">¡Abrirlo ahora!</button>`:""}`}
/* ----- personalizar ----- */
const SHIRTC=["#e3350d","#3f7fc4","#2fa557","#f2b705","#8e4cb5","#e07a2f","#1abc9c","#222"],HAIRC2=["#222","#6b3a1e","#c47a2c","#d9b36c","#8a8a8a","#b13e53"];
const STYLES={clasico:{n:"Clásico",c:null},azul:{n:"Azul",c:"#3f7fc4"},rosa:{n:"Rosa",c:"#ff7ab8"},verde:{n:"Verde",c:"#2fa557"},morado:{n:"Morado",c:"#8e4cb5"},noche:{n:"Noche",c:"#1f2a44"}};
const PETS={cat:"🐱 Gato",dog:"🐶 Perro",bunny:"🐰 Conejo",none:"Sin mascota"};
const meCfg=()=>Object.assign({shirt:"#e3350d",hair:"#222",cap:"#e3350d",hs:0},S.me||{});
const shopName=()=>(S.shopName||"").trim()||"Poké Cards";
function mCustom(){const me=meCfg(),sw=(k,list)=>`<div class="sw">${list.map(c=>`<button class="swc${me[k]===c?" on":""}" style="background:${c}" data-a="meset" data-k="${k}" data-n="${c}" aria-label="${c}"></button>`).join("")}</div>`;
  return `<h2>🎨 Personalizar</h2><div class="pn"><b>Nombre de la tienda</b><input class="inp" data-i="shopn" maxlength="22" placeholder="Poké Cards" value="${(S.shopName||"").replace(/"/g,"")}" style="margin:6px 0 0"><div class="mu">Sale en el cartel, en el escaparate y en el ticket.</div></div>
  <div class="pn" style="display:flex;gap:12px;align-items:center"><img src="${portrait(Object.assign({pants:"#2c3350",shoes:"#141414",skin:"#f2c9a0",hat:"cap",hatc:me.cap,sc:1,seed:2},me))}" alt="" style="width:80px;height:100px;border-radius:12px;background:var(--panel2)"><div style="flex:1"><b>Tu tendero</b><div class="mu">Camiseta</div>${sw("shirt",SHIRTC)}<div class="mu">Gorra</div>${sw("cap",SHIRTC)}<div class="mu">Pelo</div>${sw("hair",HAIRC2)}</div></div>
  <div class="pn"><b>Mascota de la tienda</b><div class="btns">${Object.keys(PETS).map(k=>`<button class="b ${(S.pet||"cat")===k?"on":""}" data-a="petset" data-k="${k}">${PETS[k]}</button>`).join("")}</div></div>
  <div class="pn"><b>Estilo de la tienda</b><div class="btns">${Object.keys(STYLES).map(k=>`<button class="b ${(S.style||"clasico")===k?"on":""}" data-a="styset" data-k="${k}">${STYLES[k].c?`<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${STYLES[k].c};margin-right:6px;vertical-align:-1px"></span>`:""}${STYLES[k].n}</button>`).join("")}</div></div>`}
function drawPet(){const p=S.pet||"cat";if(p==="none")return;if(p==="cat")return drawCat();
  const x=CAT.x,y=CAT.y,d=CAT.dir,t=performance.now()/1000,sl=CAT.st==="sleep",w=CAT.st==="walk"?Math.sin(CAT.ph)*2.5:0;
  cx.save();cx.translate(x,y);cx.scale(d,1);cx.fillStyle="rgba(0,0,0,.22)";cx.beginPath();cx.ellipse(0,0,13,4,0,0,7);cx.fill();
  if(p==="dog"){const c="#c47a2c";cx.fillStyle=c;if(!sl)[[-7,w],[-3,-w],[5,-w],[9,w]].forEach(([lx,o])=>cx.fillRect(lx,-7+o*.3,3,7));rr(-10,sl?-9:-15,22,sl?9:9,4);cx.fill();
    const hy=sl?-8:(CAT.st==="sit"?-21:-17);cx.beginPath();cx.arc(12,hy,6.5,0,7);cx.fill();cx.fillStyle="#7a4a1f";cx.beginPath();cx.ellipse(9,hy-2,2.5,5,.4,0,7);cx.fill();cx.fillStyle="#f4e2c0";cx.fillRect(15,hy+1,4,3);cx.fillStyle="#222";cx.fillRect(17,hy,2,2);if(!sl)cx.fillRect(12,hy-2,1.5,1.5);
    cx.strokeStyle=c;cx.lineWidth=3;cx.lineCap="round";cx.beginPath();cx.moveTo(-10,sl?-6:-13);cx.lineTo(-15,(sl?-8:-19)+Math.sin(t*(sl?1:10))*3);cx.stroke();cx.lineCap="butt"}
  else{const c="#f2f2f2";cx.fillStyle=c;cx.beginPath();cx.ellipse(0,-7,10,7,0,0,7);cx.fill();const hop=CAT.st==="walk"?Math.abs(Math.sin(CAT.ph))*-5:0;cx.translate(0,hop);
    cx.beginPath();cx.arc(9,-11,5.5,0,7);cx.fill();cx.fillStyle="#f2f2f2";rr(6,-26,3,11,2);cx.fill();rr(10,-25,3,10,2);cx.fill();cx.fillStyle="#ffb3c7";cx.fillRect(7,-24,1,7);cx.fillRect(11,-23,1,6);
    cx.fillStyle="#222";if(!sl)cx.fillRect(11,-12,1.6,1.6);cx.fillStyle="#fff";cx.beginPath();cx.arc(-10,-7,3,0,7);cx.fill()}
  cx.restore();if(sl){const zz=(CAT.z%2)/2;cx.globalAlpha=1-zz;txt("z",x+10,y-18-zz*14,10+zz*4,"#fff","center");cx.globalAlpha=1}
}
function petSound(){const p=S.pet||"cat";if(p==="dog"){tone(420,0,.09,"square",.05);tone(380,.14,.1,"square",.05)}else if(p==="bunny"){tone(1600,0,.06,"sine",.05);tone(1900,.08,.06,"sine",.05)}else{tone(760,0,.12,"triangle",.07);tone(620,.1,.3,"triangle",.06)}heartsAt(CAT.x,CAT.y-26,2);CAT.st="sit";CAT.t=3}
/* ----- intercambios con habituales ----- */
let TRD=null;
function mTrade(){const t=TRD,R=RG(t.c.reg),it=S.items.find(i=>i.i===t.mine),gc=BYID[t.give];if(!it||!gc)return `<h2>Intercambio</h2><p class="mu">Ya no tienes esa carta.</p>`;
  const mc=BYID[it.c],mv=itemVal(it),gv=price(gc.id),r=gv/Math.max(.01,mv);
  return `<h2>🔄 ${R.e} ${R.n} quiere cambiar</h2><div class="cust"><div class="av">${R.e}</div><div class="sp">${t.say}</div></div>
  <div class="trd"><div><div class="mu">Tú das</div>${face(mc,it.rv)}<b>${fmt(mv)}</b></div><div class="trx">⇄</div><div><div class="mu">Te llevas</div>${face(gc,false)}<b>${fmt(gv)}</b>${S.dex[gc.id]?"":'<em class="nwb">NUEVA</em>'}</div></div>
  <div class="pn" style="margin-top:10px"><b>${r>=1.15?"🟢 ¡Sales ganando!":r>=.85?"🟡 Cambio justo":"🔴 Sales perdiendo"}</b>${S.dex[gc.id]?"":`<div class="mu">Es una carta que aún no tienes en el álbum.</div>`}</div>
  <div class="btns"><button class="b pri big" data-a="tradeok">¡Trato hecho!</button><button class="b big" data-a="tradeno">No, gracias</button></div>`}
/* ----- búsqueda del tesoro ----- */
const HUNTS=[[30,330],[790,210],[350,250],[150,130],[500,520],[620,60],[40,560],[760,560],[260,600],[700,605],[440,600],[200,520],[110,370],[600,380],[-80,600],[880,598],[560,700],[150,712]];
function huntDay(){if(!S.hunt||S.hunt.day!==S.day){const l=HUNTS.slice().sort(()=>Math.random()-.5).slice(0,5);S.hunt={day:S.day,p:l.map(([x,y])=>({x,y,g:0})),done:0}}return S.hunt}
function drawHunt(){const h=huntDay(),t=performance.now()/1000;h.p.forEach((q,i)=>{if(q.g)return;const b=Math.sin(t*3+i)*1.5;cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(q.x,q.y+2,5,2,0,0,7);cx.fill();pokeball(q.x,q.y-4+b,4.5);if(Math.sin(t*2+i*1.7)>.7)star(q.x+6,q.y-10+b,2.5,"#fff")})}
function huntTap(x,y){const h=huntDay();const q=h.p.find(q=>!q.g&&Math.hypot(q.x-x,q.y-4-y)<16);if(!q)return false;q.g=1;S.money+=5;fx(q.x,q.y-14,"+5 €","#ffd54a");starsAt(q.x,q.y-6,10);sfx.coin();tone(1320,0,.12,"triangle",.07);
  const left=h.p.filter(z=>!z.g).length;if(!left){const sd=pick(SETS);if(sd)S.sealed[sd.id]++;assignSlots();toast(`🎉 ¡Encontraste las 5 Poké Balls! Premio: un sobre de ${sd?sd.n:""}`);sfx.ach();track("mgwin")}else toast(`⚪ Poké Ball encontrada · quedan ${left}`);hud();return true}
/* ----- minijuegos ----- */

function mGames(){return retoTabs("games")+`<p class="mu">Premios en ${mgLeft()} partida(s) más hoy (se recargan cada día). Puedes seguir jugando aunque se acaben.</p>
  <div class="menu"><button class="b big" data-a="mgstart" data-k="hl">💰 ¿Más caro o más barato?</button><button class="b big" data-a="mgstart" data-k="who">❓ ¿Quién es ese Pokémon?</button><button class="b big" data-a="mgstart" data-k="duel">⚔️ Duelo de cartas</button><button class="b big" data-a="m" data-k="hunt">⚪ Búsqueda del tesoro</button></div>`}
function mHunt(){const h=huntDay(),got=h.p.filter(q=>q.g).length;return `<h2>⚪ Búsqueda del tesoro</h2><div class="pn"><div style="font-size:30px;text-align:center">${h.p.map(q=>q.g?"🔴":"⚪").join(" ")}</div><p>Hay <b>5 Poké Balls</b> escondidas cada día por la tienda y la calle. Toca cada una para recogerla (+5 €). ¡Si encuentras las 5, ganas un sobre!</p><p class="mu">Pista: aleja la cámara con ⤢ o pellizcando para ver la calle. Llevas ${got}/5.</p></div>`}
function mMG(){
  const m=G.MG;if(!m)return "";
  if(m.k==="hl"){const card=(c,side)=>`<button class="hlc${m.step!=="pick"&&((price(m.a.id)>price(m.b.id))===(side==="a"))?" win":""}" data-a="mghl" data-k="${side}" ${m.step!=="pick"?"disabled":""}>${face(c,false)}<b>${m.step==="pick"?"?":fmt(price(c.id))}</b></button>`;
    return `<h2>💰 ¿Cuál vale más?</h2><div class="mu" style="text-align:center">Ronda ${m.round+1}/5 · aciertos ${m.ok}</div><div class="hl">${card(m.a,"a")}<div class="trx">VS</div>${card(m.b,"b")}</div>
    ${m.step==="pick"?'<p class="mu" style="text-align:center">Toca la carta que creas que es más cara en Cardmarket</p>':`<div class="pn" style="text-align:center"><b style="font-family:var(--fd);font-size:20px">${m.last?"✅ ¡Correcto!":"❌ ¡Uy, no!"}</b></div><button class="b pri big" data-a="mgnext">${m.round>=4?"Ver resultado":"Siguiente"}</button>`}`}
  if(m.k==="who"){const blur=m.step==="pick"?Math.max(0,14-(performance.now()-m.t0)/400):0;
    return `<h2>❓ ¿Quién es ese Pokémon?</h2><div class="mu" style="text-align:center">Ronda ${m.round+1}/5 · aciertos ${m.ok}</div><div class="who"><div class="whoimg" id="whoimg" style="background-image:url('${m.c.img}');filter:blur(${blur}px) ${m.step==="pick"?"saturate(.6)":""}"></div></div>
    ${m.step==="pick"?`<div class="menu">${m.opts.map(o=>`<button class="b big" data-a="mgwho" data-k="${o.replace(/"/g,"")}">${o}</button>`).join("")}</div><p class="mu" style="text-align:center">La imagen se va aclarando: ¡cuanto antes aciertes, mejor!</p>`:`<div class="pn" style="text-align:center"><b style="font-family:var(--fd);font-size:20px">${m.last?"✅ ¡Es "+wname(m.c.name)+"!":"❌ Era "+wname(m.c.name)}</b></div><button class="b pri big" data-a="mgnext">${m.round>=4?"Ver resultado":"Siguiente"}</button>`}`}
  if(m.k==="duel"){const R=RG(m.opp);
    if(m.step==="choose"){const mine=S.items.filter(i=>!i.res&&!i.gq&&!i.fkK),seen=new Set(),top=mine.map(i=>BYID[i.c]).filter(c=>c&&!seen.has(c.id)&&seen.add(c.id)).sort((a,b)=>power(b)-power(a)).slice(0,12);
      return `<h2>⚔️ Duelo contra ${R.e} ${R.n}</h2><p class="mu">Elige 3 cartas. Gana cada ronda la de más poder (PS). Ventaja de tipo: +30 %.</p><div class="tiles">${top.map(c=>`<div class="tile${m.sel.includes(c.id)?" sel":""}" data-a="mgpick" data-k="${c.id}">${face(c,false)}<div class="pt">⚡ ${power(c)}</div></div>`).join("")}</div><button class="b pri big" data-a="mgduel"${m.sel.length<3?" disabled":""}>¡Combatir! (${m.sel.length}/3)</button>`}
    const r=m.round,mc=BYID[m.sel[r]],oc=m.oppC[r],mp=m.pw[r][0],op=m.pw[r][1];
    return `<h2>⚔️ Ronda ${r+1}/3</h2><div class="mu" style="text-align:center">Tú ${m.score[0]} – ${m.score[1]} ${R.n}</div><div class="hl"><div class="hlc${mp>op?" win":""}">${face(mc,false)}<b>⚡ ${mp}</b></div><div class="trx">VS</div><div class="hlc${op>mp?" win":""}">${face(oc,false)}<b>⚡ ${op}</b></div></div>
    <div class="pn" style="text-align:center"><b style="font-family:var(--fd);font-size:18px">${mp>op?"✅ ¡Ganas la ronda!":mp<op?"❌ Gana "+R.n:"🤝 Empate"}</b>${m.bonus[r]?`<div class="mu">${m.bonus[r]}</div>`:""}</div><button class="b pri big" data-a="mgnext">${r>=2?"Ver resultado":"Siguiente ronda"}</button>`}
  if(m.k==="end")return `<h2>${m.title}</h2><div class="pn" style="text-align:center"><div style="font-size:60px">${m.win?"🏆":"🙂"}</div><b style="font-family:var(--fd);font-size:22px">${m.res}</b><div class="mu">${m.rewTxt}</div></div><div class="btns"><button class="b pri big" data-a="mgstart" data-k="${m.again}">Jugar otra vez</button><button class="b big" data-a="m" data-k="games">Otros minijuegos</button></div>`;
}
/* ----- historia con Carla ----- */
function storyTick(){if(!hasState()||(S.tut&&S.tut.on))return;const st=story(),c=CHAP[st.ch];if(!c)return;const p=chapProg();if(p.every(x=>x.v>=x.g)&&!G.M&&!front()){S.money+=c.r;S.repB+=1;st.done=st.ch;st.ch++;st.intro=false;const n=CHAP[st.ch];if(n)n.g.forEach(([,k])=>st.base[k]=chapVal(k));openM("story")}}
function mStory(){const st=story(),prev=CHAP[st.done],cur=CHAP[st.ch],p=chapProg();
  const prevBox=prev&&!st.seenEnd?`<div class="pn"><b>✅ Capítulo completado: ${prev.t}</b><p>${prev.e}</p><div class="up">+${fmt(prev.r)} · +1 ⭐</div></div>`:"";st.seenEnd=true;
  return retoTabs("story")+`<div class="cust"><img src="${guideImg()}" alt="" style="width:60px;height:76px;border-radius:12px;background:#ffe9a8"><div class="sp">${cur?cur.i:"¡Has completado toda la historia! Eres una leyenda."}</div></div>${prevBox}
  ${cur?`<div class="pn"><b>Capítulo ${st.ch+1}/${CHAP.length}: ${cur.t}</b>${p.map(x=>`<div class="row" style="margin-top:6px"><span>${x.n}</span><span>${x.v}/${x.g}</span></div><div class="prog"><i style="width:${x.v/x.g*100}%"></i></div>`).join("")}<div class="mu">Premio: ${fmt(cur.r)}</div></div>`:""}`}
function storyBadge(){const el=$("#stb");if(!el)return;const st=hasState()&&!(S.tut&&S.tut.on)?story():null,c=st&&CHAP[st.ch];if(!c){el.style.display="none";return}const p=chapProg(),x=p.find(q=>q.v<q.g)||p[0];el.style.display="block";el.innerHTML=`📖 <b>${c.t}</b> · ${x.n}: ${x.v}/${x.g}`}

const fitS=(t,m,w)=>Math.min(m,w/(Math.max(1,t.length)*.62));
/* ===================== V16: CIUDAD VIVA ===================== */
const AX=()=>hasState()&&S.annex?-276:0;
const XS0=1090,XS1=1160;
function parkDraw(g,x,y,w,h,se,R){
  const snow=se==="xmas"||se==="winter";g.fillStyle=snow?"#e3ecef":"#5fa35a";g.fillRect(x,y,w,h);
  for(let i=0;i<w*h/120;i++){g.fillStyle=snow?"rgba(180,200,210,.25)":(R()<.5?"rgba(40,100,40,.25)":"rgba(140,200,110,.25)");g.fillRect(x+R()*w,y+R()*h,2,2)}
  g.strokeStyle="#d9c49a";g.lineWidth=18;g.lineCap="round";g.beginPath();g.moveTo(x+20,y+30);g.bezierCurveTo(x+w*.3,y+h*.6,x+w*.6,y+h*.1,x+w-20,y+h*.7);g.stroke();g.lineCap="butt";
  g.fillStyle="#e9d7a6";g.fillRect(x+60,y+120,90,60);g.strokeStyle="#b8935a";g.lineWidth=3;g.strokeRect(x+60,y+120,90,60);
  g.strokeStyle="#c0392b";g.lineWidth=4;g.beginPath();g.moveTo(x+240,y+60);g.lineTo(x+250,y+20);g.lineTo(x+330,y+20);g.lineTo(x+340,y+60);g.stroke();
  g.fillStyle="#3f7fc4";g.fillRect(x+360,y+90,16,50);g.fillStyle="#f2b705";g.beginPath();g.moveTo(x+376,y+92);g.lineTo(x+420,y+140);g.lineTo(x+408,y+146);g.lineTo(x+372,y+104);g.fill();
  g.strokeStyle="#8a6a44";g.lineWidth=2;g.strokeRect(x+2,y+2,w-4,h-4);
}
function plazaDraw(g,x,y,w,h,se,R){
  g.fillStyle="#d9cfbd";g.fillRect(x,y,w,h);g.strokeStyle="rgba(0,0,0,.08)";g.lineWidth=1;g.beginPath();for(let i=x;i<x+w;i+=24){g.moveTo(i,y);g.lineTo(i,y+h)}for(let j=y;j<y+h;j+=24){g.moveTo(x,j);g.lineTo(x+w,j)}g.stroke();
  const fx=x+w/2,fy=y+h*.5;g.fillStyle="#9aa3ad";g.beginPath();g.arc(fx,fy,52,0,7);g.fill();g.fillStyle="#5fb8d8";g.beginPath();g.arc(fx,fy,44,0,7);g.fill();g.fillStyle="#9aa3ad";g.beginPath();g.arc(fx,fy,10,0,7);g.fill();
  [[x+40,y+40],[x+w-80,y+40],[x+40,y+h-50],[x+w-80,y+h-50]].forEach(([bx,by])=>{g.fillStyle="#7a4b2b";g.fillRect(bx,by,42,10);g.fillStyle="#5c3b20";g.fillRect(bx,by+10,42,4)});
  if(se==="xmas"||se==="winter"){g.fillStyle="rgba(255,255,255,.55)";for(let i=0;i<14;i++){g.beginPath();g.ellipse(x+R()*w,y+R()*h,14,6,0,0,7);g.fill()}}
}
function coleDraw(g,x,y,w,h,se,R){
  facadeDraw(g,x,y,w,"COLEGIO","#e0622a",R);g.fillStyle="#b5583a";g.fillRect(x,y+54,w,h-54);g.fillStyle="#e07a3f";g.fillRect(x+16,y+74,w-32,120);g.strokeStyle="#fff";g.lineWidth=2;g.strokeRect(x+22,y+80,w-44,108);g.beginPath();g.moveTo(x+w/2,y+80);g.lineTo(x+w/2,y+188);g.stroke();g.beginPath();g.arc(x+w/2,y+134,18,0,7);g.stroke();
  if(se==="xmas"||se==="winter"){g.fillStyle="rgba(255,255,255,.6)";g.fillRect(x,y+200,w,h-200)}
}
function buildCity(se){
  CITYWIN=[];const c=document.createElement("canvas");c.width=CX1-CX0;c.height=CY1-CY0;const g=c.getContext("2d");g.translate(-CX0,-CY0);const R=srand(99);
  g.fillStyle="#6f7680";g.fillRect(CX0,CY0,CX1-CX0,CY1-CY0);
  g.fillStyle="#4a4f57";g.fillRect(CX0,-66,CX1-CX0,66);g.fillStyle="#3a3e46";for(let x=CX0;x<CX1;x+=48)g.fillRect(x,-34,24,2);
  for(let x=CX0+40;x<CX1;x+=210){if(x>XS0-60&&x<XS1)continue;g.fillStyle="#2f6b3a";g.fillRect(x,-60,26,18);g.fillStyle="#3f8a4a";g.fillRect(x+30,-60,26,18)}
  let x=CX0;while(x<CX1){const w=150+R()*170;if(x<XS1&&x+w>XS0){roofDraw(g,x+4,CY0,XS0-x-8,-72-CY0,R,se);x=XS1;continue}roofDraw(g,x+4,CY0,w-8,-72-CY0,R,se);x+=w}
  const near=[[CX0,-290,"CAFÉ","#7b4a2b"],[808,XS0-6,"LIBRERÍA","#2f5fa8"],[XS1+6,CX1,"FLORISTERÍA","#2fa557"]];if(!S.annex)near.push([-282,-8,"PANADERÍA","#c47a2c"]);
  near.forEach(([a,b,n,col])=>{roofDraw(g,a+4,0,b-a-8,516,R,se);facadeDraw(g,a+4,516,b-a-8,n,col,R)});
  parkDraw(g,CX0+4,742,-124-CX0,CY1-746,se,R);
  facadeDraw(g,-106,738,224,"BANCO","#1f4e8c",R);roofDraw(g,-106,792,224,CY1-792,R,se);
  facadeDraw(g,124,738,246,"HELADERÍA","#ff7ab8",R);roofDraw(g,124,792,246,CY1-792,R,se);
  plazaDraw(g,380,742,428,CY1-746,se,R);
  facadeDraw(g,816,738,268,"SE ALQUILA","#7d8794",R);roofDraw(g,816,792,268,CY1-792,R,se);
  coleDraw(g,XS1+6,738,CX1-XS1-6,CY1-738,se,R);
  g.fillStyle="#3a3e46";g.fillRect(XS0,CY0,XS1-XS0,CY1-CY0);g.fillStyle="#e8e8e8";for(let y=CY0;y<CY1;y+=50)g.fillRect(XS0+33,y,3,26);
  g.fillStyle="rgba(0,0,0,.25)";g.fillRect(CX0,0,CX1-CX0,4);
  return c;
}
function cityTrees(){const l=[],skip=x=>(x>250&&x<470)||(x>670&&x<790)||(x>XS0-30&&x<XS1+30)||x<-290;for(let x=CX0+70;x<CX1;x+=170)if(!skip(x))l.push([x,604]);for(let x=CX0+150;x<CX1;x+=190)if(!(x>XS0-30&&x<XS1+30))l.push([x,722]);return l}
function drawCross(){
  cx.fillStyle="#3a3e46";cx.fillRect(XS0,570,XS1-XS0,168);cx.fillStyle="#f2f2f2";for(let x=XS0+4;x<XS1-4;x+=12){cx.fillRect(x,598,7,12);cx.fillRect(x,700,7,12)}
  cx.fillStyle="#6d737c";cx.fillRect(XS0-4,570,4,42);cx.fillRect(XS1,570,4,42);cx.fillRect(XS0-4,694,4,44);cx.fillRect(XS1,694,4,44);
}
function drawBusStop(){
  const x=690,y=600;cx.fillStyle="rgba(0,0,0,.2)";cx.fillRect(x+4,y+2,76,6);cx.fillStyle="#2b2f38";cx.fillRect(x,y-40,3,42);cx.fillRect(x+72,y-40,3,42);cx.fillStyle="rgba(170,215,240,.45)";cx.fillRect(x,y-40,75,26);cx.fillStyle="#2f5fa8";cx.fillRect(x-2,y-46,79,7);txt("BUS",x+38,y-40,7,"#fff","center");
  cx.fillStyle="#7a4b2b";cx.fillRect(x+10,y-10,54,5);
  if(!VIS.busP&&!(VIS.cars||[]).some(c=>c.hold>0))VIS.busP=[mkOutfit("collector",null),mkOutfit("kid",null)];
  [[x+22,y-4],[x+52,y-4]].forEach(([px,py],i)=>{const o=VIS.busP&&VIS.busP[i];if(!o)return;o.skin=o.skin||"#e0a878";o.mv=false;o.ph=0;o.mood="neutral";o.face=1;o.phone=i===1;o.arm=null;o.bag=false;drawPerson(px,py,o)});
}
function drawTerrace(){
  const regs=REGS.filter(r=>S.regs[r.id]&&S.regs[r.id].met&&r.t!=="lot"&&r.t!=="seller").slice(0,3),t=performance.now()/1000;
  [-520,-440,-360].forEach((x,i)=>{const y=600;
    const r=regs[i];if(r&&S.phase!=="closed"){const o=Object.assign({},regS(r.id).out||(regS(r.id).out=mkOutfit(r.t,r)),{skin:r.skin,mv:false,ph:0,mood:"happy",face:1,arm:Math.sin(t*1.3+i)>.7?"wave":null,bag:false,phone:false});drawPerson(x-14,y,o)}
    cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(x+2,y+2,14,4,0,0,7);cx.fill();cx.fillStyle="#d9d3c7";cx.beginPath();cx.ellipse(x,y-12,12,6,0,0,7);cx.fill();cx.fillStyle="#9aa0a8";cx.fillRect(x-1,y-12,2,12);
    cx.fillStyle="#fff";cx.fillRect(x-3,y-17,5,4);cx.fillStyle=["#c0392b","#2f5fa8","#2fa557"][i];cx.beginPath();cx.moveTo(x-26,y-44);cx.lineTo(x+26,y-44);cx.lineTo(x,y-58);cx.fill();cx.fillStyle="#555";cx.fillRect(x-1,y-44,2,30)});
}
function drawSweeper(){const x=1290,y=598,t=performance.now()/1000,o=VIS.sweep||(VIS.sweep=mkOutfit("collector",null));o.skin="#c98a5c";o.mv=false;o.ph=0;o.mood="happy";o.face=-1;o.arm=null;o.bag=false;o.phone=false;drawPerson(x,y,o);
  const a=Math.sin(t*4)*.5;cx.strokeStyle="#8a5a33";cx.lineWidth=2;cx.beginPath();cx.moveTo(x-6,y-24);cx.lineTo(x-16+a*8,y);cx.stroke();cx.fillStyle="#d9b36c";cx.fillRect(x-22+a*8,y-3,12,4)}
function drawFountain(){const x=594,y=870,t=performance.now()/1000;cx.save();cx.globalAlpha=.8;for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=26+Math.sin(t*3+i)*3;cx.strokeStyle="rgba(220,245,255,.8)";cx.lineWidth=1.5;cx.beginPath();cx.moveTo(x,y-14);cx.quadraticCurveTo(x+Math.cos(a)*r*.6,y-34,x+Math.cos(a)*r,y+Math.sin(a)*r*.4);cx.stroke()}
  cx.strokeStyle="rgba(255,255,255,.5)";cx.lineWidth=1;[0,1,2].forEach(k=>{const r=((t*14+k*14)%42);cx.beginPath();cx.ellipse(x,y,r,r*.5,0,0,7);cx.stroke()});cx.restore()}
function drawSwings(){const t=performance.now()/1000;[[-270,800],[-230,800]].forEach(([x,y],i)=>{const a=Math.sin(t*2+i*1.4)*.6,ox=Math.sin(a)*20;cx.strokeStyle="#555";cx.lineWidth=1;cx.beginPath();cx.moveTo(x,762);cx.lineTo(x+ox,y-20);cx.stroke();
  if(S.phase!=="closed"){const o=VIS["sw"+i]||(VIS["sw"+i]=mkOutfit("kid",null));o.skin="#f2c9a0";o.mv=false;o.ph=0;o.mood="happy";o.face=0;o.arm="up";o.bag=false;o.phone=false;o.sc=.75;drawPerson(x+ox,y,o)}})}
function drawColeKids(){if(S.phase==="closed")return;const t=performance.now()/1000;for(let i=0;i<4;i++){const o=VIS["ck"+i]||(VIS["ck"+i]=mkOutfit("kid",null));o.skin=["#f2c9a0","#a9714b","#e0a878","#7a4a2b"][i];o.mv=true;o.ph=t*12+i;o.mood="happy";o.face=Math.cos(t*.8+i*2)>0?1:-1;o.arm=null;o.bag=false;o.phone=false;o.sc=.75;
  drawPerson(1180+90+Math.sin(t*.8+i*2)*60,830+Math.cos(t*.6+i)*40,o)}}
/* ----- tienda rival ----- */
function drawRival(){
  const R=S.rival;if(!R||(!R.on&&!R.closed))return;const x=816,y=738,w=268;
  cx.fillStyle=R.on?"#7b2cbf":"#555";cx.fillRect(x+8,y+2,w-16,13);txt(R.on?"⚡ CARTAS EL RAYO":"CERRADO",x+w/2,y+12,10,"#fff","center");
  if(R.on){for(let i=0;i<w-16;i+=14){cx.fillStyle=(i/14)%2?"#7b2cbf":"#ffd54a";cx.fillRect(x+8+i,y+16,14,9)}
    if(R.promo){const t=performance.now()/1000;cx.fillStyle=Math.sin(t*4)>0?"#e3350d":"#ff7a1a";rr(x+w/2-62,y+30,124,13,3);cx.fill();txt(`¡OFERTA ${setName(R.promo.s).slice(0,12).toUpperCase()}!`,x+w/2,y+40,8,"#fff","center")}}
}
/* ----- furgoneta de reparto ----- */
function updVan(dt){
  const d=hasState()&&S.deliv;if(!d)return;let v=VIS.van;
  if(!v&&d.length){v=VIS.van={x:-160,y:637,dir:1,sp:150,v:150,van:true,st:"in",t:0,len:62,col:"#f4f4f4"};VIS.cars=VIS.cars||[];VIS.cars.push(v)}
  if(!v)return;
  if(v.st==="in"&&v.x>=410){v.st="unload";v.t=2.4;v.v=0;tone(520,0,.12,"square",.03);tone(520,.18,.12,"square",.03)}
  if(v.st==="unload"){v.t-=dt;v.v=0;if(v.t<=0){deliverNow();v.st="out"}}
  if(v.st==="out"&&v.x>CX1+60){VIS.cars=VIS.cars.filter(c=>c!==v);VIS.van=null}
}
function drawVanExtras(v){if(!v||v.st!=="unload")return;const k=1-v.t/2.4,ph=(k*2)%1,go=Math.floor(k*2)%2===0,px=v.x-10+(358-(v.x-10))*(go?ph:1-ph),py=622+(578-622)*(go?ph:1-ph);
  const o=VIS.drv||(VIS.drv=Object.assign(mkOutfit("collector",null),{shirt:"#e07a2f",hat:"cap",hatc:"#e07a2f"}));o.skin="#c98a5c";o.mv=true;o.ph=performance.now()/80;o.mood="happy";o.face=go?-1:1;o.arm=null;o.bag=false;o.phone=false;drawPerson(px,py,o);if(go){cx.fillStyle="#c49a5a";rr(px-8,py-38,16,13,2);cx.fill();cx.fillStyle="#8a6a3a";cx.fillRect(px-8,py-33,16,2)}}
function drawVan(c){const L=c.len,x=c.x-L/2,y=c.y-12;cx.fillStyle="rgba(0,0,0,.3)";rr(x+3,y+4,L,24,6);cx.fill();cx.fillStyle="#f4f4f4";rr(x,y,L,24,5);cx.fill();cx.fillStyle="#e07a2f";cx.fillRect(x+4,y+9,L-24,6);cx.fillStyle="#1d2633";rr(x+L-18,y+3,14,18,3);cx.fill();txt("MAYORISTA",x+(L-20)/2,y+21,6,"#2a2f3a","center");cx.fillStyle="#fff6c0";cx.fillRect(x+L-3,y+2,3,4);cx.fillRect(x+L-3,y+18,3,4)}
/* ----- calle transversal: coches en vertical ----- */
function updVCars(dt){
  VIS.vT=(VIS.vT||2)-dt;VIS.vcars=VIS.vcars||[];
  if(VIS.vT<=0){VIS.vT=4+Math.random()*5;if(VIS.vcars.length<3){const dir=Math.random()<.5?1:-1;VIS.vcars.push({x:dir>0?XS0+18:XS1-18,y:dir>0?CY0-60:CY1+60,dir,sp:90,v:90,col:pick(["#e3350d","#3f7fc4","#f2b705","#2fa557","#eeeeee","#222"]),len:pick([46,50])})}}
  const st=tl();VIS.vcars.forEach(c=>{let tgt=c.sp;const fr=c.y+c.dir*c.len/2;if(st!=="r"){const stop=c.dir>0?566:742,dist=(stop-fr)*c.dir;if(dist>-3&&dist<80)tgt=dist<3?0:Math.min(tgt,dist*1.6)}
    VIS.vcars.forEach(o=>{if(o===c||o.dir!==c.dir)return;const gap=(o.y-c.y)*c.dir-(o.len+c.len)/2;if(gap>-5&&gap<60)tgt=Math.min(tgt,Math.max(0,(gap-12)*2))});
    c.v+=clamp(tgt-c.v,-240*dt,110*dt);c.y+=c.dir*c.v*dt});VIS.vcars=VIS.vcars.filter(c=>c.y>CY0-120&&c.y<CY1+120);
}
function drawVCar(c){cx.save();cx.translate(c.x,c.y);cx.rotate(c.dir>0?Math.PI/2:-Math.PI/2);drawCar(Object.assign({},c,{x:0,y:0,dir:1,bike:false,bus:false}));cx.restore()}
/* ----- mercadillo ----- */
const marketDay=()=>S.day%7===3;
function drawMarket(){if(!marketDay())return;const t=performance.now()/1000;[[420,770],[500,770],[660,770],[740,770],[440,930],[720,930]].forEach(([x,y],i)=>{const mine=i===0&&S.market&&S.market.day===S.day;
  cx.fillStyle="rgba(0,0,0,.2)";cx.fillRect(x+3,y+3,58,24);cx.fillStyle="#8a5a33";cx.fillRect(x,y,58,22);cx.fillStyle="#f4f4f4";for(let k=0;k<4;k++)cx.fillRect(x+4+k*14,y+5,10,13);
  for(let k=0;k<58;k+=10){cx.fillStyle=(k/10)%2?(mine?"#f2b705":["#e3350d","#3f7fc4","#2fa557","#8e4cb5","#e07a2f","#1abc9c"][i]):"#fff";cx.fillRect(x+k,y-14,10,10)}
  if(mine)txt("TU PUESTO",x+29,y-17,7,"#2a2000","center")});
  for(let i=0;i<8;i++){const o=VIS["mk"+i]||(VIS["mk"+i]=mkOutfit(pick(["kid","collector","whale","investor"]),null));o.skin=["#f2c9a0","#a9714b","#e0a878"][i%3];o.mv=true;o.ph=t*9+i;o.mood="happy";o.face=Math.cos(t*.4+i)>0?1:-1;o.arm=null;o.bag=i%3===0;o.phone=false;o.sc=1;
    drawPerson(420+(i*53+Math.sin(t*.4+i)*60+400)%360,820+((i*29)%90)+Math.sin(t*.5+i)*8,o)}}
function mkMarketLots(){if(VIS.mlots&&VIS.mlots.day===S.day)return VIS.mlots.l;const l=[0,1,2].map(()=>{makeLot(null);const L=LOT;L.n=Math.min(L.n,30+rnd(30));L.cards=L.cards.slice(0,L.n);L.v=L.cards.reduce((a,x)=>a+x.v,0);L.ask=Math.max(5,r05(L.v*(.45+Math.random()*.35)));L.floor=r05(L.ask*.85);L.lo=L.v*.5;L.hi=L.v*1.6;L.offer=L.ask;return L});LOT=null;VIS.mlots={day:S.day,l};return l}

/* ----- ampliación ----- */
{const base=LAY.shelf;LAY.shelf=i=>{const m=3+3*S.up.shelf;return i<m?base(i):{x:-258,y:i-m?170:46,w:150,h:54}}}
function drawAnnex(){
  cx.fillStyle="rgba(0,0,0,.22)";cx.fillRect(-276,FLOOR_T,6,FRONT_Y-FLOOR_T);cx.fillStyle="#7d8794";cx.fillRect(-6,FLOOR_T,12,16);cx.fillRect(-6,FRONT_Y-44,12,44);
  const t=performance.now()/1000,hue=(t*40)%360;cx.fillStyle="#111";rr(-200,6,96,32,3);cx.fill();cx.fillStyle=`hsl(${hue},70%,55%)`;cx.fillRect(-196,9,88,26);pokeball(-152,22,7);EMIS.push({x:-196,y:9,w:88,h:26,c:`hsl(${hue},70%,60%)`,a:.6});
  cx.fillStyle="#3f7fc4";rr(-246,330,200,110,14);cx.fill();cx.strokeStyle="#f2b705";cx.lineWidth=3;cx.stroke();txt("ZONA DE JUEGO",-146,324,10,"#1b1f2a","center");
  [[-215,365,"#e3350d"],[-150,405,"#f2b705"],[-85,362,"#2fa557"]].forEach(([x,y,c])=>{cx.fillStyle="rgba(0,0,0,.2)";cx.beginPath();cx.ellipse(x+2,y+8,16,6,0,0,7);cx.fill();cx.fillStyle=c;cx.beginPath();cx.ellipse(x,y,16,12,0,0,7);cx.fill();cx.fillStyle="rgba(255,255,255,.3)";cx.beginPath();cx.ellipse(x-4,y-4,6,4,0,0,7);cx.fill()});
}
function mAnnex(){return S.annex?`<h2>🏗️ Ampliación</h2><div class="pn">¡Ya es tuya! La antigua panadería es parte de tu tienda: 2 estanterías más y la zona de juego.</div>`:`<h2>🏗️ Se vende: la panadería</h2><div class="pn"><p>La panadería de al lado cierra y vende el local. Si lo compras, tiramos la pared y tu tienda crece:</p><div class="tip">🗄️ +2 estanterías para sobres</div><div class="tip">🎮 Zona de juego con tele y pufs: +10 % clientes</div><div class="tip">🏬 Más espacio y más prestigio</div></div><button class="b pri big" data-a="annexbuy"${S.money<4000||level()<3?" disabled":""}>Comprar el local · 4.000 €</button>${level()<3?'<p class="mu">Necesitas nivel 3.</p>':""}`}
/* ----- edificios de la calle ----- */
function mBank(){const L=S.loan;return `<h2>🏦 Banco</h2>${L&&L.left>0?`<div class="pn"><b>Préstamo activo</b><div>Te quedan por pagar <b>${fmt(L.left)}</b> (${fmt(L.daily)} cada noche).</div><div class="btns"><button class="b pri" data-a="loanpay"${S.money<L.left?" disabled":""}>Pagarlo todo ya (${fmt(L.left)})</button></div></div>`:`<p class="mu">Pide un préstamo para crecer más rápido. Lo devuelves en 10 días con un 12 % de intereses; se cobra solo cada noche.</p>${[500,1500,4000].map(a=>`<div class="pn row"><span><b>${fmt(a)}</b> · devuelves ${fmt(a*1.12)} (${fmt(a*1.12/10)}/día)</span><button class="b pri" data-a="loan" data-n="${a}"${a>=4000&&level()<3?" disabled":""}>Pedir</button></div>`).join("")}<p class="mu">El de 4.000 € requiere nivel 3.</p>`}`}
const CAFEL=["¿Has visto el precio del Charizard? ¡Está por las nubes!","Ayer abrí tres sobres y nada… ¡hoy seguro que sí!","Me falta solo una carta para completar el set.","Dicen que en la tienda de enfrente hay falsas…","Mi carta favorita es la que tiene brillos arcoíris.","El próximo torneo lo gano yo, ya verás."];
function mCafe(){const regs=REGS.filter(r=>S.regs[r.id]&&S.regs[r.id].met),cd=S.cafe&&S.cafe.day===S.day?S.cafe:(S.cafe={day:S.day,inv:[]});
  return `<h2>☕ Café de la esquina</h2><p class="mu">Tus habituales se toman aquí un café. Invítales y te lo agradecerán.</p>${regs.length?regs.map((r,i)=>{const s=regS(r.id),done=cd.inv.includes(r.id);return `<div class="pn" style="display:flex;gap:10px;align-items:center"><img class="rgimg" src="${regImg(r.id)}" alt=""><div style="flex:1;min-width:0"><b>${r.n}</b> <span style="font-size:12px">${hearts(s.loy)}</span><div class="mu">«${CAFEL[(i+S.day)%CAFEL.length]}»</div></div><button class="b ${done?"":"pri"}" data-a="cafeinv" data-k="${r.id}"${done||S.money<2?" disabled":""}>${done?"☕ ✔":"☕ 2 €"}</button></div>`}).join(""):'<p class="mu">Aún no conoces a ningún habitual. ¡Ya vendrán!</p>'}`}
function mCole(){const sp=S.school&&S.school.until>=S.day;return `<h2>🏫 Colegio</h2><div class="pn">Por la mañana los niños van al cole y a media tarde salen: a esas horas llegan más niños a la tienda. ¡Ten sobres a buen precio y accesorios!</div><div class="pn"><b>Patrocinar el torneo escolar</b><div class="mu">Durante 3 días vendrán muchos más niños y ganas reputación.</div><div class="btns"><button class="b pri" data-a="school"${sp||S.money<60?" disabled":""}>${sp?"Patrocinado hasta el día "+S.school.until:"Patrocinar · 60 €"}</button></div></div>`}
function mRival(){const R=S.rival;if(!R||(!R.on&&!R.closed))return `<h2>🏪 Local en alquiler</h2><p class="mu">Este local está vacío… por ahora.</p>`;if(R.closed)return `<h2>⚡ Cartas El Rayo</h2><div class="pn">¡La tienda rival cerró! El barrio es tuyo. 🏆</div>`;
  const shown=SETS.filter(sd=>S.slots.includes(sd.id)),pr=S.myPromo&&S.myPromo.day===S.day;
  const rows=shown.map(sd=>{const rp=r05(S.pack[sd.id].ref*R.price*(R.promo&&R.promo.s===sd.id?.85:1)),mp=S.shelf[sd.id];return `<tr><td>${sd.n}</td><td>${fmt(mp)}</td><td class="${mp<=rp?"up":"down"}">${fmt(rp)}</td></tr>`}).join("");
  return `<h2>⚡ Cartas El Rayo</h2><p class="mu">La tienda rival de enfrente. Si son más baratos, se llevan parte de tus clientes.</p><div class="pn"><div class="row"><b>Fuerza de la rival</b><span>${Math.round(R.str)} %</span></div><div class="prog"><i style="width:${R.str}%;background:linear-gradient(90deg,#8e4cb5,#e3350d)"></i></div>${R.promo?`<div class="down">Hoy tienen oferta en ${setName(R.promo.s)}.</div>`:""}<div class="mu">Ahora mismo te quitan ~${Math.round((1-rivalMul())*100)} % de los clientes.</div></div>
  ${rows?`<table class="tb"><tr class="mu"><td>Sobres</td><td>Tú</td><td>Ellos</td></tr>${rows}</table>`:""}
  <div class="pn"><b>Cómo ganarles</b><div class="tip">💸 Pon tus sobres más baratos que ellos: cada día que les ganas en precio pierden fuerza.</div><div class="tip">⭐ Sube tu reputación (encargos, torneos, álbum).</div><div class="tip">📣 Haz una oferta del día (−15 %) en el set de su promoción para robársela.</div></div>
  <div class="btns">${shown.map(sd=>`<button class="b" data-a="mypromo" data-k="${sd.id}"${pr?" disabled":""}>📣 Oferta en ${sd.n}</button>`).join("")}</div>${pr?`<p class="up">Oferta de hoy: −15 % en ${setName(S.myPromo.s)}</p>`:""}`}
const mkCand=()=>S.items.filter(i=>i.case==null&&!i.res&&!i.gq&&!i.fkK&&!i.lux&&!i.fav&&itemVal(i)>=.5).sort((a,b)=>itemVal(b)-itemVal(a)).slice(0,24);
const nextMarket=()=>{let d=S.day;while(d%7!==3)d++;return d};
function mMarket(){if(!marketDay())return `<h2>⛲ La plaza</h2><div class="pn">Cada semana hay mercadillo de cartas en la plaza. El próximo es el <b>día ${nextMarket()}</b>.</div>`;
  const mk=S.market&&S.market.day===S.day?S.market:null,lots=mkMarketLots(),sel=VIS.mksel||[];
  return `<h2>🧺 Mercadillo de la plaza</h2>${mk?`<div class="pn"><b>Tu puesto está montado</b><div class="mu">Llevas ${mk.items.length} carta(s) al ${Math.round(mk.mk*100)} % del mercado. Se venden a lo largo del día; el resultado sale en el ticket.</div></div>`:`<div class="pn"><b>Monta tu puesto (20 €)</b><div class="mu">Elige hasta 12 cartas guardadas (no las de la vitrina) y su precio.</div><div class="btns">${[1,1.1,1.2].map(m=>`<button class="b ${(VIS.mkm||1.1)===m?"on":""}" data-a="mkm" data-n="${m}">${Math.round(m*100)} %</button>`).join("")}</div><div class="tiles" style="margin-top:8px">${mkCand().map(it=>`<div class="tile${sel.includes(it.i)?" sel":""}" data-a="mksel" data-n="${it.i}">${face(BYID[it.c],it.rv)}<div class="pt">${fmt(itemVal(it))}</div></div>`).join("")||'<p class="mu">No tienes cartas guardadas de más de 0,50 €.</p>'}</div><button class="b pri big" data-a="mkgo"${!sel.length||S.money<20?" disabled":""}>Montar puesto con ${sel.length} carta(s) · 20 €</button></div>`}
  <h3>Lotes de otros puestos</h3>${lots.map((L,i)=>L.done?`<div class="pn mu">Lote ${i+1}: comprado ✔</div>`:`<div class="pn row"><span>📦 Lote de ${L.n} cartas · piden ${fmt(L.ask)}</span><button class="b pri" data-a="mklot" data-n="${i}">Ver lote</button></div>`).join("")}`}
function tapBuilding(x,y){if(G.M)return;const H=(a,b,c,d)=>x>=a&&x<=b&&y>=c&&y<=d;let k=null;
  if(trophyOn()&&H(TROPHY.x-6,TROPHY.x+TROPHY.w+6,TROPHY.y-74,TROPHY.y+TROPHY.d)){openM("trophy");return}
  if(!S.annex&&H(-282,-8,500,575))k="annex";else if(H(CX0,-290,500,612))k="cafe";else if(H(-106,118,738,806))k="bank";else if(H(380,808,738,CY1))k="market";else if(H(816,1084,738,806))k="rival";else if(H(XS1+6,CX1,738,CY1))k="cole";
  else if(H(690,770,556,606)){toast("🚌 Parada de autobús: el bus trae gente nueva al barrio");return}
  if(k){S.seenCity=1;openM(k)}}

/* ===================== V18: MÁS FÁCIL DE JUGAR ===================== */
Object.assign(ICON,{home:'<path d="M3 10l9-6 9 6"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',trophy:'<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8"/>',bell:'<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>'});
const NAVS=[["home","home","Tienda"],["packs","packs","Stock"],["coll","coll","Cartas"],["retos","trophy","Retos"],["more","more","Más"]];
function paintNav(){
  const n=$("#nav");if(n)n.innerHTML=NAVS.map(([k,ic,l])=>`<button data-a="nav" data-k="${k}" id="nav-${k}">${svgI(ic)}<span>${l}</span><i class="nb"></i></button>`).join("");
  const c=$("#cvctl");if(c)c.innerHTML=`<button data-a="pause" aria-label="Pausa">${paused?"▶":"⏸"}</button><button data-a="speed" aria-label="Velocidad">${speed}×</button>`;
  navAct();updBadges();
}
const SEC={packs:"packs",coll:"coll",card:"coll",album:"coll",grading:"coll",tasks:"retos",medals:"retos",story:"retos",games:"retos",mg:"retos",hunt:"retos",sell:"home",insp:"home",lot:"home",ck:"home",hag:"home",trade:"home",custc:"home",sum:"home",open:"home"};
function navAct(){const sec=G.M?(SEC[G.M]||"more"):"home";document.querySelectorAll("#nav [data-a=nav]").forEach(b=>b.classList.toggle("act",b.dataset.k===sec))}
function updBadges(){if(!hasState())return;const set=(k,n)=>{const e=$(`#nav-${k} .nb`);if(e){e.textContent=n>9?"9+":n;e.style.display=n?"flex":"none"}};
  set("retos",claimables());set("packs",SETS.filter(sd=>S.slots.includes(sd.id)&&S.sealed[sd.id]<1).length);
  const b=$("#bellN");if(b){const u=VIS.unread||0;b.textContent=u>9?"9+":u;b.style.display=u?"flex":"none"}}
const cardTabs=k=>{VIS.lastCards=k;if(k==="coll"&&collF==="fav")k="fav";return `<h2>🃏 Cartas</h2><div class="tabs t4">${[["coll","Colección"],["fav","❤️ Favoritas"],["album","📒 Álbum"],["grading","🔍 Gradeo"]].map(([x,n])=>`<button class="b ${x===k?"on":""}" ${x==="fav"?'data-a="cfav"':x==="coll"?'data-a="callc"':`data-a="m" data-k="${x}"`}>${n}</button>`).join("")}</div>`};
const retoTabs=k=>{VIS.lastReto=k;return `<h2>🏆 Retos</h2><div class="tabs t4">${[["tasks","📋 Tareas"],["medals","🏅 Medallas"],["story","📖 Historia"],["games","🎮 Juegos"]].map(([x,n])=>`<button class="b ${x===k?"on":""}" data-a="m" data-k="${x}">${n}</button>`).join("")}</div>`};
/* ----- Más ordenado ----- */
function mMore(){const T=(ic,l,a)=>`<button class="tilebtn" ${a}><span>${ic}</span>${l}</button>`,K=k=>`data-a="m" data-k="${k}"`,ui=S.ui||{};
  return `<h2>☰ Más</h2>
  <h3>🏪 Mi tienda</h3><div class="tgrid">${T("🛠️","Mejoras",K("up"))}${T("🎨","Personalizar",K("custom"))}${T("🗂️","Colecciones",K("sets"))}${T("📈","Mercado",K("mkt"))}${T("🏗️","Ampliar",K("annex"))}${T("📊","Estadísticas",K("stats"))}${T("🏆","Trofeos",K("trophy"))}${T("🔔","Avisos",K("notes"))}</div>
  <h3>⚙️ Ajustes</h3><div class="tgrid">${T(SOUND?"🔊":"🔇","Sonido: "+(SOUND?"sí":"no"),'data-a="sndtog"')}${T("🎵","Música: "+(MUSIC?"sí":"no"),'data-a="mustog"')}${T("🔠","Texto: "+(ui.big?"grande":"normal"),'data-a="uibig"')}${T("🌀","Animaciones: "+(ui.calm?"pocas":"todas"),'data-a="uicalm"')}${T("🎚️","Dificultad: "+DF().n,'data-a="diff"')}${T("⚡","Rendimiento: "+({auto:"auto",hi:"alto",lo:"ahorro"})[ui.perf||"auto"]+(!(ui.perf)&&VIS.autoLite?" (ahorro)":""),'data-a="perf"')}${T("📊","FPS: "+(ui.fps?"sí":"no"),'data-a="fpstog"')}${T("🗓️","Temporada: "+(S.season&&S.season!=="auto"?SEAS[S.season].replace(/^\S+\s/,""):"auto"),'data-a="seastog"')}${T("💾","Partida",K("backup"))}</div>
  <h3>❓ Ayuda</h3><div class="tgrid">${T("💡","Consejos",K("tips"))}${T("🎓","Tutorial",'data-a="tutre"')}${T("⤢","Ver tienda",'data-a="zreset"')}</div>
  <div class="pn" style="margin-top:12px"><div class="row"><span>⭐ Reputación</span><b>${repv()}</b></div><div class="mu">Sube vendiendo, con encargos, torneos y el álbum. Más reputación = más clientes.</div></div>`;
}
/* ----- colección: buscador, orden y ficha de carta ----- */
let collQ="",cSort="val";
const RORD2=["HR","SIR","UR","IR","DR","R","U","C"];
function collList(){
  let g=groups();if(collF==="case")g=g.filter(x=>x.its.some(i=>i.case!=null));if(collF==="top")g=g.filter(x=>itemVal(x.its[0])>=1);if(collF==="fav")g=g.filter(x=>x.its[0].fav);
  const q=collQ.trim().toLowerCase();if(q)g=g.filter(x=>x.c.name.toLowerCase().includes(q)||setName(x.c.s).toLowerCase().includes(q));
  if(cSort==="rar")g.sort((a,b)=>RORD2.indexOf(a.c.r)-RORD2.indexOf(b.c.r)||itemVal(b.its[0])-itemVal(a.its[0]));
  else if(cSort==="new")g.sort((a,b)=>Math.max(...b.its.map(i=>i.i))-Math.max(...a.its.map(i=>i.i)));
  else if(cSort==="name")g.sort((a,b)=>a.c.name.localeCompare(b.c.name));
  return g;
}
function tileHTML(x){const u=itemVal(x.its[0]),cis=x.its.filter(i=>i.case!=null&&!i.lux),inc=cis.length;
  return `<div class="tile${inc?" incase":""}" data-a="sel" data-k="${x.key}">${face(x.c,x.rv)}<div class="pt">${fmt(u)}</div>${x.its.length>1?`<div class="qt">×${x.its.length}</div>`:""}${inc?`<div class="vt">🏷️ EN VITRINA${inc>1?" ×"+inc:""}<b>${fmt(u*cis[0].case)}</b></div>`:""}${x.its[0].gr?`<div class="gb">PGS ${x.its[0].gr}</div>`:""}${x.its[0].gq?'<div class="vt" style="background:#3f7fc4">📮 EN GRADEO</div>':""}${x.its[0].fav?'<div class="fvb">❤️</div>':""}${x.its[0].fkK?'<div class="gb" style="background:#c0392b;color:#fff">FALSA</div>':""}${x.its.some(i=>i.lux)?'<div class="qt" style="background:#c9a227;left:auto;right:4px;top:26px">💎</div>':""}</div>`}
function collGrid(){const g=collList();VIS.cList=g.map(x=>x.key);if(!g.length)return `<p class="mu">${S.items.length?"Nada con este filtro.":"No hay cartas todavía. Abre sobres o compra cartas a los clientes."}</p>`;
  return `<div class="tiles">${g.slice(0,150).map(tileHTML).join("")}</div>${g.length>150?`<p class="mu">Mostrando 150 de ${g.length}. Usa el buscador.</p>`:""}`}
function mColl(){const tv=invValue(),tc=S.items.reduce((a,i)=>a+i.cost,0);
  return cardTabs("coll")+(collF==="fav"?favBanner():"")+`<div class="row"><span>${S.items.length} cartas · valor <b>${fmt(tv)}</b></span><span class="${cls(tv-tc)}">P/L ${tv>=tc?"+":""}${fmt(tv-tc)}</span></div>
  <input class="inp" data-i="csearch" placeholder="🔎 Buscar carta o colección…" value="${collQ.replace(/"/g,"")}" style="margin:8px 0">
  <div class="chips">${[["all","Todas"],["top","Valiosas"],["case",`🏷️ Vitrina (${caseItems().length})`],["fav",`❤️ Favoritas (${S.items.filter(i=>i.fav).length})`]].map(([k,n])=>`<button class="b ${collF===k?"on":""}" data-a="filt" data-k="${k}">${n}</button>`).join("")}</div>
  <div class="chips"><span class="mu" style="align-self:center">Ordenar:</span>${[["val","💰 Valor"],["rar","⭐ Rareza"],["new","🆕 Nuevas"],["name","🔤 Nombre"]].map(([k,n])=>`<button class="b ${cSort===k?"on":""}" data-a="csort" data-k="${k}">${n}</button>`).join("")}</div>
  <div id="cgrid">${collGrid()}</div><p class="mu">Toca una carta para ver sus opciones.</p>`}
function mCard(){
  const g=groups().find(x=>x.key===collSel);if(!g)return `<h2>🃏 Carta</h2><p class="mu">Ya no tienes esta carta.</p><button class="b pri big" data-a="m" data-k="coll">Volver a la colección</button>`;
  if(!VIS.cList||!VIS.cList.includes(g.key))VIS.cList=collList().map(x=>x.key);
  const isFav=!!g.its[0].fav,c=g.c,it=g.its[0],u=itemVal(it),inc=g.its.filter(i=>i.case!=null&&!i.lux),mk=inc.length?inc[0].case:1,cap=caseCap(),used=caseItems().length,L=VIS.cList,ix=L.indexOf(g.key),all=inc.length>=g.its.length;
  return `<div class="cnav"><button class="b" data-a="cprev"${ix<=0?" disabled":""}>◀</button><span class="mu">${ix>=0?(ix+1)+" de "+L.length:""}</span><button class="b" data-a="cnext"${ix<0||ix>=L.length-1?" disabled":""}>▶</button></div>
  <div class="cbig" id="cbig">${pcHTML(c,g.rv,false,0)}</div>
  <h2 style="text-align:center;padding:0;margin:10px 0 2px">${c.name}</h2><div class="mu" style="text-align:center">${RAR[c.r].n} · ${setName(c.s)} · ${it.gr?"PGS "+it.gr:g.k}${g.rv?" · Reverse":""}${g.its.length>1?" · tienes "+g.its.length:""}</div>
  <div class="pn" style="margin-top:10px"><div class="row"><span>Valor de mercado</span><b style="font-size:20px">${fmt(u)}</b></div><div class="row">${spark(c.id)}<span class="mu">7 d <span class="${cls(chg(c.id,7))}">${pct(chg(c.id,7))}</span> · 30 d <span class="${cls(chg(c.id,30))}">${pct(chg(c.id,30))}</span></span></div></div>
  ${it.fkK?'<div class="pn down">🚫 Falsificación detectada: no vale nada.</div>':""}${it.gq?'<div class="pn">📮 Esta carta está en el gradeo.</div>':""}
  ${inc.length?`<div class="pn"><div class="row"><b>🏷️ En vitrina${inc.length>1?" ×"+inc.length:""}</b><span class="step"><button class="b" data-a="mk" data-n="-.05">−</button><b>${fmt(u*mk)}</b><button class="b" data-a="mk" data-n=".05">+</button></span></div>${accTag(caseAcc(inc[0]))}</div>`:""}
  ${isFav?'<div class="pn favhd">❤️ <b>En tu colección personal.</b> <span class="mu">Protegida: no se vende ni va a la vitrina.</span></div>':""}
  <div class="cact"><button class="b ${all?"":"pri"} big3" data-a="${all?"caserem":"caseadd"}"${isFav||(!all&&(used>=cap||it.fkK||it.gq))?" disabled":""}>🏷️<span>${all?"Quitar de vitrina":"A la vitrina"}</span><small>${used}/${cap}</small></button>
  <button class="b go big3" data-a="sell1"${it.gq||isFav?" disabled":""}>💰<span>Vender 1</span><small>${fmt(it.fk&&!it.fkK?0:u*.85)}</small></button>
  <button class="b big3${VIS.cMore?" on":""}" data-a="cmore">⋯<span>Más</span><small>opciones</small></button></div>
  <button class="b favbtn${isFav?" on":""}" data-a="${isFav?"favrem":"favadd"}"${!isFav&&(it.fkK||it.gq||!g.its.some(i=>i.case==null&&!i.res&&!i.lux))?" disabled":""}>${isFav?"💔 Quitar de favoritas":`❤️ Guardar ${g.its.length>1?"1 ":""}en favoritas`}</button>
  ${VIS.cMore?`<div class="pn">${g.its.length>1?`<div class="btns"><button class="b go" data-a="sellall">💰 Vender todas (${g.its.length}) · ${fmt(u*.85*g.its.length)}</button></div>`:""}${inc.length&&!all?'<div class="btns"><button class="b" data-a="caserem">Quitar 1 de la vitrina</button></div>':""}${luxBtns(g)}${gradeBtns(g)}<div class="mu" style="margin-top:6px">Vender al mayorista paga el 85 % del valor de mercado.</div></div>`:""}`;
}
function bindCard(){const b=$("#cbig");if(!b)return;const pc=b.querySelector(".pc");TILT.el=pc;let x0=null;
  b.addEventListener("pointermove",ptTilt);b.addEventListener("pointerdown",e=>{x0=e.clientX;askGyro()});
  b.addEventListener("pointerup",e=>{if(x0==null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>50)A[dx<0?"cnext":"cprev"]()})}
/* ----- lista antes de abrir ----- */
function checklist(){
  const el=$("#chk");if(!el)return;const hn=$("#hint");if(!hasState()||S.phase!=="closed"||G.M||(S.tut&&S.tut.on)){el.innerHTML="";if(hn)hn.style.display="";return}if(hn)hn.style.display="none";
  const sh=SETS.filter(sd=>S.slots.includes(sd.id)),withS=sh.filter(sd=>S.sealed[sd.id]>0),out=sh.length-withS.length,ci=caseItems().length,cap=caseCap(),bad=withS.filter(sd=>packAcc(sd.id)<.7).length;
  const C=(cls,t,a)=>`<button class="ck ${cls}" ${a}>${t}</button>`;
  el.innerHTML=`<span class="mu">Antes de abrir:</span>`
    +(withS.length?C(out?"warn":"ok",out?`⚠️ ${out} estantería(s) sin sobres`:`✅ Sobres en estanterías`,'data-a="m" data-k="packs"'):C("bad","❌ Sin sobres a la venta",'data-a="m" data-k="packs"'))
    +C(ci===0?"bad":ci<cap/2?"warn":"ok",`${ci===0?"❌":ci<cap/2?"⚠️":"✅"} Vitrina ${ci}/${cap}`,'data-a="ckcase"')
    +(withS.length?C(bad?"warn":"ok",bad?`⚠️ ${bad} precio(s) caro(s)`:"✅ Precios bien",'data-a="m" data-k="packs"'):"")
    +(S.deliv&&S.deliv.length?C("warn","🚚 Pedido en camino",'data-a="m" data-k="packs"'):"");
}
/* ----- avisos ----- */
function mNotes(){VIS.unread=0;updBadges();const l=VIS.notes||[];const ago=t=>{const s=Math.round((Date.now()-t)/1000);return s<60?"hace "+s+" s":"hace "+Math.round(s/60)+" min"};
  return `<h2>🔔 Avisos</h2>${l.length?`<div class="pn">${l.map(n=>`<div class="tip">${n.t}<div class="mu" style="font-size:11px">${ago(n.at)}</div></div>`).join("")}</div>`:'<p class="mu">No hay avisos todavía.</p>'}`}
/* ----- primeras veces ----- */
const HINT1={packs:"Aquí compras sobres y pones sus precios. ✅ en la etiqueta significa que se venderán bien.",coll:"Estas son tus cartas. Toca una para ponerla en la vitrina o venderla.",tasks:"Encargos, misiones del día y logros. Cobra aquí las recompensas."};
/* ----- deshacer ----- */
function snap(){VIS.undo={items:JSON.stringify(S.items),money:S.money,orders:JSON.stringify(S.orders),at:Date.now()}}
/* ----- comodidad ----- */
function applyUI(){const u=(hasState()&&S.ui)||{};document.documentElement.classList.toggle("ui-big",!!u.big);document.documentElement.classList.toggle("ui-calm",!!u.calm)}

/* ===================== V20: FAVORITAS Y LADRONES ===================== */
function favBanner(){return `<div class="pn favhd"><b>❤️ Tu colección personal</b><div class="mu">Aquí guardas tus cartas favoritas. Están protegidas: no se venden, no van a la vitrina y no se usan en intercambios ni encargos.</div></div>`}
/* ----- ladrón ----- */
const theftOK=()=>DF().theft>0&&S.phase==="open"&&S.day>=3&&S.theftDay!==S.day&&!(S.tut&&S.tut.on)&&caseItems().filter(i=>!i.fav).length>=2;
function makeThief(c){c.thief=true;S.theftDay=S.day;c.out=Object.assign(mkOutfit("collector",null),{shirt:"#2b2f38",pants:"#1d2030",hat:"cap",hatc:"#111",bp:null,acc:null});c.want={k:"single"};const p=caseSpot();c.tx=p.x;c.ty=p.y}
function startTheft(c){
  const it=caseItems().filter(i=>!i.fav&&!i.res).sort((a,b)=>itemVal(b)*b.case-itemVal(a)*a.case)[0];if(!it){c.thief=false;return leave(c,false)}
  S.items.splice(S.items.indexOf(it),1);c.loot=it;c.run=true;c.sp=S.cams?115:150;c.st="leave";c.lv=0;c.ex=358+(Math.random()<.5?-1:1)*(560+rnd(120));c.ey=596;
  say(c,"💨");VIS.alarmT=performance.now()+3200;sfx.alarm();vibe([120,60,120]);
  toast(`🚨 ¡Un ladrón se lleva ${BYID[it.c].name}! Tócalo antes de que escape`,{nolog:1});
}
function catchThief(c){c.caught=true;S.lt.thCaught=(S.lt.thCaught||0)+1;c.run=false;c.sp=38;VIS.alarmT=0;const it=c.loot;c.loot=null;if(it)S.items.push(it);say(c,"😳");S.repB+=2;track("caught");starsAt(c.x,c.y-30,14);sfx.ach();vibe(40);
  toast(`👮 ¡Pillado! Recuperas ${it?BYID[it.c].name:"la carta"} · +2 ⭐`);hud()}
function thiefGone(c){if(c.caught||!c.loot)return;S.lt.thLost=(S.lt.thLost||0)+1;VIS.alarmT=0;why("thief");toast(`😞 El ladrón escapó con ${BYID[c.loot.c].name} (${fmt(itemVal(c.loot)*(c.loot.case||1))})`);sfx.err()}
function drawThiefFx(c){if(!c.run||c.caught)return;const t=performance.now()/1000,d=c.face||1;
  for(let i=0;i<4;i++){const k=((t*4+i/4)%1);cx.fillStyle=`rgba(200,200,200,${.45*(1-k)})`;cx.beginPath();cx.arc(c.x-d*(10+k*26),c.y-2-k*6,3+k*5,0,7);cx.fill()}
  cx.save();cx.translate(c.x+d*9,c.y-34);cx.rotate(d*.3);cx.fillStyle="#fff";cx.fillRect(-5,-7,10,14);cx.fillStyle="#f2b705";cx.fillRect(-4,-6,8,12);cx.restore();
  if(Math.sin(t*12)>0){cx.fillStyle="#e3350d";rr(c.x-7,c.y-66,14,16,4);cx.fill();txt("!",c.x,c.y-54,13,"#fff","center")}
}
function drawAlarm(){const r=VIS.alarmT||0,now=performance.now();if(r<now)return;const V=VIEW,a=.1+.12*(Math.sin(now/110)>0?1:0);
  const g=cx.createRadialGradient(V.cw/2,V.ch/2,Math.min(V.cw,V.ch)*.3,V.cw/2,V.ch/2,Math.max(V.cw,V.ch)*.7);g.addColorStop(0,"rgba(227,53,13,0)");g.addColorStop(1,`rgba(227,53,13,${a*2.2})`);cx.fillStyle=g;cx.fillRect(0,0,V.cw,V.ch)}
function drawCams(){if(!S.cams)return;const t=performance.now()/1000;[[24,58,1],[776,58,-1]].forEach(([x,y,d])=>{cx.fillStyle="#2b2f38";rr(x-8,y-6,16,10,3);cx.fill();cx.fillRect(x-1,y-12,2,6);cx.fillStyle=Math.sin(t*3)>0?"#ff3030":"#551010";cx.beginPath();cx.arc(x+d*5,y-1,1.8,0,7);cx.fill()})}


/* ===================== V21: DIFICULTAD Y RENDIMIENTO ===================== */
const LITE=()=>{const m=(hasState()&&S.ui&&S.ui.perf)||"auto";return m==="lo"||(m==="auto"&&!!VIS.autoLite)};
function perfTick(raw){if(!(raw>0))return;const f=1/Math.max(raw,1/240);VIS.fpsE=VIS.fpsE?VIS.fpsE*.95+f*.05:f;
  if(document.hidden||G.M)return;const m=(hasState()&&S.ui&&S.ui.perf)||"auto";if(m!=="auto"||VIS.autoLite)return;
  VIS.slowT=VIS.fpsE<38?(VIS.slowT||0)+raw:Math.max(0,(VIS.slowT||0)-raw*.5);
  if(VIS.slowT>4){VIS.autoLite=true;fitCanvas();toast("⚡ He activado el modo ahorro para que vaya más fluido (Más → Ajustes → Rendimiento)")}}
function mDiff(){return `<h2>🎚️ Dificultad</h2>${Object.keys(DIFFS).map(k=>`<div class="pn${(S.diff||"normal")===k?" favhd":""}"><div class="row"><b>${DIFFS[k].n}</b><button class="b ${(S.diff||"normal")===k?"":"pri"}" data-a="diffset" data-k="${k}"${(S.diff||"normal")===k?" disabled":""}>${(S.diff||"normal")===k?"Elegida ✔":"Elegir"}</button></div><div class="mu">${DIFFS[k].d}</div></div>`).join("")}<p class="mu">Puedes cambiarla cuando quieras.</p>`}
/* ===================== V22: TROFEOS Y ESTADÍSTICAS ===================== */
const TROPHY={x:36,y:316,w:104,d:28};
const admireSpot=()=>({x:TROPHY.x+TROPHY.w/2+rnd(30)-15,y:TROPHY.y+TROPHY.d+22+rnd(8)});
function drawTrophy(){
  const T=TROPHY,top=T.y-66,t=performance.now()/1000;
  box3d(T.x,T.y,T.w,T.d,16,"#4a3424","#2f2016");
  cx.fillStyle="#c9a227";cx.fillRect(T.x-2,top-2,T.w+4,70);cx.fillStyle="#13161e";cx.fillRect(T.x+2,top+2,T.w-4,62);
  const tl=trophies().slice(0,6);
  for(let i=0;i<6;i++){const x=T.x+8+(i%3)*31,y=top+6+Math.floor(i/3)*29,it=tl[i];
    if(it){const c=BYID[it.c],col=(RAR[c.r]&&RAR[c.r].c)||"#888";cx.fillStyle="#f4e2a0";cx.fillRect(x-1,y-1,22,27);cx.fillStyle=col;cx.fillRect(x,y,20,25);cx.fillStyle="rgba(255,255,255,.55)";cx.fillRect(x+3,y+3,14,9);
      if(Math.sin(t*2+i)>.6){cx.fillStyle="#fff";cx.fillRect(x+15,y+2,2,6);cx.fillRect(x+13,y+4,6,2)}}
    else{cx.strokeStyle="rgba(255,255,255,.15)";cx.lineWidth=1;cx.strokeRect(x,y,20,25)}}
  cx.fillStyle="rgba(170,215,240,.16)";cx.fillRect(T.x+2,top+2,T.w-4,62);cx.fillStyle="rgba(255,255,255,.25)";cx.beginPath();cx.moveTo(T.x+6,top+4);cx.lineTo(T.x+22,top+4);cx.lineTo(T.x+8,top+60);cx.lineTo(T.x+4,top+60);cx.fill();
  cx.fillStyle="#c9a227";rr(T.x+T.w/2-28,T.y+3,56,11,3);cx.fill();txt("🏆 TROFEOS",T.x+T.w/2,T.y+11,7,"#2a2000","center");
  EMIS.push({x:T.x+4,y:top+4,w:T.w-8,h:58,c:"#ffe9a8",a:.25});
}
function mTrophy(){const l=trophies(),tv=l.reduce((a,i)=>a+itemVal(i),0);
  return `<h2>🏆 Sala de trofeos</h2><div class="pn favhd"><div class="row"><span>${l.length} carta(s) · valor ${fmt(tv)}</span><b>+${trophyRep()} ⭐</b></div><div class="mu">Tus favoritas se exponen aquí. Los clientes vienen a admirarlas (${S.admire||0} visitas) y te dan reputación. Las 6 más valiosas se ven en la vitrina de la tienda.</div></div>
  ${l.length?`<div class="tiles">${l.map(it=>`<div class="tile" data-a="sel" data-k="${gk(it)}" style="outline:2px solid #c9a227;outline-offset:-1px">${face(BYID[it.c],it.rv)}<div class="pt">${fmt(itemVal(it))}</div><div class="fvb">❤️</div></div>`).join("")}</div>`:'<p class="mu">Aún no tienes favoritas. Abre una carta en Cartas y pulsa «❤️ Guardar en favoritas».</p>'}`}
let TOF=null;
function mTOffer(){const t=TOF,c=BYID[t.it.c];return `<h2>🤩 ¡Quieren tu trofeo!</h2><div class="cust"><div class="av">🧐</div><div class="sp">¡Me encanta tu ${c.name}! Te doy ${fmt(t.price)} por ella.</div></div><div class="trd" style="grid-template-columns:1fr"><div>${face(c,t.it.rv)}<b>Valor de mercado: ${fmt(itemVal(t.it))}</b></div></div><div class="pn"><b>Te ofrecen el ${Math.round(t.price/itemVal(t.it)*100)} % de su valor.</b><div class="mu">Es una de tus favoritas: tú decides si la vendes.</div></div><div class="btns"><button class="b go big" data-a="tofok">💰 Vender por ${fmt(t.price)}</button><button class="b big" data-a="tofno">❤️ Me la quedo</button></div>`}
/* ----- estadísticas ----- */
function svgLine(vals,col){if(vals.length<2)return '<p class="mu">Juega un par de días para ver la gráfica.</p>';const w=320,h=110,p=6,mx=Math.max(...vals),mn=Math.min(...vals),X=i=>p+i*(w-2*p)/(vals.length-1),Y=v=>h-p-(v-mn)/((mx-mn)||1)*(h-2*p);
  const d=vals.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)).join("");return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img"><path d="${d}L${X(vals.length-1)} ${h-p}L${X(0)} ${h-p}Z" fill="${col}2a"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(vals.length-1)}" cy="${Y(vals[vals.length-1])}" r="4" fill="${col}"/></svg>`}
function svgBars(a,b,ca,cb){if(!a.length)return '<p class="mu">Sin datos todavía.</p>';const w=320,h=110,p=4,n=a.length,mx=Math.max(1,...a.map((v,i)=>v+(b?b[i]:0))),bw=(w-2*p)/n;
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img">${a.map((v,i)=>{const x=p+i*bw+bw*.15,ww=bw*.7,ha=v/mx*(h-2*p),hb=b?b[i]/mx*(h-2*p):0;return `<rect x="${x}" y="${h-p-ha}" width="${ww}" height="${ha}" rx="2" fill="${ca}"/>${b?`<rect x="${x}" y="${h-p-ha-hb}" width="${ww}" height="${hb}" rx="2" fill="${cb}"/>`:""}`}).join("")}</svg>`}
function mStats(){const L=S.lt||{},H=(S.hist||[]).slice(-30),days=H.map(x=>x.d);
  const best=H.reduce((m,x)=>x.inc>(m?m.inc:-1)?x:m,null),bp=L.bestPullC&&BYID[L.bestPullC];
  const sold=Object.entries(L.setSold||{}).sort((a,b)=>b[1]-a[1]).slice(0,5),smax=sold.length?sold[0][1]:1;
  const K=(ic,n,v)=>`<div class="stc"><span>${ic}</span><b>${v}</b><small>${n}</small></div>`;
  return `<h2>📊 Estadísticas</h2><div class="stgrid">${K("📅","Días jugados",S.day-1)}${K("🧑‍🤝‍🧑","Clientes atendidos",L.served||0)}${K("🎴","Sobres vendidos",L.psold||0)}${K("✨","Sobres abiertos",L.packs||0)}${K("💰","Ventas totales",fmt(L.earned||0))}${K("🕵️","Falsas pilladas",L.caught||0)}${K("👮","Ladrones pillados",L.thCaught||0)}${K("😞","Robos sufridos",L.thLost||0)}${K("🏅","Medallas",medCount()+"/8")}</div>
  <h3>Valor de la empresa</h3><div class="pn">${svgLine(H.map(x=>x.net!=null?x.net:0).filter((v,i,a)=>H[i].net!=null),"#f2b705")}<div class="row mu"><span>${days.length?"Día "+days[0]:""}</span><span>${H.length&&H[H.length-1].net!=null?fmt(H[H.length-1].net):""}</span></div></div>
  <h3>Ventas por día</h3><div class="pn">${svgBars(H.map(x=>x.inc||0),null,"#2fd17a")}<div class="row mu"><span>${best?`Mejor día: el ${best.d} con ${fmt(best.inc)}`:""}</span></div></div>
  <h3>Clientes por día</h3><div class="pn">${svgBars(H.filter(x=>x.cust!=null).map(x=>x.cust-(x.lost||0)),H.filter(x=>x.cust!=null).map(x=>x.lost||0),"#3f8fd9","#e3350d")}<div class="mu"><span style="color:#3f8fd9">■</span> compraron · <span style="color:#e3350d">■</span> se fueron sin comprar</div></div>
  <h3>Sobres más vendidos</h3><div class="pn">${sold.length?sold.map(([k,v])=>`<div class="hb2"><span>${setName(k)}</span><i style="width:${v/smax*100}%"></i><b>${v}</b></div>`).join(""):'<p class="mu">Aún no has vendido sobres.</p>'}</div>
  ${bp?`<h3>Mejor carta sacada de un sobre</h3><div class="pn" style="display:flex;gap:12px;align-items:center"><div style="width:84px;flex:none">${face(bp,false)}</div><div><b>${bp.name}</b><div class="mu">${RAR[bp.r].n} · ${setName(bp.s)}</div><div class="up" style="font-family:var(--fd);font-size:20px">${fmt(L.bestPull)}</div></div></div>`:""}`}

/* ===================== ACCIONES ===================== */
function closeDeal(c,angry){if(c)leave(c,angry);deal=null;closeM()}
function finishDeal(p){
  if(S.money<p){toast("No tienes dinero suficiente");return}
  const d=deal;S.money-=p;S.stats.bought++;
  S.items.push({i:S.nid++,c:d.c.id,k:d.k,rv:d.rv,cost:p,case:null,res:false,fk:d.fake||undefined});S.dex[d.c.id]=1;loy(d.reg,3);track("buycard");if(p<=d.val*.75&&d.val>=1)track("goodbuy");
  toast(`Comprada ${d.c.name} por ${fmt(p)}`);
  const c=d.cust;c.hold=null;say(c,"❤️");queue.splice(queue.indexOf(c),1);c.st="leave";S.sales++;deal=null;closeM();
}
const grpItems=()=>S.items.filter(i=>gk(i)===collSel);
const A={
  m:d=>openM(d.k),
  close:()=>{if(G.M==="toffer"){A.tofno();return}if(G.M==="card"&&!(S.tut&&S.tut.on)){openM("coll");return}if(G.M==="trade"){A.tradeno();return}if(G.M==="mg")G.MG=null;if(G.M==="insp"){const src=INSP&&INSP.src;INSP=null;openM(src==="deal"&&deal?"sell":"coll");return}if(G.M==="sell"&&deal){closeDeal(deal.cust,false);return}if(G.M==="lot"){endLot();closeM();return}if(G.M==="ck")CK=null;if(G.M==="hag")HG=null;closeM()},
  ptab:d=>{pTab=d.k;if(pTab!=="packs"&&pF==="shelf")pF="stock";renderM()},
  pfilt:d=>{pF=d.k;renderM()},
  recp:d=>{S.shelf[d.k]=recPack(d.k);sfx.coin();renderM()},
  recq:d=>{S.pp[d.k]=recProd(d.k);sfx.coin();renderM()},
  recall:()=>{SETS.forEach(sd=>S.shelf[sd.id]=recPack(sd.id));Object.keys(S.prod||{}).forEach(pid=>{if(pInfo(pid))S.pp[pid]=recProd(pid)});ACC.forEach(a=>S.pp["acc:"+a.id]=recProd("acc:"+a.id));toast("🎯 Precios ajustados al recomendado");sfx.coin();renderM()},
  pp:d=>{S.pp[d.k]=Math.max(.25,Math.round((pPrice(d.k)+ +d.n)*100)/100);renderM()},
  buyprod:d=>{const i=pInfo(d.k),n=+d.n,c=i.w*n*(S.express?1.08:1);if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;if(S.express){S.prod[d.k]=pStock(d.k)+n;S.prodSeen=true}else{(S.deliv=S.deliv||[]).push({prod:{[d.k]:n}});toast("🚚 Pedido en camino: llega en la furgoneta")}sfx.coin();hud();renderM()},
  openprod:d=>{const i=pInfo(d.k);if(!i||pStock(d.k)<1)return;S.prod[d.k]--;S.sealed[i.s]+=i.packs;assignSlots();saveNow();hud();if(i.t==="box")track("boxopen");BOXO={i};openM("boxo")},
  inspd:()=>{const d=deal;d.tells=d.tells||mkTells(d.fake);d.wt=d.wt||mkWt(d.fake,d.tells);INSP={c:d.c,rv:d.rv,fake:!!d.fake,src:"deal",tells:d.tells,wt:d.wt,mode:"lens"};openM("insp")},
  inspc:()=>{const l=grpItems().filter(i=>!i.res&&!i.gq&&!i.fkK),it=l.find(i=>i.fk)||l[0];if(!it)return;it.tl=it.tl||mkTells(!!it.fk);it.wg=it.wg||mkWt(!!it.fk,it.tl);INSP={c:BYID[it.c],rv:it.rv,fake:!!it.fk,src:"coll",item:it.i,tells:it.tl,wt:it.wg,mode:"lens"};openM("insp")},
  imode:d=>{INSP.mode=d.k;sfx.flip();renderM()},
  iok:()=>{const src=INSP.src;INSP=null;if(src==="deal"){deal.chk=true;openM("sell")}else openM("coll")},
  ifake:()=>{
    const I=INSP;INSP=null;
    if(I.src==="deal"){const d=deal;
      if(d.fake){S.repB+=1;track("caught");toast("🕵️ ¡Bien visto! Era falsa · +1 ⭐");sfx.ach();loy(d.reg,-5,"Le pillaste intentando colarte una falsa");closeDeal(d.cust,false)}
      else{toast("😬 Era auténtica. Se ha ido ofendido");sfx.err();loy(d.reg,-10,"Le acusaste de vender una falsa (era buena)");closeDeal(d.cust,true)}
      return}
    const it=S.items.find(i=>i.i===I.item);if(it){S.items.splice(S.items.indexOf(it),1);if(it.fk){toast("🗑️ Tirada: era falsa. ¡Bien visto!");sfx.ach()}else{toast("😬 Has tirado una carta auténtica…");sfx.err()}}
    collSel=null;hud();openM("coll");
  },
  giftopen:()=>{const s=S.gift&&S.gift.set;closeM();if(s&&S.sealed[s]>0)A.open({k:s,n:"1"})},
  meset:d=>{S.me=Object.assign(meCfg(),{[d.k]:d.n});renderM()},
  petset:d=>{S.pet=d.k;if(d.k!=="none")petSound();renderM()},
  styset:d=>{S.style=d.k;renderM()},
  tradeok:()=>{const t=TRD;if(!t)return;const it=S.items.find(i=>i.i===t.mine);if(!it){A.tradeno();return}
    S.items.splice(S.items.indexOf(it),1);const nw=!S.dex[t.give];S.items.push({i:S.nid++,c:t.give,k:"NM",rv:false,cost:it.cost,case:null,res:false});S.dex[t.give]=1;
    loy(t.c.reg,6,"Os cambiasteis cartas");track("trade");const c=t.c;TRD=null;const qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.st="leave";say(c,"🤝");closeM();
    toast(`🔄 ¡Intercambio hecho! ${BYID[t.give].name}${nw?" · NUEVA para tu álbum":""}`);sfx.ach();checkAch()},
  tradeno:()=>{const t=TRD;TRD=null;if(t){const c=t.c,qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.st="leave";say(c,"👋")}closeM()},
  mgstart:d=>mgNew(d.k),
  mghl:d=>{const m=G.MG,ok=(price(m.a.id)>price(m.b.id))===(d.k==="a");m.ok+=ok?1:0;m.last=ok;m.step="show";ok?sfx.coin():sfx.err();renderM()},
  mgwho:d=>{const m=G.MG,ok=d.k===wname(m.c.name);m.ok+=ok?1:0;m.last=ok;m.step="show";ok?sfx.coin():sfx.err();renderM()},
  mgpick:d=>{const s=G.MG.sel,i=s.indexOf(d.k);if(i>=0)s.splice(i,1);else if(s.length<3)s.push(d.k);sfx.key();renderM()},
  mgduel:()=>{const m=G.MG,mine=m.sel.map(id=>BYID[id]),avg=mine.reduce((a,c)=>a+power(c),0)/3,pool=pool4(c=>Math.abs(power(c)-avg)<70);
    m.oppC=[0,1,2].map(()=>pick(pool.length?pool:CARDS));m.pw=[];m.bonus=[];
    const TES={Fire:"Fuego",Grass:"Planta",Water:"Agua",Lightning:"Eléctrico",Fighting:"Lucha",Psychic:"Psíquico",Darkness:"Siniestro",Metal:"Metal",Fairy:"Hada",Dragon:"Dragón",Colorless:"Incoloro"};
    mine.forEach((c,i)=>{let a=power(c),b=power(m.oppC[i]),t="";const ta=c.types&&c.types[0],tb=m.oppC[i].types&&m.oppC[i].types[0];
      if(ta&&tb&&TYPEW[ta]===tb){a=Math.round(a*1.3);t=`¡Ventaja de tipo! ${TES[ta]||ta} gana a ${TES[tb]||tb}`}else if(ta&&tb&&TYPEW[tb]===ta){b=Math.round(b*1.3);t=`Ventaja de tipo del rival: ${TES[tb]||tb} gana a ${TES[ta]||ta}`}m.pw.push([a,b]);m.bonus.push(t)});
    m.step="round";m.round=0;m.score=[0,0];const [a,b]=m.pw[0];if(a>b)m.score[0]++;else if(b>a)m.score[1]++;sfx.hit(1);renderM()},
  mgnext:()=>{const m=G.MG;
    if(m.k==="duel"){m.round++;if(m.round>=3){const w=m.score[0]>m.score[1];mgEnd("duel",`⚔️ Duelo contra ${RG(m.opp).n}`,`${m.score[0]} – ${m.score[1]}`,w,w?15:3);return}const [a,b]=m.pw[m.round];if(a>b)m.score[0]++;else if(b>a)m.score[1]++;sfx.hit(1);renderM();return}
    m.round++;if(m.round>=5){const w=m.ok>=4,e=m.ok*2+(m.ok===5?10:0);mgEnd(m.k,m.k==="hl"?"💰 ¿Cuál vale más?":"❓ ¿Quién es ese Pokémon?",`${m.ok}/5 aciertos`,w,e);return}
    if(m.k==="hl")mgHL();else mgWho();renderM()},
  exptog:()=>{S.express=!S.express;renderM()},
  annexbuy:()=>{if(S.annex||S.money<4000||level()<3)return;S.money-=4000;S.annex=true;assignSlots();BGk=-1;CITYk="";NG.sig="";closeM();shake(10);for(let i=0;i<6;i++)setTimeout(()=>starsAt(-140+rnd(200)-100,300+rnd(200),14),i*150);toast("🏗️ ¡Tienda ampliada! Mira a la izquierda: 2 estanterías más y zona de juego");sfx.ach();hud()},
  loan:d=>{const a=+d.n;if(S.loan&&S.loan.left>0)return;S.loan={left:r05(a*1.12),daily:r05(a*1.12/10)};S.money+=a;toast(`🏦 Préstamo de ${fmt(a)} concedido`);sfx.chaching();hud();renderM()},
  loanpay:()=>{const L=S.loan;if(!L||S.money<L.left)return;S.money-=L.left;L.left=0;toast("🏦 Préstamo pagado. ¡Sin deudas!");sfx.ach();hud();renderM()},
  cafeinv:d=>{if(S.money<2)return;const cd=S.cafe;if(cd.inv.includes(d.k))return;S.money-=2;cd.inv.push(d.k);loy(d.k,6,"Le invitaste a un café");toast(`☕ ${RG(d.k).n} te lo agradece`);sfx.coin();hud();renderM()},
  school:()=>{if(S.money<60)return;S.money-=60;S.school={until:S.day+2};S.repB+=2;toast("🏫 ¡Torneo escolar patrocinado! Vendrán más niños");sfx.ach();hud();renderM()},
  mypromo:d=>{S.myPromo={day:S.day,s:d.k};toast(`📣 Oferta del día: −15 % en ${setName(d.k)}`);sfx.coin();renderM()},
  mkm:d=>{VIS.mkm=+d.n;renderM()},
  mksel:d=>{const s=VIS.mksel=VIS.mksel||[],n=+d.n,i=s.indexOf(n);if(i>=0)s.splice(i,1);else if(s.length<12)s.push(n);renderM()},
  mkgo:()=>{const sel=VIS.mksel||[];if(!sel.length||S.money<20)return;S.money-=20;S.market={day:S.day,items:sel.slice(),mk:VIS.mkm||1.1};sel.forEach(id=>{const it=S.items.find(i=>i.i===id);if(it)it.res=true});VIS.mksel=[];toast("🧺 ¡Puesto montado en la plaza!");sfx.coin();hud();renderM()},
  mklot:d=>{const L=mkMarketLots()[+d.n];if(!L||L.done)return;LOT=L;openM("lot")},
  nav:d=>{const k=d.k;if(k==="home"){if(G.M)closeM();VIEW.mode="auto";VIEW.user=0;return}openM(k==="retos"?(VIS.lastReto||"tasks"):k==="coll"?(VIS.lastCards||"coll"):k)},
  csort:d=>{cSort=d.k;renderM()},
  cmore:()=>{VIS.cMore=!VIS.cMore;renderM()},
  cprev:()=>{const L=VIS.cList||[],i=L.indexOf(collSel);if(i>0){collSel=L[i-1];VIS.cMore=false;sfx.page();renderM()}},
  cnext:()=>{const L=VIS.cList||[],i=L.indexOf(collSel);if(i>=0&&i<L.length-1){collSel=L[i+1];VIS.cMore=false;sfx.page();renderM()}},
  ckcase:()=>{collF="case";VIS.lastCards="coll";openM("coll")},
  seen:d=>{(S.seen=S.seen||{})[d.k]=1;renderM()},
  undo:()=>{const u=VIS.undo;if(!u||Date.now()-u.at>9000){toast("Ya no se puede deshacer",{nolog:1});return}S.items=JSON.parse(u.items);S.money=u.money;S.orders=JSON.parse(u.orders);VIS.undo=null;$("#toast").innerHTML="";toast("↩️ Deshecho",{nolog:1});sfx.coin();hud();if(G.M)renderM()},
  uibig:()=>{S.ui=Object.assign({},S.ui,{big:!(S.ui&&S.ui.big)});applyUI();renderM()},
  uicalm:()=>{S.ui=Object.assign({},S.ui,{calm:!(S.ui&&S.ui.calm)});applyUI();renderM()},
  favadd:()=>{const it=grpItems().find(i=>i.case==null&&!i.res&&!i.lux&&!i.gq&&!i.fkK);if(!it)return;it.fav=true;collSel=gk(it);VIS.cList=null;toast(`❤️ ${BYID[it.c].name} guardada en tu colección personal`);sfx.ach();renderM()},
  favrem:()=>{const l=grpItems();if(!l.length)return;l.forEach(i=>i.fav=false);collSel=gk(l[0]);VIS.cList=null;toast("💔 Quitada de favoritas");renderM()},
  cfav:()=>{collF="fav";VIS.lastCards="coll";openM("coll")},
  callc:()=>{if(collF==="fav")collF="all";VIS.lastCards="coll";openM("coll")},
  buycams:()=>{if(S.cams||S.money<250)return;S.money-=250;S.cams=true;toast("📹 Cámaras instaladas: menos robos");sfx.chaching();hud();renderM()},
  diff:()=>openM("diff"),
  diffset:d=>{S.diff=d.k;toast(`🎚️ Dificultad: ${DF().n}`);renderM();hud()},
  perf:()=>{const o=["auto","hi","lo"],c=(S.ui&&S.ui.perf)||"auto";S.ui=Object.assign({},S.ui,{perf:o[(o.indexOf(c)+1)%3]});if(S.ui.perf!=="auto")VIS.autoLite=false;fitCanvas();renderM()},
  fpstog:()=>{S.ui=Object.assign({},S.ui,{fps:!(S.ui&&S.ui.fps)});renderM()},
  tofok:()=>{const t=TOF;if(!t)return;const i=S.items.indexOf(t.it);if(i>=0){S.items.splice(i,1);S.money+=t.price;track("earn",t.price);toast(`💰 Vendiste tu trofeo ${BYID[t.it.c].name} por ${fmt(t.price)}`);sfx.chaching()}TOF=null;closeM();hud()},
  tofno:()=>{if(TOF){say(TOF.c,"😢 ¡Vaya!");S.repB+=0}TOF=null;closeM();toast("❤️ Te quedas tu trofeo")},
  savebtn:()=>{const ok=saveNow();if(ok){toast("💾 Partida guardada · "+new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}));sfx.coin()}if(G.M==="backup")renderM()},
  export:()=>{saveNow();const b=new Blob([exportStr()],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`pokemon-card-shop-dia${S.day}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast("⬇️ Copia descargada")},
  importf:()=>$("#impfile").click(),
  copycode:()=>{const code=btoa(unescape(encodeURIComponent(exportStr())));const done=()=>toast("📋 Código copiado. Guárdalo en tus notas");
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code).then(done).catch(()=>{$("#impcode").value=code;toast("Selecciona y copia el código del cuadro")});else{$("#impcode").value=code;toast("Selecciona y copia el código del cuadro")}},
  importc:()=>importData($("#impcode").value),
  reset:()=>{if(!confirm("¿Borrar la partida y empezar de cero? No se puede deshacer."))return;newState();custs=[];queue=[];saveNow();closeM();hud();toast("Partida nueva")},
  sndtog:()=>{SOUND=!SOUND;try{localStorage.setItem("pcs-sound",SOUND?"1":"0")}catch(e){}renderM()},
  mustog:()=>{if(!SOUND){SOUND=true;try{localStorage.setItem("pcs-sound","1")}catch(e){}}setMusic(!MUSIC);renderM()},
  zreset:()=>{closeM();A.zfit()},
  zin:()=>zoomAt(VIEW.s*1.25,VIEW.cw/2,VIEW.ch/2),
  zout:()=>zoomAt(VIEW.s/1.25,VIEW.cw/2,VIEW.ch/2),
  zfit:()=>{const V=VIEW;if(V.mode==="auto"||V.mode==="manual"){V.mode="fit";V.s=V.shop;toast("🗺️ Toda la tienda")}else if(V.mode==="fit"){V.mode="city";V.s=Math.max(V.min,V.shop*.6);toast("🏙️ Vista de la calle")}else{V.mode="auto";V.s=V.cover;toast("🎥 Cámara automática")}V.user=0;const c=V.mode==="city"?[W/2,(CY0+CY1)/2]:[W/2,H*.45];V.ox=V.cw/2-c[0]*V.s;V.oy=V.ch/2-c[1]*V.s;clampView()},
  retrysets:()=>retrySets(),
  setlist:()=>refreshSetList(true),
  albset:d=>{albS=d.k;albPg=0;renderM()},
  albnext:()=>albTurn(1),
  albprev:()=>albTurn(-1),
  seastog:()=>{const k=Object.keys(SEAS),i=k.indexOf(S.season||"auto");S.season=k[(i+1)%k.length];toast("🗓️ Temporada: "+SEAS[S.season]+(S.season==="auto"?" ("+SEAS[season()]+")":""));renderM()},
  albclaim:d=>{const i=+d.n,s=albS,c=S.albR[s]=S.albR[s]||[],[t,m,r]=ALBR[i];if(c.includes(i)||albPct(s)<t)return;c.push(i);S.money+=m;S.repB+=r;toast(`📒 Premio del álbum: +${fmt(m)} y +${r} ⭐`);sfx.ach();checkAch();hud();renderM()},
  ttab:d=>{tTab=d.k;renderM()},
  mclaim:d=>{const m=S.dm.list[+d.n];if(!m||!m.done||m.cl)return;m.cl=1;S.money+=m.r;toast("💰 Misión cobrada: +"+fmt(m.r));sfx.coin();hud();renderM()},
  deliver:d=>{const o=S.orders.find(x=>x.id===+d.n);if(!o)return;const it=ownFor(o);if(!it)return;S.items.splice(S.items.indexOf(it),1);if(it.fk){S.repB=Math.max(0,S.repB-2);loy(o.reg,-20,"Le entregaste una carta falsa");toast(`😡 ${o.who} ha detectado que la carta es falsa · −2 ⭐`);sfx.err();hud();renderM();return}S.money+=o.pay;S.repB+=1;loy(o.reg,15,"Le conseguiste "+BYID[o.c].name);S.orders=S.orders.filter(x=>x!==o);toast(`📋 Encargo entregado a ${o.who}: +${fmt(o.pay)} y +1 ⭐`);sfx.chaching();track("order");hud();renderM()},
  decor:d=>{const x=DECOR.find(y=>y.k===d.k);if(!x||S.decor[x.k]||S.money<x.cost)return;S.money-=x.cost;S.decor[x.k]=1;toast(x.ic+" "+x.n+" colocado");sfx.coin();hud();renderM()},
  staff:d=>{S.staff[d.k]=!S.staff[d.k];toast(S.staff[d.k]?"Contratado: "+STAFF.find(s=>s.k===d.k).n:"Despedido: "+STAFF.find(s=>s.k===d.k).n);renderM()},
  grade:d=>{const sv=GSVC[d.k];if(S.money<sv.cost)return;const l=grpItems().filter(i=>!i.res&&!i.gq&&!i.gr),it=l.find(i=>i.case==null)||l[0];if(!it)return;it.case=null;it.gq={due:S.day+sv.days,svc:d.k};S.money-=sv.cost;collSel=null;toast(`📮 Enviada a gradear (${sv.n}). Llega en ${sv.days} día${sv.days>1?"s":""}`);hud();renderM()},
  grades:()=>openGrades(),
  tourtog:()=>{S.tour=!S.tour;renderM()},
  ckadd:d=>{CK.given.push(+d.n);+d.n>=500?sfx.bill():sfx.coin();renderM()},
  ckrem:d=>{CK.given.splice(+d.n,1);sfx.coin();renderM()},
  ckclr:()=>{CK.given=[];renderM()},
  ckgive:()=>{
    const k=CK,due=k.paid-k.tc,giv=k.given.reduce((a,b)=>a+b,0);
    if(giv<due){k.say=`¡Me falta cambio! Faltan ${fmt((due-giv)/100)} 😕`;sfx.err();renderM();return}
    let tip=0;
    if(giv>due)toast(`Has dado ${fmt((giv-due)/100)} de más`);
    else if(due>0){track("exact");loy(k.c.reg,2);if(Math.random()<(k.c.reg&&regS(k.c.reg).loy>60?.35:.12)){tip=Math.max(.2,r05(k.tc/100*.05));toast("🙏 Propina: +"+fmt(tip))}}
    finishCK((k.paid-giv)/100+tip);
  },
  ckkey:d=>{const k=CK;if(k.st!=="pay")return;sfx.key();k.msg="";if(d.k==="C")k.typed="";else if(d.k==="⌫")k.typed=k.typed.slice(0,-1);else if(k.typed.length<7)k.typed=(k.typed+d.k).replace(/^0+/,"");renderM()},
  ckok:()=>{
    const k=CK,v=+k.typed||0;if(k.st!=="pay"||!v)return;
    if(v>k.tc){k.err=1;k.msg="IMPORTE RECHAZADO";k.say="¡Eh! Eso es más de lo que cuesta 😒";k.typed="";sfx.err();renderM();setTimeout(()=>{if(CK===k)k.err=0},400);return}
    k.st="tap";k.msg="ACERQUE LA TARJETA";sfx.key();renderM();
    setTimeout(()=>{if(CK!==k)return;k.st="ok";k.msg="APROBADO";sfx.ok();renderM();
      setTimeout(()=>{if(CK!==k)return;if(v<k.tc)toast("Has cobrado "+fmt((k.tc-v)/100)+" de menos");track("cardpay");finishCK(v/100)},950)},850);
  },
  hgacc:()=>{loy(HG.c.reg,3);dealHg(HG.offer)},
  hgcnt:()=>{const h=HG;if(h.x<=h.max){h.msg="¡Trato hecho!";dealHg(h.x);return}h.tries++;sfx.err();if(h.tries>=2){say(h.c,"😤");leave(h.c,true);HG=null;closeM();return}h.msg=pick(["Uff… es demasiado. ¿Algo menos?","No sé, no sé… baja un poco más."]);renderM()},
  hgfix:()=>{const h=HG;if(h.max>=h.full*.95||Math.random()<.35){dealHg(h.full);return}say(h.c,"😤");leave(h.c,true);HG=null;closeM()},
  lotrev:d=>{const n=+d.n,L=LOT;let c=n===10?10:35;if(n===10&&L.free){c=0;L.free=false}if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;lotReview(n);sfx.flip();hud();renderM()},
  lotexp:()=>{const c=expCost();if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;LOT.expert=true;sfx.ach();hud();renderM()},
  lotbuy:()=>lotBuy(LOT.ask),
  lotcnt:()=>lotBuy(LOT.counter),
  lotoff:()=>{const L=LOT,o=L.offer;if(o>=L.floor){lotBuy(o);return}if(!L.tries){L.tries=1;L.counter=r05(L.floor*1.03);L.msg=`Por menos de ${fmt(L.counter)} no lo vendo.`;sfx.err();renderM();return}L.msg="";endLot();closeM();toast("El coleccionista se ha ido")},
  lotno:()=>{endLot();closeM()},

  speed:()=>{speed=speed===1?2:speed===2?4:1;paintNav()},
  custserve:()=>{closeM();serveFront()},
  luxadd:()=>{if(luxItems().length>=3)return;const it=grpItems().find(i=>!i.fav&&!i.lux&&!i.gq&&!i.fkK&&!i.res);if(!it)return;it.lux=true;if(it.case==null)it.case=1.2;sfx.coin();renderM()},
  luxrem:()=>{const it=grpItems().find(i=>i.lux&&!i.res);if(it){it.lux=false;it.case=null}renderM()},
  pause:()=>setPause(!paused),
  zoom:d=>zoom(d.k,d.n==="1"),
  nextc:()=>{const o=openState;if(!o.fl){o.fl=true}else{o.idx++;o.fl=false;if(o.idx>=o.cards.length)o.mode="sum"}renderM()},
  skip:()=>{openState.mode="sum";renderM()},
  addset:d=>{addSets([d.k])},
  addreco:()=>addSets(RECO.slice()),
  serf:d=>{setQ=d.k;renderM()},
  addseries:()=>{const n=setQ.trim();addSets(SETDEF.filter(x=>x.series===n).map(x=>x.id))},
  tutre:()=>{S.tut={on:true,i:0};closeM();toast("🎓 Tutorial reiniciado")},
  addsetOld:d=>{
    const sd=SETDEF.find(x=>x.id===d.k);if(!sd||S.sets.includes(sd.id))return;
    toast("Cargando "+sd.n+"…");
    fetchSetCards(sd).then(cs=>{
      if(!cs.length){toast("No se pudo cargar. Reintenta");return}
      cs.forEach(c=>c.s=sd.id);setCards(CARDS.filter(c=>c.s!==sd.id).concat(cs));indexCards();S.sets.push(sd.id);ensure();save();
      toast(sd.n+" añadida al catálogo");if(G.M==="sets")renderM();
    });
  },
  delset:d=>{S.sets=S.sets.filter(x=>x!==d.k);S.slots=S.slots.map(x=>x===d.k?null:x);ensure();if(G.M==="sets")renderM()},
  shelf:d=>{const s=d.k;S.shelf[s]=Math.max(.25,Math.round((S.shelf[s]+ +d.n)*100)/100);renderM()},
  buyp:d=>{const n=+d.n,ex=S.express||(S.tut&&S.tut.on),c=S.pack[d.k].w*n*(n>=36?.93:1)*(S.express?1.08:1);if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;if(ex){S.sealed[d.k]+=n;assignSlots()}else{(S.deliv=S.deliv||[]).push({sealed:{[d.k]:n}});toast("🚚 Pedido en camino: llega en la furgoneta")}hud();renderM()},
  open:d=>{
    const s=d.k,n=Math.min(+d.n,S.sealed[s]);if(n<1)return;
    if(!S.dex)S.dex={};
    const had=new Set(S.items.map(i=>i.c)),pulled=[],cpp=S.pack[s].w/10;
    for(let i=0;i<n;i++)roll(s).forEach(x=>{x.nw=!had.has(x.c.id)&&!S.dex[x.c.id];had.add(x.c.id);S.dex[x.c.id]=1;S.items.push({i:S.nid++,c:x.c.id,k:"NM",rv:x.rv,cost:cpp,case:null,res:false});pulled.push(x)});
    S.sealed[s]-=n;{let bv=0,bc=null;pulled.forEach(x=>{const v=price(x.c.id)*(x.rv?rvr(x.c):1);if(v>bv){bv=v;bc=x.c.id}});if(bv>(S.lt.bestPull||0)){S.lt.bestPull=bv;S.lt.bestPullC=bc}}track("open",n);if(pulled.some(x=>x.c.r==="SIR"||x.c.r==="HR"))track("bighit");
    const val=pulled.reduce((a,x)=>a+price(x.c.id)*(x.rv?rvr(x.c):1),0);
    const val1=x=>price(x.c.id)*(x.rv?rvr(x.c):1);
    const shown=n===1?pulled:pulled.slice().sort((a,b)=>val1(b)-val1(a)).slice(0,12);
    openState=n===1?{s,n,val,cards:pulled.map(x=>({c:x.c,rv:x.rv,nw:x.nw})),total:pulled.length,idx:0,mode:"seq",phase:"pack",run:0,tp:0,tb:0,tstep:0,torn:false,rev:false}:{s,n,val,cards:shown.map(x=>({c:x.c,rv:x.rv,nw:x.nw})),total:pulled.length,quick:true,mode:"sum"};
    hud();openM("open");
  },
  flip:(d,b)=>{
    if(b.classList.contains("on"))return;b.classList.add("on");openState.seen++;
    if(openState.seen>=openState.cards.length&&!openState.quick){const e=$("#osum");if(e)e.innerHTML=osum()}
  },
  revall:()=>{document.querySelectorAll(".fl").forEach(e=>e.classList.add("on"));openState.seen=openState.cards.length;$("#osum").innerHTML=osum()},
  filt:d=>{collF=d.k;renderM()},
  sel:d=>{collSel=d.k;VIS.cMore=false;openM("card")},
  sell1:()=>{const it=grpItems().find(i=>!i.res&&!i.gq&&!i.fav);if(!it)return;snap();let v=0;if(it.fk&&!it.fkK){toast("🚫 El mayorista detecta que es falsa: no te paga nada");sfx.err()}else{v=itemVal(it)*.85;S.money+=v}S.items.splice(S.items.indexOf(it),1);if(!grpItems().length)collSel=null;if(v)toast(`💰 Vendida por ${fmt(v)}`,{undo:1});sfx.coin();hud();renderM()},
  sellall:()=>{const gi=grpItems().filter(i=>!i.res&&!i.gq&&!i.fav),est=gi.reduce((a,i)=>a+(i.fk?0:itemVal(i)*.85),0);if(!gi.length)return;if((gi.length>3||est>20)&&!confirm(`¿Vender ${gi.length} cartas al mayorista por ${fmt(est)}?`))return;snap();let t=0,nf=0;const ids=new Set(gi.map(i=>i.i));S.items=S.items.filter(i=>{if(ids.has(i.i)){if(i.fk)nf++;else t+=itemVal(i)*.85;return false}return true});S.money+=t;if(nf)toast(`🚫 ${nf} eran falsas: el mayorista no las paga`);collSel=null;toast(`💰 Vendidas ${gi.length} cartas por ${fmt(t)}`,{undo:1});sfx.chaching();hud();renderM()},
  caseadd:()=>{if(caseItems().length>=caseCap())return;const it=grpItems().find(i=>i.case==null&&!i.gq&&!i.fkK&&!i.fav);if(!it)return;const inc=grpItems().find(i=>i.case!=null);it.case=inc?inc.case:1.02;renderM()},
  caserem:()=>{const it=grpItems().find(i=>i.case!=null&&!i.res&&!i.lux);if(it)it.case=null;renderM()},
  mk:d=>{grpItems().forEach(i=>{if(i.case!=null)i.case=clamp(Math.round((i.case+ +d.n)*100)/100,.6,1.6)});renderM()},
  upg:d=>{const u=UPS.find(x=>x.k===d.k),c=u.cost[S.up[d.k]];if(S.money<c)return;S.money-=c;S.up[d.k]++;assignSlots();hud();renderM()},
  dealask:()=>finishDeal(deal.ask),
  dealcounter:()=>finishDeal(deal.counter),
  dealno:()=>closeDeal(deal.cust,false),
  dealoffer:()=>{
    const d=deal,o=+($("[data-i=offer]").value);d.offer=o;
    if(o>=d.ask){finishDeal(d.ask);return}
    if(o>=d.floor){finishDeal(o);return}
    if(o>=d.floor*.85){d.counter=r05(d.floor);d.msg=`Mmm… por ${fmt(d.counter)} y cerramos.`;renderM();return}
    d.tries++;d.counter=0;
    if(d.tries>=2){say(d.cust,"😠");closeDeal(d.cust,true);return}
    d.msg="¡Eso es casi un insulto! Ofréceme algo razonable.";renderM();
  }
};
const I={csearch:el=>{collQ=el.value;const e=$("#cgrid");if(e)e.innerHTML=collGrid()},shopn:el=>{S.shopName=el.value.slice(0,22);hud()},hgx:el=>{HG.x=+el.value;$("#hglab").textContent=fmt(HG.x)},lotx:el=>{LOT.offer=+el.value;$("#lotlab").textContent=fmt(LOT.offer)},setq:el=>{setQ=el.value;const e=$("#setlist");if(e)e.innerHTML=setRows()},offer:el=>{deal.offer=+el.value;$("#olab").textContent=fmt(+el.value)}};
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b)return;
  if(b.classList.contains("ov")&&e.target!==b)return;
  const f=A[b.dataset.a];if(f)f(b.dataset,b);
});
document.addEventListener("input",e=>{const b=e.target.closest("[data-i]");if(b&&I[b.dataset.i])I[b.dataset.i](b)});

/* ===================== BUCLE ===================== */
let last=performance.now(),hudT=0,saveT=0;
function frame(now){
  const raw=Math.min(.05,(now-last)/1000);perfTick(raw);last=now;
  if(hasState()&&!G.M&&!paused){
    const dt=raw*speed;updFx(dt);updPfx(dt);updPed(dt);updCars(dt);updBirds(dt);updVan(dt);updVCars(dt);VIS.drawer=Math.max(0,(VIS.drawer||0)-dt);
    if(S.phase==="open"||S.phase==="closing"){
      if(S.phase==="open"){
        S.clock+=dt;spawnT-=dt;
        if(spawnT<=0){
          spawn();
          if(S.burst>0){S.burst--;spawnT=.8}
          else{const base=4.2/(1+repv()*.03)/(1+S.up.ads*.3)/spMul();spawnT=base*(.6+Math.random()*.8)}
        }
        if(S.clock>=DAYLEN)S.phase="closing";
      }
      updateCusts(dt);
      if(S.phase==="closing"&&!custs.some(c=>c.st!=="leave"||c.y<FRONT_Y+6)){if(!VIS.endAt){VIS.endAt=performance.now()+1400;sfx.shutter()}else if(performance.now()>VIS.endAt){VIS.endAt=0;endDay()}}
    }else updateCusts(dt);
    hudT+=raw;saveT+=raw;
    if(hudT>.25){hudT=0;hud()}
    if(saveT>10){saveT=0;saveNow()}
    camFollow(raw);updCat(dt);
  }
  if(hasState()&&VIS.mShown!=null&&Math.abs(S.money-VIS.mShown)>.004){const d=S.money-VIS.mShown;VIS.mShown=Math.abs(d)<.02?S.money:VIS.mShown+d*Math.min(1,raw*7);const el=$("#money");if(el&&el.firstChild){el.firstChild.nodeValue=fmt(VIS.mShown);if(d>.5&&!el.classList.contains("gain")){el.classList.add("gain");setTimeout(()=>el.classList.remove("gain"),520)}}}
  if(hasState()&&G.M==="mg"&&G.MG&&G.MG.k==="who"&&G.MG.step==="pick"){const e=$("#whoimg");if(e)e.style.filter=`blur(${Math.max(0,14-(performance.now()-G.MG.t0)/400).toFixed(1)}px) saturate(.6)`}
  if(hasState()&&G.M&&!paused){const d2=Math.min(.05,raw)*speed;updPed(d2);updCars(d2);updBirds(d2);updVan(d2);updVCars(d2)}
  if(hasState())draw();
  if(hasState())tutTick();
  requestAnimationFrame(frame);
}
window.addEventListener("beforeunload",()=>{if(hasState())saveNow()});
$("#impfile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>importData(r.result);r.readAsText(f);e.target.value=""});
document.addEventListener("keydown",e=>{if((e.code==="Space"||e.key==="p")&&!G.M&&hasState()&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();setPause(!paused)}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&hasState()&&S.phase!=="closed"&&!paused)setPause(true)});

/* ===================== ARRANQUE ===================== */
(function boot(){
  const txt=$("#loadtxt");
  let ids=DEFAULT_SETS;
  const sv=cget("pcs-save-real-v3")||cget("pcs-save-real-v2");
  if(sv&&sv.sets&&sv.sets.length)ids=sv.sets;
  loadSetList().then(list=>{
    if(list)list.forEach(mkSetDef);
    ids=ids.filter(i=>SETDEF.some(d=>d.id===i));if(!ids.length)ids=DEFAULT_SETS;
    txt.textContent="Cargando "+ids.length+" colecciones con precios de Cardmarket…";
    return loadMany(ids,(d,n,sd)=>{txt.textContent=`Cargando colecciones ${d}/${n} · ${sd.n}…`});
  }).then(all=>{
    if(all.length<100)throw 0;
    setCards(all);G.MODE="real";G.NOTE=FAILED.size?`⚠️ ${FAILED.size} colección(es) sin cargar: Más → Colecciones → Reintentar`:"Precios reales de Cardmarket";
  }).catch(()=>{
    if(cget("pcs-save-real-v3"))return new Promise(res=>{$("#load").innerHTML=`<div><h2>No se pudieron cargar las cartas</h2><p class="mu">La API de cartas no responde ahora mismo. Tu partida está guardada y no se pierde.</p><div class="btns" style="justify-content:center"><button class="b pri" id="lretry">Reintentar</button><button class="b" id="loff">Jugar sin conexión (partida aparte)</button></div></div>`;$("#lretry").onclick=()=>location.reload();$("#loff").onclick=()=>{setCards(offlineCards());G.MODE="offline";G.NOTE="Sin conexión: partida aparte con cartas ilustradas";res()}});
    setCards(offlineCards());G.MODE="offline";G.NOTE="Sin conexión con la API: cartas ilustradas y precios simulados";
  })
  .then(()=>{indexCards();loadOrNew();$("#load").remove();paintNav();fitCanvas();setMusic(MUSIC);hud();requestAnimationFrame(frame);refreshSetList(false);setTimeout(giftCheck,1500);if(FAILED.size)setTimeout(()=>toast(`⚠️ ${FAILED.size} colección(es) no cargaron. Reinténtalo en Más → Colecciones`),800)});
})();

/* ===================== ACCESO PARA LOS TESTS ===================== */
/* Lo que aún vive en este archivo se lee y escribe por su nombre (ver src/debug.js). */
export const __get=n=>eval(n),__set=(n,v)=>{eval(n+"=v")};
