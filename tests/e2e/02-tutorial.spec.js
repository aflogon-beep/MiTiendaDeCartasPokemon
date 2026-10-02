import { test, expect, openGame, game, dismissCelebrations } from "./helpers.js";

test("2 · Tutorial completo: los 12 pasos avanzan hasta el final", async ({ page, gamePath }) => {
  test.setTimeout(180_000);
  await openGame(page, gamePath);
  const tut = page.locator("#tut");
  const step = (n) => expect(tut.locator(".n")).toHaveText(`${n}/12`);
  const seen = [];
  const mark = async (n) => {
    await step(n);
    seen.push(n);
  };

  // 1 · Bienvenida
  await mark(1);
  await page.locator("#tnext").click();

  // 2 · Toca «Stock»
  await mark(2);
  await page.locator('#nav [data-k="packs"]').click();

  // 3 · Compra 6 sobres
  await mark(3);
  await page.locator('#ovh [data-a="buyp"][data-n="6"]').first().click();

  // 4 · Precio de venta (Siguiente)
  await mark(4);
  await page.locator("#tnext").click();

  // 5 · Abre un sobre
  await mark(5);
  await page.locator('#ovh [data-a="open"][data-n="1"]').first().click();

  // 6 · Abrir el sobre deslizando/tocando y pasar las cartas
  await mark(6);
  await page.locator("#pxpack").click({ force: true }); // el sobre se mueve (animación)
  for (let i = 0; i < 40; i++) {
    if (await game(page, (P) => P.openState.mode === "sum")) break;
    await page.waitForTimeout(450);
    if (await page.locator("#pxst").count())
      await page.locator("#pxst").click({ position: { x: 40, y: 40 }, force: true });
  }

  // 7 · Cierra y toca «Cartas»
  await mark(7);
  await page.locator('#ovh .sheet > [data-a="close"].big').click();
  await dismissCelebrations(page); // si sale una carta de 20 € o más llega la Medalla Trueno
  await page.locator('#nav [data-k="coll"]').click();

  // 8 · Toca una carta y «A la vitrina»
  await mark(8);
  await page.locator("#ovh .tiles .tile").first().click();
  await page.locator('#ovh [data-a="caseadd"]').click();

  // 9 · Cierra y abre la tienda
  await mark(9);
  await page.locator('#ovh .sheet > [data-a="close"].big').click();
  await dismissCelebrations(page);
  await page.locator("#act").click();

  // 10 · Espera a un cliente en la caja y pulsa «Cobrar»
  await mark(10);
  await page.locator('#cvctl [data-a="speed"]').click(); // 2×
  await page.locator('#cvctl [data-a="speed"]').click(); // 4×
  await expect(page.locator("#act")).toContainText("Cobrar", { timeout: 90_000 });
  await page.locator("#act").click();

  // 11 · Cobrar: regateo (si lo hay), efectivo con cambio exacto o TPV
  await mark(11);
  if (await game(page, (P) => P.M === "hag")) await page.locator('[data-a="hgacc"]').click();
  await expect.poll(() => game(page, (P) => P.M)).toBe("ck");
  const ck = await game(page, (P) => ({ m: P.CK.m, tc: P.CK.tc, paid: P.CK.paid }));
  if (ck.m === "cash") {
    let due = ck.paid - ck.tc;
    for (const v of [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1])
      while (due >= v) {
        await page.locator(`[data-a="ckadd"][data-n="${v}"]`).click();
        due -= v;
      }
    await page.locator('[data-a="ckgive"]').click();
  } else {
    for (const d of String(ck.tc)) await page.locator(`[data-a="ckkey"][data-k="${d}"]`).click();
    await page.locator('[data-a="ckok"]').click();
  }

  // 12 · Últimos consejos y regalo de 100 €
  await mark(12);
  const before = await game(page, (P) => P.S.money);
  await page.locator("#tnext").click();
  await expect(tut).toHaveCount(0);
  const after = await game(page, (P) => ({ money: P.S.money, on: P.S.tut.on, served: P.S.lt.served }));
  expect(after.on).toBe(false);
  expect(after.served).toBe(1);
  expect(after.money).toBeCloseTo(before + 100, 2);
  expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});
