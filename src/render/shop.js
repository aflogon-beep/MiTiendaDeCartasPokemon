// Tienda: suelo, paredes, estanterías, vitrina, caja, muebles, decoración, peanas, trofeos, ampliación, persiana.
import { seatTaken } from "../core/tables.js";
import { AX, FLOOR_T, FRONT_Y, LAY, LUX, TROPHY, W } from "../world/layout.js";
import { BYID } from "../core/cards/sets.js";
import { EMIS } from "./bloom.js";
import { RAR, STYLES, TIERS } from "../core/constants.js";
import { S, SETS, shopName } from "../core/state.js";
import { VIS, box3d, cx, fitS, packIcon, plant, pokeball, rr, star, timg, txt } from "./canvas.js";
import { caseCap, caseItems, itemVal, level, luxItems, pInfo, pStock, tierOf } from "../core/economy.js";
import { clamp, fmt } from "../core/util.js";
import { drawPerson } from "./people.js";
import { mkOutfit } from "../core/customers/outfit.js";
import { nightK } from "./lighting.js";
import { pick, srand } from "../core/rng.js";
import { season } from "../core/events.js";
import { trophies } from "../core/trophies.js";
import { huntDay } from "../core/minigames.js";
export function buildBG(t) {
  const c = document.createElement("canvas");
  c.width = W * 2;
  c.height = FRONT_Y * 2;
  const g = c.getContext("2d");
  g.scale(2, 2);
  const R = srand(11 + t * 7);
  const fy = FLOOR_T;
  if (t === 0) {
    for (let y = fy; y < FRONT_Y; y += 40)
      for (let x = 0; x < W; x += 40) {
        g.fillStyle = ((x + y) / 40) % 2 ? "#bcb6aa" : "#b2ac9f";
        g.fillRect(x, y, 40, 40);
      }
    g.strokeStyle = "rgba(60,50,40,.2)";
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= W; x += 40) {
      g.moveTo(x, fy);
      g.lineTo(x, FRONT_Y);
    }
    for (let y = fy; y <= FRONT_Y; y += 40) {
      g.moveTo(0, y);
      g.lineTo(W, y);
    }
    g.stroke();
    for (let i = 0; i < 16; i++) {
      g.fillStyle = "rgba(90,70,50,.08)";
      g.beginPath();
      g.ellipse(R() * W, fy + R() * (FRONT_Y - fy), 8 + R() * 22, 4 + R() * 10, R() * 3, 0, 7);
      g.fill();
    }
    g.fillStyle = "#d8c7a3";
    g.fillRect(0, 0, W, fy);
    for (let i = 0; i < 10; i++) {
      g.fillStyle = "rgba(120,90,50,.1)";
      g.beginPath();
      g.ellipse(R() * W, R() * fy, 6 + R() * 16, 3 + R() * 8, 0, 0, 7);
      g.fill();
    }
    g.fillStyle = "#8a6a44";
    g.fillRect(0, fy - 6, W, 6);
  } else if (t === 1) {
    for (let y = fy; y < FRONT_Y; y += 18) {
      let x = -R() * 120;
      while (x < W) {
        const w = 80 + R() * 90,
          l = 42 + R() * 12;
        g.fillStyle = `hsl(30,42%,${l}%)`;
        g.fillRect(x, y, w, 18);
        g.fillStyle = "rgba(60,35,15,.35)";
        g.fillRect(x, y, 1.2, 18);
        x += w;
      }
      g.fillStyle = "rgba(60,35,15,.3)";
      g.fillRect(0, y, W, 1);
    }
    g.fillStyle = "#9cc3d9";
    g.fillRect(0, 0, W, 22);
    g.fillStyle = "#eef3f5";
    g.fillRect(0, 22, W, fy - 22);
    g.strokeStyle = "rgba(0,0,0,.08)";
    g.beginPath();
    for (let x = 0; x < W; x += 12) {
      g.moveTo(x, 24);
      g.lineTo(x, fy - 6);
    }
    g.stroke();
    g.fillStyle = "#fff";
    g.fillRect(0, 21, W, 3);
    g.fillStyle = "#f7f7f7";
    g.fillRect(0, fy - 6, W, 6);
  } else if (t === 2) {
    for (let y = fy; y < FRONT_Y; y += 50)
      for (let x = 0; x < W; x += 50) {
        g.fillStyle = ((x + y) / 50) % 2 ? "#ebe5d9" : "#e0d9cb";
        g.fillRect(x, y, 50, 50);
      }
    g.strokeStyle = "rgba(0,0,0,.07)";
    g.beginPath();
    for (let x = 0; x <= W; x += 50) {
      g.moveTo(x, fy);
      g.lineTo(x, FRONT_Y);
    }
    for (let y = fy; y <= FRONT_Y; y += 50) {
      g.moveTo(0, y);
      g.lineTo(W, y);
    }
    g.stroke();
    g.globalAlpha = 0.3;
    g.fillStyle = "#e3350d";
    g.beginPath();
    g.arc(470, 215, 58, Math.PI, 0);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(470, 215, 58, 0, Math.PI);
    g.fill();
    g.fillStyle = "#222";
    g.fillRect(412, 211, 116, 8);
    g.beginPath();
    g.arc(470, 215, 17, 0, 7);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(470, 215, 10, 0, 7);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = "#f4e7c8";
    g.fillRect(0, 0, W, fy);
    for (let y = 6; y < fy - 8; y += 14)
      for (let x = ((y / 14) % 2) * 11; x < W; x += 22) {
        g.fillStyle = "rgba(227,53,13,.18)";
        g.beginPath();
        g.arc(x, y, 2.6, 0, 7);
        g.fill();
      }
    g.fillStyle = "#c0392b";
    g.fillRect(0, fy - 6, W, 6);
  } else {
    g.fillStyle = "#efeee9";
    g.fillRect(0, fy, W, FRONT_Y - fy);
    g.strokeStyle = "rgba(120,120,135,.2)";
    g.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = R() * W,
        y = fy + R() * (FRONT_Y - fy);
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + R() * 80 - 40, y + R() * 40 - 20, x + R() * 120 - 60, y + R() * 50 - 25);
      g.stroke();
    }
    g.strokeStyle = "rgba(0,0,0,.06)";
    g.beginPath();
    for (let x = 0; x <= W; x += 80) {
      g.moveTo(x, fy);
      g.lineTo(x, FRONT_Y);
    }
    for (let y = fy; y <= FRONT_Y; y += 80) {
      g.moveTo(0, y);
      g.lineTo(W, y);
    }
    g.stroke();
    g.fillStyle = "#7a1f2a";
    g.fillRect(332, 300, 44, FRONT_Y - 300);
    g.strokeStyle = "#c9a227";
    g.lineWidth = 2;
    g.strokeRect(334, 302, 40, FRONT_Y - 304);
    g.fillStyle = "#1f2a44";
    g.fillRect(0, 0, W, fy);
    g.fillStyle = "#c9a227";
    g.fillRect(0, 7, W, 1.5);
    g.fillRect(0, fy - 11, W, 1.5);
    g.fillStyle = "#0d1322";
    g.fillRect(0, fy - 6, W, 6);
  }
  g.fillStyle = "rgba(0,0,0,.28)";
  g.fillRect(0, 0, W, 3);
  const sh = g.createLinearGradient(0, fy, 0, fy + 18);
  sh.addColorStop(0, "rgba(0,0,0,.2)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh;
  g.fillRect(0, fy, W, 18);
  g.fillStyle = "rgba(0,0,0,.22)";
  if (!S.annex) g.fillRect(0, fy, 6, FRONT_Y - fy);
  g.fillRect(W - 6, fy, 6, FRONT_Y - fy);
  {
    const st = STYLES[S.style || "clasico"];
    if (st && st.c) {
      g.globalCompositeOperation = "color";
      g.globalAlpha = 0.45;
      g.fillStyle = st.c;
      g.fillRect(0, 0, W, FRONT_Y);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
  }
  return c;
}
export function drawWall() {
  const t = tierOf(level()),
    T = TIERS[t],
    now = performance.now() / 1000;
  [
    [36, "#e3350d"],
    [74, "#3f7fc4"],
    [690, "#f2b705"],
    [728, "#2fa557"],
  ].forEach((p) => {
    cx.fillStyle = t === 3 ? "#c9a227" : "#fff";
    rr(p[0], 7, 28, 26, 3);
    cx.fill();
    cx.fillStyle = p[1];
    cx.fillRect(p[0] + 3, 10, 22, 20);
    pokeball(p[0] + 14, 20, 6);
  });
  const cxm = W / 2;
  // En la historia (escena 7) el nombre aparece de izquierda a derecha, como pintado con brocha
  const signTxt = (f) => {
    const rv = VIS.signReveal;
    if (rv == null || rv >= 1) return f();
    cx.save();
    cx.beginPath();
    cx.rect(cxm - 170, 0, 340 * rv, 48);
    cx.clip();
    f();
    cx.restore();
  };
  if (t === 0) {
    cx.fillStyle = "#6b4527";
    rr(cxm - 112, 9, 224, 27, 4);
    cx.fill();
    cx.fillStyle = "#8a5a33";
    rr(cxm - 108, 11, 216, 23, 3);
    cx.fill();
    signTxt(() => txt(shopName().toUpperCase(), cxm, 28, fitS(shopName(), 16, 200), "#f4e2c0", "center"));
  } else if (t === 1) {
    cx.fillStyle = "#f2b705";
    rr(cxm - 130, 7, 260, 29, 7);
    cx.fill();
    cx.strokeStyle = "#a37a00";
    cx.lineWidth = 2;
    cx.stroke();
    pokeball(cxm - 108, 21, 8);
    signTxt(() => txt(shopName().toUpperCase(), cxm + 10, 27, fitS(shopName(), 15, 210), "#2a2000", "center"));
  } else if (t === 2) {
    cx.fillStyle = "#fff";
    rr(cxm - 140, 5, 280, 33, 6);
    cx.fill();
    cx.fillStyle = "#e3350d";
    rr(cxm - 140, 5, 280, 15, 6);
    cx.fill();
    cx.fillRect(cxm - 140, 12, 280, 8);
    cx.fillStyle = "#222";
    cx.fillRect(cxm - 140, 19, 280, 2);
    pokeball(cxm - 118, 21, 10);
    signTxt(() => txt(shopName().toUpperCase(), cxm + 12, 33, fitS(shopName(), 14, 220), "#1b1f2a", "center"));
  } else {
    cx.fillStyle = "#0b0f1a";
    rr(cxm - 160, 4, 320, 36, 6);
    cx.fill();
    for (let i = 0; i < 32; i++) {
      const on = Math.floor(now * 6 + i) % 4 === 0;
      cx.fillStyle = on ? "#fff6c0" : "#8a6d1a";
      cx.beginPath();
      cx.arc(cxm - 154 + i * 9.9, 7, 1.6, 0, 7);
      cx.arc(cxm - 154 + i * 9.9, 37, 1.6, 0, 7);
      cx.fill();
    }
    const g = cx.createLinearGradient(0, 12, 0, 32);
    g.addColorStop(0, "#fff3b0");
    g.addColorStop(1, "#c9a227");
    cx.save();
    cx.shadowColor = "#ffd54a";
    cx.shadowBlur = 8;
    signTxt(() => txt(shopName().toUpperCase(), cxm, 29, fitS(shopName(), 16, 290), g, "center"));
    cx.restore();
  }
  if (t === 3)
    [180, 620].forEach((x) => {
      cx.fillStyle = "#c9a227";
      cx.fillRect(x - 4, 18, 8, 10);
      cx.fillStyle = "#fff6c0";
      cx.beginPath();
      cx.arc(x, 16, 5, Math.PI, 0);
      cx.fill();
    });
  const D = S.decor;
  if (D.poster)
    [
      [112, "#3f7fc4"],
      [164, "#d65fae"],
      [216, "#2fa557"],
    ].forEach(([x, c]) => {
      cx.fillStyle = "#fff";
      rr(x, 6, 40, 32, 3);
      cx.fill();
      cx.fillStyle = c;
      cx.fillRect(x + 3, 9, 34, 26);
      cx.fillStyle = "#fffa";
      cx.beginPath();
      cx.arc(x + 20, 22, 7, 0, 7);
      cx.fill();
    });
  if (D.neon) {
    cx.save();
    cx.shadowColor = "#ff4fd8";
    cx.shadowBlur = 12;
    txt("★ ABIERTO ★", 612, 28, 13, S.phase === "closed" ? "#8a5a80" : "#ffc4f3", "center");
    cx.restore();
  }
  const se = season();
  if (se === "xmas") {
    cx.strokeStyle = "#1f6b35";
    cx.lineWidth = 4;
    cx.beginPath();
    for (let x = 0; x <= W; x += 40) {
      cx.moveTo(x, 2);
      cx.quadraticCurveTo(x + 20, 12, x + 40, 2);
    }
    cx.stroke();
    for (let x = 10; x < W; x += 20) {
      const c = ["#ff4d4d", "#ffd54a", "#4dd2ff", "#7dff7a"][((x / 20) % 4) | 0],
        on = Math.sin(now * 3 + x) > 0;
      cx.fillStyle = on ? c : "#555";
      cx.beginPath();
      cx.arc(x, 4 + Math.sin(((x % 40) / 40) * Math.PI) * 6, 2.4, 0, 7);
      cx.fill();
    }
  }
  if (se === "hallo") {
    cx.strokeStyle = "rgba(255,255,255,.55)";
    cx.lineWidth = 0.8;
    [
      [8, FLOOR_T, 1],
      [W - 8, FLOOR_T, -1],
    ].forEach(([x, y, s]) => {
      cx.beginPath();
      for (let a = 0; a < 5; a++) {
        cx.moveTo(x, y - 40);
        cx.lineTo(x + s * (a * 9), y - 40 + (4 - a) * 9);
      }
      for (let r = 8; r < 40; r += 9) {
        cx.moveTo(x, y - 40 + r);
        cx.quadraticCurveTo(x + s * r * 0.5, y - 40 + r * 0.6, x + s * r, y - 40);
      }
      cx.stroke();
    });
    for (let x = 10; x < W; x += 24) {
      cx.fillStyle = ((x / 24) | 0) % 2 ? "#ff8a1f" : "#9b4dff";
      cx.beginPath();
      cx.arc(x, 5, 2.4, 0, 7);
      cx.fill();
    }
  }
}
export function drawShelf(i) {
  const s = LAY.shelf(i),
    id = S.slots[i],
    sd = id && SETS.find((d) => d.id === id),
    t = tierOf(level());
  const top = ["#8a5a33", "#b88b5c", "#f2efe8", "#2a2f3a"][t],
    fr = ["#5c3b20", "#8a5f38", "#d9d3c7", "#161a22"][t];
  const d = 26,
    h = 58,
    y0 = s.y + s.h - d,
    ft = s.y + s.h - h;
  box3d(s.x - 4, y0, s.w + 8, d, h, top, fr);
  cx.fillStyle = "#241609";
  cx.fillRect(s.x, ft + 6, s.w, h - 10);
  cx.fillStyle = "rgba(255,255,255,.08)";
  cx.fillRect(s.x, ft + 6, s.w, 3);
  cx.fillStyle = top;
  cx.fillRect(s.x, ft + 29, s.w, 3);
  if (!sd) {
    if (VIS.story) return; // en la historia, sin etiquetas: tapan el cartel
    cx.fillStyle = "rgba(255,255,255,.18)";
    rr(s.x + 6, y0 - h + 4, s.w - 12, 15, 4);
    cx.fill();
    txt("Estantería libre", s.x + s.w / 2, y0 - h + 15, 10, "#fff", "center");
    return;
  }
  cx.fillStyle = sd.col;
  rr(s.x + 4, y0 - h + 3, s.w - 8, 16, 4);
  cx.fill();
  txt(sd.n.length > 22 ? sd.n.slice(0, 21) + "…" : sd.n, s.x + s.w / 2, y0 - h + 15, 10, "#fff", "center");
  {
    const ref = S.pack[id] && S.pack[id].ref,
      nuevo = sd.date && Date.now() - new Date(String(sd.date).replace(/\//g, "-")).getTime() < 200 * 864e5;
    if (ref && S.shelf[id] < ref * 0.95) {
      cx.fillStyle = "#e3350d";
      rr(s.x + s.w - 40, y0 - h - 9, 42, 13, 3);
      cx.fill();
      txt("OFERTA", s.x + s.w - 19, y0 - h + 1, 8, "#fff", "center");
    } else if (nuevo) {
      cx.fillStyle = "#f2b705";
      rr(s.x + s.w - 44, y0 - h - 9, 46, 13, 3);
      cx.fill();
      txt("¡NUEVO!", s.x + s.w - 21, y0 - h + 1, 8, "#2a2000", "center");
    }
  }
  const q = S.sealed[id];
  for (let k = 0; k < Math.min(q, 14); k++) packIcon(s.x + 6 + (k % 7) * 20, k < 7 ? ft + 8 : ft + 33, sd);
  if (q < 1) {
    cx.fillStyle = "rgba(0,0,0,.5)";
    cx.fillRect(s.x, ft + 6, s.w, h - 10);
    txt("AGOTADO", s.x + s.w / 2, ft + 34, 12, "#fff", "center");
  }
  cx.fillStyle = "#fff";
  rr(s.x + s.w / 2 - 40, s.y + s.h + 3, 80, 14, 4);
  cx.fill();
  txt(`${q} · ${fmt(S.shelf[id])}`, s.x + s.w / 2, s.y + s.h + 13, 10, q ? "#1b1f2a" : "#c0392b", "center");
}
export function drawDesk() {
  box3d(642, 98, 130, 30, 24, "#8a5a33", "#5c3b20");
  cx.fillStyle = "#222";
  rr(676, 34, 64, 40, 4);
  cx.fill();
  cx.fillStyle = "#0d2b1b";
  cx.fillRect(680, 38, 56, 30);
  cx.strokeStyle = "#4cc98a";
  cx.lineWidth = 1.5;
  cx.beginPath();
  [
    [684, 62],
    [694, 56],
    [702, 59],
    [712, 48],
    [722, 52],
    [732, 42],
  ].forEach((p, i) => (i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])));
  cx.stroke();
  cx.fillStyle = "#333";
  cx.fillRect(704, 74, 8, 5);
  cx.fillStyle = "#555";
  rr(686, 82, 48, 8, 2);
  cx.fill();
}
export function drawProd() {
  const b = LAY.prod,
    ids = Object.keys(S.prod).filter((p) => pStock(p) > 0 && pInfo(p));
  if (!ids.length && !S.prodSeen) return;
  const d = 26,
    h = 58,
    y0 = b.y + b.h - d,
    ft = b.y + b.h - h;
  box3d(b.x - 4, y0, b.w + 8, d, h, "#8a5a33", "#5c3b20");
  cx.fillStyle = "#241609";
  cx.fillRect(b.x, ft + 6, b.w, h - 10);
  cx.fillStyle = "#8a5a33";
  cx.fillRect(b.x, ft + 29, b.w, 3);
  let k = 0;
  for (const pid of ids) {
    const i = pInfo(pid),
      n = Math.min(pStock(pid), i.t === "acc" ? 3 : 2),
      sd = i.s && SETS.find((z) => z.id === i.s);
    for (let j = 0; j < n && k < 14; j++, k++) {
      const px = b.x + 4 + (k % 7) * 23.5,
        py = k < 7 ? ft + 8 : ft + 33;
      if (i.t === "box") {
        cx.fillStyle = i.col;
        rr(px, py, 21, 20, 2);
        cx.fill();
        cx.fillStyle = "#fff9";
        cx.fillRect(px + 2, py + 2, 17, 3);
        const im = sd && timg(sd.sym);
        if (im) cx.drawImage(im, px + 6, py + 7, 9, 9);
        else pokeball(px + 10.5, py + 12, 4);
      } else if (i.t === "etb") {
        cx.fillStyle = "#3b2a66";
        rr(px, py, 21, 20, 2);
        cx.fill();
        cx.fillStyle = i.col;
        cx.fillRect(px, py + 7, 21, 6);
      } else if (i.t === "tin") {
        cx.fillStyle = "#b8c0cc";
        rr(px + 2, py + 1, 17, 19, 6);
        cx.fill();
        cx.fillStyle = i.col;
        cx.beginPath();
        cx.arc(px + 10.5, py + 10, 5, 0, 7);
        cx.fill();
      } else if (i.t === "col") {
        cx.fillStyle = "#d4a017";
        rr(px, py, 21, 20, 2);
        cx.fill();
        cx.fillStyle = i.col;
        cx.fillRect(px + 3, py + 3, 15, 10);
      } else {
        cx.fillStyle = i.col;
        rr(px + 3, py + 4, 15, 16, 2);
        cx.fill();
        cx.fillStyle = "#fff7";
        cx.fillRect(px + 5, py + 6, 11, 3);
      }
    }
  }
  cx.fillStyle = "#fff";
  rr(b.x + b.w / 2 - 54, y0 - h + 3, 108, 15, 4);
  cx.fill();
  txt("Sellado y accesorios", b.x + b.w / 2, y0 - h + 14, 10, "#1b1f2a", "center");
}
export function drawCase() {
  const c = LAY.cs(),
    cap = caseCap(),
    its = caseItems(),
    h = 24,
    t = tierOf(level());
  box3d(c.x - 6, c.y, c.w + 12, c.h, h, "#cfe6ef", ["#3b3f4a", "#4a3a2a", "#e9e4da", "#15181f"][t]);
  const g = cx.createLinearGradient(0, c.y - h, 0, c.y + c.h - h);
  g.addColorStop(0, "#f2fbff");
  g.addColorStop(1, "#bfdbe8");
  cx.fillStyle = g;
  cx.fillRect(c.x - 4, c.y - h + 2, c.w + 8, c.h - 4);
  for (let k = 0; k < cap; k++) {
    const px = c.x + 6 + (k % 8) * 32,
      py = c.y - h + 5 + Math.floor(k / 8) * 44,
      it = its[k];
    if (it) {
      const cd = BYID[it.c],
        im = timg(cd.img);
      if (it.gr) {
        // Funda de plástico: marco transparente algo más grande que la carta y etiqueta roja arriba
        cx.fillStyle = "rgba(0,0,0,.18)";
        cx.fillRect(px, py - 3, 28, 40);
        cx.fillStyle = "rgba(255,255,255,.55)";
        rr(px - 2, py - 7, 28, 42, 3);
        cx.fill();
        cx.strokeStyle = "rgba(255,255,255,.9)";
        cx.lineWidth = 1;
        cx.stroke();
      }
      cx.fillStyle = "rgba(0,0,0,.18)";
      cx.fillRect(px + 2, py + 2, 24, 33);
      if (im) cx.drawImage(im, px, py, 24, 33);
      else {
        cx.fillStyle = RAR[cd.r].c;
        cx.fillRect(px, py, 24, 33);
        cx.fillStyle = "#fff8";
        cx.fillRect(px + 3, py + 4, 18, 12);
      }
      cx.strokeStyle = it.gr ? "rgba(255,255,255,.8)" : RAR[cd.r].c;
      cx.lineWidth = it.gr ? 1 : 1.5;
      cx.strokeRect(px, py, 24, 33);
      if (it.gr) {
        const gold = it.gr === 10; // GEM MINT: etiqueta dorada
        cx.fillStyle = gold ? "#ffe9a0" : "#fff";
        cx.fillRect(px, py - 6, 24, 6);
        cx.strokeStyle = gold ? "#c9a227" : "#c0392b";
        cx.lineWidth = 1;
        cx.strokeRect(px, py - 6, 24, 6);
        txt("PGS " + it.gr, px + 12, py - 1.2, 5, gold ? "#7a5a00" : "#c0392b", "center");
      }
      if (it.res) {
        cx.fillStyle = "rgba(255,255,255,.55)";
        cx.fillRect(px, py, 24, 33);
      }
      const pv = itemVal(it) * it.case;
      cx.fillStyle = "#fff";
      rr(px - 2, py + 34, 28, 9, 2);
      cx.fill();
      txt(
        pv >= 100 ? Math.round(pv) + "€" : pv.toFixed(pv >= 10 ? 1 : 2).replace(".", ",") + "€",
        px + 12,
        py + 41,
        7,
        "#123",
        "center",
      );
    } else {
      cx.fillStyle = "rgba(0,0,0,.06)";
      rr(px, py, 24, 33, 3);
      cx.fill();
    }
  }
  {
    const o = ((performance.now() / 22) % (c.w + 260)) - 120;
    cx.fillStyle = "rgba(255,255,255,.4)";
    cx.beginPath();
    cx.moveTo(c.x + o, c.y + c.h - h);
    cx.lineTo(c.x + o + 50, c.y - h);
    cx.lineTo(c.x + o + 80, c.y - h);
    cx.lineTo(c.x + o + 30, c.y + c.h - h);
    cx.fill();
  }
  cx.fillStyle = "#7fe3ff";
  cx.fillRect(c.x - 6, c.y + c.h - h + 3, c.w + 12, 2);
  txt(`Vitrina · ${its.length}/${cap}`, c.x, c.y + c.h - 6, 11, t === 2 ? "#1b1f2a" : "#fff");
}
export function drawCounter() {
  const c = LAY.counter,
    h = 30,
    t = tierOf(level());
  box3d(
    c.x - 4,
    c.y,
    c.w + 8,
    c.h,
    h,
    ["#9a6a40", "#b88b5c", "#f2efe8", "#2a2f3a"][t],
    ["#6b4527", "#8a5f38", "#d9d3c7", "#161a22"][t],
  );
  if (t === 3) {
    cx.fillStyle = "#c9a227";
    cx.fillRect(c.x - 4, c.y + c.h - h, c.w + 8, 2);
  }
  const ry = c.y + 76;
  cx.fillStyle = "#2b2f38";
  cx.fillRect(c.x + 8, ry + 12, 40, 16);
  cx.fillStyle = "#3a3f4b";
  cx.fillRect(c.x + 8, ry - 12, 40, 24);
  cx.fillStyle = "#7fe3a0";
  cx.fillRect(c.x + 13, ry - 8, 30, 10);
  txt("€", c.x + 28, ry + 1, 9, "#0d2b1b", "center");
  cx.fillStyle = "#aaa";
  for (let i = 0; i < 3; i++) cx.fillRect(c.x + 13 + i * 10, ry + 5, 8, 4);
  if (VIS.drawer > 0) {
    const k = Math.min(1, (1.4 - VIS.drawer) * 7, VIS.drawer * 5);
    cx.fillStyle = "#2b2f38";
    cx.fillRect(c.x + 8 - 14 * k, ry + 12, 40, 14);
    cx.fillStyle = "#555";
    for (let i = 0; i < 4; i++) cx.fillRect(c.x + 10 - 14 * k + i * 9, ry + 14, 7, 10);
    cx.fillStyle = "#6cc070";
    cx.fillRect(c.x + 11 - 14 * k, ry + 15, 5, 8);
    cx.fillStyle = "#f2c14e";
    cx.fillRect(c.x + 29 - 14 * k, ry + 17, 5, 5);
    cx.fillStyle = "#fff";
    cx.fillRect(c.x + 30, ry - 12 - 14 * k, 8, 14 * k);
  }
  cx.fillStyle = "#111";
  rr(c.x + 14, ry + 40, 20, 28, 3);
  cx.fill();
  cx.fillStyle = "#a8f0b8";
  cx.fillRect(c.x + 17, ry + 43, 14, 9);
  cx.fillStyle = "#f2b705";
  cx.beginPath();
  cx.arc(c.x + 14, c.y + 20, 6, 0, 7);
  cx.arc(c.x + 14, c.y + 14, 6, 0, 7);
  cx.fill();
  txt("CAJA", c.x + c.w / 2, c.y + c.h - 10, 11, t === 2 ? "#1b1f2a" : "#fff", "center");
}
export function drawDecorFloor() {
  const D = S.decor;
  if (D.rug) {
    cx.save();
    cx.translate(262, 505);
    cx.scale(1, 0.42);
    cx.fillStyle = "#e3350d";
    cx.beginPath();
    cx.arc(0, 0, 60, Math.PI, 0);
    cx.fill();
    cx.fillStyle = "#f4f4f4";
    cx.beginPath();
    cx.arc(0, 0, 60, 0, Math.PI);
    cx.fill();
    cx.fillStyle = "#1d1d1d";
    cx.fillRect(-60, -6, 120, 12);
    cx.beginPath();
    cx.arc(0, 0, 17, 0, 7);
    cx.fill();
    cx.fillStyle = "#f4f4f4";
    cx.beginPath();
    cx.arc(0, 0, 10, 0, 7);
    cx.fill();
    cx.restore();
  }
  cx.fillStyle = "#6b4527";
  rr(328, 536, 54, 16, 3);
  cx.fill();
  txt("BIENVENIDO", 355, 547, 7, "#e8d5b0", "center");
}
export function decorObjs(L) {
  const D = S.decor,
    se = season(),
    open = S.phase !== "closed";
  if (D.table) {
    L.push({
      y: 330,
      f: () => {
        if (!(S.tour && open))
          [
            [175, 262],
            [300, 262],
          ].forEach(([x, y], i) => seatTaken(i) || box3d(x - 8, y - 6, 16, 10, 12, "#8a5a33", "#5c3b20"));
        box3d(140, 276, 196, 54, 18, "#5c3b20", "#4a2f18");
        cx.fillStyle = "#2f7d4a";
        cx.fillRect(146, 262, 184, 42);
        [
          [180, 270],
          [210, 276],
          [270, 268],
          [296, 279],
        ].forEach(([x, y], i) => {
          cx.fillStyle = ["#fff", "#d9402a", "#4a86c9", "#f2b705"][i];
          cx.fillRect(x, y, 12, 16);
        });
      },
    });
    if (!(S.tour && open))
      [
        [175, 356],
        [300, 356],
      ].forEach(
        ([x, y], i) =>
          seatTaken(i + 2) || L.push({ y, f: () => box3d(x - 8, y - 10, 16, 10, 12, "#8a5a33", "#5c3b20") }),
      );
  }
  if (D.coffee)
    L.push({
      y: 330,
      f: () => {
        box3d(560, 306, 38, 24, 44, "#3a3d46", "#2d2f36");
        cx.fillStyle = "#c0392b";
        cx.fillRect(564, 292, 30, 7);
        cx.fillStyle = "#111";
        cx.fillRect(570, 303, 18, 12);
        cx.fillStyle = "#fff";
        rr(574, 311, 10, 8, 2);
        cx.fill();
        txt("CAFÉ", 579, 326, 8, "#fff", "center");
      },
    });
  if (D.sofa)
    L.push({
      y: 518,
      f: () => {
        box3d(510, 488, 100, 12, 34, "#b23a3a", "#8e2f2f");
        box3d(510, 500, 100, 18, 14, "#c24545", "#8e2f2f");
      },
    });
  if (D.plants)
    [
      [562, 248],
      [20, 300],
      [610, 450],
    ].forEach(([x, y]) => L.push({ y: y + 16, f: () => plant(x, y) }));
  [
    [20, 490],
    [782, 500],
    [610, 118],
  ].forEach(([x, y]) => L.push({ y: y + 16, f: () => plant(x, y) }));
  if (se === "xmas")
    L.push({
      y: 530,
      f: () => {
        const x = 470,
          y = 530;
        cx.fillStyle = "rgba(0,0,0,.2)";
        cx.beginPath();
        cx.ellipse(x, y, 18, 5, 0, 0, 7);
        cx.fill();
        cx.fillStyle = "#7a4a2b";
        cx.fillRect(x - 3, y - 8, 6, 8);
        [
          [26, -8, -26],
          [21, -22, -38],
          [15, -34, -50],
        ].forEach(([w, y1, y2]) => {
          cx.fillStyle = "#1f7a3a";
          cx.beginPath();
          cx.moveTo(x - w, y + y1);
          cx.lineTo(x + w, y + y1);
          cx.lineTo(x, y + y2);
          cx.fill();
        });
        const t = performance.now() / 400;
        [
          [-12, -14],
          [10, -18],
          [-6, -30],
          [7, -36],
          [0, -24],
          [-14, -12],
        ].forEach(([dx, dy], i) => {
          cx.fillStyle = ["#ff4d4d", "#ffd54a", "#4dd2ff"][i % 3];
          cx.globalAlpha = 0.6 + 0.4 * Math.sin(t + i);
          cx.beginPath();
          cx.arc(x + dx, y + dy, 2.4, 0, 7);
          cx.fill();
          cx.globalAlpha = 1;
        });
        star(x, y - 52, 5, "#ffd54a");
      },
    });
  if (se === "hallo")
    [
      [300, 548],
      [412, 548],
    ].forEach(([x, y], i) =>
      L.push({
        y,
        f: () => {
          cx.fillStyle = "rgba(0,0,0,.2)";
          cx.beginPath();
          cx.ellipse(x, y + 1, 12, 4, 0, 0, 7);
          cx.fill();
          cx.fillStyle = "#ff8a1f";
          cx.beginPath();
          cx.ellipse(x, y - 7, 12, 9, 0, 0, 7);
          cx.fill();
          cx.fillStyle = "#e06a00";
          cx.fillRect(x - 1, y - 16, 2, 18);
          cx.fillStyle = "#3b6b1f";
          cx.fillRect(x - 1.5, y - 19, 3, 4);
          const on = S.phase !== "closed" || i;
          cx.fillStyle = on ? "#ffe27a" : "#5a2a00";
          cx.beginPath();
          cx.moveTo(x - 6, y - 9);
          cx.lineTo(x - 3, y - 12);
          cx.lineTo(x - 1, y - 9);
          cx.moveTo(x + 6, y - 9);
          cx.lineTo(x + 3, y - 12);
          cx.lineTo(x + 1, y - 9);
          cx.fill();
          cx.fillRect(x - 5, y - 5, 10, 2);
        },
      }),
    );
}
export function drawFrontWall() {
  const t = tierOf(level()),
    se = season(),
    wc = ["#b9a57f", "#d9e6ee", "#e9dcc0", "#26324f"][t],
    wt = ["#d8c7a3", "#eef3f5", "#f4e7c8", "#1f2a44"][t];
  const g = cx.createLinearGradient(0, 520, 0, 548);
  g.addColorStop(0, "rgba(190,225,245,.05)");
  g.addColorStop(1, "rgba(190,225,245,.28)");
  if (S.annex) {
    cx.fillStyle = g;
    cx.fillRect(-276, 520, 272, 30);
    cx.fillStyle = "#5b6470";
    for (let x = -276; x <= -4; x += 68) cx.fillRect(x, 518, 3, 32);
    cx.fillStyle = wt;
    cx.fillRect(-276, 548, 276, 8);
    cx.fillStyle = wc;
    cx.fillRect(-276, 556, 276, 14);
    cx.fillStyle = "rgba(0,0,0,.25)";
    cx.fillRect(-276, 569, 276, 2);
  }
  [
    [6, 316],
    [396, 794],
  ].forEach(([a, b]) => {
    cx.fillStyle = g;
    cx.fillRect(a, 520, b - a, 30);
    cx.fillStyle = "rgba(255,255,255,.35)";
    for (let x = a + 30; x < b; x += 90) {
      cx.beginPath();
      cx.moveTo(x, 548);
      cx.lineTo(x + 14, 520);
      cx.lineTo(x + 22, 520);
      cx.lineTo(x + 8, 548);
      cx.fill();
    }
    cx.fillStyle = "#5b6470";
    for (let x = a; x <= b; x += 78) cx.fillRect(Math.min(x, b - 3), 518, 3, 32);
  });
  const deco = { xmas: "❄", winter: "❄", hallo: "🎃", spring: "✿", summer: "☀", autumn: "🍁" }[se];
  cx.fillStyle = "rgba(255,255,255,.75)";
  cx.font = "700 13px system-ui,sans-serif";
  cx.textAlign = "center";
  if (se === "summer") txt("¡REBAJAS DE VERANO!", 160, 538, 11, "rgba(255,120,40,.85)", "center");
  else if (deco) {
    [70, 150, 230, 470, 560, 650, 730].forEach((x, i) => {
      cx.globalAlpha = 0.55;
      cx.fillText(deco, x, 532 + (i % 2) * 9);
      cx.globalAlpha = 1;
    });
  }
  txt(shopName().toUpperCase(), 610, 544, 10, "rgba(255,255,255,.7)", "center");
  cx.fillStyle = wt;
  cx.fillRect(0, 548, 316, 8);
  cx.fillRect(396, 548, W - 396, 8);
  cx.fillStyle = wc;
  cx.fillRect(0, 556, 316, 14);
  cx.fillRect(396, 556, W - 396, 14);
  cx.fillStyle = "rgba(0,0,0,.25)";
  cx.fillRect(0, 569, 316, 2);
  cx.fillRect(396, 569, W - 396, 2);
  cx.fillStyle = "#5b6470";
  cx.fillRect(314, 516, 6, 54);
  cx.fillRect(392, 516, 6, 54);
  cx.fillRect(314, 514, 84, 4);
  if (se === "spring")
    [
      [40, "#ff9ecf"],
      [200, "#ffe066"],
      [470, "#ff9ecf"],
      [690, "#b39dff"],
    ].forEach(([x, c]) => {
      cx.fillStyle = "#6b4527";
      cx.fillRect(x, 550, 60, 8);
      for (let i = 0; i < 6; i++) {
        cx.fillStyle = "#3b8a3b";
        cx.fillRect(x + 5 + i * 10, 544, 2, 6);
        cx.fillStyle = c;
        cx.beginPath();
        cx.arc(x + 6 + i * 10, 543, 3, 0, 7);
        cx.fill();
      }
    });
  const op = S.phase !== "closed";
  cx.fillStyle = "#fff";
  rr(372, 524, 18, 12, 2);
  cx.fill();
  txt(op ? "OPEN" : "CLOSED", 381, 533, 5, op ? "#2fa557" : "#c0392b", "center");
}
export function drawShutter() {
  const now = performance.now(),
    dt = Math.min(0.05, (now - (VIS.lt || now)) / 1000);
  VIS.lt = now;
  if (VIS.dawn > 0 && !VIS.endAt) VIS.dawn = Math.max(0, VIS.dawn - dt / 2.8);
  const tgt = S.phase === "closed" || VIS.endAt ? 1 : 0;
  VIS.shut += clamp(tgt - VIS.shut, -dt * 1.4, dt * 1.4);
  const a = AX(),
    ww = W - a;
  cx.fillStyle = "#3b4049";
  cx.fillRect(a, 506, ww, 9);
  cx.fillStyle = "rgba(255,255,255,.12)";
  cx.fillRect(a, 506, ww, 2);
  const hh = VIS.shut * 56;
  if (hh < 1) return;
  const g = cx.createLinearGradient(0, 515, 0, 515 + hh);
  g.addColorStop(0, "#9aa3ad");
  g.addColorStop(1, "#7b838e");
  cx.fillStyle = g;
  cx.fillRect(a, 515, ww, hh);
  cx.fillStyle = "rgba(0,0,0,.15)";
  for (let y = 515 + 4; y < 515 + hh; y += 6) cx.fillRect(a, y, ww, 1.5);
  cx.fillStyle = "#5b6470";
  cx.fillRect(a, 515 + hh - 3, ww, 3);
  if (VIS.shut > 0.8) {
    cx.globalAlpha = (VIS.shut - 0.8) * 5;
    txt("CERRADO · VOLVEMOS PRONTO", W / 2, 515 + hh / 2 + 5, 14, "#2a2f3a", "center");
    cx.globalAlpha = 1;
  }
}
export function launchQ() {
  if (!(S.phase === "closed" && S.ev && S.ev.t === "launch")) return null;
  if (!VIS.lq || VIS.lq.day !== S.day)
    VIS.lq = {
      day: S.day,
      p: Array.from({ length: 8 }, (_, i) => ({
        x: 420 + i * 34,
        y: 590 + (i % 2) * 10,
        out: mkOutfit(pick(["kid", "collector", "whale", "kid"]), null),
        skin: pick(["#f2c9a0", "#e0a878", "#a9714b", "#7a4a2b"]),
        sign: i % 3 === 0,
        seed: Math.random() * 6,
      })),
    };
  return VIS.lq.p;
}
export function drawLQ(p) {
  const t = performance.now() / 1000,
    o = p.out;
  o.skin = p.skin;
  o.mv = false;
  o.ph = 0;
  o.mood = Math.sin(t + p.seed) > 0.6 ? "impatient" : "happy";
  o.arm = p.sign ? "up" : null;
  o.bag = false;
  const hop = Math.max(0, Math.sin(t * 3 + p.seed)) * 2;
  drawPerson(p.x, p.y - hop, o);
  if (p.sign) {
    const sd = SETS.find((z) => z.id === S.ev.s);
    cx.fillStyle = "#fff";
    rr(p.x + 2, p.y - hop - 66, 34, 16, 2);
    cx.fill();
    cx.strokeStyle = "#333";
    cx.lineWidth = 1;
    cx.stroke();
    txt("¡" + (sd ? sd.n.slice(0, 6) : "YA") + "!", p.x + 19, p.y - hop - 54, 8, "#c0392b", "center");
  }
}
export function drawLux(i) {
  const [x, y] = LUX[i],
    it = luxItems()[i],
    n = nightK();
  box3d(x - 17, y - 20, 34, 20, 34, "#23283a", "#141824");
  cx.fillStyle = "#c9a227";
  cx.fillRect(x - 17, y - 34, 34, 1.5);
  cx.fillRect(x - 17, y - 1, 34, 1.5);
  cx.save();
  cx.globalCompositeOperation = "lighter";
  const g = cx.createLinearGradient(0, y - 150, 0, y - 50);
  g.addColorStop(0, `rgba(255,244,200,0)`);
  g.addColorStop(1, `rgba(255,244,200,${0.14 + 0.18 * n})`);
  cx.fillStyle = g;
  cx.beginPath();
  cx.moveTo(x - 4, y - 150);
  cx.lineTo(x + 4, y - 150);
  cx.lineTo(x + 22, y - 50);
  cx.lineTo(x - 22, y - 50);
  cx.fill();
  cx.restore();
  if (!it) {
    txt("Libre", x, y - 40, 8, "#9aa3b5", "center");
    return;
  }
  const cd = BYID[it.c],
    im = timg(cd.img),
    cy = y - 86;
  if (it.gr) {
    cx.fillStyle = "rgba(255,255,255,.3)";
    rr(x - 13, cy - 8, 26, 44, 3);
    cx.fill();
    cx.fillStyle = "#fff";
    cx.fillRect(x - 11, cy - 6, 22, 7);
    cx.fillStyle = "#c0392b";
    cx.fillRect(x - 11, cy - 6, 22, 1.5);
    txt("" + it.gr, x + 7, cy, 6, "#c0392b", "center");
  }
  if (im) cx.drawImage(im, x - 10, cy + 2, 20, 28);
  else {
    cx.fillStyle = RAR[cd.r].c;
    cx.fillRect(x - 10, cy + 2, 20, 28);
  }
  cx.fillStyle = "#2b2f38";
  cx.fillRect(x - 5, cy + 30, 10, 4);
  const tw = Math.sin(performance.now() / 300 + i * 2);
  if (tw > 0.6) star(x + 9, cy + 4, 3, "#fff");
  const pv = itemVal(it) * it.case;
  cx.fillStyle = "#c9a227";
  rr(x - 15, y - 18, 30, 9, 2);
  cx.fill();
  txt(pv >= 100 ? Math.round(pv) + "€" : pv.toFixed(1).replace(".", ",") + "€", x, y - 11.5, 7, "#1a1406", "center");
}
export function drawHunt() {
  const h = huntDay(),
    t = performance.now() / 1000;
  h.p.forEach((q, i) => {
    if (q.g) return;
    const b = Math.sin(t * 3 + i) * 1.5;
    cx.fillStyle = "rgba(0,0,0,.2)";
    cx.beginPath();
    cx.ellipse(q.x, q.y + 2, 5, 2, 0, 0, 7);
    cx.fill();
    pokeball(q.x, q.y - 4 + b, 4.5);
    if (Math.sin(t * 2 + i * 1.7) > 0.7) star(q.x + 6, q.y - 10 + b, 2.5, "#fff");
  });
}
export function drawAnnex() {
  cx.fillStyle = "rgba(0,0,0,.22)";
  cx.fillRect(-276, FLOOR_T, 6, FRONT_Y - FLOOR_T);
  cx.fillStyle = "#7d8794";
  cx.fillRect(-6, FLOOR_T, 12, 16);
  cx.fillRect(-6, FRONT_Y - 44, 12, 44);
  const t = performance.now() / 1000,
    hue = (t * 40) % 360;
  cx.fillStyle = "#111";
  rr(-200, 6, 96, 32, 3);
  cx.fill();
  cx.fillStyle = `hsl(${hue},70%,55%)`;
  cx.fillRect(-196, 9, 88, 26);
  pokeball(-152, 22, 7);
  EMIS.push({ x: -196, y: 9, w: 88, h: 26, c: `hsl(${hue},70%,60%)`, a: 0.6 });
  cx.fillStyle = "#3f7fc4";
  rr(-246, 330, 200, 110, 14);
  cx.fill();
  cx.strokeStyle = "#f2b705";
  cx.lineWidth = 3;
  cx.stroke();
  txt("ZONA DE JUEGO", -146, 324, 10, "#1b1f2a", "center");
  [
    [-215, 365, "#e3350d"],
    [-150, 405, "#f2b705"],
    [-85, 362, "#2fa557"],
  ].forEach(([x, y, c]) => {
    cx.fillStyle = "rgba(0,0,0,.2)";
    cx.beginPath();
    cx.ellipse(x + 2, y + 8, 16, 6, 0, 0, 7);
    cx.fill();
    cx.fillStyle = c;
    cx.beginPath();
    cx.ellipse(x, y, 16, 12, 0, 0, 7);
    cx.fill();
    cx.fillStyle = "rgba(255,255,255,.3)";
    cx.beginPath();
    cx.ellipse(x - 4, y - 4, 6, 4, 0, 0, 7);
    cx.fill();
  });
}
export function drawCams() {
  if (!S.cams) return;
  const t = performance.now() / 1000;
  [
    [24, 58, 1],
    [776, 58, -1],
  ].forEach(([x, y, d]) => {
    cx.fillStyle = "#2b2f38";
    rr(x - 8, y - 6, 16, 10, 3);
    cx.fill();
    cx.fillRect(x - 1, y - 12, 2, 6);
    cx.fillStyle = Math.sin(t * 3) > 0 ? "#ff3030" : "#551010";
    cx.beginPath();
    cx.arc(x + d * 5, y - 1, 1.8, 0, 7);
    cx.fill();
  });
}
export function drawTrophy() {
  const T = TROPHY,
    top = T.y - 66,
    t = performance.now() / 1000;
  box3d(T.x, T.y, T.w, T.d, 16, "#4a3424", "#2f2016");
  cx.fillStyle = "#c9a227";
  cx.fillRect(T.x - 2, top - 2, T.w + 4, 70);
  cx.fillStyle = "#13161e";
  cx.fillRect(T.x + 2, top + 2, T.w - 4, 62);
  const tl = trophies().slice(0, 6);
  for (let i = 0; i < 6; i++) {
    const x = T.x + 8 + (i % 3) * 31,
      y = top + 6 + Math.floor(i / 3) * 29,
      it = tl[i];
    if (it) {
      const c = BYID[it.c],
        col = (RAR[c.r] && RAR[c.r].c) || "#888";
      cx.fillStyle = "#f4e2a0";
      cx.fillRect(x - 1, y - 1, 22, 27);
      cx.fillStyle = col;
      cx.fillRect(x, y, 20, 25);
      cx.fillStyle = "rgba(255,255,255,.55)";
      cx.fillRect(x + 3, y + 3, 14, 9);
      if (Math.sin(t * 2 + i) > 0.6) {
        cx.fillStyle = "#fff";
        cx.fillRect(x + 15, y + 2, 2, 6);
        cx.fillRect(x + 13, y + 4, 6, 2);
      }
    } else {
      cx.strokeStyle = "rgba(255,255,255,.15)";
      cx.lineWidth = 1;
      cx.strokeRect(x, y, 20, 25);
    }
  }
  cx.fillStyle = "rgba(170,215,240,.16)";
  cx.fillRect(T.x + 2, top + 2, T.w - 4, 62);
  cx.fillStyle = "rgba(255,255,255,.25)";
  cx.beginPath();
  cx.moveTo(T.x + 6, top + 4);
  cx.lineTo(T.x + 22, top + 4);
  cx.lineTo(T.x + 8, top + 60);
  cx.lineTo(T.x + 4, top + 60);
  cx.fill();
  cx.fillStyle = "#c9a227";
  rr(T.x + T.w / 2 - 28, T.y + 3, 56, 11, 3);
  cx.fill();
  txt("🏆 TROFEOS", T.x + T.w / 2, T.y + 11, 7, "#2a2000", "center");
  EMIS.push({ x: T.x + 4, y: top + 4, w: T.w - 8, h: 58, c: "#ffe9a8", a: 0.25 });
}
