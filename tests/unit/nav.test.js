import { describe, it, expect } from "vitest";
import { nuevaPartida } from "./partida.js";
import { S } from "../../src/core/state.js";
import { DECOR } from "../../src/core/constants.js";
import { navPath, navLOS, navObstacles, routeTo, navCell, navOk, NG } from "../../src/world/nav.js";
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
  // FALLO CONOCIDO: a partir del hueco 7.º no hay camino y el cliente va en línea recta.
  // Cuando se decida y se arregle, cambiar it.fails por it (si empieza a pasar, Vitest lo marca en rojo).
  it.fails("todos los huecos de la cola (hasta 10 clientes) tienen camino desde la puerta", async () => {
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
    for (let q = 0; q < 10; q++) {
      const gy = LAY.qy + q * LAY.qs;
      const ok = navLOS(358, 520, LAY.qx, gy) || navPath(358, 520, LAY.qx, gy).length > 0;
      expect(ok, `hueco ${q + 1} (y = ${gy})`).toBe(true);
    }
  });
});
