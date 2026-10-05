// Niveles de la tienda (al tocar «Nivel N» arriba): en cuál estás, cuánto falta para el siguiente y qué da cada uno.
import { LV, TIERS } from "../../core/constants.js";
import { level, netWorth, tierOf } from "../../core/economy.js";
import { unlocksAt } from "../../core/unlocks.js";
import { fmt } from "../../core/util.js";

/** 1600 → «1.600 €» (sin céntimos y con punto también en las de 4 cifras). */
const eur = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";

export function mLevels() {
  const lv = level(),
    nw = netWorth(),
    nx = LV[lv],
    pc = nx ? Math.max(0, Math.min(100, ((nw - LV[lv - 1]) / (nx - LV[lv - 1])) * 100)) : 100;
  return `<h2>📈 Niveles de la tienda</h2><p class="mu">Se sube por lo que vale la empresa: dinero, cartas y stock. El nivel nunca baja.</p>
  <div class="pn lvnow"><b>Nivel ${lv} · ${TIERS[tierOf(lv)].sub}</b><span class="lvbar"><i style="width:${pc}%"></i></span><small>${nx ? `Empresa ${fmt(nw)} · nivel ${lv + 1} con ${eur(nx)}` : "¡Nivel máximo!"}</small></div>
  ${LV.map((v, i) => {
    const n = i + 1;
    return `<div class="pn lvrow${n <= lv ? " on" : ""}${n === lv ? " now" : ""}"><span class="lvrow-n">${n}</span><div><b>${n === 1 ? "Al empezar" : "Desde " + eur(v)}</b><ul>${unlocksAt(
      n,
    )
      .map((t) => `<li>${t}</li>`)
      .join("")}</ul></div><span>${n <= lv ? "✔" : "🔒"}</span></div>`;
  }).join("")}`;
}
