// Funda de plástico (slab) para las cartas gradeadas, como en la vida real: marco transparente con
// brillo y etiqueta roja con la nota. Es una capa encima de la carta (no cambia la carta de debajo).
import { GTXT } from "../core/constants.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Número de certificado de la funda: siempre el mismo para cada carta (sale de su id). */
export function certOf(it) {
  const n = String(10000000 + ((it.i * 7919 + 4031) % 89999999));
  return n.slice(0, 4) + " " + n.slice(4);
}

/** Capa de funda para una carta gradeada. big: la de la ficha de la carta (con el nombre en la etiqueta). */
export function slabOver(gr, name, big) {
  if (!gr) return "";
  return `<div class="slabm g${gr}${big ? " big" : ""}" data-fase="I" aria-hidden="true"><div class="slabm-lb">${big ? `<span>${esc(name)}</span>` : "<span>PGS</span>"}<b>${gr}</b>${big ? `<i>${GTXT[gr] || ""}</i>` : ""}</div></div>`; // en miniatura, la palabra no cabe junto al precio
}
