// Lista de deseos: cartas que quieres para el álbum (S.wish: ids de carta). Emma avisa si un cliente trae
// una (ui.wishSeen) y, al conseguirla, sale de la lista con un aviso.
import { ui } from "./bus.js";
import { S } from "./state.js";
import { BYID } from "./cards/sets.js";

export const isWish = (id) => !!(S.wish && S.wish.includes(id));
/** Añade o quita una carta de la lista de deseos. Devuelve true si queda en la lista. */
export function wishSet(id, on) {
  S.wish = (S.wish || []).filter((x) => x !== id);
  if (on) S.wish.push(id);
  return on;
}
/** Una carta nueva en la colección: si estaba en la lista de deseos, sale de ella con un aviso. */
export function wishGot(id) {
  if (!isWish(id)) return;
  wishSet(id, false);
  const c = BYID[id];
  ui.toast(`⭐ ¡${c ? c.name : "Carta"}! Era de tu lista de deseos`);
}
/** Un cliente trae una carta de la lista de deseos (k: "sell" | "trade"). */
export function wishCheck(id, k) {
  if (isWish(id)) ui.wishSeen(id, k);
}
