import { test, expect, openGame, collectErrors, game } from "./helpers.js";

test("1 · Arranque: carga los 3 sets por defecto sin errores de consola", async ({ page, gamePath }, info) => {
  const errors = collectErrors(page);
  const api = await openGame(page, gamePath);

  const st = await game(page, (P) => ({
    mode: P.MODE,
    sets: P.SETS.map((s) => s.id),
    cards: P.CARDS.length,
    failed: P.FAILED.size,
    tut: P.S.tut.on,
    money: P.S.money,
    day: P.S.day,
  }));
  expect(st.mode).toBe("real");
  expect(st.sets).toEqual(["mew", "pre", "obf"]);
  expect(st.cards).toBe(183);
  expect(st.failed).toBe(0);
  expect(st.tut).toBe(true);
  expect(st.money).toBe(1000);
  expect(st.day).toBe(1);

  // Interfaz básica visible
  await expect(page.locator("#lv")).toContainText("Nivel 1 · Día 1");
  await expect(page.locator("#hint")).toContainText("Precios reales de Cardmarket");
  // La guía del tutorial: Carla en la referencia; Emma desde la Fase I
  if (info.project.name === "vite") {
    await expect(page.locator("#tut .tbub b")).toHaveText("Emma");
    await expect(page.locator("#tut")).toContainText("Vale, hermanito");
  } else await expect(page.locator("#tut")).toContainText("Soy Carla");

  // Pidió las cartas de los 3 sets y la lista de colecciones
  for (const id of ["sv3pt5", "sv8pt5", "sv3"])
    expect(api.calls.some((u) => decodeURIComponent(u).includes(`set.id:${id}`))).toBe(true);
  await expect.poll(() => api.calls.some((u) => u.includes("/v2/sets"))).toBe(true);

  // Deja correr el juego un poco: ni errores ni peticiones a otros servidores
  await page.waitForTimeout(2500);
  expect(errors).toEqual([]);
  expect(api.foreign).toEqual([]);
});
