// Pantallas de la nube (docs/nube.md): ☁️ Nube (entrar, crear cuenta, subir, copias, salir) y el aviso
// «Hay otra partida en la nube». Las acciones y la sincronización están en ui/cloud.js.
import { G, S, hasState } from "../../core/state.js";
import { renderM } from "../modals.js";
import { fmt } from "../../core/util.js";
import { cloudList, cloudOn, cloudUser, pendingSlots, syncedId } from "../../core/cloud.js";

/** Lo que enseña la pantalla mientras llegan las cosas de la nube. */
export const CL = { list: null, busy: "", err: "", ask: null, other: null };
const when = (iso) =>
  new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const kb = (n) => (n ? ` · ${Math.max(1, Math.round(n / 1024))} KB` : "");

/* ---------- Pantalla ☁️ Nube ---------- */
export function mCloud() {
  if (!cloudOn())
    return `<h2 class="cl-h">☁️ Nube</h2><div class="pn">La partida en la nube aún no está configurada. Mira <b>docs/nube.md</b>.</div>`;
  const u = cloudUser(),
    busy = CL.busy ? `<p class="mu cl-busy">⏳ ${CL.busy}</p>` : "",
    err = CL.err ? `<div class="pn down cl-err">⚠️ ${CL.err}</div>` : "";
  if (!u)
    return `<h2 class="cl-h">☁️ Nube</h2><p class="mu">Guarda tu partida en internet para no perderla y seguir en otro dispositivo.</p>${err}
  <div class="pn cl-form"><label>Usuario<input id="cldu" class="inp" autocomplete="username" autocapitalize="none" maxlength="20" placeholder="p. ej. alberto"></label>
  <label>Contraseña<input id="cldp" class="inp" type="password" autocomplete="current-password" maxlength="72"></label>
  <div class="btns"><button class="b pri" data-a="cldin">Entrar</button><button class="b" data-a="cldup">Crear cuenta</button></div></div>
  <p class="mu">🔑 Sin correo no se puede recuperar la contraseña: apúntala en un sitio seguro.</p>${busy}`;
  if (!hasState() || G.TITLE)
    return `<h2 class="cl-h">☁️ Nube</h2><div class="pn">Conectado como <b>${u}</b>.</div><p class="mu">Entra en una partida para subirla o ver sus copias.</p><div class="btns"><button class="b danger" data-a="cldout">Cerrar sesión</button></div>`;
  if (CL.list == null && !CL.busy) refreshList();
  const L = CL.list || [],
    sid = syncedId(G.MODE, G.SLOT),
    pend = pendingSlots().includes(`${G.MODE}-${G.SLOT}`);
  const rows = L.map((r, i) =>
    CL.ask === r.id
      ? `<div class="pn cl-row ask"><span>¿Cargar la copia del <b>día ${r.day}</b>? Se sustituye la partida de esta ranura.</span><div class="btns"><button class="b pri" data-a="cldload" data-n="${r.id}">Sí, cargarla</button><button class="b" data-a="cldask" data-n="0">No</button></div></div>`
      : `<div class="pn cl-row"><span><b>Día ${r.day}</b>${r.name ? " · " + esc(r.name) : ""}<small>${when(r.created_at)}${kb(r.size)}${i === 0 ? " · la más nueva" : ""}${r.id === sid ? " · ✔ la de aquí" : ""}</small></span><button class="b" data-a="cldask" data-n="${r.id}">Cargar</button></div>`,
  ).join("");
  return `<h2 class="cl-h">☁️ Nube</h2><div class="pn cl-me">Conectado como <b>${u}</b> · ranura ${G.SLOT}${pend ? `<div class="mu">⏳ Hay cambios sin subir (sin conexión). Se suben solos al volver la red.</div>` : ""}</div>${err}
  <div class="btns"><button class="b pri" data-a="cldsave">☁️ Subir ahora</button></div>
  <p class="mu">Se sube sola al terminar cada día, y también las otras ranuras de este dispositivo. En la nube se quedan las 7 últimas copias de cada ranura.</p>${busy}
  <h3>Copias en la nube</h3>${rows || (CL.list ? '<p class="mu">Todavía no hay ninguna.</p>' : "")}
  <div class="btns"><button class="b danger" data-a="cldout">Cerrar sesión</button></div>`;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const paint = () => G.M === "cloud" && renderM();
async function refreshList() {
  CL.busy = "Mirando la nube…";
  try {
    CL.list = await cloudList(G.MODE, G.SLOT);
    CL.err = "";
  } catch (e) {
    CL.list = [];
    CL.err = e.message;
  }
  CL.busy = "";
  paint();
}
/** Hace algo con la nube enseñando «⏳» y, si falla, el error. */
export async function work(msg, fn) {
  if (CL.busy) return;
  CL.busy = msg;
  CL.err = "";
  paint();
  try {
    await fn();
  } catch (e) {
    CL.err = e.message;
  }
  CL.busy = "";
  paint();
}
export function mCloudNew() {
  const r = CL.other;
  if (!r) return "";
  return `<h2>☁️ Hay otra partida en la nube</h2><p class="mu">Se subió desde otro dispositivo (o desde aquí antes de cargar otra copia).</p>
  <div class="pn cl-cmp"><div><b>☁️ En la nube</b><span>Día ${r.day}</span><small>${when(r.created_at)}</small></div><div><b>📱 En este dispositivo</b><span>Día ${S.day}</span><small>${S.savedAt ? when(S.savedAt) : "—"} · ${fmt(S.money)}</small></div></div>${CL.err ? `<div class="pn down cl-err">⚠️ ${CL.err}</div>` : ""}
  <div class="btns"><button class="b pri" data-a="cldtake">☁️ Cargar la de la nube</button><button class="b" data-a="cldkeep">📱 Seguir con esta</button></div>
  <p class="mu">Si sigues con esta, se sube ahora y pasa a ser la más nueva. La otra queda entre las copias de ☁️ Nube.</p>`;
}
