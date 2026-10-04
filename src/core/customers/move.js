// Clientes en la tienda y cola de la caja: movimiento, espera, paciencia y salida.
import { ui } from "../bus.js";
import { S } from "../state.js";
import { decide } from "./decide.js";
import { loy } from "../regulars.js";
import { pStock, why } from "../economy.js";
import { pay } from "./checkout.js";
import { rnd } from "../rng.js";
import { routeTo, queueSpot, offerSpot } from "../../world/nav.js";
import { thiefGone } from "../theft.js";
import { dirtDrop } from "../dirt.js";
import { fkPutBack } from "../funko/sell.js";
export const custs = [];
export const queue = [];
export const say = (c, t) => {
  c.bub = t;
  c.bt = 2.2;
};
/**
 * Sobres y productos que llevan los clientes a la caja (ya fuera del stock), apuntados en la partida (S.held:
 * «p:set» / «x:producto» → cantidad). Si la app se cierra antes de pagar, al cargar vuelven al stock
 * (releaseHolds, core/save.js). sign: +1 al cogerlos, −1 al pagar o devolverlos.
 */
export function holdNote(h, sign) {
  if (!h || (h.k !== "pack" && h.k !== "prod")) return;
  const H = S.held || (S.held = {}),
    k = h.k === "pack" ? "p:" + h.s : "x:" + h.pid;
  H[k] = (H[k] || 0) + sign * h.qty;
  if (H[k] <= 0) delete H[k];
}
/** Clientes dentro de la tienda (los que ya se van no cuentan). */
export const inShop = () => custs.filter((c) => c.st !== "leave").length;
export function leave(c, angry) {
  if (c.hold) {
    for (const h of [c.hold, ...(c.hold.x || [])]) {
      holdNote(h, -1);
      if (h.k === "pack") S.sealed[h.s] += h.qty;
      else if (h.k === "prod") S.prod[h.pid] = pStock(h.pid) + h.qty;
      else if (h.k === "funko")
        fkPutBack(h.us); // vuelven a su estantería o a la vitrina
      else h.it.res = false;
    }
    c.hold = null;
  }
  const qi = queue.indexOf(c);
  if (qi >= 0) queue.splice(qi, 1);
  if (angry) {
    S.sales = Math.max(0, S.sales - 1);
    S.stats.lost++;
    if (c.reg) loy(c.reg, -8, "Se fue enfadado de la tienda");
  }
  c.st = "leave";
  dirtDrop(c.x, c.y); // a veces deja algo en el suelo (core/dirt.js)
}
// Ofertas aparte (con cajero): los que vienen a vender, cambiar o con un lote no se ponen en la fila (el cajero
// no puede atenderlos y la bloqueaban): esperan junto al mostrador («aside» → «offer») hasta que los atiendes.
const OFFER_K = ["sell", "lot", "trade", "fksell"];
export const isOffer = (c) => !!(c.want && OFFER_K.includes(c.want.k));
export const offers = () => custs.filter((c) => c.st === "aside" || c.st === "offer").sort((a, b) => a.id - b.id);
function toAside(c) {
  const qi = queue.indexOf(c);
  if (qi >= 0) queue.splice(qi, 1);
  const used = new Set(offers().map((o) => o.os));
  let i = 0;
  while (used.has(i)) i++;
  c.os = i;
  c.st = "aside";
  const p = offerSpot(i);
  c.tx = p.x;
  c.ty = p.y;
  routeTo(c, p.x, p.y);
}
export function qpos(c) {
  return queueSpot(Math.max(0, queue.indexOf(c))); // en la fila, o cerca de ella si no cabe (world/nav.js)
}
export function front() {
  const c = queue[0];
  if (!c) return null;
  const p = qpos(c);
  return Math.hypot(c.x - p.x, c.y - p.y) < 5 && c.st === "wait" ? c : null;
}
export function updateCusts(dt) {
  for (const c of custs) {
    c.t += dt;
    if (c.bt > 0) {
      c.bt -= dt;
      if (c.bt <= 0) c.bub = null;
    }
    if ((c.st === "toq" || c.st === "wait") && S.staff.cashier && isOffer(c)) toAside(c);
    else if ((c.st === "aside" || c.st === "offer") && !S.staff.cashier) ((c.st = "toq"), (c.rg = null)); // sin cajero, a la fila
    let tx = c.tx,
      ty = c.ty;
    if (c.st === "toq" || c.st === "wait") {
      if (c.st === "toq" && queue.indexOf(c) < 0) queue.push(c);
      const p = qpos(c);
      tx = p.x;
      ty = p.y;
      // Si la cola avanza mientras va hacia ella (o mientras espera fuera de la fila), su sitio cambia:
      // se recalcula la ruta desde donde está, para no ir recto atravesando muebles (docs/pendientes.md §1).
      // En la fila, el paso al hueco de delante es en línea recta, como siempre. Si no tiene destino guardado
      // (con 10 o más en la cola, el hueco pedido al llegar caía fuera de la tienda y no había ruta), se calcula.
      if (!c.rg || c.rg.x !== p.x || c.rg.y !== p.y) routeTo(c, p.x, p.y);
    }
    if (c.st === "leave") {
      if (c.ex == null) {
        c.ex = 358 + (Math.random() < 0.5 ? -1 : 1) * (380 + rnd(220));
        c.ey = 588 + rnd(18);
      }
      tx = c.ex;
      ty = c.ey;
    }
    if (c.st === "leave" && !c.lv) {
      c.lv = 1;
      if (c.ex == null) {
        c.ex = 358 + (Math.random() < 0.5 ? -1 : 1) * (380 + rnd(220));
        c.ey = 588 + rnd(18);
      }
      routeTo(c, c.ex, c.ey);
    }
    const wp = c.wps && c.wps.length ? c.wps[0] : null;
    if (wp) {
      tx = wp.x;
      ty = wp.y;
    }
    if (c.st === "browse") {
      c.mv = false;
      c.bw -= dt;
      if (c.bw <= 0) decide(c);
      continue;
    }
    const dx = tx - c.x,
      dy = ty - c.y,
      d = Math.hypot(dx, dy),
      stp = c.sp * dt;
    if (d > 2) {
      const k = Math.min(stp, d) / d;
      c.x += dx * k;
      c.y += dy * k;
      c.mv = true;
      c.ph += dt * (c.run ? 24 : c.type === "kid" ? 15 : 11);
      if (Math.abs(dx) > 0.5) c.face = dx > 0 ? 1 : -1;
    } else c.mv = false;
    if (!c.waved && c.st !== "leave" && c.y < 568 && c.y > 540) {
      c.waved = 1;
      c.wave = 1.3;
    }
    if (c.wave > 0) c.wave -= dt;
    if (wp) {
      if (d <= 3) c.wps.shift();
      continue;
    }
    if (c.st === "in" && d <= 3) {
      c.st = "browse";
      c.bw = 1.4 + Math.random() * 1.6;
    }
    if (c.st === "toq" && d <= 4) c.st = "wait";
    if (c.st === "aside" && d <= 4) c.st = "offer";
    if (c.st === "offer") {
      c.wt += dt;
      if (c.wt > c.pat) {
        say(c, "😠");
        why("pat");
        leave(c, true);
      }
    }
    if (c.st === "wait") {
      c.wt += dt;
      if (c.wt > c.pat) {
        say(c, "😠");
        why("pat");
        leave(c, true);
        ui.quip("queue");
      } else if (front() === c && c.hold && S.staff.cashier) {
        c.paid += dt;
        if (c.paid > 1.6) {
          pay(c);
          ui.sfx("coin");
        }
      }
    }
  }
  {
    const keep = custs.filter((c) => {
      const g = c.st === "leave" && c.ex != null && !(c.wps && c.wps.length) && Math.hypot(c.x - c.ex, c.y - c.ey) < 4;
      if (g && c.run) thiefGone(c);
      return !g;
    });
    custs.length = 0;
    custs.push(...keep);
  }
}
