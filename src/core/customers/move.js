// Clientes en la tienda y cola de la caja: movimiento, espera, paciencia y salida.
import { ui } from "../bus.js";
import { LAY } from "../../world/layout.js";
import { S } from "../state.js";
import { decide } from "./decide.js";
import { loy } from "../regulars.js";
import { pStock, why } from "../economy.js";
import { pay } from "./checkout.js";
import { rnd } from "../rng.js";
import { routeTo } from "../../world/nav.js";
import { thiefGone } from "../theft.js";
export const custs = [];
export const queue = [];
export const say = (c, t) => {
  c.bub = t;
  c.bt = 2.2;
};
export function leave(c, angry) {
  if (c.hold) {
    if (c.hold.k === "pack") S.sealed[c.hold.s] += c.hold.qty;
    else if (c.hold.k === "prod") S.prod[c.hold.pid] = pStock(c.hold.pid) + c.hold.qty;
    else c.hold.it.res = false;
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
}
export function qpos(c) {
  const i = queue.indexOf(c);
  return { x: LAY.qx, y: LAY.qy + Math.max(0, i) * LAY.qs };
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
    let tx = c.tx,
      ty = c.ty;
    if (c.st === "toq" || c.st === "wait") {
      if (c.st === "toq" && queue.indexOf(c) < 0) queue.push(c);
      const p = qpos(c);
      tx = p.x;
      ty = p.y;
      // Si la cola avanza mientras va hacia ella, su hueco cambia: se recalcula la ruta desde donde
      // está, para no ir recto al hueco nuevo atravesando muebles (docs/pendientes.md §1)
      if (c.st === "toq" && c.rg && (c.rg.x !== p.x || c.rg.y !== p.y)) routeTo(c, p.x, p.y);
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
    if (c.st === "wait") {
      c.wt += dt;
      if (c.wt > c.pat) {
        say(c, "😠");
        why("pat");
        leave(c, true);
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
