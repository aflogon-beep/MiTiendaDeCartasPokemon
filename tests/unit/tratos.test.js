// Regalos y cambios entre cuentas (src/core/trade.js): sacar y meter cartas y Funkos sin duplicar.
import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { tradeCanGet, tradeGive, tradeHas, tradeTake } from "../../src/core/trade.js";

describe("regalos y cambios", () => {
  it("un Funko sale de una zona y entra en otra (al almacén); no se manda el que lleva un cliente", () => {
    nuevaPartida();
    const p = { t: "fk", f: "pk1", va: "chase", d: false, p: true, n: "Pikachu", val: 60 };
    expect(tradeCanGet(p)).toBe(false); // sin zona Funko no se puede recibir
    S.fk = { u: [{ i: 1, f: "pk1", v: "chase", d: false, p: true, at: "h" }], nid: 2 };
    expect(tradeHas(p)).toBe(false); // lo lleva un cliente a la caja
    S.fk.u[0].at = "v";
    expect(tradeHas(p)).toBe(true);
    expect(tradeTake(p)).toBe(true);
    expect(S.fk.u.length).toBe(0);
    expect(tradeTake(p)).toBe(false); // no se puede sacar dos veces
    expect(tradeGive(p)).toBe(true);
    expect(S.fk.u[0]).toMatchObject({ f: "pk1", v: "chase", p: true, at: "a" });
  });
  it("una carta: solo si está la colección cargada; no se mandan las apartadas ni las falsas", async () => {
    nuevaPartida();
    const { CARDS } = await import("../../src/core/cards/sets.js");
    const c = CARDS[0];
    const p = { t: "card", c: c.id, k: "NM", rv: false, gr: 0, n: c.name, val: 1 };
    expect(tradeCanGet(p)).toBe(true);
    expect(tradeCanGet(Object.assign({}, p, { c: "no-existe-1" }))).toBe(false);
    S.items = [{ i: 1, c: c.id, k: "NM", rv: false, cost: 0, case: null, res: true }];
    expect(tradeHas(p)).toBe(false); // apartada para un cliente
    S.items[0].res = false;
    S.items[0].fk = true;
    expect(tradeHas(p)).toBe(false); // falsa
    S.items[0].fk = undefined;
    expect(tradeTake(p)).toBe(true);
    expect(S.items.length).toBe(0);
    expect(tradeGive(p)).toBe(true);
    expect(S.items[0]).toMatchObject({ c: c.id, k: "NM", cost: 0 });
  });
});
