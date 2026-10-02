// Arranque del juego: conecta los avisos de core con la interfaz, bucle principal,
// eventos de la ventana y carga de cartas y partida.
import { installTestHooks } from "./debug.js";
import { $, VIS, perfTick } from "./render/canvas.js";
import { DAYLEN, DEFAULT_SETS } from "./core/constants.js";
import { FAILED, loadMany, loadSetList, refreshSetList } from "./core/cards/api.js";
import { FRONT_Y } from "./world/layout.js";
import { G, S, hasState } from "./core/state.js";
import { MUSIC, setMusic, sfx, tone, vibe } from "./audio/sfx.js";
import { SETDEF, indexCards, mkSetDef, offlineCards, setCards } from "./core/cards/sets.js";
import { camFollow, fitCanvas } from "./render/camera.js";
import { cget } from "./core/cards/cache.js";
import { closeM, confetti, openM, renderM } from "./ui/modals.js";
import { coinBurst, fx, heartsAt, shake, starsAt, updFx, updPfx } from "./render/effects.js";
import { custs, updateCusts } from "./core/customers/move.js";
import { draw } from "./render/draw.js";
import { endDay } from "./core/day.js";
import { fmt } from "./core/util.js";
import { hud, setPause } from "./ui/hud.js";
import { importData } from "./ui/screens/more.js";
import { loadOrNew, saveNow } from "./core/save.js";
import { lastSlot, slotKey, useSlot } from "./core/slots.js";
import {
  continueSlot,
  loadDone,
  loadProgress,
  loadStart,
  showTitle,
  startGame,
  titleBackground,
  titleImport,
} from "./ui/title.js";
import { on } from "./core/bus.js";
import { paintNav } from "./ui/nav.js";
import { repv, spMul } from "./core/economy.js";
import { spawn } from "./core/customers/spawn.js";
import { toast } from "./ui/toast.js";
import { tutTick } from "./ui/tutorial.js";
import { updBirds, updPed } from "./render/city.js";
import { updCars, updVCars, updVan } from "./render/cars.js";
import { updCat } from "./render/pets.js";

/* ===================== AVISOS DE CORE (bus) ===================== */
on("toast", (t, o) => toast(t, o));
on("sets", () => {
  if (G.M === "sets") renderM();
});
on("hud", () => hud());
on("renderM", () => renderM());
on("openM", (t) => openM(t));
on("closeM", () => closeM());
on("sfx", (k, ...a) => sfx[k](...a));
on("confetti", (...a) => confetti(...a));
on("medal", (id) => (VIS.medQ = VIS.medQ || []).push(id));
on("vis", (o) => Object.assign(VIS, o));
on("fx", (...a) => fx(...a));
on("coinBurst", (...a) => coinBurst(...a));
on("heartsAt", (...a) => heartsAt(...a));
on("starsAt", (...a) => starsAt(...a));
on("shake", (v) => shake(v));
on("vibe", (p) => vibe(p));
on("tone", (...a) => tone(...a));

/* ===================== BUCLE ===================== */
let last = performance.now(),
  hudT = 0,
  saveT = 0;
function frame(now) {
  const raw = Math.min(0.05, (now - last) / 1000);
  perfTick(raw);
  last = now;
  if (hasState() && (G.TITLE || G.STORY)) {
    // Título o historia: la tienda y la calle siguen vivas (peatones, coches, pájaros), sin juego
    updPed(raw);
    updCars(raw);
    updBirds(raw);
    updVCars(raw);
    draw();
    requestAnimationFrame(frame);
    return;
  }
  if (hasState() && !G.M && !G.paused) {
    const dt = raw * G.speed;
    updFx(dt);
    updPfx(dt);
    updPed(dt);
    updCars(dt);
    updBirds(dt);
    updVan(dt);
    updVCars(dt);
    VIS.drawer = Math.max(0, (VIS.drawer || 0) - dt);
    if (S.phase === "open" || S.phase === "closing") {
      if (S.phase === "open") {
        S.clock += dt;
        G.spawnT -= dt;
        if (G.spawnT <= 0) {
          spawn();
          if (S.burst > 0) {
            S.burst--;
            G.spawnT = 0.8;
          } else {
            const base = 4.2 / (1 + repv() * 0.03) / (1 + S.up.ads * 0.3) / spMul();
            G.spawnT = base * (0.6 + Math.random() * 0.8);
          }
        }
        if (S.clock >= DAYLEN) S.phase = "closing";
      }
      updateCusts(dt);
      if (S.phase === "closing" && !custs.some((c) => c.st !== "leave" || c.y < FRONT_Y + 6)) {
        if (!VIS.endAt) {
          VIS.endAt = performance.now() + 1400;
          sfx.shutter();
        } else if (performance.now() > VIS.endAt) {
          VIS.endAt = 0;
          endDay();
        }
      }
    } else updateCusts(dt);
    hudT += raw;
    saveT += raw;
    if (hudT > 0.25) {
      hudT = 0;
      hud();
    }
    if (saveT > 10) {
      saveT = 0;
      saveNow();
    }
    camFollow(raw);
    updCat(dt);
  }
  if (hasState() && VIS.mShown != null && Math.abs(S.money - VIS.mShown) > 0.004) {
    const d = S.money - VIS.mShown;
    VIS.mShown = Math.abs(d) < 0.02 ? S.money : VIS.mShown + d * Math.min(1, raw * 7);
    const el = $("#money");
    if (el && el.firstChild) {
      el.firstChild.nodeValue = fmt(VIS.mShown);
      if (d > 0.5 && !el.classList.contains("gain")) {
        el.classList.add("gain");
        setTimeout(() => el.classList.remove("gain"), 520);
      }
    }
  }
  if (hasState() && G.M === "mg" && G.MG && G.MG.k === "who" && G.MG.step === "pick") {
    const e = $("#whoimg");
    if (e) e.style.filter = `blur(${Math.max(0, 14 - (performance.now() - G.MG.t0) / 400).toFixed(1)}px) saturate(.6)`;
  }
  if (hasState() && G.M && !G.paused) {
    const d2 = Math.min(0.05, raw) * G.speed;
    updPed(d2);
    updCars(d2);
    updBirds(d2);
    updVan(d2);
    updVCars(d2);
  }
  if (hasState()) draw();
  if (hasState()) tutTick();
  requestAnimationFrame(frame);
}

