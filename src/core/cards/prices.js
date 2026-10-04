// Precios de mercado de cada carta: historial inicial y paso diario (paseo aleatorio hacia su precio base).
import { clamp } from "../util.js";
import { gauss } from "../rng.js";
import { VOL } from "../constants.js";

export const rvr = (c) => (c.rv && c.b ? clamp(c.rv / c.b, 1.2, 8) : 2.5);
// Para que la partida quepa en el almacenamiento del navegador (unos 5 MB) aunque haya muchas colecciones:
// precios con 6 cifras (no 17) y solo los días que se usan (la gráfica y «30 d» miran 30 días atrás).
export const PHIST = 31;
const r6 = (v) => +v.toPrecision(6);
export function step(p, vol) {
  p.t = +(p.t * 0.85 + (Math.random() - 0.5) * 0.012 * vol).toPrecision(4);
  p.p = r6(Math.max(0.02, p.p * Math.exp(p.t + gauss() * 0.03 * vol) + (p.b - p.p) * 0.03));
  p.h.push(p.p);
  while (p.h.length > PHIST) p.h.shift();
}
/** Partidas de antes: precios con 17 cifras y 60 días de historial. Se recortan al cargar (lo que se ve, igual). */
export function compactPrice(p) {
  if (!p || !p.h) return;
  if (p.h.length > PHIST) p.h = p.h.slice(-PHIST);
  p.h = p.h.map(r6);
  p.p = r6(p.p);
  p.t = +(+p.t || 0).toPrecision(4);
}
export function initPrice(c) {
  const h = [];
  if (c.seed) {
    const s = c.seed;
    for (let i = 0; i < 30; i++) {
      const f = i / 29,
        v = f < 0.77 ? s[0] + (s[1] - s[0]) * (f / 0.77) : s[1] + (c.b - s[1]) * ((f - 0.77) / 0.23);
      h.push(r6(v * (1 + (Math.random() - 0.5) * 0.01)));
    }
    h[29] = c.b;
  } else {
    const p = { p: c.b * (0.92 + Math.random() * 0.16), t: 0, b: c.b, h: [] };
    for (let i = 0; i < 30; i++) step(p, VOL[c.r]);
    return p;
  }
  return { p: c.b, t: 0, b: c.b, h };
}
