import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { CARDS } from "../../src/core/cards/sets.js";
import { trend, priceAlert, backupDue, backupDone, backupLater } from "../../src/core/alerts.js";

nuevaPartida();
const own = (id) => S.items.push({ i: S.nid++, c: id, k: "NM", rv: false, cost: 1, case: null, res: false });
const hist = (id, from, to) => {
  const h = Array.from({ length: 8 }, (_, i) => from + ((to - from) * i) / 7);
  S.prices[id] = Object.assign({}, S.prices[id], { p: to, h });
};

describe("alertas de precio", () => {
  it("avisa de la carta tuya que más ha subido esta semana (≥ 20 % y ≥ 2 €), una vez al día", () => {
    S.items = [];
    const [a, b, c] = CARDS.slice(0, 3).map((x) => x.id);
    [a, b, c].forEach(own);
    hist(a, 10, 12.5); // +25 %
    hist(b, 10, 14); // +40 %
    hist(c, 1, 1.5); // +50 %, pero vale menos de 2 €
    expect(Math.round(trend(b, 7) * 100)).toBe(40);
    S.palertDay = null;
    expect(priceAlert()).toEqual({ id: b, pct: 40 });
    expect(priceAlert()).toBe(null); // el mismo día, no repite
    S.day++;
    expect(priceAlert()).toEqual({ id: a, pct: 25 }); // b ya se avisó esta semana
    S.day++;
    expect(priceAlert()).toBe(null);
  });
});

describe("recordatorio de la copia", () => {
  const D = 24 * 3600 * 1000;
  it("a los 7 días sin copia; «Luego» lo pospone 2 días; al guardar vuelve a contar", () => {
    delete S.bkpAt;
    const t0 = 1_000_000_000_000;
    expect(backupDue(t0)).toBe(false); // empieza a contar
    expect(backupDue(t0 + 6 * D)).toBe(false);
    expect(backupDue(t0 + 7 * D)).toBe(true);
    backupLater(t0 + 7 * D);
    expect(backupDue(t0 + 8 * D)).toBe(false);
    expect(backupDue(t0 + 9 * D + 1)).toBe(true);
    backupDone(t0 + 9 * D + 1);
    expect(backupDue(t0 + 10 * D)).toBe(false);
  });
});
