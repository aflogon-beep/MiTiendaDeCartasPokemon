import { test, expect, openGame, game, settle } from "./helpers.js";

// Un toque en la historia (si sigue abierta): el primero completa la frase y el segundo pasa a la siguiente
const tap = (page) => page.evaluate(() => document.querySelector("#story")?.click());

// Fase I · paso 5: la historia de inicio.
const vite = (info) => test.skip(info.project.name !== "vite", "la historia solo existe en la versión de Vite");

/** Nueva partida desde el título hasta que empieza la historia. */
async function newGame(page, gamePath, { pet } = {}) {
  await openGame(page, gamePath, { title: true });
  await page.locator('[data-a="tnew"]').click();
  await page.locator('[data-a="tnewin"][data-n="1"]').click();
  if (pet) await page.locator(`[data-a="tadvp"][data-k="${pet}"]`).click();
  await page.locator('[data-a="tadvgo"]').click();
  await expect(page.locator("#story")).toBeVisible();
}

test("18a · Nueva partida → aventura → historia (saltando) → tutorial con Emma → juego", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await newGame(page, gamePath);
  await expect(page.locator("#stscene")).toHaveText("1 · El anuncio");
  await expect(page.locator("#stbub b")).toHaveText("Papá");
  // Mientras dura la historia, el tutorial espera y el juego está quieto
  await expect(page.locator("#tut")).toHaveCount(0);
  expect(await game(page, (P) => P.STORY)).toBe(true);

  await page.locator("#stskip").click();
  await expect(page.locator("#story")).toHaveCount(0);
  await expect(page.locator("#tut .tbub b")).toHaveText("Emma");
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-save-real-v3")));
  expect(s.storySeen).toBe(true);
  // la cámara vuelve a enseñar toda la tienda (como el botón ⤢)
  expect(await game(page, (P) => [P.STORY, P.VIEW.mode])).toEqual([false, "fit"]);
});

test("18b · Historia completa tocando hasta el final: se pide el nombre y aparece en el cartel", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  test.setTimeout(120_000);
  await newGame(page, gamePath, { pet: "dog" });
  const seen = { scenes: new Set(), texts: [], close: 0, wide: 0 };
  let named = false;
  for (let i = 0; i < 300 && (await page.locator("#story").count()); i++) {
    const info2 = await page.evaluate(() => ({
      scene: document.querySelector("#stscene")?.textContent,
      close: document.querySelector("#story")?.classList.contains("close"),
    }));
    if (info2.scene) seen.scenes.add(info2.scene);
    if (await page.locator("#stname").count()) {
      // Escena 7: el cartel está en blanco hasta elegir el nombre
      expect(await game(page, (P) => P.VIS.signReveal)).toBe(0);
      await expect(page.locator("#stbub [data-sug]")).toHaveText(["Gengar Cards", "Aitana Cards", "Poké Cards"]);
      await page.locator("#stbub [data-sug='Aitana Cards']").click();
      await expect(page.locator("#stname")).toHaveValue("Aitana Cards");
      await page.locator("#stname").fill("La Tienda de Alberto");
      await page.locator("#stnameok").click();
      // se pinta con la brocha y la historia sigue sola
      await expect.poll(() => game(page, (P) => P.VIS.signReveal), { timeout: 5000 }).toBe(1);
      named = true;
      continue;
    }
    // Si la frase se está escribiendo, un toque la completa (comprobar y tocar a la vez, sin carreras)
    const now = await game(page, (P) => {
      const n = P.storyNow();
      if (n && n.typing) document.querySelector("#story").click();
      return n;
    });
    if (!now) break;
    seen.texts.push(now.text);
    await expect(page.locator("#sttext")).toHaveText(now.text);
    await tap(page); // y pasa a la siguiente
  }
  await expect(page.locator("#story")).toHaveCount(0);
  expect(named).toBe(true);
  expect(seen.scenes.size).toBe(8);
  expect(seen.texts.join("\n")).toContain("Es un perro."); // la mascota elegida
  const r = await game(page, (P) => ({
    name: P.S.shopName,
    sign: P.shopName(),
    seen: P.S.storySeen,
    rv: P.VIS.signReveal,
  }));
  expect(r).toEqual({ name: "La Tienda de Alberto", sign: "La Tienda de Alberto", seen: true, rv: null });
  // Y después, el tutorial
  await expect(page.locator("#tut .tbub b")).toHaveText("Emma");
});

test("18c · Más → Ver la historia: se repite sin volver a pedir el nombre", async ({ page, gamePath }, info) => {
  vite(info);
  test.setTimeout(120_000);
  await openGame(page, gamePath, { init: () => {} });
  await game(page, (P) => (P.S.shopName = "Gengar Cards"));
  await page.locator("#tskip").click(); // sin tutorial
  await settle(page);
  await page.locator('#nav [data-k="more"]').click();
  await page.locator('#ovh [data-a="storyre"]').click();
  await expect(page.locator("#story")).toBeVisible();
  for (let i = 0; i < 300 && (await page.locator("#story").count()); i++) {
    expect(await page.locator("#stname").count()).toBe(0);
    await tap(page);
    await tap(page);
  }
  await expect(page.locator("#story")).toHaveCount(0);
  expect(await game(page, (P) => [P.S.shopName, P.S.storySeen, P.STORY, P.VIS.signReveal])).toEqual([
    "Gengar Cards",
    true,
    false,
    null,
  ]);
});

test("18d · Con «menos animaciones» el texto sale entero, sin máquina de escribir", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await page.locator("#tskip").click();
  await settle(page);
  await game(page, (P) => {
    P.S.ui = Object.assign({}, P.S.ui, { calm: true });
    P.applyUI();
    P.startStory({ replay: true });
  });
  await expect(page.locator("#sttext")).toHaveText("Chicos, venid. Tengo que contaros algo muy serio.", {
    timeout: 300,
  });
  await page.locator("#stskip").click();
  await expect(page.locator("#story")).toHaveCount(0);
});
