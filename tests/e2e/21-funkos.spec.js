// Zona Funko (docs/funkos/DISENO.md) · F1: la librería de al lado se traspasa a nivel 5; se compra, se le pone
// nombre y Emma se va a su sofá (jugando → tele tumbada → dormida; si la tocas dormida, se despierta).
import { test, expect, freshGame, game, worldToPage } from "./helpers.js";

// Solo existe en la versión de Vite: con la referencia (npm run test:ref) se salta
test.beforeEach(({}, info) => test.skip(info.project.name !== "vite", "solo existe en la versión de Vite"));

const look = (page, x, y) => game(page, (P, [x, y]) => P.camLook(x, y), [x, y]);
const tapWorld = async (page, x, y) => {
  const p = await worldToPage(page, x, y);
  await page.mouse.click(p.x, p.y);
};
/** Partida a un nivel dado (sin la fiesta de categoría nueva) y con dinero. */
const setup = (page, lv, money) =>
  game(
    page,
    (P, [lv, money]) => {
      Object.assign(P.S, { lvMax: lv, lvSeen: lv, tierSeen: 9, money });
      P.G.CITYk = "";
    },
    [lv, money],
  );

test("21a · La librería se traspasa a nivel 5: se compra, se le pone nombre y se guarda", async ({
  page,
  gamePath,
}) => {
  await freshGame(page, gamePath);
  const ovh = page.locator("#ovh");
  // Nivel 4: la librería es solo una librería
  await setup(page, 4, 9000);
  await look(page, 946, 380);
  await tapWorld(page, 946, 300);
  await page.waitForTimeout(300);
  expect(await game(page, (P) => P.G.M)).toBe(null);
  // Nivel 5: se traspasa; sin dinero, el botón no deja comprar
  await setup(page, 5, 9000);
  await tapWorld(page, 946, 300);
  await expect(ovh.locator("h2")).toContainText("Se traspasa");
  await expect(ovh.locator('[data-a="fkbuy"]')).toBeDisabled();
  await expect(ovh).toContainText("Te faltan");
  await game(page, (P) => P.closeM());
  // Con dinero: se compra y se pone nombre
  await setup(page, 5, 16000);
  await tapWorld(page, 946, 300);
  await ovh.locator('[data-a="fkbuy"]').click();
  await expect(page.locator("#fknm")).toBeVisible();
  expect(await game(page, (P) => [P.S.money, !!P.S.fk])).toEqual([1000, true]);
  await ovh.locator('[data-a="fksug"][data-k="Cabezones"]').click();
  await expect(page.locator("#fknm")).toHaveValue("Cabezones");
  await page.locator("#fknm").fill("Pop Galaxy");
  await ovh.locator('[data-a="fkopen"]').click();
  expect(await game(page, (P) => [P.G.M, P.S.fk.name, P.fkName()])).toEqual([null, "Pop Galaxy", "Pop Galaxy"]);
  await expect(page.locator("#quip")).toContainText("sofá");
  // Tocar la zona abre su ficha (cambiar el nombre)
  await page.waitForTimeout(400);
  await tapWorld(page, 900, 250);
  await expect(ovh.locator("h2")).toContainText("Pop Galaxy");
  // Se guarda y sigue al recargar
  await game(page, (P) => P.saveNow());
  await page.reload();
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S);
  expect(await game(page, (P) => P.S.fk.name)).toBe("Pop Galaxy");
});

test("21b · Emma, en su sofá de la zona Funko: si la tocas dormida, se despierta con una frase", async ({
  page,
  gamePath,
}) => {
  await freshGame(page, gamePath);
  await game(page, (P) => {
    P.S.fk = { name: "Zona Funko", since: 1 };
    P.G.CITYk = "";
  });
  await game(page, (P) => P.zoomAt(P.VIEW.max, 0, 0));
  await look(page, 966, 470);
  // Despierta: tocarla no hace nada (ni abre la ficha de la zona)
  await game(page, (P) => ((P.FKEMMA.st = "play"), (P.FKEMMA.t = 999)));
  await tapWorld(page, 966, 480);
  await page.waitForTimeout(300);
  expect(await game(page, (P) => [P.FKEMMA.st, P.G.M])).toEqual(["play", null]);
  // Dormida: se despierta, dice algo gracioso y, al rato, se tumba a ver la tele
  await game(page, (P) => (P.FKEMMA.st = "sleep"));
  await tapWorld(page, 966, 480);
  expect(await game(page, (P) => P.FKEMMA.st)).toBe("wake");
  const lines = await game(page, (P) => P.FK_WAKE);
  const said = await page.locator("#quip p").textContent();
  expect(lines).toContain(said);
  await game(page, (P) => (P.FKEMMA.t = 0.01));
  await expect.poll(() => game(page, (P) => P.FKEMMA.st)).toBe("tv");
  await game(page, (P) => (P.FKEMMA.t = 0.01));
  await expect.poll(() => game(page, (P) => P.FKEMMA.st)).toBe("sleep");
});

/** Zona Funko comprada, a un nivel de zona dado, con dinero. */
const withZone = (page, xp = 0) =>
  game(
    page,
    (P, xp) => {
      Object.assign(P.S, { lvMax: 5, lvSeen: 5, tierSeen: 9, money: 30000 });
      P.S.fk = { name: "Pop Galaxy", since: 1 };
      P.fkEnsure();
      P.S.fk.xp = xp;
      P.fkEnsure();
      P.G.CITYk = "";
    },
    xp,
  );

