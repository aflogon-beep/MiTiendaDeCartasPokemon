import { describe, it, expect, beforeEach } from "vitest";
import { S, G, hasState, replaceState, SETS, syncSets, assignSlots, slotCount } from "../../src/core/state.js";
import { skey, saveNow, exportStr } from "../../src/core/save.js";
import { on } from "../../src/core/bus.js";
import { setCards, indexCards, mapCard } from "../../src/core/cards/sets.js";
import { FIX_CARDS } from "../fixtures/api.js";

// localStorage mínimo para Node: las claves guardadas son propiedades propias (como en el navegador,
// Object.keys(localStorage) las devuelve) y los métodos no son enumerables.
const LS = {};
const hide = (k, v) => Object.defineProperty(LS, k, { value: v, writable: true, enumerable: false });
hide("getItem", (k) => (Object.hasOwn(LS, k) ? LS[k] : null));
hide("setItem", (k, v) => (LS[k] = String(v)));
hide("removeItem", (k) => delete LS[k]);
globalThis.localStorage = LS;
const store = {
  get size() {
    return Object.keys(LS).length;
  },
  get: (k) => LS[k],
  has: (k) => Object.hasOwn(LS, k),
  set: (k, v) => (LS[k] = v),
  clear: () => Object.keys(LS).forEach((k) => delete LS[k]),
};

describe("estado", () => {
  it("antes de cargar no hay partida y no se guarda nada", () => {
    expect(hasState()).toBe(false);
    expect(saveNow()).toBe(false);
    expect(store.size).toBe(0);
  });

  it("replaceState mantiene la identidad de S y sustituye todo su contenido", () => {
    const ref = S;
    replaceState({ money: 5, day: 2, extra: 1 });
    replaceState({ money: 10, day: 3, sets: ["mew"], sealed: { mew: 2 }, up: { shelf: 0 }, slots: [] });
    expect(S).toBe(ref);
    expect(hasState()).toBe(true);
    expect(S.extra).toBeUndefined();
    expect(Object.keys(S)).toEqual(["money", "day", "sets", "sealed", "up", "slots"]);
  });

  it("syncSets y assignSlots: sets con cartas y huecos de estantería", () => {
    setCards(FIX_CARDS.sv3pt5.map((d) => mapCard(d, { id: "mew" })));
    indexCards();
    syncSets();
    expect(SETS.map((s) => s.id)).toEqual(["mew"]);
    expect(slotCount()).toBe(3);
    assignSlots();
    expect(S.slots).toEqual(["mew", null, null]);
  });
});

describe("guardado", () => {
  beforeEach(() => store.clear());

  it("usa las mismas claves de siempre según el modo", () => {
    G.MODE = "real";
    expect(skey()).toBe("pcs-save-real-v3");
    G.MODE = "offline";
    expect(skey()).toBe("pcs-save-offline-v3");
  });

  it("saveNow guarda S con la fecha de guardado", () => {
    G.MODE = "real";
    expect(saveNow()).toBe(true);
    const saved = JSON.parse(store.get("pcs-save-real-v3"));
    expect(saved.money).toBe(10);
    expect(saved.savedAt).toBeGreaterThan(0);
  });

  it("si localStorage está lleno, borra la caché de sets y reintenta; si aun así falla, avisa", () => {
    const real = LS.setItem;
    let fails = 1;
    LS.setItem = (k, v) => {
      if (k.startsWith("pcs-save") && fails-- > 0) throw new Error("lleno");
      store.set(k, v);
    };
    store.set("pcs-set2-sv3", "x");
    expect(saveNow()).toBe(true);
    expect(store.has("pcs-set2-sv3")).toBe(false);
    const msgs = [];
    on("toast", (t) => msgs.push(t));
    LS.setItem = () => {
      throw new Error("lleno");
    };
    expect(saveNow()).toBe(false);
    expect(msgs[0]).toContain("No se pudo guardar");
    LS.setItem = real;
  });

  it("exporta con el formato {app, v, mode, date, S}", () => {
    G.MODE = "real";
    const o = JSON.parse(exportStr());
    expect(Object.keys(o)).toEqual(["app", "v", "mode", "date", "S"]);
    expect(o).toMatchObject({ app: "pcs", v: 5, mode: "real" });
    expect(o.S.money).toBe(10);
  });
});

describe("cartas apartadas al cargar (pendientes §7)", () => {
  it("al cargar se sueltan las cartas apartadas para clientes que ya no están; las del mercadillo, no", async () => {
    const { releaseHolds } = await import("../../src/core/save.js");
    const { S } = await import("../../src/core/state.js");
    S.items = [
      { i: 1, c: "x", case: 1.02, res: true },
      { i: 2, c: "y", case: 1.02, res: true },
      { i: 3, c: "z", case: null, res: true },
    ];
    S.market = { day: S.day, items: [3], mk: 1.1 };
    releaseHolds();
    expect(S.items.map((i) => i.res)).toEqual([false, false, true]);
  });
});

describe("sobres que llevaban los clientes al cerrarse la app (pendientes §7)", () => {
  it("se apuntan al cogerlos, se borran al pagar o devolverlos y, al cargar, vuelven al stock", async () => {
    const { releaseHolds } = await import("../../src/core/save.js");
    const { holdNote } = await import("../../src/core/customers/move.js");
    const { S } = await import("../../src/core/state.js");
    S.sealed = { a: 10 };
    S.prod = { "acc:sleeves": 2 };
    S.held = {};
    S.items = [];
    // Un cliente coge 3 sobres y otro unas fundas (salen del stock)
    S.sealed.a -= 3;
    holdNote({ k: "pack", s: "a", qty: 3 }, 1);
    S.prod["acc:sleeves"] -= 1;
    holdNote({ k: "prod", pid: "acc:sleeves", qty: 1 }, 1);
    // Otro coge 2 y paga
    S.sealed.a -= 2;
    holdNote({ k: "pack", s: "a", qty: 2 }, 1);
    holdNote({ k: "pack", s: "a", qty: 2 }, -1);
    expect(S.held).toEqual({ "p:a": 3, "x:acc:sleeves": 1 });
    // La app se cierra: al cargar, vuelven los que no se pagaron
    releaseHolds();
    expect(S.sealed.a).toBe(8);
    expect(S.prod["acc:sleeves"]).toBe(2);
    expect(S.held).toEqual({});
  });
});
