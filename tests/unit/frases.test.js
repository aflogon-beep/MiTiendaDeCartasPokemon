import { describe, it, expect, beforeEach } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { QUIPS, QUIP_GAP, PAPA, takeQuip, resetQuips, pullQuip, papaDue, papaVisit } from "../../src/core/quips.js";

describe("frases recurrentes (core/quips.js)", () => {
  beforeEach(() => {
    nuevaPartida();
    resetQuips();
  });

  it("son las de HISTORIA.md, de Emma y de Álvaro", () => {
    expect(QUIPS.packs).toEqual(["emma", "angry", "¡ÁLVARO! ¡Eso era para VENDER!"]);
    expect(QUIPS.gengar[2]).toBe("¡GENGAAAAR! ¡Este no se vende! ❤️");
    expect(Object.values(QUIPS).map((q) => q[0])).toEqual([
      "emma",
      "emma",
      "emma",
      "emma",
      "emma",
      "alvaro",
      "alvaro",
      "alvaro",
    ]);
  });

  it("no se amontonan: hueco mínimo entre frases y las «de una vez al día» solo una vez por día", () => {
    expect(takeQuip("packs", 100)).toBe(QUIPS.packs);
    expect(takeQuip("fake", 100 + QUIP_GAP - 1)).toBeNull(); // demasiado pronto
    expect(takeQuip("fake", 100 + QUIP_GAP)).toBe(QUIPS.fake);
    expect(takeQuip("packs", 500)).toBeNull(); // ya dicha hoy
    S.day++;
    expect(takeQuip("packs", 1000)).toBe(QUIPS.packs);
    expect(S.quip.packs).toBe(S.day); // se guarda en la partida
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
    expect(l[1]).toBe(PAPA.bye);
    expect(papaDue(1, 0)).toBeNull(); // ya vino hoy
    S.day = 6;
    expect(papaDue(1, 0)).toBeNull();
    S.day = 7;
    expect(papaDue(1, 0)).toBe("tip");
  });

  it("al subir de nivel y cuando abre la tienda rival, en cuanto se pueda", () => {
    papaDue(1, 1); // primera vez: apunta el nivel actual (las partidas de antes no reciben visita)
    expect(papaDue(2, 1)).toBe("level");
    expect(papaVisit("level", 2)).toEqual([PAPA.level]);
    expect(papaDue(2, 1)).toBeNull();
    S.summary = { day: 5, rivNew: 1 };
    expect(papaDue(2, 1)).toBe("rival");
    expect(papaVisit("rival", 2)).toEqual([PAPA.rival, PAPA.bye]);
    expect(papaDue(2, 1)).toBeNull();
  });
});
