// Examinar una carta con lupa, luz y balanza.
import { $ } from "../render/canvas.js";
import { G } from "../core/state.js";
import { RAR } from "../core/constants.js";
import { clamp } from "../core/util.js";
import { face, faceBig } from "./modals.js";
import { setName } from "../core/cards/sets.js";
export function mInsp() {
  const I = G.INSP,
    c = I.c,
    t = I.tells,
    lensFk = I.fake && t.includes("lens"),
    lightFk = I.fake && t.includes("light");
  const tabs = [
    ["lens", "🔍 Lupa"],
    ["light", "💡 Luz"],
    ["scale", "⚖️ Balanza"],
  ]
    .map(([k, n]) => `<button class="b ${I.mode === k ? "on" : ""}" data-a="imode" data-k="${k}">${n}</button>`)
    .join("");
  const info = {
    lens: "Mueve el dedo por la carta. Las auténticas tienen el texto y los bordes nítidos, sin trama de puntos de colores.",
    light: "Luz por detrás: las auténticas tienen una capa interior negra y casi no deja pasar la luz.",
    scale: "Una carta auténtica pesa unos 1,75 g.",
  }[I.mode];
  const stage =
    I.mode === "scale"
      ? `<div class="scale"><div class="scl-card">${face(c, I.rv)}</div><div class="scl-base"><div class="scl-lcd">${I.wt.toFixed(2).replace(".", ",")} g</div></div></div>`
      : `<div class="insp${I.mode === "light" ? " light" : ""}${I.mode === "light" && lightFk ? " thru" : ""}${lensFk ? " fk" : ""}" id="insp"><div class="ic">${faceBig(c, I.rv)}</div>${I.mode === "lens" ? `<div class="lens" id="lens"><div class="lin">${faceBig(c, I.rv)}</div>${lensFk ? '<div class="ldots"></div>' : ""}</div>` : ""}</div>`;
  return `<h2>Examinar carta</h2><div class="tabs">${tabs}</div><div class="mu" style="margin-bottom:10px">${info}</div>${stage}
  ${(() => {
    I.seen = I.seen || {};
    I.seen[I.mode] = 1;
    const bad = {
      lens: I.fake && t.includes("lens"),
      light: I.fake && t.includes("light"),
      scale: I.fake && t.includes("scale"),
    };
    const L = {
      lens: ["🔍 Lupa", (b) => (b ? "⚠️ se ve una trama de puntos de colores" : "✅ texto y bordes nítidos")],
      light: ["💡 Luz", (b) => (b ? "⚠️ la luz la atraviesa" : "✅ casi no pasa la luz")],
      scale: [
        "⚖️ Balanza",
        (b) => (b ? "⚠️ pesa poco: " : "✅ peso correcto: ") + I.wt.toFixed(2).replace(".", ",") + " g",
      ],
    };
    const ks = Object.keys(L).filter((k) => I.seen[k]),
      nb = ks.filter((k) => bad[k]).length,
      left = Object.keys(L).filter((k) => !I.seen[k]);
    return `<div class="pn clues"><b>🕵️ Pistas encontradas</b>${ks.map((k) => `<div class="${bad[k] ? "down" : "up"}">${L[k][0]}: ${L[k][1](bad[k])}</div>`).join("")}${left.length ? `<div class="mu">Prueba también: ${left.map((k) => L[k][0]).join(" y ")}</div>` : ""}<div style="margin-top:6px;font-family:var(--fd);font-size:16px">${nb >= 2 ? "❌ Muy probablemente es FALSA" : nb === 1 ? "🤔 Sospechosa: revisa las otras pruebas" : ks.length >= 2 ? "✅ Parece auténtica" : "Sigue examinando…"}</div></div>`;
  })()}
  <div class="pn" style="margin-top:12px"><b>${c.name}</b> <span class="mu">${RAR[c.r].n} · ${setName(c.s)}</span><div class="mu">Una falsificación falla en dos de las tres pruebas.</div><div class="btns"><button class="b pri" data-a="iok">✅ Es auténtica</button><button class="b" data-a="ifake">❌ Es falsa</button></div></div>`;
}
export function bindInsp() {
  const el = $("#insp"),
    ln = $("#lens");
  if (!el || !ln) return;
  const r0 = el.getBoundingClientRect(),
    li = ln.querySelector(".lin");
  li.style.setProperty("--cw0", r0.width + "px");
  li.style.setProperty("--ch0", r0.height + "px");
  const mv = (x, y) => {
    ln.style.setProperty("--lx", x + "px");
    ln.style.setProperty("--ly", y + "px");
    li.style.setProperty("--tx", 65 - x * 2.6 + "px");
    li.style.setProperty("--ty", 65 - y * 2.6 + "px");
  };
  mv(r0.width * 0.5, r0.height * 0.3);
  const h = (e) => {
    const r = el.getBoundingClientRect();
    mv(clamp(e.clientX - r.left, 0, r.width), clamp(e.clientY - r.top, 0, r.height));
  };
  el.addEventListener("pointermove", h);
  el.addEventListener("pointerdown", h);
}
