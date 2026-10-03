// Emma y Álvaro en la tienda. Álvaro, con lo que elijas en Personalizar (si no, su ropa de siempre), atiende
// la caja; si contratas al cajero, el cajero se pone en la caja y Álvaro pasea por la tienda (vitrina,
// estanterías, mesa de juego). Emma trabaja junto al ordenador de las cuentas, con su calculadora; si no hay
// clientes y tienes el sofá, se va al sofá, y vuelve cuando entra alguien. En el título y la historia, la
// tienda como antes.
import { cx } from "./canvas.js";
import { CHARS, drawMini } from "./characters.js";
import { G, S, meSetOf } from "../core/state.js";
import { custs } from "../core/customers/move.js";
import { NG, navBuild, navCell, navFree, navLOS, navPath, navSig } from "../world/nav.js";
import { LAY } from "../world/layout.js";
import { drawPersonAt } from "./people.js";

/* ---------- Muñecos ya dibujados (se pintan una vez y se copian en cada fotograma) ---------- */
const R = 5, // píxeles por unidad del mundo
  SW = 72,
  SH = 100,
  OX = 36,
  OY = 92; // los pies, dentro del dibujo
const SPR = {};
function sprite(key, paint) {
  if (!SPR[key]) {
    // Al probar colores en Personalizar se crean varios: se guardan como mucho 6
    const ks = Object.keys(SPR);
    if (ks.length >= 6) delete SPR[ks.find((k) => k !== "emma")];
    const c = document.createElement("canvas");
    c.width = SW * R;
    c.height = SH * R;
    const x = c.getContext("2d");
    x.scale(R, R);
    x.translate(OX, OY);
    paint(x);
    SPR[key] = c;
  }
  return SPR[key];
}

/** Mezcla un color con negro (f < 0) o blanco (f > 0). */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16),
    t = f < 0 ? 0 : 255,
    a = Math.abs(f),
    c = (v) => Math.round(v + (t - v) * a);
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Álvaro con lo elegido en Personalizar (camiseta, pelo y gorra). */
export function alvaroLook() {
  const m = meSetOf(),
    ch = Object.assign({}, CHARS.alvaro);
  if (m.shirt) Object.assign(ch, { shirt: m.shirt, shirtS: shade(m.shirt, -0.22) });
  if (m.hair)
    Object.assign(ch, {
      hair: m.hair,
      hairS: shade(m.hair, -0.3),
      hairH: shade(m.hair, 0.35),
      brow: shade(m.hair, -0.45),
    });
  return { ch, cap: m.cap || null, key: "alvaro|" + [m.shirt, m.hair, m.cap].join("|") };
}
function paintCap(x, col) {
  x.fillStyle = col;
  x.beginPath();
  x.ellipse(0, -62, 12.5, 10, 0, Math.PI, 0);
  x.fill();
  x.fillStyle = shade(col, -0.25);
  x.beginPath();
  x.ellipse(0, -61.5, 13, 3.4, 0, 0, Math.PI * 2);
  x.fill();
}
function alvaroSprite() {
  const L = alvaroLook();
  return sprite(L.key, (x) => {
    drawMini(x, L.ch, 0, 0, 0);
    if (L.cap) paintCap(x, L.cap);
  });
}
const emmaSprite = () => sprite("emma", (x) => drawMini(x, CHARS.emma, 0, 0, 0));
const blit = (spr, x, y) => cx.drawImage(spr, x - OX, y - OY, SW, SH);

/** Álvaro como imagen, para la vista previa de Personalizar. */
export function alvaroImg() {
  const s = alvaroSprite(),
    c = document.createElement("canvas");
  c.width = 160;
  c.height = 200;
  c.getContext("2d").drawImage(s, 0, (OY - 86) * R, SW * R, 90 * R, 0, 0, 160, 200);
  return c.toDataURL();
}

/** Avanza por el camino (path); devuelve true al llegar al final. */
function walkPath(o, dt, speed) {
  let step = speed * dt;
  while (step > 0 && o.path.length) {
    const p = o.path[0],
      d = Math.hypot(p.x - o.x, p.y - o.y);
    if (d <= step) {
      o.x = p.x;
      o.y = p.y;
      step -= d;
      o.path.shift();
    } else {
      o.x += ((p.x - o.x) * step) / d;
      o.y += ((p.y - o.y) * step) / d;
      step = 0;
    }
  }
  o.ph += dt * 11;
  return !o.path.length;
}

/* ---------- Emma: mesa del ordenador ↔ sofá ---------- */
const DESK = { x: 664, y: 152 },
  SOFA = { x: 560, y: 538 }, // delante del sofá; sentada, se dibuja en el asiento
  SEAT = { x: 560, y: 511 },
  SPEED = 45;
export const EMMA = { x: DESK.x, y: DESK.y, at: "desk", goal: "desk", path: [], empty: 0, ph: 0 };

