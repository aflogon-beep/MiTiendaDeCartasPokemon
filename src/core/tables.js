// Mesa de juego: con la tienda abierta (y sin torneo), llegan grupos de 2 o 4 jugadores, se sientan, juegan
// una o dos partidas y, al levantarse, pagan 2 € por jugador y partida (en el ticket: «Mesa de juego»).
// A veces uno compra fundas o un sobre de tus estanterías, al precio que tengas puesto (si le parece bien).
import { ui } from "./bus.js";
import { S } from "./state.js";
import { DAYLEN } from "./constants.js";
import { packAcc, pPrice, pStock, prodAcc } from "./economy.js";
import { track } from "./missions.js";
import { rnd } from "./rng.js";
import { fmt } from "./util.js";
import { routeTo } from "../world/nav.js";
import { dirtDrop } from "./dirt.js";

export const TBL_FEE = 2; // € por jugador y partida
export const TBL_BUY = 0.35; // probabilidad de que el grupo compre algo al irse
/** Las cuatro sillas (como en los torneos): arriba, detrás de la mesa, y abajo, delante. */
export const SEATS = [
  { x: 175, y: 262, ay: 244 },
  { x: 300, y: 262, ay: 244 },
  { x: 175, y: 356, ay: 374 },
  { x: 300, y: 356, ay: 374 },
];
const LOOKS = [
  ["#3d7bd9", "#222", "#f2c9a0", "kid"],
  ["#d9402a", "#5a3a2a", "#e0a878", "collector"],
  ["#2fa557", "#222", "#a9714b", "kid"],
  ["#8e4cb5", "#c9a227", "#f2c9a0", "collector"],
  ["#f2b705", "#3b2a1a", "#e0a878", "kid"],
  ["#1f8a8a", "#222", "#c98d5c", "collector"],
];
export const players = []; // jugadores en la tienda (no se guardan: al cerrar se van)
export const TBL = { next: 6 };

/** ¿Está ocupada la silla i? (para no dibujarla debajo del jugador) */
export const seatTaken = (i) => players.some((p) => p.seat === i && p.st === "play");
const seatFree = (i) => !players.some((p) => p.seat === i);
export const tableOn = () =>
  !!(S.decor && S.decor.table) && S.phase === "open" && !S.tour && !(S.tut && S.tut.on) && S.clock < DAYLEN * 0.85;

/** Llega un grupo: 4 si la mesa está libre (a veces), si no 2 en un lado libre. Devuelve los jugadores. */
export function tableArrive(R = Math.random) {
  const all = [0, 1, 2, 3].every(seatFree),
    sides = [
      [0, 2],
      [1, 3],
    ].filter((s) => s.every(seatFree));
  if (!sides.length) return [];
  const seats = all && R() < 0.35 ? [0, 1, 2, 3] : sides[Math.floor(R() * sides.length)],
    games = R() < 0.4 ? 2 : 1,
    t = games * (10 + R() * 5),
    g = { games, n: seats.length };
  const out = seats.map((seat, k) => {
    const L = LOOKS[Math.floor(R() * LOOKS.length)],
      s = SEATS[seat],
      p = {
        seat,
        g,
        st: "in",
        t,
        x: 358 + (k % 2 ? -1 : 1) * (150 + rnd(120)),
        y: 590 + rnd(14),
        sp: 46 + rnd(10),
        ph: 0,
        mv: false,
        ct: { col: L[0], hair: L[1], sc: 0.9 },
        skin: L[2],
        type: L[3],
        play: R() * 2, // cuándo juega su próxima carta
        card: 0, // carta que lleva hacia el centro (0 = ninguna)
      };
    routeTo(p, s.x, s.ay);
    p.wps.push({ x: s.x, y: s.ay }, { x: s.x, y: s.y });
    return p;
  });
  players.push(...out);
  return out;
}

