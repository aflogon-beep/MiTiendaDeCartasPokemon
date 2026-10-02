import { test, expect, freshGame, game } from "./helpers.js";

const notes = (page) => game(page, (P) => (P.VIS.notes || []).map((n) => n.t).join("\n"));
const listCalls = (api) => api.calls.filter((u) => u.includes("/v2/sets")).length;
const setCalls = (api, id) => api.calls.filter((u) => decodeURIComponent(u).includes(`set.id:${id}`)).length;

async function openSets(page) {
  await page.locator('#nav [data-k="more"]').click();
  await page.locator('#ovh [data-a="m"][data-k="sets"]').click();
  await expect(page.locator("#ovh h2").first()).toHaveText("Colecciones");
}

test("12a · Colecciones: si la lista falla se reintenta, se avisa y hay botón para reintentar", async ({
  page,
  gamePath,
}) => {
  test.setTimeout(120_000);
  const api = await freshGame(page, gamePath, { api: { failList: true } });
  const ovh = page.locator("#ovh");

  // El juego reintenta la lista 3 veces y se rinde
  await expect.poll(() => game(page, (P) => P.SETLIST_ST), { timeout: 30_000 }).toBe("fail");
  expect(listCalls(api)).toBe(3);

  // Aviso y botón visibles en Más → Colecciones
  await openSets(page);
  await expect(ovh).toContainText("No se ha podido descargar la lista completa de colecciones");
  const retry = ovh.locator('[data-a="setlist"]');
  await expect(retry).toBeVisible();

  // La API vuelve: reintentar descarga la lista completa
  api.failList = false;
  await retry.click();
  await expect(ovh.locator("#setlist")).toContainText("Fixture Cuatro", { timeout: 15_000 });
  await expect(ovh).not.toContainText("No se ha podido descargar");
  expect(await notes(page)).toContain("🗂️ 6 colecciones disponibles");
  expect(await game(page, (P) => ({ st: P.SETLIST_ST, n: P.SETDEF.length }))).toEqual({ st: "ok", n: 6 });
  const cached = await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-sets-v1")).sets.length);
  expect(cached).toBe(6);

  // Y se puede añadir una colección nueva al catálogo
  await ovh.locator('[data-a="addset"][data-k="fx4"]').click();
  await expect.poll(() => notes(page), { timeout: 15_000 }).toContain("✅ 1 colección(es) añadidas");
  expect(await game(page, (P) => ({ sets: P.S.sets, loaded: !!P.BYS.fx4 }))).toEqual({
    sets: ["mew", "pre", "obf", "fx4"],
    loaded: true,
  });
});

test("12b · Colecciones: un set que no carga se reintenta, se avisa y se recupera con el botón", async ({
  page,
  gamePath,
}) => {
  test.setTimeout(120_000);
  const api = await freshGame(page, gamePath, { api: { failSets: ["sv8pt5"] } });
  const ovh = page.locator("#ovh");

  // Arranca con los otros dos sets; el que falla se intentó 3 veces
  expect(setCalls(api, "sv8pt5")).toBe(3);
  expect(await game(page, (P) => ({ mode: P.MODE, sets: P.SETS.map((s) => s.id), failed: [...P.FAILED] }))).toEqual({
    mode: "real",
    sets: ["mew", "obf"],
    failed: ["pre"],
  });
  expect(await notes(page)).toContain("⚠️ 1 colección(es) no cargaron. Reinténtalo en Más → Colecciones");
  await expect(page.locator("#hint")).toContainText("⚠️ 1 colección(es) sin cargar: Más → Colecciones → Reintentar");

  // Aviso y botón en Más → Colecciones
  await openSets(page);
  await expect(ovh).toContainText("1 colección(es) de tu catálogo no han cargado");
  const retry = ovh.locator('.pn [data-a="retrysets"]').first();
  await expect(retry).toBeVisible();
  await expect(retry).toHaveText("Reintentar ahora");

  // La API se recupera: reintentar carga el set que faltaba
  api.failSets.clear();
  await retry.click();
  await expect.poll(() => notes(page), { timeout: 15_000 }).toContain("✅ Todas las colecciones cargadas");
  expect(
    await game(page, (P) => ({ sets: P.SETS.map((s) => s.id), failed: P.FAILED.size, cards: P.CARDS.length })),
  ).toEqual({ sets: ["mew", "pre", "obf"], failed: 0, cards: 183 });
  await expect(ovh).not.toContainText("no han cargado");
  await ovh.locator('.sheet > [data-a="close"].big').click();
  await expect(page.locator("#hint")).toContainText("Precios reales de Cardmarket");
});
