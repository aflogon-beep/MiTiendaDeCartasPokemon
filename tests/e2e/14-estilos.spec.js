import { test, expect, openGame, game, closeModals } from "./helpers.js";
import { readFileSync } from "node:fs";

// Compara los estilos calculados (getComputedStyle, también ::before y ::after) de todos los elementos
// de la interfaz entre la versión de Vite y el HTML de referencia, en muchas pantallas y dos tamaños.
// Sirve para reorganizar el CSS con la garantía de que nada cambia de aspecto.

const SAVE = JSON.parse(readFileSync(new URL("../fixtures/partida-v22.json", import.meta.url), "utf8")).S;
// Sin «init» en los sobres, las dos versiones fijan el mismo precio de mayorista al cargar (la referencia
// lo recalcula siempre; Vite solo si no lo tenía: docs/pendientes.md §2). Así se compara solo el aspecto.
Object.values(SAVE.pack).forEach((p) => delete p.init);
const REF = "http://localhost:4317/reference/pokemon-card-shop-v22.html";
const VITE = "http://localhost:4318/";

// Azar con semilla y animaciones congeladas: así las dos páginas pintan lo mismo
const DETERMINISTA = () => {
  let s = 12345;
  Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent =
      "*,*::before,*::after{animation-play-state:paused!important;animation-delay:0s!important;transition:none!important}";
    document.head.appendChild(st);
  });
};

