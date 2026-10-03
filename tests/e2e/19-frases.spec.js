import { test, expect, openGame, game, skipTutorial } from "./helpers.js";

// Fase I · paso 6: frases recurrentes de Emma y Álvaro y visitas de papá.
const vite = (info) => test.skip(info.project.name !== "vite", "solo existe en la versión de Vite");

test("19a · Frases: bocadillo con retrato, sin repetirse seguidas y nunca durante el tutorial", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  // Con el tutorial en marcha, Emma no interrumpe
  expect(await game(page, (P) => P.quip("fake"))).toBe(false);
  await skipTutorial(page);

  // Pillar una falsa (el juego la pide así al acertar en Examinar)
  expect(await game(page, (P) => P.quip("fake"))).toBe(true);
  const q = page.locator("#quip.on");
  await expect(q.locator("b")).toHaveText("Emma");
  await expect(q.locator("p")).toHaveText("Ja. Ni que fuera tonta.");
  expect(await q.locator("img").getAttribute("src")).toMatch(/^data:image\/png/);
  // Justo después no sale otra (hueco mínimo entre frases)
  expect(await game(page, (P) => P.quip("thief"))).toBe(false);
  // El bocadillo se va solo
  await expect(page.locator("#quip.on")).toHaveCount(0, { timeout: 8000 });
});

test("19b · Los avisos llegan desde la lógica del juego (ladrón) y desde los sobres (Gengar)", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await skipTutorial(page);
  // core no conoce la interfaz: pide la frase por el bus de eventos
  await game(page, (P) => P.emit("quip", "thief"));
  await expect(page.locator("#quip.on p")).toHaveText("¡Al ladrón! ¡Que alguien active el escudo deflector!");
  await expect(page.locator("#quip.on b")).toHaveText("Álvaro");
  await game(page, (P) => P.resetQuips());
  await game(page, (P) => P.quipOpen(5, [{ name: "Gengar", r: "R" }]));
  await expect(page.locator("#quip.on p")).toHaveText("¡GENGAAAAR! ¡Este no se vende! ❤️");
  // Abrir muchos sobres el mismo día: Emma protesta (una vez al día)
  await game(page, (P) => P.resetQuips());
  await game(page, (P) => P.quipOpen(1, []));
  await expect(page.locator("#quip.on p")).toHaveText("¡ÁLVARO! ¡Eso era para VENDER!");
});

test("19c · Papá entra en la tienda, da su consejo y se va; también al subir de nivel", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  test.setTimeout(60_000);
  await openGame(page, gamePath);
  await skipTutorial(page);
  // Visita normal: entra, consejo, despedida y se va
  const visit = game(page, (P) => P.papaEnters("tip"));
  await expect(page.locator("#cvw .papa-cv")).toHaveCount(1);
  await expect(page.locator("#quip.on b")).toHaveText("Papá", { timeout: 5000 });
  const tip = await page.locator("#quip.on p").textContent();
  expect(await game(page, (P, t) => P.PAPA.tips.includes(t), tip)).toBe(true);
  await expect(page.locator("#quip.on p")).toHaveText("Me voy, que llego tarde a pecho y bíceps.", { timeout: 8000 });
  await visit;
  await expect(page.locator("#cvw .papa-cv")).toHaveCount(0);
  expect(await game(page, (P) => [P.VIS.papa, P.S.papa.last === P.S.day])).toEqual([null, true]);

  // Al subir de nivel viene solo, en cuanto no hay paneles abiertos
  await game(page, (P) => {
    P.closeM();
    P.S.papa.lv = P.level() - 1;
  });
  await expect(page.locator("#quip.on p")).toHaveText(
    "¡Mis padawans ya son maestros! Me voy a celebrarlo… haciendo burpees.",
    { timeout: 15_000 },
  );
});

test("19d · Más frases: una al subir la persiana y, al repetirse una situación, otra distinta", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await skipTutorial(page);
  await game(page, (P) => {
    P.closeM();
    P.resetQuips();
  });
  // Al subir la persiana, Emma o Álvaro dicen algo (según el día: normal, lluvia, lanzamiento, VIP, torneo o rival)
  await page.locator("#act").click();
  await expect(page.locator("#quip.on p")).not.toBeEmpty({ timeout: 6000 });
  const t = await page.locator("#quip.on p").textContent();
  expect(
    await game(
      page,
      (P, t) => ["open", "rain", "launch", "vip", "tour", "rival"].some((k) => P.QUIPS[k].some((q) => q[2] === t)),
      t,
    ),
  ).toBe(true);
  // La misma situación otra vez: otra frase
  await game(page, (P) => P.resetQuips());
  await game(page, (P) => P.quip("fake"));
  const a = await page.locator("#quip.on p").textContent();
  await game(page, (P) => P.resetQuips());
  await game(page, (P) => P.quip("fake"));
  await expect(page.locator("#quip.on p")).not.toHaveText(a);
});
