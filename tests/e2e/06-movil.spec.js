import { test, expect, freshGame, game, dismissInfo } from "./helpers.js";

// Elementos visibles que se salen por los lados de la pantalla (ignorando los que están
// dentro de un contenedor que recorta o desplaza en horizontal, como las pestañas).
const overflowing = () =>
  [...document.querySelectorAll("#game *, #nav *, #ovh *, #tut *, #toast *")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.position === "fixed") return false;
      if (r.right <= innerWidth + 0.5 && r.left >= -0.5) return false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox !== "visible") {
          const ar = a.getBoundingClientRect();
          if (ar.right <= innerWidth + 0.5 && ar.left >= -0.5) return false;
        }
      }
      return true;
    })
    .slice(0, 5)
    .map(
      (el) =>
        `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${el.className} → ${Math.round(el.getBoundingClientRect().left)}…${Math.round(el.getBoundingClientRect().right)}`,
    );

const layout = () => {
  const r = (s) => {
    const b = document.querySelector(s).getBoundingClientRect();
    return { top: Math.round(b.top), height: Math.round(b.height), width: Math.round(b.width) };
  };
  return { cvw: r("#cvw"), act: r("#act"), doc: document.documentElement.scrollWidth, win: innerWidth };
};

for (const [w, h] of [
  [360, 780],
  [390, 844],
]) {
  test.describe(`${w} px`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    test(`6 · Móvil ${w} px: sin desbordamiento horizontal y la tienda mide lo mismo abierta y cerrada`, async ({
      page,
      gamePath,
    }, info) => {
      await freshGame(page, gamePath);
      // Con algo de stock para que la lista de comprobación del cierre tenga contenido
      await game(page, (P) => {
        P.SETS.forEach((s) => (P.S.sealed[s.id] = 6));
        P.assignSlots();
        P.hud();
      });

      // Cerrada
      await page.waitForTimeout(400);
      expect(await page.evaluate(overflowing)).toEqual([]);
      const closed = await page.evaluate(layout);
      expect(closed.doc).toBeLessThanOrEqual(w);
      await expect(page.locator("#chk")).not.toBeEmpty();

      // Paneles principales
      for (const k of ["packs", "coll", "retos", "more"]) {
        await page.locator(`#nav [data-k="${k}"]`).click();
        await expect(page.locator("#ovh .sheet")).toBeVisible();
        await page.waitForTimeout(350);
        expect(await page.evaluate(overflowing), `panel ${k}`).toEqual([]);
        await dismissInfo(page);
      }

      // Abierta
      await page.locator("#act").click();
      await expect(page.locator("#act")).toContainText("Tienda abierta");
      await page.waitForTimeout(400);
      const open = await page.evaluate(layout);
      expect(await page.evaluate(overflowing)).toEqual([]);
      expect(open.doc).toBeLessThanOrEqual(w);

      // El botón principal no se mueve al abrir. La tienda (canvas) tampoco se mueve; en la versión de Vite,
      // con la tienda abierta no hay texto de ayuda debajo y la tienda gana ese hueco (58 px, mejora pedida)
      expect(open.act).toEqual(closed.act);
      if (info.project.name === "referencia") expect(open.cvw).toEqual(closed.cvw);
      else expect(open.cvw).toEqual({ ...closed.cvw, height: closed.cvw.height + 58 });
    });
  });
}