// Pantallas: cada una prepara el estado con P (= window.__pcs) y abre lo que haga falta.
const card0 = (P) => P.BYID[P.S.items.find((i) => P.BYID[i.c]).c];
const SCREENS = {
  "tienda cerrada": (P) => P.closeM(),
  Stock: (P) => P.openM("packs"),
  "Stock · sellado": (P) => ((P.pTab = "sealed"), (P.pF = "all"), P.openM("packs")),
  "Stock · accesorios": (P) => ((P.pTab = "acc"), (P.pF = "all"), P.openM("packs")),
  Cartas: (P) => ((P.pTab = "packs"), (P.pF = "all"), P.openM("coll")),
  "ficha de carta": (P) => (
    (P.collSel = P.gk(P.S.items.find((i) => P.BYID[i.c]))),
    (P.VIS.cMore = true),
    P.openM("card")
  ),
  Álbum: (P) => P.openM("album"),
  Gradeo: (P) => P.openM("grading"),
  Tareas: (P) => P.openM("tasks"),
  Medallas: (P) => P.openM("medals"),
  Historia: (P) => P.openM("story"),
  Juegos: (P) => P.openM("games"),
  Más: (P) => P.openM("more"),
  Colecciones: (P) => P.openM("sets"),
  Mejoras: (P) => P.openM("up"),
  Personalizar: (P) => P.openM("custom"),
  Estadísticas: (P) => P.openM("stats"),
  Trofeos: (P) => P.openM("trophy"),
  Partida: (P) => P.openM("backup"),
  Avisos: (P) => P.openM("notes"),
  Consejos: (P) => P.openM("tips"),
  Dificultad: (P) => P.openM("diff"),
  Mercado: (P) => P.openM("mkt"),
  Ampliar: (P) => P.openM("annex"),
  Banco: (P) => P.openM("bank"),
  Rival: (P) => P.openM("rival"),
  "ticket del día": (P) => P.openM("sum"),
  Regalo: (P) => ((P.S.gift = { last: "", streak: 3, set: "mew", bonus: 15 }), P.openM("gift")),
  "caja · efectivo": (P) => (
    (P.CK = {
      c: { type: "kid", hold: { k: "pack", s: "mew", qty: 2, total: 9 } },
      tc: 900,
      m: "cash",
      given: [100, 50],
      typed: "",
      st: "pay",
      msg: "",
      paid: 1000,
      say: "Aquí tienes 💶",
    }),
    P.openM("ck")
  ),
  "caja · tarjeta": (P) => (
    (P.CK = {
      c: { type: "whale", hold: { k: "pack", s: "mew", qty: 3, total: 13.5 } },
      tc: 1350,
      m: "card",
      given: [],
      typed: "135",
      st: "pay",
      msg: "",
      say: "Con tarjeta 💳",
    }),
    P.openM("ck")
  ),
  Regateo: (P, c) => (
    (P.HG = {
      c: { hold: { it: P.S.items.find((i) => P.BYID[i.c]), total: 10 } },
      full: 10,
      offer: 8,
      max: 9,
      x: 9,
      tries: 0,
      msg: "¿Me la dejas en 8 €?",
    }),
    P.openM("hag")
  ),
  "comprar carta": (P) => (
    (P.deal = {
      reg: null,
      fake: false,
      chk: false,
      c: P.BYID["sv3pt5-55"],
      k: "NM",
      rv: false,
      val: 5,
      ask: 4,
      floor: 3,
      tries: 0,
      offer: 3.5,
      msg: "Mmm…",
      counter: 3.2,
      cust: {},
    }),
    P.openM("sell")
  ),
  Examinar: (P) => (
    (P.INSP = {
      c: P.BYID["sv3pt5-55"],
      rv: false,
      fake: true,
      src: "coll",
      tells: ["lens", "light"],
      wt: 1.55,
      mode: "lens",
    }),
    P.openM("insp")
  ),
  "Examinar · balanza": (P) => (
    (P.INSP = {
      c: P.BYID["sv3pt5-55"],
      rv: false,
      fake: true,
      src: "coll",
      tells: ["lens", "scale"],
      wt: 1.55,
      mode: "scale",
      seen: { lens: 1 },
    }),
    P.openM("insp")
  ),
  Lote: (P) => (
    (P.LOT = {
      c: null,
      n: 50,
      cards: Array.from({ length: 50 }, (_, i) => P.BYID[`sv3-${1 + i}`]).map((c) => ({ c, k: "NM", rv: false, v: 1 })),
      v: 50,
      ask: 30,
      floor: 25,
      rev: [0, 1, 2],
      expert: false,
      lo: 20,
      hi: 80,
      tries: 0,
      msg: "Por menos no.",
      offer: 30,
      done: false,
      counter: 26,
      free: false,
    }),
    P.openM("lot")
  ),
  Intercambio: (P) => (
    (P.TRD = { c: { reg: "lucia" }, mine: P.S.items.find((i) => P.BYID[i.c]).i, give: "sv3-50", say: "¿Cambiamos?" }),
    P.openM("trade")
  ),
  "oferta por trofeo": (P) => (
    (P.TOF = { c: {}, it: P.S.items.find((i) => P.BYID[i.c]), price: 10 }),
    P.openM("toffer")
  ),
  "sobres · resumen": (P) => (
    (P.openState = {
      s: "mew",
      n: 10,
      val: 12,
      cards: Array.from({ length: 12 }, (_, i) => P.BYID[`sv3pt5-${40 + i}`]).map((c) => ({ c, rv: false, nw: true })),
      total: 100,
      quick: true,
      mode: "sum",
    }),
    P.openM("open")
  ),
  "sobre · abrir": (P) => (
    (P.openState = {
      s: "mew",
      n: 1,
      val: 5,
      cards: Array.from({ length: 10 }, (_, i) => P.BYID[`sv3pt5-${1 + i}`]).map((c) => ({ c, rv: false, nw: false })),
      total: 10,
      idx: 0,
      mode: "seq",
      phase: "pack",
      run: 0,
      tp: 0,
      tb: 0,
      tstep: 0,
      torn: false,
      rev: false,
    }),
    P.openM("open")
  ),
  "nueva categoría": (P) => ((P.VIS.showTier = 2), P.openM("tierup")),
  "nueva medalla": (P) => ((P.VIS.showMed = "roca"), P.openM("medal")),
  "texto grande": (P) => ((P.S.ui = { big: true, calm: true }), P.applyUI(), P.openM("coll")),
  "tienda abierta": (P) => (
    (P.S.ui = {}),
    P.applyUI(),
    P.closeM(),
    (P.S.phase = "open"),
    (P.S.clock = 30),
    P.setPause(true),
    P.hud()
  ),
  tutorial: (P) => (P.setPause(false), (P.S.phase = "closed"), (P.S.tut = { on: true, i: 2 }), P.hud()),
};
const ROOTS = ["#game", "#nav", "#ovh", "#tut", "#zv"];

