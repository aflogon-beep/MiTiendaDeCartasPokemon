// Fase I · paso 2: pantalla de carga y pantalla de título.
//
// Carga: logo, sobres girando, barra de progreso real (la carga de colecciones de siempre) y frases
// que rotan cada 2 s. Se ve como mínimo 1,5 s para que no sea un parpadeo.
//
// Título: encima del juego (la tienda y la calle siguen animándose detrás, oscurecidas). Mientras se
// ve el título, la partida de fondo NO se guarda (G.TITLE): es solo decorado.
//   Continuar  → la última ranura usada
//   Nueva partida → elegir ranura (pide confirmación si está ocupada) → Prepara tu aventura
//                   (dificultad y mascota; el protagonista es Álvaro) → historia → juego con el tutorial
//   Cargar partida → elegir ranura, borrar ranuras o importar (archivo o código)
//   ⚙️ → sonido, música y texto grande
// Desde el juego: Más → Título (guarda antes de salir).
import { $, VIS } from "../render/canvas.js";
import { G, S, hasState, newState, replaceState, ensure } from "../core/state.js";
import { loadOrNew, saveNow } from "../core/save.js";
import { listSlots, slotInfo, slotKey, lastSlot, useSlot, deleteSlot, hasAnySlot } from "../core/slots.js";
import { loadSetsFor, FAILED } from "../core/cards/api.js";
import { custs, queue } from "../core/customers/move.js";
import { fmt } from "../core/util.js";
import { giftCheck } from "../core/gift.js";
import { MUSIC, setMusic } from "../audio/sfx.js";
import { DIFFS, PETS } from "../core/constants.js";
import { CHARS, drawPortrait } from "../render/characters.js";
import { startStory } from "./story.js";
import { A } from "./actions.js";
import { closeM } from "./modals.js";
import { hud, setPause, applyUI } from "./hud.js";
import { parseSave } from "./screens/more.js";
import { toast } from "./toast.js";

const ICON = import.meta.env.BASE_URL + "icons/icon-192.png";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ===================== PANTALLA DE CARGA ===================== */
export const LOAD_MIN_MS = 1500;
export const PHRASES = [
  "Contando sobres…",
  "Despertando a Gengar…",
  "Emma revisa las cuentas…",
  "Papá está en el gimnasio…",
  "Álvaro se ha caído otra vez…",
  "Puliendo la vitrina…",
];
let loadT0 = 0,
  phraseT = null;

/** Empieza la pantalla de carga: frases que rotan cada 2 s. */
export function loadStart() {
  loadT0 = performance.now();
  let i = 0;
  const el = $("#loadfun");
  if (!el) return;
  el.textContent = PHRASES[0];
  phraseT = setInterval(() => {
    i = (i + 1) % PHRASES.length;
    el.classList.remove("on");
    void el.offsetWidth; // reinicia la animación de entrada
    el.textContent = PHRASES[i];
    el.classList.add("on");
  }, 2000);
}

/** Barra de progreso: d de n colecciones cargadas (n = 0 → aún sin saber cuántas). */
export function loadProgress(d, n) {
  const b = $("#loadbar");
  if (b) b.style.width = (n ? Math.round(8 + (92 * d) / n) : 4) + "%";
}

/** Termina la carga: espera hasta el mínimo de 1,5 s, la tienda se ilumina (sube la persiana y los sobres
 * se abren en abanico) y se quita la pantalla. Sin esperas si se salta el título (tests). */
export function loadDone(skipWait) {
  const wait = skipWait ? 0 : Math.max(0, LOAD_MIN_MS - (performance.now() - loadT0)),
    still = skipWait || matchMedia("(prefers-reduced-motion: reduce)").matches,
    pause = (ms) => new Promise((r) => setTimeout(r, ms));
  return pause(wait)
    .then(() => {
      clearInterval(phraseT);
      loadProgress(1, 1);
      const el = $("#load");
      if (!el || still) return;
      el.classList.add("lit");
      return pause(750).then(() => (el.classList.add("out"), pause(350)));
    })
    .then(() => {
      const el = $("#load");
      if (el) el.remove();
    });
}

