// Tienda rival enfrente: fuerza, precios y cuántos clientes te quita.
import { DF } from "./difficulty.js";
import { S, SETS } from "./state.js";
import { clamp } from "./util.js";
import { level, repv } from "./economy.js";
import { pick } from "./rng.js";
export function rivalUpd() {
  const R = S.rival || (S.rival = { on: false, str: 50, price: 0.9, promo: null, closed: false });
  if (DF().rival && !R.on && !R.closed && S.day >= (DF().rDay || 4) && level() >= 2) {
    R.on = true;
    R.str = DF().rStr;
    R.price = 0.97;
    S.newsRival = 1;
  }
  if (!R.on) return null;
  const yi = myIdx();
  R.str = clamp(R.str + (yi > R.price + 0.01 ? 5 : -8) - repv() * 0.08, 0, 100);
  R.price = clamp(R.price + (yi < R.price ? -0.015 : 0.01), 0.88, 1);
  R.promo = Math.random() < 0.4 && SETS.length ? { s: pick(SETS).id, day: S.day } : null;
  if (R.str <= 0) {
    R.on = false;
    R.closed = true;
    S.money += 300;
    S.repB += 5;
    return "🏆 ¡La tienda rival ha cerrado! Te quedas con sus clientes (+300 € y +5 ⭐).";
  }
  return null;
}
export function myIdx() {
  const l = S.slots.filter(Boolean).filter((id) => S.pack[id]);
  if (!l.length) return 1;
  return l.reduce((a, id) => a + S.shelf[id] / S.pack[id].ref, 0) / l.length;
}
export function rivalMul() {
  const R = S.rival;
  if (!R || !R.on || !DF().rival) return 1;
  const d = myIdx() - R.price;
  return clamp(1 - (R.str / 100) * (d > 0 ? 0.25 : 0.08), 0.7, 1);
}
