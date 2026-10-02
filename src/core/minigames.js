// Minijuegos: ¿cuál vale más?, ¿quién es ese Pokémon? y duelos.
import { ui } from "./bus.js";
import { CARDS } from "./cards/sets.js";
import { G, S } from "./state.js";
import { fmt } from "./util.js";
import { pick } from "./rng.js";
import { price } from "./economy.js";
import { today } from "./gift.js";
import { track } from "./missions.js";
export const mgLeft = () => {
  const m = S.mgd && S.mgd.day === today() ? S.mgd : (S.mgd = { day: today(), n: 0 });
  return Math.max(0, 3 - m.n);
};
export function mgReward(won, eur) {
  const left = mgLeft();
  if (left > 0) {
    S.mgd.n++;
    if (eur) S.money += eur;
    if (won) track("mgwin");
  }
  return left > 0;
}
export const pool4 = (f) => CARDS.filter((c) => S.sets.includes(c.s) && f(c));
export function mgNew(k) {
  if (k === "hl") {
    G.MG = { k, round: 0, ok: 0, step: "pick" };
    mgHL();
  }
  if (k === "who") {
    if (G.MODE !== "real") {
      ui.toast("Este minijuego necesita las imágenes reales de las cartas");
      return;
    }
    G.MG = { k, round: 0, ok: 0, step: "pick" };
    mgWho();
  }
  if (k === "duel") {
    const mine = S.items.filter((i) => !i.res && !i.gq && !i.fkK);
    if (mine.length < 3) {
      ui.toast("Necesitas al menos 3 cartas para un duelo");
      return;
    }
    G.MG = { k, sel: [], opp: pick(["hugo", "lucia", "iker"]), step: "choose", score: [0, 0], round: 0 };
  }
  ui.openM("mg");
}
export function mgHL() {
  const l = pool4((c) => (price(c.id) >= 0.3 && c.img) || (G.MODE !== "real" && price(c.id) >= 0.3));
  let a,
    b,
    t = 0;
  do {
    a = pick(l);
    b = pick(l);
    t++;
  } while (t < 60 && (a === b || Math.max(price(a.id), price(b.id)) / Math.min(price(a.id), price(b.id)) < 1.3));
  G.MG.a = a;
  G.MG.b = b;
  G.MG.step = "pick";
}
export const wname = (n) =>
  n
    .replace(/\s+(ex|EX|GX|V|VMAX|VSTAR|δ|☆|LV\.X|BREAK|Prime|Legend)\b.*$/, "")
    .replace(/^(Dark|Light|Shining|Radiant|Team .*?'s|.*?'s)\s+/, "")
    .trim();
export function mgWho() {
  const l = pool4(
    (c) =>
      c.img &&
      (c.sup
        ? c.sup === "Pokémon"
        : /^[A-Z]/.test(c.name) &&
          !/Energy|Ball|Potion|Professor|Rocket|Trainer|Stadium|Candy|Research|Switch|Catcher|Boss|Rod|Belt|Band|Helmet|Gear|Poffin|Stretcher|Invitation|Orders/i.test(
            c.name,
          )),
  );
  const c = pick(l);
  const names = [...new Set(l.map((x) => wname(x.name)))].filter((n) => n !== wname(c.name));
  G.MG.c = c;
  G.MG.opts = [wname(c.name), ...names.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
  G.MG.step = "pick";
  G.MG.t0 = performance.now();
}
export const power = (c) => {
  const h = parseInt(c.hp) || 0;
  if (h) return h;
  let x = 0;
  for (const ch of c.id) x = (x * 31 + ch.charCodeAt(0)) % 997;
  return ({ C: 50, U: 70, R: 90, DR: 150, IR: 110, UR: 170, SIR: 180, HR: 200 }[c.r] || 80) + (x % 40);
};
export const TYPEW = {
  Fire: "Grass",
  Grass: "Water",
  Water: "Fire",
  Lightning: "Water",
  Fighting: "Lightning",
  Psychic: "Fighting",
  Darkness: "Psychic",
  Metal: "Fairy",
  Fairy: "Darkness",
  Dragon: "Dragon",
};
export function mgEnd(again, title, res, win, eur) {
  const got = mgReward(win, eur);
  G.MG = {
    k: "end",
    again,
    title,
    res,
    win,
    rewTxt: got
      ? (eur ? `Premio: +${fmt(eur)}` : "Sin premio esta vez") + (win ? " · cuenta para la Medalla Pantano" : "")
      : "Ya no quedan premios hoy, ¡pero puedes seguir jugando!",
  };
  if (win) {
    ui.confetti(2, "#ffd54a");
    ui.sfx("ach");
  }
  ui.hud();
  ui.renderM();
}
export const HUNTS = [
  [30, 330],
  [790, 210],
  [350, 250],
  [150, 130],
  [500, 520],
  [620, 60],
  [40, 560],
  [760, 560],
  [260, 600],
  [700, 605],
  [440, 600],
  [200, 520],
  [110, 370],
  [600, 380],
  [-80, 600],
  [880, 598],
  [560, 700],
  [150, 712],
];
export function huntDay() {
  if (!S.hunt || S.hunt.day !== S.day) {
    const l = HUNTS.slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    S.hunt = { day: S.day, p: l.map(([x, y]) => ({ x, y, g: 0 })), done: 0 };
  }
  return S.hunt;
}
