// Ficha de una carta: vitrina, vender, favoritas, peanas, examinar y gradear.
import { slabHTML } from "./grading.js";
import { $, VIS } from "../../render/canvas.js";
import { A } from "../actions.js";
import { G, S } from "../../core/state.js";
import { GSVC, RAR } from "../../core/constants.js";
import { TILT, accTag, askGyro, chg, cls, pcHTML, ptTilt, spark } from "../modals.js";
import { caseAcc, caseCap, caseItems, itemVal, luxItems } from "../../core/economy.js";
import { collList, groups } from "./cards.js";
import { fmt, pct } from "../../core/util.js";
import { setName } from "../../core/cards/sets.js";
export function gradeBtns(sel) {
  const it = sel.its[0];
  if (it.fkK)
    return '<div class="mu" style="margin-top:8px">🚫 Falsificación detectada por el servicio de gradeo. No vale nada: puedes deshacerte de ella con «Vender».</div>';
  if (it.gq) return '<div class="mu" style="margin-top:8px">📮 En gradeo. Mira el estado en Más → Gradeo.</div>';
  if (it.gr) return "";
  return `<div class="btns"><button class="b" data-a="inspc">🔍 Examinar</button><button class="b" data-a="grade" data-k="std"${S.money < GSVC.std.cost ? " disabled" : ""}>🔍 Gradear · ${fmt(GSVC.std.cost)} · ${GSVC.std.days} días</button><button class="b" data-a="grade" data-k="exp"${S.money < GSVC.exp.cost ? " disabled" : ""}>⚡ Exprés · ${fmt(GSVC.exp.cost)} · 1 día</button></div>`;
}
export function luxBtns(sel) {
  if (!S.decor.lux) return "";
  const it = sel.its[0];
  if (it.gq || it.fkK) return "";
  const inl = sel.its.filter((i) => i.lux).length,
    used = luxItems().length;
  return `<div class="btns"><button class="b" data-a="luxadd"${used >= 3 || inl >= sel.its.length ? " disabled" : ""}>💎 A peana (${used}/3)</button>${inl ? '<button class="b" data-a="luxrem">Quitar de peana</button>' : ""}</div>`;
}
export function mCard() {
  const g = groups().find((x) => x.key === G.collSel);
  if (!g)
    return `<h2>🃏 Carta</h2><p class="mu">Ya no tienes esta carta.</p><button class="b pri big" data-a="m" data-k="coll">Volver a la colección</button>`;
  if (!VIS.cList || !VIS.cList.includes(g.key)) VIS.cList = collList().map((x) => x.key);
  const isFav = !!g.its[0].fav,
    c = g.c,
    it = g.its[0],
    u = itemVal(it),
    inc = g.its.filter((i) => i.case != null && !i.lux),
    mk = inc.length ? inc[0].case : 1,
    cap = caseCap(),
    used = caseItems().length,
    L = VIS.cList,
    ix = L.indexOf(g.key),
    all = inc.length >= g.its.length;
  return `<div class="cnav"><button class="b" data-a="cprev"${ix <= 0 ? " disabled" : ""}>◀</button><span class="mu">${ix >= 0 ? ix + 1 + " de " + L.length : ""}</span><button class="b" data-a="cnext"${ix < 0 || ix >= L.length - 1 ? " disabled" : ""}>▶</button></div>
  ${it.gr ? `<div class="cbig gr" id="cbig">${slabHTML(c, g.rv, it.gr, false, it)}</div>` : `<div class="cbig" id="cbig">${pcHTML(c, g.rv, false, 0)}</div>`}
  <h2 style="text-align:center;padding:0;margin:10px 0 2px">${c.name}</h2><div class="mu" style="text-align:center">${RAR[c.r].n} · ${setName(c.s)} · ${it.gr ? "PGS " + it.gr : g.k}${g.rv ? " · Reverse" : ""}${g.its.length > 1 ? " · tienes " + g.its.length : ""}</div>
  <div class="pn" style="margin-top:10px"><div class="row"><span>Valor de mercado</span><b style="font-size:20px">${fmt(u)}</b></div><div class="row">${spark(c.id)}<span class="mu">7 d <span class="${cls(chg(c.id, 7))}">${pct(chg(c.id, 7))}</span> · 30 d <span class="${cls(chg(c.id, 30))}">${pct(chg(c.id, 30))}</span></span></div></div>
  ${it.fkK ? '<div class="pn down">🚫 Falsificación detectada: no vale nada.</div>' : ""}${it.gq ? '<div class="pn">📮 Esta carta está en el gradeo.</div>' : ""}
  ${inc.length ? `<div class="pn"><div class="row"><b>🏷️ En vitrina${inc.length > 1 ? " ×" + inc.length : ""}</b><span class="step"><button class="b" data-a="mk" data-n="-.05">−</button><b>${fmt(u * mk)}</b><button class="b" data-a="mk" data-n=".05">+</button></span></div>${accTag(caseAcc(inc[0]))}</div>` : ""}
  ${isFav ? '<div class="pn favhd">❤️ <b>En tu colección personal.</b> <span class="mu">Protegida: no se vende ni va a la vitrina.</span></div>' : ""}
  <div class="cact"><button class="b ${all ? "" : "pri"} big3" data-a="${all ? "caserem" : "caseadd"}"${isFav || (!all && (used >= cap || it.fkK || it.gq)) ? " disabled" : ""}>🏷️<span>${all ? "Quitar de vitrina" : "A la vitrina"}</span><small>${used}/${cap}</small></button>
  <button class="b go big3" data-a="sell1"${it.gq || isFav ? " disabled" : ""}>💰<span>Vender 1</span><small>${fmt(it.fk && !it.fkK ? 0 : u * 0.85)}</small></button>
  <button class="b big3${VIS.cMore ? " on" : ""}" data-a="cmore">⋯<span>Más</span><small>opciones</small></button></div>
  <button class="b favbtn${isFav ? " on" : ""}" data-a="${isFav ? "favrem" : "favadd"}"${!isFav && (it.fkK || it.gq || !g.its.some((i) => i.case == null && !i.res && !i.lux)) ? " disabled" : ""}>${isFav ? "💔 Quitar de favoritas" : `❤️ Guardar ${g.its.length > 1 ? "1 " : ""}en favoritas`}</button>
  ${VIS.cMore ? `<div class="pn">${g.its.length > 1 ? `<div class="btns"><button class="b go" data-a="sellall">💰 Vender todas (${g.its.length}) · ${fmt(u * 0.85 * g.its.length)}</button></div>` : ""}${inc.length && !all ? '<div class="btns"><button class="b" data-a="caserem">Quitar 1 de la vitrina</button></div>' : ""}${luxBtns(g)}${gradeBtns(g)}<div class="mu" style="margin-top:6px">Vender al mayorista paga el 85 % del valor de mercado.</div></div>` : ""}`;
}
export function bindCard() {
  const b = $("#cbig");
  if (!b) return;
  const pc = b.querySelector(".pc, .slab"); // la carta, o la funda si está gradeada
  TILT.el = pc;
  let x0 = null;
  b.addEventListener("pointermove", ptTilt);
  b.addEventListener("pointerdown", (e) => {
    x0 = e.clientX;
    askGyro();
  });
  b.addEventListener("pointerup", (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) A[dx < 0 ? "cnext" : "cprev"]();
  });
}
