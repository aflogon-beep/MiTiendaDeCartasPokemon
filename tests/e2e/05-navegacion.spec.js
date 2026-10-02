import { test, expect, freshGame, game } from "./helpers.js";
import { botPlay } from "./bot.js";

test("5 · Navegación: con todo el mobiliario y la ampliación, ningún cliente dentro de obstáculos", async ({ page, gamePath }) => {
  test.setTimeout(300_000);
  await freshGame(page, gamePath);

  // Tienda al completo: toda la decoración, mejoras, ampliación, producto sellado,
  // peanas con cartas, sala de trofeos (favoritas) y la Navidad (árbol junto a la puerta).
  await game(page, (P) => {
    const S = P.S;
    S.money = 50000;
    P.DECOR.forEach((d) => (S.decor[d.k] = 1));
    S.up.shelf = 1;
    S.up.case = 1;
    S.annex = true;
    S.season = "xmas";
    S.prod["etb:mew"] = 3;
    S.prod["box:pre"] = 2;
    S.prodSeen = true;
    const good = P.CARDS.filter((c) => P.price(c.id) >= 2).slice(0, 12);
    good.forEach((c, i) => S.items.push({ i: S.nid++, c: c.id, k: "NM", rv: false, cost: 1, case: i < 3 ? 1.2 : null, res: false, lux: i < 3, fav: i >= 3 && i < 6 }));
    P.assignSlots();
    P.BGk = -1;
    P.CITYk = "";
    P.hud();
  });
  const nav = await game(page, (P) => ({ slots: P.slotCount(), cap: P.caseCap(), annex: P.S.annex, trophy: P.trophyOn(), lux: P.luxItems().length, obst: P.navObstacles().length }));
  expect(nav).toMatchObject({ slots: 8, cap: 16, annex: true, trophy: true, lux: 3 });

  // Vigilante: en cada fotograma, ningún cliente dentro de la tienda puede estar dentro
  // de un obstáculo (rectángulos de navObstacles sin el margen de seguridad).
  await game(page, (P) => {
    const W = window.__nav = { frames: 0, samples: 0, bad: [], run: true };
    const tick = () => {
      if (!W.run) return;
      W.frames++;
      const obs = P.navObstacles(), ax = P.AX();
      for (const c of P.custs) {
        if (!(c.x > ax && c.x < 800 && c.y > 0 && c.y < 556)) continue; // fuera de la tienda (calle)
        W.samples++;
        for (const [x0, y0, x1, y1] of obs)
          if (c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1) {
            if (W.bad.length < 20) W.bad.push({ x: Math.round(c.x), y: Math.round(c.y), st: c.st, want: c.want.k, obst: [x0, y0, x1, y1] });
            break;
          }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // Dos días de tienda con el bot (a 20× para no saltarse demasiados pasos)
  const log = await game(page, botPlay, { days: 2, speed: 20, claim: false, maxMs: 240_000 });
  const W = await game(page, () => ((window.__nav.run = false), window.__nav));
  console.log(`fotogramas ${W.frames} · posiciones revisadas ${W.samples} · clientes ${log.map((d) => d.cust).join("+")}`);
  expect(log.reduce((a, d) => a + d.cust, 0)).toBeGreaterThan(20);
  expect(W.samples).toBeGreaterThan(1000);
  if (W.bad.length) console.log("clientes dentro de obstáculos:", JSON.stringify(W.bad));
  expect(W.bad).toEqual([]);
});
