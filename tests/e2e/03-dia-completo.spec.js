import { test, expect, freshGame, game, dismissCelebrations, dismissInfo } from "./helpers.js";

test("3 · Día completo con cajero: abrir, clientes, cierre y ticket del día", async ({ page, gamePath }) => {
  test.setTimeout(180_000);
  await freshGame(page, gamePath);
  const ovh = page.locator("#ovh");
  const closeSheet = () => ovh.locator('.sheet > [data-a="close"].big').click();

  // Contratar cajero: Más → Mejoras → Personal
  await page.locator('#nav [data-k="more"]').click();
  await ovh.locator('[data-a="m"][data-k="up"]').click();
  await ovh.locator('[data-a="staff"][data-k="cashier"]').click();
  await expect(ovh.locator('[data-a="staff"][data-k="cashier"]')).toContainText("Contratado");
  await closeSheet();

  // Comprar sobres de los 3 sets (llegan en la furgoneta)
  const sealed0 = await game(page, (P) => P.SETS.map((s) => P.S.sealed[s.id])); // el regalo diario puede traer 1
  await page.locator('#nav [data-k="packs"]').click();
  const buy = ovh.locator('[data-a="buyp"][data-n="6"]');
  for (let i = 0; i < 3; i++) await buy.nth(i).click();
  await closeSheet();
  await expect.poll(() => game(page, (P) => (P.S.deliv || []).length), { timeout: 30_000 }).toBe(0);
  const sealed = await game(page, (P) => P.SETS.map((s) => P.S.sealed[s.id]));
  expect(sealed).toEqual(sealed0.map((n) => n + 6));

  // Abrir la tienda a 4×
  const money0 = await game(page, (P) => P.S.money);
  await page.locator("#act").click();
  expect(await game(page, (P) => P.S.phase)).toBe("open");
  await page.locator('#cvctl [data-a="speed"]').click();
  await page.locator('#cvctl [data-a="speed"]').click();
  await expect(page.locator('#cvctl [data-a="speed"]')).toHaveText("4×");

  // Durante el día: el cajero cobra solo; si alguien quiere vender o cambiar, se le dice que no.
  let sawCustomer = false;
  for (let t = 0; t < 400; t++) {
    const st = await game(page, (P) => ({ M: P.M, phase: P.S.phase, n: P.custs.length, front: P.front() && P.front().want.k }));
    if (st.n) sawCustomer = true;
    if (st.M === "sum") break;
    if (st.M === "sell") await ovh.locator('[data-a="dealno"]').click();
    else if (st.M === "lot") await ovh.locator('[data-a="lotno"]').click();
    else if (st.M === "trade") await ovh.locator('[data-a="tradeno"]').click();
    else if (st.M) await dismissInfo(page); // historia, medallas…
    else if (st.front && ["sell", "lot", "trade"].includes(st.front)) await page.locator("#act").click();
    await page.waitForTimeout(250);
  }
  expect(sawCustomer).toBe(true);

  // Ticket del día
  await expect(ovh.locator("h2").first()).toHaveText("Fin del día 1");
  const ticket = ovh.locator(".ticket");
  await expect(ticket).toContainText("TICKET DE CIERRE · DÍA 1");
  await expect(ticket).toContainText("Alquiler");
  await expect(ticket).toContainText("Sueldos");
  await expect(ticket).toContainText("RESULTADO DEL DÍA");

  const s = await game(page, (P) => ({ sum: P.S.summary, day: P.S.day, phase: P.S.phase, hist: P.S.hist, money: P.S.money, served: P.S.lt.served || 0 }));
  expect(s.day).toBe(2);
  expect(s.phase).toBe("closed");
  expect(s.sum.day).toBe(1);
  expect(s.sum.cust).toBeGreaterThan(0);
  expect(s.sum.rent).toBe(15);
  expect(s.sum.sal).toBe(20);
  expect(s.served).toBeGreaterThan(0);
  expect(s.sum.inc).toBeGreaterThan(0);
  expect(s.hist).toHaveLength(1);
  await expect(ticket.locator(".tl").filter({ hasText: "Clientes" }).first()).toContainText(String(s.sum.cust));

  // Cerrar el ticket deja la tienda lista para el día 2
  await closeSheet();
  await dismissCelebrations(page);
  await expect(page.locator("#act")).toHaveText("Abrir la tienda (día 2)");
  expect(s.money).not.toBe(money0);
});
