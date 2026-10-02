// Frases recurrentes de Emma y Álvaro, y visitas de papá (docs/intro/HISTORIA.md → «Frases para el
// resto del juego»). Aquí solo la lógica: qué frase toca y cuándo; el bocadillo lo pinta ui/quips.js.
import { S, hasState } from "./state.js";

// [quién, expresión, texto]
export const QUIPS = {
  packs: ["emma", "angry", "¡ÁLVARO! ¡Eso era para VENDER!"],
  bigday: ["emma", "stars", "Esto ya huele a Sephora…"],
  empty: ["emma", "sweat", "Si no hay clientes, yo vuelvo al sofá."],
  fake: ["emma", "laugh", "Ja. Ni que fuera tonta."],
  rival: ["emma", "angry", "¿Más baratos que nosotros? Eso lo arreglo yo con la calculadora."],
  rare: ["alvaro", "stars", "¡LA FUERZA ES INTENSA EN ESTE SOBRE!"],
  gengar: ["alvaro", "stars", "¡GENGAAAAR! ¡Este no se vende! ❤️"],
  thief: ["alvaro", "wow", "¡Al ladrón! ¡Que alguien active el escudo deflector!"],
};

// Cada cuánto puede repetirse: "day" = una vez por día de juego; número = segundos reales
const EVERY = { packs: "day", bigday: "day", empty: "day", rival: 3, fake: 45, rare: 60, gengar: 20, thief: 30 };
export const QUIP_GAP = 12; // segundos reales mínimos entre dos frases cualesquiera

export const PAPA = {
  tips: [
    "Consejo del maestro: compra cartas a menos del 75 % de su valor. Y haz sentadillas.",
    "Si la tienda de enfrente baja precios, no te asustes. Un rockero nunca se rinde. ♪",
    "Cuidaos del lado oscuro… de los sobres sin precio.",
  ],
  bye: "Me voy, que llego tarde a pecho y bíceps.",
  level: "¡Mis padawans ya son maestros! Me voy a celebrarlo… haciendo burpees.",
  rival: "Si la tienda de enfrente baja precios, no te asustes. Un rockero nunca se rinde. ♪",
};
export const PAPA_EVERY = 3; // días de juego entre visitas normales (como mucho)

const mem = { last: -Infinity, at: {} }; // tiempos reales (no se guardan)

/**
 * ¿Puede decirse ahora esta frase? Si sí, la apunta como dicha y la devuelve. now: segundos reales.
 * Las de «una vez al día» o «cada N días» se guardan en la partida (S.quip) para no repetirlas al recargar.
 */
export function takeQuip(k, now) {
  if (!hasState() || !QUIPS[k]) return null;
  const ev = EVERY[k],
    q = S.quip || (S.quip = {});
  if (now - mem.last < QUIP_GAP) return null;
  if (ev === "day" && q[k] === S.day) return null;
  if (k === "rival" && q[k] != null && S.day - q[k] < ev) return null;
  if (typeof ev === "number" && k !== "rival" && mem.at[k] != null && now - mem.at[k] < ev) return null;
  mem.last = now;
  mem.at[k] = now;
  if (ev === "day" || k === "rival") q[k] = S.day;
  return QUIPS[k];
}
export const resetQuips = () => ((mem.last = -Infinity), (mem.at = {}));

/** ¿Hay una carta que merezca reacción de Álvaro? Gengar antes que una rara. */
export function pullQuip(cards) {
  if (cards.some((c) => /gengar/i.test(c.name))) return "gengar";
  if (cards.some((c) => ["UR", "SIR", "HR"].includes(c.r))) return "rare";
  return null;
}

/** Estado de las visitas de papá (se guarda en la partida). lv: nivel conocido, para notar la subida. */
export function papaState(lv) {
  if (!S.papa) S.papa = { last: S.day, lv, rival: 0 };
  if (S.papa.lv == null) S.papa.lv = lv;
  return S.papa;
}

/**
 * ¿Toca visita de papá? Devuelve el motivo ("level", "rival", "tip") o null.
 * - Al subir de nivel o cuando abre la tienda rival, en cuanto se pueda.
 * - Si no, como mucho una vez cada 3 días, y solo con la tienda abierta (al azar dentro del día).
 * Se comprueba una vez por segundo de juego; rnd: número al azar 0-1 (se pasa para poder probarlo).
 */
export function papaDue(lv, rnd) {
  if (!hasState()) return null;
  const P = papaState(lv);
  if (lv > P.lv) return "level";
  const sm = S.summary;
  if (sm && sm.rivNew && P.rival !== sm.day) return "rival";
  if (S.phase === "open" && S.day - P.last >= PAPA_EVERY && rnd < 0.03) return "tip"; // ~30 s de juego tras abrir
  return null;
}

/** Apunta la visita y devuelve las frases de papá: [consejo, despedida]. */
export function papaVisit(reason, lv) {
  const P = papaState(lv);
  P.last = S.day;
  P.lv = Math.max(P.lv, lv);
  if (reason === "rival" && S.summary) P.rival = S.summary.day;
  if (reason === "level") return [PAPA.level];
  if (reason === "rival") return [PAPA.rival, PAPA.bye];
  P.n = ((P.n || 0) + 1) % PAPA.tips.length;
  return [PAPA.tips[P.n], PAPA.bye];
}
