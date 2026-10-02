// Efectos: textos flotantes, monedas, corazones, estrellas, temblor, alarma de robo y banner del evento.
import { LAY } from "../world/layout.js";
import { S, hasState } from "../core/state.js";
import { VIEW } from "./camera.js";
import { VIS, cx, heart, rr, star, txt } from "./canvas.js";
import { clamp } from "../core/util.js";
import { evShort } from "../core/events.js";
import { rnd } from "../core/rng.js";
export let FX = [];
export const fx = (x, y, t, col) => FX.push({ x, y, t, col, a: 1.6 });
export function updFx(dt) {
  FX.forEach((f) => {
    f.y -= 24 * dt;
    f.a -= dt;
  });
  FX = FX.filter((f) => f.a > 0);
}
export let PFX = [];
export function coinBurst(x, y, v) {
  const n = clamp(Math.round(Math.log2(v + 1) * 2), 3, 12),
    tx = LAY.counter.x + 28,
    ty = LAY.counter.y + 66;
  for (let i = 0; i < n; i++)
    PFX.push({
      k: "coin",
      x0: x + rnd(10) - 5,
      y0: y,
      x1: tx + rnd(10) - 5,
      y1: ty,
      t: -i * 0.05,
      d: 0.55 + Math.random() * 0.15,
    });
}
export function heartsAt(x, y, n) {
  for (let i = 0; i < n; i++)
    PFX.push({
      k: "heart",
      x: x + rnd(16) - 8,
      y,
      vx: (Math.random() - 0.5) * 14,
      vy: -26 - rnd(14),
      t: -i * 0.14,
      d: 1.3,
    });
}
export function starsAt(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      sp = 40 + rnd(50);
    PFX.push({ k: "star", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, t: -i * 0.02, d: 1.1 });
  }
}
export function updPfx(dt) {
  PFX.forEach((p) => {
    p.t += dt;
    if (p.t < 0 || p.vx == null) return;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.k === "star") p.vy += 70 * dt;
  });
  PFX = PFX.filter((p) => p.t < p.d);
}
export function drawPfx() {
  PFX.forEach((p) => {
    if (p.t < 0) return;
    const k = p.t / p.d;
    if (p.k === "coin") {
      const x = p.x0 + (p.x1 - p.x0) * k,
        y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 55;
      cx.fillStyle = "#f2c14e";
      cx.beginPath();
      cx.ellipse(x, y, 4.5, Math.max(0.8, 4.5 * Math.abs(Math.cos(p.t * 14))), 0, 0, 7);
      cx.fill();
      cx.strokeStyle = "#b8860b";
      cx.lineWidth = 1;
      cx.stroke();
    } else if (p.k === "heart") {
      cx.globalAlpha = 1 - k;
      heart(p.x, p.y, 5, "#ff4f7b");
      cx.globalAlpha = 1;
    } else {
      cx.globalAlpha = 1 - k;
      star(p.x, p.y, 4.5, "#ffd54a");
      cx.globalAlpha = 1;
    }
  });
}
export function drawEvBanner() {
  const t = evShort();
  if (!t) return;
  cx.font = "700 13px system-ui,sans-serif";
  const w = cx.measureText(t).width + 20;
  cx.fillStyle = "rgba(0,0,0,.7)";
  rr(8, 8, w, 26, 13);
  cx.fill();
  cx.fillStyle = "#fff";
  cx.textAlign = "left";
  cx.fillText(t, 18, 26);
}
export const shake = (v) => {
  if (hasState() && S.ui && S.ui.calm) return;
  VIS.shake = Math.max(VIS.shake || 0, Math.min(4, v * 0.4));
};
export function drawThiefFx(c) {
  if (!c.run || c.caught) return;
  const t = performance.now() / 1000,
    d = c.face || 1;
  for (let i = 0; i < 4; i++) {
    const k = (t * 4 + i / 4) % 1;
    cx.fillStyle = `rgba(200,200,200,${0.45 * (1 - k)})`;
    cx.beginPath();
    cx.arc(c.x - d * (10 + k * 26), c.y - 2 - k * 6, 3 + k * 5, 0, 7);
    cx.fill();
  }
  cx.save();
  cx.translate(c.x + d * 9, c.y - 34);
  cx.rotate(d * 0.3);
  cx.fillStyle = "#fff";
  cx.fillRect(-5, -7, 10, 14);
  cx.fillStyle = "#f2b705";
  cx.fillRect(-4, -6, 8, 12);
  cx.restore();
  if (Math.sin(t * 12) > 0) {
    cx.fillStyle = "#e3350d";
    rr(c.x - 7, c.y - 66, 14, 16, 4);
    cx.fill();
    txt("!", c.x, c.y - 54, 13, "#fff", "center");
  }
}
export function drawAlarm() {
  const r = VIS.alarmT || 0,
    now = performance.now();
  if (r < now) return;
  const V = VIEW,
    a = 0.1 + 0.12 * (Math.sin(now / 110) > 0 ? 1 : 0);
  const g = cx.createRadialGradient(
    V.cw / 2,
    V.ch / 2,
    Math.min(V.cw, V.ch) * 0.3,
    V.cw / 2,
    V.ch / 2,
    Math.max(V.cw, V.ch) * 0.7,
  );
  g.addColorStop(0, "rgba(227,53,13,0)");
  g.addColorStop(1, `rgba(227,53,13,${a * 2.2})`);
  cx.fillStyle = g;
  cx.fillRect(0, 0, V.cw, V.ch);
}