function emmaTick(dt) {
  const E = EMMA;
  E.empty = custs.length ? 0 : E.empty + dt;
  const goal = S.decor && S.decor.sofa && E.empty > 4 ? "sofa" : "desk";
  if (goal !== E.goal) {
    E.goal = goal;
    const t = goal === "sofa" ? SOFA : DESK;
    E.at = "walk";
    E.path = navPath(E.x, E.y, t.x, t.y).concat([t]);
  }
  if (E.at === "walk" && walkPath(E, dt, SPEED)) E.at = E.goal;
}

/* ---------- Álvaro: caja ↔ paseo por la tienda (con cajero contratado) ---------- */
const EXIT = { x: 748, y: 495 }; // por detrás del mostrador, al final de la caja
export const ALVARO = { x: LAY.cashier.x, y: LAY.cashier.y, at: "till", path: [], wait: 0, last: -1, ph: 0 };

/** Sitios donde se para a mirar: la vitrina, las estanterías y la mesa de juego (si la hay). */
function alvaroSpots() {
  const c = LAY.cs(),
    l = [{ x: c.x + c.w / 2, y: c.y + c.h + 34 }];
  for (let i = 0; i < 3 + 3 * S.up.shelf + (S.annex ? 2 : 0); i++) {
    const sh = LAY.shelf(i);
    l.push({ x: sh.x + sh.w / 2, y: sh.y + sh.h + 40 });
  }
  if (S.decor.table) l.push({ x: 238, y: 374 });
  return l;
}
/** Otro sitio al que se pueda llegar desde donde está (centro de una celda libre). */
function nextSpot(A) {
  if (!NG.g || navSig() !== NG.sig) navBuild(); // la cuadrícula, al día con los muebles
  const l = alvaroSpots();
  for (let t = 0; t < 8; t++) {
    const k = Math.floor(Math.random() * l.length);
    if (k === A.last && l.length > 1) continue;
    const [cc, rr] = navFree(...navCell(l[k].x, l[k].y)),
      p = { x: NG.x0 + (cc + 0.5) * NG.cs, y: NG.y0 + (rr + 0.5) * NG.cs },
      path = navPath(A.x, A.y, p.x, p.y);
    if (!path.length && !navLOS(A.x, A.y, p.x, p.y)) continue;
    A.last = k;
    return path.concat([p]);
  }
  return null;
}
function alvaroTick(dt) {
  const A = ALVARO,
    free = !!(S.staff && S.staff.cashier),
    T = LAY.cashier;
  if (free && A.at === "till") {
    // Sale por detrás del mostrador
    A.at = "walk";
    A.path = [EXIT];
  } else if (!free && A.at !== "till" && A.at !== "back") {
    // Sin cajero, vuelve a la caja por el mismo sitio
    A.at = "back";
    A.path = navPath(A.x, A.y, EXIT.x, EXIT.y).concat([EXIT, { x: T.x, y: T.y }]);
  }
  if (A.at === "walk" || A.at === "back") {
    if (walkPath(A, dt, 42)) {
      A.at = A.at === "back" ? "till" : "stay";
      A.wait = A.x === EXIT.x && A.y === EXIT.y ? 0.3 : 4 + Math.random() * 5;
    }
  } else if (A.at === "stay") {
    A.wait -= dt;
    if (A.wait <= 0) {
      const path = nextSpot(A);
      if (path) ((A.at = "walk"), (A.path = path));
      else A.wait = 2;
    }
  }
}

export function familyTick(dt) {
  emmaTick(dt);
  alvaroTick(dt);
}

function drawEmma() {
  const E = EMMA,
    s = emmaSprite();
  if (E.at === "sofa") {
    // Sentada: lo que queda por debajo del asiento no se ve
    cx.save();
    cx.beginPath();
    cx.rect(SEAT.x - OX, SEAT.y - OY, SW, OY - 8);
    cx.clip();
    blit(s, SEAT.x, SEAT.y);
    cx.restore();
    return;
  }
  const b = E.at === "walk" ? Math.sin(E.ph) * 1.5 : 0;
  blit(s, E.x, E.y + b);
  if (E.at === "desk") {
    // La calculadora, en las manos
    cx.fillStyle = "#3a3d46";
    cx.fillRect(E.x - 4, E.y - 29, 8, 10);
    cx.fillStyle = "#9fd8a8";
    cx.fillRect(E.x - 3, E.y - 28, 6, 2.5);
  }
}

/** Añade a Álvaro, Emma y el cajero (si lo hay) a la lista de dibujo. Devuelve false en el título y la historia. */
export function familyLayers(L) {
  if (G.STORY || G.TITLE) return false;
  const A = ALVARO,
    T = LAY.cashier;
  L.push({
    y: A.y,
    f: () => blit(alvaroSprite(), A.x, A.y + (A.at === "walk" || A.at === "back" ? Math.sin(A.ph) * 1.5 : 0)),
  });
  if (S.staff.cashier)
    L.push({
      y: T.y + 0.5,
      f: () =>
        drawPersonAt(
          T.x,
          T.y,
          { col: "#2fa557", hair: "#5a3a2a", sc: 1, cap: "#2fa557" },
          "#e0a878",
          0,
          false,
          "cashier",
        ),
    });
  L.push({ y: EMMA.at === "sofa" ? 519 : EMMA.y, f: drawEmma });
  return true;
}
