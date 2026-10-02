// Canvas principal y utilidades de dibujo (rectángulos redondeados, texto, imágenes, iconos), estado visual (VIS) y modo ahorro.
import { ui } from "../core/bus.js";
import { G, S, hasState } from "../core/state.js";
import { SUN } from "./lighting.js";
import { fitCanvas } from "./camera.js";
export const $ = (s) => document.querySelector(s);
export const CV = $("#cv");
export let cx = CV.getContext("2d");
/** Cambia el contexto donde se dibuja (portrait dibuja en un canvas aparte y luego lo devuelve). */
export const setCx = (c) => {
  cx = c;
};
export function rr(x, y, w, h, r) {
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}
export function txt(t, x, y, size, col, al) {
  cx.font = `600 ${size}px 'Fredoka','Trebuchet MS',system-ui,sans-serif`;
  cx.fillStyle = col;
  cx.textAlign = al || "left";
  cx.fillText(t, x, y);
}
export const IMGS = {};
export function timg(u) {
  if (!u) return null;
  let i = IMGS[u];
  if (!i) {
    i = IMGS[u] = new Image();
    i.src = u;
  }
  return i.complete && i.naturalWidth ? i : null;
}
export function pokeball(x, y, r) {
  cx.fillStyle = "#e3350d";
  cx.beginPath();
  cx.arc(x, y, r, Math.PI, 0);
  cx.fill();
  cx.fillStyle = "#fff";
  cx.beginPath();
  cx.arc(x, y, r, 0, Math.PI);
  cx.fill();
  cx.fillStyle = "#222";
  cx.fillRect(x - r, y - 1, r * 2, 2);
  cx.beginPath();
  cx.arc(x, y, r * 0.34, 0, 7);
  cx.fillStyle = "#fff";
  cx.fill();
  cx.strokeStyle = "#222";
  cx.lineWidth = 1;
  cx.stroke();
}
export function plant(x, y) {
  cx.fillStyle = "rgba(0,0,0,.18)";
  cx.beginPath();
  cx.ellipse(x, y + 16, 13, 4, 0, 0, 7);
  cx.fill();
  cx.fillStyle = "#7a4a2b";
  cx.beginPath();
  cx.moveTo(x - 9, y);
  cx.lineTo(x + 9, y);
  cx.lineTo(x + 6, y + 16);
  cx.lineTo(x - 6, y + 16);
  cx.fill();
  cx.fillStyle = "#2f7d43";
  [
    [-8, -4],
    [8, -4],
    [0, -12],
    [-3, -2],
    [5, -9],
  ].forEach((p) => {
    cx.beginPath();
    cx.arc(x + p[0], y + p[1], 8, 0, 7);
    cx.fill();
  });
  cx.fillStyle = "#48a862";
  cx.beginPath();
  cx.arc(x, y - 8, 6, 0, 7);
  cx.fill();
}
export const VIS = { shut: 1, endAt: 0, lastRep: null, ped: [], pedT: 1, lt: 0 };
export function box3d(x, y, w, d, h, top, front, edge) {
  {
    const sx = SUN.dx,
      L = 7 + Math.abs(sx) * 0.25;
    cx.fillStyle = `rgba(0,0,0,${SUN.a})`;
    cx.beginPath();
    cx.moveTo(x + 2, y + d);
    cx.lineTo(x + w + 2, y + d);
    cx.lineTo(x + w + 2 + sx, y + d + L);
    cx.lineTo(x + 2 + sx, y + d + L);
    cx.closePath();
    cx.fill();
    const ex = sx > 0 ? x + w : x;
    cx.beginPath();
    cx.moveTo(ex, y + d - h * 0.25);
    cx.lineTo(ex + sx * 0.9, y + d - h * 0.25 + L * 0.6);
    cx.lineTo(ex + sx, y + d + L);
    cx.lineTo(ex, y + d);
    cx.closePath();
    cx.fill();
  }
  cx.fillStyle = front;
  cx.fillRect(x, y + d - h, w, h);
  cx.fillStyle = top;
  cx.fillRect(x, y - h, w, d);
  cx.fillStyle = edge || "rgba(255,255,255,.2)";
  cx.fillRect(x, y + d - h, w, 1.5);
  cx.fillStyle = "rgba(0,0,0,.18)";
  cx.fillRect(x + w - 3, y + d - h, 3, h);
}
export function packIcon(px, py, sd, w, h) {
  w = w || 14;
  h = h || 20;
  const g = cx.createLinearGradient(px, py, px + w, py + h);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.15, sd.col);
  g.addColorStop(0.75, sd.col);
  g.addColorStop(1, "#0006");
  cx.fillStyle = g;
  rr(px, py, w, h, 2);
  cx.fill();
  cx.fillStyle = "rgba(255,255,255,.45)";
  cx.fillRect(px, py, w, 2.5);
  cx.fillRect(px, py + h - 2.5, w, 2.5);
  const im = timg(sd.sym);
  if (im) cx.drawImage(im, px + w / 2 - 4, py + h / 2 - 4, 8, 8);
  else {
    cx.fillStyle = "rgba(255,255,255,.85)";
    cx.beginPath();
    cx.arc(px + w / 2, py + h / 2, 3.4, 0, 7);
    cx.fill();
  }
}
export function heart(x, y, s, c) {
  cx.fillStyle = c;
  cx.beginPath();
  cx.moveTo(x, y + s * 0.9);
  cx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.4, x, y - s * 0.5);
  cx.bezierCurveTo(x + s * 0.6, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  cx.fill();
}
export function star(x, y, r, c) {
  cx.fillStyle = c;
  cx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      q = i % 2 ? r * 0.45 : r;
    cx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  cx.closePath();
  cx.fill();
}
export const fitS = (t, m, w) => Math.min(m, w / (Math.max(1, t.length) * 0.62));
export const LITE = () => {
  const m = (hasState() && S.ui && S.ui.perf) || "auto";
  return m === "lo" || (m === "auto" && !!VIS.autoLite);
};
export function perfTick(raw) {
  if (!(raw > 0)) return;
  const f = 1 / Math.max(raw, 1 / 240);
  VIS.fpsE = VIS.fpsE ? VIS.fpsE * 0.95 + f * 0.05 : f;
  if (document.hidden || G.M) return;
  const m = (hasState() && S.ui && S.ui.perf) || "auto";
  if (m !== "auto" || VIS.autoLite) return;
  VIS.slowT = VIS.fpsE < 38 ? (VIS.slowT || 0) + raw : Math.max(0, (VIS.slowT || 0) - raw * 0.5);
  if (VIS.slowT > 4) {
    VIS.autoLite = true;
    fitCanvas();
    ui.toast("⚡ He activado el modo ahorro para que vaya más fluido (Más → Ajustes → Rendimiento)");
  }
}
