// Partida en la nube (docs/nube.md): pantalla ☁️ Nube (entrar, crear cuenta, subir, copias, salir), subida al
// terminar el día, reintento de lo pendiente al volver la red y aviso al entrar en una partida si en la nube hay
// una copia que no salió de este dispositivo. La parte que habla con Supabase está en core/cloud.js.
import { A } from "./actions.js";
import { G, S, ensure, hasState, replaceState } from "../core/state.js";
import { closeM, openM, renderM } from "./modals.js";
import { CL, work } from "./screens/cloud.js";
import { custs, queue } from "../core/customers/move.js";
import { hud } from "./hud.js";
import { loadSetsFor } from "../core/cards/api.js";
import { releaseHolds, saveNow } from "../core/save.js";
import { slotKey } from "../core/slots.js";
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
  syncedId,
} from "../core/cloud.js";

const form = () => [document.querySelector("#cldu")?.value || "", document.querySelector("#cldp")?.value || ""];
/** El botón «☁️ Nube: …» de los ajustes del título, al día con la cuenta. */
function titleTile() {
  const t = document.querySelector('#title [data-k="cloud"]');
  if (t && t.lastChild) t.lastChild.textContent = "Nube: " + (cloudUser() || "sin cuenta");
}
function afterLogin(u) {
  titleTile();
  toast(`☁️ Hola, ${u}`);
  CL.list = null;
  if (hasState() && !G.TITLE) setTimeout(cloudCheck, 300);
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
/** Al terminar el día (main.js): se guarda y se sube. */
export function cloudDayEnd() {
  if (!cloudOn() || !cloudUser() || !hasState()) return;
  saveNow();
  const [m, n] = [G.MODE, G.SLOT];
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

/* ---------- Al entrar en una partida: ¿hay otra en la nube? ---------- */
/** Si la copia más nueva de la nube no salió de aquí, pregunta cuál se queda. */
export async function cloudCheck(tries = 0) {
  if (!cloudOn() || !cloudUser() || !hasState() || G.TITLE) return;
  await cloudRetry();
  let r;
  try {
    r = await cloudLatest(G.MODE, G.SLOT);
  } catch (e) {
    return; // sin red: se mirará la próxima vez
  }
  if (!r) {
    // Nada en la nube para esta ranura: se sube la de aquí
    uploadSlot(G.MODE, G.SLOT).catch(() => {});
    return;
  }
  if (r.id === syncedId(G.MODE, G.SLOT)) return;
  if (G.M || G.STORY) {
    if (tries < 40) setTimeout(() => cloudCheck(tries + 1), 3000);
    return;
  }
  CL.other = r;
  openM("cloudnew");
}
Object.assign(A, {
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
    CL.list = null;
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
