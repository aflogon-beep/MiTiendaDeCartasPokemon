import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { on } from "../../src/core/bus.js";
import { CARDS } from "../../src/core/cards/sets.js";
import { isWish, wishSet, wishGot, wishCheck } from "../../src/core/wish.js";

nuevaPartida();
const toasts = [],
  seen = [];
on("toast", (t) => toasts.push(t));
on("wishSeen", (id, k) => seen.push([id, k]));

describe("lista de deseos", () => {
  it("añadir y quitar", () => {
    const id = CARDS[0].id;
    expect(isWish(id)).toBe(false);
    wishSet(id, true);
    wishSet(id, true); // sin repetir
    expect(S.wish).toEqual([id]);
    wishSet(id, false);
    expect(isWish(id)).toBe(false);
  });
  it("al conseguirla sale de la lista con un aviso; si no estaba, nada", () => {
    const id = CARDS[1].id;
    wishSet(id, true);
    wishGot(id);
    expect(isWish(id)).toBe(false);
    expect(toasts.at(-1)).toContain(CARDS[1].name);
    const n = toasts.length;
    wishGot(CARDS[2].id);
    expect(toasts.length).toBe(n);
  });
  it("si un cliente trae una carta de la lista, se avisa", () => {
    const id = CARDS[3].id;
    wishCheck(id, "sell");
    expect(seen).toEqual([]);
    wishSet(id, true);
    wishCheck(id, "sell");
    expect(seen).toEqual([[id, "sell"]]);
  });
});
