// Estado de la partida.
// S: objeto con identidad estable. Para cargar o empezar una partida se usa replaceState(obj),
// que lo vacía y copia el nuevo; nunca S = …  hasState() dice si ya hay partida (antes S era null).
// G: variables sueltas del juego que se reasignan (modo de cartas, nota del HUD…).
import { SETDEF, BYS } from "./cards/sets.js";
import { ui } from "./bus.js";
import { BYID, CARDS } from "./cards/sets.js";
import { DEFAULT_SETS } from "./constants.js";
import { genMissions } from "./missions.js";
import { genOrder } from "./orders.js";
import { initPrice } from "./cards/prices.js";
import { r05 } from "./util.js";
import { refreshPacks } from "./packs.js";

export const S = {};
let loaded = false;
export const hasState = () => loaded;
export function replaceState(o) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, o);
  loaded = true;
}

export const G = {
  MODE: "offline", // "real" con cartas de la API; "offline" con cartas ilustradas
  SLOT: 1, // ranura de partida activa (1-3, ver core/slots.js)
  TITLE: false, // en la pantalla de título: la partida de fondo es decorado y no se guarda
  NOTE: "", // aviso del estado de las cartas que se añade a la pista del HUD
  M: null, // panel abierto ("packs", "coll", "ck"…) o null; con un panel abierto el juego se para
  MG: null, // minijuego en curso
  spawnT: 3, // segundos hasta que entre el siguiente cliente
  deal: null, // trato con un cliente que quiere vendernos una carta
  TOF: null, // oferta de un cliente por uno de nuestros trofeos
  LOT: null, // lote misterioso que se está negociando
  paused: false, // pausa del jugador
  speed: 1, // velocidad del juego (1×, 2×, 4×)
  SOUND: (() => {
    try {
      return localStorage.getItem("pcs-sound") !== "0";
    } catch (e) {
      return true;
    }
  })(), // sonido activado
  BGk: -1, // clave del fondo de la tienda ya dibujado (-1 = rehacer)
  CITYk: "", // clave de la ciudad ya dibujada ("" = rehacer)
  // Estado de las pantallas (lo cambian las acciones de la interfaz)
  openState: null, // apertura de sobres en curso
  collSel: null, // grupo de cartas seleccionado en Cartas
  collF: "all", // filtro de Cartas
  collQ: "", // búsqueda en Cartas
  cSort: "val", // orden de Cartas
  pTab: "packs", // pestaña de Stock
  pF: "all", // filtro de Stock
  tTab: "ord", // pestaña de Tareas
  albS: null, // set abierto en el Álbum
  albPg: 0, // página del Álbum
  setQ: "", // búsqueda en Colecciones
  CK: null, // cobro en caja (efectivo o TPV)
  HG: null, // regateo en curso
  INSP: null, // inspección de una carta (falsas)
  TRD: null, // intercambio propuesto por un habitual
  BOXO: null, // apertura de caja o producto sellado
  CUSTC: null, // cliente cuya ficha se está viendo
};

export let SETS = [];
export const slotCount = () => 3 + 3 * S.up.shelf + (S.annex ? 2 : 0);
export function syncSets() {
  SETS = S.sets.map((id) => SETDEF.find((d) => d.id === id)).filter((d) => d && BYS[d.id]);
}
export function assignSlots() {
  const n = slotCount();
  S.slots = (S.slots || []).slice(0, n);
  while (S.slots.length < n) S.slots.push(null);
  SETS.forEach((sd) => {
    if (S.sealed[sd.id] > 0 && !S.slots.includes(sd.id)) {
      const i = S.slots.indexOf(null);
      if (i >= 0) S.slots[i] = sd.id;
    }
  });
}
export function ensure() {
  if (!S.dex) {
    S.dex = {};
    S.items.forEach((i) => (S.dex[i.c] = 1));
  }
  if (!S.sets) S.sets = DEFAULT_SETS.slice();
  if (!S.up.shelf) S.up.shelf = 0;
  syncSets();
  CARDS.forEach((c) => {
    if (!S.prices[c.id]) S.prices[c.id] = initPrice(c);
  });
  if (S.orph && S.orph.length) {
    S.items = S.items.concat(S.orph.filter((i) => BYID[i.c]));
    S.orph = S.orph.filter((i) => !BYID[i.c]);
  }
  {
    const o = S.items.filter((i) => !BYID[i.c]);
    if (o.length) {
      S.orph = (S.orph || []).concat(o);
      S.items = S.items.filter((i) => BYID[i.c]);
    }
  }
  if (!S.staff) S.staff = { cashier: !!(S.up && S.up.cashier), appraiser: false, cm: false };
  S.decor = S.decor || {};
  S.prod = S.prod || {};
  S.pp = S.pp || {};
  S.regs = S.regs || {};
  S.fkRet = S.fkRet || [];
  S.repB = S.repB || 0;
  S.lt = S.lt || {};
  S.ach = S.ach || {};
  S.albR = S.albR || {};
  S.orders = S.orders || [];
  S.grNew = S.grNew || [];
  if (!S.tut) S.tut = { on: S.day <= 1 && !S.items.length && !Object.values(S.sealed || {}).some((v) => v > 0), i: 0 };
  if (S.ev === undefined) S.ev = null;
  if (!S.tour) S.tour = false;
  SETS.forEach((sd) => {
    const s = sd.id;
    if (S.sealed[s] == null) S.sealed[s] = 0;
    if (!S.pack[s]) S.pack[s] = { w: sd.dp, ref: sd.dp * 1.3 };
    if (S.shelf[s] == null) S.shelf[s] = r05(S.pack[s].ref);
  });
  refreshPacks(true);
  assignSlots();
  if (!S.fix14) {
    S.fix14 = 1;
    let n = 0;
    SETS.forEach((sd) => {
      const k = sd.id;
      if (S.pack[k] && S.shelf[k] > S.pack[k].ref * 1.08) {
        S.shelf[k] = r05(S.pack[k].ref * 0.94);
        n++;
      }
    });
    if (n)
      setTimeout(
        () =>
          ui.toast(
            `🎯 He bajado el precio de ${n} set(s) de sobres que estaban por encima de lo que pagan los clientes`,
          ),
        1500,
      );
  }
  S.orders = S.orders.filter((o) => BYID[o.c]);
  if (!S.orders.length && S.day <= 1) genOrder();
  if (!S.dm || S.dm.day !== S.day) genMissions();
}
export function newState() {
  replaceState({
    tut: { on: true, i: 0 },
    money: 1000,
    day: 1,
    sales: 0,
    nid: 1,
    items: [],
    sealed: {},
    shelf: {},
    pack: {},
    prices: {},
    up: { cashier: 0, ads: 0, case: 0, shelf: 0 },
    sets: DEFAULT_SETS.slice(),
    log: [],
    phase: "closed",
    clock: 0,
    stats: { inc: 0, cust: 0, lost: 0, bought: 0 },
  });
  ensure();
}
export const meCfg = () => Object.assign({ shirt: "#e3350d", hair: "#222", cap: "#e3350d", hs: 0 }, S.me || {});
export const shopName = () => (S.shopName || "").trim() || "Poké Cards";
