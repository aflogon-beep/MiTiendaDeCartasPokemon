// Paneles (abrir, cerrar, repintar), caras de carta, gráficas, confeti, inclinación de cartas, zoom y celebraciones de categoría y medalla.
import { $, VIS } from "../render/canvas.js";
import { BYID, setName } from "../core/cards/sets.js";
import { G, S, hasState } from "../core/state.js";
import { MEDALS, medCount } from "../core/medals.js";
import { RAR, TIERS } from "../core/constants.js";
import { bindAlbum, mAlbum } from "./screens/album.js";
import { bindCard, mCard } from "./screens/cardSheet.js";
import { bindInsp, mInsp } from "./inspect.js";
import { clamp, fmt } from "../core/util.js";
import { guideImg } from "./tutorial.js";
import { hud } from "./hud.js";
import { mAnnex, mBank, mCafe, mCole, mMarket, mRival } from "./screens/city.js";
import { mFkLocal, mFkName } from "./screens/funko.js";
import { mBackup, mDiff, mGift, mMkt, mMore, mNotes, mSets, mTips, mTrophy } from "./screens/more.js";
import { mCk, mHag, mLot, mSell, mTOffer, mTrade } from "./checkout.js";
import { mColl } from "./screens/cards.js";
import { mCust } from "./screens/customer.js";
import { mCustom } from "./customize.js";
import { mGames, mHunt, mMG, mMedals, mStory, mTasks } from "./screens/retos.js";
import { mGrading, mountGR, slabHTML } from "./screens/grading.js";
import { mOpen, mountBox, mountPX } from "./packOpening.js";
import { mPacks, mUp } from "./screens/stock.js";
import { mStats } from "./screens/stats.js";
import { mSum } from "./screens/summary.js";
import { navAct } from "./nav.js";
import { pick } from "../core/rng.js";
import { itemVal, price } from "../core/economy.js";
import { rvr } from "../core/cards/prices.js";
import { saveNow } from "../core/save.js";
import { sfx, vibe } from "../audio/sfx.js";
import { shake } from "../render/effects.js";
export function face(c, rv) {
  return `<div class="cf" style="--rc:${RAR[c.r].c}"><div class="fb"><b>${c.name}</b><i>${RAR[c.r].n}</i><span>${setName(c.s)}${c.num ? " · " + c.num : ""}</span></div>${c.img ? `<img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.remove()">` : ""}${rv ? '<u class="rvb">Reverse</u>' : ""}</div>`;
}
export function spark(id) {
  const h = S.prices[id].h.slice(-30),
    mn = Math.min(...h),
    mx = Math.max(...h);
  const pts = h
    .map(
      (v, i) =>
        ((i / (h.length - 1)) * 84).toFixed(1) + "," + (24 - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * 22).toFixed(1),
    )
    .join(" ");
  return `<svg class="spark" viewBox="0 0 84 26"><polyline fill="none" stroke="${h[h.length - 1] >= h[0] ? "#4cc98a" : "#ff7a6b"}" stroke-width="2" points="${pts}"/></svg>`;
}
export const chg = (id, d) => {
  const h = S.prices[id].h;
  return h[h.length - 1] / h[Math.max(0, h.length - 1 - d)] - 1;
};
export const cls = (x) => (x >= 0 ? "up" : "down");
export let prevM = null;
export function openM(t) {
  G.M = t;
  renderM();
  navAct();
}
export function closeM() {
  G.M = null;
  prevM = null;
  setTimeout(navAct);
  $("#ovh").innerHTML = "";
  TILT.el = null;
  saveNow();
  hud();
}
export function renderM() {
  if (!G.M) {
    $("#ovh").innerHTML = "";
    TILT.el = null;
    return;
  }
  if (G.M === "open" && G.openState && G.openState.mode === "seq") {
    prevM = G.M;
    mountPX();
    return;
  }
  if (G.M === "grev") {
    prevM = G.M;
    mountGR();
    return;
  }
  if (G.M === "boxo") {
    prevM = G.M;
    mountBox();
    return;
  }
  if (G.M === "tierup") {
    prevM = G.M;
    mountTier();
    return;
  }
  if (G.M === "medal") {
    prevM = G.M;
    mountMedal();
    return;
  }
  TILT.el = null;
  const old = $("#ovh .sheet"),
    sc = old && prevM === G.M ? old.scrollTop : 0;
  let body = {
    card: mCard,
    notes: mNotes,
    packs: mPacks,
    coll: mColl,
    mkt: mMkt,
    up: mUp,
    open: mOpen,
    sell: mSell,
    sum: mSum,
    sets: mSets,
    album: mAlbum,
    tasks: mTasks,
    more: mMore,
    grading: mGrading,
    backup: mBackup,
    lot: mLot,
    hag: mHag,
    ck: mCk,
    insp: mInsp,
    custc: mCust,
    tips: mTips,
    diff: mDiff,
    trophy: mTrophy,
    toffer: mTOffer,
    stats: mStats,
    bank: mBank,
    cafe: mCafe,
    cole: mCole,
    rival: mRival,
    market: mMarket,
    annex: mAnnex,
    fklocal: mFkLocal,
    fkname: mFkName,
    medals: mMedals,
    gift: mGift,
    custom: mCustom,
    trade: mTrade,
    games: mGames,
    hunt: mHunt,
    mg: mMG,
    story: mStory,
  }[G.M]();
  const isNew = prevM !== G.M;
  {
    const hk = HINT1[G.M];
    if (hk && !(S.seen && (S.seen[G.M] || S.seen.all)) && !(S.tut && S.tut.on))
      body =
        `<div class="hint1"><img src="${guideImg()}" alt=""><div><b>Emma</b><p>${hk}</p></div><div style="display:flex;flex-direction:column;gap:4px"><button class="b pri" data-a="seen" data-k="${G.M}">¡Vale!</button><button class="b mini" data-a="seen" data-k="all" data-mejora>No más</button></div></div>` +
        body;
  }
  const lock =
    G.M === "ck" ||
    G.M === "hag" ||
    G.M === "lot" ||
    G.M === "sell" ||
    G.M === "insp" ||
    G.M === "trade" ||
    G.M === "toffer";
  $("#ovh").innerHTML =
    `<div class="ov${isNew ? " in" : ""}"${lock ? "" : ' data-a="close"'}><div class="sheet${G.M === "open" ? " wide" : ""}${isNew ? " in" : ""}"><div class="grab"></div><button class="xbtn" data-a="close" aria-label="Cerrar">✕</button>${body}<button class="b big" data-a="close">${G.M === "ck" ? "Atender luego" : G.M === "insp" ? "Volver" : G.M === "lot" && !(G.LOT && G.LOT.done) ? "Rechazar y cerrar" : "Cerrar"}</button></div></div>`;
  const nw = $("#ovh .sheet");
  if (nw && sc) nw.scrollTop = sc;
  prevM = G.M;
  if (G.M === "insp") bindInsp();
  if (G.M === "album") bindAlbum();
  if (G.M === "card") bindCard();
}
export const big = (u) => u.replace(/\.png$/, "_hires.png");
export function faceBig(c, rv) {
  return `<div class="cf" style="--rc:${RAR[c.r].c}"><div class="fb"><b>${c.name}</b><i>${RAR[c.r].n}</i><span>${setName(c.s)}${c.num ? " · " + c.num : ""}</span></div>${c.img ? `<img src="${big(c.img)}" alt="${c.name}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${c.img}'}else this.remove()">` : ""}${rv ? '<u class="rvb">Reverse</u>' : ""}</div>`;
}
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const TILT = { el: null, cx: 0.5, cy: 0.5, tx: 0.5, ty: 0.5, pl: 0, g: null, b0: null };
window.addEventListener("deviceorientation", (e) => {
  if (e.gamma != null) TILT.g = { g: e.gamma, b: e.beta, t: performance.now() };
});
export function askGyro() {
  if (askGyro.d) return;
  askGyro.d = 1;
  try {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function")
      DeviceOrientationEvent.requestPermission().catch(() => {});
  } catch (e) {}
}
export function ptTilt(e) {
  if (!TILT.el) return;
  const r = TILT.el.getBoundingClientRect();
  TILT.tx = clamp((e.clientX - r.left) / r.width, 0, 1);
  TILT.ty = clamp((e.clientY - r.top) / r.height, 0, 1);
  TILT.pl = performance.now();
}
(function tiltLoop() {
  const el = TILT.el;
  if (el && el.isConnected) {
    const now = performance.now();
    let tx = 0.5,
      ty = 0.5;
    if (now - TILT.pl < 1500) {
      tx = TILT.tx;
      ty = TILT.ty;
    } else if (TILT.g && now - TILT.g.t < 600) {
      if (TILT.b0 == null) TILT.b0 = TILT.g.b;
      TILT.b0 += (TILT.g.b - TILT.b0) * 0.005;
      tx = clamp(0.5 + TILT.g.g / 32, 0, 1);
      ty = clamp(0.5 + (TILT.g.b - TILT.b0) / 32, 0, 1);
    } else if (!RM) {
      const t = now / 1000;
      tx = 0.5 + 0.24 * Math.sin(t * 1.1);
      ty = 0.5 + 0.15 * Math.cos(t * 0.9);
    }
    TILT.cx += (tx - TILT.cx) * 0.12;
    TILT.cy += (ty - TILT.cy) * 0.12;
    const sp = el.style;
    sp.setProperty("--mx", (TILT.cx * 100).toFixed(1) + "%");
    sp.setProperty("--my", (TILT.cy * 100).toFixed(1) + "%");
    sp.setProperty("--rx", ((0.5 - TILT.cy) * 22).toFixed(2) + "deg");
    sp.setProperty("--ry", ((TILT.cx - 0.5) * 26).toFixed(2) + "deg");
  }
  requestAnimationFrame(tiltLoop);
})();
export function holoOf(c, rv) {
  const t = { R: [0.18, ""], DR: [0.36, ""], IR: [0.4, ""], UR: [0.45, "sp"], SIR: [0.5, "sp"], HR: [0.52, "gold sp"] }[
    c.r
  ] || [0, ""];
  return { ho: Math.max(t[0], rv ? 0.34 : 0), cl: t[1] };
}
export const cardVal = (x) => price(x.c.id) * (x.rv ? rvr(x.c) : 1);
export function hitLv(x) {
  const v = cardVal(x);
  let lv = { DR: 1, IR: 2, UR: 2, SIR: 3, HR: 3 }[x.c.r] || 0;
  if (v >= 5) lv = Math.max(lv, 1);
  if (v >= 25) lv = Math.max(lv, 2);
  if (v >= 90) lv = 3;
  return lv;
}
export function pcHTML(c, rv, back, lv) {
  const h = holoOf(c, rv);
  return `<div class="pc${back ? " back charge" : ""}${back && lv >= 3 ? " l3" : ""}" style="--rc:${RAR[c.r].c};--ho:${h.ho}"><div class="ent"><div class="wob"><div class="inner"><div class="fr">${faceBig(c, rv)}<div class="holo ${h.cl}"></div><div class="glare"></div></div><div class="bk"><div class="pball"></div></div></div></div></div></div>`;
}
export function confetti(lv, col, at) {
  if (RM || (hasState() && S.ui && S.ui.calm)) return;
  const root = at || $("#px") || $("#zv");
  if (!root) return;
  const cv = document.createElement("canvas");
  cv.className = "conf";
  root.appendChild(cv);
  const dpr = Math.min(2, devicePixelRatio || 1),
    W0 = innerWidth,
    H0 = innerHeight;
  cv.width = W0 * dpr;
  cv.height = H0 * dpr;
  const g = cv.getContext("2d");
  g.scale(dpr, dpr);
  const cols = [col, "#ffd54a", "#ffffff", "#7fe3ff", "#ff7ab8"],
    n = lv >= 3 ? 190 : lv === 2 ? 90 : 40,
    P = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.3,
      v = 6 + Math.random() * (lv >= 3 ? 13 : 8);
    P.push({
      x: W0 / 2,
      y: H0 * 0.45,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      c: pick(cols),
    });
  }
  const t0 = performance.now();
  (function f(t) {
    const k = (t - t0) / 1000;
    g.clearRect(0, 0, W0, H0);
    P.forEach((p) => {
      p.vy += 0.25;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.globalAlpha = Math.max(0, 1 - k / 3);
      g.fillStyle = p.c;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    });
    if (k < 3 && cv.isConnected) requestAnimationFrame(f);
    else cv.remove();
  })(t0);
}
export function countUp(el, v, ms) {
  const t0 = performance.now();
  (function f(t) {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = fmt(v * (1 - Math.pow(1 - k, 3)));
    if (k < 1 && el.isConnected) requestAnimationFrame(f);
  })(t0);
}
export function zoom(id, rv, gi) {
  const c = BYID[id];
  if (!c) return;
  // Gradeada: se ve en su funda, como en la ficha (gi = el número de la carta en la colección)
  const it = gi != null && gi !== "" ? S.items.find((x) => String(x.i) === String(gi) && x.gr) : null;
  const old = $("#zv");
  if (old) old.remove();
  const el = document.createElement("div");
  el.id = "zv";
  el.className = "px zv";
  el.style.setProperty("--sc", RAR[c.r].c);
  el.innerHTML = `<div class="pxstage">${it ? `<div class="zslab" data-fase="I">${slabHTML(c, rv, it.gr, false, it)}</div>` : `<div class="cstack">${pcHTML(c, rv, false, 0)}</div>`}</div><div class="pxhint"><div class="cinfo" style="--rc:${RAR[c.r].c}"><div><b style="color:#fff">${c.name}</b> <span class="rchip">${RAR[c.r].n}</span>${rv ? ' <span class="rchip rv">Reverse</span>' : ""}${it ? ` <span class="rchip" data-fase="I">PGS ${it.gr}</span>` : ""}</div><div class="cv">${fmt(it ? itemVal(it) : price(id) * (rv ? rvr(c) : 1))}</div><div class="mu">Mueve el dedo o inclina el móvil · toca para cerrar</div></div></div>`;
  document.body.appendChild(el);
  const prev = TILT.el;
  TILT.el = el.querySelector(".pc, .slab");
  el.addEventListener("pointerdown", () => askGyro());
  el.addEventListener("pointermove", ptTilt);
  el.addEventListener("click", () => {
    el.remove();
    TILT.el = prev && prev.isConnected ? prev : null;
  });
}
export function mountTier() {
  const t = VIS.showTier,
    T = TIERS[t];
  $("#ovh").innerHTML =
    `<div class="px" id="px" style="--sc:#c9a227"><div class="pxstage"><div class="rays on" style="--rc:#ffd54a"></div><div class="tier"><div class="ttl">¡NUEVA CATEGORÍA!</div><div class="tsign ts${t}">${T.n.toUpperCase()}</div><div style="font-family:var(--fd);font-size:20px;color:#fff">${T.sub}</div>
  <div class="tlist">🏗️ Suelo, paredes y cartel nuevos<br>🎨 La interfaz cambia de estilo<br>⭐ Más prestigio para atraer clientes</div><button class="b pri" id="tierok" style="font-size:18px;padding:12px 26px">¡Vamos!</button></div></div></div>`;
  confetti(3, "#ffd54a");
  sfx.hit(3);
  vibe([60, 40, 140]);
  shake(8);
  $("#tierok").onclick = () => {
    VIS.showTier = null;
    closeM();
  };
}
export function accTag(p) {
  const c = p >= 0.7 ? "ok" : p >= 0.4 ? "mid" : "bad",
    t = p >= 0.7 ? "✅ Buen precio" : p >= 0.4 ? "⚠️ Algo caro" : "❌ Muy caro";
  return `<span class="acc ${c}">${t} · lo compraría ~${Math.round(p * 100)} % de los clientes</span>`;
}
export const tipsHTML = (l) =>
  l.length
    ? l.map((t) => `<div class="tip">${t}</div>`).join("")
    : '<div class="tip">👍 Todo en orden. ¡Sigue así!</div>';
