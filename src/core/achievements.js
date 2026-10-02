// Logros (premios de por vida), porcentaje del álbum y recompensas pendientes de cobrar.
import { ui } from "./bus.js";
import { ACH, ALBR } from "./constants.js";
import { BYS } from "./cards/sets.js";
import { S } from "./state.js";
import { checkMedals } from "./medals.js";
import { fmt } from "./util.js";
import { netWorth } from "./economy.js";
import { ownFor } from "./orders.js";
export function achVal(a) {
  if (a.st === "nw") return netWorth();
  if (a.st === "alb50") return S.sets.some((s) => albPct(s) >= 0.5) ? 1 : 0;
  if (a.st === "alb100") return S.sets.some((s) => albPct(s) >= 1) ? 1 : 0;
  return S.lt[a.st] || 0;
}
export function checkAch() {
  checkMedals();
  ACH.forEach((a) => {
    if (!S.ach[a.id] && achVal(a) >= a.g) {
      S.ach[a.id] = 1;
      S.money += a.r;
      ui.toast(`🏆 Logro: ${a.n} · +${fmt(a.r)}`);
      ui.sfx("ach");
    }
  });
}
export function albPct(sid) {
  const l = BYS[sid] || [];
  return l.length ? l.filter((c) => S.dex[c.id]).length / l.length : 0;
}
export function claimables() {
  let n = S.dm ? S.dm.list.filter((m) => m.done && !m.cl).length : 0;
  n += S.orders.filter((o) => ownFor(o)).length;
  S.sets.forEach((s) => {
    const p = albPct(s),
      c = S.albR[s] || [];
    ALBR.forEach(([t], i) => {
      if (p >= t && !c.includes(i)) n++;
    });
  });
  return n;
}
