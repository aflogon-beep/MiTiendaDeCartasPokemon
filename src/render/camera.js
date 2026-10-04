// Vista: tamaño del canvas, zoom, arrastre y cámara automática que sigue a la acción.
import { CV, LITE } from "./canvas.js";
import { CX0, CX1, CY0, CY1, FRONT_Y, H, W } from "../world/layout.js";
import { clamp } from "../core/util.js";
import { front, queue } from "../core/customers/move.js";
export const VIEW = {
  s: 1,
  ox: 0,
  oy: 0,
  cw: W,
  ch: H,
  dpr: 2,
  min: 1,
  max: 2,
  cover: 1,
  init: false,
  user: 0,
  mode: "auto",
};
export function clampView() {
  const V = VIEW,
    x0 = CX0 * V.s,
    x1 = CX1 * V.s,
    y0 = CY0 * V.s,
    y1 = CY1 * V.s;
  V.ox = x1 - x0 <= V.cw ? (V.cw - (x1 + x0)) / 2 : clamp(V.ox, V.cw - x1, -x0);
  V.oy = y1 - y0 <= V.ch ? (V.ch - (y1 + y0)) / 2 : clamp(V.oy, V.ch - y1, -y0);
}
export function fitCanvas() {
  const r = CV.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const V = VIEW,
    dpr = Math.min(LITE() ? 1.25 : 2, devicePixelRatio || 1);
  const cx0 = V.init ? (V.cw / 2 - V.ox) / V.s : W / 2,
    cy0 = V.init ? (V.ch / 2 - V.oy) / V.s : H * 0.45;
  CV.width = Math.round(r.width * dpr);
  CV.height = Math.round(r.height * dpr);
  V.cw = r.width;
  V.ch = r.height;
  V.dpr = dpr;
  V.min = Math.min(r.width / (CX1 - CX0), r.height / (CY1 - CY0));
  V.shop = Math.min(r.width / W, r.height / H);
  V.cover = Math.max(r.width / W, r.height / (FRONT_Y + 40));
  V.max = Math.max(V.cover * 2.2, V.shop * 2.5);
  if (!V.init) {
    V.s = V.cover;
    V.init = true;
  }
  V.s = clamp(V.s, V.min, V.max);
  V.ox = V.cw / 2 - cx0 * V.s;
  V.oy = V.ch / 2 - cy0 * V.s;
  clampView();
}
export function zoomAt(ns, sx, sy) {
  const V = VIEW;
  ns = clamp(ns, V.min, V.max);
  const wx = (sx - V.ox) / V.s,
    wy = (sy - V.oy) / V.s;
  V.s = ns;
  V.ox = sx - wx * ns;
  V.oy = sy - wy * ns;
  clampView();
  V.user = performance.now();
  V.mode = "manual";
}
export function camFollow(dt) {
  const V = VIEW;
  if (V.mode !== "auto" || performance.now() - V.user < 4000) return;
  const f = front(),
    want = clamp(V.cover * (f ? 1.08 : 1), V.min, V.max);
  const cw = (V.cw / 2 - V.ox) / V.s,
    ch = (V.ch / 2 - V.oy) / V.s,
    tx = f ? 640 : queue.length ? 560 : W / 2,
    ty = f ? 300 : H * 0.46,
    k = Math.min(1, dt * 0.7);
  const ns = V.s + (want - V.s) * k,
    nx = cw + (tx - cw) * k,
    ny = ch + (ty - ch) * k;
  V.s = ns;
  V.ox = V.cw / 2 - nx * ns;
  V.oy = V.ch / 2 - ny * ns;
  clampView();
}

/** Lleva la cámara a un punto del mundo (p. ej. la zona Funko recién abierta), como si lo hubiera movido el jugador. */
export function camLook(wx, wy) {
  const V = VIEW;
  V.s = clamp(Math.max(V.s, V.cover), V.min, V.max);
  V.ox = V.cw / 2 - wx * V.s;
  V.oy = V.ch / 2 - wy * V.s;
  V.user = performance.now();
  V.mode = "manual";
  clampView();
}

/** Título: la cámara recorre despacio la tienda y la calle, como un tráiler (quieta con «menos animaciones»). */
export function titleCam(now, still) {
  const V = VIEW,
    t = still ? 0 : now / 1000;
  V.s = clamp(V.cover * 1.15, V.min, V.max);
  const wx = W / 2 + Math.sin(t * 0.21) * W * 0.32,
    wy = 360 + Math.sin(t * 0.13) * 220;
  V.ox = V.cw / 2 - wx * V.s;
  V.oy = V.ch / 2 - wy * V.s;
  V.mode = "auto";
  V.user = 0;
  clampView();
}
