import { test, expect, freshGame, game, worldToPage } from "./helpers.js";

// Día 3 (antes no hay ladrones) con 3 cartas valiosas en la vitrina y la tienda abierta.
async function setupShop(page, gamePath) {
  await freshGame(page, gamePath);
  await game(page, (P) => {
    const S = P.S;
    S.day = 3;
    P.genMissions();
    P.CARDS.filter((c) => P.price(c.id) >= 4)
      .slice(0, 3)
      .forEach((c) => S.items.push({ i: S.nid++, c: c.id, k: "NM", rv: false, cost: 1, case: 1.02, res: false }));
    P.hud();
  });
  expect(await game(page, (P) => P.caseItems().length)).toBe(3);
  await page.locator("#act").click();
  await expect(page.locator("#act")).toContainText("Tienda abierta");
}

// Hace entrar a un ladrón (un coleccionista que va a por la vitrina) y espera a que robe.
// pauseOnTheft: pausa el juego en cuanto empieza el robo (como un jugador atento),
// para que el test tenga tiempo de tocarlo aunque el juego vaya a 4×.
async function sendThief(page, pauseOnTheft) {
  await game(page, (P, pause) => {
    // Como en el juego, el ladrón es un cliente normal (no habitual) que entra a mirar;
    // los que vienen a vender o cambiar van directos a la cola y se descartan.
    let c = null;
    while (!c) {
      P.spawn();
      const n = P.custs[P.custs.length - 1];
      if (n.st === "in" && !n.reg) c = n;
      else {
        P.custs.splice(P.custs.indexOf(n), 1);
        if (P.queue.includes(n)) P.queue.splice(P.queue.indexOf(n), 1);
      }
    }
    P.makeThief(c);
    P.routeTo(c, c.tx, c.ty);
    window.__thief = c;
    const watch = () => (c.run ? P.setPause(true) : requestAnimationFrame(watch));
    if (pause) requestAnimationFrame(watch);
  }, !!pauseOnTheft);
  await page.locator('#cvctl [data-a="speed"]').click();
  await page.locator('#cvctl [data-a="speed"]').click(); // 4×
  await expect(page.locator("#toast")).toContainText("¡Un ladrón se lleva", { timeout: 60_000 });
  return game(page, () => ({ loot: window.__thief.loot.i, name: window.__pcs.BYID[window.__thief.loot.c].name }));
}

test("10a · Ladrón: se le puede pillar y se recupera la carta", async ({ page, gamePath }) => {
  await setupShop(page, gamePath);
  const t = await sendThief(page, true);
  expect(await game(page, (P, i) => P.S.items.some((x) => x.i === i), t.loot)).toBe(false);

  // Con el juego en pausa, ver toda la tienda (⤢) y tocar al ladrón en la pantalla
  expect(await game(page, (P) => P.paused)).toBe(true);
  await page.locator('[data-a="zfit"]').click();
  const pos = await game(page, () => ({ x: window.__thief.x, y: window.__thief.y - 14 }));
  const p = await worldToPage(page, pos.x, pos.y);
  expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y) && document.elementFromPoint(x, y).id, [p.x, p.y])).toBe("cv");
  await page.mouse.click(p.x, p.y);
  await expect(page.locator("#toast")).toContainText("¡Pillado! Recuperas");
  const r = await game(page, (P, i) => ({ back: P.S.items.some((x) => x.i === i), caught: P.S.lt.thCaught, lost: P.S.lt.thLost || 0, run: window.__thief.run }), t.loot);
  expect(r).toEqual({ back: true, caught: 1, lost: 0, run: false });
});

test("10b · Ladrón: si escapa, la carta se pierde", async ({ page, gamePath }) => {
  await setupShop(page, gamePath);
  const t = await sendThief(page);
  await expect(page.locator("#toast")).toContainText(`El ladrón escapó con ${t.name}`, { timeout: 60_000 });
  const r = await game(page, (P, i) => ({ back: P.S.items.some((x) => x.i === i), lost: P.S.lt.thLost, caught: P.S.lt.thCaught || 0, cases: P.caseItems().length }), t.loot);
  expect(r).toEqual({ back: false, lost: 1, caught: 0, cases: 2 });
});

test("10c · Ladrón: como máximo 1 al día (y ninguno antes del día 3)", async ({ page, gamePath }) => {
  await setupShop(page, gamePath);
  await page.locator('#cvctl [data-a="pause"]').click();
  // Muchísimos clientes en el mismo día: como mucho uno es ladrón
  const count = (P) => {
    let n = 0;
    for (let i = 0; i < 500; i++) {
      P.spawn();
      if (P.custs[P.custs.length - 1].thief) n++;
    }
    P.custs.length = 0;
    P.queue.length = 0;
    return n;
  };
  const day3 = await game(page, count);
  expect(day3).toBe(1);
  expect(await game(page, (P) => P.S.theftDay)).toBe(3);
  // Al día siguiente puede volver a haber uno
  const day4 = await game(page, (P, src) => ((P.S.day = 4), (0, eval)(`(${src})`)(P)), count.toString());
  expect(day4).toBe(1);
  // Antes del día 3, nunca
  const day2 = await game(page, (P, src) => ((P.S.day = 2), (P.S.theftDay = null), (0, eval)(`(${src})`)(P)), count.toString());
  expect(day2).toBe(0);
});
