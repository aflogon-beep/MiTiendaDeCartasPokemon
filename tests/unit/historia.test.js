import { describe, it, expect } from "vitest";
import { storyScript, NAMES, NAME_SUGGESTIONS } from "../../src/story/script.js";
import { CHARS, EXPR } from "../../src/render/characters.js";

const EX = EXPR.map((e) => e[0]);
const texts = (pet) => storyScript(pet).map((s) => [s.act || "", s.say[2]].join(" "));

describe("guion de la historia (story/script.js)", () => {
  it("8 escenas en orden, con plano, personajes y expresiones válidos", () => {
    const s = storyScript("cat");
    expect([...new Set(s.map((x) => x.scene[0]))]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const st of s) {
      expect(["wide", "close"]).toContain(st.shot);
      const [who, ex, text] = st.say;
      if (who) {
        expect(NAMES[who], who).toBeTruthy();
        expect(EX).toContain(ex);
      }
      expect(text.length, text).toBeLessThanOrEqual(90); // como mucho 2 líneas por bocadillo
      if (st.shot === "wide") expect(st.cam).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
      else {
        expect(st.who.length).toBeGreaterThan(0);
        for (const [c, e] of st.who) expect(CHARS[c] && EX.includes(e), c + " " + e).toBeTruthy();
      }
    }
  });

  it("en la escena 7 se pide el nombre una sola vez, con 3 sugerencias", () => {
    const asks = storyScript("cat").filter((s) => s.ask);
    expect(asks).toHaveLength(1);
    expect(asks[0].scene[0]).toBe(7);
    expect(NAME_SUGGESTIONS).toEqual(["Gengar Cards", "Aitana Cards", "Poké Cards"]);
  });

  it("la mascota elegida sustituye al gato de la escena 3", () => {
    expect(texts("cat").join("\n")).toContain("A veces heredas… un gato.");
    expect(texts("cat")).toContain(" Es naranja.");
    const dog = texts("dog").join("\n");
    expect(dog).toContain("A veces heredas… un perro.");
    expect(dog).toContain("¡Guau!");
    expect(dog).toContain("Es un perro.");
    expect(texts("bunny").join("\n")).toContain("Es un conejo.");
    // Sin mascota, ese chiste no sale
    const none = texts("none").join("\n");
    expect(none).not.toContain("Se llamará");
    expect(none).toContain("Hija, en la vida no siempre heredas lo que quieres.");
    expect(storyScript("none").length).toBe(storyScript("cat").length - 3);
  });
});
