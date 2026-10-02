import { test, expect, openGame, mockNetwork, game, settle } from "./helpers.js";
import { readFileSync } from "node:fs";

// Fase I · paso 2: pantalla de carga y pantalla de título.
const SAVE = JSON.parse(readFileSync(new URL("../fixtures/partida-v22.json", import.meta.url), "utf8")).S;
const PHRASES = [
  "Contando sobres…",
  "Despertando a Gengar…",
  "Emma revisa las cuentas…",
  "Papá está en el gimnasio…",
  "Álvaro se ha caído otra vez…",
  "Puliendo la vitrina…",
];
const vite = (info) => test.skip(info.project.name !== "vite", "el título solo existe en la versión de Vite");

// Deja partidas guardadas antes de arrancar (solo la primera vez: no en cada recarga)
const seed = (list) => {
  if (sessionStorage.getItem("__seeded2")) return;
  for (const [k, v] of list) localStorage.setItem(k, v);
  sessionStorage.setItem("__seeded2", "1");
};

test("17a · Primera vez: pantalla de carga y título solo con «Nueva partida»", async ({ page, gamePath }, info) => {
  vite(info);
  await mockNetwork(page);
  await page.goto(gamePath);
  // Carga: logo, sobres, barra y una frase divertida
  await expect(page.locator("#load .load-logo h2")).toHaveText("Pokémon Card Shop");
  await expect(page.locator("#load .load-packs i")).toHaveCount(3);
  await expect(page.locator("#loadbar")).toBeAttached();
  expect(PHRASES).toContain(await page.locator("#loadfun").textContent());
  const t0 = Date.now();
  await expect(page.locator("#load")).toHaveCount(0, { timeout: 30_000 });
  // La API simulada responde al instante: aun así la carga se ve como mínimo 1,5 s
  expect(Date.now() - t0).toBeGreaterThan(900);

  // Título sin partidas: ni «Continuar» ni «Cargar partida»
  const t = page.locator("#title");
  await expect(t.locator("h1")).toHaveText("Pokémon Card Shop");
  await expect(t.locator('[data-a="tnew"]')).toBeVisible();
  await expect(t.locator('[data-a="tcont"]')).toHaveCount(0);
  await expect(t.locator('[data-a="tload"]')).toHaveCount(0);
  // Mientras se ve el título, la tienda de fondo no se guarda
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("pcs-save")))).toEqual([]);

  // Nueva partida → ranura 1 → juego con el tutorial
  await t.locator('[data-a="tnew"]').click();
  await expect(t.locator(".title-slot")).toHaveCount(3);
  await t.locator('[data-a="tnewin"][data-n="1"]').click();

  // Prepara tu aventura: Álvaro, dificultad (Fácil recomendada para peques) y mascota
  await expect(t.locator("h2")).toHaveText("🎒 Prepara tu aventura");
  await expect(t.locator(".adv-hero")).toContainText("¡Eres Álvaro!");
  await expect(t.locator('[data-a="tadvd"]')).toHaveText([/Fácil.*Recomendado para peques/, /^Normal/, /^Difícil/]);
  await expect(t.locator('[data-a="tadvd"].on')).toContainText("Normal"); // por defecto
  await expect(t.locator('[data-a="tadvp"]')).toHaveText(["🐱 Gato", "🐶 Perro", "🐰 Conejo", "Sin mascota"]);
  // el retrato de Álvaro está dibujado
  expect(await page.evaluate(() => document.querySelector("#advpj").toDataURL().length)).toBeGreaterThan(5000);
  await t.locator('[data-a="tadvd"][data-k="facil"]').click();
  await t.locator('[data-a="tadvp"][data-k="dog"]').click();
  await expect(t.locator('[data-a="tadvd"].on')).toContainText("Fácil");
  await expect(t.locator('[data-a="tadvp"].on')).toHaveText("🐶 Perro");
  await t.locator('[data-a="tadvgo"]').click();

  // ¡Empezar! → juego con el tutorial, con la dificultad y la mascota elegidas
  await expect(page.locator("#title")).toHaveCount(0);
  await expect(page.locator("#tut")).toBeVisible();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-save-real-v3")));
  expect([s.day, s.diff, s.pet]).toEqual([1, "facil", "dog"]);
});

