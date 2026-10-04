// Sobre imitado (pedido por Alberto): no tenemos la foto del sobre de verdad, pero se monta uno muy parecido
// con piezas reales de cada colección: bordes dentados de plástico sellado, brillo metalizado, el color de la
// colección, su logo oficial (pokemontcg.io) y la ilustración de su carta estrella (recortada de la carta real).
import { CARDS } from "../core/cards/sets.js";
import { S } from "../core/state.js";

const STAR = {};
/** La carta estrella de la colección: la más valiosa que tenga imagen (como el Pokémon de la portada). */
export function starCard(sid) {
  if (STAR[sid] !== undefined && STAR[sid] !== null) return STAR[sid];
  let best = null,
    bv = -1;
  for (const c of CARDS) {
    if (c.s !== sid || !c.img) continue;
    const v = (S.prices && S.prices[c.id] && S.prices[c.id].p) || c.b || 0;
    if (v > bv) ((bv = v), (best = c));
  }
  return (STAR[sid] = best);
}
const esc = (t) =>
  String(t || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** HTML del sobre. sd: la colección (SETDEF). cls: clase extra para el tamaño. */
export function packArt(sd, cls = "") {
  const c = starCard(sd.id),
    logo = sd.logo
      ? `<img src="${sd.logo}" alt="${esc(sd.n)}" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:this.alt}))">`
      : `<b>${esc(sd.n)}</b>`;
  return `<div class="bpack ${cls}" style="--sc:${sd.col || "#556"}"><i class="bp-cr bp-top"></i><div class="bp-brand">POKÉMON</div><div class="bp-logo">${logo}</div><div class="bp-art"${c ? ` style="background-image:url('${c.img}')"` : ""}></div><i class="bp-cr bp-bot"></i><i class="bp-foil"></i></div>`;
}
