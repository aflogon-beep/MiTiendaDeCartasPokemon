// Desbloqueos por nivel: las colecciones de cartas por época (modernas desde el nivel 1, 2003–2016 desde el
// 3 y clásicas desde el 5; las que ya tengas se quedan) y lo que trae cada nivel, para el aviso «🔓 Nuevo».
import { G } from "./state.js";
import { level, tierOf } from "./economy.js";
import { TIERS } from "./constants.js";
import { DF } from "./difficulty.js";

/** Nivel con el que se desbloquea una colección (por su año). */
export const setLevel = (sd) => (!sd || !sd.year || sd.year >= 2017 ? 1 : sd.year >= 2003 ? 3 : 5);
/** ¿Está bloqueada para añadirla ahora? (G.noLocks: solo el test 14, para comparar con el original) */
export const setLocked = (sd) => !G.noLocks && setLevel(sd) > level();

/** Lo que se desbloquea al llegar al nivel lv (textos del aviso). */
export function unlocksAt(lv) {
  const l = [];
  if (lv === 2 && DF().rival) l.push("🏪 Puede abrir una tienda rival en la calle: vigila sus precios");
  if (lv === 3)
    l.push(
      "🗂️ Colecciones de 2003 a 2016 (Más → Colecciones)",
      "🏗️ Ampliar la tienda con el local de al lado",
      "🏦 Préstamo de 4.000 € en el banco",
    );
  if (lv === 5)
    l.push(
      "🗂️ Colecciones clásicas de 1999 a 2003, como Base Set (Más → Colecciones)",
      "📚 Se traspasa la librería de al lado: ¡una zona solo de Funkos!",
    );
  const t = tierOf(lv);
  if (t > tierOf(lv - 1)) l.push(`⭐ Tu tienda pasa a ser «${TIERS[t].sub}»`);
  return l;
}
