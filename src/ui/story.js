// Fase I · paso 5: la historia de inicio, reproducida a partir de los datos de story/script.js.
//
// Planos generales: la tienda y la calle de verdad (el juego se queda quieto; solo se animan la calle
// y la cámara), con los personajes como muñecos (drawMini) en su sitio del mundo.
// Primeros planos: retratos grandes (drawPortrait) con bandas de cine.
// Bocadillo con efecto máquina de escribir: el primer toque completa la frase y el segundo pasa a la
// siguiente. «Saltar» siempre visible. Al saltar o terminar: S.storySeen = true.
// Con «menos animaciones» (o si el sistema pide menos movimiento): sin máquina de escribir, cámara
// directa y efectos quietos.
import { $, VIS } from "../render/canvas.js";
import { VIEW, clampView, fitCanvas } from "../render/camera.js";
import { G, S, hasState, shopName } from "../core/state.js";
import { saveNow } from "../core/save.js";
import { CHARS, drawPortrait, drawMini, rrect, charFace } from "../render/characters.js";
import { storyScript, NAMES, NAME_SUGGESTIONS } from "../story/script.js";
import { sfx } from "../audio/sfx.js";
import { A } from "./actions.js";
import { hud } from "./hud.js";

// Niño del primer cliente (escena 8)
const KID = Object.assign({}, CHARS.alvaro, {
  n: "Niño",
  hair: "#2a1d14",
  hairH: "#4a3426",
  hairS: "#1a110b",
  style: "bob",
  shirt: "#e0622a",
  shirtS: "#b84d1f",
  ball: false,
});
const calm = () =>
  document.documentElement.classList.contains("ui-calm") ||
  (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let ST = null;

/**
 * Empieza la historia. replay: repetirla desde Más (sin volver a pedir el nombre).
 * onEnd: al terminar o saltar.
 */
export function startStory({ replay = false, onEnd = null } = {}) {
  if (ST || !hasState()) return;
  const steps = storyScript(S.pet || "cat").filter((s) => !(replay && s.ask));
  G.STORY = true;
  VIS.story = true;
  document.documentElement.classList.add("st-on"); // la tienda a pantalla completa, sin HUD
  fitCanvas();
  VIEW.mode = "manual";
  ST = { steps, i: -1, replay, onEnd, scene: 0, typing: null, cast: null, t0: 0, raf: 0, cam: null, brush: null };
  const r = document.createElement("div");
  r.id = "story";
  r.innerHTML = `<div class="st-close" id="stclose"></div><canvas class="st-cast" id="stcast"></canvas>
    <div class="st-bar top"></div><div class="st-bar bot"></div>
    <div class="st-scene" id="stscene"></div><div class="st-fx" id="stfx"></div>
    <button class="st-skip" id="stskip">Saltar ⏭</button>
    <div class="st-bub" id="stbub"></div>`;
  document.body.appendChild(r);
  r.addEventListener("click", (e) => {
    if (e.target.closest("#stskip")) return finish();
    if (e.target.closest(".st-ask")) return;
    tap();
  });
  ST.raf = requestAnimationFrame(loop);
  next();
}

export const storyOn = () => !!ST;
/** Paso actual (para los tests): número, frase completa y si se está escribiendo todavía. */
export const storyNow = () => ST && { i: ST.i, text: ST.full, typing: !!ST.typing, asking: !!ST.asking };

function tap() {
  if (!ST || ST.asking) return;
  if (ST.typing) {
    clearInterval(ST.typing);
    ST.typing = null;
    const p = $("#sttext");
    if (p) p.textContent = ST.full;
    return;
  }
  next();
}

function next() {
  ST.i++;
  if (ST.i >= ST.steps.length) return finish();
  show(ST.steps[ST.i]);
}

function show(st) {
  const r = $("#story");
  r.classList.toggle("wide", st.shot === "wide");
  r.classList.toggle("close", st.shot === "close");
  r.classList.toggle("dramatic", st.look === "dramatic");

  // Escena nueva: su título
  if (st.scene[0] !== ST.scene) {
    ST.scene = st.scene[0];
    const sc = $("#stscene");
    sc.textContent = `${st.scene[0]} · ${st.scene[1]}`;
    sc.classList.remove("on");
    void sc.offsetWidth;
    sc.classList.add("on");
  }

  // Cartel en blanco hasta que se elige el nombre (al repetir la historia, el cartel ya tiene nombre)
  if (!ST.replay && st.blankSign != null && !ST.brush) VIS.signReveal = st.blankSign ? 0 : 1;

  if (st.shot === "wide") {
    ST.cam = speakerCam(st);
    if (calm()) camStep(1);
    ST.cast = st.cast || null;
    ST.t0 = performance.now();
    $("#stclose").innerHTML = "";
  } else {
    if (ST.cast !== null || !$("#stclose .st-bg")) snapBg();
    ST.cast = null;
    paintClose(st);
  }
  fx(st.fx, st.pop);
  ST.board = st.blankSign != null; // escena 7: el cartel, entero y encima de todo
  bubble(st);
}

/** Plano general: si quien habla está en escena, la cámara se acerca a él (sin perder del todo el plano). */
function speakerCam(st) {
  const c = st.cam,
    who = st.say && st.say[0];
  if (!c || !who || !st.cast) return c;
  const pts = who
    .split("+")
    .map((w) => st.cast[w])
    .filter(Boolean)
    .map((a) => a.to || a.at);
  if (!pts.length) return c;
  const px = pts.reduce((a, p) => a + p[0], 0) / pts.length,
    py = pts.reduce((a, p) => a + p[1], 0) / pts.length - 24; // la cara, no los pies
  return { x: c.x * 0.25 + px * 0.75, y: c.y * 0.25 + py * 0.75, z: Math.min(c.z * 2.3, 3) };
}

/** Fondo de los primeros planos: la tienda tal y como se ve, pequeña y difuminada. */
function snapBg() {
  const box = $("#stclose"),
    cv = $("#cv");
  if (!box || !cv || !cv.width) return;
  const bg = document.createElement("canvas");
  bg.width = Math.max(1, Math.round(cv.width / 4));
  bg.height = Math.max(1, Math.round(cv.height / 4));
  const x = bg.getContext("2d");
  x.filter = "blur(3px)";
  x.drawImage(cv, 0, 0, bg.width, bg.height);
  bg.className = "st-bg";
  ST.bg = bg;
}

function paintClose(st) {
  const box = $("#stclose"),
    who = st.who || [],
    speaker = st.say && st.say[0],
    key = who.map((w) => w[0]).join("+"),
    enter = key !== ST.whoKey; // entran deslizándose solo cuando cambia quién sale
  ST.whoKey = key;
  box.className = "st-close n" + who.length;
  box.innerHTML = "";
  if (ST.bg) box.appendChild(ST.bg);
  ST.por = [];
  who.forEach(([c, ex], i) => {
    const cv = document.createElement("canvas");
    cv.width = 240;
    cv.height = 300;
    cv.className =
      "st-por" +
      (who.length > 1 ? (i ? " r" : " l") : "") +
      (speaker && !speaker.includes(c) && who.length > 1 ? " off" : "") +
      (st.tilt === c ? " tilt" : "") +
      (enter ? " enter" : "");
    drawPortrait(cv.getContext("2d"), CHARS[c], ex, 240);
    box.appendChild(cv);
    ST.por.push({
      cv,
      c,
      ex,
      talks: !!speaker && speaker.includes(c),
      blinkAt: performance.now() + 1200 + Math.random() * 2500,
      st: "",
    });
  });
  // Momentos fuertes: golpe de zoom si gritan, temblor si hay golpe
  const r = $("#story"),
    text = (st.say && st.say[2]) || "";
  r.classList.remove("punch", "shake");
  if (!calm()) {
    void r.offsetWidth;
    if (/[A-ZÁÉÍÓÚÑ]{3,}/.test(text) && /!/.test(text)) r.classList.add("punch");
    if (["fall", "keys", "dong"].includes(st.fx)) r.classList.add("shake");
  }
}

/** Primeros planos vivos: parpadean de vez en cuando y quien habla mueve la boca mientras sale el texto. */
function animClose(now) {
  if (!ST.por || calm()) return;
  for (const p of ST.por) {
    if (now > p.blinkAt + 140) p.blinkAt = now + 2200 + Math.random() * 2600;
    const blink = now > p.blinkAt,
      talk = p.talks && !!ST.typing && Math.floor(now / 110) % 2 === 0,
      key = (blink ? "b" : "") + (talk ? "t" : "");
    if (key === p.st) continue;
    p.st = key;
    const x = p.cv.getContext("2d");
    x.clearRect(0, 0, 240, 300);
    drawPortrait(x, Object.assign({}, CHARS[p.c], { blink, talk }), p.ex, 240);
  }
}

function bubble(st) {
  const [who, ex, text] = st.say || [null, null, ""],
    b = $("#stbub"),
    faceImg =
      st.shot === "wide" && who
        ? who
            .split("+")
            .map((w) => `<img src="${charFace(w, ex)}" alt="">`)
            .join("")
        : "";
  b.className = "st-bub" + (who ? "" : " narr");
  b.innerHTML = `${faceImg ? `<div class="st-faces">${faceImg}</div>` : ""}<div class="st-txt">
    ${who ? `<b>${NAMES[who]}</b>` : ""}<p id="sttext"></p>
    ${st.ask === "name" ? askHTML() : `<span class="st-more">Toca para seguir ▸</span>`}</div>`;
  ST.full = text;
  clearInterval(ST.typing);
  ST.typing = null;
  const p = $("#sttext");
  if (calm() || !text) p.textContent = text;
  else {
    let n = 0;
    ST.typing = setInterval(() => {
      n += 1;
      p.textContent = text.slice(0, n);
      if (n >= text.length) {
        clearInterval(ST.typing);
        ST.typing = null;
      }
    }, 28);
  }
  if (st.ask === "name") bindAsk();
}

/* ---------- Escena 7: el nombre de la tienda ---------- */
const askHTML = () =>
  `<div class="st-ask"><input class="inp" id="stname" maxlength="22" placeholder="Poké Cards" autocomplete="off">
  <div class="st-sug">${NAME_SUGGESTIONS.map((n) => `<button class="b mini" data-sug="${esc(n)}">${esc(n)}</button>`).join("")}</div>
  <button class="b pri" id="stnameok">¡Listo!</button></div>`;

function bindAsk() {
  ST.asking = true;
  const inp = $("#stname");
  document
    .querySelectorAll("#stbub [data-sug]")
    .forEach((b) => (b.onclick = () => ((inp.value = b.dataset.sug), inp.focus())));
  const ok = () => {
    const v = inp.value.trim();
    if (!v) return inp.focus();
    S.shopName = v.slice(0, 22);
    saveNow();
    ST.asking = false;
    inp.blur();
    $("#stbub").querySelector(".st-ask").remove();
    brush(() => next());
  };
  $("#stnameok").onclick = ok;
  inp.onkeydown = (e) => e.key === "Enter" && ok();
}

/** El nombre se pinta en el cartel de izquierda a derecha, como con una brocha. */
function brush(done) {
  if (calm()) {
    VIS.signReveal = 1;
    return done();
  }
  ST.brush = { t0: performance.now(), dur: 1400, done };
  sfx.swish && sfx.swish();
}

/* ---------- Efectos ---------- */
const FX = {
  sparkle: ["✨", "✨", "💪", "✨"],
  fall: ["🃏", "🃏", "💥", "🃏", "🃏"],
  keys: ["🔑", "💫", "¡CLONK!"],
  pet: ["🐾", "💕"],
  notes: ["♪", "♫", "♪", "🎸"],
  dong: ["¡DONG!", "💫"],
  calc: ["🧮", "➕", "➗"],
  shutter: ["☀️", "✨"],
};
function fx(k, pop) {
  const box = $("#stfx");
  box.innerHTML = "";
  if (!k || !FX[k]) return;
  const list = pop ? [pop, ...FX[k]] : FX[k];
  if (k === "shutter") sfx.shutter && sfx.shutter();
  if (k === "keys" || k === "fall" || k === "dong") sfx.hit && sfx.hit(2);
  list.forEach((t, i) => {
    const e = document.createElement("span");
    e.className = "st-pop" + (t.length > 2 ? " word" : "");
    e.textContent = t;
    e.style.setProperty("--i", i);
    e.style.setProperty("--x", ((i * 37) % 70) - 35 + "vw");
    box.appendChild(e);
  });
}

/* ---------- Bucle: cámara, muñecos y brocha ---------- */
function camStep(k) {
  const V = VIEW,
    c = ST.cam;
  if (!c) return;
  const ts = Math.min(V.max, Math.max(V.min, (V.shop || V.cover) * c.z)), // z: veces «toda la tienda a la vista»
    fy = ST.fy || V.ch / 2, // altura de la pantalla donde se encuadra: entre la banda de arriba y el bocadillo
    cx = (V.cw / 2 - V.ox) / V.s,
    cy = (fy - V.oy) / V.s,
    ns = V.s + (ts - V.s) * k,
    nx = cx + (c.x - cx) * k,
    ny = cy + (c.y - cy) * k;
  V.s = ns;
  V.ox = V.cw / 2 - nx * ns;
  V.oy = fy - ny * ns;
  clampView();
}

let last = 0;
function loop(now) {
  if (!ST) return;
  const dt = Math.min(0.05, (now - (last || now)) / 1000);
  last = now;
  placeBars();
  if (ST.cam && !calm()) camStep(Math.min(1, dt * 2.2));
  if (ST.cast === null) animClose(now);
  drawCast(now);
  if (ST.brush) {
    const t = Math.min(1, (now - ST.brush.t0) / ST.brush.dur);
    VIS.signReveal = t;
    if (t >= 1) {
      const d = ST.brush.done;
      ST.brush = null;
      d();
    }
  }
  ST.raf = requestAnimationFrame(loop);
}

/** Planos generales: la tienda ocupa toda la pantalla, con una banda de cine arriba (título y «Saltar»);
 * la cámara encuadra el hueco que queda entre la banda y el bocadillo. */
function placeBars() {
  const r = $("#story");
  if (!r || !r.classList.contains("wide")) return;
  const c = $("#cv").getBoundingClientRect(),
    top = Math.max(c.top, Math.round(innerHeight * 0.08)),
    b = $("#stbub"),
    bt = b ? b.getBoundingClientRect().top : c.bottom;
  r.style.setProperty("--top", top + "px");
  r.style.setProperty("--bot", Math.max(0, innerHeight - c.bottom) + "px");
  ST.fy = Math.max(40, (top + Math.min(bt, c.bottom)) / 2 - c.top);
}

function drawCast(now) {
  const c = $("#stcast");
  if (!c) return;
  const r = $("#cv").getBoundingClientRect(),
    dpr = Math.min(2, devicePixelRatio || 1);
  if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) {
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
  }
  c.style.left = r.left + "px";
  c.style.top = r.top + "px";
  c.style.width = r.width + "px";
  c.style.height = r.height + "px";
  const x = c.getContext("2d");
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, r.width, r.height);
  const V = VIEW,
    k = V.s * 0.75;
  if (ST.cast) {
    const t = calm() ? 1 : Math.min(1, (now - ST.t0) / 1400),
      list = Object.entries(ST.cast).map(([who, a]) => {
        const to = a.to || a.at,
          e = t * (2 - t); // frena al llegar
        return {
          who,
          a,
          wx: a.at[0] + (to[0] - a.at[0]) * e,
          wy: a.at[1] + (to[1] - a.at[1]) * e,
          moving: !!a.to && t < 1,
        };
      });
    list.sort((p, q) => p.wy - q.wy);
    for (const p of list) {
      const sx = V.ox + p.wx * V.s,
        sy = V.oy + p.wy * V.s,
        ch = p.who === "kid" ? KID : CHARS[p.who];
      x.save();
      x.translate(sx, sy);
      x.scale(k, k);
      if (p.a.pose === "fall") x.rotate(-Math.PI / 2);
      drawMini(x, ch, 0, 0, calm() ? 0 : now / (p.moving ? 70 : 260));
      x.restore();
    }
  }
  if (ST.board) drawBoard(x, V);
}

