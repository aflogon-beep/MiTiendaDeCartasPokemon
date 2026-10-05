// Alertas: Emma avisa si una carta tuya sube mucho en una semana (buen momento para venderla) y recuerda
// guardar una copia de la partida si hace una semana que no se guarda ninguna.
import { S } from "./state.js";
import { price } from "./economy.js";
import { cloudLastAt, cloudUser } from "./cloud.js";

/** Cambio de precio de una carta en los últimos d días (0,2 = +20 %). */
export function trend(id, d) {
  const p = S.prices && S.prices[id];
  if (!p || !p.h || p.h.length < 2) return 0;
  const h = p.h;
  return h[h.length - 1] / h[Math.max(0, h.length - 1 - d)] - 1;
}

export const RISE = 0.2, // +20 % en 7 días
  MIN_VAL = 2; // solo cartas de al menos 2 €

/** Una vez al día: la carta tuya que más ha subido esta semana ({ id, pct }), si alguna merece aviso.
 * No repite una carta avisada hace menos de 7 días. */
export function priceAlert() {
  if (S.palertDay === S.day) return null;
  S.palertDay = S.day;
  S.palert = S.palert || {};
  let best = null;
  const seen = new Set();
  for (const it of S.items) {
    if (it.fk || it.fkK || it.gq || seen.has(it.c)) continue;
    seen.add(it.c);
    if (!S.prices[it.c] || price(it.c) < MIN_VAL || S.palert[it.c] > S.day - 7) continue;
    const t = trend(it.c, 7);
    if (t >= RISE && (!best || t > best.t)) best = { id: it.c, t };
  }
  if (!best) return null;
  S.palert[best.id] = S.day;
  return { id: best.id, pct: Math.round(best.t * 100) };
}

const WEEK = 7 * 24 * 3600 * 1000;
/** ¿Toca recordar la copia? (7 días reales sin exportar, compartir ni copiar el código). now: Date.now(). */
export function backupDue(now) {
  if (!S.bkpAt) S.bkpAt = now; // partidas de antes: se empieza a contar ahora
  if (cloudUser() && now - cloudLastAt() < WEEK) return false; // con la nube al día no hace falta (docs/nube.md)
  return now - S.bkpAt >= WEEK && !(S.bkpSnooze > now);
}
export const backupDone = (now) => ((S.bkpAt = now), (S.bkpSnooze = 0));
export const backupLater = (now) => (S.bkpSnooze = now + 2 * 24 * 3600 * 1000);
