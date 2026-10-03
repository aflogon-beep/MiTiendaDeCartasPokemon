// Pantalla Cartas: colección, filtros, búsqueda y orden.
import { trend } from "../../core/alerts.js";
import { slabOver } from "../slab.js";
import { BYID, setName } from "../../core/cards/sets.js";
import { G, S } from "../../core/state.js";
import { VIS } from "../../render/canvas.js";
import { cardTabs } from "../nav.js";
import { caseItems, gk, invValue, itemVal } from "../../core/economy.js";
import { cls, face } from "../modals.js";
import { fmt } from "../../core/util.js";
export function groups() {
  const g = {};
  S.items.forEach((it) => {
    const k = gk(it);
    (g[k] = g[k] || { key: k, c: BYID[it.c], k: it.k, rv: it.rv, its: [] }).its.push(it);
  });
  return Object.values(g).sort((a, b) => itemVal(b.its[0]) * b.its.length - itemVal(a.its[0]) * a.its.length);
}
export const RORD2 = ["HR", "SIR", "UR", "IR", "DR", "R", "U", "C"];
export function collList() {
  let g = groups();
  if (G.collF === "case") g = g.filter((x) => x.its.some((i) => i.case != null));
  if (G.collF === "top") g = g.filter((x) => itemVal(x.its[0]) >= 1);
  if (G.collF === "fav") g = g.filter((x) => x.its[0].fav);
  const q = G.collQ.trim().toLowerCase();
  if (q) g = g.filter((x) => x.c.name.toLowerCase().includes(q) || setName(x.c.s).toLowerCase().includes(q));
  if (G.cSort === "rar")
    g.sort((a, b) => RORD2.indexOf(a.c.r) - RORD2.indexOf(b.c.r) || itemVal(b.its[0]) - itemVal(a.its[0]));
  else if (G.cSort === "new") g.sort((a, b) => Math.max(...b.its.map((i) => i.i)) - Math.max(...a.its.map((i) => i.i)));
  else if (G.cSort === "name") g.sort((a, b) => a.c.name.localeCompare(b.c.name));
  return g;
}
/** Flecha con el cambio de precio de la semana (si se mueve un 5 % o más). */
function trendTag(id) {
  const t = trend(id, 7);
  if (Math.abs(t) < 0.05) return "";
  return `<div class="trend ${t > 0 ? "up" : "down"}" data-fase="I">${t > 0 ? "↑" : "↓"}${Math.round(Math.abs(t) * 100)} %</div>`;
}
export function tileHTML(x) {
  const u = itemVal(x.its[0]),
    cis = x.its.filter((i) => i.case != null && !i.lux),
    inc = cis.length;
  return `<div class="tile${inc ? " incase" : ""}" data-a="sel" data-k="${x.key}">${face(x.c, x.rv)}${slabOver(x.its[0].gr)}<div class="pt">${fmt(u)}</div>${trendTag(x.c.id)}${x.its.length > 1 ? `<div class="qt">×${x.its.length}</div>` : ""}${inc ? `<div class="vt">🏷️ EN VITRINA${inc > 1 ? " ×" + inc : ""}<b>${fmt(u * cis[0].case)}</b></div>` : ""}${x.its[0].gr ? `<div class="gb">PGS ${x.its[0].gr}</div>` : ""}${x.its[0].gq ? '<div class="vt" style="background:#3f7fc4">📮 EN GRADEO</div>' : ""}${x.its[0].fav ? '<div class="fvb">❤️</div>' : ""}${x.its[0].fkK ? '<div class="gb" style="background:#c0392b;color:#fff">FALSA</div>' : ""}${x.its.some((i) => i.lux) ? '<div class="qt" style="background:#c9a227;left:auto;right:4px;top:26px">💎</div>' : ""}</div>`;
}
export function collGrid() {
  const g = collList();
  VIS.cList = g.map((x) => x.key);
  if (!g.length)
    return `<p class="mu">${S.items.length ? "Nada con este filtro." : "No hay cartas todavía. Abre sobres o compra cartas a los clientes."}</p>`;
  return `<div class="tiles">${g.slice(0, 150).map(tileHTML).join("")}</div>${g.length > 150 ? `<p class="mu">Mostrando 150 de ${g.length}. Usa el buscador.</p>` : ""}`;
}
export function mColl() {
  const tv = invValue(),
    tc = S.items.reduce((a, i) => a + i.cost, 0);
  return (
    cardTabs("coll") +
    (G.collF === "fav" ? favBanner() : "") +
    `<div class="row"><span>${S.items.length} cartas · valor <b>${fmt(tv)}</b></span><span class="${cls(tv - tc)}">P/L ${tv >= tc ? "+" : ""}${fmt(tv - tc)}</span></div>
  <input class="inp" data-i="csearch" placeholder="🔎 Buscar carta o colección…" value="${G.collQ.replace(/"/g, "")}" style="margin:8px 0">
  <div class="chips">${[
    ["all", "Todas"],
    ["top", "Valiosas"],
    ["case", `🏷️ Vitrina (${caseItems().length})`],
    ["fav", `❤️ Favoritas (${S.items.filter((i) => i.fav).length})`],
  ]
    .map(([k, n]) => `<button class="b ${G.collF === k ? "on" : ""}" data-a="filt" data-k="${k}">${n}</button>`)
    .join("")}</div>
  <div class="chips"><span class="mu" style="align-self:center">Ordenar:</span>${[
    ["val", "💰 Valor"],
    ["rar", "⭐ Rareza"],
    ["new", "🆕 Nuevas"],
    ["name", "🔤 Nombre"],
  ]
    .map(([k, n]) => `<button class="b ${G.cSort === k ? "on" : ""}" data-a="csort" data-k="${k}">${n}</button>`)
    .join("")}</div>
  <div id="cgrid">${collGrid()}</div><p class="mu">Toca una carta para ver sus opciones.</p>`
  );
}
export function favBanner() {
  return `<div class="pn favhd"><b>❤️ Tu colección personal</b><div class="mu">Aquí guardas tus cartas favoritas. Están protegidas: no se venden, no van a la vitrina y no se usan en intercambios ni encargos.</div></div>`;
}
