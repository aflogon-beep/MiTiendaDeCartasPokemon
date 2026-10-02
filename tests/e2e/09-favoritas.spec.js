import { test, expect, freshGame, game } from "./helpers.js";

test("9 · Favoritas: no se venden, no van a la vitrina, no se roban", async ({ page, gamePath }) => {
  await freshGame(page, gamePath);
  const ovh = page.locator("#ovh");

  // Tres cartas valiosas distintas (1 para favorita, 2 para la vitrina) y 2 copias de la favorita
  const ids = await game(page, (P) => {
    const cs = P.CARDS.filter((c) => P.price(c.id) >= 3).slice(0, 3);
    const mk = (c) => ({ i: P.S.nid++, c: c.id, k: "NM", rv: false, cost: 1, case: null, res: false });
    P.S.items.push(mk(cs[0]), mk(cs[0]), mk(cs[1]), mk(cs[2]));
    return cs.map((c) => c.id);
  });
  const key = (await game(page, (P, c) => P.gk(P.S.items.find((i) => i.c === c)), ids[0]));

  // Guardar 1 en favoritas desde su ficha
  await page.locator('#nav [data-k="coll"]').click();
  await ovh.locator(`.tile[data-k="${key}"]`).click();
  await ovh.locator('[data-a="favadd"]').click();
  await expect(page.locator("#toast")).toContainText("guardada en tu colección personal");
  const favKey = await game(page, (P) => P.collSel);
  expect(favKey).toMatch(/\|V$/);

  // En la ficha de la favorita: «A la vitrina» y «Vender 1» desactivados
  await expect(ovh.locator('[data-a="caseadd"]')).toBeDisabled();
  await expect(ovh.locator('[data-a="sell1"]')).toBeDisabled();
  await expect(ovh).toContainText("Protegida: no se vende ni va a la vitrina");
  // Aunque se fuerce la acción, no se mueve ni se vende
  const money0 = await game(page, (P) => P.S.money);
  await game(page, (P) => {
    P.A.caseadd();
    P.A.sell1();
    P.A.luxadd();
  });
  const fav = await game(page, (P) => P.S.items.filter((i) => i.fav).map((i) => ({ case: i.case, lux: !!i.lux })));
  expect(fav).toEqual([{ case: null, lux: false }]);
  expect(await game(page, (P) => P.S.money)).toBe(money0);

  // «Vender todas» de ese grupo de cartas tampoco incluye la favorita
  await game(page, (P, c) => {
    P.collSel = P.gk(P.S.items.find((i) => i.c === c && !i.fav));
    P.A.sellall();
  }, ids[0]);
  expect(await game(page, (P, c) => P.S.items.filter((i) => i.c === c).map((i) => !!i.fav), ids[0])).toEqual([true]);

  // Las otras dos a la vitrina; un ladrón solo puede llevarse cartas de la vitrina
  await game(page, (P, c) => {
    for (const id of c) {
      P.collSel = P.gk(P.S.items.find((i) => i.c === id));
      P.A.caseadd();
    }
    P.closeM();
  }, [ids[1], ids[2]]);
  expect(await game(page, (P) => P.caseItems().length)).toBe(2);
  await page.locator("#act").click(); // abrir la tienda
  const stolen = await game(page, (P) => {
    P.spawn();
    const c = P.custs[P.custs.length - 1];
    P.makeThief(c);
    P.startTheft(c);
    return { loot: c.loot && c.loot.c, fav: !!(c.loot && c.loot.fav), favLeft: P.S.items.filter((i) => i.fav).length };
  });
  expect(stolen.fav).toBe(false);
  expect([ids[1], ids[2]]).toContain(stolen.loot);
  expect(stolen.favLeft).toBe(1);

  // Y ningún cliente la encuentra para comprarla: solo se elige entre cartas de la vitrina
  const pickable = await game(page, (P) => P.S.items.filter((i) => i.case != null && !i.res && !i.fkK).map((i) => !!i.fav));
  expect(pickable).not.toContain(true);
  // Un encargo de esa carta tampoco puede usar la favorita
  expect(await game(page, (P, c) => P.ownFor({ c }) || null, ids[0])).toBeNull();
});
