// Botón o gesto «atrás» de Android (docs/pendientes.md §6). En la app instalada, «atrás» sin nada a lo que
// volver cerraba la app al instante (con los gestos, basta deslizar desde el borde de la pantalla).
// Ahora «atrás» cierra lo que esté abierto (como la ✕); en las pantallas completas (abrir sobres, gradeo,
// celebraciones, historia) no hace nada; y si no hay nada abierto, avisa y solo sale si se repite enseguida.
// Solo en la app instalada: en una pestaña del navegador, «atrás» sigue funcionando como siempre.
import { $ } from "../render/canvas.js";
import { G } from "../core/state.js";
import { A } from "./actions.js";
import { toast } from "./toast.js";
import { diagNote } from "./diag.js";

export const BACK = { exitT: 0, timer: 0 };
const arm = () => history.pushState({ pcs: 1 }, "");

/** Qué hace «atrás» ahora. Devuelve lo que ha hecho (para el registro y los tests). */
export function backPress() {
  if ($("#diag")) return ($("#diag").remove(), "diag");
  if ($("#lvup")) return (A.lvupok(), "lvup");
  if ($("#bkp")) return (A.bkplater(), "bkp");
  if (G.M) {
    const x = $("#ovh .xbtn"),
      m = G.M;
    if (x) return (x.click(), "cerrar " + m);
    return "pantalla completa";
  }
  if (G.STORY) return "historia";
  return "salir?";
}

export function initBack(force) {
  const standalone =
    matchMedia("(display-mode: standalone)").matches || navigator.standalone || force || window.__pcsBack;
  if (!standalone) return;
  arm();
  addEventListener("popstate", () => {
    const r = backPress();
    diagNote("atrás: " + r);
    if (r !== "salir?") return arm();
    // Nada abierto: aviso; si se vuelve a pulsar «atrás» en 2,5 s, la app se cierra (no se vuelve a armar)
    toast("Vuelve atrás otra vez para salir");
    clearTimeout(BACK.timer);
    BACK.timer = setTimeout(arm, 2500);
  });
}
