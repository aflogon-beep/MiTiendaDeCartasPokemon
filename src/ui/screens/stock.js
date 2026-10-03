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
      return `<div class="pn stk"><div class="stkh"><div class="mpack" style="--sc:${sd.col}"><i class="stk-q" data-fase="I"><b class="${q ? "" : "z"}">${q}</b></i>${sd.sym ? `<img src="${sd.sym}" alt="" onerror="this.remove()">` : ""}</div><div style="flex:1;min-width:0"><b>${sd.n}</b><div class="mu">${q} en stock${on ? " · en estantería" : q > 0 ? " · ⚠️ sin hueco" : ""}</div></div><div class="step"><button class="b" data-a="shelf" data-k="${s}" data-n="-.25">−</button><b>${fmt(S.shelf[s])}</b><button class="b" data-a="shelf" data-k="${s}" data-n=".25">+</button></div></div>
    <div>${accTag(packAcc(s))}${Math.abs(S.shelf[s] - recPack(s)) > 0.04 ? ` <button class="b mini" data-a="recp" data-k="${s}">🎯 ${fmt(recPack(s))}</button>` : ""}</div>
    <div class="btns"><button class="b pri" data-a="buyp" data-k="${s}" data-n="6"${S.money < p.w * 6 ? " disabled" : ""}>🛒 Comprar 6 · ${fmt(p.w * 6)}</button><button class="b" data-a="open" data-k="${s}" data-n="1"${q < 1 ? " disabled" : ""}>✨ Abrir 1</button></div>
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
export function mUp() {
  const dec = DECOR.map(
    (d) =>
      `<div class="pn"><div class="row"><b>${d.ic} ${d.n}</b>${S.decor[d.k] ? '<span class="up">Colocado ✔</span>' : `<button class="b pri" data-a="decor" data-k="${d.k}"${S.money < d.cost ? " disabled" : ""}>${fmt(d.cost)}</button>`}</div><div class="mu">${d.d}</div></div>`,
  ).join("");
  const stf = STAFF.map(
    (x) =>
      `<div class="pn"><div class="row"><b>${x.ic} ${x.n}</b><button class="b ${S.staff[x.k] ? "on" : "pri"}" data-a="staff" data-k="${x.k}">${S.staff[x.k] ? "Contratado · despedir" : "Contratar"}</button></div><div class="mu">${x.d} Sueldo: ${fmt(x.sal)}/día.</div></div>`,
  ).join("");
  return (
    `<h2>Mejoras</h2>` +
    UPS.map((u) => {
      const lv = S.up[u.k],
        done = lv >= u.max,
        c = u.cost[lv];
      return `<div class="pn"><div class="row"><b>${u.n}${u.max > 1 ? ` (${lv}/${u.max})` : ""}</b>${done ? '<span class="up">Comprada</span>' : `<button class="b pri" data-a="upg" data-k="${u.k}"${S.money < c ? " disabled" : ""}>${fmt(c)}</button>`}</div><div class="mu">${u.d}</div></div>`;
    }).join("") +
    `<h3>Decoración</h3>${dec}<h3>Personal</h3>${stf}<h3>Seguridad</h3><div class="pn row"><span>📹 Cámaras de seguridad<br><span class="mu">Menos robos y el ladrón corre más despacio.</span></span><button class="b pri" data-a="buycams"${S.cams || S.money < 250 ? " disabled" : ""}>${S.cams ? "Instaladas ✔" : "250 €"}</button></div><h3>Ampliación</h3><div class="pn row"><span>🏗️ Comprar el local de al lado (la panadería)</span><button class="b pri" data-a="m" data-k="annex">${S.annex ? "Hecho ✔" : "Ver"}</button></div>`
  );
}
export function packTabs() {
  // Dinero disponible, siempre a la vista mientras compras (baja con cada compra)
  const was = G.stkCash,
    now = performance.now(),
    down = !!was && now - was.t < 4000 && S.money < was.m - 0.004; // solo justo después de comprar
  G.stkCash = { m: S.money, t: now };
  return `<div class="stk-cash${down ? " down" : ""}" data-fase="I">💶 Tienes <b>${fmt(S.money)}</b>${down ? `<i>−${fmt(was.m - S.money)}</i>` : ""}</div>${S.deliv && S.deliv.length ? `<div class="pn">🚚 En camino: ${delivSummary()}</div>` : ""}<div class="row" style="margin-bottom:8px"><span class="mu">Entrega: ${S.express ? "⚡ al momento (+8 %)" : "🚚 furgoneta gratis (tarda unos segundos)"}</span><button class="b" data-a="exptog">Cambiar</button></div><div class="tabs">${[
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
    buys = i.t === "acc" ? [6, 24] : i.t === "box" ? [1, 3] : [1, 4];
  return `<div class="pn"><div class="row"><b>${i.ic} ${i.n}</b><span class="mu">Stock: <b>${q}</b></span></div><div class="row"><span class="mu">Mayorista ${fmt(i.w)} · clientes ~${fmt(i.ref)}${i.packs ? ` · ${i.packs} sobres` : ""}</span><span class="step"><button class="b" data-a="pp" data-k="${pid}" data-n="-${st}">−</button><b>${fmt(pr)}</b><button class="b" data-a="pp" data-k="${pid}" data-n="${st}">+</button></span></div><div>${accTag(prodAcc(pid))}${Math.abs(pr - recProd(pid)) > 0.04 ? ` <button class="b" style="min-height:30px;padding:4px 10px;font-size:13px" data-a="recq" data-k="${pid}">🎯 ${fmt(recProd(pid))}</button>` : ""}</div><div class="btns">${buys.map((n) => `<button class="b" data-a="buyprod" data-k="${pid}" data-n="${n}"${S.money < i.w * n ? " disabled" : ""}>×${n} · ${fmt(i.w * n)}</button>`).join("")}${i.packs ? `<button class="b pri" data-a="openprod" data-k="${pid}"${q < 1 ? " disabled" : ""}>Abrir → ${i.packs} sobres</button>` : ""}</div></div>`;
}
