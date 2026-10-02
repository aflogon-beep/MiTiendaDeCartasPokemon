// Dificultad elegida (Fácil, Normal o Difícil) y sus multiplicadores.
import { DIFFS } from "./constants.js";
import { S, hasState } from "./state.js";
export const DF = () => DIFFS[(hasState() && S.diff) || "normal"] || DIFFS.normal;
