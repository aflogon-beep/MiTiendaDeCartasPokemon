// Monta una partida nueva en Node con las cartas de la API simulada (sin navegador).
import { FIX_SETS, FIX_CARDS } from "../fixtures/api.js";
import { mkSetDef, mapCard, setCards, indexCards, SETDEF } from "../../src/core/cards/sets.js";
import { G, newState, S } from "../../src/core/state.js";

if (!globalThis.localStorage) {
  const LS = {};
  const hide = (k, v) => Object.defineProperty(LS, k, { value: v, writable: true, enumerable: false });
  hide("getItem", (k) => (Object.hasOwn(LS, k) ? LS[k] : null));
  hide("setItem", (k, v) => (LS[k] = String(v)));
  hide("removeItem", (k) => delete LS[k]);
  globalThis.localStorage = LS;
}

export function nuevaPartida(opts = {}) {
  FIX_SETS.forEach(mkSetDef);
  const cards = [];
  for (const id of ["sv3pt5", "sv8pt5", "sv3"]) {
    const sd = SETDEF.find((d) => d.api === id);
    cards.push(...FIX_CARDS[id].map((d) => mapCard(d, sd)));
  }
  setCards(cards);
  indexCards();
  G.MODE = "real";
  newState();
  S.tut.on = false;
  Object.assign(S, opts);
  return S;
}
