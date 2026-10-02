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
import { W, H, LAY, FLOOR_T, FRONT_Y, CX0, CX1, CY0, CY1, LUX, AX, XS0, XS1, TROPHY, admireSpot } from "./world/layout.js";
import { NG, navSig, navObstacles, navBuild, navOk, navCell, navFree, navLOS, navPath, routeTo } from "./world/nav.js";
import { SHIRTS, PANTS, HAIRC, mkOutfit } from "./core/customers/outfit.js";
import { custs, queue, say, qpos, front, leave, updateCusts } from "./core/customers/move.js";
import { cid, bellT, spawn, pickProd, shelfSpot, caseSpot } from "./core/customers/spawn.js";
import { decide } from "./core/customers/decide.js";
import { pay, payWith, canHaggle } from "./core/customers/checkout.js";
import { loy, pickReg } from "./core/regulars.js";
import { theftOK, makeThief, startTheft, catchThief, thiefGone } from "./core/theft.js";
import { storyTick } from "./core/story.js";
import { closeDeal, finishDeal } from "./core/deals.js";
import { makeLot, lotEst, lotReview, expCost, lotBuy, endLot } from "./core/lots.js";
import { marketDay, mkMarketLots, mkCand, nextMarket } from "./core/market.js";
import { endDay } from "./core/day.js";
import { SHIRTC, HAIRC2, STYLES, PETS } from "./core/constants.js";
import { meCfg, shopName } from "./core/state.js";
import { $, CV, cx, rr, txt, IMGS, timg, lamp, pokeball, plant, box3d, packIcon, heart, star, fitS, VIS, LITE, perfTick } from "./render/canvas.js";
import { VIEW, clampView, fitCanvas, zoomAt, camFollow } from "./render/camera.js";
import { FX, fx, updFx, PFX, coinBurst, heartsAt, starsAt, updPfx, drawPfx, VIG, shake, drawThiefFx, drawAlarm, drawEvBanner } from "./render/effects.js";
import { buildBG, drawWall, drawShelf, drawDesk, drawProd, drawCase, drawCounter, drawDecorFloor, decorObjs, drawFrontWall, drawShutter, drawLux, drawTrophy, drawAnnex, drawCams, launchQ, drawLQ, drawHunt } from "./render/shop.js";
import { CAT, catSpots, updCat, drawCat, meow, drawPet, petSound } from "./render/pets.js";
import { drawHair, drawPerson, drawPersonAt, moodOf, drawCust, reflect, portrait, drawPed, drawDog, SKINS } from "./render/people.js";
import { CITYWIN, roofDraw, facadeDraw, drawTree, drawStreet, LAMPS, streetLamp, parkDraw, plazaDraw, coleDraw, buildCity, cityTrees, drawCross, drawBusStop, drawTerrace, drawSweeper, drawFountain, drawSwings, drawColeKids, drawRival, drawMarket, initBirds, updBirds, drawBird, updPed } from "./render/city.js";
import { tlT, tl, drawTL, updCars, drawCar, drawBike, drawVan, drawVanExtras, updVan, updVCars, drawVCar } from "./render/cars.js";
import { nightK, lighting, SUN, sunUpd, ambient } from "./render/lighting.js";
import { EMIS, BLM, emitStatic, bloom } from "./render/bloom.js";
import { streetFx } from "./render/weather.js";
import { draw } from "./render/draw.js";
import { HUNTS, huntDay } from "./core/minigames.js";
/* ===================== DATOS ===================== */

/* Sets: lista completa desde pokemontcg.io. Los 3 primeros conservan su id antiguo para no perder partidas. */
/* --- modo sin conexión --- */

/* ===================== ESTADO ===================== */


/* valor esperado y apertura según la época del set */
function evBreak(sid){
  const e=eraCfg(sid),R=[[e.C+" comunes",e.C*avgL(poolR(sid,"C"))],[e.U+" poco comunes",e.U*avgL(poolR(sid,"U"))]];
  if(e.rv)R.push(["1 reverse",rvAvg(sid)]);
  e.slot.forEach(([r,p])=>R.push([(p*100).toFixed(1).replace(".",",")+" % "+RAR[r].n,p*avgL(poolR(sid,r))]));
  return `<details><summary class="mu">Probabilidades y valor esperado</summary><p class="mu">${e.d}</p><table class="tb">${R.map(x=>`<tr><td>${x[0]}</td><td>${fmt(x[1])}</td></tr>`).join("")}<tr><td><b>Total</b></td><td><b>${fmt(R.reduce((a,x)=>a+x[1],0))}</b></td></tr></table></details>`;
}

/* ===================== CLIENTES ===================== */
function serveFront(){
  const c=front();if(!c||G.M||G.paused)return;
  if(c.want.k==="sell"){G.deal=c.deal;G.deal.cust=c;openM("sell");return}
  if(c.want.k==="lot"){makeLot(c);openM("lot");return}
  if(c.want.k==="trade"){TRD={c,mine:c.trade.mine,give:c.trade.give,say:pick(["¡Hola! ¿Me cambias esta carta? 🙏","Tengo una que te puede gustar…","¿Hacemos un cambio?"])};openM("trade");return}
  if(S.staff.cashier){pay(c);sfx.chaching();return}
  if(canHaggle(c))openHaggle(c);else openCheckout(c);
}

