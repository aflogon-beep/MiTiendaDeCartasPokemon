// Partida en la nube (docs/nube.md) contra un Supabase simulado (tests/fixtures/supa.js): crear cuenta, subir,
// subida al terminar el día, sin red (pendiente y reintento), aviso de otra partida en la nube, cargar una copia
// y registro de errores.
import { test, expect, freshGame, game, closeModals } from "./helpers.js";
import { mockSupa } from "../fixtures/supa.js";

test.beforeEach(({}, info) => test.skip(info.project.name !== "vite", "solo existe en la versión de Vite"));

/** Abre ☁️ Nube desde Más → Partida. */
async function openCloud(page) {
  await game(page, (P) => P.openM("backup"));
  await page.locator('#ovh [data-k="cloud"]').click();
  await expect(page.locator("#ovh h2")).toContainText("Nube");
}

test("22a · Crear cuenta, subir la partida y que se suba sola al terminar el día", async ({ page, gamePath }) => {
  const db = await mockSupa(page);
  await freshGame(page, gamePath);
  await openCloud(page);
  const ovh = page.locator("#ovh");
  // Usuario no válido y contraseña corta: avisa en español
  await page.locator("#cldu").fill("al");
  await page.locator("#cldp").fill("123");
  await ovh.locator('[data-a="cldup"]').click();
  await expect(ovh.locator(".cl-err")).toContainText("Usuario de 3 a 20");
  await page.locator("#cldu").fill("Alberto");
  await page.locator("#cldp").fill("secreto1");
  await ovh.locator('[data-a="cldup"]').click();
  await expect(ovh.locator(".cl-me")).toContainText("alberto");
  // Subir ahora
  await ovh.locator('[data-a="cldsave"]').click();
  await expect(ovh.locator(".cl-row")).toHaveCount(1);
  expect(db.saves.length).toBe(1);
  expect(db.saves[0]).toMatchObject({ mode: "real", slot: 1, day: 1 });
  // Al terminar el día se sube sola
  await game(page, (P) => ((P.S.day = 2), P.cloudDayEnd()));
  await expect.poll(() => db.saves.length).toBe(2);
  // Sin red: queda pendiente y se sube al volver
  db.down = true;
  await game(page, (P) => ((P.S.day = 3), P.cloudDayEnd()));
  await expect(page.locator("#toast, .toast").last()).toContainText("más tarde");
  expect(await game(page, (P) => P.pendingSlots())).toEqual(["real-1"]);
  db.down = false;
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect.poll(() => db.saves.length).toBe(3);
  expect(await game(page, (P) => P.pendingSlots())).toEqual([]);
  // Más → Ajustes enseña la cuenta
  await closeModals(page);
  await game(page, (P) => P.openM("more"));
  await expect(ovh).toContainText("Nube: alberto");
});

test("22b · Otra partida en la nube: aviso al entrar, seguir con esta o cargar una copia", async ({
  page,
  gamePath,
}) => {
  const db = await mockSupa(page);
  await freshGame(page, gamePath);
  await game(page, (P) => P.cloudSignUp("emma", "123456"));
  // Una copia del día 5 con 777 €
  const m5 = await game(page, async (P) => {
    Object.assign(P.S, { day: 5, money: 777 });
    P.saveNow();
    await P.cloudUpload("real", 1, localStorage.getItem("pcs-save-real-v3"), { day: 5 });
    Object.assign(P.S, { day: 6, money: 999 });
    P.saveNow();
    return P.S.money;
  });
  expect(m5).toBe(999);
  // Otro dispositivo sube algo: aquí ya no es la última que conocemos
  await game(page, (P) => P.setSynced("real", 1, null));
  await game(page, (P) => P.cloudCheck());
  const ovh = page.locator("#ovh");
  await expect(ovh.locator("h2")).toContainText("Hay otra partida en la nube");
  await expect(ovh.locator(".cl-cmp")).toContainText("Día 5");
  await expect(ovh.locator(".cl-cmp")).toContainText("Día 6");
  // Seguir con esta: se sube y pasa a ser la más nueva
  await ovh.locator('[data-a="cldkeep"]').click();
  await expect.poll(() => db.saves.length).toBe(2);
  expect(db.saves[1].day).toBe(6);
  // Cargar la copia del día 5 desde ☁️ Nube
  await openCloud(page);
  await expect(ovh.locator(".cl-row")).toHaveCount(2);
  await ovh.locator('.cl-row:has-text("Día 5") [data-a="cldask"]').click();
  await ovh.locator('[data-a="cldload"]').click();
  await expect.poll(() => game(page, (P) => [P.S.day, P.S.money])).toEqual([5, 777]);
  expect(await game(page, (P) => P.G.M)).toBe(null);
  // Cerrar sesión
  await openCloud(page);
  await ovh.locator('[data-a="cldout"]').click();
  await expect(page.locator("#cldu")).toBeVisible();
});

test("22c · Con cuenta, los errores del juego se apuntan en la nube", async ({ page, gamePath }) => {
  const db = await mockSupa(page);
  await freshGame(page, gamePath);
  await page.evaluate(() =>
    setTimeout(() => {
      throw new Error("sin cuenta");
    }),
  );
  await game(page, (P) => P.cloudSignUp("papa", "123456"));
  await page.evaluate(() =>
    setTimeout(() => {
      throw new Error("boom de prueba");
    }),
  );
  await expect.poll(() => db.logs.length).toBe(1);
  expect(db.logs[0]).toMatchObject({ kind: "error" });
  expect(db.logs[0].data.m).toContain("boom de prueba");
});

test("22d · Al entrar con la cuenta se suben también las otras ranuras (sin pisar las de otro dispositivo)", async ({
  page,
  gamePath,
}) => {
  const db = await mockSupa(page);
  await freshGame(page, gamePath);
  await game(page, (P) => {
    P.saveNow();
    const js = JSON.parse(localStorage.getItem("pcs-save-real-v3"));
    localStorage.setItem("pcs-save-real-v3-s2", JSON.stringify(Object.assign({}, js, { day: 8, savedAt: Date.now() })));
    localStorage.setItem(
      "pcs-save-real-v3-s3",
      JSON.stringify(Object.assign({}, js, { day: 15, savedAt: Date.now() })),
    );
  });
  await game(page, (P) => P.cloudSignUp("emma", "123456"));
  await game(page, (P) => P.cloudCheck());
  await expect.poll(() => db.saves.map((r) => r.slot).sort()).toEqual([1, 2, 3]);
  expect(db.saves.find((r) => r.slot === 3).day).toBe(15);
  // Sin cambios, no se vuelven a subir
  await game(page, (P) => P.cloudSyncAll());
  expect(db.saves.length).toBe(3);
  // Otro dispositivo sube la ranura 2: aquí no se pisa aunque se guarde otra vez
  db.saves.push(
    Object.assign(
      {},
      db.saves.find((r) => r.slot === 2),
      { id: 999, day: 30 },
    ),
  );
  await game(page, (P) => {
    const k = "pcs-save-real-v3-s2",
      js = JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(Object.assign(js, { savedAt: Date.now() + 1000 })));
    return P.cloudSyncAll();
  });
  expect(db.saves.filter((r) => r.slot === 2).length).toBe(2);
});
