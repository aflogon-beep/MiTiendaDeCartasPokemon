// Entrada de clientes: tipo, deseo (sobres, carta, producto, vender…), habituales y ladrones.
import { ui } from "../bus.js";
import { CT, PPREF } from "../constants.js";
import { DF } from "../difficulty.js";
import { LAY, admireSpot } from "../../world/layout.js";
import { RG, pickReg, regS } from "../regulars.js";
import { S } from "../state.js";
import { caseItems, pInfo, pStock, patMul } from "../economy.js";
import { custs, queue, say } from "./move.js";
import { dayT } from "../day.js";
import { makeDeal, makeTrade } from "../deals.js";
import { makeThief, theftOK } from "../theft.js";
import { mkOutfit } from "./outfit.js";
import { pick, rnd, wpick } from "../rng.js";
import { routeTo } from "../../world/nav.js";
import { trophyOn } from "../trophies.js";
export let cid=0;
export function shelfSpot(i){const s=LAY.shelf(i);return {x:s.x+s.w/2+rnd(40)-20,y:s.y+s.h+44+rnd(14)}}
export function caseSpot(){const c=LAY.cs();return {x:c.x+c.w/2+rnd(80)-40,y:c.y+c.h+40+rnd(14)}}
export function spawn(){
  const wts={};for(const k in CT)wts[k]=CT[k].w;wts.seller=(S.stats.sellers||0)>=4?0:.14;{const t=dayT();if(S.phase!=="closed"&&(t<.18||(t>.55&&t<.72)))wts.kid*=1.8;if(S.school&&S.school.until>=S.day)wts.kid*=1.6}wts.lot=S.day>=2&&!custs.some(x=>x.type==="lot")?.05:0;if(S.tour)wts.collector*=2;
  let type=wpick(wts),reg=null;
  if(S.ev&&S.ev.t==="vip"&&!S.vipDone&&S.clock>12){type="whale";S.vipDone=true}
  else if(S.tut&&S.tut.on&&!(S.lt.served>0)&&caseItems().length)type="collector";
  else if(Math.random()<.28){reg=pickReg();if(reg)type=RG(reg).t}
  if(type==="seller")S.stats.sellers=(S.stats.sellers||0)+1;
  if(performance.now()-bellT>1500){bellT=performance.now();ui.sfx("bell")}
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
export let bellT=0;
export function pickProd(type){const pf=PPREF[type]||{acc:1},w={};Object.keys(S.prod).forEach(pid=>{if(pStock(pid)<1)return;const i=pInfo(pid);if(!i)return;const v=pf[i.t]||0;if(v)w[pid]=v});return Object.keys(w).length?wpick(w):null}
