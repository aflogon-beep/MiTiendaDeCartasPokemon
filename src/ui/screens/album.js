// Álbum por sets con páginas y premios.
import { $ } from "../../render/canvas.js";
import { ALBR, RAR } from "../../core/constants.js";
import { BYID, BYS, SETDEF, setCol, setName } from "../../core/cards/sets.js";
import { isWish } from "../../core/wish.js";
import { price } from "../../core/economy.js";
import { G, S } from "../../core/state.js";
import { albPct } from "../../core/achievements.js";
import { cardTabs } from "../nav.js";
import { clamp, fmt } from "../../core/util.js";
import { face } from "../modals.js";
import { sfx } from "../../audio/sfx.js";
export function albCards(sid) {
  return (BYS[sid] || []).slice().sort((a, b) => (parseInt(a.num) || 9999) - (parseInt(b.num) || 9999));
}
export function albPages(sid) {
  return 1 + Math.ceil(albCards(sid).length / 9);
}
export function albPageHTML(sid, pg) {
  const sd = SETDEF.find((d) => d.id === sid) || {},
    l = albCards(sid);
  if (pg === 0) {
    const own = l.filter((c) => S.dex[c.id]).length;
    return `<div class="bcover"><div class="bc-in">${sd.sym ? `<img src="${sd.sym}" alt="" onerror="this.remove()">` : '<div class="pball" style="width:74px;margin:0"></div>'}<b>${sd.n || setName(sid)}</b><span>${sd.series || ""} ${sd.year || ""}</span><div class="bc-pc">${own}/${l.length}</div><span>Desliza o pulsa ▶ para pasar página</span></div></div>`;
  }
  const part = l.slice((pg - 1) * 9, pg * 9);
  // Huecos vacíos: al tocarlos se ve qué carta es (lista de deseos); con ⭐ si está en la lista
  const miss = (c) =>
    `<div class="pk miss"><span>${c.num || "?"}</span><button class="pk-w" data-a="wishsel" data-k="${c.id}" aria-label="Carta ${c.num || ""}" data-fase="I">${isWish(c.id) ? "⭐" : ""}</button></div>`;
  return `<div class="bgrid">${part.map((c) => (S.dex[c.id] ? `<div class="pk own" data-a="zoom" data-k="${c.id}" data-n="0">${face(c, false)}</div>` : miss(c))).join("")}${'<div class="pk empty"></div>'.repeat(9 - part.length)}</div>`;
}
/** La carta del hueco tocado, con el botón de la lista de deseos (solo si aún no la tienes). */
function wishPanel() {
  const c = G.wishSel && BYID[G.wishSel];
  if (!c || S.dex[c.id]) return "";
  const w = isWish(c.id),
    n = (S.wish || []).length;
  return `<div class="pn albwish" data-fase="I"><div class="row"><b>Nº ${c.num || "?"} · ${c.name}</b><span>${fmt(price(c.id))}</span></div><div class="mu">${RAR[c.r] ? RAR[c.r].n : ""} · ${setName(c.s)} · Lista de deseos: ${n}</div><div class="btns"><button class="b ${w ? "" : "pri"}" data-a="wishtog" data-k="${c.id}">${w ? "Quitar de deseos" : "⭐ Añadir a deseos"}</button></div></div>`;
}
export function mAlbum() {
  if (!G.albS || !S.sets.includes(G.albS)) G.albS = S.sets[0];
  const sid = G.albS,
    l = albCards(sid),
    own = l.filter((c) => S.dex[c.id]).length,
    pc = l.length ? own / l.length : 0,
    cl = S.albR[sid] || [],
    np = albPages(sid);
  G.albPg = clamp(G.albPg, 0, np - 1);
  const chips = S.sets
    .map(
      (s) =>
        `<button class="b ${s === sid ? "on" : ""}" data-a="albset" data-k="${s}">${setName(s)} · ${Math.round(albPct(s) * 100)} %</button>`,
    )
    .join("");
  const rw = ALBR.map(
    ([t, m], i) =>
      `<button class="b ${!cl.includes(i) && pc >= t ? "pri" : ""}" data-a="albclaim" data-n="${i}"${cl.includes(i) || pc < t ? " disabled" : ""}>${t * 100} % · ${fmt(m)}${cl.includes(i) ? " ✔" : ""}</button>`,
  ).join("");
  return (
    cardTabs("album") +
    `<div class="chips">${chips}</div><div class="pn"><div class="row"><b>${setName(sid)}</b><span>${own}/${l.length} · ${Math.round(pc * 100)} %</span></div><div class="prog"><i style="width:${pc * 100}%"></i></div><div class="btns">${rw}</div></div>
  <div class="binder" id="binder" style="--bc:${setCol(sid)}"><div class="rings"></div><div class="bpage" id="bpage">${albPageHTML(sid, G.albPg)}</div></div>
  <div class="row" style="margin-top:10px"><button class="b" data-a="albprev"${G.albPg <= 0 ? " disabled" : ""}>◀ Anterior</button><span class="mu" id="albpn">${G.albPg === 0 ? "Portada" : "Página " + G.albPg + " de " + (np - 1)}</span><button class="b" data-a="albnext"${G.albPg >= np - 1 ? " disabled" : ""}>Siguiente ▶</button></div>
  ${wishPanel()}<p class="mu">Cuenta cada carta que hayas tenido alguna vez, aunque la hayas vendido. Toca una carta para verla en grande.</p>`
  );
}
export function albTurn(dir) {
  const sid = G.albS,
    np = albPages(sid),
    nx = G.albPg + dir;
  if (nx < 0 || nx >= np) return;
  const b = $("#binder"),
    bp = $("#bpage");
  if (!b || !bp || b.dataset.busy) return;
  b.dataset.busy = 1;
  const oldH = bp.innerHTML,
    newH = albPageHTML(sid, nx);
  G.albPg = nx;
  sfx.page();
  const ov = document.createElement("div");
  ov.className = "bpage bflip " + (dir > 0 ? "fnext" : "fprev");
  if (dir > 0) {
    ov.innerHTML = oldH;
    bp.innerHTML = newH;
  } else ov.innerHTML = newH;
  b.appendChild(ov);
  setTimeout(() => {
    if (dir < 0) bp.innerHTML = newH;
    ov.remove();
    delete b.dataset.busy;
  }, 620);
  const pn = $("#albpn");
  if (pn) pn.textContent = G.albPg === 0 ? "Portada" : "Página " + G.albPg + " de " + (np - 1);
  document.querySelectorAll("[data-a=albprev]").forEach((e) => (e.disabled = G.albPg <= 0));
  document.querySelectorAll("[data-a=albnext]").forEach((e) => (e.disabled = G.albPg >= np - 1));
}
export function bindAlbum() {
  const b = $("#binder");
  if (!b) return;
  let x0 = null;
  b.addEventListener("pointerdown", (e) => {
    x0 = e.clientX;
  });
  b.addEventListener("pointerup", (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 45) {
      b._sw = 1;
      albTurn(dx < 0 ? 1 : -1);
    }
  });
  b.addEventListener(
    "click",
    (e) => {
      if (b._sw) {
        e.stopPropagation();
        e.preventDefault();
        b._sw = 0;
      }
    },
    true,
  );
}
