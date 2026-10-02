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
