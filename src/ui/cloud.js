// Partida en la nube (docs/nube.md): pantalla ☁️ Nube (entrar, crear cuenta, subir, copias, salir), subida al
// terminar el día, reintento de lo pendiente al volver la red y aviso al entrar en una partida si en la nube hay
// una copia que no salió de este dispositivo. La parte que habla con Supabase está en core/cloud.js.
import { A } from "./actions.js";
import { G, S, ensure, hasState, replaceState } from "../core/state.js";
import { closeM, openM, renderM } from "./modals.js";
import { CL, RK, paint, work } from "./screens/cloud.js";
import { paintTitle, startGame } from "./title.js";
import { BYID } from "../core/cards/sets.js";
import { itemVal, level, netWorth } from "../core/economy.js";
import { fkLv, fkUVal } from "../core/funko/zone.js";
import { cardPack, fkPack, tradeCanGet, tradeCards, tradeFks, tradeGive, tradeHas, tradeTake } from "../core/trade.js";
import { custs, queue } from "../core/customers/move.js";
import { hud } from "./hud.js";
import { loadSetsFor } from "../core/cards/api.js";
import { releaseHolds, saveNow } from "../core/save.js";
import { slotInfo, slotKey, useSlot } from "../core/slots.js";
import { toast } from "./toast.js";
import { BUILD } from "./version.js";
import {
  cloudFetch,
  cloudLatest,
  cloudList,
  cloudOn,
  cloudSignIn,
  cloudSignOut,
  cloudSignUp,
  cloudUpload,
  cloudUser,
  pendingSlots,
  setPending,
  setSynced,
  cloudRankPush,
  cloudTradeSend,
  cloudTradeSet,
  cloudTrades,
  cloudUid,
  syncedAt,
  syncedId,
} from "../core/cloud.js";
import { SLOTS } from "../core/slots.js";

const form = () => [document.querySelector("#cldu")?.value || "", document.querySelector("#cldp")?.value || ""];
/** El botón «☁️ Nube: …» de los ajustes del título, al día con la cuenta. */
function titleTile() {
  if (G.TITLE) paintTitle();
}
function afterLogin(u) {
  titleTile();
  toast(`☁️ Hola, ${u}`);
  CL.list = CL.slots = null;
  if (hasState() && !G.TITLE) setTimeout(cloudCheck, 300);
  else cloudSyncAll().then(() => ((CL.slots = null), paint()));
}

/* ---------- Subir y cargar ---------- */
const metaOf = (st) => ({ day: st.day, name: (st.shopName || "").trim() || null, ver: BUILD || null });
/** Sube la partida guardada de una ranura. Si no hay red, queda pendiente. */
async function uploadSlot(mode, slot) {
  const js = localStorage.getItem(slotKey(slot, mode));
  if (!js) return null;
  try {
    return await cloudUpload(mode, slot, js, metaOf(JSON.parse(js)));
  } catch (e) {
    setPending(mode, slot);
    throw e;
  }
}
/** La fila del ranking de la partida que se está jugando (valor de la empresa, nivel, Funkos y la carta más cara). */
export function rankRow() {
  let best = null;
  (S.items || []).forEach((it) => {
    if (it.fkK) return;
    const v = itemVal(it);
    if (!best || v > best.v) best = { v, n: (BYID[it.c] || {}).name };
  });
  const cards = tradeCards(),
    fks = tradeFks(),
    top = (l, val, n) =>
      l
        .slice()
        .sort((a, b) => val(b) - val(a))
        .slice(0, n);
  return {
    cards: new Set((S.items || []).filter((it) => !it.fkK).map((it) => it.c)).size,
    funkos: fks.length,
    // Ficha para las visitas: lo mejor de la vitrina y de la sala de trofeos, y los mejores Funkos
    show: {
      sets: (S.sets || []).slice(),
      fk: !!S.fk,
      vit: top(
        cards.filter((it) => it.case != null || it.fav),
        itemVal,
        18,
      ).map((it) => Object.assign(cardPack(it), { fav: !!it.fav })),
      fks: top(fks, fkUVal, 12).map(fkPack),
    },
    shop: (S.shopName || "").trim() || null,
    day: S.day,
    worth: Math.round(netWorth()),
    lv: level(),
    fk_lv: S.fk ? fkLv() : 0,
    best: best ? Math.round(best.v * 100) / 100 : 0,
    best_name: best ? best.n || null : null,
  };
}
/* ---------- Regalos y cambios ---------- */
const pname = (p) => `${p.t === "fk" ? "🧸" : "🎴"} ${p.n}`;
/**
 * Lee los tratos de la cuenta y cierra los que ya tienen respuesta: lo que te devuelven (rechazado o cancelado) o
 * lo que te dan en un cambio aceptado entra en tu tienda. Solo en la partida que se juega (con cartas reales).
 */
