// Atender en la caja: cobro en efectivo o TPV, regateo, compra de cartas y lotes, intercambios y ofertas por trofeos.
import { BYID, setName } from "../core/cards/sets.js";
import { G, S } from "../core/state.js";
import { RAR } from "../core/constants.js";
import { RG, hearts, regS } from "../core/regulars.js";
import { canHaggle, pay, payWith } from "../core/customers/checkout.js";
import { chg, closeM, cls, face, openM } from "./modals.js";
import { clamp, fmt, pct, r05 } from "../core/util.js";
import { expCost, lotEst, makeLot } from "../core/lots.js";
import { front, leave, offers } from "../core/customers/move.js";
import { itemVal, pInfo, price } from "../core/economy.js";
import { pick } from "../core/rng.js";
import { sfx } from "../audio/sfx.js";
import { FBYID } from "../core/funko/catalog.js";
import { FK_VNAME, fkPrice } from "../core/funko/zone.js";
import { fkBuyDeal } from "../core/funko/sell.js";
import { boxHTML } from "./funko/fig.js";
import { toast } from "./toast.js";
import { hud } from "./hud.js";
export function serveFront() {
  const c = front();
  if (!c || G.M || G.paused) return;
  if (serveDeal(c)) return;
  if (S.staff.cashier) {
    pay(c);
    sfx.chaching();
    return;
  }
  if (canHaggle(c)) openHaggle(c);
  else openCheckout(c);
}
/** Atender una oferta de las que esperan aparte (con cajero): la que se toca o la que lleva más tiempo. */
export function serveOffer(c) {
  c = c || offers().find((o) => o.st === "offer");
  if (!c || G.M || G.paused || c.st !== "offer") return false;
  return serveDeal(c);
}
/** Vender, lote o cambio: abre su panel. Devuelve false si el cliente viene a comprar. */
function serveDeal(c) {
  if (c.want.k === "fksell") {
    G.FKD = c;
    openM("fkdeal");
    return true;
  }
  if (c.want.k === "sell") {
    G.deal = c.deal;
    G.deal.cust = c;
    openM("sell");
    return true;
  }
  if (c.want.k === "lot") {
    makeLot(c);
    openM("lot");
    return true;
  }
  if (c.want.k === "trade") {
    G.TRD = {
      c,
      mine: c.trade.mine,
      give: c.trade.give,
      say: pick(["¡Hola! ¿Me cambias esta carta? 🙏", "Tengo una que te puede gustar…", "¿Hacemos un cambio?"]),
    };
    openM("trade");
    return true;
  }
  return false;
}
export function mSell() {
  const d = G.deal,
    mn = r05(d.val * 0.3),
    mx = r05(d.val * 1.1);
  return `<h2>${d.reg ? RG(d.reg).e + " " + RG(d.reg).n + " quiere venderte" : "Un cliente quiere vender"}</h2><div class="pn" style="display:flex;gap:12px"><div style="width:120px;flex:none">${face(d.c, d.rv)}</div><div style="flex:1"><b>${d.c.name}</b> <span class="mu">${d.k}${d.rv ? " · Reverse" : ""}</span><div class="mu">${RAR[d.c.r].n} · ${setName(d.c.s)}</div><div>Valor de mercado: <b>${fmt(d.val)}</b></div><div>Pide: <b>${fmt(d.ask)}</b></div>${d.msg ? `<div style="margin-top:8px;background:var(--panel2);border-radius:8px;padding:8px">🗣️ ${d.msg}</div>` : ""}</div></div>
  ${!d.chk && d.val >= 2 ? '<div class="pn" style="border-color:#f2b705"><b>🕵️ ¡Ojo!</b> Algunas cartas que te ofrecen son falsas. Pulsa <b>🔍 Examinar</b> antes de pagar.</div>' : ""}${(() => {
    const r = d.ask / d.val,
      tr = chg(d.c.id, 7);
    return `<div class="pn"><div><b>${r <= 0.7 ? "🟢 Chollo" : r <= 0.9 ? "🟡 Precio razonable" : "🔴 Caro para revender"}</b> · pide el ${Math.round(r * 100)} % del valor de mercado</div><div class="mu">Tendencia 7 días: <span class="${cls(tr)}">${pct(tr)}</span>. Para ganar revendiendo, ofrece como mucho ${fmt(r05(d.val * 0.75))} (75 %).${d.val < 1 ? " Es una carta de poco valor: no compensa comprarla." : ""}</div></div>`;
  })()}
  <div class="pn"><div class="row"><span>Tu oferta</span><b id="olab">${fmt(d.offer)}</b></div><input type="range" data-i="offer" min="${mn}" max="${mx}" step="0.05" value="${clamp(d.offer, mn, mx)}"><div class="mu">Si compras por debajo de mercado, luego lo vendes con margen.</div>
  <div class="btns"><button class="b pri" data-a="dealoffer">Ofrecer</button><button class="b" data-a="dealask"${S.money < d.ask ? " disabled" : ""}>Pagar lo que pide (${fmt(d.ask)})</button>${d.counter ? `<button class="b pri" data-a="dealcounter"${S.money < d.counter ? " disabled" : ""}>Cerrar por ${fmt(d.counter)}</button>` : ""}<button class="b" data-a="inspd">🔍 Examinar${d.chk ? " ✔" : ""}</button><button class="b" data-a="dealno">Rechazar</button></div></div>`;
}
/** Alguien viene a venderte un Funko (zona Funko): comprarlo al precio que pide o decir que no. */
export function mFkDeal() {
  const c = G.FKD,
    D = c && c.fkdeal;
  if (!D) return "<p>—</p>";
  const f = FBYID[D.f],
    r = D.ask / D.val;
  return `<h2>🧸 Quieren venderte un Funko</h2><div class="fkbig">${boxHTML(f, D.v, "big", D.d)}</div><h3 style="text-align:center;margin:0">${f.name}${D.v ? " · " + FK_VNAME[D.v] : ""}</h3>
  <div class="pn"><div>Valor de mercado: <b>${fmt(D.val)}</b>${D.d ? ' <span class="down">(caja dañada)</span>' : ""}</div><div>Pide: <b>${fmt(D.ask)}</b> · el ${Math.round(r * 100)} % de lo que vale</div><div class="mu">${r <= 0.75 ? "🟢 Chollo: lo puedes revender con margen" : r <= 0.88 ? "🟡 Precio razonable" : "🔴 Caro para revender"}</div></div>
  <div class="btns"><button class="b pri" data-a="fkdealok"${S.money < D.ask ? " disabled" : ""}>Comprar por ${fmt(D.ask)}</button><button class="b" data-a="fkdealno">No, gracias</button></div>`;
}
export function fkDealEnd(ok) {
  const c = G.FKD;
  if (!c) return closeM();
  if (ok && fkBuyDeal(c.fkdeal)) (sfx.coin(), toast("🧸 Funko comprado: está en el almacén"));
  G.FKD = null;
  closeM();
  leave(c, false);
  hud();
}
export function openCheckout(c) {
  const tc = Math.round(c.hold.total * 100),
    card = Math.random() < (c.type === "whale" ? 0.7 : c.type === "kid" ? 0.12 : c.type === "investor" ? 0.6 : 0.42);
  G.CK = { c, tc, m: card ? "card" : "cash", given: [], typed: "", st: "pay", msg: "" };
  if (card) G.CK.say = pick(["Con tarjeta, porfa 💳", "¿Aceptas tarjeta?", "Pago con el móvil 📱"]);
  else {
    G.CK.paid = payWith(tc);
    G.CK.say = G.CK.paid === tc ? "Te lo doy justo 👌" : pick(["Aquí tienes 💶", "Tome, cóbrese", "¿Tienes cambio?"]);
    sfx.drawer();
  }
  openM("ck");
}
export const denCls = (v) =>
  v >= 500 ? "bill e" + v / 100 : v === 200 ? "coin cb2" : v === 100 ? "coin cb" : v >= 10 ? "coin cg" : "coin cc";
