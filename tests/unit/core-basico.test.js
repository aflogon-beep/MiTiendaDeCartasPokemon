import { describe, it, expect, vi } from "vitest";
import { clamp, r05, fmt, pct } from "../../src/core/util.js";
import { rnd, pick, wpick, srand, gauss } from "../../src/core/rng.js";
import { RAR, RMAP, LV, LTK, DIFFS } from "../../src/core/constants.js";
import { rarOf, mapCard, setCards, indexCards, CARDS, BYID, BYS, BYSR, BYR, SETDEF, setName, mkSetDef } from "../../src/core/cards/sets.js";
import { initPrice, step, rvr } from "../../src/core/cards/prices.js";
import { FIX_CARDS } from "../fixtures/api.js";

describe("util", () => {
  it("clamp y r05 (redondeo a 5 céntimos, mínimo 0,05)", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(r05(1.234)).toBe(1.25);
    expect(r05(0.01)).toBe(0.05);
  });
  it("fmt y pct en español", () => {
    expect(fmt(1234.5).replace(/\s/g, " ")).toBe("1234,50 €");
    expect(pct(0.123)).toBe("+12,3 %");
    expect(pct(-0.05)).toBe("-5,0 %");
  });
});

describe("rng", () => {
  it("rnd, pick y wpick respetan los límites y los pesos", () => {
    for (let i = 0; i < 200; i++) expect(rnd(5)).toBeGreaterThanOrEqual(0), expect(rnd(5)).toBeLessThan(5);
    expect(["a", "b"]).toContain(pick(["a", "b"]));
    const n = { a: 0, b: 0 };
    for (let i = 0; i < 4000; i++) n[wpick({ a: 3, b: 1 })]++;
    expect(n.a / n.b).toBeGreaterThan(2.3);
    expect(n.a / n.b).toBeLessThan(3.9);
    expect(wpick({ a: 0, b: 1 })).toBe("b");
  });
  it("srand es determinista", () => {
    const a = srand(11), b = srand(11);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("gauss está centrada en 0 y entre -1,5 y 1,5", () => {
    let s = 0;
    for (let i = 0; i < 3000; i++) {
      const g = gauss();
      expect(Math.abs(g)).toBeLessThanOrEqual(1.5);
      s += g;
    }
    expect(Math.abs(s / 3000)).toBeLessThan(0.05);
  });
});

describe("constantes", () => {
  it("niveles y contadores (incluye los de la v15)", () => {
    expect(LV[1]).toBe(1600);
    expect(LTK.sellpack).toBe("psold");
    expect(LTK.open).toBe("packs");
    expect(DIFFS.normal.rival).toBe(true);
  });
});

describe("cartas", () => {
  it("rarOf: mapa directo y deducción de rarezas raras", () => {
    expect(rarOf({ rarity: "Common" })).toBe("C");
    expect(rarOf({ rarity: "Special Illustration Rare" })).toBe("SIR");
    expect(rarOf({ rarity: "Rare Shiny Galáctica" })).toBe("UR");
    expect(rarOf({})).toBe("R");
    expect(Object.values(RMAP).every((r) => RAR[r])).toBe(true);
  });

  it("mapCard usa el precio de Cardmarket o el de la rareza", () => {
    const sd = { id: "mew" };
    const cs = FIX_CARDS.sv3pt5.map((d) => mapCard(d, sd));
    const noPrice = FIX_CARDS.sv3pt5.findIndex((d) => !d.cardmarket);
    expect(cs[noPrice].b).toBe(Math.max(0.02, RAR[cs[noPrice].r].def));
    const full = FIX_CARDS.sv3pt5.findIndex((d) => d.cardmarket && d.cardmarket.prices.avg1);
    expect(cs[full].b).toBe(FIX_CARDS.sv3pt5[full].cardmarket.prices.trendPrice);
    expect(cs[full].seed).toHaveLength(3);
    expect(cs.every((c) => c.s === "mew")).toBe(true);
  });

  it("setCards e indexCards mantienen la misma identidad de arrays y objetos", () => {
    const ref = { CARDS, BYID, BYS };
    setCards(FIX_CARDS.sv3.map((d) => mapCard(d, { id: "obf" })));
    indexCards();
    expect(CARDS).toBe(ref.CARDS);
    expect(BYID).toBe(ref.BYID);
    expect(BYS.obf).toHaveLength(61);
    expect(Object.keys(BYID)).toHaveLength(61);
    expect(BYSR.obfC.every((c) => c.r === "C")).toBe(true);
    setCards([]);
    indexCards();
    expect(Object.keys(BYID)).toHaveLength(0);
    expect(BYR).toEqual({});
  });

  it("mkSetDef conserva los ids antiguos de los 3 sets por defecto", () => {
    const o = mkSetDef({ id: "sv3pt5", name: "Otro nombre", series: "SV", releaseDate: "2023/09/22", total: 207 });
    expect(o.id).toBe("mew");
    expect(setName("mew")).toBe("151");
    expect(SETDEF.filter((d) => d.id === "mew")).toHaveLength(1);
  });
});

describe("precios", () => {
  it("initPrice con semilla termina en el precio base", () => {
    const p = initPrice({ b: 10, r: "R", seed: [8, 9, 9.5] });
    expect(p.p).toBe(10);
    expect(p.h).toHaveLength(30);
    expect(p.h[29]).toBe(10);
  });
  it("step mueve el precio, nunca baja de 0,02 y guarda 60 días de historial", () => {
    const p = initPrice({ b: 1, r: "C" });
    for (let i = 0; i < 100; i++) step(p, 1);
    expect(p.p).toBeGreaterThanOrEqual(0.02);
    expect(p.h).toHaveLength(60);
  });
  it("rvr: multiplicador de reverse entre 1,2 y 8 (2,5 por defecto)", () => {
    expect(rvr({ rv: 10, b: 1 })).toBe(8);
    expect(rvr({ rv: 1, b: 1 })).toBe(1.2);
    expect(rvr({ rv: null, b: 1 })).toBe(2.5);
  });
});
