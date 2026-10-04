import { test, expect, openGame, freshGame, game, closeModals, mockNetwork, skipTutorial } from "./helpers.js";
import { readFileSync } from "node:fs";

// Mejoras tras la Fase I: funda de plástico en las cartas gradeadas y aviso de versión nueva.
const SAVE = JSON.parse(readFileSync(new URL("../fixtures/partida-v22.json", import.meta.url), "utf8")).S;
const vite = (info) => test.skip(info.project.name !== "vite", "solo existe en la versión de Vite");

test("20a · Las cartas gradeadas salen en su funda, con la nota en la etiqueta", async ({ page, gamePath }, info) => {
  vite(info);
  await openGame(page, gamePath, { save: SAVE });
  await page.waitForTimeout(1800);
  await closeModals(page);
  const name = await game(page, (P) => {
    P.S.items.forEach((i) => delete i.gr);
    const it = P.S.items.find((i) => P.BYID[i.c] && !i.gq);
    it.gr = 9;
    P.G.cSort = "val";
    P.collSel = null;
    P.openM("coll");
    return P.BYID[it.c].name;
  });
  // En la colección: una sola funda, con «PGS 9»
  await expect(page.locator("#ovh .tile .slabm")).toHaveCount(1);
  await expect(page.locator("#ovh .tile .slabm-lb")).toHaveText("PGS9");
  // En la ficha de la carta: la funda completa, con nombre, nota, certificado y código de barras
  await game(page, (P) => {
    P.collSel = P.gk(P.S.items.find((i) => i.gr));
    P.openM("card");
  });
  await expect(page.locator("#cbig.gr .slab.g9 .slab-lb b")).toHaveText(name);
  await expect(page.locator("#cbig .slab .gnum")).toHaveText("9");
  await expect(page.locator("#cbig .slab .gtx")).toHaveText("MINT");
  await expect(page.locator("#cbig .slab .slab-cert")).toContainText(/Cert\. \d{4} \d{4}/);
  await expect(page.locator("#cbig .slab .slab-bar")).toHaveCount(1);
  // La funda se inclina con el dedo, como la carta (es la que mueve la inclinación 3D)
  expect(await game(page, (P) => P.TILT.el === document.querySelector("#cbig .slab"))).toBe(true);
  // Una GEM MINT 10 lleva etiqueta dorada, también en la colección
  await game(page, (P) => {
    P.S.items.find((i) => i.gr).gr = 10;
    P.openM("coll");
  });
  await expect(page.locator("#ovh .tile .slabm.g10")).toHaveCount(1);
  // Una carta sin gradear no lleva funda
  await game(page, (P) => {
    P.collSel = P.gk(P.S.items.find((i) => !i.gr && P.BYID[i.c]));
    P.openM("card");
  });
  await expect(page.locator("#cbig .slabm")).toHaveCount(0);
});

test("20b · Versión nueva: aviso con «Actualizar», que guarda la partida antes de recargar", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath, { save: SAVE });
  await game(page, (P) => {
    window.__updated = 0;
    P.S.money = 4321;
    P.showUpdate(() => (window.__updated = 1)); // lo mismo que pide el service worker cuando hay versión nueva
  });
  const u = page.locator("#upd");
  await expect(u).toContainText("Hay una versión nueva del juego");
  await u.locator("#updgo").click();
  expect(await page.evaluate(() => window.__updated)).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-save-real-v3")).money)).toBe(4321);
  // «Más tarde» lo cierra
  await game(page, (P) => P.showUpdate(() => {}));
  await page.locator("#updno").click();
  await expect(page.locator("#upd")).toHaveCount(0);
});

test("20c · Vibración: interruptor en Ajustes (activada por defecto; apagada, no vibra)", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await page.addInitScript(() => {
    window.__vib = [];
    Object.defineProperty(navigator, "vibrate", { value: (p) => (window.__vib.push(p), true), configurable: true });
  });
  await openGame(page, gamePath);
  await closeModals(page);
  await page.locator('#nav [data-k="more"]').click();
  const btn = page.locator('#ovh [data-a="vibtog"]');
  await expect(btn).toContainText("Vibración: sí");
  await game(page, (P) => P.vibe(30));
  expect(await page.evaluate(() => window.__vib)).toEqual([30]);
  // Apagada: se guarda y no vibra
  await btn.click();
  await expect(btn).toContainText("Vibración: no");
  expect(await page.evaluate(() => localStorage.getItem("pcs-vibe"))).toBe("0");
  await game(page, (P) => P.vibe([60, 40, 140]));
  expect(await page.evaluate(() => window.__vib)).toEqual([30]);
  // Al volver a encenderla, vibra un momento para que se note
  await btn.click();
  await expect(btn).toContainText("Vibración: sí");
  expect(await page.evaluate(() => window.__vib)).toEqual([30, 40]);
});

