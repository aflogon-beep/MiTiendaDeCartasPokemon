// Mercadillo de la plaza: días, lotes del día y cartas candidatas para tu puesto.
import { G, S } from "./state.js";
import { itemVal } from "./economy.js";
import { makeLot } from "./lots.js";
import { r05 } from "./util.js";
import { rnd } from "./rng.js";
export const marketDay = () => S.day % 7 === 3;
// Lotes del mercadillo del día (se guardan para no regenerarlos en cada repintado)
let mlots = null;
export function mkMarketLots() {
  if (mlots && mlots.day === S.day) return mlots.l;
  const l = [0, 1, 2].map(() => {
    makeLot(null);
    const L = G.LOT;
    L.n = Math.min(L.n, 30 + rnd(30));
    L.cards = L.cards.slice(0, L.n);
    L.v = L.cards.reduce((a, x) => a + x.v, 0);
    L.ask = Math.max(5, r05(L.v * (0.45 + Math.random() * 0.35)));
    L.floor = r05(L.ask * 0.85);
    L.lo = L.v * 0.5;
    L.hi = L.v * 1.6;
    L.offer = L.ask;
    return L;
  });
  G.LOT = null;
  mlots = { day: S.day, l };
  return l;
}
export const mkCand = () =>
  S.items
    .filter((i) => i.case == null && !i.res && !i.gq && !i.fkK && !i.lux && !i.fav && itemVal(i) >= 0.5)
    .sort((a, b) => itemVal(b) - itemVal(a))
    .slice(0, 24);
export const nextMarket = () => {
  let d = S.day;
  while (d % 7 !== 3) d++;
  return d;
};
