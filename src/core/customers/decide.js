// Qué hace un cliente al llegar a su sitio: comprar, irse por caro o sin stock, admirar trofeos o robar.
import { ui } from "../bus.js";
import { CT } from "../constants.js";
import { DF } from "../difficulty.js";
import { G, S } from "../state.js";
import { LAY } from "../../world/layout.js";
import { itemVal, pInfo, pPrice, pStock, tolMul, why } from "../economy.js";
import { holdNote, leave, queue, say } from "./move.js";
import { pick, rnd } from "../rng.js";
import { r05 } from "../util.js";
import { regS } from "../regulars.js";
import { routeTo } from "../../world/nav.js";
import { startTheft } from "../theft.js";
import { trophies } from "../trophies.js";
import { pickProd } from "./spawn.js";
import { fkClaw, fkClumsy, fkPick } from "../funko/sell.js";
import { fkPrice, fkUVal } from "../funko/zone.js";
export function decide(c) {
  if (c.thief && !c.run) return startTheft(c);
  if (c.want.k === "admire") {
    S.admire = (S.admire || 0) + 1;
    say(c, pick(["😍 ¡Qué colección!", "🤩 ¡Menudas cartas!", "📸 ¡Le hago una foto!", "✨ ¡Qué pasada!"]));
    ui.heartsAt(c.x, c.y - 30, 2);
    const tl = trophies().filter((i) => itemVal(i) >= 3);
    if (tl.length && Math.random() < 0.12 && !G.M) {
      G.TOF = { c, it: pick(tl) };
      G.TOF.price = r05(itemVal(G.TOF.it) * (1.25 + Math.random() * 0.2));
      ui.openM("toffer");
    }
    return leave(c, false);
  }
  const m = CT[c.type].mult * (c.reg ? 1 + regS(c.reg).loy / 1000 : 1);
  if (c.want.k === "funko") {
    // Zona Funko (core/funko/sell.js): elige figuras de la estantería (o de la vitrina) y va a la caja
    fkClaw(c);
    const r = fkPick(c, m, tolMul());
    if (!r.units) {
      say(c, r.why === "caro" ? "💸 Muy caros estos Funkos" : pick(["🤔 Hoy no me llevo nada", "👀 Solo miraba"]));
      why(r.why === "caro" ? "kp:fk" : "ks:fk");
      if (fkClumsy()) say(c, "😬 ¡Uy! Le he dado a una caja…");
      return leave(c, r.why === "caro");
    }
    c.hold = { k: "funko", us: r.units, qty: r.units.length, total: r.total };
    say(c, pick(["🤩 ¡Este me falta!", "😍 ¡Qué Funkos!", "🧸 ¡Me lo llevo!"]));
    c.st = "toq";
    routeTo(c, LAY.qx, LAY.qy + queue.length * LAY.qs);
    return;
  }
  if (c.want.k === "prod") {
    const pid = c.want.pid,
      i = pInfo(pid);
    if (!i || pStock(pid) < 1) {
      say(c, "😕 Sin stock");
      why("ps:" + pid);
      return leave(c, true);
    }
    const pr = pPrice(pid),
      ref = i.ref * m * tolMul() * (0.9 + Math.random() * 0.25);
    if (pr > ref) {
      say(c, "💸 Muy caro");
      why("pp:" + pid);
      return leave(c, true);
    }
    S.prod[pid]--;
    c.hold = { k: "prod", pid, qty: 1, total: pr };
    holdNote(c.hold, 1);
  } else if (c.want.k === "pack") {
    const s = c.want.s,
      st = S.sealed[s],
      ref =
        S.pack[s].ref *
        m *
        tolMul() *
        (S.ev && S.ev.t === "launch" && S.ev.s === s ? 1.2 : 1) *
        (0.9 + Math.random() * 0.25),
      sh = r05(S.shelf[s] * (S.myPromo && S.myPromo.day === S.day && S.myPromo.s === s ? 0.85 : 1));
    if (st < 1) {
      say(c, "😕 Sin stock");
      why("ks:" + s);
      return leave(c, true);
    }
    if (
      S.rival &&
      S.rival.on &&
      DF().rival &&
      S.rival.promo &&
      S.rival.promo.s === s &&
      !(S.myPromo && S.myPromo.day === S.day && S.myPromo.s === s) &&
      Math.random() < 0.3
    ) {
      say(c, "🏪 Enfrente está más barato");
      why("rv:" + s);
      return leave(c, true);
    }
    if (sh > ref) {
      say(c, "💸 Muy caro");
      why("kp:" + s);
      return leave(c, true);
    }
    let qty = PQTY[c.type] ? PQTY[c.type]() : 2 + rnd(3);
    qty = Math.min(qty, st);
    if (c.type === "kid" && sh > 14) {
      say(c, "😢 No me llega");
      return leave(c, false);
    }
    S.sealed[s] -= qty;
    c.hold = { k: "pack", s, qty, total: sh * qty };
    holdNote(c.hold, 1);
  } else {
    let its = S.items.filter((i) => i.case != null && !i.res && !i.fkK);
    if (!its.length) {
      say(c, "😕 Vitrina vacía");
      why("ce");
      return leave(c, true);
    }
    if (c.type === "investor") its = its.sort((a, b) => itemVal(b) - itemVal(a)).slice(0, 3);
    const it = pick(its),
      f = (0.95 + Math.random() * 0.3) * m * tolMul() * (it.lux ? 1.12 : 1);
    if (it.case > f && !(S.tut && S.tut.on)) {
      say(c, "💸 Muy caro");
      why("cp");
      return leave(c, true);
    }
    it.res = true;
    c.hold = { k: "single", it, total: itemVal(it) * it.case };
  }
  addExtras(c, m);
  c.st = "toq";
  routeTo(c, LAY.qx, LAY.qy + queue.length * LAY.qs);
}
// Cestas más grandes (a petición de Alberto: menos clientes, pero cada uno se deja 20 € o más)
/** Sobres que se lleva cada tipo de cliente que viene a por sobres. */
export const PQTY = {
  kid: () => 2 + rnd(3), // 2–4
  collector: () => 3 + rnd(4), // 3–6
  investor: () => 4 + rnd(5), // 4–8
  whale: () => 8 + rnd(8), // 8–15
};
/** Sobres de más que coge el que viene a por otra cosa: probabilidad y cuántos. */
const XPACK = {
  kid: [0.5, () => 1 + rnd(2)],
  collector: [0.6, () => 2 + rnd(3)],
  investor: [0.5, () => 3 + rnd(4)],
  whale: [0.7, () => 6 + rnd(6)],
};
export const XPROD = 0.35; // probabilidad de llevarse también un accesorio o producto
/** Lo que se suma a la cesta (c.hold.x): sobres de una estantería y un accesorio o producto, si hay y el precio le parece bien. */
export function addExtras(c, m) {
  const h = c.hold,
    x = [];
  if (!h || (S.tut && S.tut.on)) return;
  const xp = XPACK[c.type];
  if (h.k !== "pack" && xp && Math.random() < xp[0]) {
    const sets = S.slots.filter((s) => s && S.sealed[s] > 0 && S.shelf[s] != null);
    const s = sets.length ? pick(sets) : null;
    if (s) {
      const ref = S.pack[s].ref * m * tolMul() * (0.9 + Math.random() * 0.25),
        sh = r05(S.shelf[s] * (S.myPromo && S.myPromo.day === S.day && S.myPromo.s === s ? 0.85 : 1)),
        qty = Math.min(xp[1](), S.sealed[s]);
      if (sh <= ref && !(c.type === "kid" && sh > 14)) {
        S.sealed[s] -= qty;
        x.push({ k: "pack", s, qty, total: sh * qty });
      }
    }
  }
  if (Math.random() < XPROD) {
    const pid = pickProd(c.type);
    if (pid && pid !== h.pid && pStock(pid) > 0) {
      const pr = pPrice(pid),
        ref = pInfo(pid).ref * m * tolMul() * (0.9 + Math.random() * 0.25);
      if (pr <= ref) {
        S.prod[pid]--;
        x.push({ k: "prod", pid, qty: 1, total: pr });
      }
    }
  }
  if (S.fk && S.fk.u && Math.random() < 0.12) {
    const u = S.fk.u.find((q) => q.at === "s" && fkPrice(q) <= 25);
    if (u && fkPrice(u) <= r05(fkUVal(u) * 1.12 * m * tolMul())) {
      u.from = u.at;
      u.at = "h";
      x.push({ k: "funko", us: [u], qty: 1, total: fkPrice(u) });
    }
  }
  if (!x.length) return;
  h.x = x;
  h.base = h.total; // lo que cuesta lo principal (para el regateo de una carta)
  x.forEach((e) => ((h.total += e.total), holdNote(e, 1)));
}
