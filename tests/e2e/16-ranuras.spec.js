import { test, expect, openGame, game } from "./helpers.js";
import { readFileSync } from "node:fs";

// Fase I · paso 1: ranuras de partida. La partida que ya existía (clave de siempre) es la ranura 1.
const SAVE = JSON.parse(readFileSync(new URL("../fixtures/partida-v22.json", import.meta.url), "utf8")).S;

test("16 · Ranuras: la partida antigua es la ranura 1 sin perder nada y cada ranura es independiente", async ({
  page,
  gamePath,
}, info) => {
  test.skip(info.project.name !== "vite", "las ranuras solo existen en la versión de Vite");

  // Una partida guardada por la v22 (pcs-save-real-v3) y ningún índice de ranuras
  await openGame(page, gamePath, { save: SAVE });
  const r = await game(page, (P) => ({
    slot: P.SLOT,
    list: P.listSlots(),
    day: P.S.day,
    money: P.S.money,
    n: P.S.items.length,
  }));
  expect(r.slot).toBe(1);
  expect(r.list[0]).toMatchObject({
    n: 1,
    empty: false,
    name: SAVE.shopName,
    day: SAVE.day,
    money: SAVE.money,
    diff: "Fácil",
  });
  expect(r.list.slice(1).map((s) => s.empty)).toEqual([true, true]);
  expect([r.day, r.money, r.n]).toEqual([SAVE.day, SAVE.money, SAVE.items.length]);

  // Pasar a la ranura 2 (vacía): empieza una tienda nueva, se juega y se guarda; la 1 sigue igual
  await game(page, (P) => P.openSlot(2));
  await page.reload();
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S, null, { timeout: 60_000 });
  const r2 = await game(page, (P) => {
    P.S.shopName = "Gengar Cards";
    P.saveNow();
    return { slot: P.SLOT, day: P.S.day, list: P.listSlots() };
  });
  expect(r2.slot).toBe(2);
  expect(r2.day).toBe(1);
  expect(r2.list[0]).toMatchObject({ empty: false, day: SAVE.day, money: SAVE.money });
  expect(r2.list[1]).toMatchObject({ empty: false, name: "Gengar Cards", day: 1 });

  // «Continuar» = la última ranura usada: al volver a abrir sigue en la 2; la 1 se puede volver a cargar intacta
  await page.reload();
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S, null, { timeout: 60_000 });
  expect(await game(page, (P) => [P.SLOT, P.S.shopName])).toEqual([2, "Gengar Cards"]);
  await game(page, (P) => P.openSlot(1));
  await page.reload();
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S, null, { timeout: 60_000 });
  expect(await game(page, (P) => [P.SLOT, P.S.day, P.S.money])).toEqual([1, SAVE.day, SAVE.money]);
});
