import { describe, it, expect } from "vitest";
import { CHARS, EXPR, drawPortrait, drawMini } from "../../src/render/characters.js";

// Contexto 2D de mentira: acepta cualquier llamada y cuenta los trazos
function fakeCtx() {
  const calls = { fill: 0, stroke: 0 };
  return {
    calls,
    ctx: new Proxy(
      {},
      {
        get: (o, k) => (k in o ? o[k] : (...a) => (k in calls ? calls[k]++ : undefined)),
        set: (o, k, v) => ((o[k] = v), true),
      },
    ),
  };
}

describe("personajes", () => {
  it("están Emma, Álvaro, papá Alberto y Don Ramón (zona Funko), con las 6 expresiones del guion", () => {
    expect(Object.keys(CHARS)).toEqual(["alvaro", "emma", "alberto", "ramon"]);
    expect(EXPR.map((e) => e[0])).toEqual(["happy", "laugh", "wow", "angry", "sweat", "stars"]);
  });

  it("drawPortrait y drawMini dibujan a todos con todas las expresiones", () => {
    for (const ch of Object.values(CHARS))
      for (const [ex] of EXPR) {
        const { ctx, calls } = fakeCtx();
        drawPortrait(ctx, ch, ex, 240);
        expect(calls.fill, `${ch.n} ${ex}`).toBeGreaterThan(10);
      }
    const { ctx, calls } = fakeCtx();
    drawMini(ctx, CHARS.alvaro, 50, 80, 0);
    expect(calls.fill).toBeGreaterThan(10);
  });
});
