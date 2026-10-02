// Gradeo: nota que saca una carta según su estado.
import { wpick } from "./rng.js";
export function rollGrade(k){const g=+wpick({10:14,9:34,8:26,7:14,6:7,5:3,4:2})-(k==="LP"?2:k==="MP"?3:0);return Math.max(1,g)}
