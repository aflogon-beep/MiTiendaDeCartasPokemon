// Registro para cazar cierres de la app (docs/pendientes.md §6). Cada 2 s, con el juego en pantalla, se guarda en
// localStorage (pcs-diag-v1) qué está pasando: día, hora, panel abierto, velocidad, clientes, FPS, memoria…
// y los últimos errores. Si al abrir la app el último registro dice que estaba en pantalla y no se cerró
// bien (al salir o pasar a segundo plano se apunta), es que se cerró sola: se enseña un aviso con los datos
// para copiarlos y mandarlos.
import { VIS } from "../render/canvas.js";
import { G, S, hasState } from "../core/state.js";
import { custs, queue } from "../core/customers/move.js";
import { players } from "../core/tables.js";
import { dayT } from "../core/day.js";
import { nightK } from "../render/lighting.js";
import { ALVARO } from "../render/family.js";

export const DIAG_KEY = "pcs-diag-v1";
const D = { snaps: [], errs: [], start: Date.now() };
const build = typeof __BUILD__ !== "undefined" ? __BUILD__ : "dev";

function read() {
  try {
    return JSON.parse(localStorage.getItem(DIAG_KEY) || "null");
  } catch (e) {
    return null;
  }
}
function write(fg) {
  try {
    const last = D.snaps[D.snaps.length - 1];
    if (last) last.fg = fg;
    localStorage.setItem(DIAG_KEY, JSON.stringify({ v: 1, build, start: D.start, fg, snaps: D.snaps, errs: D.errs }));
  } catch (e) {}
}
/** Foto de lo que pasa ahora (corta: se guardan las 15 últimas). */
export function diagSnap() {
  const s = { t: Date.now(), M: G.M || null, title: !!G.TITLE, story: !!G.STORY };
  if (hasState() && !G.TITLE) {
    Object.assign(s, {
      day: S.day,
      ph: S.phase,
      dt: Math.round(dayT() * 100), // % del día
      night: Math.round(nightK() * 100) / 100,
      sp: G.speed,
      cust: custs.length,
      q: queue.length,
      pl: players.length,
      dirt: (S.dirt || []).length,
      talk: VIS.talk && performance.now() < VIS.talk.until ? VIS.talk.who : null,
      papa: !!VIS.papa,
      wow: ALVARO.wow > 0,
      end: !!VIS.endAt,
    });
  }
  s.fps = Math.round(VIS.fpsE || 0);
  s.lite = !!VIS.autoLite || (hasState() && S.ui && S.ui.perf) || "";
  if (performance.memory) s.heap = Math.round(performance.memory.usedJSHeapSize / 1e6);
  s.dom = document.getElementsByTagName("*").length;
  s.cv = document.getElementsByTagName("canvas").length;
  D.snaps.push(s);
  if (D.snaps.length > 15) D.snaps.shift();
  return s;
}
/** Apunta un suceso en el registro (p. ej. «atrás»), con los errores. */
export function diagNote(m) {
  err(m, "");
}
function err(m, st) {
  D.errs.push({ t: Date.now(), m: String(m).slice(0, 200), s: String(st || "").slice(0, 400) });
  if (D.errs.length > 6) D.errs.shift();
  diagSnap();
  write(!document.hidden);
}

/** El texto que se copia: lo último que se apuntó antes del cierre. */
export function diagText(r) {
  const s = (r.snaps || [])[r.snaps.length - 1] || {},
    hh = (t) => new Date(t).toLocaleString("es-ES");
  return [
    `💥 Cierre de la app · ${hh(s.t || r.start)} · versión ${r.build}`,
    `Abierta desde ${hh(r.start)} · ${navigator.userAgent.replace(/^.*?\(([^)]*)\).*$/, "$1")}` +
      (navigator.deviceMemory ? ` · ${navigator.deviceMemory} GB` : ""),
    "Último: " + JSON.stringify(s),
    "Sucesos y errores: " + (r.errs && r.errs.length ? JSON.stringify(r.errs) : "ninguno"),
    "Antes: " +
      JSON.stringify(
        (r.snaps || []).slice(0, -1).map((x) => [x.dt, x.ph, x.M, x.fps, x.heap, x.dom, x.cv, x.cust, x.pl]),
      ),
  ].join("\n");
}

function show(r) {
  const el = document.createElement("div");
  el.id = "diag";
  const s = r.snaps[r.snaps.length - 1] || {};
  el.innerHTML = `<div><b>💥 La última vez la app se cerró sola</b><p>${
    s.day ? `Día ${s.day}, al ${s.dt} % del día${s.M ? `, con «${s.M}» abierto` : ""}. ` : ""
  }Copia estos datos y pégaselos a Claude para encontrar el fallo.</p><pre>${diagText(r).replace(/</g, "&lt;")}</pre><div class="btns"><button class="b pri" id="diagcp">📋 Copiar</button><button class="b" id="diagok">Cerrar</button></div></div>`;
  document.body.appendChild(el);
  const txt = diagText(r);
  el.querySelector("#diagcp").onclick = (e) => {
    const done = () => (e.target.textContent = "✔ Copiado");
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, () => selectPre(el));
    else selectPre(el);
  };
  el.querySelector("#diagok").onclick = () => el.remove();
}
function selectPre(el) {
  const r = document.createRange();
  r.selectNodeContents(el.querySelector("pre"));
  getSelection().removeAllRanges();
  getSelection().addRange(r);
}

/** Al arrancar: ¿se cerró sola la última vez? Después, el registro de esta sesión. */
export function initDiag() {
  const prev = read();
  // Salir con «atrás» dos veces (ui/back.js) es un cierre normal: no se avisa
  const last = (prev && prev.snaps && prev.snaps.slice(-1)[0]) || {},
    note = (prev && prev.errs && prev.errs.slice(-1)[0]) || {},
    backExit = note.m === "atrás: salir?" && note.t >= (last.t || 0) - 3000;
  if (prev && prev.fg && !backExit && Date.now() - last.t < 3 * 864e5) show(prev);
  write(false); // si ahora se cierra bien, no hay aviso
  addEventListener("error", (e) => err(e.message, e.error && e.error.stack));
  addEventListener("unhandledrejection", (e) =>
    err("promise: " + (e.reason && e.reason.message), e.reason && e.reason.stack),
  );
  document.addEventListener("visibilitychange", () => (diagSnap(), write(!document.hidden)));
  addEventListener("pagehide", () => (diagSnap(), write(false)));
  setInterval(() => {
    if (document.hidden) return;
    diagSnap();
    write(true);
  }, 2000);
}
