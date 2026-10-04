// Zona Funko (docs/funkos/DISENO.md) · F1: la librería de al lado se traspasa; se compra, Don Ramón da las
// llaves, el jugador pone el nombre y Emma se pide el sofá.
//   fklocal  ficha de la librería (en venta, o ya tuya: cambiar el nombre)
//   fkname   al comprarla: poner nombre a la zona
import { G, S } from "../../core/state.js";
import { FK_COST, FK_LV, FK_NAMES, fkBuy, fkCanBuy, fkName, fkSetName } from "../../core/funko.js";
import { fmt } from "../../core/util.js";
import { level } from "../../core/economy.js";
import { hero } from "../hero.js";
import { fkLv } from "../../core/funko/zone.js";
import { closeM, openM } from "../modals.js";
import { $ } from "../../render/canvas.js";
import { camLook } from "../../render/camera.js";
import { starsAt, shake } from "../../render/effects.js";
import { sfx } from "../../audio/sfx.js";
import { toast } from "../toast.js";
import { hud } from "../hud.js";
import { sayBubble } from "../quips.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** Centro de la zona en el mundo (local de la librería, x 808–1084). */
export const FKZ = { x: 946, y: 300 };

export function mFkLocal() {
  if (S.fk)
    return `<h2>🧸 ${esc(fkName())}</h2>${hero("ramon", "happy", "¡Cómo ha cambiado mi librería! Donde estaban las novelas ahora hay… ¿cabezones?", "sun")}
  <div class="pn"><b>Nombre de la zona</b><input class="inp" data-i="fknm" maxlength="22" placeholder="${FK_NAMES[0]}" value="${esc(S.fk.name || "")}" style="margin:6px 0 0"><div class="mu">Sale en el neón de la pared y en el escaparate.</div></div>
  <div class="btns"><button class="b pri" data-a="fkgo">📦 Stock de Funkos</button><button class="b" data-a="m" data-k="fkcolec">🧸 Colección</button><button class="b" data-a="m" data-k="fklv">⭐ Nivel ${fkLv()}</button><button class="b" data-a="m" data-k="up">🛸 Mejoras</button></div>
  <div class="tip">🛋️ El rincón de Emma: su sofá, con tele y consola (si está dormida, tócala)</div>`;
  const lv = level() >= FK_LV,
    falta = Math.max(0, FK_COST - S.money);
  return `<h2>📚 Se traspasa: la librería de al lado</h2>${hero("ramon", "happy", "Me jubilo, chavales. Cuarenta años vendiendo libros aquí… Mi local está <b>pegado a vuestra tienda</b>: si lo queréis, es vuestro.", "sun")}
  <div class="pn"><p style="margin:0 0 8px">Si lo compras, abrimos un paso en la pared, junto a la caja, y tu tienda crece con una <b>zona solo de Funkos</b>.</p>
  <div class="tip">🏪 Es tu misma tienda: misma caja, mismos clientes, mismo personal</div>
  <div class="tip">🛸 Suelo de nave espacial, neón con el nombre que elijas y el sofá de Emma</div>
  <div class="tip">🧸 Funkos de Marvel, Star Wars, Pokémon, Stranger Things, Harry Potter, anime…</div></div>
  <button class="b pri big" data-a="fkbuy"${fkCanBuy() ? "" : " disabled"}>Comprar el local · ${fmt(FK_COST)}</button>${lv ? (falta ? `<p class="mu">Te faltan ${fmt(falta)}.</p>` : "") : `<p class="mu">Necesitas nivel ${FK_LV}.</p>`}`;
}

export function mFkName() {
  return `${hero("ramon", "laugh", "Aquí tenéis las llaves. ¡Cuidádmelo, que lo quiero mucho!", "sun")}
  <h2 style="margin-top:14px">¿Cómo se llama vuestra zona Funko?</h2>
  <input class="inp" id="fknm" data-i="fknm" maxlength="22" placeholder="${FK_NAMES[0]}" value="${esc((S.fk && S.fk.name) || "")}" style="font-size:18px;text-align:center">
  <div class="btns fksug">${FK_NAMES.map((n) => `<button class="b" data-a="fksug" data-k="${n}">${n}</button>`).join("")}</div>
  ${hero("alvaro", "stars", "¡¡Una zona entera de Funkos!! ¿Ponemos un Darth Vader de verdad en la puerta?", "rosa")}
  <button class="b pri big" data-a="fkopen" style="margin-top:10px">¡Abrimos! 🎉</button>`;
}

/* ---------- Acciones (ui/actions.js las enlaza: fkbuy, fksug, fkopen y el campo fknm) ---------- */
export function fkBuyAct() {
  if (!fkBuy()) return;
  G.BGk = -1;
  G.CITYk = "";
  sfx.ach();
  shake(8);
  hud();
  openM("fkname");
}
export function fkSugAct(n) {
  fkSetName(n);
  G.FKk = null;
  const e = $("#fknm");
  if (e) e.value = n;
}
export function fkOpenAct() {
  const e = $("#fknm");
  if (e) fkSetName(e.value);
  G.FKk = null;
  closeM();
  camLook(FKZ.x, FKZ.y);
  for (let i = 0; i < 6; i++)
    setTimeout(() => starsAt(FKZ.x - 100 + Math.random() * 200, 140 + Math.random() * 300, 14), i * 150);
  toast(`🧸 ¡${fkName()} abierta! Está a la derecha de la caja`);
  sfx.ach();
  setTimeout(
    () =>
      sayBubble(
        "emma",
        "laugh",
        "Yo me pido el sofá de la zona Funko. Desde ahí, con el mando, lo controlo todo… y las cuentas las sigo llevando yo.",
        6000,
      ),
    1200,
  );
}
export function fkNameInput(el) {
  fkSetName(el.value);
  G.FKk = null; // el neón y el escaparate se vuelven a dibujar con el nombre nuevo
  const h = $("#ovh h2");
  if (G.M === "fklocal" && h) h.textContent = "🧸 " + fkName();
}
