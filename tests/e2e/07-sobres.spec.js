import { test, expect, freshGame, game } from "./helpers.js";

test("7 · Sobres: 300 sobres sin cartas repetidas dentro del mismo", async ({ page, gamePath }) => {
  await freshGame(page, gamePath);

  // 300 sobres (100 de cada set por defecto) con la misma función que usa la tienda
  const r = await game(page, (P) => {
    const out = { packs: 0, dups: [], sizes: {}, rv: 0, rares: {} };
    for (const sd of P.SETS)
      for (let n = 0; n < 100; n++) {
        const pack = P.roll(sd.id);
        out.packs++;
        out.sizes[pack.length] = (out.sizes[pack.length] || 0) + 1;
        const ids = pack.map((x) => x.c.id);
        if (new Set(ids).size !== ids.length) out.dups.push(ids);
        if (pack.some((x) => x.c.s !== sd.id)) out.dups.push(["otro set", ...ids]);
        out.rv += pack.filter((x) => x.rv).length;
        const last = pack[pack.length - 1].c.r;
        out.rares[last] = (out.rares[last] || 0) + 1;
      }
    return out;
  });
  expect(r.packs).toBe(300);
  expect(r.dups).toEqual([]);
  // Época Escarlata y Púrpura: 5 comunes + 3 poco comunes + 1 reverse + 1 rara o mejor
  expect(r.sizes).toEqual({ 10: 300 });
  expect(r.rv).toBe(300);
  expect(r.rares.R).toBeGreaterThan(150); // ~71,5 % de raras normales en el hueco final

  // Y abriendo de verdad desde Stock: el sobre que se ve tampoco repite cartas
  await game(page, (P) => {
    P.S.sealed.mew = 30;
    P.assignSlots();
  });
  for (let i = 0; i < 5; i++) {
    await page.locator('#nav [data-k="packs"]').click();
    await page.locator('#ovh [data-a="open"][data-k="mew"][data-n="1"]').click();
    const ids = await game(page, (P) => P.openState.cards.map((x) => x.c.id));
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    await page.locator("#pxskip").click();
    await page.locator('#ovh .sheet > [data-a="close"].big').click();
    await page.waitForTimeout(200);
    await page.evaluate(() => document.querySelectorAll("#medok, #tierok").forEach((b) => b.click()));
  }
  expect(await game(page, (P) => P.S.sealed.mew)).toBe(25);
});
