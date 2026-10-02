import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { endDay } from "../../src/core/day.js";
import { spawn } from "../../src/core/customers/spawn.js";
import { custs, queue } from "../../src/core/customers/move.js";
import { on } from "../../src/core/bus.js";

nuevaPartida();

describe("clientes", () => {
  it("spawn añade un cliente con un deseo y lo cuenta en el día", () => {
    S.phase = "open";
    const n = S.stats.cust;
    spawn();
    expect(custs).toHaveLength(1);
    expect(["pack", "single", "prod", "sell", "lot", "trade", "admire"]).toContain(custs[0].want.k);
    expect(S.stats.cust).toBe(n + 1);
    custs.length = 0;
    queue.length = 0;
  });
});

describe("fin del día (endDay)", () => {
  it("cobra alquiler y sueldos, pasa al día siguiente, guarda el ticket y abre el resumen", () => {
    const opened = [];
    on("openM", (m) => opened.push(m));
    S.staff.cashier = true;
    S.stats = { inc: 120, cust: 10, lost: 2, bought: 0 };
    S.ev = null;
    S.tour = false;
    S.loan = null;
    const m0 = S.money;
    endDay();
    expect(S.day).toBe(2);
    expect(S.phase).toBe("closed");
    expect(S.summary).toMatchObject({ day: 1, inc: 120, cust: 10, lost: 2, rent: 15, sal: 20 });
    expect(S.hist).toHaveLength(1);
    expect(S.stats).toEqual({ inc: 0, cust: 0, lost: 0, bought: 0 });
    expect(S.money).toBeCloseTo(m0 - 15 - 20 - (S.summary.refund || 0), 5);
    expect(S.dm.day).toBe(2);
    expect(opened).toEqual(["sum"]);
  });
});
