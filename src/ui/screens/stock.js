// Pantalla Stock: sobres, producto sellado, accesorios y mejoras.
import { ACC, DECOR, PTYPES, RAR, STAFF, UPS } from "../../core/constants.js";
import { EVC, avgL, eraCfg, poolR, rvAvg } from "../../core/packs.js";
import { G, S, SETS } from "../../core/state.js";
import { accTag } from "../modals.js";
import { delivSummary } from "../../core/delivery.js";
import { fmt } from "../../core/util.js";
import { pInfo, pPrice, pStock, packAcc, prodAcc, recPack, recProd } from "../../core/economy.js";
export function evBreak(sid) {
  const e = eraCfg(sid),
    R = [
      [e.C + " comunes", e.C * avgL(poolR(sid, "C"))],
      [e.U + " poco comunes", e.U * avgL(poolR(sid, "U"))],
    ];
  if (e.rv) R.push(["1 reverse", rvAvg(sid)]);
  e.slot.forEach(([r, p]) =>
    R.push([(p * 100).toFixed(1).replace(".", ",") + " % " + RAR[r].n, p * avgL(poolR(sid, r))]),
  );
  return `<details><summary class="mu">Probabilidades y valor esperado</summary><p class="mu">${e.d}</p><table class="tb">${R.map((x) => `<tr><td>${x[0]}</td><td>${fmt(x[1])}</td></tr>`).join("")}<tr><td><b>Total</b></td><td><b>${fmt(R.reduce((a, x) => a + x[1], 0))}</b></td></tr></table></details>`;
}
export function mPacks() {
  if (G.pTab === "sealed")
    return (
      `<h2>📦 Stock</h2>${packTabs()}<p class="mu">Se venden en el mueble central. Si abres uno, sus sobres pasan a tu stock de sobres.</p>` +
      (SETS.map((sd) => {
        const ids = Object.keys(PTYPES)
          .map((t) => t + ":" + sd.id)
          .filter((pid) => G.pF === "all" || pStock(pid) > 0);
        return ids.length ? `<h3>${sd.n}</h3>` + ids.map(prodRow).join("") : "";
      }).join("") || '<p class="mu">No tienes producto sellado en stock.</p>')
    );
  if (G.pTab === "acc")
    return (
      `<h2>📦 Stock</h2>${packTabs()}<p class="mu">Poco dinero por unidad pero mucho margen. Los compran sobre todo niños y jugadores.</p>` +
      (ACC.filter((a) => G.pF === "all" || pStock("acc:" + a.id) > 0)
        .map((a) => prodRow("acc:" + a.id))
        .join("") || '<p class="mu">No tienes accesorios en stock.</p>')
    );
  const SL = SETS.filter((sd) => G.pF === "all" || (G.pF === "stock" ? S.sealed[sd.id] > 0 : S.slots.includes(sd.id)));
  return (
    `<h2>📦 Stock</h2>${packTabs()}` +
    (SL.length ? "" : '<p class="mu">Nada con este filtro.</p>') +
    SL.map((sd) => {
      const s = sd.id,
        p = S.pack[s],
        q = S.sealed[s],
        on = S.slots.includes(s);
      // Tarjeta del sobre (rediseñada a petición de Alberto; el test 14 no la compara con el original):
      // nombre y si está en estantería · cuántos sobres hay, grande · precio · compra y abrir en una fila
      const stt = !q
        ? on
          ? ["out", "❌ Agotado · la estantería está vacía"]
          : ["off", "Sin sobres"]
        : on
          ? ["on", "🏪 En estantería"]
          : ["warn", "⚠️ Sin hueco en las estanterías"];
      return `<div class="pn stk"><div class="stkh"><div class="mpack" style="--sc:${sd.col}">${sd.sym ? `<img src="${sd.sym}" alt="" onerror="this.remove()">` : ""}</div><div class="stk-info"><b>${sd.n}</b><div class="stk-st ${stt[0]}">${stt[1]}</div></div><div class="stk-qty ${stt[0]}"><b>${q}</b><small>${q === 1 ? "sobre" : "sobres"}</small></div></div>
    <div class="stk-price"><span class="mu">Precio por sobre</span><div class="step"><button class="b" data-a="shelf" data-k="${s}" data-n="-.25">−</button><b>${fmt(S.shelf[s])}</b><button class="b" data-a="shelf" data-k="${s}" data-n=".25">+</button></div></div>
    <div class="stk-acc">${accTag(packAcc(s))}${Math.abs(S.shelf[s] - recPack(s)) > 0.04 ? `<button class="b mini" data-a="recp" data-k="${s}">🎯 ${fmt(recPack(s))}</button>` : ""}</div>
    <div class="stk-btns"><button class="b pri" data-a="buyp" data-k="${s}" data-n="6"${S.money < p.w * 6 ? " disabled" : ""}>🛒 Comprar 6 · ${fmt(p.w * 6)}</button><button class="b" data-a="open" data-k="${s}" data-n="1"${q < 1 ? " disabled" : ""}>✨ Abrir 1</button></div>
    <details><summary class="mu">Detalles y más opciones</summary><div class="mu">Mayorista ${fmt(p.w)} por sobre · los clientes pagan ~${fmt(p.ref)} · valor esperado ${fmt(EVC[s] || 0)}</div><div class="btns">${[
      1, 36,
    ]
      .map((n) => {
        const c = p.w * n * (n >= 36 ? 0.93 : 1);
        return `<button class="b" data-a="buyp" data-k="${s}" data-n="${n}"${S.money < c ? " disabled" : ""}>${n === 36 ? "Caja 36" : "×1"} · ${fmt(c)}</button>`;
      })
      .join(
        "",
      )}<button class="b" data-a="open" data-k="${s}" data-n="10"${q < 1 ? " disabled" : ""}>Abrir 10 (rápido)</button></div>${evBreak(s)}</details></div>`;
    }).join("") +
    `<p class="mu">Abrir sobres tiene azar: de media sale algo menos de lo que cuestan. Se gana más vendiéndolos cerrados o comprando cartas a buen precio.</p>`
  );
}
/**
 * Tarjeta de mejora (rediseño pedido por Alberto): icono, nombre, qué hace y, a la derecha, el precio (botón
 * verde) o el estado («✔ Comprada»). Si no llega el dinero, dice cuánto falta.
 */
