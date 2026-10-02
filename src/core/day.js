// Reloj del día: fracción del día transcurrida (0 cerrada → 1 al cierre).
import { DAYLEN } from "./constants.js";
import { S } from "./state.js";
import { clamp } from "./util.js";
export function dayT(){if(S.phase==="closed")return 0;return clamp(S.clock/DAYLEN,0,1)}
