// Toques en el canvas: pillar al ladrón, cobrar, tesoros, mascota, fichas de cliente y edificios; zoom y arrastre.
import { dirtClean } from "../core/dirt.js";
import { CAT, petSound } from "../render/pets.js";
import { CV } from "../render/canvas.js";
import { CX0, CX1, CY1, TROPHY, XS1 } from "../world/layout.js";
import { G, S, SETS, assignSlots } from "../core/state.js";
import { VIEW, clampView, fitCanvas, zoomAt } from "../render/camera.js";
import { ac, sfx, tone } from "../audio/sfx.js";
import { catchThief } from "../core/theft.js";
import { custs, front } from "../core/customers/move.js";
import { fx, starsAt } from "../render/effects.js";
import { hud } from "./hud.js";
import { huntDay } from "../core/minigames.js";
import { openM } from "./modals.js";
import { pick } from "../core/rng.js";
import { serveFront } from "./checkout.js";
import { toast } from "./toast.js";
import { track } from "../core/missions.js";
import { trophyOn } from "../core/trophies.js";
import { quip } from "./quips.js";
(function () {
  const PT = new Map();
  let pinch = null,
    drag = null,
    moved = false;
  const pos = (e) => {
    const r = CV.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  CV.addEventListener("pointerdown", (e) => {
    ac();
    const p = pos(e);
    PT.set(e.pointerId, p);
    try {
      CV.setPointerCapture(e.pointerId);
    } catch (_) {}
    if (PT.size === 1) {
      drag = { x: p.x, y: p.y, ox: VIEW.ox, oy: VIEW.oy };
      moved = false;
    } else if (PT.size === 2) {
      const [a, b] = [...PT.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: VIEW.s };
      moved = true;
    }
  });
  CV.addEventListener("pointermove", (e) => {
    if (!PT.has(e.pointerId)) return;
    const p = pos(e);
    PT.set(e.pointerId, p);
    if (pinch && PT.size >= 2) {
      const [a, b] = [...PT.values()];
      zoomAt((pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (drag) {
      const dx = p.x - drag.x,
        dy = p.y - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 7) moved = true;
      if (moved) {
        VIEW.ox = drag.ox + dx;
        VIEW.oy = drag.oy + dy;
        clampView();
        VIEW.user = performance.now();
        VIEW.mode = "manual";
      }
    }
  });
  const up = (e) => {
    const p = PT.get(e.pointerId);
    PT.delete(e.pointerId);
    if (PT.size < 2) pinch = null;
    if (PT.size === 1) {
      const q = [...PT.values()][0];
      drag = { x: q.x, y: q.y, ox: VIEW.ox, oy: VIEW.oy };
    }
    if (PT.size === 0) {
      if (!moved && p && e.type === "pointerup") tapWorld((p.x - VIEW.ox) / VIEW.s, (p.y - VIEW.oy) / VIEW.s);
      drag = null;
    }
  };
  CV.addEventListener("pointerup", up);
  CV.addEventListener("pointercancel", up);
  CV.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const p = pos(e);
      zoomAt(VIEW.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12), p.x, p.y);
    },
    { passive: false },
  );
  window.addEventListener("resize", fitCanvas);
})();
export function tapWorld(x, y) {
  {
    const th = custs.find((c) => c.run && !c.caught && Math.hypot(c.x - x, c.y - 14 - y) < 34);
    if (th) {
      catchThief(th);
      return;
    }
  }
  const f = front();
  if (f && Math.hypot(x - f.x, y - (f.y - 20)) < 40) {
    serveFront();
    return;
  }
  if (huntTap(x, y)) return;
  {
    const d = dirtClean(x, y); // recoger lo que haya en el suelo (core/dirt.js)
    if (d) {
      starsAt(d.x, d.y - 6, 6);
      sfx.swish();
      quip("clean");
      return;
    }
  }
  if ((S.pet || "cat") !== "none" && Math.hypot(x - CAT.x, y - (CAT.y - 8)) < 24) {
    petSound();
    return;
  }
  let best = null,
    bd = 26;
  custs.forEach((c) => {
    const d = Math.hypot(x - c.x, y - (c.y - 22));
    if (d < bd) {
      bd = d;
      best = c;
    }
  });
  if (best && !G.M) {
    G.CUSTC = best;
    openM("custc");
    return;
  }
  tapBuilding(x, y);
}
export function huntTap(x, y) {
  const h = huntDay();
  const q = h.p.find((q) => !q.g && Math.hypot(q.x - x, q.y - 4 - y) < 16);
  if (!q) return false;
  q.g = 1;
  S.money += 5;
  fx(q.x, q.y - 14, "+5 €", "#ffd54a");
  starsAt(q.x, q.y - 6, 10);
  sfx.coin();
  tone(1320, 0, 0.12, "triangle", 0.07);
  const left = h.p.filter((z) => !z.g).length;
  if (!left) {
    const sd = pick(SETS);
    if (sd) S.sealed[sd.id]++;
    assignSlots();
    toast(`🎉 ¡Encontraste las 5 Poké Balls! Premio: un sobre de ${sd ? sd.n : ""}`);
    sfx.ach();
    track("mgwin");
  } else toast(`⚪ Poké Ball encontrada · quedan ${left}`);
  hud();
  return true;
}
export function tapBuilding(x, y) {
  if (G.M) return;
  const H = (a, b, c, d) => x >= a && x <= b && y >= c && y <= d;
  let k = null;
  if (trophyOn() && H(TROPHY.x - 6, TROPHY.x + TROPHY.w + 6, TROPHY.y - 74, TROPHY.y + TROPHY.d)) {
    openM("trophy");
    return;
  }
  if (!S.annex && H(-282, -8, 500, 575)) k = "annex";
  else if (H(CX0, -290, 500, 612)) k = "cafe";
  else if (H(-106, 118, 738, 806)) k = "bank";
  else if (H(380, 808, 738, CY1)) k = "market";
  else if (H(816, 1084, 738, 806)) k = "rival";
  else if (H(XS1 + 6, CX1, 738, CY1)) k = "cole";
  else if (H(690, 770, 556, 606)) {
    toast("🚌 Parada de autobús: el bus trae gente nueva al barrio");
    return;
  }
  if (k) {
    S.seenCity = 1;
    openM(k);
  }
}
