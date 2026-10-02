// Regalo diario: un sobre gratis y premio por racha.
import { ui } from "./bus.js";
import { G, S, SETS, assignSlots, hasState } from "./state.js";
import { pick } from "./rng.js";
import { saveNow } from "./save.js";
export const today = () => {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
};
export function giftCheck() {
  if (!hasState() || G.M || G.TITLE || G.STORY || (S.tut && S.tut.on) || (G.MODE !== "real" && G.MODE !== "offline"))
    return;
  const g = S.gift || (S.gift = { last: "", streak: 0 }),
    t = today();
  if (g.last === t) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yk = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
  g.streak = g.last === yk ? g.streak + 1 : 1;
  g.last = t;
  const sd = pick(SETS);
  g.set = sd ? sd.id : null;
  g.bonus = g.streak % 7 === 0 ? 50 : g.streak % 3 === 0 ? 15 : 0;
  if (g.set) S.sealed[g.set] = (S.sealed[g.set] || 0) + 1;
  S.money += g.bonus;
  assignSlots();
  saveNow();
  ui.openM("gift");
}
