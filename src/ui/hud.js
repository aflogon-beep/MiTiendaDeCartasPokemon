// Barra superior (dinero, nivel, día), botón principal, pista, lista de antes de abrir, insignias y pausa.
import { fitCanvas } from "../render/camera.js";
import { $, VIS } from "../render/canvas.js";
import { CHAP, chapProg, story, storyTick } from "../core/story.js";
import { DAYLEN } from "../core/constants.js";
import { G, S, SETS, hasState } from "../core/state.js";
import { LAY, W } from "../world/layout.js";
import { caseCap, caseItems, level, netWorth, packAcc, repv, sealedCount, tierOf } from "../core/economy.js";
import { claimables } from "../core/achievements.js";
import { custs, front, offers, queue } from "../core/customers/move.js";
import { evLabel } from "../core/events.js";
import { fmt } from "../core/util.js";
import { openM } from "./modals.js";
import { paintNav } from "./nav.js";
import { routeTo } from "../world/nav.js";
import { serveFront } from "./checkout.js";
import { sfx, tone } from "../audio/sfx.js";
import { shake, starsAt } from "../render/effects.js";
import { spawn } from "../core/customers/spawn.js";
import { tipsList } from "../core/tips.js";
export function setPause(v) {
  G.paused = v;
  paintNav();
  hud();
}
export function hud() {
  if (VIS.mShown == null) VIS.mShown = S.money;
  $("#money").innerHTML =
    fmt(VIS.mShown) + `<small>empresa ${Math.round(netWorth()).toLocaleString("es-ES")} €</small>`;
  {
    const rv = repv();
    if (VIS.lastRep != null && rv > VIS.lastRep)
      starsAt(LAY.counter.x + 28, LAY.counter.y - 30, 8 + Math.min(12, (rv - VIS.lastRep) * 4));
    VIS.lastRep = rv;
    const tr = tierOf(level());
    if (S.tierSeen == null) S.tierSeen = tr;
    if (tr > S.tierSeen) {
      S.tierSeen = tr;
      VIS.pendTier = tr;
      starsAt(W / 2, 30, 24);
    }
    if (VIS.pendTier != null && !G.M) {
      VIS.showTier = VIS.pendTier;
      VIS.pendTier = null;
      openM("tierup");
    }
    document.documentElement.dataset.tier = tr;
  }
  {
    const hb = $("#hud b");
    if (hb) hb.textContent = (S.shopName || "").trim() || "Pokémon Card Shop";
  }
  storyBadge();
  storyTick();
  if (!G.M && !front() && VIS.medQ && VIS.medQ.length) {
    VIS.showMed = VIS.medQ.shift();
    openM("medal");
  }
  $("#lv").textContent = `Nivel ${level()} · Día ${S.day} · ⭐ ${repv()}`;
  updBadges();
  offerBtn();
  checklist();
  applyUI();
  $("#clk").style.width = (S.phase === "closed" ? 0 : Math.min(100, (S.clock / DAYLEN) * 100)) + "%";
  const a = $("#act"),
    f = front();
  a.classList.remove("pulse");
  if (G.paused) {
    a.disabled = false;
    a.textContent = "⏸ En pausa · pulsa para continuar";
  } else if (f) {
    a.disabled = false;
    a.classList.add("pulse");
    a.textContent =
      f.want.k === "sell"
        ? "🃏 Atender: quiere vender una carta"
        : f.want.k === "lot"
          ? "📦 Atender: vende un lote"
          : f.want.k === "trade"
            ? "🔄 Atender: quiere cambiar una carta"
            : (S.staff.cashier ? "Cobrando… " : "💶 Cobrar ") + fmt(f.hold.total);
  } else if (S.phase === "closed") {
    a.disabled = false;
    a.textContent = `Abrir la tienda (día ${S.day})`;
  } else {
    a.disabled = true;
    a.textContent = S.phase === "open" ? "Tienda abierta · esperando clientes…" : "Cerrando…";
  }
  let h = "";
  if (S.phase === "closed") {
    if (sealedCount() === 0 && caseItems().length === 0)
      h = "📦 Compra sobres en «Sobres» y ponles precio. Puedes abrirlos para sacar cartas y ponerlas en la vitrina.";
    else {
      const tp = tipsList(null)[0];
      h = tp ? "💡 " + tp : "Todo listo. Ajusta precios, coloca cartas en la vitrina y abre la tienda.";
    }
  } else if (S.phase === "open")
    h =
      "Los clientes hacen cola en la caja: toca «Cobrar» o pulsa sobre el cliente. Cuidado con el aburrimiento de la cola.";
  else h = "No entran más clientes. Atiende a los que quedan.";
  const ev = evLabel();
  $("#hint").textContent =
    (ev ? ev + " " : "") +
    h +
    (S.phase === "closed" ? " Pellizca la tienda para hacer zoom." : "") +
    (G.NOTE ? "  ·  " + G.NOTE : "");
}
/** Ofertas aparte (con cajero): botón «📥 N ofertas esperando» en la tienda. Al tocarlo, atiendes la primera. */
function offerBtn() {
  let b = $("#offb");
  const n = offers().filter((o) => o.st === "offer").length;
  if (!b) {
    if (!n) return;
    b = document.createElement("button");
    b.id = "offb";
    b.dataset.a = "offer";
    b.dataset.fase = "I";
    $("#cvw").appendChild(b);
  }
  b.style.display = n && !G.TITLE && !G.STORY ? "" : "none";
  b.textContent = `📥 ${n} ${n === 1 ? "oferta esperando" : "ofertas esperando"}`;
}
$("#act").addEventListener("click", () => {
  if (G.M) return;
  if (G.paused) {
    setPause(false);
    return;
  }
  const f = front();
  if (f) return serveFront();
  if (S.phase === "closed") {
    sfx.shutter();
    S.phase = "open";
    S.clock = 0;
    G.spawnT = 1;
    S.burst = S.ev && S.ev.t === "launch" ? 3 : 0;
    S.vipDone = false;
    {
      const lq = VIS.lq && VIS.lq.day === S.day && S.ev && S.ev.t === "launch" ? VIS.lq.p : null;
      if (lq) {
        S.burst = 0;
        VIS.lq = null;
        shake(5);
        tone(880, 0, 0.25, "triangle", 0.05);
        tone(1175, 0.12, 0.3, "triangle", 0.05);
        lq.forEach((p, i) =>
          setTimeout(
            () => {
              if (S.phase !== "open") return;
              spawn();
              const c = custs[custs.length - 1];
              if (c) {
                c.x = p.x;
                c.y = p.y;
                if (!c.reg) {
                  c.out = p.out;
                  c.skin = p.skin;
                }
                routeTo(c, c.st === "toq" ? LAY.qx : c.tx, c.st === "toq" ? LAY.qy + queue.length * LAY.qs : c.ty);
              }
            },
            250 + i * 260,
          ),
        );
      }
    }
    S.stats = { inc: 0, cust: 0, lost: 0, bought: 0 };
    hud();
  }
});
export function storyBadge() {
  const el = $("#stb");
  if (!el) return;
  const st = hasState() && !(S.tut && S.tut.on) ? story() : null,
    c = st && CHAP[st.ch];
  if (!c) {
    el.style.display = "none";
    return;
  }
  const p = chapProg(),
    x = p.find((q) => q.v < q.g) || p[0];
  el.style.display = "block";
  el.innerHTML = `📖 <b>${c.t}</b> · ${x.n}: ${x.v}/${x.g}`;
}
export function updBadges() {
  if (!hasState()) return;
  const set = (k, n) => {
    const e = $(`#nav-${k} .nb`);
    if (e) {
      e.textContent = n > 9 ? "9+" : n;
      e.style.display = n ? "flex" : "none";
    }
  };
  set("retos", claimables());
  set("packs", SETS.filter((sd) => S.slots.includes(sd.id) && S.sealed[sd.id] < 1).length);
  const b = $("#bellN");
  if (b) {
    const u = VIS.unread || 0;
    b.textContent = u > 9 ? "9+" : u;
    b.style.display = u ? "flex" : "none";
  }
}
export function checklist() {
  const el = $("#chk");
  if (!el) return;
  const hn = $("#hint");
  if (!hasState() || S.phase !== "closed" || G.M || (S.tut && S.tut.on)) {
    el.innerHTML = "";
    // Con la tienda abierta, el texto de ayuda no aporta nada: se quita y la tienda gana ese espacio
    // (en el tutorial se sigue viendo)
    const open = hasState() && S.phase !== "closed" && !(S.tut && S.tut.on);
    if (hn) hn.style.display = "";
    if (document.documentElement.classList.contains("no-hint") !== open) {
      document.documentElement.classList.toggle("no-hint", open);
      fitCanvas();
    }
    return;
  }
  if (document.documentElement.classList.contains("no-hint")) {
    document.documentElement.classList.remove("no-hint");
    fitCanvas();
  }
  if (hn) hn.style.display = "none";
  const sh = SETS.filter((sd) => S.slots.includes(sd.id)),
    withS = sh.filter((sd) => S.sealed[sd.id] > 0),
    out = sh.length - withS.length,
    ci = caseItems().length,
    cap = caseCap(),
    bad = withS.filter((sd) => packAcc(sd.id) < 0.7).length;
  const C = (cls, t, a) => `<button class="ck ${cls}" ${a}>${t}</button>`;
  el.innerHTML =
    `<span class="mu">Antes de abrir:</span>` +
    (withS.length
      ? C(
          out ? "warn" : "ok",
          out ? `⚠️ ${out} estantería(s) sin sobres` : `✅ Sobres en estanterías`,
          'data-a="m" data-k="packs"',
        )
      : C("bad", "❌ Sin sobres a la venta", 'data-a="m" data-k="packs"')) +
    C(
      ci === 0 ? "bad" : ci < cap / 2 ? "warn" : "ok",
      `${ci === 0 ? "❌" : ci < cap / 2 ? "⚠️" : "✅"} Vitrina ${ci}/${cap}`,
      'data-a="ckcase"',
    ) +
    (withS.length
      ? C(bad ? "warn" : "ok", bad ? `⚠️ ${bad} precio(s) caro(s)` : "✅ Precios bien", 'data-a="m" data-k="packs"')
      : "") +
    (S.deliv && S.deliv.length ? C("warn", "🚚 Pedido en camino", 'data-a="m" data-k="packs"') : "");
}
export function applyUI() {
  const u = (hasState() && S.ui) || {};
  document.documentElement.classList.toggle("ui-big", !!u.big);
  document.documentElement.classList.toggle("ui-calm", !!u.calm);
}
