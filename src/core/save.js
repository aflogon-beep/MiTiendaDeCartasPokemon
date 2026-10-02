// Guardado en localStorage (claves pcs-save-real-v3 / pcs-save-offline-v3, con «-s2»/«-s3» en las
// ranuras 2 y 3: ver slots.js) y exportación {app,v,mode,date,S}.
import { emit } from "./bus.js";
import { S, G, hasState } from "./state.js";
import { ensure, newState, replaceState } from "./state.js";
import { slotKey, useSlot } from "./slots.js";

export const skey = () => slotKey(G.SLOT);
export const save = () => saveNow();
export function saveNow() {
  if (!hasState()) return false;
  S.savedAt = Date.now();
  const js = JSON.stringify(S);
  try {
    localStorage.setItem(skey(), js);
    return true;
  } catch (e) {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("pcs-set"))
        .forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(skey(), js);
      return true;
    } catch (e2) {
      emit("toast", "⚠️ No se pudo guardar. Exporta una copia en Más → Partida");
      return false;
    }
  }
}
export const exportStr = () => JSON.stringify({ app: "pcs", v: 5, mode: G.MODE, date: new Date().toISOString(), S });
export function loadOrNew() {
  try {
    const r = localStorage.getItem(skey()) || (G.SLOT === 1 ? localStorage.getItem(skey().replace("v3", "v2")) : null);
    if (r) {
      replaceState(JSON.parse(r));
      S.phase = "closed";
      S.clock = 0;
      ensure();
      return;
    }
  } catch (e) {}
  newState();
}

/**
 * Cambia de ranura: guarda la partida actual en la suya, elige la nueva y la carga (o empieza una nueva
 * si está vacía). Siempre en este orden, para que nunca se guarde una partida en la ranura de otra.
 * Quien la llama se encarga de limpiar el mundo (clientes, cola) y repintar, como al importar.
 */
export function openSlot(n) {
  if (hasState()) saveNow();
  useSlot(n);
  loadOrNew();
}
