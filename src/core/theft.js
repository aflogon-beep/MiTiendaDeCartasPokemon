// Ladrones: cuándo puede haber uno (máx. 1 al día), robo, pillarlo o que escape.
import { ui } from "./bus.js";
import { BYID } from "./cards/sets.js";
import { DF } from "./difficulty.js";
import { S } from "./state.js";
import { caseItems, itemVal, why } from "./economy.js";
import { caseSpot } from "./customers/spawn.js";
import { fmt } from "./util.js";
import { leave, say } from "./customers/move.js";
import { mkOutfit } from "./customers/outfit.js";
import { rnd } from "./rng.js";
import { track } from "./missions.js";
export const theftOK = () =>
  DF().theft > 0 &&
  S.phase === "open" &&
  S.day >= 3 &&
  S.theftDay !== S.day &&
  !(S.tut && S.tut.on) &&
  caseItems().filter((i) => !i.fav).length >= 2;
export function makeThief(c) {
  c.thief = true;
  S.theftDay = S.day;
  c.out = Object.assign(mkOutfit("collector", null), {
    shirt: "#2b2f38",
    pants: "#1d2030",
    hat: "cap",
    hatc: "#111",
    bp: null,
    acc: null,
  });
  c.want = { k: "single" };
  const p = caseSpot();
  c.tx = p.x;
  c.ty = p.y;
}
export function startTheft(c) {
  const it = caseItems()
    .filter((i) => !i.fav && !i.res)
    .sort((a, b) => itemVal(b) * b.case - itemVal(a) * a.case)[0];
  if (!it) {
    c.thief = false;
    return leave(c, false);
  }
  S.items.splice(S.items.indexOf(it), 1);
  c.loot = it;
  c.run = true;
  c.sp = S.cams ? 115 : 150;
  c.st = "leave";
  c.lv = 0;
  c.ex = 358 + (Math.random() < 0.5 ? -1 : 1) * (560 + rnd(120));
  c.ey = 596;
  say(c, "💨");
  ui.vis({ alarmT: performance.now() + 3200 });
  ui.sfx("alarm");
  ui.vibe([120, 60, 120]);
  ui.toast(`🚨 ¡Un ladrón se lleva ${BYID[it.c].name}! Tócalo antes de que escape`, { nolog: 1 });
  ui.quip("thief");
}
export function catchThief(c) {
  c.caught = true;
  S.lt.thCaught = (S.lt.thCaught || 0) + 1;
  c.run = false;
  c.sp = 38;
  ui.vis({ alarmT: 0 });
  const it = c.loot;
  c.loot = null;
  if (it) S.items.push(it);
  say(c, "😳");
  S.repB += 2;
  track("caught");
  ui.quip("caught");
  ui.starsAt(c.x, c.y - 30, 14);
  ui.sfx("ach");
  ui.vibe(40);
  ui.toast(`👮 ¡Pillado! Recuperas ${it ? BYID[it.c].name : "la carta"} · +2 ⭐`);
  ui.hud();
}
export function thiefGone(c) {
  if (c.caught || !c.loot) return;
  S.lt.thLost = (S.lt.thLost || 0) + 1;
  ui.vis({ alarmT: 0 });
  why("thief");
  ui.toast(`😞 El ladrón escapó con ${BYID[c.loot.c].name} (${fmt(itemVal(c.loot) * (c.loot.case || 1))})`);
  ui.sfx("err");
}