test("17b · Continuar abre la última ranura; Cargar permite elegir otra; volver al título guarda", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  const other = { ...SAVE, shopName: "Gengar Cards", day: 2, money: 777 };
  const dialogs = [];
  page.on("dialog", (d) => dialogs.push(d.message()));
  await page.addInitScript(seed, [
    ["pcs-save-real-v3-s2", JSON.stringify(other)],
    ["pcs-slots-v1", JSON.stringify({ last: 2 })],
  ]);
  await openGame(page, gamePath, { save: SAVE, title: true });

  // Continuar enseña la ficha de la última ranura usada (la 2)
  const t = page.locator("#title");
  const cont = t.locator('[data-a="tcont"]');
  await expect(cont).toContainText("Gengar Cards");
  await expect(cont).toContainText("Día 2");
  await expect(cont).toContainText("777,00");
  await cont.click();
  await expect(t).toHaveCount(0);
  expect(await game(page, (P) => [P.SLOT, P.S.shopName, P.S.day])).toEqual([2, "Gengar Cards", 2]);

  // Más → Volver al título: guarda antes de salir
  await settle(page); // regalo diario
  await game(page, (P) => (P.S.money = 1234.5));
  await page.locator('#nav [data-k="more"]').click();
  await page.locator('#ovh [data-a="totitle"]').click();
  await expect(t.locator('[data-a="tcont"]')).toContainText("1234,50");

  // Cargar partida → ranura 1 (la partida de siempre)
  await t.locator('[data-a="tload"]').click();
  await expect(t.locator(".title-slot")).toHaveCount(3);
  await expect(t.locator(".title-slot").nth(0)).toContainText(SAVE.shopName);
  await expect(t.locator(".title-slot").nth(2)).toContainText("Vacía");
  await t.locator('[data-a="topen"][data-n="1"]').click();
  await expect(t).toHaveCount(0);
  expect(await game(page, (P) => [P.SLOT, P.S.day, P.S.money])).toEqual([1, SAVE.day, SAVE.money]);
  expect(dialogs).toEqual([]);
});

test("17c · Sobrescribir y borrar piden confirmación; importar un código en una ranura", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  const dialogs = [];
  page.on("dialog", (d) => dialogs.push(d.message()));
  await openGame(page, gamePath, { save: SAVE, title: true });
  const t = page.locator("#title");

  // Importar: se pega el código y se elige la ranura 3
  await t.locator('[data-a="tload"]').click();
  const code = Buffer.from(
    unescape(encodeURIComponent(JSON.stringify({ app: "pcs", v: 5, S: { ...SAVE, shopName: "Aitana Cards" } }))),
  ).toString("base64");
  await t.locator("#timpcode").fill(code);
  await t.locator('[data-a="timpcode"]').click();
  await expect(t).toContainText("Aitana Cards");
  await t.locator('[data-a="timpin"][data-n="3"]').click();
  await expect(t).toHaveCount(0);
  expect(await game(page, (P) => [P.SLOT, P.S.shopName, P.S.day])).toEqual([3, "Aitana Cards", SAVE.day]);
  expect(dialogs).toEqual([]); // la 3 estaba vacía: sin preguntar

  // Nueva partida encima de la ranura 1: pregunta antes de sobrescribir
  await game(page, (P) => P.A.totitle());
  await t.locator('[data-a="tnew"]').click();
  await t.locator('[data-a="tnewin"][data-n="1"]').click();
  expect(dialogs.pop()).toBe(`¿Sobrescribir la tienda «${SAVE.shopName}»? No se puede deshacer.`);
  await t.locator('[data-a="tadvgo"]').click();
  expect(await game(page, (P) => [P.SLOT, P.S.day, P.S.diff, P.S.pet])).toEqual([1, 1, "normal", "cat"]);

  // Borrar la ranura 3
  await game(page, (P) => P.A.totitle());
  await t.locator('[data-a="tload"]').click();
  await t.locator('[data-a="tdel"][data-n="3"]').click();
  expect(dialogs.pop()).toBe("¿Borrar la tienda «Aitana Cards»? No se puede deshacer.");
  await expect(t.locator(".title-slot").nth(2)).toContainText("Vacía");
  expect(await page.evaluate(() => localStorage.getItem("pcs-save-real-v3-s3"))).toBeNull();
});

test("17d · Ajustes rápidos del título: sonido, música y texto grande", async ({ page, gamePath }, info) => {
  vite(info);
  await openGame(page, gamePath, { save: SAVE, title: true });
  const t = page.locator("#title");
  await t.locator('[data-a="tset"]').click();
  await t.locator('[data-a="tbig"]').click();
  await expect(t.locator('[data-a="tbig"]')).toContainText("grande");
  expect(await page.evaluate(() => document.documentElement.classList.contains("ui-big"))).toBe(true);
  const snd0 = await game(page, (P) => P.SOUND);
  await t.locator('[data-a="tsnd"]').click();
  expect(await game(page, (P) => P.SOUND)).toBe(!snd0);
  await t.locator('[data-a="tback"]').click();
  await t.locator('[data-a="tcont"]').click();
  // El texto grande se queda en la partida que se abre
  expect(await game(page, (P) => P.S.ui.big)).toBe(true);
});
