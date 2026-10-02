// Tratos con clientes: cartas que quieren venderte y cambios que te proponen los habituales.
import { BYR, CARDS } from "./cards/sets.js";
import { COND } from "./constants.js";
import { DF } from "./difficulty.js";
import { S } from "./state.js";
import { itemVal, price } from "./economy.js";
import { pick, wpick } from "./rng.js";
import { r05 } from "./util.js";
import { rvr } from "./cards/prices.js";
import { ui } from "./bus.js";
import { G } from "./state.js";
import { fmt } from "./util.js";
import { leave, queue, say } from "./customers/move.js";
import { loy } from "./regulars.js";
import { track } from "./missions.js";
export function makeDeal(reg){
  for(let t=0;t<40;t++){
    const rr=wpick({C:30,U:18,R:20,DR:12,IR:8,UR:4,SIR:6,HR:2}),pool=BYR[rr];if(!pool)continue;
    const c=pick(pool),k=wpick({NM:50,LP:35,MP:15}),rv=(rr==="C"||rr==="U"||rr==="R")&&Math.random()<.3;
    const val=price(c.id)*(rv?rvr(c):1)*COND[k];if(val<.6&&t<39)continue;
    return {reg:reg||null,fake:Math.random()<(reg==="rafa"?.6:val>10?.38:.25)*DF().fake,chk:false,c,k,rv,val,ask:r05(val*(reg==="rafa"?.72:.9+Math.random()*.3)),floor:r05(val*(.5+Math.random()*.3)),tries:0,offer:r05(val*.7),msg:"",counter:0};
  }
}
export function makeTrade(){
  const pool=S.items.filter(i=>!i.case&&!i.res&&!i.gq&&!i.fk&&!i.fkK&&!i.lux&&!i.gr&&!i.fav);if(pool.length<4)return null;
  const cnt={};pool.forEach(i=>cnt[i.c]=(cnt[i.c]||0)+1);
  const mine=pick(pool.filter(i=>cnt[i.c]>1).concat(pool)),mv=Math.max(.3,itemVal(mine));
  const cand=CARDS.filter(c=>S.sets.includes(c.s)&&!S.dex[c.id]&&price(c.id)>=mv*.6&&price(c.id)<=mv*1.7);
  const give=cand.length?pick(cand):pick(CARDS.filter(c=>S.sets.includes(c.s)&&price(c.id)>=mv*.5&&price(c.id)<=mv*2)||[]);if(!give)return null;
  return {mine:mine.i,give:give.id};
}
export function closeDeal(c,angry){if(c)leave(c,angry);G.deal=null;ui.closeM()}
export function finishDeal(p){
  if(S.money<p){ui.toast("No tienes dinero suficiente");return}
  const d=G.deal;S.money-=p;S.stats.bought++;
  S.items.push({i:S.nid++,c:d.c.id,k:d.k,rv:d.rv,cost:p,case:null,res:false,fk:d.fake||undefined});S.dex[d.c.id]=1;loy(d.reg,3);track("buycard");if(p<=d.val*.75&&d.val>=1)track("goodbuy");
  ui.toast(`Comprada ${d.c.name} por ${fmt(p)}`);
  const c=d.cust;c.hold=null;say(c,"❤️");queue.splice(queue.indexOf(c),1);c.st="leave";S.sales++;G.deal=null;ui.closeM();
}
