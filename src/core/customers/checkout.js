// Cobro: pago en caja, forma de pago (efectivo o tarjeta) y regateo.
import { ui } from "../bus.js";
import { LAY } from "../../world/layout.js";
import { S } from "../state.js";
import { fmt } from "../util.js";
import { loy } from "../regulars.js";
import { holdNote, queue, say } from "./move.js";
import { track } from "../missions.js";
import { wpick } from "../rng.js";
export function pay(c, got) {
  const h = c.hold;
  if (got == null) got = h.total;
  S.money += got;
  S.stats.inc += got;
  // Reputación: cuenta lo que se gasta (1 por cada 10 €, de 1 a 5), no solo que haya comprado
  S.sales += Math.max(1, Math.min(5, Math.floor(got / 10)));
  for (const e of [h, ...(h.x || [])]) {
    holdNote(e, -1);
    if (e.k === "single") {
      const i = S.items.indexOf(e.it);
      if (i >= 0) S.items.splice(i, 1);
      const cg = got - (h.total - (h.base ?? h.total)); // lo que se pagó por la carta (sin lo demás de la cesta)
      track("bigsale", cg);
      if (e.it.fk) S.fkRet.push({ got: cg, reg: c.reg || null });
    } else if (e.k === "prod") track("sellprod", e.qty);
    else {
      track("sellpack", e.qty);
      S.lt.setSold = S.lt.setSold || {};
      S.lt.setSold[e.s] = (S.lt.setSold[e.s] || 0) + e.qty;
    }
  }
  if (c.reg) loy(c.reg, 3 + (c.wt < c.pat * 0.4 ? 2 : 0));
  track("earn", got);
  track("serve");
  if (got >= 50) (ui.shake(3), ui.quip("bigsale"));
  ui.toast("+ " + fmt(got), { nolog: 1 }); // las ventas no van a Avisos: tapaban lo importante
  ui.fx(LAY.counter.x + 28, LAY.counter.y + 40, "+" + fmt(got), "#4cc98a");
  ui.coinBurst(c.x, c.y - 30, got);
  c.bought = true;
  ui.vis({ drawer: 1.4 });
  c.hold = null;
  say(c, "❤️");
  const qi = queue.indexOf(c);
  if (qi >= 0) queue.splice(qi, 1);
  c.st = "leave";
  ui.hud();
}
export function payWith(tc) {
  if (Math.random() < 0.15) return tc;
  const cands = [500, 1000, 2000, 5000, 10000]
    .map((u) => Math.ceil(tc / u) * u)
    .filter((v, i, a) => v >= tc && a.indexOf(v) === i && v - tc < 10000)
    .sort((a, b) => a - b);
  const w = [6, 3, 1.4, 0.6, 0.3],
    o = {};
  cands.forEach((v, i) => (o[i] = w[i] || 0.2));
  return cands[+wpick(o)];
}
export function canHaggle(c) {
  return (
    c.hold.k === "single" &&
    c.hold.total >= 5 &&
    !c.hg &&
    Math.random() < ({ investor: 0.6, collector: 0.4, whale: 0.2, kid: 0.3 }[c.type] || 0.3)
  );
}
