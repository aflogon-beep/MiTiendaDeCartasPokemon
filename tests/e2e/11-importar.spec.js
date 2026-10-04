import { test, expect, freshGame, game } from "./helpers.js";
import { readFileSync } from "node:fs";
import { compactPrice } from "../../src/core/cards/prices.js";

// Partida exportada desde la v22 (Más → Partida → Exportar) jugando contra la API simulada.
const FILE = new URL("../fixtures/partida-v22.json", import.meta.url);
const EXPORTED = JSON.parse(readFileSync(FILE, "utf8"));
// Campos que el juego cambia a propósito al cargar:
// savedAt (se vuelve a guardar) y phase/clock (siempre empieza cerrada). En el HTML original, también
// pack (ensure() → refreshPacks(true) recalculaba el precio de mayorista al cargar; docs/pendientes.md §2).
let VOLATILE = ["savedAt", "phase", "clock"];
// En Vite, el historial de precios se recorta al cargar (31 días y 6 cifras, para que la partida quepa al guardar):
// se compara con el de la exportación recortado igual.
let COMPACT = false;
test.beforeEach(({}, info) => {
  VOLATILE = ["savedAt", "phase", "clock"].concat(info.project.name === "referencia" ? ["pack"] : []);
  COMPACT = info.project.name !== "referencia";
});
const compacted = (prices) => {
  const o = JSON.parse(JSON.stringify(prices));
  Object.values(o).forEach(compactPrice);
  return o;
};

// Cada campo de la partida exportada debe seguir igual tras cargarla
function lostFields(saved, loaded) {
  const lost = [];
  for (const k of Object.keys(saved)) {
    if (VOLATILE.includes(k)) continue;
    const want = COMPACT && k === "prices" ? compacted(saved[k]) : saved[k];
    if (JSON.stringify(want) !== JSON.stringify(loaded[k])) lost.push(k);
  }
  return lost;
}

async function openBackup(page) {
  await page.locator('#nav [data-k="more"]').click();
  await page.locator('#ovh [data-a="m"][data-k="backup"]').click();
}

test("11 · Importar partida: un JSON exportado desde la v22 carga sin pérdidas", async ({ page, gamePath }) => {
  expect(EXPORTED).toMatchObject({ app: "pcs", v: 5, mode: "real" });
  await freshGame(page, gamePath);

  // Importar archivo (acepta el confirm)
  await openBackup(page);
  await page.locator("#impfile").setInputFiles(FILE.pathname);
  await expect(page.locator("#toast")).toContainText("✅ Partida cargada");
  const S1 = await game(page, (P) => JSON.parse(JSON.stringify(P.S)));
  expect(lostFields(EXPORTED.S, S1)).toEqual([]);
  expect(S1.phase).toBe("closed");
  expect(Object.keys(S1.pack)).toEqual(Object.keys(EXPORTED.S.pack));
  expect(S1.shopName).toBe("Tienda de Prueba");
  await expect(page.locator("#lv")).toContainText(`Día ${EXPORTED.S.day}`);

  // Se guarda con la misma clave y sobrevive a recargar la página
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-save-real-v3")));
  expect(lostFields(EXPORTED.S, stored)).toEqual([]);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S);
  const S2 = await game(page, (P) => JSON.parse(JSON.stringify(P.S)));
  // Si al arrancar ha caído el regalo diario (otro día distinto al de la exportación), suma un sobre y dinero
  const giftNow = (S) => S.gift && EXPORTED.S.gift && S.gift.last !== EXPORTED.S.gift.last;
  const GIFT = ["gift", "sealed", "money", "slots"];
  expect(lostFields(EXPORTED.S, S2).filter((k) => !(giftNow(S2) && GIFT.includes(k)))).toEqual([]);

  // Volver a exportar: mismo formato {app, v, mode, date, S} y los mismos datos
  await page.waitForTimeout(1800); // regalo diario
  await game(page, (P) => P.M && P.A.close());
  await openBackup(page);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator('#ovh [data-a="export"]').click()]);
  expect(dl.suggestedFilename()).toBe(`pokemon-card-shop-dia${EXPORTED.S.day}.json`);
  const again = JSON.parse(readFileSync(await dl.path(), "utf8"));
  expect(Object.keys(again)).toEqual(["app", "v", "mode", "date", "S"]);
  expect(again).toMatchObject({ app: "pcs", v: 5, mode: "real" });
  expect(lostFields(EXPORTED.S, again.S).filter((k) => !(giftNow(again.S) && GIFT.includes(k)))).toEqual([]);
});

test("11b · Importar partida con el código de copia (base64)", async ({ page, gamePath }) => {
  await freshGame(page, gamePath);
  const code = Buffer.from(JSON.stringify(EXPORTED), "utf8").toString("base64");
  await openBackup(page);
  await page.locator("#impcode").fill(code);
  await page.locator('#ovh [data-a="importc"]').click();
  await expect(page.locator("#toast")).toContainText("✅ Partida cargada");
  const S1 = await game(page, (P) => JSON.parse(JSON.stringify(P.S)));
  expect(lostFields(EXPORTED.S, S1)).toEqual([]);
});