export async function tradeSync(quiet) {
  if (!cloudOn() || !cloudUser() || !hasState() || G.TITLE || G.MODE !== "real") return;
  let L;
  try {
    L = await cloudTrades();
  } catch (e) {
    RK.trades = RK.trades || [];
    if (!quiet)
      RK.err = /404|trades/.test(e.message) ? "Falta crear la tabla de regalos y cambios (docs/nube.md)." : e.message;
    return;
  }
  const me = cloudUid();
  let changed = false;
  for (const t of L.filter((x) => x.from_id === me && x.status !== "open")) {
    if (!(await cloudTradeSet(t.id, t.status, "closed").catch(() => false))) continue;
    if (t.status === "done") {
      if (t.want && tradeGive(t.want)) toast(`🔄 ¡${t.to_name} aceptó el cambio! Recibes ${pname(t.want)}`);
      else if (!t.want) toast(`🎁 ${t.to_name} ha recibido tu regalo`);
    } else if (tradeGive(t.give))
      toast(`↩️ ${t.status === "no" ? `${t.to_name} no lo aceptó: te` : "Cancelado: te"} vuelve ${pname(t.give)}`);
    changed = true;
  }
  if (changed) (saveNow(), hud());
  RK.trades = L.filter((x) => x.status === "open");
  const n = RK.trades.filter((t) => t.to_id === me).length;
  if (!quiet && G.M == null && n && !RK.told) {
    RK.told = true;
    toast(`📬 Tienes ${n} regalo(s) o cambio(s): Retos → Juegos → 🏆 Ranking → 📬`);
  }
  if (["rank", "trades"].includes(G.M)) renderM();
}
async function tradeStep(fn) {
  try {
    await fn();
  } catch (e) {
    toast("⚠️ " + e.message);
  }
  await tradeSync(true);
  renderM();
}
/** Apunta esta ranura en el ranking (sin red o sin tabla, no pasa nada). */
export function cloudRankNow() {
  if (!cloudOn() || !cloudUser() || !hasState() || G.TITLE || G.MODE !== "real") return Promise.resolve(false);
  const row = rankRow(),
    { cards, funkos, show, ...base } = row;
  // Si aún no se han añadido las columnas nuevas (docs/nube.md), se apunta lo de siempre
  return cloudRankPush(G.MODE, G.SLOT, row)
    .catch(() => cloudRankPush(G.MODE, G.SLOT, base))
    .then(
      () => ((RK.list = null), true),
      () => false,
    );
}
/** Al terminar el día (main.js): se guarda y se sube. */
export function cloudDayEnd() {
  if (!cloudOn() || !cloudUser() || !hasState()) return;
  saveNow();
  const [m, n] = [G.MODE, G.SLOT];
  cloudRankNow();
  uploadSlot(m, n).then(
    () => (CL.list = null),
    () => toast("☁️ Sin conexión: la partida se subirá a la nube más tarde"),
  );
}
/** Sube lo que se quedó pendiente (al volver la red y al entrar en una partida). */
export async function cloudRetry() {
  if (!cloudOn() || !cloudUser()) return;
  for (const k of pendingSlots()) {
    const [m, n] = k.split("-");
    try {
      await uploadSlot(m, +n);
    } catch (e) {
      return;
    }
  }
}
/** Carga en la ranura actual una partida bajada de la nube. */
function applyCloud(txt, id) {
  const ns = JSON.parse(txt);
  return loadSetsFor(ns.sets).then(() => {
    replaceState(ns);
    S.phase = "closed";
    S.clock = 0;
    custs.length = 0;
    queue.length = 0;
    ensure();
    releaseHolds();
    saveNow();
    setSynced(G.MODE, G.SLOT, id);
    closeM();
    hud();
    toast(`☁️ Partida del día ${S.day} cargada de la nube`);
  });
}