/* ===================== VENTANA ===================== */
window.addEventListener("beforeunload", () => {
  if (hasState()) saveNow();
});
$("#impfile").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => (G.TITLE ? titleImport(r.result) : importData(r.result));
  r.readAsText(f);
  e.target.value = "";
});
document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.key === "p") && !G.M && hasState() && !/INPUT|TEXTAREA/.test(e.target.tagName)) {
    e.preventDefault();
    setPause(!G.paused);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && hasState() && S.phase !== "closed" && !G.paused) setPause(true);
});

/* ===================== ARRANQUE ===================== */
(function boot() {
  const txt = $("#loadtxt");
  let ids = DEFAULT_SETS;
  // Los tests saltan el título (window.__pcsSkipTitle): el juego arranca directo en la última ranura, como antes
  const skipTitle = !!window.__pcsSkipTitle;
  loadStart();
  useSlot(skipTitle ? lastSlot() : continueSlot() || lastSlot()); // las colecciones que se cargan: las de esa partida
  const sv = cget(slotKey(G.SLOT, "real")) || (G.SLOT === 1 ? cget("pcs-save-real-v2") : null);
  if (sv && sv.sets && sv.sets.length) ids = sv.sets;
  loadSetList()
    .then((list) => {
      if (list) list.forEach(mkSetDef);
      ids = ids.filter((i) => SETDEF.some((d) => d.id === i));
      if (!ids.length) ids = DEFAULT_SETS;
      txt.textContent = "Cargando " + ids.length + " colecciones con precios de Cardmarket…";
      loadProgress(0, ids.length);
      return loadMany(ids, (d, n, sd) => {
        txt.textContent = `Cargando colecciones ${d}/${n} · ${sd.n}…`;
        loadProgress(d, n);
      });
    })
    .then((all) => {
      if (all.length < 100) throw 0;
      setCards(all);
      G.MODE = "real";
      G.NOTE = FAILED.size
        ? `⚠️ ${FAILED.size} colección(es) sin cargar: Más → Colecciones → Reintentar`
        : "Precios reales de Cardmarket";
    })
    .catch(() => {
      if (cget(slotKey(G.SLOT, "real")))
        return new Promise((res) => {
          $("#load").innerHTML =
            `<div><h2>No se pudieron cargar las cartas</h2><p class="mu">La API de cartas no responde ahora mismo. Tu partida está guardada y no se pierde.</p><div class="btns" style="justify-content:center"><button class="b pri" id="lretry">Reintentar</button><button class="b" id="loff">Jugar sin conexión (partida aparte)</button></div></div>`;
          $("#lretry").onclick = () => location.reload();
          $("#loff").onclick = () => {
            setCards(offlineCards());
            G.MODE = "offline";
            G.NOTE = "Sin conexión: partida aparte con cartas ilustradas";
            res();
          };
        });
      setCards(offlineCards());
      G.MODE = "offline";
      G.NOTE = "Sin conexión con la API: cartas ilustradas y precios simulados";
    })
    .then(() => {
      indexCards();
      return loadDone(skipTitle);
    })
    .then(() => {
      if (skipTitle) loadOrNew();
      else titleBackground();
      paintNav();
      fitCanvas();
      setMusic(MUSIC);
      hud();
      requestAnimationFrame(frame);
      refreshSetList(false);
      if (skipTitle) startGame();
      else showTitle();
    });
})();

/* ===================== ACCESO PARA LOS TESTS ===================== */
// Todos los módulos, para que los tests encuentren cada nombre en el suyo (window.__pcs).
const modules = Object.values(
  import.meta.glob(
    ["./core/**/*.js", "./world/**/*.js", "./render/**/*.js", "./ui/**/*.js", "./audio/**/*.js", "./story/**/*.js"],
    {
      eager: true,
    },
  ),
);
installTestHooks(G, modules);
