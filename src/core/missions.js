// Misiones del día y contadores de por vida (track).
import { ui } from "./bus.js";
import { FK_MT, LTK, MT } from "./constants.js";
import { S, hasState } from "./state.js";
import { checkAch } from "./achievements.js";
export function genMissions() {
  const tier = Math.min(2, Math.floor((S.day - 1) / 6));
  S.dm = {
    day: S.day,
    list: MT.concat(S.fk ? FK_MT : []) // con la zona Funko, también sus misiones
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((m) => ({ k: m.k, t: m.n.replace("{g}", m.g[tier]), g: m.g[tier], p: 0, r: m.r[tier], done: 0, cl: 0 })),
  };
}
export function track(k, v) {
  if (v == null) v = 1;
  if (!hasState()) return;
  if (LTK[k]) S.lt[LTK[k]] = (S.lt[LTK[k]] || 0) + v;
  if (S.dm)
    S.dm.list.forEach((m) => {
      if (m.k !== k || m.done) return;
      if (k === "bigsale") {
        if (v >= m.g) m.p = m.g;
      } else m.p += v;
      if (m.p >= m.g) {
        m.p = m.g;
        m.done = 1;
        ui.toast("✅ Misión completada: " + m.t);
        ui.sfx("ach");
      }
    });
  checkAch();
}
