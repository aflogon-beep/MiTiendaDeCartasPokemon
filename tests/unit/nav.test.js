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
    const goals = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const s = LAY.shelf(i); return [s.x + s.w / 2, s.y + s.h + 44]; });
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
    expect(c.wps.slice(0, 2)).toEqual([{ x: 358, y: 600 }, { x: 358, y: 560 }]);
    const d = { x: 200, y: 300 };
    routeTo(d, 900, 600);
    expect(d.wps.slice(-2)).toEqual([{ x: 358, y: 560 }, { x: 358, y: 600 }]);
    const e = { x: -300, y: 600 };
    routeTo(e, 900, 600);
    expect(e.wps).toEqual([]); // por la calle no hay obstáculos
    expect(AX()).toBe(-276);
  });
});