test("20d · Álvaro en la caja con lo elegido en Personalizar; «su pelo» y «sin gorra»", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await closeModals(page);
  // Partidas de antes: S.me trae los colores por defecto copiados; solo cuenta lo que no es el de por defecto
  const mig = await game(page, (P) => {
    P.S.me = { shirt: "#e3350d", hair: "#222", cap: "#e3350d", hs: 0 };
    const a = P.meSetOf();
    P.S.me = { shirt: "#2fa557", hair: "#222", cap: "#8e4cb5", hs: 0 };
    const b = P.meSetOf();
    delete P.S.me;
    return [a, b];
  });
  expect(mig).toEqual([{}, { shirt: "#2fa557", cap: "#8e4cb5" }]);
  // Personalizar: la vista previa es Álvaro; por defecto, su camiseta azul, su pelo y sin gorra
  await game(page, (P) => P.openM("custom"));
  await expect(page.locator('#ovh img[src^="data:image/png"]')).toHaveCount(1);
  await expect(page.locator('#ovh .swc.on[data-k="shirt"]')).toHaveAttribute("data-n", "#3f7fc4");
  await expect(page.locator('#ovh .swc.on[data-k="hair"]')).toHaveAttribute("aria-label", "Su pelo");
  await expect(page.locator('#ovh .swc.on[data-k="cap"]')).toHaveAttribute("aria-label", "Sin gorra");
  const before = await page.locator("#ovh img").getAttribute("src");
  // Elegir gorra verde y luego quitarla
  await page.locator('#ovh .swc[data-k="cap"][data-n="#2fa557"]').click();
  expect(await game(page, (P) => P.S.meSet)).toEqual({ cap: "#2fa557" });
  expect(await page.locator("#ovh img").getAttribute("src")).not.toBe(before);
  expect(await game(page, (P) => P.alvaroLook().cap)).toBe("#2fa557");
  await page.locator('#ovh .swc[data-k="cap"][aria-label="Sin gorra"]').click();
  expect(await game(page, (P) => [P.S.meSet.cap, P.alvaroLook().cap, P.S.me.cap])).toEqual(["", null, "#2fa557"]);
  expect(await page.locator("#ovh img").getAttribute("src")).toBe(before);
});

