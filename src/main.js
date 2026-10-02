// Arranque del juego. La mayor parte de la interfaz y el dibujo siguen en legacy.js mientras se separa en módulos (R2).
import * as legacy from "./legacy.js";
import { G } from "./core/state.js";
import { installTestHooks } from "./debug.js";

// Todos los módulos, para que los tests encuentren cada nombre en su módulo (window.__pcs).
const modules = Object.values(import.meta.glob(["./core/**/*.js", "./world/**/*.js", "./render/**/*.js", "./ui/**/*.js", "./audio/**/*.js"], { eager: true }));
installTestHooks(G, modules, legacy.__get, legacy.__set);
