// Economía: valor de cartas e inventario, nivel, vitrina, producto sellado, multiplicadores de clientes y precios recomendados.
import { dirtMul } from "./dirt.js";
import { ACC, COND, DECOR, GMULT, LV, PTYPES, REGS } from "./constants.js";
import { BYID, setCol, setName } from "./cards/sets.js";
import { DF } from "./difficulty.js";
import { S, SETS } from "./state.js";
import { clamp, r05 } from "./util.js";
import { evMul } from "./events.js";
import { rivalMul } from "./rival.js";
import { rvr } from "./cards/prices.js";
import { trophyRep } from "./trophies.js";
export const price = (id) => S.prices[id].p;
export const itemVal = (it) => {
  if (it.fkK) return 0;
  const c = BYID[it.c];
  return price(it.c) * (it.rv ? rvr(c) : 1) * (it.gr ? GMULT[it.gr] : COND[it.k]);
};
export const invValue = () => S.items.reduce((a, it) => a + itemVal(it), 0);
export const sealedCount = () => SETS.reduce((a, sd) => a + S.sealed[sd.id], 0);
export const netWorth = () =>
  S.money + invValue() + SETS.reduce((a, sd) => a + S.sealed[sd.id] * S.pack[sd.id].w, 0) + prodValue();
export const level = () => {
  const n = netWorth();
  let l = 1;
  LV.forEach((v, i) => {
    if (n >= v) l = i + 1;
  });
  // El nivel nunca baja (decisión de Alberto): se guarda el más alto alcanzado (S.lvMax). Así, gastar en
  // mejoras no devuelve la tienda a la categoría de antes. Partidas de antes: el más alto que ya vieron (S.lvSeen).
  if (S.lvMax == null) S.lvMax = Math.max(1, S.lvSeen || 1);
  if (l > S.lvMax) S.lvMax = l;
  return S.lvMax;
};
export const caseCap = () => 8 + 8 * S.up.case;
export const caseItems = () => S.items.filter((i) => i.case != null && !i.lux);
export const tierOf = (l) => (l >= 7 ? 3 : l >= 5 ? 2 : l >= 3 ? 1 : 0);
/** Reputación que dan los niveles de la tienda: +10 en el 6 y +20 más en el 8 (core/unlocks.js). */
export const lvRep = () => (S.lvMax >= 8 ? 30 : S.lvMax >= 6 ? 10 : 0);
export const repv = () => Math.floor(S.sales / 6) + (S.repB || 0) + trophyRep() + lvRep();
/** Cuántos clientes más trae la reputación: sube rápido al principio y se frena; como mucho ×2. */
export const repMul = () => 1 + repv() / (repv() + 40);
export const dsum = (k) => DECOR.reduce((a, d) => a + (S.decor[d.k] && d[k] ? d[k] : 0), 0);
export const spMul = () =>
  (1 +
    dsum("sp") +
    (S.staff.cm ? 0.1 : 0) +
    (S.annex ? 0.1 : 0) +
    REGS.filter((r) => S.regs && S.regs[r.id] && S.regs[r.id].loy >= 80).length * 0.03) *
  evMul() *
  rivalMul() *
  dirtMul(); // con suciedad en el suelo, entran menos (core/dirt.js)
export const patMul = () => (1 + dsum("pat") + (S.fk && S.fk.mob && S.fk.mob.arcade ? 0.2 : 0)) * DF().pat; // + recreativa de la zona Funko
export const tolMul = () => (1 + dsum("tol")) * DF().tol;
export const gk = (it) =>
  it.c +
  "|" +
  it.k +
  "|" +
  (it.rv ? 1 : 0) +
  "|" +
  (it.gr || 0) +
  "|" +
  (it.gq ? 1 : 0) +
  (it.fkK ? "|F" : "") +
  (it.fav ? "|V" : "");
export function pInfo(pid) {
  const [t, x] = pid.split(":");
  if (t === "acc") {
    const a = ACC.find((y) => y.id === x);
    return a ? { t, n: a.n, ic: a.ic, w: a.w, ref: a.r, col: a.col } : null;
  }
  const P = PTYPES[t];
  if (!P || !S.pack[x]) return null;
  const w = r05(S.pack[x].w * P.packs * P.f);
  return {
    t,
    s: x,
    n: P.n + " · " + setName(x),
    ic: P.ic,
    w,
    ref: r05(w * (t === "box" ? 1.22 : 1.3)),
    col: setCol(x),
    packs: P.packs,
  };
}
export const pStock = (pid) => S.prod[pid] || 0;
export function pPrice(pid) {
  if (S.pp[pid] == null) {
    const i = pInfo(pid);
    S.pp[pid] = i ? r05(i.ref) : 1;
  }
  return S.pp[pid];
}
export const prodValue = () =>
  Object.keys(S.prod).reduce((a, pid) => {
    const i = pInfo(pid);
    return a + (i ? i.w * pStock(pid) : 0);
  }, 0);
export const luxItems = () => S.items.filter((i) => i.lux && i.case != null);
export const why = (k) => {
  const w = S.stats.why || (S.stats.why = {});
  w[k] = (w[k] || 0) + 1;
};
export const accP = (u, lo, hi) => clamp((hi - u) / (hi - lo), 0, 1);
export const packAcc = (s) => accP(S.shelf[s] / (S.pack[s].ref * tolMul()), 0.9, 1.15);
export const prodAcc = (pid) => {
  const i = pInfo(pid);
  return i ? accP(pPrice(pid) / (i.ref * tolMul()), 0.9, 1.15) : 0;
};
export const recPack = (s) => r05(S.pack[s].ref * tolMul() * 0.94);
export const recProd = (pid) => {
  const i = pInfo(pid);
  return i ? r05(i.ref * tolMul() * 0.94) : pPrice(pid);
};
export const caseAcc = (it) => accP((it.case || 1) / (tolMul() * (it.lux ? 1.12 : 1)), 0.95, 1.25);
