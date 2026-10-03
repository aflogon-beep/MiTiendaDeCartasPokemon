// Avisos flotantes (toasts) y su registro en Avisos.
import { $, VIS } from "../render/canvas.js";
import { updBadges } from "./hud.js";
export function toast(t, o) {
  o = o || {};
  if (!o.nolog) {
    VIS.notes = VIS.notes || [];
    VIS.notes.unshift({ t, at: Date.now() });
    if (VIS.notes.length > 40) VIS.notes.length = 40;
    VIS.unread = (VIS.unread || 0) + 1;
    if (typeof updBadges === "function") updBadges();
  }
  const e = $("#toast");
  if (!e) return;
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = t + (o.undo ? ' <button class="undo" data-a="undo">Deshacer</button>' : "");
  if (o.undo) d.style.pointerEvents = "auto";
  e.appendChild(d);
  while (e.children.length > 2) e.firstChild.remove();
  setTimeout(() => d.remove(), o.undo ? 7000 : 2600);
}

/* Avisos de la partida mientras se ve el título (docs/pendientes.md §4): no salen encima del título; se
 * guardan y se enseñan al entrar en la partida. Los de una partida concreta solo si se entra en esa
 * misma (misma ranura y no una partida nueva); los generales (keep), siempre. */
let held = [];
export function holdToast(t, o, slot) {
  held.push({ t, o: o || {}, slot });
}
/** Al empezar una partida nueva: los avisos de la partida de fondo ya no sirven. */
export function dropHeldToasts() {
  held = held.filter((h) => h.o.keep);
}
export function flushToasts(slot) {
  const l = held.filter((h) => h.o.keep || h.slot === slot);
  held = [];
  l.forEach((h, i) => setTimeout(() => toast(h.t, h.o), 600 + i * 900));
}
