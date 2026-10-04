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
