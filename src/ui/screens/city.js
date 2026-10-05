// Edificios de la calle: ampliación, banco, café, colegio, tienda rival y mercadillo.
import { BYID, setName } from "../../core/cards/sets.js";
import { REGS } from "../../core/constants.js";
import { LOAN_BIG } from "../../core/unlocks.js";
import { S, SETS } from "../../core/state.js";
import { VIS } from "../../render/canvas.js";
import { face } from "../modals.js";
import { fmt, r05 } from "../../core/util.js";
import { hearts, regS } from "../../core/regulars.js";
import { itemVal, level } from "../../core/economy.js";
import { marketDay, mkCand, mkMarketLots, nextMarket } from "../../core/market.js";
import { regImg } from "./retos.js";
import { rivalMul } from "../../core/rival.js";
export function mAnnex() {
  return S.annex
    ? `<h2>🏗️ Ampliación</h2><div class="pn">¡Ya es tuya! La antigua panadería es parte de tu tienda: 2 estanterías más y la zona de juego.</div>`
    : `<h2>🏗️ Se vende: la panadería</h2><div class="pn"><p>La panadería de al lado cierra y vende el local. Si lo compras, tiramos la pared y tu tienda crece:</p><div class="tip">🗄️ +2 estanterías para sobres</div><div class="tip">🎮 Zona de juego con tele y pufs: +10 % clientes</div><div class="tip">🏬 Más espacio y más prestigio</div></div><button class="b pri big" data-a="annexbuy"${S.money < 4000 || level() < 3 ? " disabled" : ""}>Comprar el local · 4.000 €</button>${level() < 3 ? '<p class="mu">Necesitas nivel 3.</p>' : ""}`;
}
export function mBank() {
  const L = S.loan;
  return `<h2>🏦 Banco</h2>${L && L.left > 0 ? `<div class="pn"><b>Préstamo activo</b><div>Te quedan por pagar <b>${fmt(L.left)}</b> (${fmt(L.daily)} cada noche).</div><div class="btns"><button class="b pri" data-a="loanpay"${S.money < L.left ? " disabled" : ""}>Pagarlo todo ya (${fmt(L.left)})</button></div></div>` : `<p class="mu">Pide un préstamo para crecer más rápido. Lo devuelves en 10 días con un 12 % de intereses; se cobra solo cada noche.</p>${[500, 1500, 4000].map((a) => `<div class="pn row"><span><b>${fmt(a)}</b> · devuelves ${fmt(a * 1.12)} (${fmt((a * 1.12) / 10)}/día)</span><button class="b pri" data-a="loan" data-n="${a}"${a >= 4000 && level() < 3 ? " disabled" : ""}>Pedir</button></div>`).join("")}<div class="pn row" data-fase="I"><span><b>${fmt(LOAN_BIG)}</b> · devuelves ${fmt(LOAN_BIG * 1.12)} (${fmt((LOAN_BIG * 1.12) / 10)}/día)</span><button class="b pri" data-a="loan" data-n="${LOAN_BIG}"${level() < 4 ? " disabled" : ""}>Pedir</button></div><p class="mu">El de 4.000 € requiere nivel 3.</p><p class="mu" data-fase="I">El de ${fmt(LOAN_BIG)} requiere nivel 4.</p>`}`;
}
export const CAFEL = [
  "¿Has visto el precio del Charizard? ¡Está por las nubes!",
  "Ayer abrí tres sobres y nada… ¡hoy seguro que sí!",
  "Me falta solo una carta para completar el set.",
  "Dicen que en la tienda de enfrente hay falsas…",
  "Mi carta favorita es la que tiene brillos arcoíris.",
  "El próximo torneo lo gano yo, ya verás.",
];
export function mCafe() {
  const regs = REGS.filter((r) => S.regs[r.id] && S.regs[r.id].met),
    cd = S.cafe && S.cafe.day === S.day ? S.cafe : (S.cafe = { day: S.day, inv: [] });
  return `<h2>☕ Café de la esquina</h2><p class="mu">Tus habituales se toman aquí un café. Invítales y te lo agradecerán.</p>${
    regs.length
      ? regs
          .map((r, i) => {
            const s = regS(r.id),
              done = cd.inv.includes(r.id);
            return `<div class="pn" style="display:flex;gap:10px;align-items:center"><img class="rgimg" src="${regImg(r.id)}" alt=""><div style="flex:1;min-width:0"><b>${r.n}</b> <span style="font-size:12px">${hearts(s.loy)}</span><div class="mu">«${CAFEL[(i + S.day) % CAFEL.length]}»</div></div><button class="b ${done ? "" : "pri"}" data-a="cafeinv" data-k="${r.id}"${done || S.money < 2 ? " disabled" : ""}>${done ? "☕ ✔" : "☕ 2 €"}</button></div>`;
          })
          .join("")
      : '<p class="mu">Aún no conoces a ningún habitual. ¡Ya vendrán!</p>'
  }`;
}
export function mCole() {
  const sp = S.school && S.school.until >= S.day;
  return `<h2>🏫 Colegio</h2><div class="pn">Por la mañana los niños van al cole y a media tarde salen: a esas horas llegan más niños a la tienda. ¡Ten sobres a buen precio y accesorios!</div><div class="pn"><b>Patrocinar el torneo escolar</b><div class="mu">Durante 3 días vendrán muchos más niños y ganas reputación.</div><div class="btns"><button class="b pri" data-a="school"${sp || S.money < 60 ? " disabled" : ""}>${sp ? "Patrocinado hasta el día " + S.school.until : "Patrocinar · 60 €"}</button></div></div>`;
}
export function mRival() {
  const R = S.rival;
  if (!R || (!R.on && !R.closed))
    return `<h2>🏪 Local en alquiler</h2><p class="mu">Este local está vacío… por ahora.</p>`;
  if (R.closed) return `<h2>⚡ Cartas El Rayo</h2><div class="pn">¡La tienda rival cerró! El barrio es tuyo. 🏆</div>`;
  const shown = SETS.filter((sd) => S.slots.includes(sd.id)),
    pr = S.myPromo && S.myPromo.day === S.day;
  const rows = shown
    .map((sd) => {
      const rp = r05(S.pack[sd.id].ref * R.price * (R.promo && R.promo.s === sd.id ? 0.85 : 1)),
        mp = S.shelf[sd.id];
      return `<tr><td>${sd.n}</td><td>${fmt(mp)}</td><td class="${mp <= rp ? "up" : "down"}">${fmt(rp)}</td></tr>`;
    })
    .join("");
  return `<h2>⚡ Cartas El Rayo</h2><p class="mu">La tienda rival de enfrente. Si son más baratos, se llevan parte de tus clientes.</p><div class="pn"><div class="row"><b>Fuerza de la rival</b><span>${Math.round(R.str)} %</span></div><div class="prog"><i style="width:${R.str}%;background:linear-gradient(90deg,#8e4cb5,#e3350d)"></i></div>${R.promo ? `<div class="down">Hoy tienen oferta en ${setName(R.promo.s)}.</div>` : ""}<div class="mu">Ahora mismo te quitan ~${Math.round((1 - rivalMul()) * 100)} % de los clientes.</div></div>
  ${rows ? `<table class="tb"><tr class="mu"><td>Sobres</td><td>Tú</td><td>Ellos</td></tr>${rows}</table>` : ""}
  <div class="pn"><b>Cómo ganarles</b><div class="tip">💸 Pon tus sobres más baratos que ellos: cada día que les ganas en precio pierden fuerza.</div><div class="tip">⭐ Sube tu reputación (encargos, torneos, álbum).</div><div class="tip">📣 Haz una oferta del día (−15 %) en el set de su promoción para robársela.</div></div>
  <div class="btns">${shown.map((sd) => `<button class="b" data-a="mypromo" data-k="${sd.id}"${pr ? " disabled" : ""}>📣 Oferta en ${sd.n}</button>`).join("")}</div>${pr ? `<p class="up">Oferta de hoy: −15 % en ${setName(S.myPromo.s)}</p>` : ""}`;
}
export function mMarket() {
  if (!marketDay())
    return `<h2>⛲ La plaza</h2><div class="pn">Cada semana hay mercadillo de cartas en la plaza. El próximo es el <b>día ${nextMarket()}</b>.</div>`;
  const mk = S.market && S.market.day === S.day ? S.market : null,
    lots = mkMarketLots(),
    sel = VIS.mksel || [];
  return `<h2>🧺 Mercadillo de la plaza</h2>${
    mk
      ? `<div class="pn"><b>Tu puesto está montado</b><div class="mu">Llevas ${mk.items.length} carta(s) al ${Math.round(mk.mk * 100)} % del mercado. Se venden a lo largo del día; el resultado sale en el ticket.</div></div>`
      : `<div class="pn"><b>Monta tu puesto (20 €)</b><div class="mu">Elige hasta 12 cartas guardadas (no las de la vitrina) y su precio.</div><div class="btns">${[1, 1.1, 1.2].map((m) => `<button class="b ${(VIS.mkm || 1.1) === m ? "on" : ""}" data-a="mkm" data-n="${m}">${Math.round(m * 100)} %</button>`).join("")}</div><div class="tiles" style="margin-top:8px">${
          mkCand()
            .map(
              (it) =>
                `<div class="tile${sel.includes(it.i) ? " sel" : ""}" data-a="mksel" data-n="${it.i}">${face(BYID[it.c], it.rv)}<div class="pt">${fmt(itemVal(it))}</div></div>`,
            )
            .join("") || '<p class="mu">No tienes cartas guardadas de más de 0,50 €.</p>'
        }</div><button class="b pri big" data-a="mkgo"${!sel.length || S.money < 20 ? " disabled" : ""}>Montar puesto con ${sel.length} carta(s) · 20 €</button></div>`
  }
  <h3>Lotes de otros puestos</h3>${lots.map((L, i) => (L.done ? `<div class="pn mu">Lote ${i + 1}: comprado ✔</div>` : `<div class="pn row"><span>📦 Lote de ${L.n} cartas · piden ${fmt(L.ask)}</span><button class="b pri" data-a="mklot" data-n="${i}">Ver lote</button></div>`)).join("")}`;
}