test("20e · Emma: junto al ordenador; sin clientes y con sofá, al sofá; vuelve cuando entra alguien", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await closeModals(page);
  const at = () => game(page, (P) => P.EMMA.at);
  // Sin sofá: siempre en la mesa
  await game(page, (P) => {
    P.S.decor.sofa = 0;
    P.custs.length = 0;
    P.speed = 4;
  });
  await page.waitForTimeout(2500);
  expect(await at()).toBe("desk");
  // Con sofá y sin clientes: va al sofá sin pisar muebles
  await game(page, (P) => {
    P.S.decor.sofa = 1;
    window.__emma = { bad: 0, n: 0 };
    const tick = () => {
      const E = P.EMMA;
      if (E.at === "walk") {
        window.__emma.n++;
        if (P.navObstacles().some(([x0, y0, x1, y1]) => E.x > x0 && E.x < x1 && E.y > y0 && E.y < y1))
          window.__emma.bad++;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await expect.poll(at, { timeout: 15_000 }).toBe("sofa");
  // Entra un cliente: vuelve a la mesa
  await game(page, (P) => {
    P.S.phase = "open";
    P.spawn();
  });
  await expect.poll(at, { timeout: 15_000 }).toBe("desk");
  const w = await page.evaluate(() => window.__emma);
  expect(w.n).toBeGreaterThan(10);
  expect(w.bad).toBe(0);
});

test("20f · Con cajero, el cajero se pone en la caja y Álvaro pasea por la tienda; sin cajero, vuelve a la caja", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await openGame(page, gamePath);
  await closeModals(page);
  const st = () => game(page, (P) => P.ALVARO.at);
  expect(await st()).toBe("till");
  await game(page, (P) => {
    P.S.staff.cashier = 1; // primero sin muebles (la cuadrícula aún no está hecha)
    P.speed = 4;
    window.__alv = { bad: [], spots: 0 };
    let was = "";
    const tick = () => {
      const A = P.ALVARO;
      // Fuera de la zona de detrás del mostrador, nunca dentro de un mueble
      if (A.at === "walk" && !(A.x >= 712 && A.y <= 484))
        for (const [x0, y0, x1, y1] of P.navObstacles())
          if (A.x > x0 && A.x < x1 && A.y > y0 && A.y < y1) window.__alv.bad.push([Math.round(A.x), Math.round(A.y)]);
      if (A.at === "stay" && was !== "stay" && A.y < 484 && A.x < 712) window.__alv.spots++;
      was = A.at;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await expect.poll(() => page.evaluate(() => window.__alv.spots), { timeout: 30_000 }).toBeGreaterThanOrEqual(1);
  await game(page, (P) => P.DECOR.forEach((d) => (P.S.decor[d.k] = 1)));
  await expect.poll(() => page.evaluate(() => window.__alv.spots), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
  // Sin cajero, vuelve a la caja
  await game(page, (P) => (P.S.staff.cashier = 0));
  await expect.poll(st, { timeout: 30_000 }).toBe("till");
  expect(await game(page, (P) => [P.ALVARO.x, P.ALVARO.y])).toEqual([748, 330]);
  expect(await page.evaluate(() => window.__alv.bad)).toEqual([]);
  expect(errs).toEqual([]);
});

test("20g · Título: sin el HUD detrás, la cámara recorre la tienda y Emma, Álvaro y papá junto al icono", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await mockNetwork(page);
  await page.goto(gamePath);
  const t = page.locator("#title");
  await t.locator('[data-a="tnew"]').waitFor({ timeout: 30_000 });
  await expect(t.locator(".title-pj")).toHaveCount(3);
  await expect(page.locator("#hud")).toBeHidden();
  await expect(page.locator("#nav")).toBeHidden();
  const ox = () => page.evaluate(() => [window.__pcs.VIEW.ox, window.__pcs.VIEW.oy]);
  const a = await ox();
  await page.waitForTimeout(1500);
  expect(await ox()).not.toEqual(a);
  // Al empezar la partida, todo vuelve
  await t.locator('[data-a="tnew"]').click();
  await t.locator('[data-a="tnewin"][data-n="1"]').click();
  await t.locator('[data-a="tadvgo"]').click();
  await page.locator("#stskip").click();
  await expect(page.locator("#title")).toHaveCount(0);
  await expect(page.locator("#hud")).toBeVisible();
  await expect(page.locator("#nav")).toBeVisible();
});

test("20h · Prepara tu aventura: Álvaro reacciona a lo que eliges y la mascota sale a su lado", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await mockNetwork(page);
  await page.goto(gamePath);
  const t = page.locator("#title");
  await t.locator('[data-a="tnew"]').click({ timeout: 30_000 });
  await t.locator('[data-a="tnewin"][data-n="1"]').click();
  const face = () => game(page, (P) => P.heroFace());
  const img = () => page.evaluate(() => document.querySelector("#advpj").toDataURL());
  expect(await face()).toBe("happy");
  await t.locator('[data-a="tadvd"][data-k="dificil"]').click();
  expect(await face()).toBe("sweat");
  await t.locator('[data-a="tadvd"][data-k="facil"]').click();
  expect(await face()).toBe("laugh");
  await t.locator('[data-a="tadvp"][data-k="none"]').click();
  const none = await img();
  await t.locator('[data-a="tadvp"][data-k="dog"]').click();
  expect(await face()).toBe("stars");
  await t.locator('[data-a="tadvp"][data-k="none"]').click();
  expect(await img()).toBe(none); // sin mascota, solo Álvaro
  await t.locator('[data-a="tadvp"][data-k="dog"]').click();
  const dog = await img();
  await t.locator('[data-a="tadvp"][data-k="bunny"]').click();
  expect(await img()).not.toBe(dog);
});

test("20i · Historia: la tienda a pantalla completa y, en los primeros planos, quien habla mueve la boca", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await mockNetwork(page);
  await page.goto(gamePath);
  const t = page.locator("#title");
  await t.locator('[data-a="tnew"]').click({ timeout: 30_000 });
  await t.locator('[data-a="tnewin"][data-n="1"]').click();
  await t.locator('[data-a="tadvgo"]').click();
  await expect(page.locator("#story.wide")).toBeVisible();
  // Planos generales: la tienda ocupa toda la pantalla (sin la franja negra de antes)
  const h = await page.evaluate(() => document.querySelector("#cv").getBoundingClientRect().height / innerHeight);
  expect(h).toBeGreaterThan(0.95);
  // Hasta el primer primer plano
  for (let i = 0; i < 10 && !(await page.locator("#story.close").count()); i++)
    await page.evaluate(() => {
      const s = document.querySelector("#story");
      if (window.__pcs.storyNow().typing) s.click();
      s.click();
    });
  await expect(page.locator("#story.close .st-bg")).toHaveCount(1); // la tienda difuminada de fondo
  // Mientras se escribe la frase, el retrato de quien habla cambia (boca)
  const shots = await page.evaluate(async () => {
    const c = document.querySelector(".st-por"),
      l = [];
    for (let i = 0; i < 6; i++) {
      l.push(c.toDataURL());
      await new Promise((r) => setTimeout(r, 60));
    }
    return new Set(l).size;
  });
  expect(shots).toBeGreaterThan(1);
  // Al terminar, la vista vuelve a su sitio
  await page.locator("#stskip").click();
  const h2 = await page.evaluate(() => document.querySelector("#cv").getBoundingClientRect().height / innerHeight);
  expect(h2).toBeLessThan(0.8);
});

test("20j · Cuando Emma o Álvaro dicen una frase, sale un bocadillo encima de su muñeco", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await openGame(page, gamePath);
  await closeModals(page);
  const t = await game(page, (P) => {
    P.sayBubble("alvaro", "happy", "¡Hola!", 1500);
    return [P.VIS.talk.who, P.VIS.talk.until > performance.now()];
  });
  expect(t).toEqual(["alvaro", true]);
  await page.waitForTimeout(1700);
  expect(await game(page, (P) => P.VIS.talk.until > performance.now())).toBe(false);
});

test("20k · Compartir la partida con el menú del sistema (archivo .txt que se puede volver a importar)", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await page.addInitScript(() => {
    window.__shared = null;
    navigator.canShare = () => true;
    navigator.share = async (d) => {
      window.__shared = { name: d.files[0].name, type: d.files[0].type, text: await d.files[0].text() };
    };
  });
  await freshGame(page, gamePath);
  await page.locator('#nav [data-k="more"]').click();
  await page.locator('#ovh [data-a="m"][data-k="backup"]').click();
  await page.locator('#ovh [data-a="sharesave"]').click();
  await expect(page.locator("#toast")).toContainText("Copia compartida");
  const sh = await page.evaluate(() => window.__shared);
  const day = await game(page, (P) => P.S.day);
  expect([sh.name, sh.type]).toEqual([`pokemon-card-shop-dia${day}.txt`, "text/plain"]);
  expect(JSON.parse(sh.text)).toMatchObject({ app: "pcs", v: 5 });
});

test("20l · Lista de deseos: desde un hueco del álbum; Emma avisa si un cliente la vende", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await page.locator('#nav [data-k="coll"]').click();
  await page.locator('#ovh [data-a="m"][data-k="album"]').click();
  await page.locator('#ovh [data-a="albnext"]').click();
  // Tocar un hueco vacío: se ve qué carta es y se añade a la lista
  const slot = page.locator("#ovh .pk.miss .pk-w").first();
  const id = await slot.getAttribute("data-k");
  await slot.click();
  await expect(page.locator("#ovh .albwish")).toBeVisible();
  await page.locator('#ovh [data-a="wishtog"]').click();
  expect(await game(page, (P) => P.S.wish)).toEqual([id]);
  await expect(page.locator(`#ovh .pk-w[data-k="${id}"]`)).toHaveText("⭐");
  await expect(page.locator('#ovh [data-a="wishtog"]')).toHaveText("Quitar de deseos");
  await game(page, (P) => P.closeM());
  // Un cliente que vende esa carta: Emma avisa
  await game(page, (P, id) => P.wishCheck(id, "sell"), id);
  const name = await game(page, (P, id) => P.BYID[id].name, id);
  await expect(page.locator("#quip")).toContainText(name);
  await expect(page.locator("#quip b")).toHaveText("Emma");
});

