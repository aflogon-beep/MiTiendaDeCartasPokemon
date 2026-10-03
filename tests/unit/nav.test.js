import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { DECOR } from "../../src/core/constants.js";
import { navPath, navLOS, navObstacles, routeTo, navCell, navOk, NG, queueSpot } from "../../src/world/nav.js";
import { LAY, AX } from "../../src/world/layout.js";

nuevaPartida();
const inside = (x, y) => navObstacles().some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1);

describe("navegación (navPath)", () => {
  it("con línea de visión directa no hace falta ruta", () => {
    expect(navPath(358, 520, 358, 500)).toEqual([]);
  });

  it("de la puerta a cada estantería y a la cola: tramos sin obstáculos", () => {
    S.decor = Object.fromEntries(DECOR.map((d) => [d.k, 1]));
    S.up.shelf = 1;
    S.annex = true;
    const goals = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const s = LAY.shelf(i);
      return [s.x + s.w / 2, s.y + s.h + 44];
    });
    goals.push([LAY.qx, LAY.qy], [LAY.qx, LAY.qy + 5 * LAY.qs]);
    for (const [gx, gy] of goals) {
      const path = navPath(358, 540, gx, gy);
      let [px, py] = [358, 540];
      for (const p of path) {
        expect(inside(p.x, p.y), `punto (${p.x},${p.y}) hacia (${gx},${gy})`).toBe(false);
        expect(navLOS(px, py, p.x, p.y), `tramo hacia (${p.x},${p.y})`).toBe(true);
        [px, py] = [p.x, p.y];
      }
    }
  });

  it("la cuadrícula se rehace al cambiar el mobiliario", () => {
    S.decor = {};
    navPath(100, 100, 700, 500);
    const sig = NG.sig;
    S.decor.sofa = 1;
    navPath(100, 100, 700, 500);
    expect(NG.sig).not.toBe(sig);
    const [c, r] = navCell(560, 503);
    expect(navOk(c, r)).toBe(false); // el sofá ocupa su sitio
  });
});

describe("rutas desde la calle (routeTo)", () => {
  it("entra por la puerta y sale por ella", () => {
    const c = { x: -100, y: 600 };
    routeTo(c, 200, 300);
    expect(c.wps.slice(0, 2)).toEqual([
      { x: 358, y: 600 },
      { x: 358, y: 560 },
    ]);
    const d = { x: 200, y: 300 };
    routeTo(d, 900, 600);
    expect(d.wps.slice(-2)).toEqual([
      { x: 358, y: 560 },
      { x: 358, y: 600 },
    ]);
    const e = { x: -300, y: 600 };
    routeTo(e, 900, 600);
    expect(e.wps).toEqual([]); // por la calle no hay obstáculos
    expect(AX()).toBe(-276);
  });
});

describe("cola (docs/pendientes.md §1)", () => {
  it("si la cola avanza mientras un cliente va hacia ella, su ruta se recalcula hacia el hueco nuevo", async () => {
    const { custs, queue, updateCusts } = await import("../../src/core/customers/move.js");
    custs.length = 0;
    queue.length = 0;
    const mk = (x, y) => ({ x, y, t: 0, sp: 60, ph: 0, st: "toq", want: { k: "pack" }, wt: 0, pat: 999, face: 1 });
    const a = mk(LAY.qx, LAY.qy), // ya en el hueco 0
      b = mk(200, 470); // lejos, abajo a la izquierda
    custs.push(a, b);
    queue.push(a);
    routeTo(b, LAY.qx, LAY.qy + LAY.qs); // va al hueco 1
    expect(b.rg).toEqual({ x: LAY.qx, y: LAY.qy + LAY.qs });
    queue.push(b);
    // a se va: b pasa al hueco 0 y su ruta se recalcula hacia él
    queue.splice(0, 1);
    custs.splice(0, 1);
    updateCusts(0.01);
    expect(b.rg).toEqual({ x: LAY.qx, y: LAY.qy });
    custs.length = 0;
    queue.length = 0;
  });
});

