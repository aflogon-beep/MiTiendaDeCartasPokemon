import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { nuevaPartida } from "./partida.js";
import { S, G } from "../../src/core/state.js";
import { saveNow, loadOrNew, skey, openSlot } from "../../src/core/save.js";
import {
  SLOTS_KEY,
  slotKey,
  lastSlot,
  useSlot,
  slotInfo,
  listSlots,
  hasAnySlot,
  deleteSlot,
} from "../../src/core/slots.js";

// Partida exportada desde la v22 (la misma que usa el test 11)
const V22 = readFileSync(new URL("../fixtures/partida-v22.json", import.meta.url), "utf8");
const OLD = JSON.parse(V22).S;

const clear = () => Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));

describe("ranuras de partida", () => {
  beforeEach(() => {
    nuevaPartida();
    clear();
    G.MODE = "real";
    G.SLOT = 1;
  });

  it("la ranura 1 usa la clave de siempre; la 2 y la 3, la misma con «-s2» y «-s3»", () => {
    expect([1, 2, 3].map((n) => slotKey(n, "real"))).toEqual([
      "pcs-save-real-v3",
      "pcs-save-real-v3-s2",
      "pcs-save-real-v3-s3",
    ]);
    expect(slotKey(2, "offline")).toBe("pcs-save-offline-v3-s2");
    expect(skey()).toBe("pcs-save-real-v3");
  });

  it("migración: la partida que ya existía es la ranura 1, con los mismos datos y sin tocar nada", () => {
    localStorage.setItem("pcs-save-real-v3", JSON.stringify(OLD));
    const before = { ...localStorage };

    expect(lastSlot()).toBe(1); // sin índice: se sigue con la partida de siempre
    expect(hasAnySlot()).toBe(true);
    const [s1, s2, s3] = listSlots();
    expect(s1).toEqual({
      n: 1,
      empty: false,
      name: (OLD.shopName || "").trim() || "Poké Cards",
      day: OLD.day,
      money: OLD.money,
      diff: "Fácil", // la partida de prueba se jugó en Fácil
      savedAt: OLD.savedAt,
    });
    expect(s2).toEqual({ n: 2, empty: true });
    expect(s3).toEqual({ n: 3, empty: true });
    expect({ ...localStorage }).toEqual(before); // leer las ranuras no escribe nada

    // Y se carga igual que antes
    useSlot(lastSlot());
    loadOrNew();
    expect(S.day).toBe(OLD.day);
    expect(S.money).toBe(OLD.money);
    expect(S.items.map((i) => i.c)).toEqual(OLD.items.map((i) => i.c));
    expect(localStorage.getItem("pcs-save-real-v3")).toBe(before["pcs-save-real-v3"]);
  });

  it("migración desde la clave v2, igual que la carga de siempre", () => {
    localStorage.setItem("pcs-save-real-v2", JSON.stringify(OLD));
    expect(slotInfo(1)).toMatchObject({ empty: false, day: OLD.day, money: OLD.money });
    loadOrNew();
    expect(S.money).toBe(OLD.money);
  });

  it("cada ranura guarda y carga su propia partida; la última usada se recuerda", () => {
    localStorage.setItem("pcs-save-real-v3", JSON.stringify(OLD));
    useSlot(2);
    nuevaPartida({ shopName: "Gengar Cards", diff: "dificil" });
    G.SLOT = 2;
    expect(saveNow()).toBe(true);
    expect(localStorage.getItem("pcs-save-real-v3-s2")).not.toBeNull();
    expect(JSON.parse(localStorage.getItem("pcs-save-real-v3")).money).toBe(OLD.money); // la 1, intacta
    expect(lastSlot()).toBe(2);
    expect(JSON.parse(localStorage.getItem(SLOTS_KEY))).toEqual({ last: 2 });
    expect(slotInfo(2)).toMatchObject({ empty: false, name: "Gengar Cards", diff: "Difícil", day: 1 });

    useSlot(1);
    loadOrNew();
    expect(S.money).toBe(OLD.money);
    useSlot(2);
    loadOrNew();
    expect(S.shopName).toBe("Gengar Cards");
  });

  it("openSlot guarda la partida actual en SU ranura antes de cambiar (nunca en la de otra)", () => {
    localStorage.setItem("pcs-save-real-v3", JSON.stringify(OLD));
    useSlot(1);
    loadOrNew();
    S.money = 4321;
    openSlot(2);
    expect(G.SLOT).toBe(2);
    expect(S.day).toBe(1); // la 2 estaba vacía: tienda nueva
    expect(JSON.parse(localStorage.getItem("pcs-save-real-v3")).money).toBe(4321);
    saveNow();
    expect(JSON.parse(localStorage.getItem("pcs-save-real-v3-s2")).day).toBe(1);
    openSlot(1);
    expect(S.money).toBe(4321);
  });

  it("una ranura vacía empieza una partida nueva", () => {
    useSlot(3);
    loadOrNew();
    expect(S.day).toBe(1);
    expect(localStorage.getItem("pcs-save-real-v3-s3")).toBeNull(); // no se guarda hasta que se juega
  });

  it("borrar una ranura quita solo esa partida (también su partida sin conexión)", () => {
    localStorage.setItem("pcs-save-real-v3", JSON.stringify(OLD));
    localStorage.setItem("pcs-save-real-v3-s2", JSON.stringify(OLD));
    localStorage.setItem("pcs-save-offline-v3-s2", JSON.stringify(OLD));
    deleteSlot(2);
    expect(listSlots().map((s) => s.empty)).toEqual([false, true, true]);
    expect(localStorage.getItem("pcs-save-offline-v3-s2")).toBeNull();
    expect(localStorage.getItem("pcs-save-real-v3")).not.toBeNull();
  });

  it("un índice estropeado o una ranura fuera de rango no rompen nada", () => {
    localStorage.setItem(SLOTS_KEY, "{roto");
    expect(lastSlot()).toBe(1);
    localStorage.setItem(SLOTS_KEY, JSON.stringify({ last: 7 }));
    expect(lastSlot()).toBe(1);
    expect(() => useSlot(4)).toThrow();
    localStorage.setItem("pcs-save-real-v3-s2", "no es json");
    expect(slotInfo(2)).toEqual({ n: 2, empty: true });
  });
});
