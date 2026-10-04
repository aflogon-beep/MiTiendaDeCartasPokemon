// Zona Funko · F2–F5: catálogo, nivel, mercado, olas, pedidos, almacén, venta, encargos, eventos y álbum.
import { describe, it, expect, beforeEach } from "vitest";
import { S, newState } from "../../src/core/state.js";
import { FIGS, FKCOL, FKCOLS, ALLF, FBYID } from "../../src/core/funko/catalog.js";
import * as Z from "../../src/core/funko/zone.js";

const seq = (...v) => {
  let i = 0;
  return () => v[i++ % v.length];
};
beforeEach(() => {
  newState();
  S.tut = { on: false };
  S.money = 5000;
  S.fk = { name: "", since: 1 };
  Z.fkEnsure();
});

describe("catálogo", () => {
  it("11 colecciones con 20 figuras (4 olas de 5, la última de cada ola rara) y ids únicos", () => {
    expect(FKCOLS).toHaveLength(11);
    for (const c of FKCOLS) {
      const l = FIGS.filter((f) => f.c === c);
      expect(l, c).toHaveLength(20);
      expect(new Set(l.map((f) => f.w))).toEqual(new Set([1, 2, 3, 4]));
      expect(l.filter((f) => f.r)).toHaveLength(4);
    }
    expect(new Set(ALLF.map((f) => f.id)).size).toBe(ALLF.length);
    expect(ALLF.length).toBeGreaterThan(220);
    expect(FKCOL.st.n).toBe("Stranger Things");
  });
});

describe("nivel de la zona", () => {
  it("sube con ⭐, nunca baja y desbloquea colecciones", () => {
    expect(Z.fkLv()).toBe(1);
    expect(Z.fkColOn("pk")).toBe(true);
    expect(Z.fkColOn("mv")).toBe(false);
    Z.fkAddXp(Z.FK_XP[1]);
    expect(Z.fkLv()).toBe(2);
    expect(Z.fkColOn("mv")).toBe(true);
    Z.fkEnsure();
    expect(Z.fkWaves("mv")).toBe(2);
    S.fk.xp = 0;
    expect(Z.fkLv()).toBe(2);
  });
});

describe("pedidos, almacén y estanterías", () => {
  it("una caja de 6 llega al día siguiente; 1 de cada 6 trae una Chase", () => {
    const f = FIGS.find((x) => x.c === "pk" && !x.r && x.w === 1);
    const cost = Z.fkOrder(f.id);
    expect(cost).toBe(Z.fkCost(f) * 6);
    expect(S.money).toBe(5000 - cost);
    expect(Z.fkArrive()).toHaveLength(0); // aún no
    S.day++;
    const got = Z.fkArrive(seq(0.01, 0.9)); // Chase sí, ninguna dañada
    expect(got).toHaveLength(6);
    expect(got.filter((u) => u.v === "chase")).toHaveLength(1);
    expect(Z.fkCount("a")).toBe(6);
    // Reponer: las normales a la estantería y la Chase a la vitrina
    expect(Z.fkRestock()).toBe(6);
    expect([Z.fkCount("s"), Z.fkCount("v")]).toEqual([5, 1]);
  });
  it("lo que aún no ha salido o está descatalogado no se puede pedir", () => {
    const w3 = FIGS.find((x) => x.c === "pk" && x.w === 3);
    expect(Z.fkCanOrder(w3)).toBe("Aún no ha salido");
    S.fk.wv.pk = 4;
    const w1 = FIGS.find((x) => x.c === "pk" && x.w === 1);
    expect(Z.fkVault(w1)).toBe(true);
    expect(Z.fkCanOrder(w1)).toBe("Descatalogado");
  });
  it("las descatalogadas suben de precio (hasta ×3) y la caja dañada vale un 40 % menos", () => {
    const f = FIGS.find((x) => x.c === "pk" && x.w === 1);
    const b0 = Z.fkBase(f.id);
    S.fk.wv.pk = 4;
    S.fk.vd[f.id] = S.day;
    S.day += 10;
    expect(Z.fkBase(f.id)).toBeCloseTo(b0 * 1.6, 5);
    S.day += 100;
    expect(Z.fkBase(f.id)).toBeCloseTo(b0 * 3, 5);
    const u = { f: f.id, v: "", d: 1, at: "s" };
    expect(Z.fkUVal(u)).toBeCloseTo(Z.fkBase(f.id) * 0.6, 5);
    expect(Z.fkUVal({ f: f.id, v: "chase", d: 0, at: "a" })).toBeCloseTo(Z.fkBase(f.id) * 5, 5);
  });
  it("vender, cobrar ⭐ y vender al mayorista", () => {
    const f = FIGS[0];
    S.fk.u.push({ i: 99, f: f.id, v: "", d: 0, p: 0, at: "s", t: 1 });
    const u = S.fk.u[0];
    Z.fkSold([u], 20);
    expect(S.fk.u).toHaveLength(0);
    expect(S.fk.xp).toBe(20);
    expect(S.fk.st.inc).toBe(20);
    S.fk.u.push({ i: 100, f: f.id, v: "", d: 0, p: 0, at: "a", t: 1 });
    const m0 = S.money,
      got = Z.fkSellWholesale(100);
    expect(got).toBeGreaterThan(0);
    expect(S.money).toBe(m0 + got);
  });
});