test("20m · Stock: el dinero disponible a la vista (baja al comprar) y el número de sobres en grande", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await page.locator('#nav [data-k="packs"]').click();
  const cash = page.locator("#ovh .stk-cash b");
  const m0 = await game(page, (P) => P.fmt(P.S.money));
  await expect(cash).toHaveText(m0);
  const q0 = await page.locator("#ovh .stk-qty b").first().textContent();
  expect(await game(page, (P) => String(P.S.sealed[P.SETS[0].id]))).toBe(q0);
  await game(page, (P) => (P.S.express = true));
  await page.locator('#ovh [data-a="buyp"][data-n="6"]').first().click();
  const m1 = await game(page, (P) => P.fmt(P.S.money));
  expect(m1).not.toBe(m0);
  await expect(cash).toHaveText(m1);
  await expect(page.locator("#ovh .stk-cash.down i")).toContainText("−");
  await expect(page.locator("#ovh .stk-qty b").first()).toHaveText(String(+q0 + 6));
});

test("20n · Los avisos de la partida no salen encima del título: se enseñan al entrar (§4)", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await mockNetwork(page);
  await page.addInitScript((js) => {
    if (sessionStorage.getItem("__s20n")) return;
    localStorage.setItem("pcs-save-real-v3", js);
    sessionStorage.setItem("__s20n", "1");
  }, JSON.stringify(SAVE));
  await page.goto(gamePath);
  const t = page.locator("#title");
  await t.locator('[data-a="tcont"]').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await game(page, (P) => {
    P.emit("toast", "AVISO DE LA PARTIDA");
    P.emit("toast", "AVISO GENERAL", { keep: true });
  });
  await page.waitForTimeout(400);
  await expect(page.locator("#toast")).not.toContainText("AVISO");
  // Continuar: salen los dos
  await t.locator('[data-a="tcont"]').click();
  await expect(page.locator("#toast")).toContainText("AVISO DE LA PARTIDA");
  await expect(page.locator("#toast")).toContainText("AVISO GENERAL", { timeout: 5000 });
  // Partida nueva: el de la partida de fondo no; el general, al terminar la historia
  await game(page, (P) => P.showTitle());
  await game(page, (P) => {
    P.emit("toast", "OTRO DE LA PARTIDA");
    P.emit("toast", "OTRO GENERAL", { keep: true });
  });
  await t.locator('[data-a="tnew"]').click();
  await t.locator('[data-a="tnewin"][data-n="2"]').click();
  await t.locator('[data-a="tadvgo"]').click();
  await page.locator("#stskip").click();
  await expect(page.locator("#toast")).toContainText("OTRO GENERAL", { timeout: 5000 });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window.__pcs.VIS.notes || []).map((n) => n.t))).not.toContain("OTRO DE LA PARTIDA");
});

