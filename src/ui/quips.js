// Fase I · paso 6: frases recurrentes (bocadillo con retrato) y visitas de papá a la tienda.
// La lógica (qué frase y cuándo) está en core/quips.js; aquí se pinta.
//   quip(k)        frase de Emma o Álvaro, si toca (core también la pide por el bus: ui.quip("thief"))
//   quipTick(dt)   cada fotograma: tienda vacía, rival más barata, subida de nivel y visitas de papá
//   papaEnters(r)  papá entra por la puerta, da su consejo en un bocadillo y se va
import { $, VIS } from "../render/canvas.js";
import { VIEW } from "../render/camera.js";
import { G, S, hasState } from "../core/state.js";
import { takeQuip, pullQuip, papaDue, papaVisit as papaLines, papaState } from "../core/quips.js";
import { level } from "../core/economy.js";
import { myIdx } from "../core/rival.js";
import { custs } from "../core/customers/move.js";
import { CHARS, drawMini, charFace } from "../render/characters.js";
import { NAMES } from "../story/script.js";
import { BYID } from "../core/cards/sets.js";
import { priceAlert, backupDue } from "../core/alerts.js";

const calm = () => document.documentElement.classList.contains("ui-calm");
const busy = () => !hasState() || G.TITLE || G.STORY || (S.tut && S.tut.on);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- Bocadillo ---------- */
let bubT = null;
/** Enseña un bocadillo con retrato durante unos segundos (no tapa los toques: el juego sigue debajo). */
export function sayBubble(who, ex, text, ms = 4500) {
  let el = $("#quip");
  if (!el) {
    el = document.createElement("div");
    el.id = "quip";
    document.body.appendChild(el);
  }
  el.innerHTML = `<img src="${charFace(who, ex)}" alt=""><div><b>${NAMES[who]}</b><p>${esc(text)}</p></div>`;
  VIS.talk = { who, until: performance.now() + ms }; // y un bocadillo encima de su muñeco en la tienda
  el.classList.remove("on");
  void el.offsetWidth;
  el.classList.add("on");
  clearTimeout(bubT);
  return new Promise((r) => (bubT = setTimeout(() => (el.classList.remove("on"), r()), ms)));
}

/** Frase recurrente: solo si toca (una vez al día, tiempos de espera…) y no hay tutorial ni historia. */
export function quip(k) {
  if (busy() || VIS.papa) return false;
  const q = takeQuip(k, performance.now() / 1000);
  if (!q) return false;
  sayBubble(...q);
  return true;
}

/* ---------- Ganchos ---------- */
let packsDay = 0,
  packsN = 0;
/** Al abrir sobres: Emma protesta si se abren muchos el mismo día; Álvaro reacciona a lo que sale. */
export function quipOpen(n, cards) {
  if (packsDay !== S.day) ((packsDay = S.day), (packsN = 0));
  packsN += n;
  const r = n > 1 ? pullQuip(cards) : null; // abriendo de uno en uno, reacciona al girar la carta
  if (r) quip(r);
  else if (packsN >= 3) quip("packs");
}
/** Al girar una carta (apertura de una en una). */
export function quipCard(c) {
  const r = pullQuip([c]);
  if (r) quip(r);
}

/* ---------- Cada fotograma ---------- */
let emptyT = 0,
  sec = 0,
  wasOpen = false;
export function quipTick(dt) {
  if (busy()) return;
  const open = S.phase === "open";
  // Tienda vacía un rato con la persiana subida
  if (open && !custs.length) {
    emptyT += dt;
    if (emptyT > 25) ((emptyT = 0), quip("empty"));
  } else emptyT = 0;
  // Al subir la persiana: si la rival está más barata, Emma saca la calculadora
  if (open && !wasOpen && S.rival && S.rival.on && myIdx() > S.rival.price + 0.02)
    setTimeout(() => quip("rival"), 2500);
  wasOpen = open;
  // Papá: una comprobación por segundo de juego
  sec += dt;
  if (sec < 1) return;
  sec = 0;
  if (G.M || VIS.papa) return;
  const why = papaDue(level(), Math.random());
  if (why) return papaEnters(why);
  if (S.phase === "closed") alertsTick();
}

