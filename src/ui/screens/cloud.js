// Pantallas de la nube (docs/nube.md): ☁️ Nube (entrar, crear cuenta, subir, copias, salir) y el aviso
// «Hay otra partida en la nube». Las acciones y la sincronización están en ui/cloud.js.
import { G, S, hasState } from "../../core/state.js";
import { renderM } from "../modals.js";
import { fmt } from "../../core/util.js";
import { cloudList, cloudOn, cloudRanks, cloudUid, cloudUser, pendingSlots, syncedId } from "../../core/cloud.js";
import { cardPack, fkPack, tradeCanGet, tradeCards, tradeFks, tradeHas } from "../../core/trade.js";
import { FBYID } from "../../core/funko/catalog.js";
import { figSVG } from "../funko/fig.js";

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

/* ---------- 🏆 Ranking (Retos), visitas y tratos ---------- */
/** Estado del ranking: lista, pestaña, tienda que se visita, lo que se pide y se da, y los tratos de la cuenta. */
export const RK = {
  list: null,
  busy: false,
  err: "",
  tab: "worth",
  rows: [],
  sel: null,
  want: null,
  give: null,
  trades: null,
};
export const RK_TABS = {
  worth: { t: "💰 Empresa", v: (r) => +r.worth || 0, f: (r) => fmt(r.worth) },
  best: { t: "💎 Carta", v: (r) => +r.best || 0, f: (r) => fmt(r.best) },
  cards: { t: "📚 Colección", v: (r) => +r.cards || 0, f: (r) => `${r.cards || 0} cartas` },
  fk: {
    t: "🧸 Funkos",
    v: (r) => (+r.fk_lv || 0) * 1e4 + (+r.funkos || 0),
    f: (r) => (r.fk_lv ? `Nivel ${r.fk_lv} · ${r.funkos || 0}` : "—"),
  },
};
async function loadRanks() {
  RK.busy = true;
  try {
    RK.list = await cloudRanks("real");
    RK.err = "";
  } catch (e) {
    RK.list = [];
    RK.err = /404|ranks/.test(e.message) ? "Falta crear la tabla del ranking en Supabase (docs/nube.md)." : e.message;
  }
  RK.busy = false;
  if (G.M === "rank") renderM();
}
export function mRank() {
  if (!cloudOn()) return `<h2>🏆 Ranking</h2><div class="pn">La nube aún no está configurada.</div>`;
  if (!cloudUser())
    return `<h2>🏆 Ranking</h2><div class="pn">Para ver el ranking y salir en él, entra con tu cuenta en ☁️ Nube.</div><div class="btns"><button class="b pri" data-a="m" data-k="cloud">☁️ Entrar</button></div>`;
  if (RK.list == null && !RK.busy) loadRanks();
  const T = RK_TABS[RK.tab],
    me = cloudUid(),
    medal = (i) => ["🥇", "🥈", "🥉"][i] || `${i + 1}.`,
    inbox = (RK.trades || []).filter((t) => t.to_id === me && t.status === "open").length;
  RK.rows = (RK.list || []).slice().sort((a, b) => T.v(b) - T.v(a));
  const rows = RK.rows
    .map(
      (r, i) =>
        `<button class="pn rk-row${r.user_id === me ? " me" : ""}" data-a="rkvisit" data-n="${i}"><span class="rk-pos">${medal(i)}</span><div><b>${esc(r.shop || "Pokémon Card Shop")}</b><small>${esc(r.username || "")} · ranura ${r.slot} · día ${r.day} · nivel ${r.lv}${r.fk_lv ? ` · 🧸 ${r.fk_lv}` : ""}</small>${RK.tab === "best" && r.best_name ? `<small>💎 ${esc(r.best_name)}</small>` : ""}</div><b class="rk-v">${T.f(r)}</b></button>`,
    )
    .join("");
  return `<h2>🏆 Ranking</h2><div class="rk-tabs">${Object.keys(RK_TABS)
    .map((k) => `<button class="b${RK.tab === k ? " pri" : ""}" data-a="rktab" data-k="${k}">${RK_TABS[k].t}</button>`)
    .join(
      "",
    )}</div><button class="b rk-inbox" data-a="m" data-k="trades">📬 Regalos y cambios${inbox ? ` <i class="hbn" style="display:inline-block">${inbox}</i>` : ""}</button>
  <p class="mu">Toca una tienda para visitarla. Se actualiza al entrar en la partida y al terminar cada día.</p>${RK.err ? `<div class="pn down">⚠️ ${RK.err}</div>` : ""}${RK.busy && !RK.list ? '<p class="mu">⏳ Mirando la nube…</p>' : ""}${rows || (RK.list && !RK.err ? '<p class="mu">Todavía no hay nadie. ¡Termina un día para salir!</p>' : "")}<div class="btns"><button class="b" data-a="rkload">↻ Actualizar</button></div>`;
}

