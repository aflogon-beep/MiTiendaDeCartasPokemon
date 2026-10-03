import { describe, it, expect, beforeEach } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { QUIPS, QUIP_GAP, PAPA, takeQuip, resetQuips, pullQuip, papaDue, papaVisit } from "../../src/core/quips.js";

describe("frases recurrentes (core/quips.js)", () => {
  beforeEach(() => {
    nuevaPartida();
    resetQuips();
  });

  it("la primera de cada situación es la de HISTORIA.md; hay varias para no repetir siempre la misma", () => {
    expect(QUIPS.packs[0]).toEqual(["emma", "angry", "¡ÁLVARO! ¡Eso era para VENDER!"]);
    expect(QUIPS.gengar[0][2]).toBe("¡GENGAAAAR! ¡Este no se vende! ❤️");
    expect(QUIPS.rare[0][2]).toBe("¡LA FUERZA ES INTENSA EN ESTE SOBRE!");
    for (const k in QUIPS) {
      expect(QUIPS[k].length, k).toBeGreaterThanOrEqual(2);
      for (const [who, ex, t] of QUIPS[k]) {
        expect(["emma", "alvaro"], k).toContain(who);
        expect(["happy", "laugh", "wow", "angry", "sweat", "stars"], k).toContain(ex);
        expect(t.length, t).toBeLessThanOrEqual(80); // cortas: caben en el bocadillo
      }
    }
  });

  it("no se amontonan: hueco mínimo entre frases y las «de una vez al día» solo una vez por día", () => {
    expect(takeQuip("packs", 100)).toBe(QUIPS.packs[0]); // la primera vez, la del guion
    expect(takeQuip("fake", 100 + QUIP_GAP - 1)).toBeNull(); // demasiado pronto
    expect(takeQuip("fake", 100 + QUIP_GAP)).toBe(QUIPS.fake[0]);
    expect(takeQuip("packs", 500)).toBeNull(); // ya dicha hoy
    S.day++;
    expect(QUIPS.packs).toContain(takeQuip("packs", 1000));
    expect(S.quip.packs).toBe(S.day); // se guarda en la partida
  });

  it("después, otra al azar, nunca la misma dos veces seguidas", () => {
    let last = takeQuip("bigsale", 0, () => 0);
    for (let i = 1; i < 40; i++) {
      const q = takeQuip("bigsale", i * 100, Math.random);
      expect(q).not.toBe(last);
      last = q;
    }
    expect(S.quipV.bigsale).toBe(QUIPS.bigsale.indexOf(last)); // se guarda en la partida
  });

  it("Álvaro reacciona a un Gengar antes que a una carta muy rara", () => {
    expect(pullQuip([{ name: "Pikachu", r: "C" }])).toBeNull();
    expect(pullQuip([{ name: "Charizard ex", r: "SIR" }])).toBe("rare");
    expect(
      pullQuip([
        { name: "Charizard ex", r: "SIR" },
        { name: "Gengar", r: "R" },
      ]),
    ).toBe("gengar");
  });
});

describe("visitas de papá", () => {
  beforeEach(() => nuevaPartida());

  it("como mucho una vez cada 3 días, con la tienda abierta", () => {
    expect(papaDue(1, 0)).toBeNull(); // día 1: acaba de irse
    S.day = 4;
    expect(papaDue(1, 0)).toBeNull(); // con la tienda cerrada, no
    S.phase = "open";
    expect(papaDue(1, 0.5)).toBeNull(); // al azar dentro del día
    expect(papaDue(1, 0)).toBe("tip");
    const l = papaVisit("tip", 1);
    expect(PAPA.tips).toContain(l[0]);
    expect(l[1]).toBe(PAPA.bye); // la primera despedida, la del guion
    expect(papaDue(1, 0)).toBeNull(); // ya vino hoy
    S.day = 6;
    expect(papaDue(1, 0)).toBeNull();
    S.day = 7;
    expect(papaDue(1, 0)).toBe("tip");
  });

  it("al subir de nivel y cuando abre la tienda rival, en cuanto se pueda", () => {
    papaDue(1, 1); // primera vez: apunta el nivel actual (las partidas de antes no reciben visita)
    expect(papaDue(2, 1)).toBe("level");
    expect(papaVisit("level", 2)).toEqual([PAPA.level]); // la primera vez, la del guion
    expect(PAPA.tips.length).toBeGreaterThanOrEqual(10);
    expect(PAPA.levels.length).toBeGreaterThanOrEqual(3);
    expect(papaDue(2, 1)).toBeNull();
    S.summary = { day: 5, rivNew: 1 };
    expect(papaDue(2, 1)).toBe("rival");
    const r = papaVisit("rival", 2);
    expect(r[0]).toBe(PAPA.rival);
    expect(PAPA.byes).toContain(r[1]);
    expect(papaDue(2, 1)).toBeNull();
  });
});
