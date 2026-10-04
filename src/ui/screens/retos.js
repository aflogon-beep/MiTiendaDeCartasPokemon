// Retos: tareas, medallas, historia, juegos, búsqueda del tesoro y habituales.
import { ACH, RAR, REGS } from "../../core/constants.js";
import { BYID, setName } from "../../core/cards/sets.js";
import { CHAP, chapProg, story } from "../../core/story.js";
import { G, S } from "../../core/state.js";
import { MEDALS } from "../../core/medals.js";
import { RG, hearts, regS } from "../../core/regulars.js";
import { VIS } from "../../render/canvas.js";
import { achVal } from "../../core/achievements.js";
import { face } from "../modals.js";
import { fmt } from "../../core/util.js";
import { guideImg } from "../tutorial.js";
import { huntDay, mgLeft, power, wname } from "../../core/minigames.js";
import { mkOutfit } from "../../core/customers/outfit.js";
import { ownFor } from "../../core/orders.js";
import { portrait } from "../../render/people.js";
import { price } from "../../core/economy.js";
import { retoTabs } from "../nav.js";
export function mTasks() {
  const tabs = [
    ["ord", "📋 Encargos"],
    ["mis", "✅ Misiones"],
    ["ach", "🏆 Logros"],
    ["reg", "👥 Clientes"],
  ]
    .map(([k, n]) => `<button class="b ${G.tTab === k ? "on" : ""}" data-a="ttab" data-k="${k}">${n}</button>`)
    .join("");
  // Tarjetas de reto (rediseño pedido por Alberto): qué hay que hacer, la recompensa a la vista, la barra de
  // progreso gruesa con el número dentro y, si está lista, «Cobrar» en verde a todo lo ancho
  const bar = (v, g) =>
    `<div class="msn-bar"><i style="width:${Math.min(1, v / g) * 100}%"></i><span>${v} / ${g}</span></div>`;
  let b = "";
  if (G.tTab === "ord")
    b = S.orders.length
      ? S.orders
          .map((o) => {
            const c = BYID[o.c];
            if (!c) return "";
            const own = ownFor(o),
              dl = o.due - S.day;
            return `<div class="pn msn ord${own ? " ready" : ""}"><div class="zoomable ord-c" data-a="zoom" data-k="${c.id}" data-n="0">${face(c, false)}</div><div class="ord-b"><div class="msn-top"><b>${o.who} busca ${c.name}</b></div><div class="mu">${setName(c.s)} · ${RAR[c.r].n} · mercado ${fmt(price(c.id))}</div><div class="ord-tags"><span class="msn-rew">🎁 Paga ${fmt(o.pay)}</span><span class="ord-dl${dl <= 0 ? " last" : ""}">⏳ ${dl <= 0 ? "Último día" : dl === 1 ? "Queda 1 día" : "Quedan " + dl + " días"}</span></div>${own ? `<button class="b pri msn-go" data-a="deliver" data-n="${o.id}">📦 Entregar</button>` : '<div class="mu ord-no">Aún no la tienes: búscala en sobres, lotes o clientes que venden.</div>'}</div></div>`;
          })
          .join("")
      : '<p class="mu">No hay encargos ahora. Irán llegando peticiones de clientes.</p>';
  else if (G.tTab === "mis")
    b =
      S.dm.list
        .map(
          (m, i) =>
            `<div class="pn msn${m.cl ? " claimed" : m.done ? " ready" : ""}"><div class="msn-top"><b>${m.t}</b><span class="msn-rew">🎁 +${fmt(m.r)}</span></div>${m.cl ? '<div class="msn-ok">✔ Cobrada</div>' : m.done ? `<button class="b pri msn-go" data-a="mclaim" data-n="${i}">🎁 Cobrar ${fmt(m.r)}</button>` : bar(Math.floor(m.p), m.g)}</div>`,
        )
        .join("") + '<p class="mu">Las misiones se renuevan cada día.</p>';
  else if (G.tTab === "reg") b = mRegs();
  else
    b = ACH.map((a) => {
      const d = S.ach[a.id],
        v = achVal(a);
      return `<div class="pn msn${d ? " claimed" : " locked"}"><div class="msn-top"><b>${d ? "🏆" : "🔒"} ${a.n}</b><span class="msn-rew">🎁 +${fmt(a.r)}</span></div><div class="mu">${a.d}</div>${d ? '<div class="msn-ok">✔ Conseguido</div>' : bar(Math.min(Math.floor(v), a.g), a.g)}</div>`;
    }).join("");
  return retoTabs("tasks") + `<div class="tabs t4">${tabs}</div>${b}`;
}
export function mRegs() {
  return (
    REGS.map((r) => {
      const s = regS(r.id);
      return `<div class="pn" style="display:flex;gap:10px;align-items:center${s.met ? "" : ";opacity:.6"}">${s.met ? `<img class="rgimg" src="${regImg(r.id)}" alt="">` : '<div style="font-size:34px">❔</div>'}<div style="flex:1;min-width:0"><div class="row"><b>${s.met ? r.n : "Aún no le conoces"}</b><span style="font-size:12px">${s.met ? hearts(s.loy) : ""}</span></div>${s.met ? `<div class="mu">${r.d}${(r.t === "kid" || r.t === "whale") && s.fav ? " Favorito: " + setName(s.fav) + "." : ""} Visitas: ${s.visits}.</div>${s.note ? `<div class="mu">📝 ${s.note}</div>` : ""}` : ""}</div></div>`;
    }).join("") +
    '<p class="mu">Trátales bien (rápido, buen precio, cambio exacto, encargos) y volverán más, aceptarán precios algo más altos, dejarán propina y traerán amigos. Si se enfadan, dejarán de venir.</p>'
  );
}
export function regImg(id) {
  const r = RG(id),
    rs = regS(id);
  if (!rs.out) {
    const o = mkOutfit(r.t, r);
    delete o.hat;
    rs.out = o;
  }
  VIS.pt = VIS.pt || {};
  return VIS.pt[id] || (VIS.pt[id] = portrait(Object.assign({}, rs.out, { skin: r.skin })));
}
export function mMedals() {
  return (
    retoTabs("medals") +
    `<p class="mu">Consigue las 8 medallas de la ciudad. Cada una da dinero y reputación.</p><div class="medgrid">${MEDALS.map(
      (m) => {
        const got = S.med && S.med[m.id],
          v = m.v(),
          p = Math.min(1, v / m.g);
        return `<div class="medc${got ? " got" : ""}"><div class="medal" style="--mc:${m.c}">${got ? m.e : "?"}</div><b>${m.n}</b><span>${m.d}</span>${got ? `<em>¡Conseguida! +${fmt(m.r)}</em>` : `<div class="prog"><i style="width:${p * 100}%"></i></div><span>${m.eur ? fmt(v) : v}${m.pc ? " %" : ""} / ${m.eur ? fmt(m.g) : m.g}${m.pc ? " %" : ""}</span>`}</div>`;
      },
    ).join("")}</div>`
  );
}
export function mGames() {
  return (
    retoTabs("games") +
    `<p class="mu">Premios en ${mgLeft()} partida(s) más hoy (se recargan cada día). Puedes seguir jugando aunque se acaben.</p>
  <div class="menu"><button class="b big" data-a="mgstart" data-k="hl">💰 ¿Más caro o más barato?</button><button class="b big" data-a="mgstart" data-k="who">❓ ¿Quién es ese Pokémon?</button><button class="b big" data-a="mgstart" data-k="duel">⚔️ Duelo de cartas</button><button class="b big" data-a="m" data-k="hunt">⚪ Búsqueda del tesoro</button></div>`
  );
}
export function mHunt() {
  const h = huntDay(),
    got = h.p.filter((q) => q.g).length;
  return `<h2>⚪ Búsqueda del tesoro</h2><div class="pn"><div style="font-size:30px;text-align:center">${h.p.map((q) => (q.g ? "🔴" : "⚪")).join(" ")}</div><p>Hay <b>5 Poké Balls</b> escondidas cada día por la tienda y la calle. Toca cada una para recogerla (+5 €). ¡Si encuentras las 5, ganas un sobre!</p><p class="mu">Pista: aleja la cámara con ⤢ o pellizcando para ver la calle. Llevas ${got}/5.</p></div>`;
}
export function mMG() {
  const m = G.MG;
  if (!m) return "";
  if (m.k === "hl") {
    const card = (c, side) =>
      `<button class="hlc${m.step !== "pick" && price(m.a.id) > price(m.b.id) === (side === "a") ? " win" : ""}" data-a="mghl" data-k="${side}" ${m.step !== "pick" ? "disabled" : ""}>${face(c, false)}<b>${m.step === "pick" ? "?" : fmt(price(c.id))}</b></button>`;
    return `<h2>💰 ¿Cuál vale más?</h2><div class="mu" style="text-align:center">Ronda ${m.round + 1}/5 · aciertos ${m.ok}</div><div class="hl">${card(m.a, "a")}<div class="trx">VS</div>${card(m.b, "b")}</div>
    ${m.step === "pick" ? '<p class="mu" style="text-align:center">Toca la carta que creas que es más cara en Cardmarket</p>' : `<div class="pn" style="text-align:center"><b style="font-family:var(--fd);font-size:20px">${m.last ? "✅ ¡Correcto!" : "❌ ¡Uy, no!"}</b></div><button class="b pri big" data-a="mgnext">${m.round >= 4 ? "Ver resultado" : "Siguiente"}</button>`}`;
  }
  if (m.k === "who") {
    const blur = m.step === "pick" ? Math.max(0, 14 - (performance.now() - m.t0) / 400) : 0;
    return `<h2>❓ ¿Quién es ese Pokémon?</h2><div class="mu" style="text-align:center">Ronda ${m.round + 1}/5 · aciertos ${m.ok}</div><div class="who"><div class="whoimg" id="whoimg" style="background-image:url('${m.c.img}');filter:blur(${blur}px) ${m.step === "pick" ? "saturate(.6)" : ""}"></div></div>
    ${m.step === "pick" ? `<div class="menu">${m.opts.map((o) => `<button class="b big" data-a="mgwho" data-k="${o.replace(/"/g, "")}">${o}</button>`).join("")}</div><p class="mu" style="text-align:center">La imagen se va aclarando: ¡cuanto antes aciertes, mejor!</p>` : `<div class="pn" style="text-align:center"><b style="font-family:var(--fd);font-size:20px">${m.last ? "✅ ¡Es " + wname(m.c.name) + "!" : "❌ Era " + wname(m.c.name)}</b></div><button class="b pri big" data-a="mgnext">${m.round >= 4 ? "Ver resultado" : "Siguiente"}</button>`}`;
  }
  if (m.k === "duel") {
    const R = RG(m.opp);
    if (m.step === "choose") {
      const mine = S.items.filter((i) => !i.res && !i.gq && !i.fkK),
        seen = new Set(),
        top = mine
          .map((i) => BYID[i.c])
          .filter((c) => c && !seen.has(c.id) && seen.add(c.id))
          .sort((a, b) => power(b) - power(a))
          .slice(0, 12);
      return `<h2>⚔️ Duelo contra ${R.e} ${R.n}</h2><p class="mu">Elige 3 cartas. Gana cada ronda la de más poder (PS). Ventaja de tipo: +30 %.</p><div class="tiles">${top.map((c) => `<div class="tile${m.sel.includes(c.id) ? " sel" : ""}" data-a="mgpick" data-k="${c.id}">${face(c, false)}<div class="pt">⚡ ${power(c)}</div></div>`).join("")}</div><button class="b pri big" data-a="mgduel"${m.sel.length < 3 ? " disabled" : ""}>¡Combatir! (${m.sel.length}/3)</button>`;
    }
    const r = m.round,
      mc = BYID[m.sel[r]],
      oc = m.oppC[r],
      mp = m.pw[r][0],
      op = m.pw[r][1];
    return `<h2>⚔️ Ronda ${r + 1}/3</h2><div class="mu" style="text-align:center">Tú ${m.score[0]} – ${m.score[1]} ${R.n}</div><div class="hl"><div class="hlc${mp > op ? " win" : ""}">${face(mc, false)}<b>⚡ ${mp}</b></div><div class="trx">VS</div><div class="hlc${op > mp ? " win" : ""}">${face(oc, false)}<b>⚡ ${op}</b></div></div>
    <div class="pn" style="text-align:center"><b style="font-family:var(--fd);font-size:18px">${mp > op ? "✅ ¡Ganas la ronda!" : mp < op ? "❌ Gana " + R.n : "🤝 Empate"}</b>${m.bonus[r] ? `<div class="mu">${m.bonus[r]}</div>` : ""}</div><button class="b pri big" data-a="mgnext">${r >= 2 ? "Ver resultado" : "Siguiente ronda"}</button>`;
  }
  if (m.k === "end")
    return `<h2>${m.title}</h2><div class="pn" style="text-align:center"><div style="font-size:60px">${m.win ? "🏆" : "🙂"}</div><b style="font-family:var(--fd);font-size:22px">${m.res}</b><div class="mu">${m.rewTxt}</div></div><div class="btns"><button class="b pri big" data-a="mgstart" data-k="${m.again}">Jugar otra vez</button><button class="b big" data-a="m" data-k="games">Otros minijuegos</button></div>`;
}
export function mStory() {
  const st = story(),
    prev = CHAP[st.done],
    cur = CHAP[st.ch],
    p = chapProg();
  const prevBox =
    prev && !st.seenEnd
      ? `<div class="pn"><b>✅ Capítulo completado: ${prev.t}</b><p>${prev.e}</p><div class="up">+${fmt(prev.r)} · +1 ⭐</div></div>`
      : "";
  st.seenEnd = true;
  return (
    retoTabs("story") +
    `<div class="cust"><img src="${guideImg()}" alt="" style="width:60px;height:76px;border-radius:12px;background:#ffe9a8"><div class="sp">${cur ? cur.i : "¡Has completado toda la historia! Eres una leyenda."}</div></div>${prevBox}
  ${cur ? `<div class="pn"><b>Capítulo ${st.ch + 1}/${CHAP.length}: ${cur.t}</b>${p.map((x) => `<div class="row" style="margin-top:6px"><span>${x.n}</span><span>${x.v}/${x.g}</span></div><div class="prog"><i style="width:${(x.v / x.g) * 100}%"></i></div>`).join("")}<div class="mu">Premio: ${fmt(cur.r)}</div></div>` : ""}`
  );
}