/** Desde el título: carga en la ranura n la copia más nueva de la nube y entra a jugar. */
async function titleCloudLoad(n) {
  const r = (CL.slots || [])[n - 1];
  if (!r) return;
  const ns = JSON.parse(await cloudFetch(r.id));
  await loadSetsFor(ns.sets);
  useSlot(n);
  replaceState(ns);
  S.phase = "closed";
  S.clock = 0;
  ensure();
  releaseHolds();
  setSynced(G.MODE, n, r.id);
  CL.ask = CL.slots = CL.list = null;
  startGame();
  toast(`☁️ ¡Partida del día ${S.day} cargada de la nube!`);
}

/**
 * Sube las otras ranuras de este dispositivo que la nube no tiene al día (nunca subidas o guardadas después de
 * la última subida). Si en la nube hay una copia de esa ranura que no salió de aquí, no la pisa: se preguntará
 * al entrar en ella.
 */
export async function cloudSyncAll() {
  if (!cloudOn() || !cloudUser()) return;
  const mode = G.MODE || "real";
  for (let n = 1; n <= SLOTS; n++) {
    if (hasState() && !G.TITLE && n === G.SLOT) continue; // la de ahora la mira cloudCheck
    const js = localStorage.getItem(slotKey(n, mode));
    if (!js) continue;
    const at = +((/"savedAt":(\d+)/.exec(js) || [])[1] || 0);
    try {
      const r = await cloudLatest(mode, n);
      if (r && r.id !== syncedId(mode, n)) continue;
      if (!r || at > syncedAt(mode, n)) await uploadSlot(mode, n);
    } catch (e) {
      return; // sin red: otra vez será
    }
  }
}

