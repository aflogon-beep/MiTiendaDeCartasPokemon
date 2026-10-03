// Emma y Álvaro en la tienda. Álvaro atiende la caja, con lo que elijas en Personalizar (si no, su ropa de
// siempre). Emma trabaja junto al ordenador de las cuentas, con su calculadora; si no hay clientes y tienes
// el sofá, se va al sofá, y vuelve cuando entra alguien. En el título y la historia, la tienda como antes.
import { cx } from "./canvas.js";
import { CHARS, drawMini } from "./characters.js";
import { G, S, meSetOf } from "../core/state.js";
import { custs } from "../core/customers/move.js";
import { navPath } from "../world/nav.js";
import { LAY } from "../world/layout.js";

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

/* ---------- Emma: mesa del ordenador ↔ sofá ---------- */
const DESK = { x: 664, y: 152 },
  SOFA = { x: 560, y: 538 }, // delante del sofá; sentada, se dibuja en el asiento
  SEAT = { x: 560, y: 511 },
  SPEED = 45;
export const EMMA = { x: DESK.x, y: DESK.y, at: "desk", goal: "desk", path: [], empty: 0, ph: 0 };

export function familyTick(dt) {
  const E = EMMA;
  E.empty = custs.length ? 0 : E.empty + dt;
  const goal = S.decor && S.decor.sofa && E.empty > 4 ? "sofa" : "desk";
  if (goal !== E.goal) {
    E.goal = goal;
    const t = goal === "sofa" ? SOFA : DESK;
    E.at = "walk";
    E.path = navPath(E.x, E.y, t.x, t.y).concat([t]);
  }
  if (E.at !== "walk") return;
  let step = SPEED * dt;
  while (step > 0 && E.path.length) {
    const p = E.path[0],
      d = Math.hypot(p.x - E.x, p.y - E.y);
    if (d <= step) {
      E.x = p.x;
      E.y = p.y;
      step -= d;
      E.path.shift();
    } else {
      E.x += ((p.x - E.x) * step) / d;
      E.y += ((p.y - E.y) * step) / d;
      step = 0;
    }
  }
  E.ph += dt * 11;
  if (!E.path.length) E.at = E.goal;
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

/** Añade a Álvaro (caja) y Emma a la lista de dibujo. Devuelve false en el título y la historia. */
export function familyLayers(L) {
  if (G.STORY || G.TITLE) return false;
  L.push({ y: LAY.cashier.y, f: () => blit(alvaroSprite(), LAY.cashier.x, LAY.cashier.y) });
  L.push({ y: EMMA.at === "sofa" ? 519 : EMMA.y, f: drawEmma });
  return true;
}
