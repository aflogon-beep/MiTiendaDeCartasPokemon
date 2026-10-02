import { test, expect, freshGame, game } from "./helpers.js";

// Examina con lupa, luz y balanza la carta abierta en la ficha y devuelve las pistas.
async function inspectAll(page) {
  const ovh = page.locator("#ovh");
  for (const k of ["lens", "light", "scale"]) await ovh.locator(`[data-a="imode"][data-k="${k}"]`).click();
  const clues = ovh.locator(".clues");
  return {
    bad: await clues.locator(".down").count(),
    good: await clues.locator(".up").count(),
    text: await clues.innerText(),
  };
}

async function openCardSheet(page, key) {
  const ovh = page.locator("#ovh");
  await page.locator('#nav [data-k="coll"]').click();
  await ovh.locator(`.tile[data-k="${key}"]`).click();
  await ovh.locator('[data-a="cmore"]').click();
  await ovh.locator('[data-a="inspc"]').click();
  await expect(ovh.locator("h2").first()).toHaveText("Examinar carta");
}

test("8 · Falsas: la inspección marca pistas y una falsa falla en 2 de 3 pruebas", async ({ page, gamePath }) => {
  await freshGame(page, gamePath);
  const ovh = page.locator("#ovh");

  // La regla: una falsa tiene exactamente 2 pistas malas de 3; una auténtica, ninguna.
  const rule = await game(page, (P) => {
    const out = { fakeOk: 0, realOk: 0 };
    for (let i = 0; i < 300; i++) {
      const t = P.mkTells(true),
        w = P.mkWt(true, t);
      if (
        t.length === 2 &&
        new Set(t).size === 2 &&
        t.every((k) => ["lens", "light", "scale"].includes(k)) &&
        (t.includes("scale") ? w < 1.62 : w >= 1.72)
      )
        out.fakeOk++;
      const r = P.mkTells(false),
        rw = P.mkWt(false, r);
      if (r.length === 0 && rw >= 1.72 && rw < 1.8) out.realOk++;
    }
    return out;
  });
  expect(rule).toEqual({ fakeOk: 300, realOk: 300 });

  // Una falsa y una auténtica en la colección
  const keys = await game(page, (P) => {
    const [a, b] = P.CARDS.filter((c) => P.price(c.id) >= 3);
    const fake = { i: P.S.nid++, c: a.id, k: "NM", rv: false, cost: 1, case: null, res: false, fk: true };
    const real = { i: P.S.nid++, c: b.id, k: "NM", rv: false, cost: 1, case: null, res: false };
    P.S.items.push(fake, real);
    return { fake: P.gk(fake), real: P.gk(real), fakeI: fake.i, realI: real.i };
  });

  // Falsa: 2 pistas malas y 1 buena → «Muy probablemente es FALSA»
  await openCardSheet(page, keys.fake);
  const f = await inspectAll(page);
  expect(f.bad).toBe(2);
  expect(f.good).toBe(1);
  expect(f.text).toContain("❌ Muy probablemente es FALSA");
  await ovh.locator('[data-a="ifake"]').click();
  await expect(page.locator("#toast")).toContainText("Tirada: era falsa");
  expect(await game(page, (P, i) => P.S.items.some((x) => x.i === i), keys.fakeI)).toBe(false);
  await ovh.locator('.sheet > [data-a="close"].big').click();

  // Auténtica: las 3 pruebas bien → «Parece auténtica», y se queda en la colección
  await openCardSheet(page, keys.real);
  const r = await inspectAll(page);
  expect(r.bad).toBe(0);
  expect(r.good).toBe(3);
  expect(r.text).toContain("✅ Parece auténtica");
  await ovh.locator('[data-a="iok"]').click();
  expect(await game(page, (P) => P.M)).toBe("coll");
  expect(await game(page, (P, i) => P.S.items.some((x) => x.i === i), keys.realI)).toBe(true);
  await ovh.locator('.sheet > [data-a="close"].big').click();

  // Comprando a un cliente: examinar antes de pagar y pillar la falsa
  await game(page, (P) => {
    const d = P.makeDeal(null);
    d.fake = true;
    d.cust = { id: 9999, st: "wait", hold: null, want: { k: "sell" }, x: 622, y: 262 };
    P.deal = d;
    P.openM("sell");
  });
  await expect(ovh).toContainText("Examinar");
  await ovh.locator('[data-a="inspd"]').click();
  const d = await inspectAll(page);
  expect(d.bad).toBe(2);
  const rep0 = await game(page, (P) => P.S.repB || 0);
  await ovh.locator('[data-a="ifake"]').click();
  await expect(page.locator("#toast")).toContainText("¡Bien visto! Era falsa");
  expect(await game(page, (P) => ({ rep: P.S.repB, caught: P.S.lt.caught, M: P.M, deal: P.deal }))).toEqual({
    rep: rep0 + 1,
    caught: 1,
    M: null,
    deal: null,
  });
});