/** Una carta o un Funko de un paquete (core/trade.js), con su valor. */
export function packTile(p, extra = "") {
  const pic =
    p.t === "fk"
      ? `<div class="td-fig">${FBYID[p.f] ? figSVG(FBYID[p.f], p.va) : "🧸"}</div>`
      : p.img
        ? `<img class="td-card" src="${esc(p.img)}" alt="" loading="lazy">`
        : `<div class="td-card td-noimg">🎴</div>`;
  return `<div class="td-tile">${pic}<b>${esc(p.n)}</b><small>${p.fav ? "🏆 " : ""}${p.gr ? `PSA ${p.gr} · ` : ""}${p.va ? esc(p.va) + " · " : ""}${fmt(p.val || 0)}</small>${extra}</div>`;
}
/** Visitar una tienda del ranking: su ficha (vitrina, trofeos y Funkos) y, si no es tuya, regalar o pedir un cambio. */
export function mVisit() {
  const r = RK.sel;
  if (!r) return "";
  const mine = r.user_id === cloudUid(),
    sh = r.show,
    want = (p, i, k) =>
      mine ? "" : `<button class="b mini" data-a="tdwant" data-k="${k}" data-n="${i}">🔄 Pedir</button>`;
  return `<h2>🏪 ${esc(r.shop || "Pokémon Card Shop")}</h2><div class="pn vs-head"><span>👤 <b>${esc(r.username || "")}</b> · ranura ${r.slot}</span><span>Día ${r.day} · nivel ${r.lv}${r.fk_lv ? ` · 🧸 ${r.fk_lv}` : ""}</span><span>Empresa <b>${fmt(r.worth)}</b>${r.cards ? ` · ${r.cards} cartas distintas` : ""}</span></div>
  ${
    !sh
      ? '<p class="mu">Esta tienda aún no tiene ficha: se crea cuando su dueño juega con la versión nueva.</p>'
      : `<h3>🗄️ Vitrina y trofeos</h3>${sh.vit && sh.vit.length ? `<div class="td-grid">${sh.vit.map((p, i) => packTile(p, want(p, i, "vit"))).join("")}</div>` : '<p class="mu">La vitrina está vacía.</p>'}
  ${sh.fk ? `<h3>🧸 Funkos</h3>${sh.fks && sh.fks.length ? `<div class="td-grid">${sh.fks.map((p, i) => packTile(p, want(p, i, "fks"))).join("")}</div>` : '<p class="mu">Todavía no tiene Funkos.</p>'}` : ""}`
  }
  ${mine || !sh ? "" : `<div class="btns"><button class="b pri" data-a="tdgift">🎁 Regalarle algo</button></div><p class="mu">«Pedir» propone un cambio: eliges qué le das tú a cambio y decide si acepta.</p>`}`;
}
/** Elegir qué mandar (regalo o lo que das en un cambio): solo lo que el otro puede recibir. */
export function mTdGive() {
  const r = RK.sel;
  if (!r || !r.show) return "";
  if (RK.give) {
    return `<h2>${RK.want ? "🔄 Proponer cambio" : "🎁 Regalar"}</h2><div class="pn">Para <b>${esc(r.username)}</b> (${esc(r.shop || "")})</div>
    <div class="td-deal"><div><h3>Das</h3>${packTile(RK.give)}</div>${RK.want ? `<div><h3>Recibes</h3>${packTile(RK.want)}</div>` : ""}</div>
    <p class="mu">${RK.want ? "Lo que das sale ya de tu tienda. Si no acepta (o lo cancelas), te vuelve." : "Le llega la próxima vez que juegue. Si no lo acepta, te vuelve."}</p>
    <div class="btns"><button class="b pri" data-a="tdsend">${RK.want ? "🔄 Proponer" : "🎁 Regalar"}</button><button class="b" data-a="tdback">Volver</button></div>`;
  }
  const cards = tradeCards(r.show.sets)
      .map((it) => [it, cardPack(it)])
      .sort((a, b) => b[1].val - a[1].val)
      .slice(0, 60),
    fks = r.show.fk
      ? tradeFks()
          .map((u) => [u, fkPack(u)])
          .sort((a, b) => b[1].val - a[1].val)
          .slice(0, 40)
      : [];
  const pick = (k, i) => `<button class="b mini pri" data-a="tdpick" data-k="${k}" data-n="${i}">Elegir</button>`;
  return `<h2>${RK.want ? "🔄 ¿Qué le das a cambio?" : "🎁 ¿Qué le regalas?"}</h2>${RK.want ? `<div class="td-deal"><div><h3>Te da</h3>${packTile(RK.want)}</div></div>` : ""}
  <p class="mu">Solo salen cartas de colecciones que tiene ${esc(r.username)}${r.show.fk ? " y tus Funkos" : " (no tiene zona Funko)"}.</p>
  ${cards.length ? `<h3>🎴 Tus cartas</h3><div class="td-grid">${cards.map(([it, p]) => packTile(p, pick("c", it.i))).join("")}</div>` : '<p class="mu">No tienes cartas de sus colecciones.</p>'}
  ${fks.length ? `<h3>🧸 Tus Funkos</h3><div class="td-grid">${fks.map(([u, p]) => packTile(p, pick("f", u.i))).join("")}</div>` : ""}`;
}
/** 📬 Regalos y cambios: los que te mandan (aceptar o rechazar) y los que has mandado (cancelar). */
export function mTrades() {
  const me = cloudUid(),
    L = RK.trades || [],
    inn = L.filter((t) => t.to_id === me && t.status === "open"),
    out = L.filter((t) => t.from_id === me && t.status === "open");
  const one = (t, inbox) => {
    const ok = !t.want || tradeHas(t.want),
      can = tradeCanGet(t.give);
    return `<div class="pn td-item"><div class="td-who">${inbox ? `De <b>${esc(t.from_name || "")}</b>` : `Para <b>${esc(t.to_name || "")}</b>`} · ${t.want ? "🔄 cambio" : "🎁 regalo"}</div>
    <div class="td-deal"><div><h3>${inbox ? "Te da" : "Das"}</h3>${packTile(t.give)}</div>${t.want ? `<div><h3>${inbox ? "Pide" : "Pides"}</h3>${packTile(t.want)}</div>` : ""}</div>
    ${
      inbox
        ? `${!can ? `<p class="mu">⚠️ No puedes recibirlo: ${t.give.t === "fk" ? "necesitas la zona Funko" : "no tienes esa colección"}.</p>` : ""}${!ok ? '<p class="mu">⚠️ Ya no tienes lo que te pide.</p>' : ""}<div class="btns"><button class="b pri" data-a="tdyes" data-n="${t.id}"${ok && can ? "" : " disabled"}>✔ Aceptar</button><button class="b danger" data-a="tdno" data-n="${t.id}">Rechazar</button></div>`
        : `<div class="btns"><button class="b" data-a="tdcancel" data-n="${t.id}">Cancelar (te vuelve)</button></div>`
    }</div>`;
  };
  return `<h2>📬 Regalos y cambios</h2>${RK.err ? `<div class="pn down">⚠️ ${RK.err}</div>` : ""}${RK.trades == null ? '<p class="mu">⏳ Mirando la nube…</p>' : ""}
  <h3>Te han mandado</h3>${inn.map((t) => one(t, true)).join("") || '<p class="mu">Nada por ahora.</p>'}
  <h3>Has mandado</h3>${out.map((t) => one(t, false)).join("") || '<p class="mu">Nada pendiente.</p>'}
  <p class="mu">Para regalar o pedir un cambio, abre el ranking y toca la tienda de otro.</p>`;
}