/* ---------- Alertas (con la tienda cerrada) ---------- */
/** Una carta tuya ha subido mucho esta semana (una vez al día) y el recordatorio de la copia. */
function alertsTick() {
  const a = priceAlert();
  if (a) {
    const c = BYID[a.id];
    if (c)
      return sayBubble(
        "emma",
        "stars",
        `¡Tu ${c.name} ha subido un ${a.pct} % esta semana! Buen momento para venderla.`,
        6000,
      );
  }
  if (!$("#bkp") && backupDue(Date.now())) showBackup();
}

/** Recordatorio de Emma: hace una semana que no se guarda una copia de la partida. */
export function showBackup() {
  const el = document.createElement("div");
  el.id = "bkp";
  el.innerHTML = `<img src="${charFace("emma", "sweat")}" alt=""><div><b>Emma</b><p>Hace una semana que no guardas una copia de la tienda. Si el móvil borra los datos, la perderíamos.</p><div class="btns"><button class="b pri" data-a="bkpsave">📤 Guardar copia</button><button class="b" data-a="bkplater">Luego</button></div></div>`;
  document.body.appendChild(el);
}

/* ---------- Visita de papá ---------- */
const DOOR = [355, 640],
  SPOT = [470, 440];
/** Papá entra, dice su frase (o dos: consejo y despedida) y se va. Devuelve una promesa. */
export function papaEnters(reason) {
  if (!hasState() || VIS.papa) return Promise.resolve();
  papaState(level());
  const lines = papaLines(reason, level());
  const P = (VIS.papa = { at: DOOR, to: SPOT, t0: performance.now(), dur: calm() ? 0 : 2200 });
  const cv = document.createElement("canvas");
  cv.className = "papa-cv";
  ($("#cvw") || document.body).appendChild(cv);
  let raf = 0;
  const loop = (now) => {
    drawPapa(cv, P, now);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const walk = (to) =>
    new Promise((r) => {
      P.at = P.to ? lerp(P) : P.at;
      P.to = to;
      P.t0 = performance.now();
      setTimeout(r, P.dur);
    });
  const end = () => {
    cancelAnimationFrame(raf);
    cv.remove();
    VIS.papa = null;
  };
  return walk(SPOT)
    .then(async () => {
      for (const [i, t] of lines.entries()) await sayBubble("alberto", i ? "laugh" : "happy", t, 4500);
    })
    .then(() => walk(DOOR))
    .then(end, end);
}

function lerp(P) {
  const t = P.dur ? Math.min(1, (performance.now() - P.t0) / P.dur) : 1,
    e = t * (2 - t);
  return [P.at[0] + (P.to[0] - P.at[0]) * e, P.at[1] + (P.to[1] - P.at[1]) * e];
}

/** Papá como muñeco en el mundo, encima de la tienda (como en la historia). */
function drawPapa(cv, P, now) {
  const r = cv.getBoundingClientRect(),
    dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(r.width * dpr)) cv.width = Math.round(r.width * dpr);
  if (cv.height !== Math.round(r.height * dpr)) cv.height = Math.round(r.height * dpr);
  const x = cv.getContext("2d"),
    V = VIEW,
    [wx, wy] = lerp(P),
    moving = P.dur && now - P.t0 < P.dur;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, r.width, r.height);
  x.save();
  x.translate(V.ox + wx * V.s, V.oy + wy * V.s);
  const k = V.s * 0.75;
  x.scale(k, k);
  drawMini(x, CHARS.alberto, 0, 0, calm() ? 0 : now / (moving ? 70 : 260));
  x.restore();
}

/* ---------- Lista de deseos ---------- */
/** Emma avisa: un cliente vende o cambia una carta de la lista de deseos, o un lote trae alguna. */
export function wishSay(id, k) {
  if (busy()) return;
  const c = id && BYID[id],
    n = c ? c.name : "";
  const t =
    k === "sell"
      ? `¡Ese cliente vende ${n}! Está en tu lista de deseos.`
      : k === "trade"
        ? `¡Ese cliente te cambia ${n}! Está en tu lista de deseos.`
        : "¡En este lote hay una carta de tu lista de deseos!";
  sayBubble("emma", "stars", t, 5000);
}