/* ===================== TÍTULO ===================== */
let view = "main", // main | new | adv | load | imp | set
  adv = null, // Prepara tu aventura: { slot, diff, pet }
  pendingImport = null,
  bigPref = null, // «texto grande» elegido en el título: se aplica a la partida que se abra
  firstStart = true;

/** Ranura que abre «Continuar»: la última usada; si está vacía, la guardada más reciente. */
export function continueSlot() {
  const l = listSlots().filter((s) => !s.empty);
  if (!l.length) return null;
  const last = l.find((s) => s.n === lastSlot());
  return last ? last.n : l.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0].n;
}

/** Partida de fondo para el título: la de «Continuar» o una tienda nueva sin guardar. */
export function titleBackground() {
  G.TITLE = true;
  custs.length = 0;
  queue.length = 0;
  const n = continueSlot();
  if (n) {
    useSlot(n);
    loadOrNew();
  } else newState();
  applyUI();
}

export function showTitle() {
  if (!G.TITLE) titleBackground();
  view = "main";
  let el = $("#title");
  if (!el) {
    el = document.createElement("div");
    el.id = "title";
    document.body.appendChild(el);
  }
  paintTitle();
  setMusic(MUSIC);
}

const savedAt = (t) =>
  t ? new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
const card = (s) =>
  `<div class="title-card"><b>${esc(s.name)}</b><span>Día ${s.day} · ${fmt(s.money)} · ${esc(s.diff)}</span>${s.savedAt ? `<small>Guardada el ${savedAt(s.savedAt)}</small>` : ""}</div>`;

function slotRow(s, mode) {
  const head = `<div class="title-slotn">Ranura ${s.n}</div>`;
  if (s.empty)
    return `<div class="title-slot empty">${head}<div class="title-card"><span>Vacía</span></div>${mode === "new" || mode === "imp" ? `<button class="b pri" data-a="${mode === "new" ? "tnewin" : "timpin"}" data-n="${s.n}">${mode === "new" ? "Empezar aquí" : "Guardar aquí"}</button>` : ""}</div>`;
  const btn =
    mode === "load"
      ? `<button class="b pri" data-a="topen" data-n="${s.n}">Jugar</button><button class="b danger" data-a="tdel" data-n="${s.n}" aria-label="Borrar ranura ${s.n}">🗑️</button>`
      : `<button class="b" data-a="${mode === "new" ? "tnewin" : "timpin"}" data-n="${s.n}">Sobrescribir</button>`;
  return `<div class="title-slot">${head}${card(s)}<div class="btns">${btn}</div></div>`;
}

