// Barra de navegación inferior, iconos y pestañas de Cartas y Retos.
import { $, VIS } from "../render/canvas.js";
import { G, S } from "../core/state.js";
import { ALBR } from "../core/constants.js";
import { albPct } from "../core/achievements.js";
import { ownFor } from "../core/orders.js";
import { setName } from "../core/cards/sets.js";
import { updBadges } from "./hud.js";
import { hero } from "./hero.js";
import { PAPA } from "../core/quips.js";
import { fmt } from "../core/util.js";
import { invValue } from "../core/economy.js";
export const ICON = {
  packs: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  coll: '<rect x="3" y="5" width="11" height="15" rx="2"/><path d="M10 4.5l7.5-1.3a2 2 0 012.3 1.6l2 11.6a2 2 0 01-1.6 2.3L14 19.8"/>',
  album: '<path d="M5 3h12a2 2 0 012 2v16H7a2 2 0 01-2-2z"/><path d="M5 17a2 2 0 012-2h12M9 7h6"/>',
  tasks: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 12l2 2 4-4M9 17h6"/>',
  more: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  speed: '<path d="M3 5l9 7-9 7zM12 5l9 7-9 7z"/>',
  home: '<path d="M3 10l9-6 9 6"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
};
export const svgI = (k) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
export const NAVS = [
  ["home", "home", "Tienda"],
  ["packs", "packs", "Stock"],
  ["coll", "coll", "Cartas"],
  ["retos", "trophy", "Retos"],
  ["more", "more", "Más"],
];
export function paintNav() {
  const n = $("#nav");
  if (n)
    n.innerHTML = NAVS.map(
      ([k, ic, l]) =>
        `<button data-a="nav" data-k="${k}" id="nav-${k}">${svgI(ic)}<span>${l}</span><i class="nb"></i></button>`,
    ).join("");
  const c = $("#cvctl");
  if (c)
    c.innerHTML = `<button data-a="pause" aria-label="Pausa">${G.paused ? "▶" : "⏸"}</button><button data-a="speed" aria-label="Velocidad">${String(G.speed).replace(".", ",")}×</button>`;
  navAct();
  updBadges();
}
export const SEC = {
  packs: "packs",
  coll: "coll",
  card: "coll",
  album: "coll",
  grading: "coll",
  tasks: "retos",
  medals: "retos",
  story: "retos",
  games: "retos",
  mg: "retos",
  hunt: "retos",
  sell: "home",
  insp: "home",
  lot: "home",
  ck: "home",
  hag: "home",
  trade: "home",
  custc: "home",
  sum: "home",
  open: "home",
};
export function navAct() {
  const sec = G.M ? SEC[G.M] || "more" : "home";
  document.querySelectorAll("#nav [data-a=nav]").forEach((b) => b.classList.toggle("act", b.dataset.k === sec));
}
export const cardTabs = (k) => {
  VIS.lastCards = k;
  if (k === "coll" && G.collF === "fav") k = "fav";
  return `<h2>🃏 Cartas</h2>${hero("alvaro", "stars", S.items.length ? `¡Nuestra colección ya vale <b>${fmt(invValue())}</b>! Y sigue creciendo.` : "¡Abre sobres y empieza <b>nuestra colección</b>!", "rosa")}<div class="tabs t4">${[
    ["coll", "Colección"],
    ["fav", "❤️ Favoritas"],
    ["album", "📒 Álbum"],
    ["grading", "🔍 Gradeo"],
  ]
    .map(
      ([x, n]) =>
        `<button class="b ${x === k ? "on" : ""}" ${x === "fav" ? 'data-a="cfav"' : x === "coll" ? 'data-a="callc"' : `data-a="m" data-k="${x}"`}>${n}</button>`,
    )
    .join("")}</div>`;
};
/** Lo que cuenta el número rojo de «Retos»: qué hay por cobrar y dónde (data-fase="I"). */
export function claimBox() {
  const mis = S.dm ? S.dm.list.filter((m) => m.done && !m.cl).length : 0,
    ord = S.orders.filter((o) => ownFor(o)).length,
    alb = S.sets.filter((s) => {
      const p = albPct(s),
        c = S.albR[s] || [];
      return ALBR.some(([t], i) => p >= t && !c.includes(i));
    });
  const l = [];
  if (mis)
    l.push(
      `<button class="b pri" data-a="goclaim" data-k="mis">✅ ${mis} ${mis > 1 ? "misiones" : "misión"} por cobrar</button>`,
    );
  if (ord)
    l.push(
      `<button class="b pri" data-a="goclaim" data-k="ord">📋 ${ord} encargo${ord > 1 ? "s" : ""} por entregar</button>`,
    );
  if (alb.length)
    l.push(
      `<button class="b pri" data-a="goclaim" data-k="alb" data-n="${alb[0]}">📒 Premio del álbum (${setName(alb[0])})</button>`,
    );
  return l.length
    ? `<div class="pn claimbox" data-fase="I"><b>🎁 Tienes premios esperando</b><div class="btns">${l.join("")}</div></div>`
    : "";
}
export const retoTabs = (k) => {
  VIS.lastReto = k;
  const cb = claimBox();
  return `<h2>🏆 Retos</h2>${hero("alberto", "laugh", cb ? "¡Tienes <b>premios por cobrar</b>, padawans! Corred a por ellos." : PAPA.tips[S.day % PAPA.tips.length], "sun")}${cb}<div class="tabs t4">${[
    ["tasks", "📋 Tareas"],
    ["medals", "🏅 Medallas"],
    ["story", "📖 Historia"],
    ["games", "🎮 Juegos"],
  ]
    .map(([x, n]) => `<button class="b ${x === k ? "on" : ""}" data-a="m" data-k="${x}">${n}</button>`)
    .join("")}</div>`;
};