test("20o · Velocidad 1×, 1,25×, 1,5×, 2× y 4×; Retos y Stock dicen qué cuenta su número rojo", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  // Velocidad
  const sp = page.locator('#cvctl [data-a="speed"]');
  const seen = [];
  for (let i = 0; i < 5; i++) {
    seen.push(await sp.textContent());
    await sp.click();
  }
  expect(seen).toEqual(["1×", "1,25×", "1,5×", "2×", "4×"]);
  await expect(sp).toHaveText("1×");
  // Retos: premios por cobrar, con un botón que lleva a donde se cobran
  await game(page, (P) => {
    P.S.dm.list[0].done = true;
    P.hud();
    P.openM("medals");
  });
  await expect(page.locator("#ovh .claimbox")).toContainText("1 misión por cobrar");
  await page.locator('#ovh [data-a="goclaim"][data-k="mis"]').click();
  await expect(page.locator('#ovh [data-a="mclaim"]').first()).toBeVisible();
  // Stock: estanterías sin sobres
  await game(page, (P) => {
    P.closeM();
    const s = P.S.slots.find(Boolean);
    P.S.sealed[s] = 0;
    P.openM("packs");
  });
  await expect(page.locator("#ovh .stk-out")).toContainText("sin sobres");
  await expect(page.locator("#ovh .stk-qty.out b").first()).toHaveText("0");
});

