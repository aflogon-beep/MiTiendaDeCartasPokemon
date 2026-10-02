// Acciones de la interfaz: objeto A (data-a) e I (data-i) y sus escuchadores.
import { $, VIS } from "../render/canvas.js";
import { ACC, ALBR, DECOR, GSVC, RECO, SEAS, STAFF, UPS } from "../core/constants.js";
import { BYID, CARDS, SETDEF, indexCards, setCards, setName } from "../core/cards/sets.js";
import { CY0, CY1, H, W } from "../world/layout.js";
import { DF } from "../core/difficulty.js";
import { G, S, SETS, assignSlots, ensure, meCfg, newState } from "../core/state.js";
import { MUSIC, setMusic, sfx } from "../audio/sfx.js";
import { NG } from "../world/nav.js";
import { RG, loy, regS } from "../core/regulars.js";
import { TYPEW, mgEnd, mgHL, mgNew, mgWho, pool4, power, wname } from "../core/minigames.js";
import { VIEW, clampView, fitCanvas, zoomAt } from "../render/camera.js";
import { addSets, fetchSetCards, refreshSetList, retrySets } from "../core/cards/api.js";
import { albPct, checkAch } from "../core/achievements.js";
import { albTurn } from "./screens/album.js";
import { applyUI, hud, setPause } from "./hud.js";
import { caseCap, caseItems, gk, itemVal, level, luxItems, pInfo, pPrice, pStock, price, recPack, recProd } from "../core/economy.js";
import { clamp, fmt, r05 } from "../core/util.js";
import { closeDeal, finishDeal } from "../core/deals.js";
import { closeM, openM, renderM, zoom } from "./modals.js";
import { collGrid } from "./screens/cards.js";
import { custs, leave, queue, say } from "../core/customers/move.js";
import { dealHg, finishCK, serveFront } from "./checkout.js";
import { endLot, expCost, lotBuy, lotReview } from "../core/lots.js";
import { exportStr, save, saveNow } from "../core/save.js";
import { importData, setRows } from "./screens/more.js";
import { mkMarketLots } from "../core/market.js";
import { mkTells, mkWt } from "../core/fakes.js";
import { openGrades } from "./screens/grading.js";
import { osum } from "./packOpening.js";
import { ownFor } from "../core/orders.js";
import { paintNav } from "./nav.js";
import { petSound } from "../render/pets.js";
import { pick, rnd } from "../core/rng.js";
import { roll } from "../core/packs.js";
import { rvr } from "../core/cards/prices.js";
import { season } from "../core/events.js";
import { shake, starsAt } from "../render/effects.js";
import { toast } from "./toast.js";
import { track } from "../core/missions.js";
export function snap(){VIS.undo={items:JSON.stringify(S.items),money:S.money,orders:JSON.stringify(S.orders),at:Date.now()}}
export const grpItems=()=>S.items.filter(i=>gk(i)===G.collSel);
export const A={
  m:d=>openM(d.k),
  close:()=>{if(G.M==="toffer"){A.tofno();return}if(G.M==="card"&&!(S.tut&&S.tut.on)){openM("coll");return}if(G.M==="trade"){A.tradeno();return}if(G.M==="mg")G.MG=null;if(G.M==="insp"){const src=G.INSP&&G.INSP.src;G.INSP=null;openM(src==="deal"&&G.deal?"sell":"coll");return}if(G.M==="sell"&&G.deal){closeDeal(G.deal.cust,false);return}if(G.M==="lot"){endLot();closeM();return}if(G.M==="ck")G.CK=null;if(G.M==="hag")G.HG=null;closeM()},
  ptab:d=>{G.pTab=d.k;if(G.pTab!=="packs"&&G.pF==="shelf")G.pF="stock";renderM()},
  pfilt:d=>{G.pF=d.k;renderM()},
  recp:d=>{S.shelf[d.k]=recPack(d.k);sfx.coin();renderM()},
  recq:d=>{S.pp[d.k]=recProd(d.k);sfx.coin();renderM()},
  recall:()=>{SETS.forEach(sd=>S.shelf[sd.id]=recPack(sd.id));Object.keys(S.prod||{}).forEach(pid=>{if(pInfo(pid))S.pp[pid]=recProd(pid)});ACC.forEach(a=>S.pp["acc:"+a.id]=recProd("acc:"+a.id));toast("🎯 Precios ajustados al recomendado");sfx.coin();renderM()},
  pp:d=>{S.pp[d.k]=Math.max(.25,Math.round((pPrice(d.k)+ +d.n)*100)/100);renderM()},
  buyprod:d=>{const i=pInfo(d.k),n=+d.n,c=i.w*n*(S.express?1.08:1);if(S.money<c){toast("No tienes dinero suficiente");return}S.money-=c;if(S.express){S.prod[d.k]=pStock(d.k)+n;S.prodSeen=true}else{(S.deliv=S.deliv||[]).push({prod:{[d.k]:n}});toast("🚚 Pedido en camino: llega en la furgoneta")}sfx.coin();hud();renderM()},
  openprod:d=>{const i=pInfo(d.k);if(!i||pStock(d.k)<1)return;S.prod[d.k]--;S.sealed[i.s]+=i.packs;assignSlots();saveNow();hud();if(i.t==="box")track("boxopen");G.BOXO={i};openM("boxo")},
  inspd:()=>{const d=G.deal;d.tells=d.tells||mkTells(d.fake);d.wt=d.wt||mkWt(d.fake,d.tells);G.INSP={c:d.c,rv:d.rv,fake:!!d.fake,src:"deal",tells:d.tells,wt:d.wt,mode:"lens"};openM("insp")},
  inspc:()=>{const l=grpItems().filter(i=>!i.res&&!i.gq&&!i.fkK),it=l.find(i=>i.fk)||l[0];if(!it)return;it.tl=it.tl||mkTells(!!it.fk);it.wg=it.wg||mkWt(!!it.fk,it.tl);G.INSP={c:BYID[it.c],rv:it.rv,fake:!!it.fk,src:"coll",item:it.i,tells:it.tl,wt:it.wg,mode:"lens"};openM("insp")},
  imode:d=>{G.INSP.mode=d.k;sfx.flip();renderM()},
  iok:()=>{const src=G.INSP.src;G.INSP=null;if(src==="deal"){G.deal.chk=true;openM("sell")}else openM("coll")},
  ifake:()=>{
    const I=G.INSP;G.INSP=null;
    if(I.src==="deal"){const d=G.deal;
      if(d.fake){S.repB+=1;track("caught");toast("🕵️ ¡Bien visto! Era falsa · +1 ⭐");sfx.ach();loy(d.reg,-5,"Le pillaste intentando colarte una falsa");closeDeal(d.cust,false)}
      else{toast("😬 Era auténtica. Se ha ido ofendido");sfx.err();loy(d.reg,-10,"Le acusaste de vender una falsa (era buena)");closeDeal(d.cust,true)}
      return}
    const it=S.items.find(i=>i.i===I.item);if(it){S.items.splice(S.items.indexOf(it),1);if(it.fk){toast("🗑️ Tirada: era falsa. ¡Bien visto!");sfx.ach()}else{toast("😬 Has tirado una carta auténtica…");sfx.err()}}
    G.collSel=null;hud();openM("coll");
  },
  giftopen:()=>{const s=S.gift&&S.gift.set;closeM();if(s&&S.sealed[s]>0)A.open({k:s,n:"1"})},
  meset:d=>{S.me=Object.assign(meCfg(),{[d.k]:d.n});renderM()},
  petset:d=>{S.pet=d.k;if(d.k!=="none")petSound();renderM()},
  styset:d=>{S.style=d.k;renderM()},
  tradeok:()=>{const t=G.TRD;if(!t)return;const it=S.items.find(i=>i.i===t.mine);if(!it){A.tradeno();return}
    S.items.splice(S.items.indexOf(it),1);const nw=!S.dex[t.give];S.items.push({i:S.nid++,c:t.give,k:"NM",rv:false,cost:it.cost,case:null,res:false});S.dex[t.give]=1;
    loy(t.c.reg,6,"Os cambiasteis cartas");track("trade");const c=t.c;G.TRD=null;const qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.st="leave";say(c,"🤝");closeM();
    toast(`🔄 ¡Intercambio hecho! ${BYID[t.give].name}${nw?" · NUEVA para tu álbum":""}`);sfx.ach();checkAch()},
  tradeno:()=>{const t=G.TRD;G.TRD=null;if(t){const c=t.c,qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.st="leave";say(c,"👋")}closeM()},
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
  csort:d=>{G.cSort=d.k;renderM()},
  cmore:()=>{VIS.cMore=!VIS.cMore;renderM()},
  cprev:()=>{const L=VIS.cList||[],i=L.indexOf(G.collSel);if(i>0){G.collSel=L[i-1];VIS.cMore=false;sfx.page();renderM()}},
  cnext:()=>{const L=VIS.cList||[],i=L.indexOf(G.collSel);if(i>=0&&i<L.length-1){G.collSel=L[i+1];VIS.cMore=false;sfx.page();renderM()}},
  ckcase:()=>{G.collF="case";VIS.lastCards="coll";openM("coll")},
  seen:d=>{(S.seen=S.seen||{})[d.k]=1;renderM()},
  undo:()=>{const u=VIS.undo;if(!u||Date.now()-u.at>9000){toast("Ya no se puede deshacer",{nolog:1});return}S.items=JSON.parse(u.items);S.money=u.money;S.orders=JSON.parse(u.orders);VIS.undo=null;$("#toast").innerHTML="";toast("↩️ Deshecho",{nolog:1});sfx.coin();hud();if(G.M)renderM()},
  uibig:()=>{S.ui=Object.assign({},S.ui,{big:!(S.ui&&S.ui.big)});applyUI();renderM()},
  uicalm:()=>{S.ui=Object.assign({},S.ui,{calm:!(S.ui&&S.ui.calm)});applyUI();renderM()},
  favadd:()=>{const it=grpItems().find(i=>i.case==null&&!i.res&&!i.lux&&!i.gq&&!i.fkK);if(!it)return;it.fav=true;G.collSel=gk(it);VIS.cList=null;toast(`❤️ ${BYID[it.c].name} guardada en tu colección personal`);sfx.ach();renderM()},
  favrem:()=>{const l=grpItems();if(!l.length)return;l.forEach(i=>i.fav=false);G.collSel=gk(l[0]);VIS.cList=null;toast("💔 Quitada de favoritas");renderM()},
  cfav:()=>{G.collF="fav";VIS.lastCards="coll";openM("coll")},
  callc:()=>{if(G.collF==="fav")G.collF="all";VIS.lastCards="coll";openM("coll")},
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
  albset:d=>{G.albS=d.k;G.albPg=0;renderM()},
  albnext:()=>albTurn(1),
  albprev:()=>albTurn(-1),
  seastog:()=>{const k=Object.keys(SEAS),i=k.indexOf(S.season||"auto");S.season=k[(i+1)%k.length];toast("🗓️ Temporada: "+SEAS[S.season]+(S.season==="auto"?" ("+SEAS[season()]+")":""));renderM()},
  albclaim:d=>{const i=+d.n,s=G.albS,c=S.albR[s]=S.albR[s]||[],[t,m,r]=ALBR[i];if(c.includes(i)||albPct(s)<t)return;c.push(i);S.money+=m;S.repB+=r;toast(`📒 Premio del álbum: +${fmt(m)} y +${r} ⭐`);sfx.ach();checkAch();hud();renderM()},
  ttab:d=>{G.tTab=d.k;renderM()},
  mclaim:d=>{const m=S.dm.list[+d.n];if(!m||!m.done||m.cl)return;m.cl=1;S.money+=m.r;toast("💰 Misión cobrada: +"+fmt(m.r));sfx.coin();hud();renderM()},
  deliver:d=>{const o=S.orders.find(x=>x.id===+d.n);if(!o)return;const it=ownFor(o);if(!it)return;S.items.splice(S.items.indexOf(it),1);if(it.fk){S.repB=Math.max(0,S.repB-2);loy(o.reg,-20,"Le entregaste una carta falsa");toast(`😡 ${o.who} ha detectado que la carta es falsa · −2 ⭐`);sfx.err();hud();renderM();return}S.money+=o.pay;S.repB+=1;loy(o.reg,15,"Le conseguiste "+BYID[o.c].name);S.orders=S.orders.filter(x=>x!==o);toast(`📋 Encargo entregado a ${o.who}: +${fmt(o.pay)} y +1 ⭐`);sfx.chaching();track("order");hud();renderM()},
  decor:d=>{const x=DECOR.find(y=>y.k===d.k);if(!x||S.decor[x.k]||S.money<x.cost)return;S.money-=x.cost;S.decor[x.k]=1;toast(x.ic+" "+x.n+" colocado");sfx.coin();hud();renderM()},
  staff:d=>{S.staff[d.k]=!S.staff[d.k];toast(S.staff[d.k]?"Contratado: "+STAFF.find(s=>s.k===d.k).n:"Despedido: "+STAFF.find(s=>s.k===d.k).n);renderM()},
  grade:d=>{const sv=GSVC[d.k];if(S.money<sv.cost)return;const l=grpItems().filter(i=>!i.res&&!i.gq&&!i.gr),it=l.find(i=>i.case==null)||l[0];if(!it)return;it.case=null;it.gq={due:S.day+sv.days,svc:d.k};S.money-=sv.cost;G.collSel=null;toast(`📮 Enviada a gradear (${sv.n}). Llega en ${sv.days} día${sv.days>1?"s":""}`);hud();renderM()},
  grades:()=>openGrades(),
  tourtog:()=>{S.tour=!S.tour;renderM()},
  ckadd:d=>{G.CK.given.push(+d.n);+d.n>=500?sfx.bill():sfx.coin();renderM()},
  ckrem:d=>{G.CK.given.splice(+d.n,1);sfx.coin();renderM()},
  ckclr:()=>{G.CK.given=[];renderM()},
  ckgive:()=>{
    const k=G.CK,due=k.paid-k.tc,giv=k.given.reduce((a,b)=>a+b,0);
    if(giv<due){k.say=`¡Me falta cambio! Faltan ${fmt((due-giv)/100)} 😕`;sfx.err();renderM();return}
    let tip=0;
    if(giv>due)toast(`Has dado ${fmt((giv-due)/100)} de más`);
    else if(due>0){track("exact");loy(k.c.reg,2);if(Math.random()<(k.c.reg&&regS(k.c.reg).loy>60?.35:.12)){tip=Math.max(.2,r05(k.tc/100*.05));toast("🙏 Propina: +"+fmt(tip))}}
    finishCK((k.paid-giv)/100+tip);
  },
  ckkey:d=>{const k=G.CK;if(k.st!=="pay")return;sfx.key();k.msg="";if(d.k==="C")k.typed="";else if(d.k==="⌫")k.typed=k.typed.slice(0,-1);else if(k.typed.length<7)k.typed=(k.typed+d.k).replace(/^0+/,"");renderM()},
  ckok:()=>{
    const k=G.CK,v=+k.typed||0;if(k.st!=="pay"||!v)return;
    if(v>k.tc){k.err=1;k.msg="IMPORTE RECHAZADO";k.say="¡Eh! Eso es más de lo que cuesta 😒";k.typed="";sfx.err();renderM();setTimeout(()=>{if(G.CK===k)k.err=0},400);return}
    k.st="tap";k.msg="ACERQUE LA TARJETA";sfx.key();renderM();
    setTimeout(()=>{if(G.CK!==k)return;k.st="ok";k.msg="APROBADO";sfx.ok();renderM();
      setTimeout(()=>{if(G.CK!==k)return;if(v<k.tc)toast("Has cobrado "+fmt((k.tc-v)/100)+" de menos");track("cardpay");finishCK(v/100)},950)},850);
  },
  hgacc:()=>{loy(G.HG.c.reg,3);dealHg(G.HG.offer)},
  hgcnt:()=>{const h=G.HG;if(h.x<=h.max){h.msg="¡Trato hecho!";dealHg(h.x);return}h.tries++;sfx.err();if(h.tries>=2){say(h.c,"😤");leave(h.c,true);G.HG=null;closeM();return}h.msg=pick(["Uff… es demasiado. ¿Algo menos?","No sé, no sé… baja un poco más."]);renderM()},
  hgfix:()=>{const h=G.HG;if(h.max>=h.full*.95||Math.random()<.35){dealHg(h.full);return}say(h.c,"😤");leave(h.c,true);G.HG=null;closeM()},
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
  nextc:()=>{const o=G.openState;if(!o.fl){o.fl=true}else{o.idx++;o.fl=false;if(o.idx>=o.cards.length)o.mode="sum"}renderM()},
  skip:()=>{G.openState.mode="sum";renderM()},
  addset:d=>{addSets([d.k])},
  addreco:()=>addSets(RECO.slice()),
  serf:d=>{G.setQ=d.k;renderM()},
  addseries:()=>{const n=G.setQ.trim();addSets(SETDEF.filter(x=>x.series===n).map(x=>x.id))},
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
    G.openState=n===1?{s,n,val,cards:pulled.map(x=>({c:x.c,rv:x.rv,nw:x.nw})),total:pulled.length,idx:0,mode:"seq",phase:"pack",run:0,tp:0,tb:0,tstep:0,torn:false,rev:false}:{s,n,val,cards:shown.map(x=>({c:x.c,rv:x.rv,nw:x.nw})),total:pulled.length,quick:true,mode:"sum"};
    hud();openM("open");
  },
  flip:(d,b)=>{
    if(b.classList.contains("on"))return;b.classList.add("on");G.openState.seen++;
    if(G.openState.seen>=G.openState.cards.length&&!G.openState.quick){const e=$("#osum");if(e)e.innerHTML=osum()}
  },
  revall:()=>{document.querySelectorAll(".fl").forEach(e=>e.classList.add("on"));G.openState.seen=G.openState.cards.length;$("#osum").innerHTML=osum()},
  filt:d=>{G.collF=d.k;renderM()},
  sel:d=>{G.collSel=d.k;VIS.cMore=false;openM("card")},
  sell1:()=>{const it=grpItems().find(i=>!i.res&&!i.gq&&!i.fav);if(!it)return;snap();let v=0;if(it.fk&&!it.fkK){toast("🚫 El mayorista detecta que es falsa: no te paga nada");sfx.err()}else{v=itemVal(it)*.85;S.money+=v}S.items.splice(S.items.indexOf(it),1);if(!grpItems().length)G.collSel=null;if(v)toast(`💰 Vendida por ${fmt(v)}`,{undo:1});sfx.coin();hud();renderM()},
  sellall:()=>{const gi=grpItems().filter(i=>!i.res&&!i.gq&&!i.fav),est=gi.reduce((a,i)=>a+(i.fk?0:itemVal(i)*.85),0);if(!gi.length)return;if((gi.length>3||est>20)&&!confirm(`¿Vender ${gi.length} cartas al mayorista por ${fmt(est)}?`))return;snap();let t=0,nf=0;const ids=new Set(gi.map(i=>i.i));S.items=S.items.filter(i=>{if(ids.has(i.i)){if(i.fk)nf++;else t+=itemVal(i)*.85;return false}return true});S.money+=t;if(nf)toast(`🚫 ${nf} eran falsas: el mayorista no las paga`);G.collSel=null;toast(`💰 Vendidas ${gi.length} cartas por ${fmt(t)}`,{undo:1});sfx.chaching();hud();renderM()},
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
export const I={csearch:el=>{G.collQ=el.value;const e=$("#cgrid");if(e)e.innerHTML=collGrid()},shopn:el=>{S.shopName=el.value.slice(0,22);hud()},hgx:el=>{G.HG.x=+el.value;$("#hglab").textContent=fmt(G.HG.x)},lotx:el=>{G.LOT.offer=+el.value;$("#lotlab").textContent=fmt(G.LOT.offer)},setq:el=>{G.setQ=el.value;const e=$("#setlist");if(e)e.innerHTML=setRows()},offer:el=>{G.deal.offer=+el.value;$("#olab").textContent=fmt(+el.value)}};
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b)return;
  if(b.classList.contains("ov")&&e.target!==b)return;
  const f=A[b.dataset.a];if(f)f(b.dataset,b);
});
document.addEventListener("input",e=>{const b=e.target.closest("[data-i]");if(b&&I[b.dataset.i])I[b.dataset.i](b)});
