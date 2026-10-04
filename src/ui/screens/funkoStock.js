// Zona Funko · pantallas: Stock → Funkos (pedir cajas, precios, reponer), ficha de una figura (sus unidades:
// estantería, vitrina, Mis Funkos, protector, vender), nivel de la zona, colección (álbum y encargos) y evento.
import { G, S } from "../../core/state.js";
import { fmt, pct, r05 } from "../../core/util.js";
import { FBYID, FKCOL, FKCOLS, DLX, GRAILS, GOLD } from "../../core/funko/catalog.js";
import {
  FK_LVTXT,
  FK_VNAME,
  FK_XP,
  FK_ALB_PRIZE,
  FK_ACH,
  fkAlbumOf,
  fkBase,
  fkCanOrder,
  fkColOn,
  fkCost,
  fkCount,
  fkEventToday,
  fkFigsOf,
  fkLv,
  fkMk,
  fkOrdUnit,
  fkOut,
  fkPrice,
  fkShelfCap,
  fkUVal,
  fkUnits,
  fkVarOn,
  fkVault,
  fkVitCap,
  fkWaves,
} from "../../core/funko/zone.js";
import { fkName } from "../../core/funko.js";
import { boxHTML, figSVG } from "../funko/fig.js";
import { hero } from "../hero.js";

const CASE = 6;
const where = { a: "📦 Almacén", s: "🏪 Estantería", v: "💎 Vitrina", m: "❤️ Mis Funkos", h: "🛒 En la caja" };
const spark = (h) => {
  if (!h || h.length < 2) return "";
  const mn = Math.min(...h),
    mx = Math.max(...h),
    pts = h
      .map(
        (v, i) =>
          ((i / (h.length - 1)) * 84).toFixed(1) +
          "," +
          (24 - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * 22).toFixed(1),
      )
      .join(" ");
  return `<svg class="spark" viewBox="0 0 84 26"><polyline fill="none" stroke="${h[h.length - 1] >= h[0] ? "#4cc98a" : "#ff7a6b"}" stroke-width="2" points="${pts}"/></svg>`;
};
const chg = (fid, d) => {
  const h = (fkMk(fid) || {}).h || [];
  return h.length > 1 ? h[h.length - 1] / h[Math.max(0, h.length - 1 - d)] - 1 : 0;
};
const cls = (x) => (x >= 0 ? "up" : "down");

/** Cabecera común de Stock (dinero y pestañas), para la pestaña Funkos. */
export function fkStockHead() {
  const del = S.fk.del.reduce((a, o) => a + o.n, 0);
  return `<div class="stk-cash" data-fase="I">💶 Tienes <b>${fmt(S.money)}</b></div>${del ? `<div class="pn">🚚 Mañana llegan <b>${del}</b> Funko${del > 1 ? "s" : ""} en la furgoneta</div>` : ""}`;
}

/** Stock → Funkos. */
export function mFkStock() {
  const lv = fkLv(),
    c = G.fkC && (G.fkC === "esp" || fkColOn(G.fkC)) ? G.fkC : "pk";
  G.fkC = c;
  const a = fkCount("a"),
    s = fkCount("s"),
    v = fkCount("v"),
    xp = S.fk.xp,
    nx = FK_XP[lv];
  const tip =
    !a && !s
      ? "Pide tus primeras cajas: llegan mañana en la furgoneta. Si sale una <b>Chase</b>… ¡a la vitrina!"
      : a && s < fkShelfCap()
        ? "Hay Funkos en el almacén: <b>repón las estanterías</b> para que se vendan."
        : "Los descatalogados suben de precio: a veces conviene <b>guardarlos</b>.";
  const chips = FKCOLS.map((k) =>
    fkColOn(k)
      ? `<button class="b ${c === k ? "on" : ""}" data-a="fkcol" data-k="${k}">${FKCOL[k].n}</button>`
      : `<button class="b" disabled>🔒 ${FKCOL[k].n} · nv. ${FKCOL[k].lv}</button>`,
  )
    .concat(
      lv >= 6
        ? [`<button class="b ${c === "esp" ? "on" : ""}" data-a="fkcol" data-k="esp">⭐ Deluxe y grails</button>`]
        : [],
    )
    .join("");
  const figs =
    c === "esp"
      ? DLX.concat(GRAILS, [GOLD]).filter(fkOut)
      : fkFigsOf(c).filter((f) => fkOut(f) || fkUnits(f.id).length);
  const wv = c === "esp" ? 0 : fkWaves(c);
  return `${fkStockHead()}${hero("emma", "happy", tip, "lila")}
  <div class="pn fkst"><div><b>🏪 ${s}/${fkShelfCap()}</b><small>estanterías</small></div><div><b>💎 ${v}/${fkVitCap()}</b><small>vitrina</small></div><div><b>📦 ${a}</b><small>almacén</small></div><button class="b pri" data-a="fkrestock"${a ? "" : " disabled"}>Reponer</button></div>
  <button class="pn fklvb" data-a="m" data-k="fklv"><span>⭐ ${fkName()} · nivel ${lv}</span><span class="bar"><i style="width:${nx ? Math.min(100, ((xp - FK_XP[lv - 1]) / (nx - FK_XP[lv - 1])) * 100) : 100}%"></i></span><small>${nx ? `${xp} / ${nx} ⭐` : "¡Nivel máximo!"}</small></button>
  <div class="btns"><button class="b" data-a="m" data-k="fkcolec">🧸 Colección y encargos</button>${fkEventToday() ? '<button class="b fk" data-a="m" data-k="fkev">🎪 Evento de hoy</button>' : ""}</div>
  <div class="chips fkchips">${chips}</div>
  ${c !== "esp" ? `<p class="mu">${FKCOL[c].n}: ${wv} de 4 olas publicadas${wv < 4 && S.fk.wd[c] ? ` · la siguiente, el día ${S.fk.wd[c]}` : ""}.</p>` : ""}
  ${figs.map(fkCard).join("") || '<p class="mu">Nada por aquí todavía.</p>'}`;
}