test("20p · Alertas: Emma avisa si una carta tuya sube mucho; flecha en la colección; recordatorio de copia", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await page.addInitScript(() => {
    window.__shared = 0;
    navigator.canShare = () => true;
    navigator.share = async () => void window.__shared++;
  });
  await freshGame(page, gamePath);
  // Una carta tuya que ha subido un 30 % esta semana
  const name = await game(page, (P) => {
    const c = P.CARDS.find((x) => P.price(x.id) >= 2);
    P.S.items.push({ i: P.S.nid++, c: c.id, k: "NM", rv: false, cost: 1, case: null, res: false });
    const p = P.S.prices[c.id].p;
    P.S.prices[c.id].h = [p / 1.3, p / 1.3, p / 1.3, p / 1.3, p / 1.3, p / 1.3, p / 1.3, p];
    P.S.palertDay = null;
    P.S.bkpAt = Date.now(); // el recordatorio, aún no
    return c.name;
  });
  await expect(page.locator("#quip")).toContainText(`¡Tu ${name} ha subido un 30 %`, { timeout: 5000 });
  // En la colección, la flecha ↑30 %
  await game(page, (P) => P.openM("coll"));
  await expect(page.locator("#ovh .trend.up").first()).toHaveText("↑30 %");
  await game(page, (P) => P.closeM());
  // Recordatorio de copia: hace 8 días que no se guarda
  await game(page, (P) => (P.S.bkpAt = Date.now() - 8 * 24 * 3600 * 1000));
  await expect(page.locator("#bkp")).toBeVisible({ timeout: 5000 });
  await page.locator('#bkp [data-a="bkplater"]').click();
  await expect(page.locator("#bkp")).toHaveCount(0);
  await page.waitForTimeout(1500);
  await expect(page.locator("#bkp")).toHaveCount(0); // pospuesto 2 días
  // Guardar copia: se comparte y vuelve a contar
  await game(page, (P) => {
    P.S.bkpAt = Date.now() - 8 * 24 * 3600 * 1000;
    P.S.bkpSnooze = 0;
  });
  await page.locator('#bkp [data-a="bkpsave"]').click({ timeout: 5000 });
  await expect.poll(() => page.evaluate(() => window.__shared)).toBe(1);
  expect(await game(page, (P) => Date.now() - P.S.bkpAt < 60_000)).toBe(true);
});

test("20q · Ticket de cierre: por qué se fueron sin comprar", async ({ page, gamePath }, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await game(page, (P) => {
    P.S.summary = Object.assign({}, P.S.summary || {}, {
      day: 1,
      inc: 10,
      cust: 20,
      lost: 9,
      rent: 15,
      sal: 0,
      net: 1000,
      why: { pat: 4, "kp:a": 2, cp: 1, "ks:a": 1, "rv:a": 1 },
    });
    P.openM("sum");
  });
  const w = page.locator("#ovh .twhy .tl");
  await expect(w).toHaveText([
    /Cansados de esperar\s*4/,
    /Les pareció caro\s*3/,
    /No había lo que buscaban\s*1/,
    /Se fueron a la rival\s*1/,
  ]);
});

test("20r · Al subir de nivel, Emma cuenta lo nuevo; las colecciones antiguas, con candado hasta su nivel", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  // Colecciones: la de 2016 y la del 2000, con candado en nivel 1
  await game(page, (P) => P.openM("sets"));
  await expect(page.locator('#ovh [data-a="addset"]')).not.toHaveCount(0);
  await expect(page.locator("#ovh .srow", { hasText: "Fixture Media" }).locator("button")).toHaveText("🔒 Nivel 3");
  await expect(page.locator("#ovh .srow", { hasText: "Fixture Clásica" }).locator("button")).toHaveText("🔒 Nivel 5");
  await game(page, (P) => P.closeM());
  // Sube a nivel 3: aviso con lo nuevo y botón a Colecciones
  await game(page, (P) => {
    P.S.lvSeen = 1;
    P.S.money += P.LV[2] + 100;
    P.hud();
  });
  // primero sale la celebración de categoría de siempre; el aviso espera a que se cierre
  await expect.poll(() => game(page, (P) => P.G.M), { timeout: 5000 }).toBe("tierup");
  await game(page, (P) => P.closeM());
  await expect(page.locator("#lvup")).toContainText("¡Nivel 3!", { timeout: 6000 });
  await expect(page.locator("#lvup li")).toContainText(["2003 a 2016", "local de al lado"]);
  await page.locator('#lvup [data-a="lvupsets"]').click();
  await expect(page.locator("#lvup")).toHaveCount(0);
  await expect(page.locator("#ovh .srow", { hasText: "Fixture Media" }).locator("button")).toHaveText("Añadir");
  await expect(page.locator("#ovh .srow", { hasText: "Fixture Clásica" }).locator("button")).toHaveText("🔒 Nivel 5");
});

test("20s · Limpieza: lo que hay en el suelo se recoge tocándolo; Emma lo explica la primera vez", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  const mul0 = await game(page, (P) => P.spMul());
  await game(page, (P) => {
    P.S.dirt = [{ x: 300, y: 420, k: "paper", r: 1 }];
  });
  await expect(page.locator("#quip")).toContainText("hay cosas en el suelo", { timeout: 5000 });
  expect(await game(page, (P) => P.spMul())).toBeCloseTo(mul0 * 0.97, 5);
  // Tocar el papel en la tienda
  const pt = await game(page, (P) => {
    const V = P.VIEW,
      r = document.querySelector("#cv").getBoundingClientRect();
    return { x: r.left + V.ox + 300 * V.s, y: r.top + V.oy + 420 * V.s };
  });
  await page.mouse.click(pt.x, pt.y);
  expect(await game(page, (P) => P.S.dirt.length)).toBe(0);
});