export function paintTitle() {
  const el = $("#title");
  if (!el) return;
  const any = hasAnySlot(),
    cont = continueSlot(),
    big = document.documentElement.classList.contains("ui-big");
  const logo = `<div class="title-logo"><img src="${ICON}" alt="" width="96" height="96"><h1>Pokémon Card Shop</h1></div>`;
  const back = `<button class="b title-back" data-a="tback">← Volver</button>`;
  let body = "";
  if (view === "main")
    body = `${logo}<div class="title-menu">
      ${cont ? `<button class="b pri big title-cont" data-a="tcont">▶ Continuar${card(slotInfo(cont))}</button>` : ""}
      <button class="b ${cont ? "" : "pri"} big" data-a="tnew">✨ Nueva partida</button>
      ${any ? `<button class="b big" data-a="tload">📂 Cargar partida</button>` : `<button class="b mini title-imp" data-a="timp">📥 Importar una partida</button>`}
    </div>`;
  else if (view === "new" || view === "load")
    body = `<h2>${view === "new" ? "✨ Nueva partida" : "📂 Cargar partida"}</h2><p class="mu">${view === "new" ? "Elige dónde guardar tu tienda." : "Elige una tienda para seguir jugando."}</p>
      <div class="title-slots">${listSlots()
        .map((s) => slotRow(s, view))
        .join("")}</div>
      ${view === "load" ? impBox() : ""}${back}`;
  else if (view === "imp")
    body = pendingImport
      ? `<h2>📥 Importar partida</h2><p class="mu">Tienda «${esc((pendingImport.shopName || "").trim() || "Poké Cards")}», día ${pendingImport.day}, ${fmt(pendingImport.money)}. ¿En qué ranura la guardo?</p>
      <div class="title-slots">${listSlots()
        .map((s) => slotRow(s, "imp"))
        .join("")}</div>${back}`
      : `<h2>📥 Importar partida</h2>${impBox()}${back}`;
  else if (view === "adv")
    body = `<h2>🎒 Prepara tu aventura</h2>
      <div class="adv-hero"><canvas id="advpj" width="240" height="300" aria-hidden="true"></canvas><div><b>¡Eres Álvaro!</b><span>Le encantan los Pokémon, coleccionar y los animales… y se cae por todas partes. Su ropa, la mascota y el nombre de la tienda se pueden cambiar después en Más → Personalizar.</span></div></div>
      <h3>Dificultad</h3><div class="adv-opts">${Object.keys(DIFFS)
        .map(
          (k) =>
            `<button class="adv-opt${adv.diff === k ? " on" : ""}" data-a="tadvd" data-k="${k}"><b>${DIFFS[k].n}</b>${k === "facil" ? "<em>Recomendado para peques</em>" : ""}<span>${DIFFS[k].d}</span></button>`,
        )
        .join("")}</div>
      <h3>Mascota</h3><div class="adv-pets">${Object.keys(PETS)
        .map(
          (k) =>
            `<button class="adv-opt${adv.pet === k ? " on" : ""}" data-a="tadvp" data-k="${k}">${PETS[k]}</button>`,
        )
        .join("")}</div>
      <button class="b pri big adv-go" data-a="tadvgo">¡Empezar!</button>
      <button class="b title-back" data-a="tnew">← Volver</button>`;
  else if (view === "set")
    body = `<h2>⚙️ Ajustes</h2><div class="tgrid">
      <button class="tilebtn" data-a="tsnd"><span>${G.SOUND ? "🔊" : "🔇"}</span>Sonido: ${G.SOUND ? "sí" : "no"}</button>
      <button class="tilebtn" data-a="tmus"><span>🎵</span>Música: ${MUSIC ? "sí" : "no"}</button>
      <button class="tilebtn" data-a="tbig"><span>🔠</span>Texto: ${big ? "grande" : "normal"}</button></div>${back}`;
  el.innerHTML = `<div class="title-in title-${view}">${view === "main" ? `<button class="title-gear" data-a="tset" aria-label="Ajustes">⚙️</button>` : ""}${body}</div>`;
  // En el menú principal la tienda se ve detrás; en las pantallas interiores, casi nada (se leen mejor)
  el.classList.toggle("solid", view !== "main");
  if (view === "adv") paintHero();
}

/** Retrato de Álvaro en «Prepara tu aventura» (con ojos de estrella al elegir). */
function paintHero() {
  const c = $("#advpj");
  if (!c) return;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  drawPortrait(x, CHARS.alvaro, adv.wow ? "stars" : "happy", c.width);
}

const impBox = () =>
  `<div class="pn title-impbox"><b>Importar</b><div class="mu">Un archivo exportado o el código de Más → Partida.</div>
  <div class="btns"><button class="b" data-a="timpfile">📄 Elegir archivo</button></div>
  <textarea id="timpcode" class="inp" rows="2" placeholder="…o pega aquí el código"></textarea>
  <div class="btns"><button class="b pri" data-a="timpcode">Importar código</button></div></div>`;