function fkCard(f) {
  const us = fkUnits(f.id),
    n = (at) => us.filter((u) => u.at === at).length,
    vault = fkVault(f),
    why = fkCanOrder(f),
    box = !f.r && !f.dlx && !f.grail && !f.gold,
    cost = fkCost(f) * (box ? CASE : 1),
    mk = fkBase(f.id),
    pp = S.fk.pp[f.id] != null ? S.fk.pp[f.id] : r05(mk * 1.05),
    d7 = chg(f.id, 7);
  const tags = [
    `<span class="chip">#${f.n}${f.w ? " · Ola " + f.w : ""}</span>`,
    f.gold
      ? '<span class="chip ch">El Santo Grial</span>'
      : f.grail
        ? '<span class="chip ch">Grail · 480 uds.</span>'
        : f.dlx
          ? '<span class="chip ex">Deluxe</span>'
          : f.r
            ? '<span class="chip ex">Rara</span>'
            : `<span class="chip ch">✨ Chase 1 de ${fkLv() >= 7 ? 4 : 6}</span>`,
    vault ? '<span class="chip va">🔒 Descatalogado</span>' : "",
  ].join("");
  const sp =
    f.sp && fkVarOn(f.sp) && !vault
      ? `<button class="b" data-a="fkord" data-k="${f.id}" data-n="${f.sp}"${S.money < fkCost(f, f.sp) ? " disabled" : ""}>✨ ${FK_VNAME[f.sp]} · ${fmt(fkCost(f, f.sp))}</button>`
      : "";
  const dia =
    f.dia && fkVarOn("diamond") && !vault
      ? `<button class="b" data-a="fkord" data-k="${f.id}" data-n="diamond"${S.money < fkCost(f, "diamond") ? " disabled" : ""}>💎 Diamond · ${fmt(fkCost(f, "diamond"))}</button>`
      : "";
  return `<div class="pn fkc" style="--fc:${FKCOL[f.c].col}">${boxHTML(f, f.gold ? "gold" : "")}
  <div class="fkc-i"><b class="n">${f.name}</b><div class="chips">${tags}</div>
  <div class="row"><div class="mu">Mercado <b style="color:#fff">${fmt(mk)}</b> <span class="${cls(d7)}">${pct(d7)}</span></div><div class="qty"><b>${us.filter((u) => u.at !== "m").length}</b><i>${n("s")} est. · ${n("v")} vit. · ${n("a")} alm.</i></div></div>
  ${f.grail || f.gold ? "" : `<div class="stepf"><button class="b" data-a="fkpp" data-k="${f.id}" data-n="-0.5">−</button><b>${fmt(pp)}</b><button class="b" data-a="fkpp" data-k="${f.id}" data-n="0.5">+</button><button class="b mini" data-a="fkrec" data-k="${f.id}">🎯</button></div>`}</div>
  <div class="btns" style="grid-column:1/-1"><button class="b pri" data-a="fkord" data-k="${f.id}"${why || S.money < cost ? " disabled" : ""}>${why || (box ? `📦 Caja de ${CASE} · ${fmt(cost)}` : `🛒 Comprar · ${fmt(cost)}`)}</button><button class="b" data-a="fkfig" data-k="${f.id}">Ficha${us.length ? ` (${us.length})` : ""}</button>${sp}${dia}</div></div>`;
}