test("20t · Día de récord: el ticket sale con el sello «¡RÉCORD!»", async ({ page, gamePath }, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await game(page, (P) => {
    P.S.hist = [{ d: 0, inc: 40, net: 1000, cust: 5, lost: 0 }];
    P.S.recInc = 40;
    P.S.stats.inc = 55;
    P.endDay();
  });
  await expect(page.locator("#ovh .ticket .tstamp")).toContainText("¡RÉCORD!");
  await game(page, (P) => P.closeM());
  // Al día siguiente, vendiendo menos, no hay sello
  await game(page, (P) => {
    P.S.stats.inc = 20;
    P.endDay();
  });
  await expect(page.locator("#ovh .ticket")).toBeVisible();
  await expect(page.locator("#ovh .ticket .tstamp")).toHaveCount(0);
  expect(await game(page, (P) => P.S.recInc)).toBe(55);
});

test("20u · Carta rara: Álvaro, en la tienda, con ojos de estrella unos segundos", async ({ page, gamePath }, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await game(page, (P) => P.quipCard({ name: "Prueba ex", r: "SIR" }));
  expect(await game(page, (P) => P.ALVARO.wow)).toBeGreaterThan(5);
  // El tiempo solo corre con la tienda a la vista; luego vuelve a su cara de siempre
  await expect.poll(() => game(page, (P) => P.ALVARO.wow <= 0), { timeout: 12000 }).toBe(true);
});

test("20v · Mesa de juego: llegan jugadores, juegan, pagan 2 € por partida y sale en el ticket", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await game(page, (P) => {
    P.S.decor.table = true;
    P.S.tut.on = false;
  });
  await page.locator("#act").click();
  await expect.poll(() => game(page, (P) => P.S.phase)).toBe("open");
  await game(page, (P) => {
    P.TBL.next = 0;
    P.speed = 4;
  });
  // Se sientan y juegan
  await expect
    .poll(() => game(page, (P) => P.players.filter((p) => p.st === "play").length), { timeout: 15000 })
    .toBeGreaterThan(1);
  const m0 = await game(page, (P) => {
    P.players.forEach((p) => (p.t = 0)); // terminan la partida ya
    return P.S.money;
  });
  await expect.poll(() => game(page, (P) => P.S.stats.tbl || 0), { timeout: 5000 }).toBeGreaterThan(0);
  const r = await game(page, (P) => ({ tbl: P.S.stats.tbl, money: P.S.money }));
  expect(r.tbl % 2).toBe(0);
  expect(r.money).toBeGreaterThanOrEqual(m0 + r.tbl - 0.001);
  // En el ticket
  await game(page, (P) => P.endDay());
  await expect(page.locator("#ovh .ticket")).toContainText("Mesa de juego");
  expect(await game(page, (P) => P.players.length)).toBe(0);
});

test("20w · Registro de cierres: si la app se cerró sola, al volver sale un aviso con los datos", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  // La última vez estaba en pantalla y no se cerró bien (así queda el registro si Android la cierra)
  await page.addInitScript(() => {
    if (sessionStorage.getItem("diag-done")) return;
    sessionStorage.setItem("diag-done", "1");
    localStorage.setItem(
      "pcs-diag-v1",
      JSON.stringify({
        v: 1,
        build: "prueba",
        start: Date.now() - 60000,
        fg: true,
        snaps: [{ t: Date.now() - 5000, day: 3, ph: "open", dt: 92, M: null, fps: 55, fg: true }],
        errs: [],
      }),
    );
  });
  await openGame(page, gamePath);
  await expect(page.locator("#diag")).toContainText("se cerró sola");
  await expect(page.locator("#diag")).toContainText("Día 3, al 92 % del día");
  await expect(page.locator("#diag pre")).toContainText("versión prueba");
  await page.locator("#diagok").click();
  await expect(page.locator("#diag")).toHaveCount(0);
  await skipTutorial(page);
  // Esta sesión también se apunta, cada 2 s
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("pcs-diag-v1")).snaps.length), { timeout: 6000 })
    .toBeGreaterThan(0);
  const r = await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-diag-v1")));
  expect(r.fg).toBe(true);
  expect(r.snaps.at(-1)).toMatchObject({ day: expect.any(Number), ph: "closed" });
  // Al recargar (cierre normal) no hay aviso
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(page.locator("#diag")).toHaveCount(0);
});