test("21c · Stock → Funkos: pedir una caja, llega al día siguiente, reponer y la ficha", async ({ page, gamePath }) => {
  await freshGame(page, gamePath);
  await withZone(page);
  const ovh = page.locator("#ovh");
  await page.locator('#nav [data-k="packs"]').click();
  await ovh.locator('[data-a="ptab"][data-k="fk"]').click();
  await expect(ovh.locator(".fkc").first()).toBeVisible();
  const m0 = await game(page, (P) => P.S.money);
  await ovh.locator('[data-a="fkord"]').first().click();
  expect(await game(page, (P) => [P.S.fk.del.length, P.S.money < 30000])).toEqual([1, true]);
  expect(m0).toBe(30000);
  await expect(ovh).toContainText("Mañana llegan");
  // Pasa el día: llegan 6 al almacén y se reponen
  await game(page, (P) => (P.S.day++, P.fkArrive()));
  await game(page, (P) => P.renderM());
  await expect(ovh.locator(".fkst")).toContainText("6");
  await ovh.locator('[data-a="fkrestock"]').click();
  expect(await game(page, (P) => P.fkCount("s") + P.fkCount("v"))).toBe(6);
  // Ficha: las iguales van juntas y se pueden mover
  await ovh.locator('[data-a="fkfig"]').first().click();
  await expect(ovh.locator(".fkbig .fkbox")).toBeVisible();
  await ovh.locator('[data-a="fkmv"][data-n="m"]').first().click();
  expect(await game(page, (P) => P.fkCount("m"))).toBe(1);
});

test("21d · Con Funkos en la zona, entran clientes, compran en la misma caja y salen en el ticket", async ({
  page,
  gamePath,
}) => {
  test.setTimeout(150_000);
  await freshGame(page, gamePath);
  await withZone(page, 800);
  await game(page, (P) => {
    ["vader", "falcon", "rug", "claw", "arcade", "pika", "leds"].forEach((k) => (P.S.fk.mob[k] = 1));
    P.FIGS.filter((f) => P.fkOut(f) && !f.r)
      .slice(0, 10)
      .forEach((f) => P.fkOrder(f.id));
    P.S.day++;
    P.fkArrive(() => 0.5);
    P.fkRestock();
    P.S.fk.stf = 1;
    P.S.staff.cashier = 1;
  });
  await page.locator("#act").click();
  await game(page, (P) => (P.G.speed = 20));
  await expect.poll(() => game(page, (P) => P.S.lt.fksold || 0), { timeout: 90_000 }).toBeGreaterThan(0);
  const st = await game(page, (P) => ({ inc: P.S.fk.st.inc, xp: P.S.fk.xp }));
  expect(st.inc).toBeGreaterThan(0);
  expect(st.xp).toBeGreaterThan(800);
  // Al cerrar, el ticket trae la zona Funko
  await expect.poll(() => game(page, (P) => P.G.M), { timeout: 120_000 }).toBe("sum");
  await expect(page.locator("#ovh .ticket")).toContainText("Funkos");
  await expect(page.locator("#ovh .ticket")).toContainText("Alquiler de la zona Funko");
});

test("21e · Mejoras → Zona Funko, Chase al llegar, quien viene a vender y el evento con exclusivas", async ({
  page,
  gamePath,
}) => {
  await freshGame(page, gamePath);
  await withZone(page, 2400); // nivel 5: eventos
  const ovh = page.locator("#ovh");
  // Mueble y encargado
  await game(page, (P) => P.openM("up"));
  await ovh.locator('[data-a="fkmob"][data-k="vader"]').click();
  await ovh.locator('[data-a="fkstf"]').first().click();
  expect(await game(page, (P) => [P.S.fk.mob.vader, P.S.fk.stf])).toEqual([1, 1]);
  // Una caja trae una Chase: pantalla de la Chase
  await game(page, (P) => {
    P.closeM();
    const f = P.FIGS.find((x) => x.c === "pk" && !x.r);
    P.fkOrder(f.id);
    P.S.day++;
    const got = P.fkArrive(() => 0.01);
    P.S.summary = { fk: { chaseNew: got.filter((u) => u.v === "chase").map((u) => u.i) } };
    P.openM("fkchase");
  });
  await expect(ovh).toContainText("HA SALIDO UNA CHASE");
  await ovh.locator('[data-a="fkmv"][data-n="v"]').click();
  expect(await game(page, (P) => P.S.fk.u.find((u) => u.v === "chase").at)).toBe("v");
  // Alguien viene a vender un Funko
  await game(page, (P) => {
    P.closeM();
    P.G.FKD = { fkdeal: P.fkMakeDeal(() => 0.5), x: 0, y: 0, want: { k: "fksell" } };
    P.openM("fkdeal");
  });
  const n0 = await game(page, (P) => P.S.fk.u.length);
  await ovh.locator('[data-a="fkdealok"]').click();
  expect(await game(page, (P) => P.S.fk.u.length)).toBe(n0 + 1);
  // Evento con exclusivas
  await game(page, (P) => {
    P.S.fk.evd = P.S.day + 1;
    P.fkEndDay(() => 0.3);
    P.S.day++;
    P.openM("fkev");
  });
  await expect(ovh).toContainText("Exclusivas");
  await ovh.locator('[data-a="fkevbuy"]').first().click();
  expect(await game(page, (P) => P.S.fk.u.some((u) => u.v === "exc"))).toBe(true);
});
