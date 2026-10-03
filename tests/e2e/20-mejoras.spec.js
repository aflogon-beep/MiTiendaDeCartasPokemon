import { test, expect, openGame, game, closeModals } from "./helpers.js";
import { readFileSync } from "node:fs";

// Mejoras tras la Fase I: funda de plástico en las cartas gradeadas y aviso de versión nueva.
const SAVE = JSON.parse(readFileSync(new URL("../fixtures/partida-v22.json", import.meta.url), "utf8")).S;
const vite = (info) => test.skip(info.project.name !== "vite", "solo existe en la versión de Vite");

test("20a · Las cartas gradeadas salen en su funda, con la nota en la etiqueta", async ({ page, gamePath }, info) => {
  vite(info);
  await openGame(page, gamePath, { save: SAVE });
  await page.waitForTimeout(1800);
  await closeModals(page);
  const name = await game(page, (P) => {
    P.S.items.forEach((i) => delete i.gr);
    const it = P.S.items.find((i) => P.BYID[i.c] && !i.gq);
    it.gr = 9;
    P.G.cSort = "val";
    P.collSel = null;
    P.openM("coll");
    return P.BYID[it.c].name;
  });
  // En la colección: una sola funda, con «PGS 9»
  await expect(page.locator("#ovh .tile .slabm")).toHaveCount(1);
  await expect(page.locator("#ovh .tile .slabm-lb")).toHaveText("PGS9");
  // En la ficha de la carta: la funda completa, con nombre, nota, certificado y código de barras
  await game(page, (P) => {
    P.collSel = P.gk(P.S.items.find((i) => i.gr));
    P.openM("card");
  });
  await expect(page.locator("#cbig.gr .slab.g9 .slab-lb b")).toHaveText(name);
  await expect(page.locator("#cbig .slab .gnum")).toHaveText("9");
  await expect(page.locator("#cbig .slab .gtx")).toHaveText("MINT");
  await expect(page.locator("#cbig .slab .slab-cert")).toContainText(/Cert\. \d{4} \d{4}/);
  await expect(page.locator("#cbig .slab .slab-bar")).toHaveCount(1);
  // La funda se inclina con el dedo, como la carta (es la que mueve la inclinación 3D)
  expect(await game(page, (P) => P.TILT.el === document.querySelector("#cbig .slab"))).toBe(true);
  // Una GEM MINT 10 lleva etiqueta dorada, también en la colección
  await game(page, (P) => {
    P.S.items.find((i) => i.gr).gr = 10;
    P.openM("coll");
  });
  await expect(page.locator("#ovh .tile .slabm.g10")).toHaveCount(1);
  // Una carta sin gradear no lleva funda
  await game(page, (P) => {
    P.collSel = P.gk(P.S.items.find((i) => !i.gr && P.BYID[i.c]));
    P.openM("card");
  });
  await expect(page.locator("#cbig .slabm")).toHaveCount(0);
});

test("20b · Versión nueva: aviso con «Actualizar», que guarda la partida antes de recargar", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath, { save: SAVE });
  await game(page, (P) => {
    window.__updated = 0;
    P.S.money = 4321;
    P.showUpdate(() => (window.__updated = 1)); // lo mismo que pide el service worker cuando hay versión nueva
  });
  const u = page.locator("#upd");
  await expect(u).toContainText("Hay una versión nueva del juego");
  await u.locator("#updgo").click();
  expect(await page.evaluate(() => window.__updated)).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-save-real-v3")).money)).toBe(4321);
  // «Más tarde» lo cierra
  await game(page, (P) => P.showUpdate(() => {}));
  await page.locator("#updno").click();
  await expect(page.locator("#upd")).toHaveCount(0);
});

test("20c · Vibración: interruptor en Ajustes (activada por defecto; apagada, no vibra)", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await page.addInitScript(() => {
    window.__vib = [];
    Object.defineProperty(navigator, "vibrate", { value: (p) => (window.__vib.push(p), true), configurable: true });
  });
  await openGame(page, gamePath);
  await closeModals(page);
  await page.locator('#nav [data-k="more"]').click();
  const btn = page.locator('#ovh [data-a="vibtog"]');
  await expect(btn).toContainText("Vibración: sí");
  await game(page, (P) => P.vibe(30));
  expect(await page.evaluate(() => window.__vib)).toEqual([30]);
  // Apagada: se guarda y no vibra
  await btn.click();
  await expect(btn).toContainText("Vibración: no");
  expect(await page.evaluate(() => localStorage.getItem("pcs-vibe"))).toBe("0");
  await game(page, (P) => P.vibe([60, 40, 140]));
  expect(await page.evaluate(() => window.__vib)).toEqual([30]);
  // Al volver a encenderla, vibra un momento para que se note
  await btn.click();
  await expect(btn).toContainText("Vibración: sí");
  expect(await page.evaluate(() => window.__vib)).toEqual([30, 40]);
});