describe("cierre del día", () => {
  it("cobra alquiler y encargado, avisa de la ola la víspera y la publica al día siguiente", () => {
    S.fk.stf = 1;
    S.fk.wd.pk = S.day + 1;
    const m0 = S.money;
    let sum = Z.fkEndDay(() => 0.9);
    expect(S.money).toBe(m0 - Z.FK_RENT - Z.FK_STAFF_SAL);
    expect(sum.news.join(" ")).toMatch(/Mañana sale la ola 3 de Pokémon/);
    S.day++;
    sum = Z.fkEndDay(() => 0.9);
    expect(Z.fkWaves("pk")).toBe(3);
    expect(sum.news.join(" ")).toMatch(/ola 3 de Pokémon/);
  });
  it("el encargado vuelve a pedir lo que se ha agotado, sin pasarse de su tope", () => {
    S.fk.stf = 1;
    S.fk.bud = 100;
    const f = FIGS.find((x) => x.c === "pk" && !x.r && x.w === 1);
    S.fk.st.sold = [f.id];
    Z.fkEndDay(() => 0.9);
    expect(S.fk.del).toHaveLength(Z.fkCost(f) * 6 <= 100 ? 1 : 0);
  });
});

describe("logros de la zona", () => {
  it("se cobran una vez al cumplirse", () => {
    S.lt.fksold = 1;
    const m0 = S.money;
    Z.fkAch();
    expect(S.money).toBe(m0 + 30);
    Z.fkAch();
    expect(S.money).toBe(m0 + 30);
    expect(S.fk.ach.fk1).toBe(1);
  });
});

describe("encargos, eventos y álbum", () => {
  it("un encargo se entrega con la figura pedida y paga más que el mercado", () => {
    const o = Z.fkGenOrder(seq(0.01, 0.9, 0.5, 0.5, 0.5));
    expect(o.pay).toBeGreaterThan(Z.fkBase(o.f));
    expect(Z.fkDeliver(o.id)).toBe(false);
    S.fk.u.push({ i: 7, f: o.f, v: o.v, d: 0, p: 0, at: "a", t: 1 });
    const m0 = S.money;
    expect(Z.fkDeliver(o.id)).toBe(o.pay);
    expect(S.money).toBe(m0 + o.pay);
    expect(S.fk.ord).toHaveLength(0);
  });
  it("eventos semanales desde el nivel 5, con exclusivas que suben con los días", () => {
    S.fk.xp = Z.FK_XP[4];
    S.fk.evd = S.day + 1;
    Z.fkEndDay(() => 0.3);
    S.day++;
    const ev = Z.fkEventToday();
    expect(ev.list.length).toBeGreaterThan(0);
    const e = ev.list[0];
    expect(Z.fkEventBuy(e.f)).toBe(true);
    const u = S.fk.u.find((x) => x.v === "exc");
    expect(Z.fkVm("exc", u.t)).toBeCloseTo(1.2);
    S.day += 7;
    expect(Z.fkVm("exc", u.t)).toBeCloseTo(2.5);
  });
  it("el álbum se completa con Mis Funkos y da premio una vez", () => {
    FIGS.filter((f) => f.c === "pk").forEach((f, i) => {
      S.fk.u.push({ i: 500 + i, f: f.id, v: "", d: 0, p: 0, at: "a", t: 1 });
      Z.fkMove(500 + i, "m");
    });
    expect(Z.fkAlbumOf("pk")).toEqual([20, 20]);
    S.fk.ach = { fkalb: 1 }; // (el logro «Colección completa» paga aparte)
    const m0 = S.money;
    expect(Z.fkAlbumClaim("pk")).toBe(true);
    expect(S.money).toBe(m0 + Z.FK_ALB_PRIZE);
    expect(Z.fkAlbumClaim("pk")).toBe(false);
  });
  it("partida antigua de la F1 (solo nombre): se completa sin perder nada", () => {
    S.fk = { name: "Pop", since: 3 };
    Z.fkEnsure();
    expect(S.fk.name).toBe("Pop");
    expect(S.fk.u).toEqual([]);
    expect(Z.fkWaves("pk")).toBe(2);
    expect(FBYID.oro.gold).toBe(true);
  });
});
