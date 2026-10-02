// Encargos de los habituales.
import { CARDS } from "./cards/sets.js";
import { RG, regS } from "./regulars.js";
import { S } from "./state.js";
import { pick, rnd } from "./rng.js";
import { price } from "./economy.js";
import { r05 } from "./util.js";
export function genOrder(){const pool=CARDS.filter(c=>S.sets.includes(c.s)&&S.prices[c.id]&&price(c.id)>=1.5&&price(c.id)<=250);if(!pool.length)return;const c=pick(pool),rid=pick(["lucia","iker","marcos","aitana","hugo"]),rl=regS(rid).loy;S.orders.push({id:S.nid++,c:c.id,pay:r05(price(c.id)*(1.25+Math.random()*.4)*(1+rl/500)),due:S.day+3+rnd(4),who:RG(rid).n,reg:rid})}
export function ownFor(o){const l=S.items.filter(i=>i.c===o.c&&!i.fav&&!i.gq&&!i.res&&!i.fkK);return l.find(i=>i.case==null)||l[0]}