/* ===================== DIBUJO (base) ===================== */
/* ===================== DIBUJO 2.5D ===================== */
/* ----- ciudad ----- */
/* ----- personajes ----- */
/* ----- partículas ----- */

/* ===================== HUD ===================== */
/* ----- avisos de core por el bus ----- */
on("toast",(t,o)=>toast(t,o));on("sets",()=>{if(G.M==="sets")renderM()});
on("hud",()=>hud());on("renderM",()=>renderM());on("openM",t=>openM(t));on("closeM",()=>closeM());
on("sfx",(k,...a)=>sfx[k](...a));on("confetti",(...a)=>confetti(...a));
on("medal",id=>(VIS.medQ=VIS.medQ||[]).push(id));on("vis",o=>Object.assign(VIS,o));
on("fx",(...a)=>fx(...a));on("coinBurst",(...a)=>coinBurst(...a));on("heartsAt",(...a)=>heartsAt(...a));on("starsAt",(...a)=>starsAt(...a));
on("shake",v=>shake(v));on("vibe",p=>vibe(p));on("tone",(...a)=>tone(...a));
function toast(t,o){o=o||{};if(!o.nolog){VIS.notes=VIS.notes||[];VIS.notes.unshift({t,at:Date.now()});if(VIS.notes.length>40)VIS.notes.length=40;VIS.unread=(VIS.unread||0)+1;if(typeof updBadges==="function")updBadges()}
  const e=$("#toast");if(!e)return;const d=document.createElement("div");d.className="toast";d.innerHTML=t+(o.undo?' <button class="undo" data-a="undo">Deshacer</button>':"");if(o.undo)d.style.pointerEvents="auto";e.appendChild(d);while(e.children.length>2)e.firstChild.remove();setTimeout(()=>d.remove(),o.undo?7000:2600)}

