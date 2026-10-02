// Utilidades comunes de los tests del juego en el navegador.
import { test as base, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { apiResponse, setIdOfUrl } from "../fixtures/api.js";

const PNG = readFileSync(new URL("../fixtures/carta.png", import.meta.url));
const ALLOWED_HOSTS = ["api.pokemontcg.io", "images.pokemontcg.io", "fonts.googleapis.com", "fonts.gstatic.com"];

export const test = base.extend({
  gamePath: ["/reference/pokemon-card-shop-v22.html", { option: true }],
});
export { expect };

/*
 * Acceso a las variables del juego desde los tests: window.__pcs.
 * En el HTML de referencia las variables son globales de un <script> clásico, así que
 * se leen y escriben con eval indirecto (ámbito global). La versión de Vite tendrá
 * que exponer el mismo objeto (window.__pcs) para que estos tests sigan valiendo.
 *   __pcs.S.money        → leer
 *   __pcs.speed = 8      → escribir (solo los tests aceleran así el reloj del juego)
 *   __pcs.spawn()        → llamar
 */
const HOOKS = () => {
  if (window.__pcs) return;
  window.__pcs = new Proxy(
    {},
    {
      get(_, n) {
        if (typeof n !== "string") return undefined;
        return (0, eval)(n);
      },
      set(_, n, v) {
        window.__pcsV = v;
        (0, eval)(`${n}=window.__pcsV`);
        delete window.__pcsV;
        return true;
      },
    },
  );
};

/** Intercepta la red: API simulada, imágenes genéricas, fuentes vacías. Bloquea todo lo demás. */
export async function mockNetwork(page, opts = {}) {
  const api = {
    failSets: new Set(opts.failSets || []), // ids de API cuyos /cards devuelven 500
    failList: !!opts.failList, // /sets devuelve 500
    calls: [], // URLs pedidas a la API
    foreign: [], // peticiones a hosts no permitidos
  };
  await page.route("**/*", (route) => {
    const url = route.request().url();
    const host = new URL(url).hostname;
    if (host === "localhost" || host === "127.0.0.1") return route.continue();
    if (!ALLOWED_HOSTS.includes(host)) {
      api.foreign.push(url);
      return route.abort();
    }
    if (host === "api.pokemontcg.io") {
      api.calls.push(url);
      const cors = { "access-control-allow-origin": "*" };
      const isList = /\/v2\/sets/.test(url);
      if ((isList && api.failList) || (!isList && api.failSets.has(setIdOfUrl(url))))
        return route.fulfill({ status: 500, headers: cors, body: "fallo simulado" });
      const r = apiResponse(url);
      if (!r) return route.fulfill({ status: 404, headers: cors, body: "{}" });
      return route.fulfill({
        status: r.status,
        headers: cors,
        contentType: "application/json",
        body: JSON.stringify(r.body),
      });
    }
    if (host === "images.pokemontcg.io") return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
    if (host === "fonts.googleapis.com") return route.fulfill({ status: 200, contentType: "text/css", body: "" });
    return route.fulfill({ status: 200, body: "" });
  });
  return api;
}

/** Recoge errores de consola y de página. */
export function collectErrors(page) {
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

/**
 * Abre el juego con la API simulada.
 * opts.save: objeto S para dejar guardado antes de arrancar (partida "real").
 * opts.api: opciones de mockNetwork.
 * opts.init: función extra que se ejecuta antes que el juego (addInitScript).
 */
export async function openGame(page, gamePath, opts = {}) {
  const api = await mockNetwork(page, opts.api);
  page.on("dialog", (d) => d.accept());
  await page.addInitScript(HOOKS);
  if (opts.save) {
    await page.addInitScript((js) => {
      if (sessionStorage.getItem("__seeded")) return;
      localStorage.setItem("pcs-save-real-v3", js);
      sessionStorage.setItem("__seeded", "1");
    }, JSON.stringify(opts.save));
  }
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(gamePath);
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S, null, { timeout: 60_000 });
  return api;
}

/** Espera al regalo diario (sale 1,5 s después de arrancar si no hay tutorial) y lo cierra. */
export async function settle(page) {
  await page.waitForTimeout(1800);
  await closeModals(page);
}

/** Salta el tutorial con su propio botón (acepta el confirm). */
export async function skipTutorial(page) {
  await page.locator("#tskip").click();
  await expect(page.locator("#tut")).toHaveCount(0);
  await settle(page);
}

/** Cierra paneles abiertos (regalo, medallas, nueva categoría…) hasta que no quede ninguno. */
export async function closeModals(page) {
  for (let i = 0; i < 10; i++) {
    const m = await page.evaluate(() => window.__pcs.M);
    if (!m) return;
    await page.evaluate(() => {
      const P = window.__pcs;
      if (["tierup", "medal", "grev", "boxo", "open"].includes(P.M)) P.closeM();
      else P.A.close();
    });
    await page.waitForTimeout(50);
  }
}

/** Cierra las celebraciones a pantalla completa (medalla, nueva categoría) con su botón. */
export async function dismissCelebrations(page) {
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    const b = page.locator("#medok, #tierok");
    if (!(await b.count())) return;
    await b.first().click();
    await page.waitForTimeout(300);
  }
}

/**
 * Cierra con la interfaz cualquier panel informativo que haya saltado solo
 * (historia, regalo, medalla, nueva categoría…). No toca los que piden decidir algo.
 */
export async function dismissInfo(page) {
  await dismissCelebrations(page);
  const m = await page.evaluate(() => window.__pcs.M);
  if (!m || ["sell", "lot", "trade", "ck", "hag", "insp", "toffer"].includes(m)) return m;
  const big = page.locator('#ovh .sheet > [data-a="close"].big');
  if (await big.count()) await big.click();
  await dismissCelebrations(page);
  return page.evaluate(() => window.__pcs.M);
}

/** Partida nueva sin tutorial lista para jugar: devuelve S. */
export async function freshGame(page, gamePath, opts = {}) {
  const api = await openGame(page, gamePath, opts);
  await skipTutorial(page);
  return api;
}

/** Ejecuta código con acceso a las variables del juego: fn(P, arg). */
export const game = (page, fn, arg) =>
  page.evaluate(([src, a]) => (0, eval)(`(${src})`)(window.__pcs, a), [fn.toString(), arg]);

/** Coordenadas de pantalla (página) de un punto del mundo del juego. */
export async function worldToPage(page, x, y) {
  const p = await page.evaluate(
    ([x, y]) => {
      const V = window.__pcs.VIEW,
        r = window.__pcs.CV.getBoundingClientRect();
      return { x: r.left + x * V.s + V.ox, y: r.top + y * V.s + V.oy };
    },
    [x, y],
  );
  return p;
}
