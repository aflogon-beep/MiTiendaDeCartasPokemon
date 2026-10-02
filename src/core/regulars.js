// Clientes habituales: datos, fidelidad y corazones.
import { REGS } from "./constants.js";
import { S } from "./state.js";
import { pick } from "./rng.js";
import { ui } from "./bus.js";
import { clamp } from "./util.js";
import { custs } from "./customers/move.js";
import { wpick } from "./rng.js";
export const RG = (id) => REGS.find((r) => r.id === id);
export function regS(id) {
  return S.regs[id] || (S.regs[id] = { loy: 30, visits: 0, note: "", met: false, fav: pick(S.sets) });
}
export const hearts = (l) => {
  const n = Math.round(l / 20);
  return "❤️".repeat(n) + "🤍".repeat(5 - n);
};
export function loy(id, d, note) {
  if (!id) return;
  const r = regS(id);
  r.loy = clamp(r.loy + d, 0, 100);
  if (note) r.note = note;
  if (d > 0) {
    const c = custs.find((x) => x.reg === id);
    if (c) ui.heartsAt(c.x, c.y - 54, Math.min(4, Math.ceil(d / 3)));
  }
}
export function pickReg() {
  const here = new Set(custs.map((c) => c.reg).filter(Boolean)),
    w = {};
  REGS.forEach((r) => {
    if (here.has(r.id)) return;
    const s = regS(r.id);
    if (s.loy < 5) return;
    if (r.t === "lot" && (S.day < 2 || custs.some((c) => c.type === "lot"))) return;
    w[r.id] = 0.5 + s.loy / 50;
  });
  return Object.keys(w).length ? wpick(w) : null;
}