// Recorre los elementos y devuelve, por ruta, un resumen (hash) de todos sus estilos calculados
const collect = (roots) => {
  const props = [...getComputedStyle(document.documentElement)].sort(); // ordenadas: el orden de las variables depende de la hoja
  const h = (s) => {
    let x = 5381;
    for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0;
    return x.toString(36);
  };
  const out = {};
  // Las variables CSS (--x) guardan su valor tal cual se escribió: se comparan con las comillas y los espacios
  // normalizados (el minificador de Vite reescribe 'Fredoka' como "Fredoka" y las hojas formateadas
  // llevan espacios tras las comas, que no cambian nada).
  const val = (cs, p) => {
    const v = cs.getPropertyValue(p);
    return p.startsWith("--")
      ? v
          .replace(/'/g, '"')
          .replace(/\s+/g, " ")
          .replace(/\s*([,()])\s*/g, "$1")
          .trim()
      : v;
  };
  const style = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo);
    if (pseudo && (cs.content === "none" || cs.content === "normal")) return "";
    return props.map((p) => val(cs, p)).join("|");
  };
  const walk = (el, path) => {
    out[path] = h(style(el) + "§" + style(el, "::before") + "§" + style(el, "::after"));
    [...el.children].forEach((c, i) => walk(c, `${path}>${c.tagName.toLowerCase()}${c.id ? "#" + c.id : ""}:${i}`));
  };
  for (const r of roots) {
    const el = document.querySelector(r);
    if (el) walk(el, r);
  }
  out["html"] = h(style(document.documentElement) + style(document.body));
  return out;
};
// Para una ruta concreta: qué propiedades cambian
const detail = ([path]) => {
  const parts = path.split(">");
  let el = document.querySelector(parts[0]);
  for (const p of parts.slice(1)) el = el && el.children[+p.split(":").pop()];
  if (!el) return null;
  const cs = getComputedStyle(el),
    o = {};
  for (const p of cs) {
    const v = cs.getPropertyValue(p);
    o[p] = p.startsWith("--")
      ? v
          .replace(/'/g, '"')
          .replace(/\s+/g, " ")
          .replace(/\s*([,()])\s*/g, "$1")
          .trim()
      : v;
  }
  const r = el.getBoundingClientRect(),
    pr = el.parentElement.getBoundingClientRect();
  return { cls: el.className, o, box: [r.left - pr.left, r.width].join() };
};

async function prepare(page, url) {
  await openGame(page, url, { save: SAVE, init: DETERMINISTA });
  await page.clock.setFixedTime(new Date("2026-03-10T10:00:00+01:00"));
  await page.waitForTimeout(1800); // regalo diario
  await closeModals(page);
  await game(page, (P) => ((P.S.season = "spring"), P.hud()));
  // Personalizar: en Vite marca lo elegido para Álvaro (S.meSet); con los colores del tendero de siempre,
  // las dos versiones marcan los mismos (lo nuevo, «su pelo» y «sin gorra», lleva data-fase="I")
  await game(page, (P) => {
    try {
      P.meSetOf; // solo existe en Vite (en la referencia, ReferenceError)
    } catch (e) {
      return;
    }
    const m = P.meCfg();
    P.S.meSet = { shirt: m.shirt, hair: m.hair, cap: m.cap };
    P.G.noLocks = true; // colecciones por nivel (core/unlocks.js): sin candados, como en el original
  });
  await page.waitForTimeout(600);
  await closeModals(page); // por si el HUD abre una celebración de categoría
}

for (const [w, h] of [
  [390, 844],
  [1024, 768],
]) {
  test(`14 · Estilos iguales que la referencia (${w}×${h})`, async ({ browser }, info) => {
    test.skip(info.project.name !== "vite", "compara las dos versiones a la vez: solo hace falta una vez");
    test.setTimeout(240_000);
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      hasTouch: true,
      locale: "es-ES",
      timezoneId: "Europe/Madrid",
    });
    const ref = await ctx.newPage(),
      vite = await ctx.newPage();
    await prepare(ref, REF);
    await prepare(vite, VITE);
    const diffs = [];
    let elements = 0;
    for (const [name, setup] of Object.entries(SCREENS)) {
      const run = async (page) => {
        await game(page, (P, src) => (0, eval)(`(${src})`)(P), setup.toString());
        await page.waitForTimeout(600);
        // La inclinación de cartas y sobres la anima JavaScript con el tiempo: se congela antes de comparar
        await game(page, (P) => {
          // Lo nuevo de la Fase I (no existe en la referencia) se quita antes de comparar
          document.querySelectorAll("[data-fase]").forEach((e) => e.remove());
          // Mejoras pedidas en elementos de siempre (data-mejora y el texto de ayuda oculto con la tienda
          // abierta): se quitan para comparar lo de siempre con la referencia
          document.querySelectorAll("[data-mejora]").forEach((e) => e.removeAttribute("data-mejora"));
          document.documentElement.classList.remove("no-hint", "ux");
          // Textos que la Fase I cambia a propósito (Carla → Emma): el mismo texto en las dos para comparar estilos
          document.querySelectorAll("#tut .tbub b, #tut .tbub p").forEach((e) => (e.textContent = "Fase I"));
          P.TILT.el = null;
          document
            .querySelectorAll("[style*='--rx'],[style*='--mx']")
            .forEach((e) => ["--rx", "--ry", "--mx", "--my"].forEach((v) => e.style.removeProperty(v)));
        });
        await page.waitForTimeout(150); // el tutorial recoloca su bocadillo en el fotograma siguiente
        return page.evaluate(collect, ROOTS);
      };
      const a = await run(ref),
        b = await run(vite);
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      elements += keys.size;
      for (const k of keys) {
        if (a[k] === b[k]) continue;
        if (!(k in a) || !(k in b)) {
          diffs.push(`${name}: ${k} solo en ${k in a ? "referencia" : "vite"}`);
          continue;
        }
        if (diffs.length >= 40) {
          diffs.push(`${name}: ${k}`);
          continue;
        }
        const [da, db] = [await ref.evaluate(detail, [k]), await vite.evaluate(detail, [k])];
        const props = da && db ? Object.keys(da.o).filter((p) => da.o[p] !== db.o[p]) : ["(pseudo-elemento)"];
        // Con «margin: auto», Chrome a veces informa 0px en vez del margen calculado (en la referencia y
        // en Vite por igual). Si solo cambian los márgenes laterales y la caja está en el mismo sitio, es igual.
        if (
          props.length &&
          props.every((p) => /^margin-(left|right|inline-start|inline-end)$/.test(p)) &&
          da.box === db.box
        )
          continue;
        diffs.push(
          `${name}: ${k} (.${da && da.cls}) → ${
            props
              .slice(0, 6)
              .map((p) => `${p}: ${da && da.o[p]} ≠ ${db && db.o[p]}`)
              .join("; ") || "::before/::after"
          }`,
        );
      }
      await closeModals(ref);
      await closeModals(vite);
    }
    console.log(
      `${w}×${h}: ${Object.keys(SCREENS).length} pantallas, ${elements} elementos comparados, ${diffs.length} diferencias`,
    );
    expect(diffs.slice(0, 40)).toEqual([]);
    expect(elements).toBeGreaterThan(3000);
    await ctx.close();
  });
}