/** Ficha de una figura: sus unidades y qué hacer con cada una. */
export function mFkFig() {
  const f = FBYID[G.FKF];
  if (!f) return "<p>—</p>";
  const m = fkMk(f.id) || { h: [] },
    us = fkUnits(f.id);
  // Las unidades iguales (variante, estado, protector y sitio) van juntas: «×N»; los botones actúan sobre una
  const groups = [];
  us.forEach((u) => {
    const k = [u.v, u.d, u.p, u.at].join("|"),
      g = groups.find((x) => x.k === k);
    if (g) g.n++;
    else groups.push({ k, u, n: 1 });
  });
  const rows = groups
    .map(({ u, n }) => {
      const val = fkUVal(u);
      const mv = [
        u.at !== "s" && !u.v && !f.dlx && !f.grail && !f.gold ? ["s", "🏪 Estantería"] : null,
        u.at !== "v" ? ["v", "💎 Vitrina"] : null,
        u.at !== "a" ? ["a", "📦 Almacén"] : null,
        u.at !== "m" ? ["m", "❤️ Me la quedo"] : null,
      ].filter(Boolean);
      return `<div class="pn fku"><div class="row"><b>${n > 1 ? `×${n} · ` : ""}${u.v ? FK_VNAME[u.v] : "Normal"}${u.d ? ' · <span class="down">caja dañada</span>' : " · caja perfecta"}${u.p ? " · 🛡️" : ""}</b><span>${where[u.at]}</span></div><div class="mu">Vale ${fmt(val)} · a la venta por ${fmt(fkPrice(u))}</div>${
        u.at === "h"
          ? ""
          : `<div class="btns">${mv.map(([k, t]) => `<button class="b" data-a="fkmv" data-k="${u.i}" data-n="${k}">${t}</button>`).join("")}${u.p ? "" : `<button class="b" data-a="fkprot" data-k="${u.i}"${S.money < 2.5 ? " disabled" : ""}>🛡️ Protector · 2,50 €</button>`}<button class="b fire" data-a="fkwhole" data-k="${u.i}">💰 Vender · ${fmt(val * 0.85)}</button></div>`
      }</div>`;
    })
    .join("");
  return `<div class="fkbig">${boxHTML(f, us[0] ? us[0].v : f.gold ? "gold" : "", "big")}</div><h2 style="text-align:center;margin:4px 0">${f.name}</h2>
  <div class="chips" style="justify-content:center"><span class="chip">${FKCOL[f.c].n} · #${f.n}${f.w ? " · Ola " + f.w : ""}</span>${fkVault(f) ? '<span class="chip va">🔒 Descatalogado</span>' : ""}</div>
  <div class="pn"><div class="row"><span>Valor de mercado</span><b style="font:700 20px var(--fd)">${fmt(fkBase(f.id))}</b></div><div class="row">${spark(m.h)}<span class="mu">7 d <span class="${cls(chg(f.id, 7))}">${pct(chg(f.id, 7))}</span> · 30 d <span class="${cls(chg(f.id, 30))}">${pct(chg(f.id, 30))}</span></span></div></div>
  ${rows || '<p class="mu">No tienes ninguna. Pídela en Stock → Funkos.</p>'}
  <p class="mu">Las cajas dañadas valen un 40 % menos. Con protector, no se dañan. Vender al mayorista paga el 85 %.</p>`;
}

/** Nivel de la zona: qué trae cada nivel. */
export function mFkLv() {
  const lv = fkLv(),
    xp = S.fk.xp;
  return `<h2>⭐ ${fkName()} · nivel ${lv}</h2><p class="mu">Sube vendiendo Funkos, completando el álbum y con encargos. El nivel no baja.</p><div class="bar fkbar"><i style="width:${FK_XP[lv] ? Math.min(100, ((xp - FK_XP[lv - 1]) / (FK_XP[lv] - FK_XP[lv - 1])) * 100) : 100}%"></i></div><p class="mu">${FK_XP[lv] ? `${xp} / ${FK_XP[lv]} ⭐` : "¡Nivel máximo!"}</p>
  ${FK_LVTXT.map((t, i) => `<div class="pn fklv${i < lv ? " on" : ""}"><span class="fklv-n">${i + 1}</span><span>${t}</span><span>${i < lv ? "✔" : "🔒"}</span></div>`).join("")}`;
}

