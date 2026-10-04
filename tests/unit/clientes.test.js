// Menos clientes y cestas más grandes (a petición de Alberto): techo de reputación, sobres por cliente y extras.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { S, newState } from "../../src/core/state.js";
import { repMul } from "../../src/core/economy.js";
import { PQTY, addExtras } from "../../src/core/customers/decide.js";
import { leave } from "../../src/core/customers/move.js";
import { pay } from "../../src/core/customers/checkout.js";

beforeEach(() => {
  newState();
  Object.assign(S, {
    day: 5,
    money: 0,
    sales: 0,
    repB: 0,
    items: [],
    slots: ["a"],
    sealed: { a: 20 },
    shelf: { a: 6 },
    pack: { a: { ref: 8, w: 4 } },
    prod: { "acc:sleeves": 3 },
    pp: { "acc:sleeves": 4 },
    decor: {},
    held: {},
    stats: { inc: 0, lost: 0 },
    lt: {},
    albR: {},
    sets: ["a"],
    orders: [],
    regs: {},
    tut: { on: false },
  });
});

describe("menos clientes", () => {
  it("la reputación trae más clientes, pero como mucho el doble", () => {
    S.repB = 0;
    expect(repMul()).toBe(1);
    S.repB = 40;
    expect(repMul()).toBe(1.5);
    S.repB = 100000;
    expect(repMul()).toBeLessThan(2);
    expect(repMul()).toBeGreaterThan(1.99);
  });
});

describe("cestas más grandes", () => {
  it("cada tipo se lleva sus sobres: niño 2–4, coleccionista 3–6, inversor 4–8, ballena 8–15", () => {
    const rango = (k) => {
      const v = Array.from({ length: 400 }, PQTY[k]);
      return [Math.min(...v), Math.max(...v)];
    };
    expect(rango("kid")).toEqual([2, 4]);
    expect(rango("collector")).toEqual([3, 6]);
    expect(rango("investor")).toEqual([4, 8]);
    expect(rango("whale")).toEqual([8, 15]);
  });

  it("el que viene a por una carta se lleva también sobres y fundas; si se va, todo vuelve al stock", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    const it = { i: 1, c: "x", case: 1, res: true };
    S.items.push(it);
    const c = { type: "collector", hold: { k: "single", it, total: 12 } };
    addExtras(c, 1);
    vi.restoreAllMocks();
    expect(c.hold.x.map((e) => e.k)).toEqual(["pack", "prod"]);
    expect(c.hold.x[0]).toMatchObject({ s: "a", qty: 2, total: 12 });
    expect(c.hold.total).toBe(12 + 12 + 4);
    expect(c.hold.base).toBe(12);
    expect(S.sealed.a).toBe(18);
    expect(S.prod["acc:sleeves"]).toBe(2);
    expect(S.held).toEqual({ "p:a": 2, "x:acc:sleeves": 1 });
    leave(c, false);
    expect(S.sealed.a).toBe(20);
    expect(S.prod["acc:sleeves"]).toBe(3);
    expect(S.held).toEqual({});
    expect(it.res).toBe(false);
  });

  it("al pagar se cobra toda la cesta y la reputación cuenta lo gastado (1 por cada 10 €, de 1 a 5)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    const c = { type: "kid", hold: { k: "pack", s: "a", qty: 3, total: 18 } };
    S.sealed.a -= 3;
    addExtras(c, 1);
    vi.restoreAllMocks();
    // Ya lleva sobres: solo se suma el accesorio
    expect(c.hold.x.map((e) => e.k)).toEqual(["prod"]);
    pay(c);
    expect(S.money).toBeCloseTo(22);
    expect(S.sales).toBe(2);
    expect(S.held).toEqual({});
    expect(S.sealed.a).toBe(17);
    expect(S.prod["acc:sleeves"]).toBe(2);
    pay({ type: "kid", hold: { k: "pack", s: "a", qty: 1, total: 6 } });
    expect(S.sales).toBe(3);
  });

  it("si le parece caro, no se lleva extras", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    S.shelf.a = 30;
    S.prod["acc:sleeves"] = 0;
    const it = { i: 1, c: "x", case: 1, res: true };
    const c = { type: "collector", hold: { k: "single", it, total: 12 } };
    addExtras(c, 1);
    vi.restoreAllMocks();
    expect(c.hold.x).toBeUndefined();
    expect(c.hold.total).toBe(12);
    expect(S.sealed.a).toBe(20);
  });
});
