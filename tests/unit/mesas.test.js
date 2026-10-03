import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { pPrice } from "../../src/core/economy.js";
import { players, tableArrive, tablePay, tablesReset, tableOn, TBL_FEE } from "../../src/core/tables.js";

nuevaPartida();
const seq = (...v) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe("mesa de juego", () => {
  it("solo con la mesa comprada, la tienda abierta y sin torneo", () => {
    S.decor.table = false;
    S.phase = "open";
    S.clock = 10;
    expect(tableOn()).toBe(false);
    S.decor.table = true;
    expect(tableOn()).toBe(true);
    S.tour = true;
    expect(tableOn()).toBe(false);
    S.tour = false;
    S.phase = "closed";
    expect(tableOn()).toBe(false);
  });
  it("llegan grupos de 4 (mesa libre) o de 2 (un lado libre) y no caben más", () => {
    tablesReset();
    expect(tableArrive(seq(0.1))).toHaveLength(4);
    expect(tableArrive(seq(0.1))).toHaveLength(0);
    tablesReset();
    const a = tableArrive(seq(0.9, 0.1));
    expect(a.map((p) => p.seat)).toEqual([0, 2]);
    expect(tableArrive(seq(0.9, 0.1)).map((p) => p.seat)).toEqual([1, 3]);
    expect(tableArrive(seq(0.9))).toHaveLength(0);
    expect(players).toHaveLength(4);
    tablesReset();
    expect(players).toHaveLength(0);
  });
  it("al terminar pagan 2 € por jugador y partida (una sola vez)", () => {
    S.stats = { inc: 0, cust: 0, lost: 0, bought: 0 };
    const m = S.money,
      g = { n: 4, games: 2 };
    expect(tablePay(g, seq(0.99))).toEqual({ fee: TBL_FEE * 8, buy: null });
    expect(S.money).toBeCloseTo(m + 16, 5);
    expect(S.stats.tbl).toBe(16);
    expect(S.stats.tblN).toBe(2);
    expect(S.stats.inc).toBe(0); // la mesa no cuenta como venta
    expect(tablePay(g, seq(0.99))).toBe(null);
  });
  it("a veces uno compra fundas de tu stock al precio que tengas", () => {
    S.stats = { inc: 0, cust: 0, lost: 0, bought: 0 };
    S.prod["acc:sleeves"] = 3;
    const pr = pPrice("acc:sleeves"),
      r = tablePay({ n: 2, games: 1 }, seq(0, 0));
    expect(r.buy).toMatchObject({ k: "prod", pid: "acc:sleeves", got: pr });
    expect(S.prod["acc:sleeves"]).toBe(2);
    expect(S.stats.inc).toBeCloseTo(pr, 5);
  });
  it("sin fundas, un sobre de las estanterías; sin stock, nada", () => {
    S.prod["acc:sleeves"] = 0;
    const s = Object.keys(S.sealed)[0];
    S.sealed[s] = 5;
    S.slots = [s];
    const r = tablePay({ n: 2, games: 1 }, seq(0, 0, 0, 0));
    expect(r.buy).toMatchObject({ k: "pack", s, got: S.shelf[s] });
    expect(S.sealed[s]).toBe(4);
    S.sealed[s] = 0;
    expect(tablePay({ n: 2, games: 1 }, seq(0, 0, 0, 0)).buy).toBe(null);
  });
});