describe("cola larga con todo el mobiliario (docs/pendientes.md §1, causa 2)", () => {
  const reachable = (x, y) => {
    if (navLOS(358, 520, x, y)) return true;
    const p = navPath(358, 520, x, y);
    return p.length > 0 && navLOS(p[p.length - 1].x, p[p.length - 1].y, x, y);
  };

  it("sin muebles, la cola es la fila de siempre", () => {
    nuevaPartida();
    for (let q = 0; q < 8; q++) expect(queueSpot(q)).toEqual({ x: LAY.qx, y: LAY.qy + q * LAY.qs });
  });

  it("todos los sitios de la cola (hasta 12 clientes) tienen camino; los que no caben esperan cerca del final", async () => {
    const { CARDS } = await import("../../src/core/cards/sets.js");
    const { price } = await import("../../src/core/economy.js");
    // La tienda al completo, como en el test 5 de Playwright
    nuevaPartida();
    S.decor = Object.fromEntries(DECOR.map((d) => [d.k, 1]));
    S.up.shelf = 1;
    S.up.case = 1;
    S.annex = true;
    S.season = "xmas";
    S.prod["etb:mew"] = 3;
    S.prod["box:pre"] = 2;
    CARDS.filter((c) => price(c.id) >= 2)
      .slice(0, 12)
      .forEach((c, i) =>
        S.items.push({
          i: S.nid++,
          c: c.id,
          k: "NM",
          rv: false,
          cost: 1,
          case: i < 3 ? 1.2 : null,
          res: false,
          lux: i < 3,
          fav: i >= 3 && i < 6,
        }),
      );
    const sp = [];
    for (let q = 0; q < 12; q++) {
      const p = queueSpot(q);
      expect(reachable(p.x, p.y), `sitio ${q + 1} (${p.x},${p.y})`).toBe(true);
      expect(inside(p.x, p.y), `sitio ${q + 1} dentro de un mueble`).toBe(false);
      for (const o of sp) expect(Math.hypot(o.x - p.x, o.y - p.y)).toBeGreaterThanOrEqual(20);
      sp.push(p);
    }
    // Los 6 primeros, en la fila de siempre; los demás, cerca del último de la fila
    for (let q = 0; q < 6; q++) expect(sp[q]).toEqual({ x: LAY.qx, y: LAY.qy + q * LAY.qs });
    for (let q = 6; q < 12; q++) expect(Math.hypot(sp[q].x - sp[5].x, sp[q].y - sp[5].y)).toBeLessThan(80);
  });

  it("simulación: clientes que llegan de la calle y una cola que avanza al azar, a pasos grandes (como a 20×), nunca pisan un mueble", async () => {
    const { custs, queue, updateCusts } = await import("../../src/core/customers/move.js");
    const { CARDS } = await import("../../src/core/cards/sets.js");
    const { price } = await import("../../src/core/economy.js");
    nuevaPartida();
    S.decor = Object.fromEntries(DECOR.map((d) => [d.k, 1]));
    S.up.shelf = 1;
    S.up.case = 1;
    S.annex = true;
    S.season = "xmas";
    S.prod["etb:mew"] = 3;
    S.prod["box:pre"] = 2;
    CARDS.filter((c) => price(c.id) >= 2)
      .slice(0, 12)
      .forEach((c, i) =>
        S.items.push({
          i: S.nid++,
          c: c.id,
          k: "NM",
          rv: false,
          cost: 1,
          case: i < 3 ? 1.2 : null,
          res: false,
          lux: i < 3,
          fav: i >= 3 && i < 6,
        }),
      );
    const obs = navObstacles();
    const bad = [];
    let id = 0;
    for (let step = 0; step < 20000 && bad.length < 3; step++) {
      if (Math.random() < 0.08 && custs.length < 16) {
        const c = {
          id: ++id,
          x: 358 + (Math.random() < 0.5 ? -1 : 1) * (170 + Math.random() * 260),
          y: 590 + Math.random() * 16,
          t: 0,
          sp: 55 + Math.random() * 20,
          ph: 0,
          st: "toq",
          want: { k: "lot" },
          wt: 0,
          pat: 1e9,
          face: 1,
          tr: [],
        };
        routeTo(c, LAY.qx, LAY.qy + queue.length * LAY.qs);
        custs.push(c);
      }
      if (Math.random() < 0.03 && queue.length) {
        const c = queue[0];
        if (c.st === "wait") {
          queue.splice(0, 1);
          c.st = "leave";
        }
      }
      updateCusts(0.05 + Math.random() * 0.95);
      for (const c of custs) {
        c.tr.push([
          Math.round(c.x),
          Math.round(c.y),
          c.st,
          queue.indexOf(c),
          c.wps ? c.wps.length : -1,
          c.rg && `${c.rg.x},${c.rg.y}`,
        ]);
        if (c.tr.length > 25) c.tr.shift();
        if (!(c.x > AX() && c.x < 800 && c.y > 0 && c.y < 556)) continue;
        for (const [x0, y0, x1, y1] of obs)
          if (c.x > x0 && c.x < x1 && c.y > y0 && c.y < y1) {
            bad.push({ id: c.id, ob: [x0, y0, x1, y1], tr: c.tr.slice() });
            break;
          }
      }
    }
    custs.length = 0;
    queue.length = 0;
    if (bad.length) console.log(JSON.stringify(bad[0]));
    expect(bad.length).toBe(0);
  });
});
