import { test, expect, openGame, game } from "./helpers.js";

// R4 · App instalable: manifest con iconos, service worker activo y el juego vuelve a abrir sin red.
// Los demás tests bloquean el service worker (playwright.config.js) para que la red simulada lo vea todo.
test.use({ serviceWorkers: "allow" });

test("15 · App instalable: manifest, iconos, service worker y arranque sin red", async ({ page, gamePath }, info) => {
  test.skip(info.project.name !== "vite", "la PWA solo existe en la versión de Vite");

  await openGame(page, gamePath);

  // Manifest enlazado desde la página, con nombre, colores e iconos (también el «maskable» para Android)
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const res = await page.request.get(new URL(href, page.url()).href);
  expect(res.ok()).toBe(true);
  const mf = await res.json();
  expect(mf).toMatchObject({
    name: "Pokémon Card Shop",
    display: "standalone",
    theme_color: "#1b1f2a",
    start_url: "./",
  });
  expect(mf.icons.map((i) => i.sizes + (i.purpose ? " " + i.purpose : ""))).toEqual([
    "192x192",
    "512x512",
    "512x512 maskable",
  ]);
  for (const icon of [...mf.icons.map((i) => i.src), "icons/apple-touch-icon.png", "icons/favicon-64.png"]) {
    const r = await page.request.get(new URL(icon, page.url()).href);
    expect(r.ok(), icon).toBe(true);
    expect(r.headers()["content-type"]).toContain("image/png");
  }

  // Service worker instalado y controlando la página
  await page.waitForFunction(
    () => navigator.serviceWorker.ready.then(() => !!navigator.serviceWorker.controller),
    null,
    {
      timeout: 30_000,
    },
  );
  const day = await game(page, (P) => P.S.day);

  // Sin red: el juego sale del service worker y las cartas de IndexedDB, como siempre
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.context().setOffline(true);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector("#load") && !!window.__pcs.S, null, { timeout: 60_000 });
  expect(await game(page, (P) => [P.MODE, P.S.day, P.CARDS.length > 0])).toEqual(["real", day, true]);
  await page.context().setOffline(false);
});