test("20d · Álvaro en la caja con lo elegido en Personalizar; «su pelo» y «sin gorra»", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await closeModals(page);
  // Partidas de antes: S.me trae los colores por defecto copiados; solo cuenta lo que no es el de por defecto
  const mig = await game(page, (P) => {
    P.S.me = { shirt: "#e3350d", hair: "#222", cap: "#e3350d", hs: 0 };
    const a = P.meSetOf();
    P.S.me = { shirt: "#2fa557", hair: "#222", cap: "#8e4cb5", hs: 0 };
    const b = P.meSetOf();
    delete P.S.me;
    return [a, b];
  });
  expect(mig).toEqual([{}, { shirt: "#2fa557", cap: "#8e4cb5" }]);
  // Personalizar: la vista previa es Álvaro; por defecto, su camiseta azul, su pelo y sin gorra
  await game(page, (P) => P.openM("custom"));
  await expect(page.locator('#ovh img[src^="data:image/png"]')).toHaveCount(1);
  await expect(page.locator('#ovh .swc.on[data-k="shirt"]')).toHaveAttribute("data-n", "#3f7fc4");
  await expect(page.locator('#ovh .swc.on[data-k="hair"]')).toHaveAttribute("aria-label", "Su pelo");
  await expect(page.locator('#ovh .swc.on[data-k="cap"]')).toHaveAttribute("aria-label", "Sin gorra");
  const before = await page.locator("#ovh img").getAttribute("src");
  // Elegir gorra verde y luego quitarla
  await page.locator('#ovh .swc[data-k="cap"][data-n="#2fa557"]').click();
  expect(await game(page, (P) => P.S.meSet)).toEqual({ cap: "#2fa557" });
  expect(await page.locator("#ovh img").getAttribute("src")).not.toBe(before);
  expect(await game(page, (P) => P.alvaroLook().cap)).toBe("#2fa557");
  await page.locator('#ovh .swc[data-k="cap"][aria-label="Sin gorra"]').click();
  expect(await game(page, (P) => [P.S.meSet.cap, P.alvaroLook().cap, P.S.me.cap])).toEqual(["", null, "#2fa557"]);
  expect(await page.locator("#ovh img").getAttribute("src")).toBe(before);
});

test("20e · Emma: junto al ordenador; sin clientes y con sofá, al sofá; vuelve cuando entra alguien", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await closeModals(page);
  const at = () => game(page, (P) => P.EMMA.at);
  // Sin sofá: siempre en la mesa
  await game(page, (P) => {
    P.S.decor.sofa = 0;
    P.custs.length = 0;
    P.speed = 4;
  });
  await page.waitForTimeout(2500);
  expect(await at()).toBe("desk");
  // Con sofá y sin clientes: va al sofá sin pisar muebles
  await game(page, (P) => {
    P.S.decor.sofa = 1;
    window.__emma = { bad: 0, n: 0 };
    const tick = () => {
      const E = P.EMMA;
      if (E.at === "walk") {
        window.__emma.n++;
        if (P.navObstacles().some(([x0, y0, x1, y1]) => E.x > x0 && E.x < x1 && E.y > y0 && E.y < y1))
          window.__emma.bad++;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await expect.poll(at, { timeout: 15_000 }).toBe("sofa");
  // Entra un cliente: vuelve a la mesa
  await game(page, (P) => {
    P.S.phase = "open";
    P.spawn();
  });
  await expect.poll(at, { timeout: 15_000 }).toBe("desk");
  const w = await page.evaluate(() => window.__emma);
  expect(w.n).toBeGreaterThan(10);
  expect(w.bad).toBe(0);
});

test("20f · Con cajero, el cajero se pone en la caja y Álvaro pasea por la tienda; sin cajero, vuelve a la caja", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await openGame(page, gamePath);
  await closeModals(page);
  const st = () => game(page, (P) => P.ALVARO.at);
  expect(await st()).toBe("till");
  await game(page, (P) => {
    P.S.staff.cashier = 1; // primero sin muebles (la cuadrícula aún no está hecha)
    P.speed = 4;
    window.__alv = { bad: [], spots: 0 };
    let was = "";
    const tick = () => {
      const A = P.ALVARO;
      // Fuera de la zona de detrás del mostrador, nunca dentro de un mueble
      if (A.at === "walk" && !(A.x >= 712 && A.y <= 484))
        for (const [x0, y0, x1, y1] of P.navObstacles())
          if (A.x > x0 && A.x < x1 && A.y > y0 && A.y < y1) window.__alv.bad.push([Math.round(A.x), Math.round(A.y)]);
      if (A.at === "stay" && was !== "stay" && A.y < 484 && A.x < 712) window.__alv.spots++;
      was = A.at;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await expect.poll(() => page.evaluate(() => window.__alv.spots), { timeout: 30_000 }).toBeGreaterThanOrEqual(1);
  await game(page, (P) => P.DECOR.forEach((d) => (P.S.decor[d.k] = 1)));
  await expect.poll(() => page.evaluate(() => window.__alv.spots), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
  // Sin cajero, vuelve a la caja
  await game(page, (P) => (P.S.staff.cashier = 0));
  await expect.poll(st, { timeout: 30_000 }).toBe("till");
  expect(await game(page, (P) => [P.ALVARO.x, P.ALVARO.y])).toEqual([748, 330]);
  expect(await page.evaluate(() => window.__alv.bad)).toEqual([]);
  expect(errs).toEqual([]);
});