/**
 * Escena 7: el cartel de la tienda dibujado encima de todo y entero (en la tienda, las estanterías
 * tapan casi todo el cartel). Vacío hasta elegir el nombre; después, el nombre aparece «con brocha».
 */
function drawBoard(x, V) {
  const W2 = 140,
    cxw = 400,
    top = 6,
    h = 36,
    sx = (wx) => V.ox + wx * V.s,
    sy = (wy) => V.oy + wy * V.s,
    rv = ST.replay || VIS.signReveal == null ? 1 : VIS.signReveal,
    s = V.s;
  const rect = (x0, y0, w, hh, r, c) => {
    x.fillStyle = c;
    rrect(x, sx(x0), sy(y0), w * s, hh * s, r * s);
    x.fill();
  };
  x.save();
  x.shadowColor = "#0007";
  x.shadowBlur = 10;
  rect(cxw - W2, top, W2 * 2, h, 6, "#6b4527");
  x.restore();
  rect(cxw - W2 + 4, top + 4, W2 * 2 - 8, h - 8, 4, "#8a5a33");
  if (rv > 0) {
    const name = shopName().toUpperCase(),
      font = (px) => `700 ${Math.round(px * 10) / 10}px Fredoka, "Trebuchet MS", system-ui, sans-serif`,
      max = (W2 * 2 - 24) * s;
    // Tamaño de letra para que el nombre quepa entero (con tope de 22 y mínimo de 9)
    x.font = font(22 * s);
    const w = x.measureText(name).width;
    x.font = font(Math.max(9 * s, w > max ? (22 * s * max) / w : 22 * s));
    x.save();
    x.beginPath();
    x.rect(sx(cxw - W2), sy(top), W2 * 2 * s * rv, h * s);
    x.clip();
    x.fillStyle = "#f4e2c0";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(name, sx(cxw), sy(top + h / 2 + 1));
    x.restore();
  }
  // La brocha, siguiendo al nombre que aparece
  if (ST.brush) {
    x.font = `${Math.round(26 * s + 10)}px system-ui,sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("🖌️", sx(cxw - W2 + W2 * 2 * rv), sy(top + h / 2));
  }
}

function finish() {
  if (!ST) return;
  const { onEnd } = ST;
  clearInterval(ST.typing);
  cancelAnimationFrame(ST.raf);
  if (ST.brush) VIS.signReveal = 1;
  ST = null;
  VIS.signReveal = null;
  G.STORY = false;
  VIS.story = false;
  document.documentElement.classList.remove("st-on");
  const r = $("#story");
  if (r) r.remove();
  fitCanvas();
  S.storySeen = true;
  VIEW.mode = "auto";
  if (A.zfit) A.zfit();
  saveNow();
  hud();
  if (onEnd) onEnd();
}

Object.assign(A, {
  // Más → Ver la historia (no vuelve a pedir el nombre)
  storyre: () => {
    if (A.close) A.close();
    startStory({ replay: true });
  },
});