export function mountMedal() {
  const m = MEDALS.find((x) => x.id === VIS.showMed);
  if (!m) {
    closeM();
    return;
  }
  $("#ovh").innerHTML =
    `<div class="px" id="px" style="--sc:${m.c}"><div class="pxstage"><div class="rays on" style="--rc:${m.c}"></div><div class="tier"><div class="ttl">¡NUEVA MEDALLA!</div><div class="medal big" style="--mc:${m.c}">${m.e}</div><div class="tsign ts1" style="animation:none;background:${m.c};color:#fff;box-shadow:0 0 30px ${m.c}">${m.n}</div><div class="tlist">${m.d}<br>+${fmt(m.r)} · +2 ⭐ · llevas ${medCount()}/8</div><button class="b pri" id="medok" style="font-size:18px;padding:12px 26px">¡Genial!</button></div></div></div>`;
  confetti(3, m.c);
  sfx.hit(3);
  vibe([60, 40, 140]);
  shake(6);
  $("#medok").onclick = () => {
    VIS.showMed = null;
    closeM();
  };
}
export const HINT1 = {
  packs: "Aquí compras sobres y pones sus precios. ✅ en la etiqueta significa que se venderán bien.",
  coll: "Estas son tus cartas. Toca una para ponerla en la vitrina o venderla.",
  tasks: "Encargos, misiones del día y logros. Cobra aquí las recompensas.",
};
export function svgLine(vals, col) {
  if (vals.length < 2) return '<p class="mu">Juega un par de días para ver la gráfica.</p>';
  const w = 320,
    h = 110,
    p = 6,
    mx = Math.max(...vals),
    mn = Math.min(...vals),
    X = (i) => p + (i * (w - 2 * p)) / (vals.length - 1),
    Y = (v) => h - p - ((v - mn) / (mx - mn || 1)) * (h - 2 * p);
  const d = vals.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img"><path d="${d}L${X(vals.length - 1)} ${h - p}L${X(0)} ${h - p}Z" fill="${col}2a"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${X(vals.length - 1)}" cy="${Y(vals[vals.length - 1])}" r="4" fill="${col}"/></svg>`;
}
export function svgBars(a, b, ca, cb) {
  if (!a.length) return '<p class="mu">Sin datos todavía.</p>';
  const w = 320,
    h = 110,
    p = 4,
    n = a.length,
    mx = Math.max(1, ...a.map((v, i) => v + (b ? b[i] : 0))),
    bw = (w - 2 * p) / n;
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img">${a
    .map((v, i) => {
      const x = p + i * bw + bw * 0.15,
        ww = bw * 0.7,
        ha = (v / mx) * (h - 2 * p),
        hb = b ? (b[i] / mx) * (h - 2 * p) : 0;
      return `<rect x="${x}" y="${h - p - ha}" width="${ww}" height="${ha}" rx="2" fill="${ca}"/>${b ? `<rect x="${x}" y="${h - p - ha - hb}" width="${ww}" height="${hb}" rx="2" fill="${cb}"/>` : ""}`;
    })
    .join("")}</svg>`;
}
