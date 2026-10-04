// Zona Funko · clientes (docs/funkos/DISENO.md §8): quién va a la zona, qué se lleva y cuánto paga.
//   niño: 1 común (a veces 2), y quizá una partida a la máquina de gancho · fan: 1–3 de su colección
//   coleccionista: mira primero la vitrina (Chase, especiales, exclusivas, descatalogadas) · regalo: 2–3 de lo que sea
// Las unidades que lleva a la caja quedan «en la mano» (at "h", con su sitio de antes en u.from).
import { S } from "../state.js";
import { r05 } from "../util.js";
import { ui } from "../bus.js";
import { FBYID, FKCOL } from "./catalog.js";
import { fkEventToday, fkPrice, fkUVal, fkLv } from "./zone.js";

/** ¿Hay algo a la venta en la zona? */
export const fkOnSale = () => !!S.fk && !!S.fk.u && S.fk.u.some((u) => u.at === "s" || u.at === "v");
/** Probabilidad de que un comprador vaya a la zona (con muebles y en días de evento, más). */
export function fkShare() {
  if (!fkOnSale()) return 0;
  const M = S.fk.mob || {},
    ev = fkEventToday() || (S.fk.ev && S.fk.ev.day === S.day - 1) ? 0.15 : 0;
  return Math.min(0.6, 0.32 * (1 + (M.falcon ? 0.08 : 0) + (M.rug ? 0.06 : 0)) + ev);
}
/** Sitio de la zona al que va (delante de la estantería, de la isla o de la vitrina). */
export function fkSpot(R = Math.random) {
  const vit = S.fk.u.some((u) => u.at === "v"),
    k = R();
  if (vit && k < 0.25) return { x: 1020, y: 150 + R() * 220 };
  if (k < 0.6) return { x: 830 + R() * 200, y: 112 + R() * 8 };
  return { x: 900 + R() * 70, y: 292 + R() * 8 };
}

const fan = (c) => (c.fkfan = c.fkfan || pickCol());
function pickCol() {
  const cols = [
    ...new Set(S.fk.u.filter((u) => u.at === "s" || u.at === "v").map((u) => FBYID[u.f] && FBYID[u.f].c)),
  ].filter(Boolean);
  return cols.length ? cols[Math.floor(Math.random() * cols.length)] : null;
}
/** Precio que acepta por una unidad (su valor, con su tipo, los muebles y un poco de azar). */
function okPrice(u, c, m, tol) {
  const f = FBYID[u.f],
    M = S.fk.mob || {},
    k = m * tol * (f && f.c === "mv" && M.iron ? 1.06 : 1) * (c.fkgift ? 1.15 : 1) * (0.98 + Math.random() * 0.2);
  return fkPrice(u) <= r05(fkUVal(u) * 1.12 * k);
}

/**
 * El cliente llega a la zona y elige. Devuelve { units, total } si se lleva algo, o el motivo si no
 * ("caro" o "nada"). m: lo que acepta pagar su tipo; tol: tolerancia de la tienda (decoración).
 */
export function fkPick(c, m, tol, R = Math.random) {
  const F = S.fk,
    M = F.mob || {},
    col = fan(c),
    avail = F.u.filter(
      (u) => u.at === "s" || ((c.type === "investor" || c.type === "whale" || c.type === "collector") && u.at === "v"),
    );
  if (!avail.length) return { why: "nada" };
  c.fkgift = c.fkgift == null ? R() < 0.15 : c.fkgift;
  let want =
    c.type === "kid"
      ? 1 + (R() < 0.35 ? 1 : 0)
      : c.fkgift
        ? 2 + Math.floor(R() * 2)
        : c.type === "whale"
          ? 2 + Math.floor(R() * 3)
          : 1 + Math.floor(R() * 3);
  if ((col === "sw" && M.vader) || (col === "hp" && M.hogw)) want += R() < 0.5 ? 1 : 0;
  // Orden de preferencia: coleccionistas, lo de vitrina y lo de su colección; niños, lo barato
  const score = (u) => {
    const f = FBYID[u.f];
    let s = R();
    if (c.type === "kid") s += -fkPrice(u) / 20;
    else if (c.type === "investor" || c.type === "whale") s += (u.at === "v" ? 2 : 0) + (u.v ? 1 : 0);
    if (!c.fkgift && f && f.c === col) s += 1.5;
    return s;
  };
  const sorted = avail.sort((a, b) => score(b) - score(a)),
    got = [];
  let caro = false;
  for (const u of sorted) {
    if (got.length >= want) break;
    if (c.type === "kid" && fkPrice(u) > 30) continue;
    if (!c.fkgift && c.type !== "kid" && R() < 0.15) continue; // no todo le gusta
    if (!okPrice(u, c, m, tol)) {
      caro = true;
      continue;
    }
    got.push(u);
  }
  if (!got.length) return { why: caro ? "caro" : "nada" };
  got.forEach((u) => ((u.from = u.at), (u.at = "h")));
  return { units: got, total: r05(got.reduce((a, u) => a + fkPrice(u), 0)) };
}
/** Devuelve a su sitio lo que llevaba (si se va sin pagar). */
export function fkPutBack(units) {
  (units || []).forEach((u) => {
    u.at = u.from || "s";
    delete u.from;
  });
}

/** Máquina de gancho: un niño en la zona juega (1–3 €) y, a veces, se lleva un Funko común del almacén. */
export function fkClaw(c, R = Math.random) {
  const F = S.fk;
  if (!F || !F.mob.claw || c.type !== "kid" || R() > 0.45) return 0;
  const n = 1 + Math.floor(R() * 3);
  S.money += n;
  S.stats.inc += n;
  F.st.claw += n;
  F.st.clawN += n;
  if (R() < 0.06) {
    const u = F.u.find((x) => x.at === "a" && !x.v);
    if (u) {
      F.u.splice(F.u.indexOf(u), 1);
      ui.toast(`🕹️ ¡Un niño ha sacado un ${FBYID[u.f].name} de la máquina de gancho!`);
    }
  }
  return n;
}
/** Cliente torpe: si no compra nada, a veces golpea una caja de la estantería sin protector. */
export function fkClumsy(R = Math.random) {
  if (R() > 0.04) return null;
  const l = S.fk.u.filter((u) => u.at === "s" && !u.p && !u.d);
  if (!l.length) return null;
  const u = l[Math.floor(R() * l.length)];
  u.d = 1;
  return u;
}

/* ---------- Clientes que vienen a vender un Funko ---------- */
/** Lo que trae: a menudo descatalogado o una Chase; pide entre el 60 % y el 95 % de su valor. */
export function fkMakeDeal(R = Math.random) {
  const F = S.fk;
  if (!F || fkLv() < 1) return null;
  const pool = Object.keys(F.mk).filter((id) => FBYID[id] && !FBYID[id].grail && !FBYID[id].gold);
  if (!pool.length) return null;
  const fid = pool[Math.floor(R() * pool.length)],
    v = R() < 0.18 ? "chase" : "",
    d = R() < 0.15 ? 1 : 0,
    u = { f: fid, v, d, t: S.day, at: "a" },
    val = fkUVal(u);
  return { f: fid, v, d, val, ask: r05(val * (0.6 + R() * 0.35)) };
}
/** Comprarle el Funko (va al almacén). */
export function fkBuyDeal(D) {
  if (!D || S.money < D.ask) return false;
  const F = S.fk;
  S.money -= D.ask;
  F.u.push({ i: F.nid++, f: D.f, v: D.v, d: D.d, p: 0, at: "a", t: S.day });
  return true;
}
export const fkColName = (c) => (FKCOL[c] || {}).n || "";