/** Colección: álbum por colección (con premio), Mis Funkos y encargos. */
export function mFkColec() {
  const ords = S.fk.ord;
  const alb = FKCOLS.filter(fkColOn)
    .map((c) => {
      const [h, t] = fkAlbumOf(c),
        done = h >= t;
      return `<div class="pn"><div class="row"><b>${FKCOL[c].n} · ${h} de ${t}</b>${done && !S.fk.albR[c] ? `<button class="b pri mini" data-a="fkalb" data-k="${c}">🎁 Cobrar ${fmt(FK_ALB_PRIZE)}</button>` : S.fk.albR[c] ? "<span>✔</span>" : `<span class="mu">premio ${fmt(FK_ALB_PRIZE)}</span>`}</div><div class="bar fkbar"><i style="width:${(h / t) * 100}%"></i></div><div class="fkalb">${fkFigsOf(
        c,
      )
        .map(
          (f) =>
            `<div class="${S.fk.alb[f.id] ? "" : "miss"}" title="${f.name}">${figSVG(f, S.fk.alb[f.id + "|c"] ? "chase" : "")}</div>`,
        )
        .join("")}</div></div>`;
    })
    .join("");
  const mine = S.fk.u.filter((u) => u.at === "m");
  return `<h2>🧸 Colección</h2>${hero("alvaro", "stars", mine.length ? `¡Ya tenemos <b>${mine.length}</b> Funkos nuestros! Cuando una colección esté completa, hay premio.` : "Los Funkos que nos quedamos (<b>❤️ Me la quedo</b>, en su ficha) van al álbum.", "rosa")}
  <h3>📋 Encargos</h3>${
    ords.length
      ? ords
          .map((o) => {
            const f = FBYID[o.f],
              u = fkOrdUnit(o);
            return `<div class="pn row"><div><b>${o.who} busca ${f.name}${o.v ? " (" + FK_VNAME[o.v] + ")" : ""}</b><div class="mu">Paga ${fmt(o.pay)} · hasta el día ${o.due}</div></div>${u ? `<button class="b pri" data-a="fkdeliv" data-k="${o.id}">📦 Entregar</button>` : '<span class="mu">No la tienes</span>'}</div>`;
          })
          .join("")
      : '<p class="mu">Ahora no hay encargos. Salen al cerrar el día.</p>'
  }
  <h3>📒 Álbum</h3>${alb}
  <h3>🏅 Logros de la zona</h3>${FK_ACH.map((a) => `<div class="pn row${S.fk.ach && S.fk.ach[a.id] ? "" : " mu"}"><div><b>${S.fk.ach && S.fk.ach[a.id] ? "🏅" : "🔒"} ${a.n}</b><div class="mu">${a.d}</div></div><span>${S.fk.ach && S.fk.ach[a.id] ? "✔" : "+" + fmt(a.r)}</span></div>`).join("")}`;
}

/** Evento de hoy: exclusivas limitadas. */
export function mFkEv() {
  const ev = fkEventToday();
  if (!ev) return "<h2>🎪 Eventos</h2><p class='mu'>Hoy no hay evento. Se anuncian en el ticket del día anterior.</p>";
  return `<div class="pn fkconv"><div class="mu">📢 Hoy</div><h3>🎪 ${ev.name}</h3><div class="mu">Exclusivas limitadas · en una semana valen el doble o más</div></div>
  ${ev.list
    .map((e) => {
      const f = FBYID[e.f];
      return `<div class="pn fkc" style="--fc:${FKCOL[f.c].col}">${boxHTML(f, "exc")}<div class="fkc-i"><b class="n">${f.name}</b><div class="chips"><span class="chip ex">Exclusiva</span></div><div class="mu">Precio del evento <b style="color:#fff">${fmt(e.pr)}</b></div><div class="btns" style="grid-template-columns:1fr"><button class="b pri" data-a="fkevbuy" data-k="${f.id}"${e.left < 1 || S.money < e.pr ? " disabled" : ""}>${e.left < 1 ? "Agotada" : `Comprar (quedan ${e.left})`}</button></div></div></div>`;
    })
    .join("")}`;
}

/** ¡Ha salido una Chase! (desde el ticket, cuando llega en una caja). */
export function mFkChase() {
  const ids = (S.summary && S.summary.fk && S.summary.fk.chaseNew) || [],
    us = ids.map((i) => S.fk.u.find((u) => u.i === i)).filter(Boolean);
  if (!us.length) return "<h2>✨ Chase</h2><p class='mu'>Ya la has colocado.</p>";
  return us
    .map((u) => {
      const f = FBYID[u.f];
      return `<div class="fkrev"><h2>✨ ¡HA SALIDO UNA CHASE! ✨</h2><div class="fkbig">${boxHTML(f, "chase", "big")}</div><h3 style="margin:0">${f.name}</h3><div class="val" style="font:700 26px var(--fd)">${fmt(fkUVal(u))} <span class="mu" style="font-size:13px">(la normal: ${fmt(fkBase(f.id))})</span></div><div class="mu">Está en ${where[u.at]}.</div><div class="btns">${u.at !== "v" ? `<button class="b fk" data-a="fkmv" data-k="${u.i}" data-n="v">💎 A la vitrina</button>` : ""}${u.at !== "m" ? `<button class="b" data-a="fkmv" data-k="${u.i}" data-n="m">❤️ Me la quedo</button>` : ""}</div></div>`;
    })
    .join("");
}