export const denLab = (v) => (v >= 100 ? v / 100 + " €" : v + " c");
export function mCk() {
  const k = G.CK,
    c = k.c,
    h = c.hold;
  const fkItems = (e) =>
    e.us
      .map((u) => `🧸 Funko ${FBYID[u.f].name}${u.v ? " (" + FK_VNAME[u.v] + ")" : ""} · ${fmt(fkPrice(u))}`)
      .join("<br>");
  const items =
    (h.k === "funko"
      ? fkItems(h)
      : h.k === "prod"
        ? `${pInfo(h.pid).ic} ${pInfo(h.pid).n}`
        : h.k === "pack"
          ? `${h.qty} × sobre ${setName(h.s)} · ${fmt(S.shelf[h.s])} c/u`
          : `${BYID[h.it.c].name}${h.it.gr ? " · PGS " + h.it.gr : ""} · carta suelta`) +
    // Lo demás de la cesta (core/customers/decide.js, addExtras)
    (h.x || [])
      .map(
        (e) =>
          `<span data-fase="I"><br>${e.k === "funko" ? fkItems(e) : e.k === "prod" ? `${pInfo(e.pid).ic} ${pInfo(e.pid).n}` : `${e.qty} × sobre ${setName(e.s)} · ${fmt(e.total / e.qty)} c/u`}</span>`,
      )
      .join("");
  const R = c.reg ? RG(c.reg) : null,
    av = R ? R.e : { kid: "🧒", collector: "🧑", investor: "🧑‍💼", whale: "🤑" }[c.type] || "🙂";
  const top = `<div class="cust"><div class="av">${av}</div><div class="sp">${R ? `<b>${R.n}</b> <span style="font-size:11px">${hearts(regS(c.reg).loy)}</span><br>` : ""}${k.say}</div></div><div class="lcd"><span>TOTAL</span><b>${fmt(k.tc / 100)}</b></div><div class="ckitems">${items}</div>`;
  if (k.m === "cash") {
    const due = k.paid - k.tc,
      giv = k.given.reduce((a, b) => a + b, 0),
      df = giv - due;
    const paid = `<div class="pn" style="text-align:center;margin:0"><div class="mu">Te paga con</div><div class="paid"><div class="${denCls(Math.min(k.paid, 10000))}">${fmt(k.paid / 100)}</div></div></div>`;
    if (due === 0)
      return `<h2>Caja</h2><div class="ckwrap">${top}${paid}<button class="b go big" data-a="ckgive">✔ Cobrar · importe exacto</button></div>`;
    return `<h2>Caja</h2><div class="ckwrap">${top}${paid}
      <div class="chg"><div class="pn"><span class="mu">Cambio a devolver</span><b>${fmt(due / 100)}</b></div><div class="pn"><span class="mu">Entregado</span><b class="${df === 0 ? "up" : df > 0 ? "down" : ""}">${fmt(giv / 100)}</b></div></div>
      <div class="tray">${k.given.length ? k.given.map((v, i) => `<button class="${denCls(v)}" data-a="ckrem" data-n="${i}">${denLab(v)}</button>`).join("") : '<span class="mu">Toca billetes y monedas del cajón para dar el cambio. Toca aquí uno para quitarlo.</span>'}</div>
      <div class="drawer">${[
        [5000, 2000, 1000, 500],
        [200, 100, 50, 20],
        [10, 5, 2, 1],
      ]
        .map(
          (r) =>
            `<div class="drow">${r.map((v) => `<button class="${denCls(v)}" data-a="ckadd" data-n="${v}">${denLab(v)}</button>`).join("")}</div>`,
        )
        .join("")}</div>
      <div class="btns"><button class="b" data-a="ckclr"${k.given.length ? "" : " disabled"}>Borrar</button><button class="b go" data-a="ckgive" style="flex:1">✔ Entregar cambio</button></div></div>`;
  }
  const busy = k.st === "tap" || k.st === "ok";
  return `<h2>Caja</h2><div class="ckwrap">${top}<div class="tpv${k.st === "ok" ? " appr" : ""}${k.err ? " shake" : ""}"><div class="tpvscr"><div class="ms">${k.msg || "IMPORTE"}</div><div class="amt">${fmt((+k.typed || 0) / 100)}</div></div>
  ${busy ? `<div class="card3"></div><div class="nfc">${k.st === "ok" ? "✔ Pago aprobado · imprimiendo ticket…" : "📶 Esperando la tarjeta…"}</div>` : `<div class="keys">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((x) => `<button class="key${x === "C" ? " cl" : x === "⌫" ? " bs" : ""}" data-a="ckkey" data-k="${x}">${x}</button>`).join("")}</div><button class="key ok" style="width:100%;margin-top:8px" data-a="ckok">OK</button><div class="nfc">Teclea el total (en céntimos: 735 = 7,35 €) y pulsa OK</div>`}</div></div>`;
}
export function finishCK(recv) {
  const c = G.CK.c;
  G.CK = null;
  closeM();
  pay(c, recv);
  sfx.chaching();
}
export function openHaggle(c) {
  c.hg = true;
  const full = r05(c.hold.base ?? c.hold.total), // solo la carta (sin lo demás de la cesta)
    offer = r05(full * (0.74 + Math.random() * 0.14));
  G.HG = {
    c,
    full,
    offer,
    max: offer + (full - offer) * (0.3 + Math.random() * 0.7),
    x: r05((offer + full) / 2),
    tries: 0,
    msg: `¿Me la dejas en ${fmt(offer)}?`,
  };
  openM("hag");
}
export function mHag() {
  const h = G.HG,
    it = h.c.hold.it,
    cd = BYID[it.c];
  return `<h2>Regateo</h2><div class="pn" style="display:flex;gap:12px"><div style="width:100px;flex:none">${face(cd, it.rv)}</div><div style="flex:1;min-width:0"><b>${cd.name}</b>${it.gr ? ` <span class="mu">PGS ${it.gr}</span>` : ""}<div>En vitrina: <b>${fmt(h.full)}</b></div><div class="mu">Mercado: ${fmt(itemVal(it))}</div><div style="margin-top:8px;background:var(--panel2);border-radius:8px;padding:8px">🗣️ ${h.msg}</div></div></div>
  <div class="pn"><div class="row"><span>Tu contraoferta</span><b id="hglab">${fmt(h.x)}</b></div><input type="range" data-i="hgx" min="${h.offer}" max="${h.full}" step="0.05" value="${h.x}">
  <div class="btns"><button class="b" data-a="hgacc">Aceptar ${fmt(h.offer)}</button><button class="b pri" data-a="hgcnt">Contraofertar</button><button class="b" data-a="hgfix">Precio fijo</button></div></div>`;
}
export function dealHg(v) {
  const c = G.HG.c;
  const h = c.hold;
  h.total = v + (h.total - (h.base ?? h.total)); // la carta, al precio acordado, y lo demás de la cesta
  if (h.base != null) h.base = v;
  G.HG = null;
  openCheckout(c);
}
export function mLot() {
  const L = G.LOT;
  if (L.done) {
    const d = L.v - L.paid,
      top = L.cards
        .slice()
        .sort((a, b) => b.v - a.v)
        .slice(0, 9);
    return `<h2>¡Lote comprado!</h2><div class="pn"><div>Has pagado <b>${fmt(L.paid)}</b> por ${L.n} cartas.</div><div class="est">Valor real: <b>${fmt(L.v)}</b> <span class="${cls(d)}">(${d >= 0 ? "+" : ""}${fmt(d)})</span></div><div class="mu">${d > L.paid * 0.5 ? "¡Menudo chollo! 🤑" : d >= 0 ? "Buen negocio 👍" : "Vaya, te la han colado 😅"}</div></div><h3>Lo mejor del lote</h3><div class="tiles">${top.map((x) => `<div class="tile zoomable" data-a="zoom" data-k="${x.c.id}" data-n="${x.rv ? 1 : 0}">${face(x.c, x.rv)}<div class="pt">${fmt(x.v)}</div></div>`).join("")}</div><p class="mu">Las cartas ya están en tu colección.</p>`;
  }
  const [lo, hi] = lotEst(),
    rv = L.rev.map((i) => L.cards[i]).sort((a, b) => b.v - a.v),
    mn = r05(L.ask * 0.4);
  return `<h2>Lote misterioso</h2><div class="cust"><div class="av">👴</div><div class="sp">Vendo mi colección: ${L.n} cartas. Te la dejo en ${fmt(L.ask)}.</div></div>
  <div class="pn" style="margin-top:10px"><div class="mu">${L.expert ? "Valor exacto (experto)" : L.rev.length ? `Estimación tras revisar ${L.rev.length} cartas` : "Estimación a ojo"}</div><div class="est"><b>${L.expert ? fmt(L.v) : fmt(lo) + " – " + fmt(hi)}</b></div>
  <div class="btns"><button class="b" data-a="lotrev" data-n="10"${L.rev.length >= L.n ? " disabled" : ""}>🔎 Revisar 10 · ${L.free ? "gratis" : fmt(10)}</button><button class="b" data-a="lotrev" data-n="50"${L.rev.length >= L.n ? " disabled" : ""}>🔎 Revisar 50 · ${fmt(35)}</button><button class="b" data-a="lotexp"${L.expert ? " disabled" : ""}>🧐 Experto · ${fmt(expCost())}</button></div>
  ${
    rv.length
      ? `<div class="rev">${rv
          .slice(0, 60)
          .map((x) => `<div class="tile">${face(x.c, x.rv)}<div class="pt">${fmt(x.v)}</div></div>`)
          .join("")}</div>`
      : ""
  }</div>
  ${L.msg ? `<div class="pn">🗣️ ${L.msg}</div>` : ""}
  <div class="pn"><div class="row"><span>Tu oferta</span><b id="lotlab">${fmt(L.offer)}</b></div><input type="range" data-i="lotx" min="${mn}" max="${L.ask}" step="0.05" value="${clamp(L.offer, mn, L.ask)}">
  <div class="btns"><button class="b pri" data-a="lotbuy"${S.money < L.ask ? " disabled" : ""}>Comprar por ${fmt(L.ask)}</button><button class="b" data-a="lotoff">Ofrecer</button>${L.counter ? `<button class="b pri" data-a="lotcnt"${S.money < L.counter ? " disabled" : ""}>Cerrar por ${fmt(L.counter)}</button>` : ""}<button class="b" data-a="lotno">Rechazar</button></div></div>`;
}
export function mTrade() {
  const t = G.TRD,
    R = RG(t.c.reg),
    it = S.items.find((i) => i.i === t.mine),
    gc = BYID[t.give];
  if (!it || !gc) return `<h2>Intercambio</h2><p class="mu">Ya no tienes esa carta.</p>`;
  const mc = BYID[it.c],
    mv = itemVal(it),
    gv = price(gc.id),
    r = gv / Math.max(0.01, mv);
  return `<h2>🔄 ${R.e} ${R.n} quiere cambiar</h2><div class="cust"><div class="av">${R.e}</div><div class="sp">${t.say}</div></div>
  <div class="trd"><div><div class="mu">Tú das</div>${face(mc, it.rv)}<b>${fmt(mv)}</b></div><div class="trx">⇄</div><div><div class="mu">Te llevas</div>${face(gc, false)}<b>${fmt(gv)}</b>${S.dex[gc.id] ? "" : '<em class="nwb">NUEVA</em>'}</div></div>
  <div class="pn" style="margin-top:10px"><b>${r >= 1.15 ? "🟢 ¡Sales ganando!" : r >= 0.85 ? "🟡 Cambio justo" : "🔴 Sales perdiendo"}</b>${S.dex[gc.id] ? "" : `<div class="mu">Es una carta que aún no tienes en el álbum.</div>`}</div>
  <div class="btns"><button class="b pri big" data-a="tradeok">¡Trato hecho!</button><button class="b big" data-a="tradeno">No, gracias</button></div>`;
}
export function mTOffer() {
  const t = G.TOF,
    c = BYID[t.it.c];
  return `<h2>🤩 ¡Quieren tu trofeo!</h2><div class="cust"><div class="av">🧐</div><div class="sp">¡Me encanta tu ${c.name}! Te doy ${fmt(t.price)} por ella.</div></div><div class="trd" style="grid-template-columns:1fr"><div>${face(c, t.it.rv)}<b>Valor de mercado: ${fmt(itemVal(t.it))}</b></div></div><div class="pn"><b>Te ofrecen el ${Math.round((t.price / itemVal(t.it)) * 100)} % de su valor.</b><div class="mu">Es una de tus favoritas: tú decides si la vendes.</div></div><div class="btns"><button class="b go big" data-a="tofok">💰 Vender por ${fmt(t.price)}</button><button class="b big" data-a="tofno">❤️ Me la quedo</button></div>`;
}
