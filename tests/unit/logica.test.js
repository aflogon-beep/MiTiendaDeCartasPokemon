import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S, SETS } from "../../src/core/state.js";
import { roll, eraCfg, calcEV, refreshPacks } from "../../src/core/packs.js";
import { accP, level, netWorth, packAcc, recPack, caseItems } from "../../src/core/economy.js";
import { tipsList, dedupTips } from "../../src/core/tips.js";
import { makeDeal } from "../../src/core/deals.js";
import { rivalUpd, rivalMul } from "../../src/core/rival.js";
import { DF } from "../../src/core/difficulty.js";
import { LV } from "../../src/core/constants.js";
import { CARDS } from "../../src/core/cards/sets.js";

nuevaPartida();

describe("partida nueva", () => {
  it("empieza con 1000 €, día 1, los 3 sets y precios para todas las cartas", () => {
    expect(S.money).toBe(1000);
    expect(S.day).toBe(1);
    expect(SETS.map((s) => s.id)).toEqual(["mew", "pre", "obf"]);
    expect(Object.keys(S.prices)).toHaveLength(CARDS.length);
    expect(S.dm.list).toHaveLength(3);
    expect(S.orders.length).toBeGreaterThan(0);
  });
});

describe("sobres (roll)", () => {
  it("sin repetidas dentro del sobre y con la estructura de su época", () => {
    for (const sd of SETS)
      for (let i = 0; i < 200; i++) {
        const p = roll(sd.id);
        expect(new Set(p.map((x) => x.c.id)).size).toBe(p.length);
        expect(p).toHaveLength(10);
        expect(p.filter((x) => x.rv)).toHaveLength(1);
        expect(p.every((x) => x.c.s === sd.id)).toBe(true);
      }
  });
  it("épocas: clásica sin reverse, moderna con reverse", () => {
    expect(eraCfg("mew").id).toBe("sv");
    expect(eraCfg("fx6").id).toBe("wotc");
    expect(eraCfg("fx6").rv).toBe(false);
    expect(eraCfg("fx5").id).toBe("mid");
  });
  it("el precio de mayorista sale del valor esperado (×1,12, entre 3 y 7 € en sets modernos)", () => {
    refreshPacks(true);
    for (const sd of SETS) {
      const t = Math.min(7, Math.max(3, Math.max(0.05, Math.round(calcEV(sd.id) * 1.12 * 20) / 20)));
      expect(S.pack[sd.id].w).toBeCloseTo(t, 5);
      expect(S.pack[sd.id].ref).toBeCloseTo(Math.max(0.05, Math.round(S.pack[sd.id].w * 1.45 * 20) / 20), 5);
    }
  });
});

describe("precios aceptados (accP)", () => {
  it("1 por debajo del mínimo, 0 por encima del máximo, lineal en medio", () => {
    expect(accP(0.8, 0.9, 1.15)).toBe(1);
    expect(accP(1.2, 0.9, 1.15)).toBe(0);
    expect(accP(1.025, 0.9, 1.15)).toBeCloseTo(0.5, 5);
  });
  it("el precio recomendado de un sobre siempre es «buen precio»", () => {
    for (const sd of SETS) {
      S.shelf[sd.id] = recPack(sd.id);
      expect(packAcc(sd.id)).toBeGreaterThanOrEqual(0.7);
    }
  });
});

describe("nivel", () => {
  it("sube con el valor de la empresa según LV", () => {
    expect(level()).toBe(1);
    const m = S.money;
    S.money += LV[1] - netWorth() + 1;
    expect(level()).toBe(2);
    S.money += LV[4] - netWorth() + 1;
    expect(level()).toBe(5);
    S.money = m;
  });
});

