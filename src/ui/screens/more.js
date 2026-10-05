// Más: ajustes, dificultad, colecciones, mercado, partida, avisos, consejos, trofeos y regalo.
import { setLevel, setLocked } from "../../core/unlocks.js";
import { BYID, BYS, CARDS, SETDEF, seriesList, setName } from "../../core/cards/sets.js";
import { DF } from "../../core/difficulty.js";
import { DIFFS, RAR, RECO, SEAS } from "../../core/constants.js";
import { FAILED, SETLIST_ST, loadSetsFor } from "../../core/cards/api.js";
import { G, S, ensure, replaceState } from "../../core/state.js";
import { MUSIC, VIBE } from "../../audio/sfx.js";
import { VIS } from "../../render/canvas.js";
import { chg, closeM, cls, face, spark, tipsHTML } from "../modals.js";
import { custs, queue } from "../../core/customers/move.js";
import { fmt, pct } from "../../core/util.js";
import { gk, itemVal, price, repv } from "../../core/economy.js";
import { hud, updBadges } from "../hud.js";
import { releaseHolds, saveNow } from "../../core/save.js";
import { tipsList } from "../../core/tips.js";
import { toast } from "../toast.js";
import { trophies, trophyRep } from "../../core/trophies.js";
import { BUILD, verLabel } from "../version.js";
import { cloudOn, cloudUser } from "../../core/cloud.js";
export function mMkt() {
  const pool = CARDS.filter((c) => c.b >= 1),
    arr = pool.map((c) => ({ c, d: chg(c.id, 7) })).sort((a, b) => b.d - a.d);
  const row = (x) =>
    `<div class="pn row"><div style="min-width:0"><b>${x.c.name}</b> <span class="mu">${setName(x.c.s)} · ${RAR[x.c.r].n}</span><div>${fmt(price(x.c.id))} · 7 d <span class="${cls(x.d)}">${pct(x.d)}</span> · 30 d <span class="${cls(chg(x.c.id, 30))}">${pct(chg(x.c.id, 30))}</span></div></div>${spark(x.c.id)}</div>`;
  return `<h2>Mercado</h2><p class="mu">${G.MODE === "real" ? "Precios de Cardmarket (tendencia, €) vía pokemontcg.io, con movimientos diarios del juego encima." : "Modo sin conexión: precios simulados."}</p><h3>Top subidas (7 días)</h3>${arr.slice(0, 6).map(row).join("")}<h3>Top bajadas (7 días)</h3>${arr.slice(-6).reverse().map(row).join("")}`;
}
export function setRows() {
  const q = G.setQ.trim().toLowerCase();
  let l = SETDEF.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (q) l = l.filter((d) => (d.n + " " + (d.series || "") + " " + d.year).toLowerCase().includes(q));
  const tot = l.length;
  l = l.slice(0, 60);
  return (
    l
      .map((d) => {
        const inn = S.sets.includes(d.id),
          used = S.sealed[d.id] > 0 || S.items.some((i) => BYID[i.c] && BYID[i.c].s === d.id);
        return `<div class="srow">${d.sym ? `<img src="${d.sym}" alt="" onerror="this.remove()">` : '<span style="width:30px"></span>'}<div style="flex:1;min-width:0"><b>${d.n}</b><div class="mu">${d.series || ""} · ${d.year}${d.total ? " · " + d.total + " cartas" : ""}</div></div>${inn && !BYS[d.id] ? `<button class="b pri" data-a="retrysets">⚠️ Reintentar</button>` : inn ? `<button class="b"${used ? " disabled" : ""} data-a="delset" data-k="${d.id}">${used ? "En uso" : "Quitar"}</button>` : setLocked(d) ? `<button class="b" disabled>🔒 Nivel ${setLevel(d)}</button>` : `<button class="b pri" data-a="addset" data-k="${d.id}">Añadir</button>`}</div>`;
      })
      .join("") + (tot > 60 ? `<p class="mu">Mostrando 60 de ${tot}. Usa el buscador.</p>` : "") ||
    '<p class="mu">Sin resultados.</p>'
  );
}
export function mSets() {
  const ser = seriesList(),
    cur = ser.find((x) => x.n === G.setQ.trim()),
    miss = cur ? SETDEF.filter((d) => d.series === cur.n && !S.sets.includes(d.id)).length : 0,
    reco = RECO.filter((id) => {
      const d = SETDEF.find((x) => x.id === id);
      return d && !S.sets.includes(id) && !setLocked(d);
    }),
    recoN = reco
      .slice(0, 2)
      .map((id) => SETDEF.find((x) => x.id === id).n)
      .join(", ");
  return `<h2>Colecciones</h2>${SETLIST_ST !== "ok" || SETDEF.length <= 3 ? `<div class="pn">${SETLIST_ST === "loading" ? "⏳ Descargando la lista completa de colecciones… La API puede tardar hasta un minuto." : `⚠️ No se ha podido descargar la lista completa de colecciones: la API de pokemontcg.io va lenta o no responde ahora mismo.<div class="btns"><button class="b pri" data-a="setlist">Reintentar</button></div>`}</div>` : ""}${FAILED.size ? `<div class="pn"><div class="down">⚠️ ${FAILED.size} colección(es) de tu catálogo no han cargado (la API va lenta o limita peticiones).</div><div class="btns"><button class="b pri" data-a="retrysets">Reintentar ahora</button></div></div>` : ""}<p class="mu">Añade sets a tu catálogo para comprar sus sobres. En catálogo: <b>${S.sets.length}</b> de ${SETDEF.length}. ${G.MODE === "real" ? "" : "Sin conexión: solo están los 3 sets básicos."}</p>
  ${G.MODE === "real" && reco.length ? `<button class="b pri big" data-a="addreco" style="margin:0 0 10px">⭐ Añadir ${reco.length} sets populares (${recoN}${reco.length > 2 ? "…" : ""})</button>` : ""}
  <div class="serchips"><button class="b ${G.setQ ? "" : "on"}" data-a="serf" data-k="">Todas</button>${ser.map((x) => `<button class="b ${cur && cur.n === x.n ? "on" : ""}" data-a="serf" data-k="${x.n.replace(/"/g, "")}">${x.n} (${x.c})</button>`).join("")}</div>
  ${cur && miss ? `<button class="b pri big" data-a="addseries" style="margin:0 0 10px">➕ Añadir ${miss === 1 ? "el set que falta" : "los " + miss + " sets"} de ${cur.n}</button>` : ""}<input class="inp" data-i="setq" placeholder="Buscar: Evolving Skies, Base Set, 2019…" value="${G.setQ.replace(/"/g, "")}"><p class="mu">Cada set trae todas sus cartas con precio de Cardmarket. Muchos sets a la vez pueden tardar en cargar al abrir el juego.</p><div id="setlist">${setRows()}</div>`;
}
/** ¿Se puede compartir un archivo con el menú del sistema (Android: WhatsApp, Drive, correo…)? */
export const canShareFiles = () => {
  try {
    return (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [new File(["x"], "x.txt", { type: "text/plain" })] })
    );
  } catch (e) {
    return false;
  }
};
export function mBackup() {
  return `<h2>Partida</h2><div class="pn"><div>Se guarda sola cada 10 segundos, al cerrar y al terminar el día.</div><div class="mu">Último guardado: ${S.savedAt ? new Date(S.savedAt).toLocaleString("es-ES") : "—"}</div><div class="btns"><button class="b pri" data-a="savebtn">💾 Guardar ahora</button></div></div>
  ${cloudOn() ? `<div class="pn row" data-fase="I"><span><b>☁️ Nube</b><div class="mu">${cloudUser() ? `Conectado como ${cloudUser()}: se sube sola al terminar cada día.` : "Guarda la partida en internet con usuario y contraseña."}</div></span><button class="b pri" data-a="m" data-k="cloud">${cloudUser() ? "Abrir" : "Entrar"}</button></div>` : ""}
  <div class="pn"><b>Copia de seguridad</b><div class="mu">Si el navegador borra sus datos, perderías la partida. Descarga una copia de vez en cuando.</div><div class="btns"><button class="b pri" data-a="export">⬇️ Exportar archivo</button>${canShareFiles() ? `<button class="b" data-a="sharesave" data-fase="I">📤 Compartir</button>` : ""}<button class="b" data-a="importf">⬆️ Importar archivo</button><button class="b" data-a="copycode">📋 Copiar código</button></div>
  <textarea class="inp" id="impcode" rows="3" placeholder="…o pega aquí un código de partida"></textarea><button class="b" data-a="importc">Cargar código</button></div>
  <div class="pn"><b>Empezar de cero</b><div class="btns"><button class="b danger" data-a="reset">🗑️ Borrar partida</button></div></div>`;
}
/** Lee una partida exportada (JSON o código en base64). Devuelve su S, o null y avisa si no es válida. */
export function parseSave(txt) {
  let o = null;
  txt = (txt || "").trim();
  try {
    o = JSON.parse(txt);
  } catch (e) {
    try {
      o = JSON.parse(decodeURIComponent(escape(atob(txt))));
    } catch (e2) {}
  }
  const ns = o && (o.S || o);
  if (!ns || typeof ns.money !== "number" || !Array.isArray(ns.items)) {
    toast("⚠️ Ese archivo o código no es una partida válida");
    return null;
  }
  return ns;
}
export function importData(txt) {
  const ns = parseSave(txt);
  if (!ns) return;
  if (!confirm(`¿Cargar la partida del día ${ns.day} con ${fmt(ns.money)}? Se sustituirá la actual.`)) return;
  toast("Cargando partida…");
  loadSetsFor(ns.sets).then(() => {
    replaceState(ns);
    S.phase = "closed";
    S.clock = 0;
    custs.length = 0;
    queue.length = 0;
    ensure();
    releaseHolds();
    saveNow();
    closeM();
    hud();
    toast("✅ Partida cargada");
  });
}
export function mTips() {
  const l = tipsList(S.phase === "closed" ? null : S.stats);
  return `<h2>💡 Consejos de Emma</h2><div class="pn">${tipsHTML(l)}</div>
  <h3>Cómo saber si un precio está bien</h3>
  <div class="pn"><div class="tip">En <b>Stock</b> y en <b>Cartas</b>, cada precio lleva una etiqueta: <span class="acc ok">✅ Buen precio</span> <span class="acc mid">⚠️ Algo caro</span> <span class="acc bad">❌ Muy caro</span>, con el % aproximado de clientes que lo comprarían.</div>
  <div class="tip">Sobres y productos: los clientes pagan alrededor del <b>precio de referencia</b> que ves en Stock. Un poco por debajo vende casi siempre; un 15 % por encima casi nunca.</div>
  <div class="tip">Cartas en vitrina: conocen el precio de mercado. Entre 100 % y 105 % se venden rápido; a 120 % o más, muy poco.</div>
  <div class="tip">Comprar a clientes: el negocio está en pagar <b>menos del 75 %</b> del valor de mercado y revenderlas en la vitrina. Las cartas de menos de 1 € no compensan.</div></div>`;
}
export function mGift() {
  const g = S.gift,
    days = [1, 2, 3, 4, 5, 6, 7]
      .map(
        (d) =>
          `<div class="gday${d <= ((g.streak - 1) % 7) + 1 ? " on" : ""}">${d === 7 ? "🎁" : d === 3 ? "💰" : "🎴"}<span>Día ${d}</span></div>`,
      )
      .join("");
  return `<h2>🎁 Regalo diario</h2><div class="pn" style="text-align:center"><div style="font-size:54px">🎴</div><b style="font-family:var(--fd);font-size:20px">¡Un sobre gratis de ${g.set ? setName(g.set) : "tu colección"}!</b>${g.bonus ? `<div class="up" style="font-family:var(--fd);font-size:18px">+ ${fmt(g.bonus)} de premio por tu racha</div>` : ""}<div class="mu">Racha: ${g.streak} día${g.streak > 1 ? "s" : ""} seguidos. Vuelve mañana para seguir sumando.</div><div class="gdays">${days}</div></div>
  ${g.set ? `<button class="b pri big" data-a="giftopen">¡Abrirlo ahora!</button>` : ""}`;
}
export function mMore() {
  const T = (ic, l, a) => `<button class="tilebtn" ${a}><span>${ic}</span>${l}</button>`,
    K = (k) => `data-a="m" data-k="${k}"`,
    ui = S.ui || {};
  return `<h2>☰ Más</h2>
  <h3>🏪 Mi tienda</h3><div class="tgrid">${T("🛠️", "Mejoras", K("up"))}${T("🎨", "Personalizar", K("custom"))}${T("🗂️", "Colecciones", K("sets"))}${T("📈", "Mercado", K("mkt"))}${T("🏗️", "Ampliar", K("annex"))}${T("📊", "Estadísticas", K("stats"))}${T("🏆", "Trofeos", K("trophy"))}${T("🔔", "Avisos", K("notes"))}</div>
  <h3>⚙️ Ajustes</h3><div class="tgrid">${T(G.SOUND ? "🔊" : "🔇", "Sonido: " + (G.SOUND ? "sí" : "no"), 'data-a="sndtog"')}${T("🎵", "Música: " + (MUSIC ? "sí" : "no"), 'data-a="mustog"')}${T("📳", "Vibración: " + (VIBE ? "sí" : "no"), 'data-a="vibtog" data-fase="I"')}${T("🔠", "Texto: " + (ui.big ? "grande" : "normal"), 'data-a="uibig"')}${T("🌀", "Animaciones: " + (ui.calm ? "pocas" : "todas"), 'data-a="uicalm"')}${T("🎚️", "Dificultad: " + DF().n, 'data-a="diff"')}${T("⚡", "Rendimiento: " + { auto: "auto", hi: "alto", lo: "ahorro" }[ui.perf || "auto"] + (!ui.perf && VIS.autoLite ? " (ahorro)" : ""), 'data-a="perf"')}${T("📊", "FPS: " + (ui.fps ? "sí" : "no"), 'data-a="fpstog"')}${T("🗓️", "Temporada: " + (S.season && S.season !== "auto" ? SEAS[S.season].replace(/^\S+\s/, "") : "auto"), 'data-a="seastog"')}${T("💾", "Partida", K("backup"))}${cloudOn() ? T("☁️", "Nube: " + (cloudUser() || "sin cuenta"), K("cloud") + ' data-fase="I"') : ""}${T("🏠", "Volver al título", 'data-a="totitle" data-fase="I"')}</div>
  <h3>❓ Ayuda</h3><div class="tgrid">${T("💡", "Consejos", K("tips"))}${T("🎓", "Tutorial", 'data-a="tutre"')}${T("🎬", "Ver la historia", 'data-a="storyre" data-fase="I"')}${T("⤢", "Ver tienda", 'data-a="zreset"')}</div>
  <div class="mu ver" data-fase="I">📦 Versión del juego: <b>${verLabel(BUILD)}</b></div>
  <div class="pn" style="margin-top:12px"><div class="row"><span>⭐ Reputación</span><b>${repv()}</b></div><div class="mu">Sube vendiendo, con encargos, torneos y el álbum. Más reputación = más clientes.</div></div>`;
}
export function mNotes() {
  VIS.unread = 0;
  updBadges();
  const l = VIS.notes || [];
  const ago = (t) => {
    const s = Math.round((Date.now() - t) / 1000);
    return s < 60 ? "hace " + s + " s" : "hace " + Math.round(s / 60) + " min";
  };
  return `<h2>🔔 Avisos</h2>${l.length ? `<div class="pn">${l.map((n) => `<div class="tip">${n.t}<div class="mu" style="font-size:11px">${ago(n.at)}</div></div>`).join("")}</div>` : '<p class="mu">No hay avisos todavía.</p>'}`;
}
export function mDiff() {
  return `<h2>🎚️ Dificultad</h2>${Object.keys(DIFFS)
    .map(
      (k) =>
        `<div class="pn${(S.diff || "normal") === k ? " favhd" : ""}"><div class="row"><b>${DIFFS[k].n}</b><button class="b ${(S.diff || "normal") === k ? "" : "pri"}" data-a="diffset" data-k="${k}"${(S.diff || "normal") === k ? " disabled" : ""}>${(S.diff || "normal") === k ? "Elegida ✔" : "Elegir"}</button></div><div class="mu">${DIFFS[k].d}</div></div>`,
    )
    .join("")}<p class="mu">Puedes cambiarla cuando quieras.</p>`;
}
export function mTrophy() {
  const l = trophies(),
    tv = l.reduce((a, i) => a + itemVal(i), 0);
  return `<h2>🏆 Sala de trofeos</h2><div class="pn favhd"><div class="row"><span>${l.length} carta(s) · valor ${fmt(tv)}</span><b>+${trophyRep()} ⭐</b></div><div class="mu">Tus favoritas se exponen aquí. Los clientes vienen a admirarlas (${S.admire || 0} visitas) y te dan reputación. Las 6 más valiosas se ven en la vitrina de la tienda.</div></div>
  ${l.length ? `<div class="tiles">${l.map((it) => `<div class="tile" data-a="sel" data-k="${gk(it)}" style="outline:2px solid #c9a227;outline-offset:-1px">${face(BYID[it.c], it.rv)}<div class="pt">${fmt(itemVal(it))}</div><div class="fvb">❤️</div></div>`).join("")}</div>` : '<p class="mu">Aún no tienes favoritas. Abre una carta en Cartas y pulsa «❤️ Guardar en favoritas».</p>'}`;
}