/* ---------- Al entrar en una partida: ¿hay otra en la nube? ---------- */
/** Si la copia más nueva de la nube no salió de aquí, pregunta cuál se queda. */
export async function cloudCheck(tries = 0) {
  if (!cloudOn() || !cloudUser() || !hasState() || G.TITLE) return;
  await cloudRetry();
  if (!tries) (cloudRankNow(), tradeSync()); // esta ranura, al día en el ranking; regalos y cambios
  let r;
  try {
    r = await cloudLatest(G.MODE, G.SLOT);
  } catch (e) {
    return; // sin red: se mirará la próxima vez
  }
  if (!r) {
    // Nada en la nube para esta ranura: se sube la de aquí
    await uploadSlot(G.MODE, G.SLOT).catch(() => {});
    cloudSyncAll();
    return;
  }
  if (r.id === syncedId(G.MODE, G.SLOT)) return cloudSyncAll();
  if (G.M || G.STORY) {
    if (tries < 40) setTimeout(() => cloudCheck(tries + 1), 3000);
    return;
  }
  CL.other = r;
  openM("cloudnew");
}
Object.assign(A, {
  rktab: (d) => {
    RK.tab = d.k;
    renderM();
  },
  rkvisit: (d) => {
    RK.sel = RK.rows[+d.n] || null;
    RK.want = RK.give = null;
    openM("visit");
  },
  tdgift: () => {
    RK.want = RK.give = null;
    openM("tdgive");
  },
  tdwant: (d) => {
    const sh = RK.sel && RK.sel.show;
    RK.want = sh && sh[d.k] ? sh[d.k][+d.n] : null;
    RK.give = null;
    if (RK.want) openM("tdgive");
  },
  tdpick: (d) => {
    const it = d.k === "f" ? tradeFks().find((u) => u.i === +d.n) : tradeCards().find((x) => x.i === +d.n);
    RK.give = it ? (d.k === "f" ? fkPack(it) : cardPack(it)) : null;
    renderM();
  },
  tdback: () => {
    RK.give = null;
    renderM();
  },
  tdsend: () => {
    const r = RK.sel,
      give = RK.give,
      want = RK.want;
    if (!r || !give || !tradeTake(give)) return toast("⚠️ Ya no tienes eso");
    saveNow();
    cloudTradeSend(r.user_id, r.username, give, want).then(
      () => {
        RK.give = RK.want = null;
        toast(want ? `🔄 Cambio propuesto a ${r.username}` : `🎁 Regalo enviado a ${r.username}`);
        closeM();
        hud();
        tradeSync(true);
      },
      (e) => {
        tradeGive(give); // no se pudo mandar: vuelve a tu tienda
        saveNow();
        toast("⚠️ No se pudo mandar: " + e.message);
      },
    );
  },
  tdyes: (d) =>
    tradeStep(async () => {
      const t = (RK.trades || []).find((x) => x.id === +d.n);
      if (!t || !tradeCanGet(t.give) || (t.want && !tradeHas(t.want))) return;
      if (!(await cloudTradeSet(t.id, "open", "done"))) return toast("Ese trato ya no está");
      if (t.want) tradeTake(t.want);
      tradeGive(t.give);
      saveNow();
      hud();
      toast(`✔ Recibes ${pname(t.give)}`);
    }),
  tdno: (d) => tradeStep(() => cloudTradeSet(+d.n, "open", "no").then(() => toast("Rechazado: se lo devolvemos"))),
  tdcancel: (d) => tradeStep(() => cloudTradeSet(+d.n, "open", "cancel")),
  rkload: () => {
    RK.list = null;
    cloudRankNow().then(() => renderM());
    tradeSync(true);
  },
  cldin: () => {
    const [u, p] = form();
    work("Entrando…", async () => afterLogin(await cloudSignIn(u, p)));
  },
  cldup: () => {
    const [u, p] = form();
    work("Creando la cuenta…", async () => afterLogin(await cloudSignUp(u, p)));
  },
  cldout: () => {
    cloudSignOut();
    titleTile();
    CL.list = CL.slots = null;
    CL.err = "";
    toast("☁️ Has salido de tu cuenta. Las partidas de este dispositivo siguen aquí");
    renderM();
  },
  cldsave: () =>
    work("Subiendo…", async () => {
      saveNow();
      await uploadSlot(G.MODE, G.SLOT);
      toast("☁️ Partida subida a la nube");
      CL.list = await cloudList(G.MODE, G.SLOT);
    }),
  cldslot: (d) => {
    const n = +d.n;
    if (slotInfo(n, G.MODE).empty) return A.cldslotgo(d);
    CL.ask = "s" + n;
    renderM();
  },
  cldslotgo: (d) => work("Bajando la partida…", () => titleCloudLoad(+d.n)),
  cldask: (d) => {
    CL.ask = +d.n || null;
    renderM();
  },
  cldload: (d) =>
    work("Bajando la copia…", async () => {
      CL.ask = null;
      await applyCloud(await cloudFetch(+d.n), +d.n);
      CL.list = null;
    }),
  cldtake: () => {
    const r = CL.other;
    if (!r) return;
    CL.err = "";
    toast("☁️ Bajando la partida…");
    cloudFetch(r.id)
      .then((t) => applyCloud(t, r.id))
      .catch((e) => ((CL.err = e.message), renderM()));
  },
  cldkeep: () => {
    if (CL.other) setSynced(G.MODE, G.SLOT, CL.other.id);
    CL.other = null;
    closeM();
    uploadSlot(G.MODE, G.SLOT).catch(() => {}); // la de aquí pasa a ser la más nueva
  },
});

/** Al arrancar: reintentar lo pendiente cuando vuelva la red. */
export function initCloud() {
  addEventListener("online", () => cloudRetry());
}
