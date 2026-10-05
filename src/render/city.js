// Ciudad: calles, edificios, parque, plaza, colegio, terraza, fuente, tienda rival, mercadillo, pájaros y peatones.
import { ui } from "../core/bus.js";
import { CX0, CX1, CY0, CY1, XS0, XS1 } from "../world/layout.js";
import { LITE, VIS, cx, rr, txt } from "./canvas.js";
import { REGS } from "../core/constants.js";
import { S } from "../core/state.js";
import { SKINS, drawPerson } from "./people.js";
import { clamp } from "../core/util.js";
import { custs } from "../core/customers/move.js";
import { dayT } from "../core/day.js";
import { marketDay } from "../core/market.js";
import { mkOutfit } from "../core/customers/outfit.js";
import { nightK } from "./lighting.js";
import { pick, rnd, srand } from "../core/rng.js";
import { regS } from "../core/regulars.js";
import { season } from "../core/events.js";
import { setName } from "../core/cards/sets.js";
import { tlT } from "./cars.js";
import { fkForSale } from "../core/funko.js";
export let CITYWIN = [];
/** Cartel «SE TRASPASA» de la librería (zona Funko, desde el nivel 5). */
function traspasa(g, x, y) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.1);
  g.fillStyle = "rgba(0,0,0,.25)";
  g.fillRect(-58, -12, 120, 34);
  g.fillStyle = "#fff";
  g.fillRect(-62, -17, 124, 34);
  g.strokeStyle = "#c0392b";
  g.lineWidth = 3;
  g.strokeRect(-59, -14, 118, 28);
  g.fillStyle = "#c0392b";
  g.font = "900 15px 'Fredoka',system-ui,sans-serif";
  g.textAlign = "center";
  g.fillText("SE TRASPASA", 0, 6);
  g.restore();
}
export function roofDraw(g, x, y, w, h, R, se) {
  const cols = ["#8a8f96", "#9a7b5f", "#7d8a7a", "#a86b5a", "#868c9c"];
  g.fillStyle = cols[Math.floor(R() * cols.length)];
  g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(0,0,0,.28)";
  g.lineWidth = 4;
  g.strokeRect(x + 2, y + 2, w - 4, h - 4);
  for (let i = 0; i < (w * h) / 220; i++) {
    g.fillStyle = `rgba(${R() < 0.5 ? 0 : 255},${R() < 0.5 ? 0 : 255},${R() < 0.5 ? 0 : 255},.04)`;
    g.fillRect(x + R() * w, y + R() * h, 2, 2);
  }
  const n = 1 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const ax = x + 12 + R() * (w - 50),
      ay = y + 12 + R() * (h - 50),
      t = R();
    if (t < 0.45) {
      g.fillStyle = "#c9ccd2";
      g.fillRect(ax, ay, 30, 22);
      g.fillStyle = "#9aa0a8";
      g.beginPath();
      g.arc(ax + 15, ay + 11, 8, 0, 7);
      g.fill();
      g.strokeStyle = "#6d737c";
      g.lineWidth = 1;
      g.stroke();
    } else if (t < 0.75) {
      g.fillStyle = "#a8d4e8";
      g.fillRect(ax, ay, 34, 24);
      g.strokeStyle = "#5b6470";
      g.lineWidth = 2;
      g.strokeRect(ax, ay, 34, 24);
      g.beginPath();
      g.moveTo(ax + 17, ay);
      g.lineTo(ax + 17, ay + 24);
      g.stroke();
    } else {
      g.fillStyle = "#6b4527";
      g.beginPath();
      g.arc(ax + 14, ay + 14, 13, 0, 7);
      g.fill();
      g.strokeStyle = "#4a2f18";
      g.lineWidth = 2;
      g.stroke();
    }
  }
  if (se === "xmas" || se === "winter") {
    g.fillStyle = "rgba(255,255,255,.72)";
    g.fillRect(x + 3, y + 3, w - 6, h - 6);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = "rgba(200,215,230,.6)";
      g.beginPath();
      g.ellipse(x + R() * w, y + R() * h, 10 + R() * 20, 5 + R() * 8, 0, 0, 7);
      g.fill();
    }
  }
  if (se === "autumn")
    for (let i = 0; i < (w * h) / 900; i++) {
      g.fillStyle = ["#d9822b", "#b5451b", "#e0b43a"][i % 3];
      g.beginPath();
      g.ellipse(x + R() * w, y + R() * h, 3, 1.6, R() * 3, 0, 7);
      g.fill();
    }
}
export function facadeDraw(g, x, y, w, name, col, R) {
  g.fillStyle = "#e8e1d3";
  g.fillRect(x, y, w, 54);
  g.fillStyle = col;
  g.fillRect(x + 8, y + 2, w - 16, 13);
  g.fillStyle = "#fff";
  g.font = "700 10px 'Fredoka',system-ui,sans-serif";
  g.textAlign = "center";
  g.fillText(name, x + w / 2, y + 12);
  for (let i = 0; i < w - 16; i += 14) {
    g.fillStyle = (i / 14) % 2 ? col : "#fff";
    g.fillRect(x + 8 + i, y + 16, 14, 9);
  }
  g.fillStyle = "rgba(0,0,0,.18)";
  g.fillRect(x + 8, y + 25, w - 16, 2);
  const dw = 26,
    dx = x + w / 2 - dw / 2;
  g.fillStyle = "#3a2a20";
  g.fillRect(dx, y + 28, dw, 26);
  g.fillStyle = "#d9b36c";
  g.fillRect(dx + dw - 6, y + 40, 2, 4);
  [
    [x + 10, dx - 6],
    [dx + dw + 6, x + w - 10],
  ].forEach(([a, b]) => {
    if (b - a < 12) return;
    g.fillStyle = "#9fc3d6";
    g.fillRect(a, y + 29, b - a, 20);
    g.fillStyle = "rgba(255,255,255,.35)";
    g.fillRect(a + 6, y + 29, 6, 20);
    g.strokeStyle = "#5b6470";
    g.lineWidth = 2;
    g.strokeRect(a, y + 29, b - a, 20);
    CITYWIN.push([a, y + 29, b - a, 20]);
  });
}
export function drawTree(x, y) {
  const se = season();
  cx.fillStyle = "rgba(0,0,0,.25)";
  cx.beginPath();
  cx.ellipse(x + 6, y + 2, 20, 7, 0, 0, 7);
  cx.fill();
  cx.fillStyle = "#6b4527";
  cx.fillRect(x - 3, y - 18, 6, 20);
  const c1 = se === "autumn" ? "#c9661f" : se === "xmas" || se === "winter" ? "#4f6b5a" : "#2f7d43",
    c2 = se === "autumn" ? "#e0a13a" : se === "xmas" || se === "winter" ? "#e8eef2" : "#48a862";
  cx.fillStyle = c1;
  [
    [-10, -26],
    [10, -26],
    [0, -38],
    [-4, -22],
    [6, -32],
  ].forEach(([dx, dy]) => {
    cx.beginPath();
    cx.arc(x + dx, y + dy, 13, 0, 7);
    cx.fill();
  });
  cx.fillStyle = c2;
  cx.beginPath();
  cx.arc(x - 4, y - 36, 7, 0, 7);
  cx.fill();
}
export function drawStreet() {
  const se = season(),
    snow = se === "xmas" || se === "winter",
    a = CX0,
    w = CX1 - CX0;
  cx.fillStyle = "#9aa0a8";
  cx.fillRect(a, 570, w, 42);
  cx.fillRect(a, 694, w, 44);
  cx.strokeStyle = "rgba(0,0,0,.12)";
  cx.lineWidth = 1;
  cx.beginPath();
  for (let x = a; x <= CX1; x += 32) {
    cx.moveTo(x, 570);
    cx.lineTo(x, 612);
    cx.moveTo(x, 694);
    cx.lineTo(x, 738);
  }
  cx.moveTo(a, 591);
  cx.lineTo(CX1, 591);
  cx.moveTo(a, 716);
  cx.lineTo(CX1, 716);
  cx.stroke();
  cx.fillStyle = "#6d737c";
  cx.fillRect(a, 612, w, 4);
  cx.fillRect(a, 690, w, 4);
  cx.fillStyle = "#3a3e46";
  cx.fillRect(a, 616, w, 74);
  cx.fillStyle = "#e8e8e8";
  for (let x = a + 10; x < CX1; x += 60) cx.fillRect(x, 652, 30, 3);
  cx.fillStyle = "rgba(255,255,255,.5)";
  cx.fillRect(a, 620, w, 2);
  cx.fillRect(a, 686, w, 2);
  cx.fillStyle = "#f2f2f2";
  for (let y = 622; y < 686; y += 10) cx.fillRect(560, y, 70, 6);
  if (snow) {
    cx.fillStyle = "rgba(255,255,255,.75)";
    for (let x = a; x < CX1; x += 46) {
      cx.beginPath();
      cx.ellipse(x + 20, 572, 26, 5, 0, 0, 7);
      cx.fill();
      cx.beginPath();
      cx.ellipse(x + 10, 736, 26, 5, 0, 0, 7);
      cx.fill();
    }
    cx.fillStyle = "rgba(255,255,255,.3)";
    cx.fillRect(a, 610, w, 4);
    cx.fillRect(a, 692, w, 4);
  }
  if (se === "autumn")
    for (let i = 0; i < 120; i++) {
      cx.fillStyle = ["#d9822b", "#b5451b", "#e0b43a"][i % 3];
      cx.beginPath();
      cx.ellipse(a + ((i * 97) % w), (i % 2 ? 575 : 698) + ((i * 37) % 34), 3, 1.6, i, 0, 7);
      cx.fill();
    }
}
export const LAMPS = (() => {
  const l = [];
  for (let x = CX0 + 90; x < CX1; x += 200) l.push([x, 612, 1], [x + 100, 694, -1]);
  return l.filter(([x]) => x < 1066 || x > 1184);
})();
export function streetLamp(x, y, s) {
  y = y || 612;
  s = s || 1;
  cx.fillStyle = "rgba(0,0,0,.25)";
  cx.beginPath();
  cx.ellipse(x + 2, y, 8, 3, 0, 0, 7);
  cx.fill();
  cx.fillStyle = "#2b2f38";
  cx.fillRect(x - 2, y - 64, 4, 64);
  cx.fillRect(s > 0 ? x - 2 : x - 12, y - 64, 14, 3);
  cx.fillStyle = "#3a3f4b";
  rr(s > 0 ? x + 6 : x - 18, y - 66, 12, 7, 2);
  cx.fill();
  cx.fillStyle = nightK() > 0.2 ? "#fff3b0" : "#c9ccd2";
  cx.fillRect(s > 0 ? x + 8 : x - 16, y - 59, 8, 2);
}
export function updPed(dt) {
  updAlley(dt);
  VIS.pedT -= dt;
  const nk = nightK();
  if (VIS.pedT <= 0) {
    VIS.pedT = (1 + Math.random() * 2.2) * (1 + nk * 2);
    if (VIS.ped.length < (LITE() ? 6 : 14)) {
      const dir = Math.random() < 0.5 ? 1 : -1,
        far = Math.random() < 0.45;
      VIS.ped.push({
        x: dir > 0 ? CX0 - 20 : CX1 + 20,
        y: far ? 700 + rnd(30) : 582 + rnd(24),
        dir,
        sp: 30 + rnd(22),
        ph: rnd(6),
        out: mkOutfit(pick(["kid", "collector", "investor", "whale", "seller"]), null),
        skin: pick(SKINS),
        dog: Math.random() < 0.22,
        dogc: pick(["#c47a2c", "#f4f4f4", "#3a2a20", "#d9b36c"]),
      });
    }
  }
  if (S.rival && S.rival.on)
    VIS.ped.forEach((p) => {
      if (!p.cross && !p.into && p.y >= 698 && Math.abs(p.x - 950) < 6 && Math.random() < (0.35 * S.rival.str) / 60)
        p.into = { x: 950, y: 742 };
    });
  {
    const t = dayT();
    if (S.phase !== "closed" && t > 0.55 && t < 0.7 && Math.random() < dt * 0.5 && VIS.ped.length < 18)
      VIS.ped.push({
        x: 1250,
        y: 712,
        dir: -1,
        sp: 40,
        ph: 0,
        out: Object.assign(mkOutfit("kid", null), { acc: "backpack" }),
        skin: pick(SKINS),
      });
  }
  const ct = tlT();
  if (ct > 11 && ct < 13.5 && Math.random() < dt * 0.8 && VIS.ped.filter((p) => p.cross).length < 3) {
    const up = Math.random() < 0.5;
    VIS.ped.push({
      x: 568 + rnd(54),
      y: up ? 702 : 604,
      cross: up ? -1 : 1,
      dir: 1,
      sp: 34,
      ph: 0,
      out: mkOutfit(pick(["kid", "collector", "investor"]), null),
      skin: pick(SKINS),
    });
  }
  VIS.ped.forEach((p) => {
    p.ph += dt * 9;
    if (p.into) {
      const dx = p.into.x - p.x,
        dy = p.into.y - p.y,
        d = Math.hypot(dx, dy);
      if (d < 3) {
        p.gone = 1;
        return;
      }
      p.x += (dx / d) * p.sp * dt;
      p.y += (dy / d) * p.sp * dt;
      p.dir = dx > 0 ? 1 : -1;
      return;
    }
    if (p.cross) {
      p.y += p.cross * 36 * dt;
      if ((p.cross > 0 && p.y >= 702) || (p.cross < 0 && p.y <= 600)) {
        p.cross = 0;
        p.dir = Math.random() < 0.5 ? 1 : -1;
        p.sp = 30 + rnd(20);
      }
    } else p.x += p.dir * p.sp * dt;
  });
  VIS.ped = VIS.ped.filter((p) => p.x > CX0 - 30 && p.x < CX1 + 30 && !p.gone);
}
export function initBirds() {
  VIS.birds = [];
  for (let f = 0; f < 4; f++) {
    const bx = CX0 + 260 + f * 400,
      by = -170 + rnd(80);
    for (let i = 0; i < 4 + rnd(3); i++)
      VIS.birds.push({ x: bx + rnd(50), y: by + rnd(24), st: "sit", t: Math.random() * 5, vx: 0, vy: 0, h: 0 });
  }
  [
    [200, 600],
    [470, 604],
    [700, 598],
    [-140, 600],
    [940, 602],
    [260, 712],
    [820, 716],
  ].forEach(([x, y]) => VIS.birds.push({ x, y, st: "sit", t: Math.random() * 5, ground: 1, vx: 0, vy: 0, h: 0 }));
}
export function updBirds(dt) {
  if (!VIS.birds) initBirds();
  const movers = VIS.ped.concat(custs);
  VIS.birds.forEach((b) => {
    b.t -= dt;
    if (b.st === "sit") {
      if (b.ground && movers.some((p) => Math.hypot(p.x - b.x, p.y - b.y) < 30)) {
        b.st = "fly";
        b.vx = (Math.random() < 0.5 ? -1 : 1) * (70 + rnd(50));
        b.t = 1.5 + Math.random() * 1.5;
        Math.random() < 0.3 && ui.tone(2600, 0, 0.05, "sine", 0.012);
      } else if (b.t <= 0) {
        if (!b.ground && Math.random() < 0.12) {
          b.st = "fly";
          b.vx = (Math.random() < 0.5 ? -1 : 1) * (50 + rnd(40));
          b.t = 2.5 + Math.random() * 3;
        } else {
          b.t = 0.6 + Math.random() * 2.5;
          b.x += (Math.random() - 0.5) * 6;
          b.peck = 0.3;
        }
      }
      if (b.peck > 0) b.peck -= dt;
    } else {
      b.x += b.vx * dt;
      b.h = Math.min(70, b.h + 50 * dt);
      if (b.t <= 0) {
        b.st = "sit";
        b.h = 0;
        b.t = 2 + Math.random() * 4;
        b.x = clamp(b.x, CX0 + 20, CX1 - 20);
      }
    }
  });
}
export function drawBird(b) {
  const x = b.x,
    y = b.y - b.h;
  if (b.st === "fly") {
    const f = Math.sin(performance.now() / 60 + x) * 4;
    cx.strokeStyle = "#3a3f4b";
    cx.lineWidth = 1.6;
    cx.beginPath();
    cx.moveTo(x - 6, y - f);
    cx.lineTo(x, y);
    cx.lineTo(x + 6, y - f);
    cx.stroke();
    return;
  }
  const pk = b.peck > 0 ? 2 : 0;
  cx.fillStyle = "rgba(0,0,0,.2)";
  cx.beginPath();
  cx.ellipse(x, y + 1, 4, 1.5, 0, 0, 7);
  cx.fill();
  cx.fillStyle = "#7d8794";
  cx.beginPath();
  cx.ellipse(x, y - 3, 4, 2.6, 0, 0, 7);
  cx.fill();
  cx.beginPath();
  cx.arc(x + 3, y - 5 + pk, 2, 0, 7);
  cx.fill();
  cx.fillStyle = "#f2b705";
  cx.fillRect(x + 4.5, y - 5 + pk, 1.6, 1);
}
export function parkDraw(g, x, y, w, h, se, R) {
  const snow = se === "xmas" || se === "winter";
  g.fillStyle = snow ? "#e3ecef" : "#5fa35a";
  g.fillRect(x, y, w, h);
  for (let i = 0; i < (w * h) / 120; i++) {
    g.fillStyle = snow ? "rgba(180,200,210,.25)" : R() < 0.5 ? "rgba(40,100,40,.25)" : "rgba(140,200,110,.25)";
    g.fillRect(x + R() * w, y + R() * h, 2, 2);
  }
  g.strokeStyle = "#d9c49a";
  g.lineWidth = 18;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x + 20, y + 30);
  g.bezierCurveTo(x + w * 0.3, y + h * 0.6, x + w * 0.6, y + h * 0.1, x + w - 20, y + h * 0.7);
  g.stroke();
  g.lineCap = "butt";
  g.fillStyle = "#e9d7a6";
  g.fillRect(x + 60, y + 120, 90, 60);
  g.strokeStyle = "#b8935a";
  g.lineWidth = 3;
  g.strokeRect(x + 60, y + 120, 90, 60);
  g.strokeStyle = "#c0392b";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x + 240, y + 60);
  g.lineTo(x + 250, y + 20);
  g.lineTo(x + 330, y + 20);
  g.lineTo(x + 340, y + 60);
  g.stroke();
  g.fillStyle = "#3f7fc4";
  g.fillRect(x + 360, y + 90, 16, 50);
  g.fillStyle = "#f2b705";
  g.beginPath();
  g.moveTo(x + 376, y + 92);
  g.lineTo(x + 420, y + 140);
  g.lineTo(x + 408, y + 146);
  g.lineTo(x + 372, y + 104);
  g.fill();
  g.strokeStyle = "#8a6a44";
  g.lineWidth = 2;
  g.strokeRect(x + 2, y + 2, w - 4, h - 4);
}
export function plazaDraw(g, x, y, w, h, se, R) {
  g.fillStyle = "#d9cfbd";
  g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(0,0,0,.08)";
  g.lineWidth = 1;
  g.beginPath();
  for (let i = x; i < x + w; i += 24) {
    g.moveTo(i, y);
    g.lineTo(i, y + h);
  }
  for (let j = y; j < y + h; j += 24) {
    g.moveTo(x, j);
    g.lineTo(x + w, j);
  }
  g.stroke();
  const fx = x + w / 2,
    fy = y + h * 0.5;
  g.fillStyle = "#9aa3ad";
  g.beginPath();
  g.arc(fx, fy, 52, 0, 7);
  g.fill();
  g.fillStyle = "#5fb8d8";
  g.beginPath();
  g.arc(fx, fy, 44, 0, 7);
  g.fill();
  g.fillStyle = "#9aa3ad";
  g.beginPath();
  g.arc(fx, fy, 10, 0, 7);
  g.fill();
  [
    [x + 40, y + 40],
    [x + w - 80, y + 40],
    [x + 40, y + h - 50],
    [x + w - 80, y + h - 50],
  ].forEach(([bx, by]) => {
    g.fillStyle = "#7a4b2b";
    g.fillRect(bx, by, 42, 10);
    g.fillStyle = "#5c3b20";
    g.fillRect(bx, by + 10, 42, 4);
  });
  if (se === "xmas" || se === "winter") {
    g.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      g.ellipse(x + R() * w, y + R() * h, 14, 6, 0, 0, 7);
      g.fill();
    }
  }
}
export function coleDraw(g, x, y, w, h, se, R) {
  facadeDraw(g, x, y, w, "COLEGIO", "#e0622a", R);
  g.fillStyle = "#b5583a";
  g.fillRect(x, y + 54, w, h - 54);
  g.fillStyle = "#e07a3f";
  g.fillRect(x + 16, y + 74, w - 32, 120);
  g.strokeStyle = "#fff";
  g.lineWidth = 2;
  g.strokeRect(x + 22, y + 80, w - 44, 108);
  g.beginPath();
  g.moveTo(x + w / 2, y + 80);
  g.lineTo(x + w / 2, y + 188);
  g.stroke();
  g.beginPath();
  g.arc(x + w / 2, y + 134, 18, 0, 7);
  g.stroke();
  if (se === "xmas" || se === "winter") {
    g.fillStyle = "rgba(255,255,255,.6)";
    g.fillRect(x, y + 200, w, h - 200);
  }
}
export function buildCity(se) {
  CITYWIN = [];
  const c = document.createElement("canvas");
  c.width = CX1 - CX0;
  c.height = CY1 - CY0;
  const g = c.getContext("2d");
  g.translate(-CX0, -CY0);
  const R = srand(99);
  g.fillStyle = "#6f7680";
  g.fillRect(CX0, CY0, CX1 - CX0, CY1 - CY0);
  g.fillStyle = "#4a4f57";
  g.fillRect(CX0, -66, CX1 - CX0, 66);
  g.fillStyle = "#3a3e46";
  for (let x = CX0; x < CX1; x += 48) g.fillRect(x, -34, 24, 2);
  for (let x = CX0 + 40; x < CX1; x += 210) {
    if (x > XS0 - 60 && x < XS1) continue;
    g.fillStyle = "#2f6b3a";
    g.fillRect(x, -60, 26, 18);
    g.fillStyle = "#3f8a4a";
    g.fillRect(x + 30, -60, 26, 18);
  }
  let x = CX0;
  while (x < CX1) {
    const w = 150 + R() * 170;
    if (x < XS1 && x + w > XS0) {
      roofDraw(g, x + 4, CY0, XS0 - x - 8, -72 - CY0, R, se);
      x = XS1;
      continue;
    }
    roofDraw(g, x + 4, CY0, w - 8, -72 - CY0, R, se);
    x += w;
  }
  const near = [
    [CX0, -290, "CAFÉ", "#7b4a2b"],
    [XS1 + 6, CX1, "FLORISTERÍA", "#2fa557"],
  ];
  if (!S.fk) near.splice(1, 0, [808, XS0 - 6, "LIBRERÍA", "#2f5fa8"]); // con la zona Funko, la librería es tuya
  if (!S.annex) near.push([-282, -8, "PANADERÍA", "#c47a2c"]);
  near.forEach(([a, b, n, col]) => {
    roofDraw(g, a + 4, 0, b - a - 8, 516, R, se);
    facadeDraw(g, a + 4, 516, b - a - 8, n, col, R);
  });
  if (fkForSale()) traspasa(g, (808 + XS0 - 6) / 2, 470);
  parkDraw(g, CX0 + 4, 742, -124 - CX0, CY1 - 746, se, R);
  facadeDraw(g, -106, 738, 224, "BANCO", "#1f4e8c", R);
  roofDraw(g, -106, 792, 224, CY1 - 792, R, se);
  facadeDraw(g, 124, 738, 246, "HELADERÍA", "#ff7ab8", R);
  roofDraw(g, 124, 792, 246, CY1 - 792, R, se);
  plazaDraw(g, 380, 742, 428, CY1 - 746, se, R);
  facadeDraw(g, 816, 738, 268, "SE ALQUILA", "#7d8794", R);
  roofDraw(g, 816, 792, 268, CY1 - 792, R, se);
  coleDraw(g, XS1 + 6, 738, CX1 - XS1 - 6, CY1 - 738, se, R);
  g.fillStyle = "#3a3e46";
  g.fillRect(XS0, CY0, XS1 - XS0, CY1 - CY0);
  g.fillStyle = "#e8e8e8";
  for (let y = CY0; y < CY1; y += 50) g.fillRect(XS0 + 33, y, 3, 26);
  g.fillStyle = "rgba(0,0,0,.25)";
  g.fillRect(CX0, 0, CX1 - CX0, 4);
  return c;
}
export function cityTrees() {
  const l = [],
    skip = (x) => (x > 250 && x < 470) || (x > 670 && x < 790) || (x > XS0 - 30 && x < XS1 + 30) || x < -290;
  for (let x = CX0 + 70; x < CX1; x += 170) if (!skip(x)) l.push([x, 604]);
  for (let x = CX0 + 150; x < CX1; x += 190) if (!(x > XS0 - 30 && x < XS1 + 30)) l.push([x, 722]);
  return l;
}
export function drawCross() {
  cx.fillStyle = "#3a3e46";
  cx.fillRect(XS0, 570, XS1 - XS0, 168);
  cx.fillStyle = "#f2f2f2";
  for (let x = XS0 + 4; x < XS1 - 4; x += 12) {
    cx.fillRect(x, 598, 7, 12);
    cx.fillRect(x, 700, 7, 12);
  }
  cx.fillStyle = "#6d737c";
  cx.fillRect(XS0 - 4, 570, 4, 42);
  cx.fillRect(XS1, 570, 4, 42);
  cx.fillRect(XS0 - 4, 694, 4, 44);
  cx.fillRect(XS1, 694, 4, 44);
}
export function drawBusStop() {
  const x = 690,
    y = 600;
  cx.fillStyle = "rgba(0,0,0,.2)";
  cx.fillRect(x + 4, y + 2, 76, 6);
  cx.fillStyle = "#2b2f38";
  cx.fillRect(x, y - 40, 3, 42);
  cx.fillRect(x + 72, y - 40, 3, 42);
  cx.fillStyle = "rgba(170,215,240,.45)";
  cx.fillRect(x, y - 40, 75, 26);
  cx.fillStyle = "#2f5fa8";
  cx.fillRect(x - 2, y - 46, 79, 7);
  txt("BUS", x + 38, y - 40, 7, "#fff", "center");
  cx.fillStyle = "#7a4b2b";
  cx.fillRect(x + 10, y - 10, 54, 5);
  if (!VIS.busP && !(VIS.cars || []).some((c) => c.hold > 0))
    VIS.busP = [mkOutfit("collector", null), mkOutfit("kid", null)];
  [
    [x + 22, y - 4],
    [x + 52, y - 4],
  ].forEach(([px, py], i) => {
    const o = VIS.busP && VIS.busP[i];
    if (!o) return;
    o.skin = o.skin || "#e0a878";
    o.mv = false;
    o.ph = 0;
    o.mood = "neutral";
    o.face = 1;
    o.phone = i === 1;
    o.arm = null;
    o.bag = false;
    drawPerson(px, py, o);
  });
}
export function drawTerrace() {
  const regs = REGS.filter((r) => S.regs[r.id] && S.regs[r.id].met && r.t !== "lot" && r.t !== "seller").slice(0, 3),
    t = performance.now() / 1000;
  [-520, -440, -360].forEach((x, i) => {
    const y = 600;
    const r = regs[i];
    if (r && S.phase !== "closed") {
      const o = Object.assign({}, regS(r.id).out || (regS(r.id).out = mkOutfit(r.t, r)), {
        skin: r.skin,
        mv: false,
        ph: 0,
        mood: "happy",
        face: 1,
        arm: Math.sin(t * 1.3 + i) > 0.7 ? "wave" : null,
        bag: false,
        phone: false,
      });
      drawPerson(x - 14, y, o);
    }
    cx.fillStyle = "rgba(0,0,0,.2)";
    cx.beginPath();
    cx.ellipse(x + 2, y + 2, 14, 4, 0, 0, 7);
    cx.fill();
    cx.fillStyle = "#d9d3c7";
    cx.beginPath();
    cx.ellipse(x, y - 12, 12, 6, 0, 0, 7);
    cx.fill();
    cx.fillStyle = "#9aa0a8";
    cx.fillRect(x - 1, y - 12, 2, 12);
    cx.fillStyle = "#fff";
    cx.fillRect(x - 3, y - 17, 5, 4);
    cx.fillStyle = ["#c0392b", "#2f5fa8", "#2fa557"][i];
    cx.beginPath();
    cx.moveTo(x - 26, y - 44);
    cx.lineTo(x + 26, y - 44);
    cx.lineTo(x, y - 58);
    cx.fill();
    cx.fillStyle = "#555";
    cx.fillRect(x - 1, y - 44, 2, 30);
  });
}
export function drawSweeper() {
  const x = 1290,
    y = 598,
    t = performance.now() / 1000,
    o = VIS.sweep || (VIS.sweep = mkOutfit("collector", null));
  o.skin = "#c98a5c";
  o.mv = false;
  o.ph = 0;
  o.mood = "happy";
  o.face = -1;
  o.arm = null;
  o.bag = false;
  o.phone = false;
  drawPerson(x, y, o);
  const a = Math.sin(t * 4) * 0.5;
  cx.strokeStyle = "#8a5a33";
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(x - 6, y - 24);
  cx.lineTo(x - 16 + a * 8, y);
  cx.stroke();
  cx.fillStyle = "#d9b36c";
  cx.fillRect(x - 22 + a * 8, y - 3, 12, 4);
}
export function drawFountain() {
  const x = 594,
    y = 870,
    t = performance.now() / 1000;
  cx.save();
  cx.globalAlpha = 0.8;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2,
      r = 26 + Math.sin(t * 3 + i) * 3;
    cx.strokeStyle = "rgba(220,245,255,.8)";
    cx.lineWidth = 1.5;
    cx.beginPath();
    cx.moveTo(x, y - 14);
    cx.quadraticCurveTo(x + Math.cos(a) * r * 0.6, y - 34, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.4);
    cx.stroke();
  }
  cx.strokeStyle = "rgba(255,255,255,.5)";
  cx.lineWidth = 1;
  [0, 1, 2].forEach((k) => {
    const r = (t * 14 + k * 14) % 42;
    cx.beginPath();
    cx.ellipse(x, y, r, r * 0.5, 0, 0, 7);
    cx.stroke();
  });
  cx.restore();
}
export function drawSwings() {
  const t = performance.now() / 1000;
  [
    [-270, 800],
    [-230, 800],
  ].forEach(([x, y], i) => {
    const a = Math.sin(t * 2 + i * 1.4) * 0.6,
      ox = Math.sin(a) * 20;
    cx.strokeStyle = "#555";
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(x, 762);
    cx.lineTo(x + ox, y - 20);
    cx.stroke();
    if (S.phase !== "closed") {
      const o = VIS["sw" + i] || (VIS["sw" + i] = mkOutfit("kid", null));
      o.skin = "#f2c9a0";
      o.mv = false;
      o.ph = 0;
      o.mood = "happy";
      o.face = 0;
      o.arm = "up";
      o.bag = false;
      o.phone = false;
      o.sc = 0.75;
      drawPerson(x + ox, y, o);
    }
  });
}
export function drawColeKids() {
  if (S.phase === "closed") return;
  const t = performance.now() / 1000;
  for (let i = 0; i < 4; i++) {
    const o = VIS["ck" + i] || (VIS["ck" + i] = mkOutfit("kid", null));
    o.skin = ["#f2c9a0", "#a9714b", "#e0a878", "#7a4a2b"][i];
    o.mv = true;
    o.ph = t * 12 + i;
    o.mood = "happy";
    o.face = Math.cos(t * 0.8 + i * 2) > 0 ? 1 : -1;
    o.arm = null;
    o.bag = false;
    o.phone = false;
    o.sc = 0.75;
    drawPerson(1180 + 90 + Math.sin(t * 0.8 + i * 2) * 60, 830 + Math.cos(t * 0.6 + i) * 40, o);
  }
}
export function drawRival() {
  const R = S.rival;
  if (!R || (!R.on && !R.closed)) return;
  const x = 816,
    y = 738,
    w = 268;
  cx.fillStyle = R.on ? "#7b2cbf" : "#555";
  cx.fillRect(x + 8, y + 2, w - 16, 13);
  txt(R.on ? "⚡ CARTAS EL RAYO" : "CERRADO", x + w / 2, y + 12, 10, "#fff", "center");
  if (R.on) {
    for (let i = 0; i < w - 16; i += 14) {
      cx.fillStyle = (i / 14) % 2 ? "#7b2cbf" : "#ffd54a";
      cx.fillRect(x + 8 + i, y + 16, 14, 9);
    }
    if (R.promo) {
      const t = performance.now() / 1000;
      cx.fillStyle = Math.sin(t * 4) > 0 ? "#e3350d" : "#ff7a1a";
      rr(x + w / 2 - 62, y + 30, 124, 13, 3);
      cx.fill();
      txt(`¡OFERTA ${setName(R.promo.s).slice(0, 12).toUpperCase()}!`, x + w / 2, y + 40, 8, "#fff", "center");
    }
  }
}
export function drawMarket() {
  if (!marketDay()) return;
  const t = performance.now() / 1000;
  [
    [420, 770],
    [500, 770],
    [660, 770],
    [740, 770],
    [440, 930],
    [720, 930],
  ].forEach(([x, y], i) => {
    const mine = i === 0 && S.market && S.market.day === S.day;
    cx.fillStyle = "rgba(0,0,0,.2)";
    cx.fillRect(x + 3, y + 3, 58, 24);
    cx.fillStyle = "#8a5a33";
    cx.fillRect(x, y, 58, 22);
    cx.fillStyle = "#f4f4f4";
    for (let k = 0; k < 4; k++) cx.fillRect(x + 4 + k * 14, y + 5, 10, 13);
    for (let k = 0; k < 58; k += 10) {
      cx.fillStyle =
        (k / 10) % 2
          ? mine
            ? "#f2b705"
            : ["#e3350d", "#3f7fc4", "#2fa557", "#8e4cb5", "#e07a2f", "#1abc9c"][i]
          : "#fff";
      cx.fillRect(x + k, y - 14, 10, 10);
    }
    if (mine) txt("TU PUESTO", x + 29, y - 17, 7, "#2a2000", "center");
  });
  for (let i = 0; i < 8; i++) {
    const o = VIS["mk" + i] || (VIS["mk" + i] = mkOutfit(pick(["kid", "collector", "whale", "investor"]), null));
    o.skin = ["#f2c9a0", "#a9714b", "#e0a878"][i % 3];
    o.mv = true;
    o.ph = t * 9 + i;
    o.mood = "happy";
    o.face = Math.cos(t * 0.4 + i) > 0 ? 1 : -1;
    o.arm = null;
    o.bag = i % 3 === 0;
    o.phone = false;
    o.sc = 1;
    drawPerson(
      420 + ((i * 53 + Math.sin(t * 0.4 + i) * 60 + 400) % 360),
      820 + ((i * 29) % 90) + Math.sin(t * 0.5 + i) * 8,
      o,
    );
  }
}

