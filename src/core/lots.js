// Lotes misteriosos: generación, estimación, revisión, experto y compra.
import { ui } from "./bus.js";
import { BYR, CARDS } from "./cards/sets.js";
import { COND } from "./constants.js";
import { G, S } from "./state.js";
import { clamp, r05 } from "./util.js";
import { pick, rnd, wpick } from "./rng.js";
import { price } from "./economy.js";
import { queue, say } from "./customers/move.js";
import { rvr } from "./cards/prices.js";
import { track } from "./missions.js";
export function makeLot(c){
  const n=40+rnd(220),cards=[],W8={C:52,U:26,R:11,DR:6,IR:2.2,UR:1.2,SIR:.9,HR:.7};
  const pools={};Object.keys(W8).forEach(r=>pools[r]=(BYR[r]||[]).filter(x=>S.sets.includes(x.s)));
  for(let i=0;i<n;i++){let r=wpick(W8);if(!pools[r].length)r="C";const l=pools[r].length?pools[r]:CARDS,cd=pick(l),k=wpick({NM:45,LP:38,MP:17}),rv=(r==="C"||r==="U"||r==="R")&&Math.random()<.15;cards.push({c:cd,k,rv,v:price(cd.id)*(rv?rvr(cd):1)*COND[k]})}
  const v=cards.reduce((a,x)=>a+x.v,0),ask=Math.max(5,r05(v*(.5+Math.random()*.8)));
  G.LOT={c,n,cards,v,ask,floor:r05(ask*(.72+Math.random()*.18)),rev:[],expert:false,lo:v*(.35+Math.random()*.3),hi:v*(1.35+Math.random()*.8),tries:0,msg:"",offer:ask,done:false,counter:0,free:!!S.staff.appraiser};
}
export function lotEst(){const L=G.LOT;if(L.expert)return [L.v,L.v];if(!L.rev.length)return [L.lo,L.hi];const k=L.rev.length,m=L.rev.reduce((a,i)=>a+L.cards[i].v,0)/k,e=m*L.n,b=clamp(1.3/Math.sqrt(k)*(S.staff.appraiser?.5:1),.08,.9);return [e*(1-b),e*(1+b)]}
export function lotReview(k){const L=G.LOT,rest=L.cards.map((_,i)=>i).filter(i=>!L.rev.includes(i));for(let j=0;j<k&&rest.length;j++)L.rev.push(rest.splice(rnd(rest.length),1)[0])}
export const expCost=()=>Math.max(20,r05(G.LOT.ask*.08));
export function lotBuy(p){
  const L=G.LOT;if(S.money<p){ui.toast("No tienes dinero suficiente");return}
  S.money-=p;const each=p/L.n;L.cards.forEach(x=>{S.items.push({i:S.nid++,c:x.c.id,k:x.k,rv:x.rv,cost:each,case:null,res:false});S.dex[x.c.id]=1});
  L.done=true;L.paid=p;ui.sfx("chaching");if(L.v-p>p*.5)ui.shake(6);track("lot");ui.hud();ui.renderM();
}
export function endLot(){const L=G.LOT;if(!L)return;const c=L.c;G.LOT=null;if(c){const qi=queue.indexOf(c);if(qi>=0)queue.splice(qi,1);c.hold=null;say(c,L.done?"❤️":"👋");c.st="leave";if(L.done)S.sales++}}
