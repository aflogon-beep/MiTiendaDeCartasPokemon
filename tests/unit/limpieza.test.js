import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { dirtDrop, dirtClean, dirtMul, DIRT_MAX } from "../../src/core/dirt.js";

nuevaPartida();
const seq = (...v) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe("limpieza", () => {
  it("al irse, a veces dejan algo en el suelo (solo dentro de la tienda y con tope)", () => {
    S.dirt = [];
    expect(dirtDrop(300, 300, seq(0.5))).toBe(null); // sin suerte
    expect(dirtDrop(300, 600, seq(0))).toBe(null); // en la calle, no
    expect(dirtDrop(300, 300, seq(0, 0.2, 0.5, 0.5, 0.5))).toMatchObject({ k: "paper" });
    for (let i = 0; i < 20; i++) dirtDrop(300, 300, seq(0));
    expect(S.dirt.length).toBe(DIRT_MAX);
  });
  it("con la tienda sucia entran menos (−3 % por cosa, como mucho −24 %)", () => {
    S.dirt = [];
    expect(dirtMul()).toBe(1);
    S.dirt = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    expect(dirtMul()).toBeCloseTo(0.94, 5);
    S.dirt = Array.from({ length: 12 }, () => ({ x: 0, y: 0 }));
    expect(dirtMul()).toBeCloseTo(0.76, 5);
  });
  it("tocar cerca recoge la más cercana", () => {
    S.dirt = [
      { x: 100, y: 100, k: "paper" },
      { x: 300, y: 300, k: "wrap" },
    ];
    expect(dirtClean(200, 200)).toBe(null);
    expect(dirtClean(296, 304)).toMatchObject({ k: "wrap" });
    expect(S.dirt).toHaveLength(1);
  });
});