function setPause(v){G.paused=v;paintNav();hud()}
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
  if(G.paused){a.disabled=false;a.textContent="⏸ En pausa · pulsa para continuar"}
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
  if(G.M)return;if(G.paused){setPause(false);return}const f=front();
  if(f)return serveFront();
  if(S.phase==="closed"){sfx.shutter();S.phase="open";S.clock=0;G.spawnT=1;S.burst=S.ev&&S.ev.t==="launch"?6:0;S.vipDone=false;
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
  $("#ovh").innerHTML=`<div class="ov${isNew?" in":""}"${lock?"":' data-a="close"'}><div class="sheet${G.M==="open"?" wide":""}${isNew?" in":""}"><div class="grab"></div><button class="xbtn" data-a="close" aria-label="Cerrar">✕</button>${body}<button class="b big" data-a="close">${G.M==="ck"?"Atender luego":G.M==="insp"?"Volver":G.M==="lot"&&!(G.LOT&&G.LOT.done)?"Rechazar y cerrar":"Cerrar"}</button></div></div>`;
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
  const d=G.deal,mn=r05(d.val*.3),mx=r05(d.val*1.1);
  return `<h2>${d.reg?RG(d.reg).e+" "+RG(d.reg).n+" quiere venderte":"Un cliente quiere vender"}</h2><div class="pn" style="display:flex;gap:12px"><div style="width:120px;flex:none">${face(d.c,d.rv)}</div><div style="flex:1"><b>${d.c.name}</b> <span class="mu">${d.k}${d.rv?" · Reverse":""}</span><div class="mu">${RAR[d.c.r].n} · ${setName(d.c.s)}</div><div>Valor de mercado: <b>${fmt(d.val)}</b></div><div>Pide: <b>${fmt(d.ask)}</b></div>${d.msg?`<div style="margin-top:8px;background:var(--panel2);border-radius:8px;padding:8px">🗣️ ${d.msg}</div>`:""}</div></div>
  ${!d.chk&&d.val>=2?'<div class="pn" style="border-color:#f2b705"><b>🕵️ ¡Ojo!</b> Algunas cartas que te ofrecen son falsas. Pulsa <b>🔍 Examinar</b> antes de pagar.</div>':""}${(()=>{const r=d.ask/d.val,tr=chg(d.c.id,7);return `<div class="pn"><div><b>${r<=.7?"🟢 Chollo":r<=.9?"🟡 Precio razonable":"🔴 Caro para revender"}</b> · pide el ${Math.round(r*100)} % del valor de mercado</div><div class="mu">Tendencia 7 días: <span class="${cls(tr)}">${pct(tr)}</span>. Para ganar revendiendo, ofrece como mucho ${fmt(r05(d.val*.75))} (75 %).${d.val<1?" Es una carta de poco valor: no compensa comprarla.":""}</div></div>`})()}
  <div class="pn"><div class="row"><span>Tu oferta</span><b id="olab">${fmt(d.offer)}</b></div><input type="range" data-i="offer" min="${mn}" max="${mx}" step="0.05" value="${clamp(d.offer,mn,mx)}"><div class="mu">Si compras por debajo de mercado, luego lo vendes con margen.</div>
  <div class="btns"><button class="b pri" data-a="dealoffer">Ofrecer</button><button class="b" data-a="dealask"${S.money<d.ask?" disabled":""}>Pagar lo que pide (${fmt(d.ask)})</button>${d.counter?`<button class="b pri" data-a="dealcounter"${S.money<d.counter?" disabled":""}>Cerrar por ${fmt(d.counter)}</button>`:""}<button class="b" data-a="inspd">🔍 Examinar${d.chk?" ✔":""}</button><button class="b" data-a="dealno">Rechazar</button></div></div>`;
}
/* ===================== APERTURA "WOW" ===================== */
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
let AC=null;
function ac(){if(!G.SOUND)return null;if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==="suspended")AC.resume();return AC}
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
    <div class="step"><button class="ib" id="pxsnd" aria-label="Sonido">${G.SOUND?"🔊":"🔇"}</button><button class="ib" id="pxskip">Saltar</button></div></div>
    <div class="dots" id="pxdots">${o.cards.map(()=>"<i></i>").join("")}</div>
    <div class="pxstage" id="pxst"><div class="rays" id="pxrays"></div></div>
    <div class="pxhint" id="pxhint"></div>
    <div class="flash" id="pxflash"></div></div>`;
  o.cards.forEach(y=>{if(y.c.img)new Image().src=big(y.c.img)});
  $("#pxsnd").onclick=e=>{G.SOUND=!G.SOUND;try{localStorage.setItem("pcs-sound",G.SOUND?"1":"0")}catch(_){}e.currentTarget.textContent=G.SOUND?"🔊":"🔇"};
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
let MUSIC=(()=>{try{return localStorage.getItem("pcs-music")==="1"}catch(e){return false}})(),musT=null,musN=0,musAt=0;
function musicTick(){
  if(!MUSIC||G.paused||document.hidden)return;const a=ac();if(!a||a.state!=="running")return;
  const now=a.currentTime;if(musAt<now)musAt=now+.05;
  const f=n=>261.63*Math.pow(2,n/12),CH=[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]];
  while(musAt<now+.6){const st=musN%16,ch=CH[Math.floor(musN/16)%4],t=musAt-now;
    if(st%8===0)tone(f(ch[0]-12),t,1,"sine",.045);
    if(st%2===0)tone(f(ch[(st/2)%4]+12),t,.35,"triangle",.016);
    musAt+=.25;musN++}
}
function setMusic(v){MUSIC=v;try{localStorage.setItem("pcs-music",v?"1":"0")}catch(e){}clearInterval(musT);if(v)musT=setInterval(musicTick,200)}

/* ----- vista de la tienda: zoom, arrastre y cámara ----- */
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


/* ----- caja: efectivo con cambio y TPV ----- */
let CK=null;
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
function openHaggle(c){c.hg=true;const full=r05(c.hold.total),offer=r05(full*(.74+Math.random()*.14));HG={c,full,offer,max:offer+(full-offer)*(.3+Math.random()*.7),x:r05((offer+full)/2),tries:0,msg:`¿Me la dejas en ${fmt(offer)}?`};openM("hag")}
function mHag(){
  const h=HG,it=h.c.hold.it,cd=BYID[it.c];
  return `<h2>Regateo</h2><div class="pn" style="display:flex;gap:12px"><div style="width:100px;flex:none">${face(cd,it.rv)}</div><div style="flex:1;min-width:0"><b>${cd.name}</b>${it.gr?` <span class="mu">PGS ${it.gr}</span>`:""}<div>En vitrina: <b>${fmt(h.full)}</b></div><div class="mu">Mercado: ${fmt(itemVal(it))}</div><div style="margin-top:8px;background:var(--panel2);border-radius:8px;padding:8px">🗣️ ${h.msg}</div></div></div>
  <div class="pn"><div class="row"><span>Tu contraoferta</span><b id="hglab">${fmt(h.x)}</b></div><input type="range" data-i="hgx" min="${h.offer}" max="${h.full}" step="0.05" value="${h.x}">
  <div class="btns"><button class="b" data-a="hgacc">Aceptar ${fmt(h.offer)}</button><button class="b pri" data-a="hgcnt">Contraofertar</button><button class="b" data-a="hgfix">Precio fijo</button></div></div>`;
}
function dealHg(v){const c=HG.c;c.hold.total=v;HG=null;openCheckout(c)}

/* ----- lotes misteriosos ----- */

function mLot(){
  const L=G.LOT;
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
  loadSetsFor(ns.sets).then(()=>{replaceState(ns);S.phase="closed";S.clock=0;custs.length=0;queue.length=0;ensure();saveNow();closeM();hud();toast("✅ Partida cargada")});
}

/* ===================== V6: PRODUCTOS, HABITUALES Y FALSIFICACIONES ===================== */
let pTab="packs";
let pF="all";
function packTabs(){return `${S.deliv&&S.deliv.length?`<div class="pn">🚚 En camino: ${delivSummary()}</div>`:""}<div class="row" style="margin-bottom:8px"><span class="mu">Entrega: ${S.express?"⚡ al momento (+8 %)":"🚚 furgoneta gratis (tarda unos segundos)"}</span><button class="b" data-a="exptog">Cambiar</button></div><div class="tabs">${[["packs","🎴 Sobres"],["sealed","🗃️ Sellado"],["acc","🛡️ Accesorios"]].map(([k,n])=>`<button class="b ${pTab===k?"on":""}" data-a="ptab" data-k="${k}">${n}</button>`).join("")}</div><button class="b pri" data-a="recall" style="width:100%;margin:2px 0 8px">🎯 Poner todo a precio recomendado</button><div class="chips">${[["all","Todos"],["stock","Con stock"]].concat(pTab==="packs"?[["shelf","En estanterías"]]:[]).map(([k,n])=>`<button class="b ${pF===k?"on":""}" data-a="pfilt" data-k="${k}">${n}</button>`).join("")}</div>`}
function prodRow(pid){
  const i=pInfo(pid);if(!i)return "";const q=pStock(pid),pr=pPrice(pid),st=pr>=20?1:pr>=5?.5:.25,buys=i.t==="acc"?[6,24]:i.t==="box"?[1,3]:[1,4];
  return `<div class="pn"><div class="row"><b>${i.ic} ${i.n}</b><span class="mu">Stock: <b>${q}</b></span></div><div class="row"><span class="mu">Mayorista ${fmt(i.w)} · clientes ~${fmt(i.ref)}${i.packs?` · ${i.packs} sobres`:""}</span><span class="step"><button class="b" data-a="pp" data-k="${pid}" data-n="-${st}">−</button><b>${fmt(pr)}</b><button class="b" data-a="pp" data-k="${pid}" data-n="${st}">+</button></span></div><div>${accTag(prodAcc(pid))}${Math.abs(pr-recProd(pid))>.04?` <button class="b" style="min-height:30px;padding:4px 10px;font-size:13px" data-a="recq" data-k="${pid}">🎯 ${fmt(recProd(pid))}</button>`:""}</div><div class="btns">${buys.map(n=>`<button class="b" data-a="buyprod" data-k="${pid}" data-n="${n}"${S.money<i.w*n?" disabled":""}>×${n} · ${fmt(i.w*n)}</button>`).join("")}${i.packs?`<button class="b pri" data-a="openprod" data-k="${pid}"${q<1?" disabled":""}>Abrir → ${i.packs} sobres</button>`:""}</div></div>`;
}

/* ----- clientes habituales ----- */
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
/* ----- gato de la tienda ----- */
/* ----- cola de lanzamiento ----- */
/* ----- peanas de lujo ----- */
/* ----- vida en la tienda: brillo, polvo y reflejos ----- */
/* ----- retrato y ficha de cliente ----- */
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
/* ----- sol, sombras y brillo ----- */
/* ----- semáforo, coches que paran, bicis, perros y pájaros ----- */

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
function mCustom(){const me=meCfg(),sw=(k,list)=>`<div class="sw">${list.map(c=>`<button class="swc${me[k]===c?" on":""}" style="background:${c}" data-a="meset" data-k="${k}" data-n="${c}" aria-label="${c}"></button>`).join("")}</div>`;
  return `<h2>🎨 Personalizar</h2><div class="pn"><b>Nombre de la tienda</b><input class="inp" data-i="shopn" maxlength="22" placeholder="Poké Cards" value="${(S.shopName||"").replace(/"/g,"")}" style="margin:6px 0 0"><div class="mu">Sale en el cartel, en el escaparate y en el ticket.</div></div>
  <div class="pn" style="display:flex;gap:12px;align-items:center"><img src="${portrait(Object.assign({pants:"#2c3350",shoes:"#141414",skin:"#f2c9a0",hat:"cap",hatc:me.cap,sc:1,seed:2},me))}" alt="" style="width:80px;height:100px;border-radius:12px;background:var(--panel2)"><div style="flex:1"><b>Tu tendero</b><div class="mu">Camiseta</div>${sw("shirt",SHIRTC)}<div class="mu">Gorra</div>${sw("cap",SHIRTC)}<div class="mu">Pelo</div>${sw("hair",HAIRC2)}</div></div>
  <div class="pn"><b>Mascota de la tienda</b><div class="btns">${Object.keys(PETS).map(k=>`<button class="b ${(S.pet||"cat")===k?"on":""}" data-a="petset" data-k="${k}">${PETS[k]}</button>`).join("")}</div></div>
  <div class="pn"><b>Estilo de la tienda</b><div class="btns">${Object.keys(STYLES).map(k=>`<button class="b ${(S.style||"clasico")===k?"on":""}" data-a="styset" data-k="${k}">${STYLES[k].c?`<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${STYLES[k].c};margin-right:6px;vertical-align:-1px"></span>`:""}${STYLES[k].n}</button>`).join("")}</div></div>`}
/* ----- intercambios con habituales ----- */
let TRD=null;
function mTrade(){const t=TRD,R=RG(t.c.reg),it=S.items.find(i=>i.i===t.mine),gc=BYID[t.give];if(!it||!gc)return `<h2>Intercambio</h2><p class="mu">Ya no tienes esa carta.</p>`;
  const mc=BYID[it.c],mv=itemVal(it),gv=price(gc.id),r=gv/Math.max(.01,mv);
  return `<h2>🔄 ${R.e} ${R.n} quiere cambiar</h2><div class="cust"><div class="av">${R.e}</div><div class="sp">${t.say}</div></div>
  <div class="trd"><div><div class="mu">Tú das</div>${face(mc,it.rv)}<b>${fmt(mv)}</b></div><div class="trx">⇄</div><div><div class="mu">Te llevas</div>${face(gc,false)}<b>${fmt(gv)}</b>${S.dex[gc.id]?"":'<em class="nwb">NUEVA</em>'}</div></div>
  <div class="pn" style="margin-top:10px"><b>${r>=1.15?"🟢 ¡Sales ganando!":r>=.85?"🟡 Cambio justo":"🔴 Sales perdiendo"}</b>${S.dex[gc.id]?"":`<div class="mu">Es una carta que aún no tienes en el álbum.</div>`}</div>
  <div class="btns"><button class="b pri big" data-a="tradeok">¡Trato hecho!</button><button class="b big" data-a="tradeno">No, gracias</button></div>`}
/* ----- búsqueda del tesoro ----- */
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
function mStory(){const st=story(),prev=CHAP[st.done],cur=CHAP[st.ch],p=chapProg();
  const prevBox=prev&&!st.seenEnd?`<div class="pn"><b>✅ Capítulo completado: ${prev.t}</b><p>${prev.e}</p><div class="up">+${fmt(prev.r)} · +1 ⭐</div></div>`:"";st.seenEnd=true;
  return retoTabs("story")+`<div class="cust"><img src="${guideImg()}" alt="" style="width:60px;height:76px;border-radius:12px;background:#ffe9a8"><div class="sp">${cur?cur.i:"¡Has completado toda la historia! Eres una leyenda."}</div></div>${prevBox}
  ${cur?`<div class="pn"><b>Capítulo ${st.ch+1}/${CHAP.length}: ${cur.t}</b>${p.map(x=>`<div class="row" style="margin-top:6px"><span>${x.n}</span><span>${x.v}/${x.g}</span></div><div class="prog"><i style="width:${x.v/x.g*100}%"></i></div>`).join("")}<div class="mu">Premio: ${fmt(cur.r)}</div></div>`:""}`}
function storyBadge(){const el=$("#stb");if(!el)return;const st=hasState()&&!(S.tut&&S.tut.on)?story():null,c=st&&CHAP[st.ch];if(!c){el.style.display="none";return}const p=chapProg(),x=p.find(q=>q.v<q.g)||p[0];el.style.display="block";el.innerHTML=`📖 <b>${c.t}</b> · ${x.n}: ${x.v}/${x.g}`}

/* ===================== V16: CIUDAD VIVA ===================== */
/* ----- tienda rival ----- */
/* ----- furgoneta de reparto ----- */
/* ----- calle transversal: coches en vertical ----- */
/* ----- mercadillo ----- */

/* ----- ampliación ----- */
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
  const c=$("#cvctl");if(c)c.innerHTML=`<button data-a="pause" aria-label="Pausa">${G.paused?"▶":"⏸"}</button><button data-a="speed" aria-label="Velocidad">${G.speed}×</button>`;
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
  <h3>⚙️ Ajustes</h3><div class="tgrid">${T(G.SOUND?"🔊":"🔇","Sonido: "+(G.SOUND?"sí":"no"),'data-a="sndtog"')}${T("🎵","Música: "+(MUSIC?"sí":"no"),'data-a="mustog"')}${T("🔠","Texto: "+(ui.big?"grande":"normal"),'data-a="uibig"')}${T("🌀","Animaciones: "+(ui.calm?"pocas":"todas"),'data-a="uicalm"')}${T("🎚️","Dificultad: "+DF().n,'data-a="diff"')}${T("⚡","Rendimiento: "+({auto:"auto",hi:"alto",lo:"ahorro"})[ui.perf||"auto"]+(!(ui.perf)&&VIS.autoLite?" (ahorro)":""),'data-a="perf"')}${T("📊","FPS: "+(ui.fps?"sí":"no"),'data-a="fpstog"')}${T("🗓️","Temporada: "+(S.season&&S.season!=="auto"?SEAS[S.season].replace(/^\S+\s/,""):"auto"),'data-a="seastog"')}${T("💾","Partida",K("backup"))}</div>
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


/* ===================== V21: DIFICULTAD Y RENDIMIENTO ===================== */
function mDiff(){return `<h2>🎚️ Dificultad</h2>${Object.keys(DIFFS).map(k=>`<div class="pn${(S.diff||"normal")===k?" favhd":""}"><div class="row"><b>${DIFFS[k].n}</b><button class="b ${(S.diff||"normal")===k?"":"pri"}" data-a="diffset" data-k="${k}"${(S.diff||"normal")===k?" disabled":""}>${(S.diff||"normal")===k?"Elegida ✔":"Elegir"}</button></div><div class="mu">${DIFFS[k].d}</div></div>`).join("")}<p class="mu">Puedes cambiarla cuando quieras.</p>`}
/* ===================== V22: TROFEOS Y ESTADÍSTICAS ===================== */
function mTrophy(){const l=trophies(),tv=l.reduce((a,i)=>a+itemVal(i),0);
  return `<h2>🏆 Sala de trofeos</h2><div class="pn favhd"><div class="row"><span>${l.length} carta(s) · valor ${fmt(tv)}</span><b>+${trophyRep()} ⭐</b></div><div class="mu">Tus favoritas se exponen aquí. Los clientes vienen a admirarlas (${S.admire||0} visitas) y te dan reputación. Las 6 más valiosas se ven en la vitrina de la tienda.</div></div>
  ${l.length?`<div class="tiles">${l.map(it=>`<div class="tile" data-a="sel" data-k="${gk(it)}" style="outline:2px solid #c9a227;outline-offset:-1px">${face(BYID[it.c],it.rv)}<div class="pt">${fmt(itemVal(it))}</div><div class="fvb">❤️</div></div>`).join("")}</div>`:'<p class="mu">Aún no tienes favoritas. Abre una carta en Cartas y pulsa «❤️ Guardar en favoritas».</p>'}`}

function mTOffer(){const t=G.TOF,c=BYID[t.it.c];return `<h2>🤩 ¡Quieren tu trofeo!</h2><div class="cust"><div class="av">🧐</div><div class="sp">¡Me encanta tu ${c.name}! Te doy ${fmt(t.price)} por ella.</div></div><div class="trd" style="grid-template-columns:1fr"><div>${face(c,t.it.rv)}<b>Valor de mercado: ${fmt(itemVal(t.it))}</b></div></div><div class="pn"><b>Te ofrecen el ${Math.round(t.price/itemVal(t.it)*100)} % de su valor.</b><div class="mu">Es una de tus favoritas: tú decides si la vendes.</div></div><div class="btns"><button class="b go big" data-a="tofok">💰 Vender por ${fmt(t.price)}</button><button class="b big" data-a="tofno">❤️ Me la quedo</button></div>`}
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
const grpItems=()=>S.items.filter(i=>gk(i)===collSel);
const A={
  m:d=>openM(d.k),
  close:()=>{if(G.M==="toffer"){A.tofno();return}if(G.M==="card"&&!(S.tut&&S.tut.on)){openM("coll");return}if(G.M==="trade"){A.tradeno();return}if(G.M==="mg")G.MG=null;if(G.M==="insp"){const src=INSP&&INSP.src;INSP=null;openM(src==="deal"&&G.deal?"sell":"coll");return}if(G.M==="sell"&&G.deal){closeDeal(G.deal.cust,false);return}if(G.M==="lot"){endLot();closeM();return}if(G.M==="ck")CK=null;if(G.M==="hag")HG=null;closeM()},
  ptab:d=>{pTab=d.k;if(pTab!=="packs"&&pF==="shelf")pF="stock";renderM()},
  pfilt:d=>{pF=d.k;renderM()},
  recp:d=>{S.shelf[d.k]=recPack(d.k);sfx.coin();renderM()},
  recq:d=>{S.pp[d.k]=recProd(d.k);sfx.coin();renderM()},
  recall:()=>{SETS.forEach(sd=>S.shelf[sd.id]=recPack(sd.id));Object.keys(S.prod||{}).forEach(pid=>{if(pInfo(pid))S.pp[pid]=recProd(pid)});ACC.forEach(a=>S.pp["acc:"+a.id]=recProd("acc:"+a.id));toast("🎯 Precios ajustados al recomendado");sfx.coin();renderM()},
  pp:d=>{S.pp[d.k]=Math.max(.25,Math.round((pPrice(d.k)+ +d.n)*100)/100);renderM()},
  buyprod:d=>{const i=pInfo(d.k),n=+d.n,c=i.w*n*(S.express?1.08:1);if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;if(S.express){S.prod[d.k]=pStock(d.k)+n;S.prodSeen=true}else{(S.deliv=S.deliv||[]).push({prod:{[d.k]:n}});toast("🚚 Pedido en camino: llega en la furgoneta")}sfx.coin();hud();renderM()},
  openprod:d=>{const i=pInfo(d.k);if(!i||pStock(d.k)<1)return;S.prod[d.k]--;S.sealed[i.s]+=i.packs;assignSlots();saveNow();hud();if(i.t==="box")track("boxopen");BOXO={i};openM("boxo")},
  inspd:()=>{const d=G.deal;d.tells=d.tells||mkTells(d.fake);d.wt=d.wt||mkWt(d.fake,d.tells);INSP={c:d.c,rv:d.rv,fake:!!d.fake,src:"deal",tells:d.tells,wt:d.wt,mode:"lens"};openM("insp")},
  inspc:()=>{const l=grpItems().filter(i=>!i.res&&!i.gq&&!i.fkK),it=l.find(i=>i.fk)||l[0];if(!it)return;it.tl=it.tl||mkTells(!!it.fk);it.wg=it.wg||mkWt(!!it.fk,it.tl);INSP={c:BYID[it.c],rv:it.rv,fake:!!it.fk,src:"coll",item:it.i,tells:it.tl,wt:it.wg,mode:"lens"};openM("insp")},
  imode:d=>{INSP.mode=d.k;sfx.flip();renderM()},
  iok:()=>{const src=INSP.src;INSP=null;if(src==="deal"){G.deal.chk=true;openM("sell")}else openM("coll")},
  ifake:()=>{
    const I=INSP;INSP=null;
    if(I.src==="deal"){const d=G.deal;
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
  annexbuy:()=>{if(S.annex||S.money<4000||level()<3)return;S.money-=4000;S.annex=true;assignSlots();G.BGk=-1;G.CITYk="";NG.sig="";closeM();shake(10);for(let i=0;i<6;i++)setTimeout(()=>starsAt(-140+rnd(200)-100,300+rnd(200),14),i*150);toast("🏗️ ¡Tienda ampliada! Mira a la izquierda: 2 estanterías más y zona de juego");sfx.ach();hud()},
  loan:d=>{const a=+d.n;if(S.loan&&S.loan.left>0)return;S.loan={left:r05(a*1.12),daily:r05(a*1.12/10)};S.money+=a;toast(`🏦 Préstamo de ${fmt(a)} concedido`);sfx.chaching();hud();renderM()},
  loanpay:()=>{const L=S.loan;if(!L||S.money<L.left)return;S.money-=L.left;L.left=0;toast("🏦 Préstamo pagado. ¡Sin deudas!");sfx.ach();hud();renderM()},
  cafeinv:d=>{if(S.money<2)return;const cd=S.cafe;if(cd.inv.includes(d.k))return;S.money-=2;cd.inv.push(d.k);loy(d.k,6,"Le invitaste a un café");toast(`☕ ${RG(d.k).n} te lo agradece`);sfx.coin();hud();renderM()},
  school:()=>{if(S.money<60)return;S.money-=60;S.school={until:S.day+2};S.repB+=2;toast("🏫 ¡Torneo escolar patrocinado! Vendrán más niños");sfx.ach();hud();renderM()},
  mypromo:d=>{S.myPromo={day:S.day,s:d.k};toast(`📣 Oferta del día: −15 % en ${setName(d.k)}`);sfx.coin();renderM()},
  mkm:d=>{VIS.mkm=+d.n;renderM()},
  mksel:d=>{const s=VIS.mksel=VIS.mksel||[],n=+d.n,i=s.indexOf(n);if(i>=0)s.splice(i,1);else if(s.length<12)s.push(n);renderM()},
  mkgo:()=>{const sel=VIS.mksel||[];if(!sel.length||S.money<20)return;S.money-=20;S.market={day:S.day,items:sel.slice(),mk:VIS.mkm||1.1};sel.forEach(id=>{const it=S.items.find(i=>i.i===id);if(it)it.res=true});VIS.mksel=[];toast("🧺 ¡Puesto montado en la plaza!");sfx.coin();hud();renderM()},
  mklot:d=>{const L=mkMarketLots()[+d.n];if(!L||L.done)return;G.LOT=L;openM("lot")},
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
  tofok:()=>{const t=G.TOF;if(!t)return;const i=S.items.indexOf(t.it);if(i>=0){S.items.splice(i,1);S.money+=t.price;track("earn",t.price);toast(`💰 Vendiste tu trofeo ${BYID[t.it.c].name} por ${fmt(t.price)}`);sfx.chaching()}G.TOF=null;closeM();hud()},
  tofno:()=>{if(G.TOF){say(G.TOF.c,"😢 ¡Vaya!");S.repB+=0}G.TOF=null;closeM();toast("❤️ Te quedas tu trofeo")},
  savebtn:()=>{const ok=saveNow();if(ok){toast("💾 Partida guardada · "+new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}));sfx.coin()}if(G.M==="backup")renderM()},
  export:()=>{saveNow();const b=new Blob([exportStr()],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`pokemon-card-shop-dia${S.day}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast("⬇️ Copia descargada")},
  importf:()=>$("#impfile").click(),
  copycode:()=>{const code=btoa(unescape(encodeURIComponent(exportStr())));const done=()=>toast("📋 Código copiado. Guárdalo en tus notas");
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code).then(done).catch(()=>{$("#impcode").value=code;toast("Selecciona y copia el código del cuadro")});else{$("#impcode").value=code;toast("Selecciona y copia el código del cuadro")}},
  importc:()=>importData($("#impcode").value),
  reset:()=>{if(!confirm("¿Borrar la partida y empezar de cero? No se puede deshacer."))return;newState();custs.length=0;queue.length=0;saveNow();closeM();hud();toast("Partida nueva")},
  sndtog:()=>{G.SOUND=!G.SOUND;try{localStorage.setItem("pcs-sound",G.SOUND?"1":"0")}catch(e){}renderM()},
  mustog:()=>{if(!G.SOUND){G.SOUND=true;try{localStorage.setItem("pcs-sound","1")}catch(e){}}setMusic(!MUSIC);renderM()},
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
  lotrev:d=>{const n=+d.n,L=G.LOT;let c=n===10?10:35;if(n===10&&L.free){c=0;L.free=false}if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;lotReview(n);sfx.flip();hud();renderM()},
  lotexp:()=>{const c=expCost();if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;G.LOT.expert=true;sfx.ach();hud();renderM()},
  lotbuy:()=>lotBuy(G.LOT.ask),
  lotcnt:()=>lotBuy(G.LOT.counter),
  lotoff:()=>{const L=G.LOT,o=L.offer;if(o>=L.floor){lotBuy(o);return}if(!L.tries){L.tries=1;L.counter=r05(L.floor*1.03);L.msg=`Por menos de ${fmt(L.counter)} no lo vendo.`;sfx.err();renderM();return}L.msg="";endLot();closeM();toast("El coleccionista se ha ido")},
  lotno:()=>{endLot();closeM()},

  speed:()=>{G.speed=G.speed===1?2:G.speed===2?4:1;paintNav()},
  custserve:()=>{closeM();serveFront()},
  luxadd:()=>{if(luxItems().length>=3)return;const it=grpItems().find(i=>!i.fav&&!i.lux&&!i.gq&&!i.fkK&&!i.res);if(!it)return;it.lux=true;if(it.case==null)it.case=1.2;sfx.coin();renderM()},
  luxrem:()=>{const it=grpItems().find(i=>i.lux&&!i.res);if(it){it.lux=false;it.case=null}renderM()},
  pause:()=>setPause(!G.paused),
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
  dealask:()=>finishDeal(G.deal.ask),
  dealcounter:()=>finishDeal(G.deal.counter),
  dealno:()=>closeDeal(G.deal.cust,false),
  dealoffer:()=>{
    const d=G.deal,o=+($("[data-i=offer]").value);d.offer=o;
    if(o>=d.ask){finishDeal(d.ask);return}
    if(o>=d.floor){finishDeal(o);return}
    if(o>=d.floor*.85){d.counter=r05(d.floor);d.msg=`Mmm… por ${fmt(d.counter)} y cerramos.`;renderM();return}
    d.tries++;d.counter=0;
    if(d.tries>=2){say(d.cust,"😠");closeDeal(d.cust,true);return}
    d.msg="¡Eso es casi un insulto! Ofréceme algo razonable.";renderM();
  }
};
const I={csearch:el=>{collQ=el.value;const e=$("#cgrid");if(e)e.innerHTML=collGrid()},shopn:el=>{S.shopName=el.value.slice(0,22);hud()},hgx:el=>{HG.x=+el.value;$("#hglab").textContent=fmt(HG.x)},lotx:el=>{G.LOT.offer=+el.value;$("#lotlab").textContent=fmt(G.LOT.offer)},setq:el=>{setQ=el.value;const e=$("#setlist");if(e)e.innerHTML=setRows()},offer:el=>{G.deal.offer=+el.value;$("#olab").textContent=fmt(+el.value)}};
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
  if(hasState()&&!G.M&&!G.paused){
    const dt=raw*G.speed;updFx(dt);updPfx(dt);updPed(dt);updCars(dt);updBirds(dt);updVan(dt);updVCars(dt);VIS.drawer=Math.max(0,(VIS.drawer||0)-dt);
    if(S.phase==="open"||S.phase==="closing"){
      if(S.phase==="open"){
        S.clock+=dt;G.spawnT-=dt;
        if(G.spawnT<=0){
          spawn();
          if(S.burst>0){S.burst--;G.spawnT=.8}
          else{const base=4.2/(1+repv()*.03)/(1+S.up.ads*.3)/spMul();G.spawnT=base*(.6+Math.random()*.8)}
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
  if(hasState()&&G.M&&!G.paused){const d2=Math.min(.05,raw)*G.speed;updPed(d2);updCars(d2);updBirds(d2);updVan(d2);updVCars(d2)}
  if(hasState())draw();
  if(hasState())tutTick();
  requestAnimationFrame(frame);
}
window.addEventListener("beforeunload",()=>{if(hasState())saveNow()});
$("#impfile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>importData(r.result);r.readAsText(f);e.target.value=""});
document.addEventListener("keydown",e=>{if((e.code==="Space"||e.key==="p")&&!G.M&&hasState()&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();setPause(!G.paused)}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&hasState()&&S.phase!=="closed"&&!G.paused)setPause(true)});

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
