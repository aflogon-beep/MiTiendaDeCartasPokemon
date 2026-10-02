// Mascota de la tienda (gato, perro o conejo).
import { ui } from "../core/bus.js";
import { S } from "../core/state.js";
import { cx, rr, txt } from "./canvas.js";
import { heartsAt } from "./effects.js";
import { navPath } from "../world/nav.js";
import { pick } from "../core/rng.js";
export const CAT = { x: 120, y: 470, tx: 120, ty: 470, st: "sleep", t: 6, ph: 0, dir: 1, z: 0 };
export function catSpots() {
  const l = [
    [262, 500],
    [80, 470],
    [240, 340],
    [470, 480],
    [700, 470],
    [160, 240],
  ];
  if (S.decor.sofa) l.push([560, 522], [560, 522]);
  return l;
}
export function updCat(dt) {
  CAT.t -= dt;
  CAT.z += dt;
  if (CAT.st === "walk") {
    const wp = CAT.path && CAT.path.length ? CAT.path[0] : { x: CAT.tx, y: CAT.ty },
      dx = wp.x - CAT.x,
      dy = wp.y - CAT.y,
      d = Math.hypot(dx, dy);
    if (d < 2) {
      if (CAT.path && CAT.path.length) CAT.path.shift();
      else {
        CAT.st = Math.random() < 0.6 ? "sleep" : "sit";
        CAT.t = CAT.st === "sleep" ? 10 + Math.random() * 10 : 3 + Math.random() * 4;
      }
    } else {
      const k = Math.min(d, 34 * dt);
      CAT.x += (dx / d) * k;
      CAT.y += (dy / d) * k;
      CAT.dir = dx >= 0 ? 1 : -1;
      CAT.ph += dt * 12;
    }
  } else if (CAT.t <= 0) {
    const q = pick(catSpots());
    CAT.tx = q[0];
    CAT.ty = q[1];
    CAT.path = navPath(CAT.x, CAT.y, q[0], q[1]);
    CAT.st = "walk";
  }
}
export function drawCat() {
  const x = CAT.x,
    y = CAT.y,
    d = CAT.dir,
    t = performance.now() / 1000;
  cx.save();
  cx.translate(x, y);
  cx.scale(d, 1);
  cx.fillStyle = "rgba(0,0,0,.22)";
  cx.beginPath();
  cx.ellipse(0, 0, 13, 4, 0, 0, 7);
  cx.fill();
  if (CAT.st === "sleep") {
    cx.fillStyle = "#e8913a";
    cx.beginPath();
    cx.ellipse(0, -6, 12, 7, 0, 0, 7);
    cx.fill();
    cx.fillStyle = "#c96f22";
    [-5, 0, 5].forEach((s) => {
      cx.fillRect(s - 1, -12, 2, 6);
    });
    cx.fillStyle = "#e8913a";
    cx.beginPath();
    cx.arc(8, -7, 5.5, 0, 7);
    cx.fill();
    cx.beginPath();
    cx.moveTo(6, -11);
    cx.lineTo(8, -15);
    cx.lineTo(10, -11);
    cx.moveTo(10, -11);
    cx.lineTo(12.5, -14);
    cx.lineTo(13, -9);
    cx.fill();
    cx.strokeStyle = "#5a2a0a";
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(8, -7);
    cx.lineTo(10, -7);
    cx.stroke();
    cx.strokeStyle = "#e8913a";
    cx.lineWidth = 3;
    cx.lineCap = "round";
    cx.beginPath();
    cx.moveTo(-11, -4);
    cx.quadraticCurveTo(-14, 4, 0, 2);
    cx.stroke();
    cx.lineCap = "butt";
    cx.restore();
    const zz = (CAT.z % 2) / 2;
    cx.globalAlpha = 1 - zz;
    txt("z", x + 10, y - 18 - zz * 14, 10 + zz * 4, "#fff", "center");
    cx.globalAlpha = 1;
    return;
  }
  const w = CAT.st === "walk" ? Math.sin(CAT.ph) * 2.5 : 0;
  cx.fillStyle = "#d97e2b";
  [
    [-7, w],
    [-3, -w],
    [5, -w],
    [9, w],
  ].forEach(([lx, o]) => cx.fillRect(lx, -7 + o * 0.3, 2.5, 7));
  cx.fillStyle = "#e8913a";
  cx.beginPath();
  cx.ellipse(1, -10, 11, 6, 0, 0, 7);
  cx.fill();
  cx.fillStyle = "#c96f22";
  [-4, 1, 6].forEach((s) => cx.fillRect(s, -15.5, 2, 5));
  cx.strokeStyle = "#e8913a";
  cx.lineWidth = 3;
  cx.lineCap = "round";
  cx.beginPath();
  cx.moveTo(-9, -11);
  cx.quadraticCurveTo(-16, -18 + Math.sin(t * 3) * 3, -12, -24);
  cx.stroke();
  cx.lineCap = "butt";
  const hy = CAT.st === "sit" ? -20 : -15;
  cx.fillStyle = "#e8913a";
  cx.beginPath();
  cx.arc(12, hy, 6, 0, 7);
  cx.fill();
  cx.beginPath();
  cx.moveTo(8, hy - 3);
  cx.lineTo(9, hy - 9);
  cx.lineTo(12, hy - 5);
  cx.moveTo(12, hy - 5);
  cx.lineTo(15.5, hy - 9);
  cx.lineTo(16, hy - 3);
  cx.fill();
  cx.fillStyle = "#1a1a1a";
  cx.beginPath();
  cx.arc(10.5, hy - 0.5, 1, 0, 7);
  cx.arc(14.5, hy - 0.5, 1, 0, 7);
  cx.fill();
  cx.fillStyle = "#ff9eb0";
  cx.fillRect(12, hy + 1.5, 1.6, 1.2);
  cx.restore();
}
export function drawPet() {
  const p = S.pet || "cat";
  if (p === "none") return;
  if (p === "cat") return drawCat();
  const x = CAT.x,
    y = CAT.y,
    d = CAT.dir,
    t = performance.now() / 1000,
    sl = CAT.st === "sleep",
    w = CAT.st === "walk" ? Math.sin(CAT.ph) * 2.5 : 0;
  cx.save();
  cx.translate(x, y);
  cx.scale(d, 1);
  cx.fillStyle = "rgba(0,0,0,.22)";
  cx.beginPath();
  cx.ellipse(0, 0, 13, 4, 0, 0, 7);
  cx.fill();
  if (p === "dog") {
    const c = "#c47a2c";
    cx.fillStyle = c;
    if (!sl)
      [
        [-7, w],
        [-3, -w],
        [5, -w],
        [9, w],
      ].forEach(([lx, o]) => cx.fillRect(lx, -7 + o * 0.3, 3, 7));
    rr(-10, sl ? -9 : -15, 22, sl ? 9 : 9, 4);
    cx.fill();
    const hy = sl ? -8 : CAT.st === "sit" ? -21 : -17;
    cx.beginPath();
    cx.arc(12, hy, 6.5, 0, 7);
    cx.fill();
    cx.fillStyle = "#7a4a1f";
    cx.beginPath();
    cx.ellipse(9, hy - 2, 2.5, 5, 0.4, 0, 7);
    cx.fill();
    cx.fillStyle = "#f4e2c0";
    cx.fillRect(15, hy + 1, 4, 3);
    cx.fillStyle = "#222";
    cx.fillRect(17, hy, 2, 2);
    if (!sl) cx.fillRect(12, hy - 2, 1.5, 1.5);
    cx.strokeStyle = c;
    cx.lineWidth = 3;
    cx.lineCap = "round";
    cx.beginPath();
    cx.moveTo(-10, sl ? -6 : -13);
    cx.lineTo(-15, (sl ? -8 : -19) + Math.sin(t * (sl ? 1 : 10)) * 3);
    cx.stroke();
    cx.lineCap = "butt";
  } else {
    const c = "#f2f2f2";
    cx.fillStyle = c;
    cx.beginPath();
    cx.ellipse(0, -7, 10, 7, 0, 0, 7);
    cx.fill();
    const hop = CAT.st === "walk" ? Math.abs(Math.sin(CAT.ph)) * -5 : 0;
    cx.translate(0, hop);
    cx.beginPath();
    cx.arc(9, -11, 5.5, 0, 7);
    cx.fill();
    cx.fillStyle = "#f2f2f2";
    rr(6, -26, 3, 11, 2);
    cx.fill();
    rr(10, -25, 3, 10, 2);
    cx.fill();
    cx.fillStyle = "#ffb3c7";
    cx.fillRect(7, -24, 1, 7);
    cx.fillRect(11, -23, 1, 6);
    cx.fillStyle = "#222";
    if (!sl) cx.fillRect(11, -12, 1.6, 1.6);
    cx.fillStyle = "#fff";
    cx.beginPath();
    cx.arc(-10, -7, 3, 0, 7);
    cx.fill();
  }
  cx.restore();
  if (sl) {
    const zz = (CAT.z % 2) / 2;
    cx.globalAlpha = 1 - zz;
    txt("z", x + 10, y - 18 - zz * 14, 10 + zz * 4, "#fff", "center");
    cx.globalAlpha = 1;
  }
}
export function petSound() {
  const p = S.pet || "cat";
  if (p === "dog") {
    ui.tone(420, 0, 0.09, "square", 0.05);
    ui.tone(380, 0.14, 0.1, "square", 0.05);
  } else if (p === "bunny") {
    ui.tone(1600, 0, 0.06, "sine", 0.05);
    ui.tone(1900, 0.08, 0.06, "sine", 0.05);
  } else {
    ui.tone(760, 0, 0.12, "triangle", 0.07);
    ui.tone(620, 0.1, 0.3, "triangle", 0.06);
  }
  heartsAt(CAT.x, CAT.y - 26, 2);
  CAT.st = "sit";
  CAT.t = 3;
}
