// Regalos y cambios entre cuentas (docs/nube.md): qué se puede mandar, sacarlo de la partida al mandarlo (así nadie
// lo tiene dos veces) y meterlo en la del otro al aceptar. La nube (core/cloud.js) solo guarda el trato.
// Una carta o un Funko viaja como «paquete»: { t: "card", c, k, rv, gr, n, img, r, val } o
// { t: "fk", f, va, d, p, n, val } (va = variante del Funko).
import { S } from "./state.js";
import { BYID } from "./cards/sets.js";
import { itemVal } from "./economy.js";
import { FBYID } from "./funko/catalog.js";
import { fkUVal } from "./funko/zone.js";

const r2 = (v) => Math.round(v * 100) / 100;
/** Paquete de una carta de la partida. */
export function cardPack(it) {
  const c = BYID[it.c] || {};
  return {
    t: "card",
    c: it.c,
    k: it.k,
    rv: !!it.rv,
    gr: it.gr || 0,
    n: c.name || it.c,
    img: c.img || null,
    r: c.r || "",
    val: r2(itemVal(it)),
  };
}
/** Paquete de un Funko de la zona. */
export function fkPack(u) {
  const f = FBYID[u.f] || {};
  return { t: "fk", f: u.f, va: u.v || "", d: !!u.d, p: !!u.p, n: f.name || u.f, val: r2(fkUVal(u)) };
}
/** ¿Se puede mandar esta carta? (ni falsa, ni apartada para un cliente, ni a medio gradear). */
const tradeable = (it) => !it.fkK && !it.fk && !it.res && !it.gq;
/** Cartas que se pueden mandar. sets: solo de esas colecciones (las que tiene el otro). */
export const tradeCards = (sets) =>
  (S.items || []).filter((it) => tradeable(it) && BYID[it.c] && (!sets || sets.includes(BYID[it.c].s)));
/** Funkos que se pueden mandar (no los que lleva un cliente a la caja). */
export const tradeFks = () => (S.fk && S.fk.u ? S.fk.u.filter((u) => u.at !== "h") : []);
/** ¿Encaja esta carta o Funko de la partida con el paquete? */
const sameCard = (it, p) =>
  tradeable(it) && it.c === p.c && it.k === p.k && !!it.rv === !!p.rv && (it.gr || 0) === (p.gr || 0);
const sameFk = (u, p) => u.at !== "h" && u.f === p.f && (u.v || "") === (p.va || "") && !!u.d === !!p.d;
/** ¿Tiene la partida algo que encaje con el paquete? (para aceptar un cambio). */
export const tradeHas = (p) =>
  !!p && (p.t === "fk" ? tradeFks().some((u) => sameFk(u, p)) : (S.items || []).some((it) => sameCard(it, p)));
/** ¿Puede esta partida recibir el paquete? (la colección de la carta cargada o, para un Funko, la zona Funko). */
export const tradeCanGet = (p) => !!p && (p.t === "fk" ? !!S.fk && !!FBYID[p.f] : !!BYID[p.c]);
/** Saca de la partida lo que encaje con el paquete. Devuelve true si lo había. */
export function tradeTake(p) {
  if (p.t === "fk") {
    const i = tradeFks().findIndex((u) => sameFk(u, p));
    if (i < 0) return false;
    S.fk.u.splice(S.fk.u.indexOf(tradeFks()[i]), 1);
    return true;
  }
  const i = S.items.findIndex((it) => sameCard(it, p));
  if (i < 0) return false;
  S.items.splice(i, 1);
  return true;
}
/** Mete el paquete en la partida (la carta, en el inventario; el Funko, en el almacén de la zona). */
export function tradeGive(p) {
  if (p.t === "fk") {
    if (!S.fk) return false;
    S.fk.u.push({ i: S.fk.nid++, f: p.f, v: p.va || "", d: !!p.d, p: !!p.p, at: "a", t: S.day });
    return true;
  }
  if (!BYID[p.c]) return false;
  const it = { i: S.nid++, c: p.c, k: p.k || "NM", rv: !!p.rv, cost: 0, case: null, res: false };
  if (p.gr) it.gr = p.gr;
  S.items.push(it);
  return true;
}
