// Ticket de cierre del día.
import { fkName } from "../../core/funko.js";
import { G, S, shopName } from "../../core/state.js";
import { TIERS } from "../../core/constants.js";
import { evLabel } from "../../core/events.js";
import { fmt } from "../../core/util.js";
import { level, tierOf } from "../../core/economy.js";
import { marketDay } from "../../core/market.js";
import { $ } from "../../render/canvas.js";
import { confetti, tipsHTML } from "../modals.js";
import { sfx } from "../../audio/sfx.js";
/** Por qué se fueron sin comprar (los motivos que el juego apunta durante el día), agrupados. */
export function lostWhy(w) {
  if (!w) return "";
  const n = { cola: 0, caro: 0, stock: 0, rival: 0 };
  for (const k in w) {
    const t = k.split(":")[0];
    if (t === "pat") n.cola += w[k];
    else if (t === "kp" || t === "pp" || t === "cp") n.caro += w[k];
    else if (t === "ks" || t === "ps" || t === "ce") n.stock += w[k];
    else if (t === "rv") n.rival += w[k];
  }
  const L = [
    ["😤 Cansados de esperar", n.cola],
    ["💸 Les pareció caro", n.caro],
    ["📦 No había lo que buscaban", n.stock],
    ["🏪 Se fueron a la rival", n.rival],
  ].filter(([, v]) => v > 0);
  return L.length
    ? `<div class="twhy" data-fase="I">${L.map(([a, v]) => `<div class="tl"><span>${a}</span><i></i><span>${v}</span></div>`).join("")}</div>`
    : "";
}
/** Día de récord: cuando el ticket termina de imprimirse, cae el sello y sale confeti. */
export function recordFx() {
  setTimeout(() => {
    const ov = $("#ovh .ov");
    if (G.M !== "sum" || !ov) return;
    confetti(3, "#e3350d", ov);
    sfx.hit(3);
  }, 1300);
}
export function ticketHTML(s) {
  const T = TIERS[tierOf(level())],
    fk = s.fk, // zona Funko: sus ventas ya están en «Ventas»; su alquiler y su encargado, aparte
    res =
      s.inc + (s.tourInc || 0) + (s.tbl || 0) - s.rent - (s.sal || 0) - (s.refund || 0) - (fk ? fk.rent + fk.sal : 0);
  const L = (a, b, c) => `<div class="tl${c ? " " + c : ""}"><span>${a}</span><i></i><span>${b}</span></div>`;
  const hist = (S.hist || []).slice(-7),
    mx = Math.max(1, ...hist.map((h) => h.inc));
  const bars = hist
    .map((h, i) => {
      const bh = Math.max(2, (h.inc / mx) * 44);
      return `<rect x="${i * 28 + 4}" y="${50 - bh}" width="18" height="${bh}" rx="2" fill="${i === hist.length - 1 ? "#e3350d" : "#9aa0a8"}"/><text x="${i * 28 + 13}" y="62" font-size="8" text-anchor="middle" fill="#666">D${h.d}</text>`;
    })
    .join("");
  return `<div class="ticket"><div class="tc"><b>${shopName().toUpperCase()}</b><br>${T.sub}<br>TICKET DE CIERRE · DÍA ${s.day}</div><div class="tdash"></div>
  ${L("Clientes", s.cust)}${L("Se fueron sin comprar", s.lost)}${lostWhy(s.why)}<div class="tdash"></div>
  ${L("Ventas", fmt(s.inc), "pos")}${s.tbl ? `<div class="tl pos" data-fase="I"><span>Mesa de juego (${s.tblN} partida${s.tblN === 1 ? "" : "s"})</span><i></i><span>+${fmt(s.tbl)}</span></div>` : ""}${s.tourInc != null ? L("Torneo", (s.tourInc >= 0 ? "+" : "") + fmt(s.tourInc), s.tourInc >= 0 ? "pos" : "neg") : ""}${L("Alquiler", "−" + fmt(s.rent), "neg")}${s.sal ? L("Sueldos", "−" + fmt(s.sal), "neg") : ""}${s.refund ? L("Devoluciones", "−" + fmt(s.refund), "neg") : ""}${
    fk
      ? `<div data-fase="I">${L(`🧸 Funkos (${fk.n}) · ya en ventas`, fmt(fk.inc))}${fk.claw ? L(`🕹️ Máquina de gancho (${fk.clawN})`, fmt(fk.claw)) : ""}${fk.chase.length ? L(`✨ Chase vendida${fk.chase.length > 1 ? "s" : ""}`, fk.chase.length) : ""}${L("Alquiler de la zona Funko", "−" + fmt(fk.rent), "neg")}${fk.sal ? L("Encargado de la zona", "−" + fmt(fk.sal), "neg") : ""}</div>`
      : ""
  }
  <div class="tdash"></div>${L("<b>RESULTADO DEL DÍA</b>", `<b>${res >= 0 ? "+" : ""}${fmt(res)}</b>`, res >= 0 ? "pos" : "neg")}${L("Valor de la empresa", fmt(s.net))}${s.rec ? `<div class="tstamp" data-fase="I">¡RÉCORD!<small>de ventas</small></div>` : ""}
  ${hist.length > 1 ? `<div class="tchart">Ventas de los últimos días<svg viewBox="0 0 ${hist.length * 28 + 4} 66" width="100%" height="72">${bars}</svg></div>` : ""}
  <div class="tdash"></div><div class="tc">¡GRACIAS POR SU VISITA!<br>${new Date().toLocaleDateString("es-ES")}</div></div>`;
}
/** Zona Funko en el ticket: ⭐ del día, nivel, avisos para mañana y Chase que han llegado. */
function fkSumHTML(f) {
  const ch = (f.chaseNew || []).length;
  return `<div class="pn" data-fase="I"><b>🧸 ${fkName().replace(/</g, "&lt;")}</b><div>⭐ +${f.xp || 0} · nivel ${f.lv}${f.next > 0 ? ` · faltan ${f.next} ⭐ para el ${f.lv + 1}` : ""}</div>${f.staffBuy ? `<div class="mu">🧑‍🎤 El encargado ha pedido ${fmt(f.staffBuy)} en cajas.</div>` : ""}${(f.news || []).map((n) => `<div>${n}</div>`).join("")}${ch ? `<div class="btns"><button class="b fk" data-a="m" data-k="fkchase">✨ ¡Ha llegado ${ch > 1 ? ch + " Chase" : "una Chase"}! Ver</button></div>` : ""}</div>`;
}
export function mSum() {
  const s = S.summary;
  return `<h2>Fin del día ${s.day}</h2>${ticketHTML(s)}${s.mkInc ? `<div class="pn">🧺 Mercadillo: vendiste ${s.mkN} carta(s) por ${fmt(s.mkInc)}.</div>` : ""}${s.loanPay ? `<div class="pn">🏦 Cuota del préstamo: −${fmt(s.loanPay)} (quedan ${fmt(S.loan.left)}).</div>` : ""}${s.rivNew ? `<div class="pn down">🏪 ¡Ha abierto una tienda rival enfrente: Cartas El Rayo! Toca su local en la calle para ver sus precios.</div>` : ""}${s.rivMsg ? `<div class="pn up">${s.rivMsg}</div>` : ""}${marketDay() ? `<div class="pn">🧺 ¡Hoy hay mercadillo en la plaza! Aleja la cámara y toca la plaza para montar tu puesto.</div>` : ""}<div class="pn"><b>💡 Consejos de Emma</b>${tipsHTML(S.lastTips || [])}</div>
  ${s.news ? `<div class="pn">${s.news}</div>` : ""}${s.fk ? fkSumHTML(s.fk) : ""}
  ${s.grN ? `<div class="pn"><div>📬 Han llegado ${s.grN} carta(s) del gradeo.</div><div class="btns"><button class="b pri" data-a="grades">Ver resultados</button></div></div>` : ""}
  ${s.fkN ? `<div class="pn">🚫 El servicio de gradeo ha detectado ${s.fkN} falsificación(es). Esas cartas ya no valen nada.</div>` : ""}${s.refN ? `<div class="pn down">😡 ${s.refN} cliente(s) descubrieron que les vendiste una carta falsa: devuelves ${fmt(s.refund)} y pierdes reputación.</div>` : ""}
  ${s.newOrd ? `<div class="pn">📋 Hay un encargo nuevo en Tareas.</div>` : ""}${s.exp ? `<div class="pn mu">⌛ ${s.exp} encargo(s) han caducado.</div>` : ""}
  <div class="pn"><b>Día ${S.day}</b><div>${evLabel() || "Un día normal."}</div>${S.decor.table ? `<div class="btns"><button class="b ${S.tour ? "on" : ""}" data-a="tourtog">🏆 ${S.tour ? "Torneo organizado ✔" : "Organizar torneo (40 € en premios)"}</button></div>` : '<div class="mu">Con la mesa de juego (Más → Mejoras) podrás organizar torneos.</div>'}</div>
  <p class="mu">Misiones nuevas en Tareas. Repón stock y ajusta la vitrina antes de abrir.</p>`;
}
