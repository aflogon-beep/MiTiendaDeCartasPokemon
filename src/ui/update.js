// Actualizaciones de la app: cuando hay una versión nueva publicada, aviso con el botón «Actualizar».
// Al tocarlo se guarda la partida y se recarga con la versión nueva. Mientras se juega se busca
// versión nueva cada hora (y al volver a la app).
import { registerSW } from "virtual:pwa-register";
import { saveNow } from "../core/save.js";

let apply = null;

/** Enseña el aviso de versión nueva. go: lo que hace «Actualizar» (cargar la versión nueva). */
export function showUpdate(go) {
  apply = go;
  let el = document.querySelector("#upd");
  if (!el) {
    el = document.createElement("div");
    el.id = "upd";
    el.innerHTML = `<span>✨ Hay una versión nueva del juego</span><button class="b pri" id="updgo">Actualizar</button><button class="b" id="updno" aria-label="Más tarde">✕</button>`;
    document.body.appendChild(el);
    el.querySelector("#updgo").onclick = () => {
      saveNow(); // la partida, a salvo antes de recargar
      el.querySelector("#updgo").disabled = true;
      el.querySelector("#updgo").textContent = "Actualizando…";
      if (apply) apply();
    };
    el.querySelector("#updno").onclick = () => el.remove();
  }
}

export function initUpdates() {
  if (!("serviceWorker" in navigator)) return;
  const update = registerSW({
    onNeedRefresh: () => showUpdate(() => update(true)),
    onRegisteredSW: (url, r) => {
      if (!r) return;
      const check = () => r.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => !document.hidden && check());
    },
  });
}