/** Un grupo termina: pagan la mesa y, a veces, uno compra algo. Devuelve lo cobrado { fee, buy }. */
export function tablePay(g, R = Math.random) {
  if (g.paid) return null;
  g.paid = true;
  const fee = TBL_FEE * g.n * g.games;
  S.money += fee;
  S.stats.tbl = (S.stats.tbl || 0) + fee;
  S.stats.tblN = (S.stats.tblN || 0) + g.games;
  track("earn", fee);
  let buy = null;
  if (R() < TBL_BUY) {
    const pid = "acc:sleeves";
    if (pStock(pid) > 0 && R() < prodAcc(pid)) {
      buy = { k: "prod", pid, got: pPrice(pid), ic: "🛡️" };
      S.prod[pid] = pStock(pid) - 1;
      track("sellprod", 1);
    } else {
      const sets = (S.slots || []).filter((s) => s && S.sealed[s] > 0 && S.shelf[s] != null);
      const s = sets.length ? sets[Math.floor(R() * sets.length)] : null;
      if (s && R() < packAcc(s)) {
        buy = { k: "pack", s, got: S.shelf[s], ic: "🎴" };
        S.sealed[s]--;
        track("sellpack", 1);
        S.lt.setSold = S.lt.setSold || {};
        S.lt.setSold[s] = (S.lt.setSold[s] || 0) + 1;
      }
    }
    if (buy) {
      S.money += buy.got;
      S.stats.inc += buy.got;
      S.sales++;
      track("earn", buy.got);
    }
  }
  return { fee, buy };
}

function walk(p, dt) {
  const wp = p.wps[0];
  if (!wp) return ((p.mv = false), true);
  const dx = wp.x - p.x,
    dy = wp.y - p.y,
    d = Math.hypot(dx, dy),
    stp = p.sp * dt;
  if (d <= Math.max(2, stp)) {
    p.x = wp.x;
    p.y = wp.y;
    p.wps.shift();
  } else {
    p.x += (dx * stp) / d;
    p.y += (dy * stp) / d;
  }
  p.mv = true;
  p.ph += dt * 11;
  return !p.wps.length;
}

function stand(p) {
  const s = SEATS[p.seat];
  p.st = "leave";
  p.card = 0;
  p.wps = [{ x: s.x, y: s.ay }];
  const tmp = { x: s.x, y: s.ay },
    ex = { x: 358 + (p.seat % 2 ? 1 : -1) * (380 + rnd(200)), y: 596 + rnd(10) };
  routeTo(tmp, ex.x, ex.y);
  p.wps.push(...tmp.wps, ex);
}

/** Cada fotograma: llegan grupos, juegan (cartas al centro de la mesa), pagan y se van. */
export function tablesTick(dt) {
  if (tableOn()) {
    TBL.next -= dt;
    if (TBL.next <= 0) {
      TBL.next = 9 + Math.random() * 12;
      tableArrive();
    }
  }
  for (const p of players) {
    if (p.st === "in" && walk(p, dt)) {
      p.st = "play";
      p.mv = false;
    } else if (p.st === "play") {
      p.t -= dt;
      p.play -= dt;
      if (p.card) p.card = Math.min(1, p.card + dt * 2.5);
      if (p.play <= 0) ((p.card = 0.01), (p.play = 1.4 + Math.random() * 1.6));
    } else if (p.st === "leave") walk(p, dt);
  }
  // Un grupo termina cuando todos han jugado su tiempo (o al cerrar la tienda): pagan y se levantan
  const done = new Set(
    players
      .filter(
        (p) =>
          p.st === "play" && (p.t <= 0 || S.phase !== "open") && players.every((q) => q.g !== p.g || q.st === "play"),
      )
      .map((p) => p.g),
  );
  for (const g of done) {
    const r = tablePay(g),
      grp = players.filter((p) => p.g === g);
    grp.forEach(stand);
    if (!r) continue;
    const c = grp[0];
    ui.fx(c.x, c.y - 70, "🎲 +" + fmt(r.fee), "#4cc98a");
    ui.coinBurst(238, 300, r.fee);
    ui.sfx("coin");
    if (r.buy) ui.fx(grp[grp.length - 1].x, grp[grp.length - 1].y - 90, r.buy.ic + " +" + fmt(r.buy.got), "#4cc98a");
    dirtDrop(c.x, SEATS[c.seat].ay); // a veces dejan algo en el suelo (core/dirt.js)
    ui.hud();
  }
  // Fuera de la tienda, desaparecen
  for (let i = players.length - 1; i >= 0; i--)
    if (players[i].st === "leave" && !players[i].wps.length) players.splice(i, 1);
}
/** ¿Queda algún jugador dentro? (la persiana espera a que salgan) */
export const playersIn = (fy) => players.some((p) => p.st !== "leave" || p.y < fy);
/** Al cerrar el día: nadie se queda. */
export function tablesReset() {
  players.length = 0;
  TBL.next = 6;
}