/** Entra en el juego con la partida que haya en S (ya cargada o recién creada). */
function startGame() {
  G.TITLE = false;
  custs.length = 0;
  queue.length = 0;
  if (bigPref != null) S.ui = Object.assign({}, S.ui, { big: bigPref });
  bigPref = null;
  const el = $("#title");
  if (el) el.remove();
  if (G.M) closeM();
  if (G.paused) setPause(false);
  applyUI();
  VIS.mShown = S.money;
  saveNow();
  hud();
  setTimeout(giftCheck, 1500);
  if (firstStart && FAILED.size)
    setTimeout(() => toast(`⚠️ ${FAILED.size} colección(es) no cargaron. Reinténtalo en Más → Colecciones`), 800);
  firstStart = false;
}
export { startGame };

/** Abre la partida de una ranura (cargando antes sus colecciones). */
export function enterSlot(n) {
  let sets = null;
  try {
    sets = (JSON.parse(localStorage.getItem(slotKey(n))) || {}).sets;
  } catch (e) {}
  return (sets && sets.length ? loadSetsFor(sets) : Promise.resolve()).then(() => {
    useSlot(n);
    loadOrNew();
    startGame();
  });
}

/** Importa en el título: primero se lee, después se elige la ranura. */
export function titleImport(txt) {
  const ns = parseSave(txt);
  if (!ns) return;
  pendingImport = ns;
  view = "imp";
  paintTitle();
}

const ask = (s, what) => s.empty || confirm(`¿${what} la tienda «${s.name}»? No se puede deshacer.`);

Object.assign(A, {
  tcont: () => {
    const n = continueSlot();
    if (n) enterSlot(n);
  },
  tnew: () => ((view = "new"), paintTitle()),
  tload: () => ((view = "load"), paintTitle()),
  timp: () => ((pendingImport = null), (view = "imp"), paintTitle()),
  tset: () => ((view = "set"), paintTitle()),
  tback: () => ((pendingImport = null), (view = "main"), paintTitle()),
  tnewin: (d) => {
    const n = +d.n;
    if (!ask(slotInfo(n), "Sobrescribir")) return;
    adv = { slot: n, diff: "normal", pet: "cat" };
    view = "adv";
    paintTitle();
  },
  tadvd: (d) => ((adv.diff = d.k), (adv.wow = true), paintTitle()),
  tadvp: (d) => ((adv.pet = d.k), (adv.wow = true), paintTitle()),
  tadvgo: () => {
    useSlot(adv.slot);
    newState();
    S.diff = adv.diff;
    S.pet = adv.pet;
    adv = null;
    startGame();
    startStory(); // después, el tutorial con Emma (empieza solo al terminar o saltar la historia)
  },
  topen: (d) => enterSlot(+d.n),
  tdel: (d) => {
    const n = +d.n;
    if (!ask(slotInfo(n), "Borrar")) return;
    deleteSlot(n);
    titleBackground(); // por si era la de fondo
    view = hasAnySlot() ? "load" : "main";
    paintTitle();
    toast("🗑️ Ranura borrada");
  },
  timpfile: () => $("#impfile").click(),
  timpcode: () => titleImport(($("#timpcode") || {}).value),
  timpin: (d) => {
    const n = +d.n,
      ns = pendingImport;
    if (!ns || !ask(slotInfo(n), "Sobrescribir")) return;
    toast("Cargando partida…");
    loadSetsFor(ns.sets).then(() => {
      pendingImport = null;
      useSlot(n);
      replaceState(ns);
      S.phase = "closed";
      S.clock = 0;
      ensure();
      startGame();
      toast("✅ Partida cargada");
    });
  },
  tsnd: () => (A.sndtog(), paintTitle()),
  tmus: () => (A.mustog(), paintTitle()),
  tbig: () => {
    bigPref = !document.documentElement.classList.contains("ui-big");
    document.documentElement.classList.toggle("ui-big", bigPref);
    paintTitle();
  },
  // Desde el juego: Más → Título
  totitle: () => {
    if (hasState()) saveNow();
    if (G.M) closeM();
    titleBackground();
    showTitle();
  },
});
