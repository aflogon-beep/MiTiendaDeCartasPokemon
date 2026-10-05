import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S, G } from "../../src/core/state.js";
import { setLevel, setLocked, unlocksAt } from "../../src/core/unlocks.js";

nuevaPartida();

describe("desbloqueos por nivel", () => {
  it("colecciones por época: modernas en el 1, 2003–2016 en el 3, clásicas en el 5", () => {
    expect(setLevel({ year: 2023 })).toBe(1);
    expect(setLevel({ year: 2017 })).toBe(1);
    expect(setLevel({ year: 2016 })).toBe(3);
    expect(setLevel({ year: 2003 })).toBe(3);
    expect(setLevel({ year: 1999 })).toBe(5);
    expect(setLevel({})).toBe(1);
  });
  it("con nivel 1, las de 2016 y las clásicas están bloqueadas (salvo G.noLocks)", () => {
    S.money = 1000; // nivel 1
    expect(setLocked({ year: 2016 })).toBe(true);
    expect(setLocked({ year: 2024 })).toBe(false);
    G.noLocks = true;
    expect(setLocked({ year: 2000 })).toBe(false);
    G.noLocks = false;
  });
  it("lo que trae cada nivel", () => {
    expect(unlocksAt(3).join(" ")).toMatch(/2003 a 2016.*local de al lado.*4\.000 €/);
    expect(unlocksAt(3).join(" ")).toMatch(/Tienda de cartas/);
    expect(unlocksAt(5).join(" ")).toMatch(/clásicas/);
  });
  it("todos los niveles dan algo (4: préstamo, 6 y 8: reputación, 9: premio)", () => {
    for (let n = 1; n <= 9; n++) expect(unlocksAt(n).length).toBeGreaterThan(0);
    expect(unlocksAt(4).join(" ")).toMatch(/10\.000 €/);
    expect(unlocksAt(9).join(" ")).toMatch(/50\.000 €/);
  });
  it("la reputación de los niveles 6 y 8 y el premio del 9 (una sola vez)", async () => {
    const { lvRep, repv } = await import("../../src/core/economy.js");
    const { lvPrize, LV_PRIZE } = await import("../../src/core/unlocks.js");
    nuevaPartida();
    S.lvMax = 5;
    const r = repv();
    expect(lvRep()).toBe(0);
    S.lvMax = 6;
    expect(repv()).toBe(r + 10);
    S.lvMax = 8;
    expect(repv()).toBe(r + 30);
    const m = S.money;
    expect(lvPrize(8, 9)).toBe(true);
    expect(S.money).toBe(m + LV_PRIZE);
    expect(lvPrize(9, 9)).toBe(false);
    expect(lvPrize(7, 8)).toBe(false);
    expect(S.money).toBe(m + LV_PRIZE);
  });
});

describe("el nivel nunca baja", () => {
  it("gastar dinero (p. ej. en mejoras) no devuelve la tienda al nivel de antes", async () => {
    const { level } = await import("../../src/core/economy.js");
    const { LV } = await import("../../src/core/constants.js");
    nuevaPartida();
    expect(level()).toBe(1);
    S.money += LV[2] + 100; // sube a nivel 3
    expect(level()).toBe(3);
    S.money -= 2000; // compra mejoras: la empresa vale menos
    expect(level()).toBe(3);
    expect(S.lvMax).toBe(3);
  });
  it("partidas de antes: se queda con el nivel más alto que ya vieron", async () => {
    const { level } = await import("../../src/core/economy.js");
    nuevaPartida();
    S.lvSeen = 3;
    delete S.lvMax;
    expect(level()).toBe(3);
  });
});