test("20x · Botón «atrás» de Android: cierra el panel abierto y, sin nada abierto, avisa antes de salir", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await page.addInitScript(() => (window.__pcsBack = true)); // como en la app instalada
  await freshGame(page, gamePath);
  await game(page, (P) => P.openM("more"));
  await expect(page.locator("#ovh .sheet")).toBeVisible();
  await page.goBack();
  await expect.poll(() => game(page, (P) => P.G.M)).toBe(null);
  expect(page.url()).toContain(gamePath.split("?")[0].replace(/^\//, ""));
  // Sin nada abierto: aviso y la app sigue
  await page.goBack();
  await expect(page.locator("#toast")).toContainText("Vuelve atrás otra vez para salir");
  expect(await game(page, (P) => P.S.day)).toBeGreaterThan(0);
  // Pasado el aviso, «atrás» vuelve a estar protegido (y queda apuntado en el registro)
  await page.waitForTimeout(2700);
  await game(page, (P) => P.openM("coll"));
  await page.goBack();
  await expect.poll(() => game(page, (P) => P.G.M)).toBe(null);
  const notes = await page.evaluate(() => JSON.parse(localStorage.getItem("pcs-diag-v1")).errs.map((e) => e.m));
  expect(notes).toEqual(["atrás: cerrar more", "atrás: salir?", "atrás: cerrar coll"]);
});

test("20y · Con cajero, los que vienen a vender esperan aparte y la fila sigue; «📥 ofertas esperando» los atiende", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await game(page, (P) => {
    P.S.staff.cashier = true;
  });
  await page.locator("#act").click();
  await expect.poll(() => game(page, (P) => P.S.phase)).toBe("open");
  // Un cliente que viene a vender una carta
  const id = await game(page, (P) => {
    P.G.spawnT = 999; // sin más clientes
    P.spawn();
    const c = P.custs[P.custs.length - 1];
    c.want = { k: "sell" };
    c.deal = P.makeDeal(null);
    c.st = "toq";
    c.wps = [];
    c.pat = 999;
    return c.id;
  });
  await expect
    .poll(() => game(page, (P, id) => P.custs.find((c) => c.id === id).st, id), { timeout: 15000 })
    .toBe("offer");
  expect(await game(page, (P, id) => P.queue.some((c) => c.id === id), id)).toBe(false);
  await expect(page.locator("#offb")).toHaveText("📥 1 oferta esperando");
  await page.locator("#offb").click({ force: true }); // late (animación)
  await expect.poll(() => game(page, (P) => P.G.M)).toBe("sell");
  await game(page, (P) => P.A.dealno());
  await expect
    .poll(() => game(page, (P, id) => P.custs.find((c) => c.id === id)?.st || "fuera", id))
    .toMatch(/leave|fuera/);
  await expect(page.locator("#offb")).toBeHidden();
});

test("20z · Versión del juego en Más → Ajustes; el aviso «Actualizar» dice a qué versión se actualiza", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  await game(page, (P) => P.openM("more"));
  const mine = await game(page, (P) => P.verLabel(P.BUILD));
  expect(mine).toMatch(/^\d{1,2} \S+ \d{4} · \d\d:\d\d$/);
  await expect(page.locator("#ovh .ver")).toHaveText(`📦 Versión del juego: ${mine}`);
  await game(page, (P) => P.closeM());
  // Hay una versión publicada más nueva
  await page.route("**/version.json*", (r) =>
    r.fulfill({ contentType: "application/json", body: JSON.stringify({ build: "2030-01-02T09:05:00.000Z" }) }),
  );
  await game(page, (P) => P.showUpdate(() => {}));
  const nueva = await game(page, (P) => P.verLabel("2030-01-02T09:05:00.000Z"));
  await expect(page.locator("#upd span")).toContainText(`Versión nueva: ${nueva}`);
  await expect(page.locator("#upd span small")).toHaveText(`Tienes: ${mine}`);
});

test("20aa · Si Android vacía los fondos guardados (salían en negro), se vuelven a dibujar", async ({
  page,
  gamePath,
}, info) => {
  vite(info);
  await freshGame(page, gamePath);
  const n0 = await game(page, (P) => P.VIS.bgN || 0);
  // Como cuando Chrome vacía los lienzos que no están en pantalla
  await page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype,
      orig = p.isContextLost;
    p.isContextLost = () => true;
    setTimeout(() => (p.isContextLost = orig), 150);
  });
  await expect.poll(() => game(page, (P) => P.VIS.bgN || 0)).toBeGreaterThan(n0);
});
