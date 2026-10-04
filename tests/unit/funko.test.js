// Zona Funko · F1: el local de la librería se traspasa a nivel 5 y se compra por 15.000 €.
import { describe, it, expect, beforeEach } from "vitest";
import { S, newState } from "../../src/core/state.js";
import { FK_COST, fkBuy, fkCanBuy, fkForSale, fkName, fkOn, fkSetName } from "../../src/core/funko.js";
import { LV } from "../../src/core/constants.js";

beforeEach(() => {
  newState();
  S.tut = { on: false };
});
const setLevel = (l) => ((S.lvMax = l), (S.lvSeen = l));

describe("zona Funko · el local", () => {
  it("las partidas de antes no tienen zona Funko", () => {
    expect(S.fk).toBeUndefined();
    expect(fkOn()).toBe(false);
  });
  it("no se traspasa hasta el nivel 5", () => {
    // (con 14.000 € de empresa ya se es nivel 5: LV[4])
    setLevel(4);
    S.money = LV[4] - 2000;
    expect(fkForSale()).toBe(false);
    expect(fkBuy()).toBe(false);
    expect(S.money).toBe(LV[4] - 2000);
  });
  it("a nivel 5 se compra por 15.000 € (si los tienes) y empieza sin nombre", () => {
    setLevel(5);
    S.money = FK_COST - 1;
    expect(fkForSale()).toBe(true);
    expect(fkCanBuy()).toBe(false);
    expect(fkBuy()).toBe(false);
    S.money = FK_COST + 500;
    expect(fkBuy()).toBe(true);
    expect(S.money).toBe(500);
    expect(fkOn()).toBe(true);
    expect(fkName()).toBe("Zona Funko");
    expect(fkForSale()).toBe(false);
    expect(fkBuy()).toBe(false); // solo una vez
  });
  it("el nombre lo pone el jugador (22 letras como mucho)", () => {
    setLevel(5);
    S.money = FK_COST;
    fkBuy();
    fkSetName("  Pop <Galaxy>  ");
    expect(fkName()).toBe("Pop Galaxy");
    fkSetName("Una zona con un nombre larguísimo");
    expect(fkName()).toHaveLength(22);
    fkSetName("   ");
    expect(fkName()).toBe("Zona Funko");
  });
});