/* ---------- Encima de la tienda: callejón con gente, gato de los tejados y ropa tendida ---------- */
/** Paseantes del callejón de detrás de la tienda (y entre −40 y −16) y el gato que pasea por los tejados. */
function updAlley(dt) {
  VIS.alleyT = (VIS.alleyT || 0) - dt;
  if (VIS.alleyT <= 0) {
    VIS.alleyT = (3 + Math.random() * 5) * (1 + nightK() * 2);
    if (VIS.ped.filter((p) => p.y < 0).length < (LITE() ? 1 : 3)) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      VIS.ped.push({
        x: dir > 0 ? CX0 - 20 : CX1 + 20,
        y: -40 + rnd(24),
        dir,
        sp: 22 + rnd(16),
        ph: rnd(6),
        out: mkOutfit(pick(["kid", "collector", "investor", "seller"]), null),
        skin: pick(SKINS),
        dog: Math.random() < 0.3,
        dogc: pick(["#c47a2c", "#f4f4f4", "#3a2a20", "#d9b36c"]),
      });
    }
  }
  const c = (VIS.rcat = VIS.rcat || { x: 260, y: -112, tx: 260, st: "sleep", t: 8, dir: 1, ph: 0 });
  c.t -= dt;
  if (c.st === "walk") {
    const d = c.tx - c.x;
    if (Math.abs(d) < 2) {
      c.st = Math.random() < 0.55 ? "sleep" : "sit";
      c.t = c.st === "sleep" ? 12 + Math.random() * 14 : 4 + Math.random() * 5;
    } else {
      c.x += Math.sign(d) * 26 * dt;
      c.dir = Math.sign(d);
      c.ph += dt * 10;
    }
  } else if (c.t <= 0) {
    // Por los tejados de encima de la tienda (sin cruzar la carretera)
    c.tx = pick([-420, -240, -60, 120, 300, 470, 640, 820, 980]);
    c.st = "walk";
  }
}
/** El gato de los tejados: negro con el pecho blanco (se ve sobre cualquier tejado), paseando, sentado o dormido. */
export function drawRoofCat() {
  const c = VIS.rcat;
  if (!c) return;
  const t = performance.now() / 1000,
    body = "#22232a",
    dark = "#111216";
  cx.save();
  cx.translate(c.x, c.y);
  cx.scale(c.dir * 1.5, 1.5);
  cx.fillStyle = "rgba(0,0,0,.22)";
  cx.beginPath();
  cx.ellipse(0, 0, 11, 3.5, 0, 0, 7);
  cx.fill();
  if (c.st === "sleep") {
    cx.fillStyle = body;
    cx.beginPath();
    cx.ellipse(0, -5, 10, 6, 0, 0, 7);
    cx.arc(7, -6, 4.5, 0, 7);
    cx.fill();
    cx.fillStyle = dark;
    [-4, 0, 4].forEach((s) => cx.fillRect(s - 1, -10, 2, 5));
    cx.restore();
    const zz = (t % 2) / 2;
    cx.globalAlpha = 1 - zz;
    txt("z", c.x + 13, c.y - 22 - zz * 16, 12 + zz * 5, "#fff", "center");
    cx.globalAlpha = 1;
    return;
  }
  const w = c.st === "walk" ? Math.sin(c.ph) * 2 : 0,
    sit = c.st === "sit";
  cx.fillStyle = dark;
  if (!sit)
    [
      [-6, w],
      [-2, -w],
      [4, -w],
      [8, w],
    ].forEach(([lx, o]) => cx.fillRect(lx + o, -5, 2, 5));
  cx.fillStyle = body;
  cx.beginPath();
  if (sit) cx.ellipse(0, -7, 6, 8, 0, 0, 7);
  else cx.ellipse(1, -8, 10, 5, 0, 0, 7);
  cx.fill();
  cx.beginPath();
  cx.arc(sit ? 3 : 10, sit ? -16 : -12, 4.5, 0, 7);
  cx.fill();
  const hx = sit ? 3 : 10,
    hy = sit ? -16 : -12;
  cx.beginPath();
  cx.moveTo(hx - 3, hy - 3);
  cx.lineTo(hx - 2, hy - 7);
  cx.lineTo(hx, hy - 4);
  cx.moveTo(hx + 1, hy - 4);
  cx.lineTo(hx + 3, hy - 7);
  cx.lineTo(hx + 4, hy - 2);
  cx.fill();
  cx.strokeStyle = body;
  cx.lineWidth = 2.5;
  cx.lineCap = "round";
  cx.beginPath();
  cx.moveTo(sit ? -5 : -9, sit ? -3 : -8);
  cx.quadraticCurveTo(sit ? -12 : -15, (sit ? -6 : -14) + Math.sin(t * 2) * 2, sit ? -10 : -13, sit ? -14 : -20);
  cx.stroke();
  cx.lineCap = "butt";
  cx.fillStyle = "#f4f4f4"; // pecho blanco
  cx.beginPath();
  cx.ellipse(sit ? 4 : 8, sit ? -9 : -7, 2.5, 3, 0, 0, 7);
  cx.fill();
  cx.fillStyle = "#f2d64b";
  cx.fillRect(hx + 1, hy - 1, 1.5, 1.5);
  cx.restore();
}
/** Cuerdas de ropa tendida en las azoteas de encima de la tienda (la ropa se mueve un poco con el aire). */
export const CLOTHES = [
  [-250, -150, 96],
  [330, -200, 110],
  [760, -140, 90],
];
const CLOTH_COL = ["#e8574d", "#f2c94c", "#4a90d9", "#f4f4f4", "#6fcf97", "#bb6bd9", "#f2994a"];
export function drawClothes([x0, y0, w0]) {
  const t = performance.now() / 1000,
    K = 1.6; // más grande, para que se vea con el zoom del móvil
  cx.save();
  cx.translate(x0, y0);
  cx.scale(K, K);
  const x = 0,
    y = 0,
    w = w0 / K;
  cx.strokeStyle = "#5a5f68";
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(x, y);
  cx.lineTo(x, y - 22);
  cx.moveTo(x + w, y);
  cx.lineTo(x + w, y - 22);
  cx.stroke();
  cx.strokeStyle = "#d8dbe0";
  cx.lineWidth = 1;
  cx.beginPath();
  cx.moveTo(x, y - 20);
  cx.quadraticCurveTo(x + w / 2, y - 14, x + w, y - 20);
  cx.stroke();
  const n = Math.floor(w / 18);
  for (let i = 0; i < n; i++) {
    const px = x + 9 + i * 18,
      py = y - 19 + Math.sin((i / (n - 1 || 1)) * Math.PI) * 5,
      sw = Math.sin(t * 1.6 + i * 1.3 + x0) * 0.12;
    cx.save();
    cx.translate(px, py);
    cx.rotate(sw);
    cx.fillStyle = CLOTH_COL[(i + Math.abs(x0)) % CLOTH_COL.length];
    if (i % 3 === 1) {
      cx.fillRect(-4, 0, 3, 12); // pantalón
      cx.fillRect(1, 0, 3, 12);
      cx.fillRect(-4, 0, 8, 4);
    } else cx.fillRect(-6, 0, 12, i % 3 ? 9 : 12); // camiseta o toalla
    cx.restore();
  }
  cx.restore();
}
