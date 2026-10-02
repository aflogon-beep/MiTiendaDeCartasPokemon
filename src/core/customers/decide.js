// Qué hace un cliente al llegar a su sitio: comprar, irse por caro o sin stock, admirar trofeos o robar.
import { ui } from "../bus.js";
import { CT } from "../constants.js";
import { DF } from "../difficulty.js";
import { G, S } from "../state.js";
import { LAY } from "../../world/layout.js";
import { itemVal, pInfo, pPrice, pStock, tolMul, why } from "../economy.js";
import { leave, queue, say } from "./move.js";
import { pick, rnd } from "../rng.js";
import { r05 } from "../util.js";
import { regS } from "../regulars.js";
import { routeTo } from "../../world/nav.js";
import { startTheft } from "../theft.js";
import { trophies } from "../trophies.js";
export function decide(c){
  if(c.thief&&!c.run)return startTheft(c);
  if(c.want.k==="admire"){S.admire=(S.admire||0)+1;say(c,pick(["😍 ¡Qué colección!","🤩 ¡Menudas cartas!","📸 ¡Le hago una foto!","✨ ¡Qué pasada!"]));ui.heartsAt(c.x,c.y-30,2);const tl=trophies().filter(i=>itemVal(i)>=3);if(tl.length&&Math.random()<.12&&!G.M){G.TOF={c,it:pick(tl)};G.TOF.price=r05(itemVal(G.TOF.it)*(1.25+Math.random()*.2));ui.openM("toffer")}return leave(c,false)}
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
