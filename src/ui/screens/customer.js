// Ficha de un cliente.
import { G } from "../../core/state.js";
import { RG, hearts, regS } from "../../core/regulars.js";
import { front } from "../../core/customers/move.js";
import { mkOutfit } from "../../core/customers/outfit.js";
import { pInfo } from "../../core/economy.js";
import { portrait } from "../../render/people.js";
import { setName } from "../../core/cards/sets.js";
export const TDESC = {
  kid: "Niño/a: sobres y accesorios baratos.",
  collector: "Coleccionista: busca cartas sueltas.",
  investor: "Inversor: cartas caras y cajas.",
  whale: "Gasta mucho: sobres en cantidad y productos premium.",
  seller: "Viene a venderte cartas.",
  lot: "Viene a venderte una colección.",
};
export function wantTxt(c) {
  const w = c.want || {};
  if (w.k === "pack") return "Quiere sobres de " + setName(w.s);
  if (w.k === "prod") {
    const i = pInfo(w.pid);
    return "Busca: " + (i ? i.n : "un producto");
  }
  if (w.k === "sell") return "Quiere venderte una carta";
  if (w.k === "lot") return "Quiere venderte una colección";
  if (w.k === "trade") return "Quiere cambiarte una carta";
  return "Mira la vitrina";
}
export function mCust() {
  const c = G.CUSTC,
    R = c.reg ? RG(c.reg) : null,
    rs = R ? regS(c.reg) : null,
    img = portrait(c.out || mkOutfit(c.type, R));
  const st =
    c.st === "wait"
      ? `Esperando en la cola · paciencia ${Math.round(Math.max(0, 1 - c.wt / c.pat) * 100)} %`
      : c.st === "offer" || c.st === "aside"
        ? `Esperando a que le atiendas (fuera de la fila) · paciencia ${Math.round(Math.max(0, 1 - c.wt / c.pat) * 100)} %`
        : c.st === "browse"
          ? "Mirando productos"
          : c.st === "leave"
            ? c.bought
              ? "Se va contento 🛍️"
              : "Se va"
            : "Entrando";
  return `<div class="ccard"><img src="${img}" alt=""><div style="min-width:0"><h3>${R ? R.n : "Cliente"}</h3>${R ? `<div>${hearts(rs.loy)}</div><div class="mu">${R.d} Visitas: ${rs.visits}.</div>` : `<div class="mu">${TDESC[c.type] || ""}</div>`}</div></div>
  <div class="ccw"><div><b>${wantTxt(c)}</b></div><div class="mu">${st}</div>${rs && (R.t === "kid" || R.t === "whale") && rs.fav ? `<div class="mu">Set favorito: ${setName(rs.fav)}</div>` : ""}${rs && rs.note ? `<div class="mu">📝 ${rs.note}</div>` : ""}</div>
  ${front() === c ? '<div class="btns"><button class="b pri big" data-a="custserve">Atender ahora</button></div>' : ""}${c.st === "offer" ? `<div class="btns" data-fase="I"><button class="b pri big" data-a="offerserve" data-n="${c.id}">Atender ahora</button></div>` : ""}`;
}