describe("consejos (tipsList / dedupTips)", () => {
  it("avisa de la vitrina vacía y de los sobres agotados, y como mucho 4", () => {
    const l = tipsList(null);
    expect(caseItems()).toHaveLength(0);
    expect(l[0]).toContain("vitrina está vacía");
    expect(l.some((t) => t.includes("No te quedan sobres"))).toBe(true);
    expect(l.length).toBeLessThanOrEqual(4);
  });
  it("usa los motivos del día (why) para los consejos de precio", () => {
    const l = tipsList({ why: { "kp:mew": 4, pat: 3 } });
    expect(l.some((t) => t.includes("no compraron sobres de 151 por precio"))).toBe(true);
    expect(l.some((t) => t.includes("se cansaron de esperar"))).toBe(true);
  });
  it("dedupTips no repite el mismo consejo en 3 días (salvo el primero) y deja 3", () => {
    S.tipHist = {};
    S.day = 5;
    const a = dedupTips(["uno 1 €", "dos", "tres", "cuatro"]);
    expect(a).toEqual(["uno 1 €", "dos", "tres"]);
    S.day = 6;
    expect(dedupTips(["dos", "cinco", "uno 2 €"])).toEqual(["dos", "cinco"]);
    S.day = 9; // 3 días después: el primero siempre sale; el resto todavía no
    expect(dedupTips(["dos", "cinco"])).toEqual(["dos"]);
    S.day = 13; // más de 3 días: vuelven a salir
    expect(dedupTips(["dos", "cinco"])).toEqual(["dos", "cinco"]);
  });
});

describe("tratos (makeDeal) según la dificultad", () => {
  const rate = (diff, reg, n = 4000) => {
    S.diff = diff;
    let f = 0;
    for (let i = 0; i < n; i++) if (makeDeal(reg).fake) f++;
    return f / n;
  };
  it("las falsas escalan con la dificultad (fácil ×0,35, difícil ×1,3)", () => {
    const easy = rate("facil"),
      normal = rate("normal"),
      hard = rate("dificil");
    expect(easy).toBeLessThan(normal * 0.6);
    expect(hard).toBeGreaterThan(normal * 1.1);
    expect(normal).toBeGreaterThan(0.2);
    expect(normal).toBeLessThan(0.4);
  });
  it("Rafa trae falsas mucho más a menudo y pide el 72 % del valor", () => {
    expect(rate("normal", "rafa")).toBeGreaterThan(0.5);
    const d = makeDeal("rafa");
    expect(d.ask).toBeCloseTo(Math.max(0.05, Math.round(d.val * 0.72 * 20) / 20), 5);
    expect(d.val).toBeGreaterThanOrEqual(0.6);
    S.diff = "normal";
  });
});

describe("tienda rival (rivalUpd)", () => {
  it("no abre en fácil, ni antes del día 4, ni a nivel 1", () => {
    S.rival = undefined;
    S.diff = "facil";
    S.day = 10;
    expect(rivalUpd()).toBeNull();
    expect(S.rival.on).toBe(false);
    S.diff = "normal";
    S.day = 3;
    rivalUpd();
    expect(S.rival.on).toBe(false);
  });
  it("abre en normal con nivel 2 y fuerza 55; con precios caros gana fuerza", () => {
    S.rival = undefined;
    S.day = 4;
    S.money += 2000;
    expect(level()).toBeGreaterThanOrEqual(2);
    rivalUpd();
    expect(S.rival.on).toBe(true);
    expect(S.newsRival).toBe(1);
    expect(DF().rStr).toBe(55);
    // con mis sobres muy caros, la rival se refuerza y me quita clientes
    S.slots = SETS.map((s) => s.id);
    SETS.forEach((sd) => (S.shelf[sd.id] = S.pack[sd.id].ref * 1.5));
    S.repB = 0;
    S.sales = 0;
    const before = S.rival.str;
    rivalUpd();
    expect(S.rival.str).toBeGreaterThan(before);
    expect(rivalMul()).toBeLessThan(1);
  });
  it("cuando su fuerza llega a 0, cierra y da 300 € y 5 ⭐", () => {
    S.rival.str = 1;
    S.rival.price = 1;
    SETS.forEach((sd) => (S.shelf[sd.id] = S.pack[sd.id].ref * 0.5));
    const m = S.money,
      rep = S.repB || 0;
    const msg = rivalUpd();
    expect(msg).toContain("ha cerrado");
    expect(S.rival).toMatchObject({ on: false, closed: true });
    expect(S.money).toBe(m + 300);
    expect(S.repB).toBe(rep + 5);
  });
});
