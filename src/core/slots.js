// Ranuras de partida (3). Cada ranura es una partida completa con su propia clave de localStorage.
// La ranura 1 usa la clave de siempre (pcs-save-real-v3 / pcs-save-offline-v3): así la partida que ya
// existía ES la ranura 1, sin mover ni copiar nada (migración sin riesgo, y las versiones anteriores
// la siguen leyendo). Las ranuras 2 y 3 añaden «-s2» y «-s3».
// El índice (pcs-slots-v1) solo recuerda la última ranura usada; los datos de cada ficha se leen
// de la propia partida, así nunca pueden quedar desfasados.
import { G } from "./state.js";
import { DIFFS } from "./constants.js";

export const SLOTS = 3;
export const SLOTS_KEY = "pcs-slots-v1";

export const slotKey = (n, mode = G.MODE) => `pcs-save-${mode}-v3${n > 1 ? "-s" + n : ""}`;

const valid = (n) => Number.isInteger(n) && n >= 1 && n <= SLOTS;

function readIndex() {
  try {
    const o = JSON.parse(localStorage.getItem(SLOTS_KEY));
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}

/** Ranura usada la última vez (1 si nunca se ha elegido ninguna: la partida de siempre). */
export function lastSlot() {
  const n = readIndex().last;
  return valid(n) ? n : 1;
}

/**
 * Elige la ranura con la que se guarda a partir de ahora y la recuerda para «Continuar».
 * Solo antes de cargar una partida: con una partida en marcha se usa openSlot (save.js), que guarda
 * la actual en su ranura antes de cambiar.
 */
export function useSlot(n) {
  if (!valid(n)) throw new Error("ranura no válida: " + n);
  G.SLOT = n;
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify({ ...readIndex(), last: n }));
  } catch (e) {}
}

/** Ficha de una ranura: nombre de la tienda, día, dinero, dificultad y fecha del último guardado. */
export function slotInfo(n, mode = G.MODE) {
  let s = null;
  try {
    // La ranura 1 también lee la clave v2, igual que la carga de siempre (loadOrNew)
    const raw =
      localStorage.getItem(slotKey(n, mode)) ||
      (n === 1 ? localStorage.getItem(slotKey(1, mode).replace("v3", "v2")) : null);
    s = raw && JSON.parse(raw);
  } catch (e) {}
  if (!s || typeof s !== "object" || typeof s.money !== "number") return { n, empty: true };
  return {
    n,
    empty: false,
    name: (s.shopName || "").trim() || "Poké Cards",
    day: s.day,
    money: s.money,
    diff: (DIFFS[s.diff || "normal"] || DIFFS.normal).n,
    savedAt: s.savedAt || null,
  };
}

export const listSlots = (mode = G.MODE) => Array.from({ length: SLOTS }, (_, i) => slotInfo(i + 1, mode));

/** ¿Hay alguna partida guardada? (para enseñar «Continuar» en el título) */
export const hasAnySlot = (mode = G.MODE) => listSlots(mode).some((s) => !s.empty);

/** Borra la partida de una ranura (la normal y la «sin conexión», que es la partida aparte de esa ranura). */
export function deleteSlot(n) {
  if (!valid(n)) throw new Error("ranura no válida: " + n);
  for (const mode of ["real", "offline"]) {
    localStorage.removeItem(slotKey(n, mode));
    if (n === 1) localStorage.removeItem(slotKey(1, mode).replace("v3", "v2"));
  }
}
