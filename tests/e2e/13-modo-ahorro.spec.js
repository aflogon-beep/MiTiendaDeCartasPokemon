import { test, expect, freshGame, game } from "./helpers.js";

// Simula un móvil lento: cada fotograma tarda ~45 ms más (unos 18 FPS) mientras window.__slow sea true.
const SLOW_FRAMES = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__slow = false;
  window.requestAnimationFrame = (cb) =>
    raf((t) => {
      if (window.__slow) {
        const end = performance.now() + 45;
        while (performance.now() < end);
      }
      cb(window.__slow ? performance.now() : t);
    });
};

const notes = (page) => game(page, (P) => (P.VIS.notes || []).map((n) => n.t).join("\n"));

test.use({ deviceScaleFactor: 2 });

test("13 · Modo ahorro: con FPS bajos se activa solo", async ({ page, gamePath }) => {
  await freshGame(page, gamePath, { init: SLOW_FRAMES });

  // A ritmo normal no se activa
  await page.waitForTimeout(5000);
  expect(await game(page, (P) => ({ lite: P.LITE(), auto: !!P.VIS.autoLite, dpr: P.VIEW.dpr }))).toEqual({ lite: false, auto: false, dpr: 2 });

  // Con el móvil lento, a los pocos segundos se activa el modo ahorro y avisa
  await page.evaluate(() => (window.__slow = true));
  await expect.poll(() => game(page, (P) => P.LITE()), { timeout: 20_000 }).toBe(true);
  expect(await game(page, (P) => ({ auto: P.VIS.autoLite, perf: (P.S.ui && P.S.ui.perf) || "auto", dpr: P.VIEW.dpr, fps: Math.round(P.VIS.fpsE) }))).toMatchObject({ auto: true, perf: "auto", dpr: 1.25 });
  expect(await notes(page)).toContain("⚡ He activado el modo ahorro para que vaya más fluido");

  // En Más se ve que el rendimiento está en automático con ahorro
  await page.evaluate(() => (window.__slow = false));
  await page.locator('#nav [data-k="more"]').click();
  await expect(page.locator('#ovh [data-a="perf"]')).toContainText("Rendimiento: auto (ahorro)");
});

test("13b · Modo ahorro: si el jugador elige rendimiento alto, no se activa solo", async ({ page, gamePath }) => {
  await freshGame(page, gamePath, { init: SLOW_FRAMES });
  await page.locator('#nav [data-k="more"]').click();
  await page.locator('#ovh [data-a="perf"]').click(); // auto → alto
  await expect(page.locator('#ovh [data-a="perf"]')).toContainText("Rendimiento: alto");
  await page.locator('#ovh .sheet > [data-a="close"].big').click();

  await page.evaluate(() => (window.__slow = true));
  await page.waitForTimeout(9000);
  expect(await game(page, (P) => ({ lite: P.LITE(), auto: !!P.VIS.autoLite, slow: P.VIS.fpsE < 38 }))).toEqual({ lite: false, auto: false, slow: true });
  expect(await notes(page)).not.toContain("modo ahorro");
});