function upCard({ ic, n, d, extra = "", done, doneTxt = "✔ Comprada", cost, act, k, side = "" }) {
  const short = cost != null && S.money < cost;
  const right = done
    ? `<span class="upc-ok">${doneTxt}</span>${side}`
    : `<button class="b pri" data-a="${act}"${k ? ` data-k="${k}"` : ""}${short ? " disabled" : ""}>${fmt(cost)}</button>${short ? `<small class="upc-short">Faltan ${fmt(cost - S.money)}</small>` : ""}`;
  return `<div class="pn upc${done ? " done" : ""}"><div class="upc-ic">${ic}</div><div class="upc-b"><b>${n}</b><div class="mu">${d}</div>${extra}</div><div class="upc-r">${right}</div></div>`;
}
const UPIC = { ads: "📣", case: "🗄️", shelf: "🗃️" };
export function mUp() {
  const lvls = (lv, max) =>
    max > 1
      ? `<div class="upc-lv">${Array.from({ length: max }, (_, i) => `<i class="${i < lv ? "on" : ""}"></i>`).join("")}<span class="mu">Nivel ${lv}/${max}</span></div>`
      : "";
  const ups = UPS.map((u) => {
    const lv = S.up[u.k];
    return upCard({
      ic: UPIC[u.k] || "⬆️",
      n: u.n,
      d: u.d,
      extra: lvls(lv, u.max),
      done: lv >= u.max,
      cost: u.cost[lv],
      act: "upg",
      k: u.k,
    });
  }).join("");
  const dec = DECOR.map((d) =>
    upCard({ ic: d.ic, n: d.n, d: d.d, done: S.decor[d.k], doneTxt: "✔ Colocado", cost: d.cost, act: "decor", k: d.k }),
  ).join("");
  const stf = STAFF.map((x) =>
    S.staff[x.k]
      ? upCard({
          ic: x.ic,
          n: x.n,
          d: x.d,
          extra: `<div class="mu">Sueldo: ${fmt(x.sal)}/día</div>`,
          done: true,
          doneTxt: "✔ Contratado",
          side: `<button class="b mini fire" data-a="staff" data-k="${x.k}">Despedir</button>`,
        })
      : `<div class="pn upc"><div class="upc-ic">${x.ic}</div><div class="upc-b"><b>${x.n}</b><div class="mu">${x.d}</div><div class="mu">Sueldo: ${fmt(x.sal)}/día</div></div><div class="upc-r"><button class="b pri" data-a="staff" data-k="${x.k}">Contratar</button></div></div>`,
  ).join("");
  const cams = upCard({
    ic: "📹",
    n: "Cámaras de seguridad",
    d: "Menos robos y el ladrón corre más despacio.",
    done: S.cams,
    doneTxt: "✔ Instaladas",
    cost: 250,
    act: "buycams",
  });
  const annex = S.annex
    ? upCard({
        ic: "🏗️",
        n: "El local de al lado",
        d: "Tu tienda ya ocupa la antigua panadería.",
        done: true,
        doneTxt: "✔ Hecho",
      })
    : `<div class="pn upc"><div class="upc-ic">🏗️</div><div class="upc-b"><b>El local de al lado</b><div class="mu">La panadería vende su local: más estanterías y zona de juego.</div></div><div class="upc-r"><button class="b" data-a="m" data-k="annex">Ver</button></div></div>`;
  return `<h2>🛠️ Mejoras</h2><div class="stk-cash">💶 Tienes <b>${fmt(S.money)}</b></div>
  <h3>⬆️ Tienda</h3>${ups}<h3>🎨 Decoración</h3>${dec}<h3>🧑‍💼 Personal</h3>${stf}<h3>🔒 Seguridad</h3>${cams}<h3>🏗️ Ampliación</h3>${annex}`;
}
export function packTabs() {
  // Dinero disponible, siempre a la vista mientras compras (baja con cada compra)
  const was = G.stkCash,
    now = performance.now(),
    down = !!was && now - was.t < 4000 && S.money < was.m - 0.004; // solo justo después de comprar
  G.stkCash = { m: S.money, t: now };
  // Lo que cuenta el número rojo de «Stock»: estanterías sin sobres
  const out = SETS.filter((sd) => S.slots.includes(sd.id) && S.sealed[sd.id] < 1);
  const outBox = out.length
    ? `<div class="pn stk-out" data-fase="I">⚠️ <b>Estantería${out.length > 1 ? "s" : ""} sin sobres:</b> ${out.map((sd) => sd.n).join(", ")}. Compra más para que no se queden vacías.</div>`
    : "";
  return `${outBox}<div class="stk-cash${down ? " down" : ""}" data-fase="I">💶 Tienes <b>${fmt(S.money)}</b>${down ? `<i>−${fmt(was.m - S.money)}</i>` : ""}</div>${S.deliv && S.deliv.length ? `<div class="pn">🚚 En camino: ${delivSummary()}</div>` : ""}<div class="row" style="margin-bottom:8px"><span class="mu">Entrega: ${S.express ? "⚡ al momento (+8 %)" : "🚚 furgoneta gratis (tarda unos segundos)"}</span><button class="b" data-a="exptog">Cambiar</button></div><div class="tabs">${[
    ["packs", "🎴 Sobres"],
    ["sealed", "🗃️ Sellado"],
    ["acc", "🛡️ Accesorios"],
  ]
    .map(([k, n]) => `<button class="b ${G.pTab === k ? "on" : ""}" data-a="ptab" data-k="${k}">${n}</button>`)
    .join(
      "",
    )}</div><button class="b pri" data-a="recall" style="width:100%;margin:2px 0 8px">🎯 Poner todo a precio recomendado</button><div class="chips">${[
    ["all", "Todos"],
    ["stock", "Con stock"],
  ]
    .concat(G.pTab === "packs" ? [["shelf", "En estanterías"]] : [])
    .map(([k, n]) => `<button class="b ${G.pF === k ? "on" : ""}" data-a="pfilt" data-k="${k}">${n}</button>`)
    .join("")}</div>`;
}
export function prodRow(pid) {
  const i = pInfo(pid);
  if (!i) return "";
  const q = pStock(pid),
    pr = pPrice(pid),
    st = pr >= 20 ? 1 : pr >= 5 ? 0.5 : 0.25,
    buys = i.t === "acc" ? [6, 24] : i.t === "box" ? [1, 3] : [1, 4],
    unit = q === 1 ? "unidad" : "uds.";
  // Tarjeta de producto (mismo formato que la de sobres, rediseño pedido por Alberto)
  return `<div class="pn stk prod"><div class="stkh"><div class="prod-ic" style="--sc:${i.col || "#556"}">${i.ic}</div><div class="stk-info"><b>${i.n}</b><div class="stk-st">Mayorista ${fmt(i.w)} · clientes ~${fmt(i.ref)}${i.packs ? ` · ${i.packs} sobres` : ""}</div></div><div class="stk-qty ${q ? "" : "off"}"><b>${q}</b><small>${unit}</small></div></div>
  <div class="stk-price"><span class="mu">Precio de venta</span><div class="step"><button class="b" data-a="pp" data-k="${pid}" data-n="-${st}">−</button><b>${fmt(pr)}</b><button class="b" data-a="pp" data-k="${pid}" data-n="${st}">+</button></div></div>
  <div class="stk-acc">${accTag(prodAcc(pid))}${Math.abs(pr - recProd(pid)) > 0.04 ? `<button class="b mini" data-a="recq" data-k="${pid}">🎯 ${fmt(recProd(pid))}</button>` : ""}</div>
  <div class="stk-btns${i.packs ? "" : " two"}">${buys.map((n) => `<button class="b pri" data-a="buyprod" data-k="${pid}" data-n="${n}"${S.money < i.w * n ? " disabled" : ""}>🛒 ×${n} · ${fmt(i.w * n)}</button>`).join("")}${i.packs ? `<button class="b" data-a="openprod" data-k="${pid}"${q < 1 ? " disabled" : ""}>✨ Abrir</button>` : ""}</div></div>`;
}
