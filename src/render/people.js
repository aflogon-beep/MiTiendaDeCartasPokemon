// Personas: clientes, peatones, perros, reflejos y retratos.
import { BYID } from "../core/cards/sets.js";
import { FRONT_Y } from "../world/layout.js";
import { RAR } from "../core/constants.js";
import { RG } from "../core/regulars.js";
import { S, SETS } from "../core/state.js";
import { SUN } from "./lighting.js";
import { cx, packIcon, pokeball, rr, setCx, timg, txt } from "./canvas.js";
import { front } from "../core/customers/move.js";
import { level, pInfo, tierOf } from "../core/economy.js";
import { mkOutfit } from "../core/customers/outfit.js";
import { FBYID, FKCOL, headCol } from "../core/funko/catalog.js";
export function drawPed(p) {
  const o = p.out;
  o.skin = p.skin;
  o.mv = true;
  o.ph = p.ph;
  o.mood = "neutral";
  o.arm = null;
  o.bag = false;
  o.face = p.cross ? 0 : p.dir;
  o.phone = false;
  if (p.dog) drawDog(p);
  drawPerson(p.x, p.y, o);
  if (S.ev && S.ev.t === "rain") {
    cx.fillStyle = o.shirt;
    cx.beginPath();
    cx.arc(p.x, p.y - 54, 17, Math.PI, 0);
    cx.fill();
    cx.strokeStyle = "#222";
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(p.x, p.y - 54);
    cx.lineTo(p.x, p.y - 30);
    cx.stroke();
  }
}
export function drawHair(o, hy) {
  if (o.hat === "cap") {
    cx.fillStyle = o.hatc || "#d9534f";
    cx.beginPath();
    cx.arc(0, hy - 1.5, 8.7, Math.PI, 0);
    cx.fill();
    rr(-1, hy - 4.5, 12.5, 3, 1.5);
    cx.fill();
    return;
  }
  cx.fillStyle = o.hair;
  if (o.hs === 0) {
    cx.beginPath();
    cx.arc(0, hy - 1.5, 8.6, Math.PI * 1.02, Math.PI * 1.98);
    cx.fill();
    cx.fillRect(-8.6, hy - 2.5, 3, 4);
  } else if (o.hs === 1) {
    cx.beginPath();
    cx.arc(0, hy - 1.5, 8.9, Math.PI, 0);
    cx.fill();
    cx.fillRect(-8.9, hy - 2, 4, 12);
    cx.fillRect(4.9, hy - 2, 4, 12);
  } else if (o.hs === 2) {
    cx.beginPath();
    cx.arc(0, hy - 1.5, 8.6, Math.PI, 0);
    cx.fill();
    cx.beginPath();
    cx.arc(9, hy - 3, 3.6, 0, 7);
    cx.fill();
  } else if (o.hs === 3) {
    cx.fillRect(-8.6, hy - 3, 3, 5);
    cx.fillRect(5.6, hy - 3, 3, 5);
  } else {
    cx.beginPath();
    cx.arc(0, hy - 2, 9, Math.PI, 0);
    cx.fill();
    for (let i = -7; i <= 7; i += 3.5) {
      cx.beginPath();
      cx.arc(i, hy - 8, 2.7, 0, 7);
      cx.fill();
    }
  }
  if (o.hat === "santa") {
    cx.fillStyle = "#d62828";
    cx.beginPath();
    cx.moveTo(-9, hy - 3);
    cx.quadraticCurveTo(0, hy - 19, 13, hy - 12);
    cx.lineTo(8, hy - 3);
    cx.fill();
    cx.fillStyle = "#fff";
    rr(-9.5, hy - 5, 19, 3.6, 1.5);
    cx.fill();
    cx.beginPath();
    cx.arc(13, hy - 12, 2.6, 0, 7);
    cx.fill();
  }
  if (o.hat === "witch") {
    cx.fillStyle = "#3a1f5c";
    cx.beginPath();
    cx.ellipse(0, hy - 5, 13, 3, 0, 0, 7);
    cx.fill();
    cx.beginPath();
    cx.moveTo(-7, hy - 5);
    cx.lineTo(3, hy - 22);
    cx.lineTo(7, hy - 5);
    cx.fill();
    cx.fillStyle = "#ff8a1f";
    cx.fillRect(-6, hy - 8, 13, 2);
  }
}
export function drawPerson(x, y, o) {
  const mv = o.mv,
    ph = o.ph || 0,
    sw = mv ? Math.sin(ph) : 0,
    bob = mv ? -Math.abs(Math.sin(ph)) * 1.5 : 0;
  cx.save();
  cx.translate(x, y);
  cx.scale(o.sc || 1, o.sc || 1);
  cx.fillStyle = `rgba(0,0,0,${SUN.a + 0.06})`;
  cx.beginPath();
  cx.ellipse(SUN.dx * 0.35, 1, 12 + Math.abs(SUN.dx) * 0.3, 4.5, 0, 0, 7);
  cx.fill();
  if (o.acc === "backpack") {
    cx.fillStyle = o.bp || "#c0392b";
    rr(-10, -31 + bob, 20, 17, 4);
    cx.fill();
  }
  cx.fillStyle = o.pants;
  rr(-6, -15, 5, 15 - sw * 2.2, 2);
  cx.fill();
  rr(1, -15, 5, 15 + sw * 2.2, 2);
  cx.fill();
  cx.fillStyle = o.shoes;
  rr(-7.5, -3 - sw * 2.2, 7, 3.5, 1.5);
  cx.fill();
  rr(0.5, -3 + sw * 2.2, 7, 3.5, 1.5);
  cx.fill();
  const aL = sw * 2.4,
    aR = -sw * 2.4;
  cx.fillStyle = o.shirt;
  rr(-13, -30 + bob + aL, 4.5, 13, 2);
  cx.fill();
  if (o.arm === "up" || o.arm === "wave") {
    cx.save();
    cx.translate(10.5, -29 + bob);
    cx.rotate(
      o.arm === "wave"
        ? -2.75 + Math.sin(performance.now() / 90) * 0.45
        : -2.5 + Math.sin(performance.now() / 250) * 0.15,
    );
    cx.fillStyle = o.shirt;
    rr(-2.2, 0, 4.5, 13, 2);
    cx.fill();
    cx.fillStyle = o.skin;
    cx.beginPath();
    cx.arc(0, 14, 2.6, 0, 7);
    cx.fill();
    cx.restore();
  } else if (o.phone) {
    rr(8.5, -30 + bob, 4.5, 8, 2);
    cx.fill();
  } else {
    rr(8.5, -30 + bob + aR, 4.5, 13, 2);
    cx.fill();
    cx.fillStyle = o.skin;
    cx.beginPath();
    cx.arc(10.8, -16 + bob + aR, 2.5, 0, 7);
    cx.fill();
  }
  cx.fillStyle = o.skin;
  cx.beginPath();
  cx.arc(-10.8, -16 + bob + aL, 2.5, 0, 7);
  cx.fill();
  cx.fillStyle = o.shirt;
  rr(-9, -32 + bob, 18, 21, 5);
  cx.fill();
  cx.fillStyle = "rgba(0,0,0,.16)";
  cx.fillRect(-9, -17 + bob, 18, 6);
  cx.fillStyle = "rgba(255,255,255,.12)";
  cx.fillRect(-9, -30 + bob, 4, 13);
  if (o.suit) {
    cx.fillStyle = "#fff";
    cx.beginPath();
    cx.moveTo(-4, -32 + bob);
    cx.lineTo(4, -32 + bob);
    cx.lineTo(0, -23 + bob);
    cx.fill();
    cx.fillStyle = "#c0392b";
    cx.fillRect(-1.3, -30 + bob, 2.6, 9);
  }
  if (o.phone) {
    cx.fillStyle = o.shirt;
    rr(2, -24 + bob, 10, 4, 2);
    cx.fill();
    cx.fillStyle = o.skin;
    cx.beginPath();
    cx.arc(2.5, -22 + bob, 2.4, 0, 7);
    cx.fill();
    cx.fillStyle = "#222";
    rr(-1, -29 + bob, 6, 9, 1.5);
    cx.fill();
    cx.fillStyle = "#9fe3ff";
    cx.fillRect(0, -28 + bob, 4, 6);
  }
  if (o.chain) {
    cx.strokeStyle = "#ffd54a";
    cx.lineWidth = 1.4;
    cx.beginPath();
    cx.arc(0, -31 + bob, 5, 0.25, Math.PI - 0.25);
    cx.stroke();
  }
  if (o.logo) pokeball(0, -23 + bob, 3.2);
  if (o.acc === "backpack") {
    cx.fillStyle = o.bp || "#c0392b";
    cx.fillRect(-9, -31 + bob, 2, 13);
    cx.fillRect(7, -31 + bob, 2, 13);
  }
  if (o.bag) {
    const by = -19 + bob + aR;
    cx.fillStyle = "#fff";
    rr(8, by, 11, 12, 1.5);
    cx.fill();
    cx.strokeStyle = "#9aa";
    cx.lineWidth = 1;
    cx.beginPath();
    cx.arc(13.5, by, 3, Math.PI, 0);
    cx.stroke();
    pokeball(13.5, by + 6.5, 2.6);
  }
  const hy = -40 + bob;
  cx.fillStyle = o.skin;
  cx.beginPath();
  cx.arc(0, hy, 8.2, 0, 7);
  cx.fill();
  if (o.mood === "angry") {
    cx.fillStyle = "rgba(220,40,40,.3)";
    cx.beginPath();
    cx.arc(0, hy, 8.2, 0, 7);
    cx.fill();
  }
  drawHair(o, hy);
  const blink = (performance.now() / 1000 + (o.seed || 0)) % 4 < 0.12;
  cx.fillStyle = "#1a1a1a";
  const ex = (o.face || 0) * 1.4,
    ey = o.phone ? 1.3 : 0;
  if (o.shades) {
    rr(-7 + ex, hy - 2.8, 14, 4.2, 1.5);
    cx.fill();
  } else if (blink) {
    cx.fillRect(-4.5 + ex, hy - 0.5, 3, 1);
    cx.fillRect(1.5 + ex, hy - 0.5, 3, 1);
  } else {
    cx.beginPath();
    cx.arc(-3 + ex, hy + ey, 1.3, 0, 7);
    cx.arc(3 + ex, hy + ey, 1.3, 0, 7);
    cx.fill();
  }
  if (o.glasses && !o.shades) {
    cx.strokeStyle = "#222";
    cx.lineWidth = 1;
    cx.strokeRect(-6, hy - 2.5, 5, 5);
    cx.strokeRect(1, hy - 2.5, 5, 5);
  }
  if (o.mood === "angry") {
    cx.strokeStyle = "#1a1a1a";
    cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(-5.5, hy - 5);
    cx.lineTo(-1.5, hy - 3);
    cx.moveTo(5.5, hy - 5);
    cx.lineTo(1.5, hy - 3);
    cx.stroke();
  }
  cx.strokeStyle = "#5a2a1a";
  cx.lineWidth = 1.2;
  cx.beginPath();
  if (o.mood === "happy") cx.arc(0, hy + 2.4, 2.8, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (o.mood === "sad" || o.mood === "angry") cx.arc(0, hy + 6.2, 2.6, 1.2 * Math.PI, 1.8 * Math.PI);
  else {
    cx.moveTo(-2, hy + 4);
    cx.lineTo(2, hy + 4);
  }
  cx.stroke();
  if (o.mood === "impatient") {
    cx.fillStyle = "#7fd3ff";
    cx.beginPath();
    cx.moveTo(9, hy - 7);
    cx.quadraticCurveTo(12, hy - 1, 9, hy);
    cx.quadraticCurveTo(6, hy - 1, 9, hy - 7);
    cx.fill();
  }
  cx.restore();
}
export function drawPersonAt(x, y, ct, skin, ph, mv, type) {
  drawPerson(x, y, {
    shirt: ct.col,
    pants: "#2c3350",
    shoes: "#141414",
    hair: ct.hair,
    hs: type === "cashier" ? 0 : 1,
    sc: ct.sc || 1,
    skin,
    ph,
    mv,
    mood: "happy",
    hat: type === "cashier" ? "cap" : null,
    hatc: ct.cap || "#e3350d",
    glasses: type === "collector",
    seed: x % 4,
  });
}
export function moodOf(c) {
  if (c.bub && /😠|😤|💸|😕|😢/.test(c.bub)) return /😠|😤/.test(c.bub) ? "angry" : "sad";
  if (c.st === "leave") return c.bought ? "happy" : "neutral";
  if (c.st === "wait") {
    const f = 1 - c.wt / c.pat;
    return f < 0.35 ? "impatient" : f > 0.75 ? "happy" : "neutral";
  }
  return c.st === "browse" ? "happy" : "neutral";
}
export function drawCust(c) {
  const o = c.out || (c.out = mkOutfit(c.type, c.reg ? RG(c.reg) : null));
  o.skin = c.skin;
  o.mv = c.mv;
  o.ph = c.ph;
  o.mood = moodOf(c);
  o.face = c.face || 0;
  o.phone = !!(c.phoneP && c.st === "wait" && c.wt > 2 && front() !== c);
  o.arm = c.st === "browse" ? "up" : c.wave > 0 ? "wave" : null;
  o.bag = !!c.bought && c.st === "leave";
  drawPerson(c.x, c.y, o);
  if (c.hold && c.st !== "leave") {
    if (c.hold.k === "pack") {
      const sd = SETS.find((z) => z.id === c.hold.s);
      if (sd) packIcon(c.x + 8, c.y - 33, sd, 12, 17);
    } else if (c.hold.k === "funko") {
      // Caja de Funko (color de su colección, con ventana)
      const f = FBYID[c.hold.us[0].f];
      cx.fillStyle = f ? FKCOL[f.c].col : "#888";
      rr(c.x + 7, c.y - 36, 13, 18, 2);
      cx.fill();
      cx.fillStyle = "#111";
      cx.fillRect(c.x + 7, c.y - 36, 13, 3);
      cx.fillStyle = "#f4f6fb";
      cx.fillRect(c.x + 9, c.y - 32, 9, 11);
      cx.fillStyle = f ? headCol(f) : "#f2c9a0";
      cx.beginPath();
      cx.arc(c.x + 13.5, c.y - 27, 3.4, 0, 7);
      cx.fill();
    } else if (c.hold.k === "prod") {
      const i = pInfo(c.hold.pid);
      cx.fillStyle = i ? i.col : "#888";
      rr(c.x + 6, c.y - 34, 17, 16, 2);
      cx.fill();
      cx.fillStyle = "#fff8";
      cx.fillRect(c.x + 8, c.y - 32, 13, 3);
    } else {
      const cd = BYID[c.hold.it.c],
        im = cd && timg(cd.img);
      if (im) cx.drawImage(im, c.x + 8, c.y - 34, 13, 18);
      else {
        cx.fillStyle = "#fff";
        rr(c.x + 8, c.y - 34, 13, 18, 2);
        cx.fill();
      }
    }
  }
  if (c.want && c.want.k === "lot" && c.st !== "leave") {
    cx.fillStyle = "#a8763f";
    rr(c.x + 4, c.y - 35, 23, 18, 2);
    cx.fill();
    cx.fillStyle = "#6b4527";
    cx.fillRect(c.x + 4, c.y - 29, 23, 2);
  }
  if (c.want && c.want.k === "sell" && c.st === "wait") {
    cx.fillStyle = "#fff";
    rr(c.x + 8, c.y - 33, 13, 18, 2);
    cx.fill();
    cx.fillStyle = c.deal ? RAR[c.deal.c.r].c : "#888";
    cx.fillRect(c.x + 10, c.y - 31, 9, 8);
  }
  if (c.st === "wait") {
    const f = 1 - c.wt / c.pat;
    cx.fillStyle = "#0007";
    cx.fillRect(c.x - 12, c.y - 62, 24, 4);
    cx.fillStyle = f > 0.5 ? "#4cc98a" : f > 0.25 ? "#f2b705" : "#ff7a6b";
    cx.fillRect(c.x - 12, c.y - 62, 24 * Math.max(0, f), 4);
  }
  if (c.reg) {
    const n = RG(c.reg).n;
    cx.font = "700 10px system-ui,sans-serif";
    const w = cx.measureText(n).width + 10;
    cx.fillStyle = "rgba(0,0,0,.62)";
    rr(c.x - w / 2, c.y - 77, w, 13, 6);
    cx.fill();
    txt(n, c.x, c.y - 67, 10, "#fff", "center");
  }
  let b = c.bub;
  if (!b && front() === c)
    b =
      c.want.k === "sell"
        ? "🃏 ¿Compras?"
        : c.want.k === "lot"
          ? "📦 ¿Un lote?"
          : c.want.k === "trade"
            ? "🔄 ¿Cambiamos?"
            : c.want.k === "fksell"
              ? "🧸 ¿Me compras un Funko?"
              : "💶";
  if (b) {
    cx.font = "700 13px system-ui,sans-serif";
    const w = cx.measureText(b).width + 14;
    cx.fillStyle = "#fff";
    rr(c.x - w / 2, c.y - 100, w, 22, 8);
    cx.fill();
    cx.beginPath();
    cx.moveTo(c.x - 4, c.y - 78);
    cx.lineTo(c.x + 4, c.y - 78);
    cx.lineTo(c.x, c.y - 73);
    cx.fill();
    txt(b, c.x, c.y - 84, 13, "#111", "center");
  }
}
export function reflect(c) {
  if (tierOf(level()) < 2 || c.y > FRONT_Y - 4) return;
  const o = c.out;
  if (!o) return;
  cx.save();
  cx.globalAlpha = 0.1;
  cx.translate(0, 2 * c.y);
  cx.scale(1, -1);
  drawPerson(c.x, c.y, o);
  cx.restore();
}
export function portrait(o) {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 200;
  const g = c.getContext("2d"),
    prev = cx;
  setCx(g);
  try {
    g.scale(3.4, 3.4);
    drawPerson(23.5, 56, Object.assign({}, o, { mv: false, mood: "happy", arm: null, bag: false }));
  } finally {
    setCx(prev);
  }
  return c.toDataURL();
}
export const SKINS = ["#f2c9a0", "#e0a878", "#a9714b", "#7a4a2b"];
export function drawDog(p) {
  const dx = p.x - p.dir * 20,
    dy = p.y + 1,
    ph = p.ph,
    c = p.dogc,
    l = Math.sin(ph * 1.4) * 1.5;
  cx.fillStyle = "rgba(0,0,0,.2)";
  cx.beginPath();
  cx.ellipse(dx, dy, 8, 2.5, 0, 0, 7);
  cx.fill();
  cx.save();
  cx.translate(dx, dy);
  cx.scale(p.dir, 1);
  cx.fillStyle = c;
  cx.fillRect(-6, -4 + l * 0.3, 2, 4);
  cx.fillRect(3, -4 - l * 0.3, 2, 4);
  rr(-7, -10, 13, 7, 3);
  cx.fill();
  cx.beginPath();
  cx.arc(7, -11, 4, 0, 7);
  cx.fill();
  cx.fillRect(9, -10, 3, 2);
  cx.fillStyle = "#222";
  cx.fillRect(7.5, -12.5, 1.3, 1.3);
  cx.strokeStyle = c;
  cx.lineWidth = 1.6;
  cx.beginPath();
  cx.moveTo(-7, -9);
  cx.lineTo(-10, -13 + Math.sin(ph * 3) * 2);
  cx.stroke();
  cx.restore();
  cx.strokeStyle = "#c0392b";
  cx.lineWidth = 0.8;
  cx.beginPath();
  cx.moveTo(dx + p.dir * 9, dy - 12);
  cx.quadraticCurveTo((dx + p.x) / 2, dy - 6, p.x - p.dir * 10, p.y - 16);
  cx.stroke();
}
