// Zona Funko (docs/funkos/DISENO.md · F1): el local de la librería, a la derecha de la tienda (x 808–1084),
// con suelo de nave espacial, pared morada con el neón del nombre, estandartes de Hogwarts, estantería y
// vitrinas con LED (vacías hasta que lleguen los Funkos), el paso desde la tienda (portal de las estrellas)
// y el rincón de Emma: sofá gamer, tele y consola. Lo que no se mueve se dibuja una vez (en caché); en cada
// fotograma solo el neón, la tele y el portal. Emma se dibuja en render/family.js.
import { G, S } from "../core/state.js";
import { fkName } from "../core/funko.js";
import { FLOOR_T, FRONT_Y } from "../world/layout.js";
import { cx, canvasLost, fitS, txt } from "./canvas.js";
import { EMIS } from "./bloom.js";
import { nightK } from "./lighting.js";

export const FZ = { x0: 808, x1: 1084, wall: 796 }; // interior y pared que la separa de la tienda
export const FK_SOFA = { x: 966, y: 487 }; // centro del asiento del sofá de Emma
export const FK_TV = { x: 966, y: 408 };
const DOOR = { y0: 452, y1: 516 }; // paso desde la tienda, junto a la caja
const K = 2; // resolución de la caché (píxeles por unidad del mundo)
let FKC = null;

function hexFloor(g, x0, y0, x1, y1) {
  g.fillStyle = "#2b2440";
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const glow = g.createRadialGradient(946, 300, 10, 946, 300, 240);
  glow.addColorStop(0, "rgba(255,79,216,.22)");
  glow.addColorStop(1, "rgba(255,79,216,0)");
  g.fillStyle = glow;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.strokeStyle = "rgba(140,122,215,.7)";
  g.lineWidth = 1.6;
  const r = 12,
    h = r * Math.sqrt(3);
  g.save();
  g.beginPath();
  g.rect(x0, y0, x1 - x0, y1 - y0);
  g.clip();
  g.beginPath();
  for (let row = 0, y = y0; y < y1 + h; row++, y += h / 2)
    for (let x = x0 + (row % 2 ? 1.5 * r : 0); x < x1 + 2 * r; x += 3 * r) {
      g.moveTo(x - r, y);
      g.lineTo(x - r / 2, y - h / 2);
      g.lineTo(x + r / 2, y - h / 2);
      g.lineTo(x + r, y);
      g.lineTo(x + r / 2, y + h / 2);
      g.lineTo(x - r / 2, y + h / 2);
      g.closePath();
    }
  g.stroke();
  g.restore();
}
function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Dibuja la zona (lo que no se mueve) en una caché. */
function buildFk() {
  const W0 = FZ.wall,
    c = document.createElement("canvas");
  c.width = (FZ.x1 - W0) * K;
  c.height = FRONT_Y * K;
  const g = c.getContext("2d");
  g.scale(K, K);
  g.translate(-W0, 0);
  // Suelo de nave espacial
  hexFloor(g, FZ.x0, FLOOR_T, FZ.x1, FRONT_Y);
  // Pared del fondo, morada, con estandartes de Hogwarts a los lados
  g.fillStyle = "#1d1630";
  g.fillRect(W0, 0, FZ.x1 - W0, FLOOR_T);
  g.fillStyle = "#3a2a58";
  g.fillRect(W0, FLOOR_T - 5, FZ.x1 - W0, 5);
  ["#7a1018", "#1f5a36", "#1d3f8a", "#c9a227"].forEach((col, i) =>
    [816, 1030].forEach((x0) => {
      const x = x0 + i * 12;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x, 4);
      g.lineTo(x + 9, 4);
      g.lineTo(x + 9, 30);
      g.lineTo(x + 4.5, 25);
      g.lineTo(x, 30);
      g.closePath();
      g.fill();
      g.fillStyle = "#e6c35a";
      g.fillRect(x + 3, 12, 3, 3);
    }),
  );
  // Neón con el nombre (el brillo se dibuja aquí una vez; en cada fotograma solo el parpadeo y el resplandor)
  {
    const name = fkName().toUpperCase(),
      fs = fitS(name, 20, 190);
    g.save();
    g.shadowColor = "#ff4fd8";
    g.shadowBlur = 10;
    g.font = `700 ${fs}px 'Fredoka','Trebuchet MS',system-ui,sans-serif`;
    g.fillStyle = "#ffd1ff";
    g.textAlign = "center";
    g.fillText(name, 946, 30);
    g.fillText(name, 946, 30);
    g.restore();
  }
  // Sombra de la pared sobre el suelo
  const sh = g.createLinearGradient(0, FLOOR_T, 0, FLOOR_T + 18);
  sh.addColorStop(0, "rgba(0,0,0,.3)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh;
  g.fillRect(FZ.x0, FLOOR_T, FZ.x1 - FZ.x0, 18);
  // Estantería del fondo con LED: huecos vacíos (esperan los Funkos)
  g.fillStyle = "#3a2a58";
  rrect(g, 818, 50, 244, 44, 3);
  g.fill();
  g.fillStyle = "#241a38";
  for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) g.fillRect(822 + i * 15, 56 + r * 19, 11, 15);
  g.fillStyle = "#7af7ff";
  g.fillRect(818, 50, 244, 2.5);
  // Vitrinas altas de cristal en la pared derecha (vacías)
  [112, 212, 312].forEach((y) => {
    g.fillStyle = "rgba(191,231,255,.22)";
    rrect(g, 1040, y, 34, 88, 3);
    g.fill();
    g.strokeStyle = "#bfe7ff";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "rgba(191,231,255,.5)";
    for (let k = 1; k < 4; k++) g.fillRect(1042, y + k * 22, 30, 1.5);
    g.fillStyle = "#7af7ff";
    g.fillRect(1040, y, 34, 2.5);
  });
  // Pared que la separa de la tienda, con el paso junto a la caja
  g.fillStyle = "#3a3f4a";
  g.fillRect(W0, FLOOR_T, FZ.x0 - W0, DOOR.y0 - FLOOR_T);
  g.fillRect(W0, DOOR.y1, FZ.x0 - W0, FRONT_Y - DOOR.y1);
  g.fillStyle = "#2b2440";
  g.fillRect(W0, DOOR.y0, FZ.x0 - W0, DOOR.y1 - DOOR.y0);
  // El rincón de Emma: alfombra, tele en su mueble y sofá gamer
  g.fillStyle = "#4a2a6e";
  g.beginPath();
  g.ellipse(966, 470, 52, 40, 0, 0, 7);
  g.fill();
  g.strokeStyle = "#ff8ad8";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#4a3426";
  g.fillRect(940, 410, 52, 8);
  g.fillStyle = "#111";
  rrect(g, 936, 400, 60, 10, 2);
  g.fill();
  g.fillStyle = "#333";
  g.fillRect(944, 412, 10, 4); // la consola
  g.fillStyle = "#7af7ff";
  g.fillRect(946, 413, 2, 1.5);
  g.fillStyle = "rgba(0,0,0,.35)";
  g.beginPath();
  g.ellipse(966, 504, 40, 7, 0, 0, 7);
  g.fill();
  g.fillStyle = "#5a3388";
  rrect(g, 928, 476, 9, 26, 4);
  g.fill();
  rrect(g, 995, 476, 9, 26, 4);
  g.fill();
  g.fillStyle = "#6b3fa0";
  rrect(g, 932, 472, 68, 30, 9);
  g.fill();
  g.fillStyle = "#8a56c9";
  rrect(g, 932, 472, 68, 10, 6);
  g.fill();
  g.fillStyle = "#ff8ad8";
  rrect(g, 934, 484, 14, 10, 4); // cojín
  g.fill();
  return c;
}

/** La zona, si la tienes (encima del suelo de la ciudad y debajo de la gente). */
export function drawFkZone() {
  if (!S.fk) return;
  const key = fkName();
  if (G.FKk !== key || !FKC || canvasLost(FKC)) {
    FKC = buildFk();
    G.FKk = key;
  }
  cx.drawImage(FKC, FZ.wall, 0, FZ.x1 - FZ.wall, FRONT_Y);
  const t = performance.now() / 1000,
    n = nightK();
  // Neón con el nombre: parpadea de vez en cuando y brilla más de noche
  const name = key.toUpperCase(),
    fs = fitS(name, 20, 190);
  if (Math.sin(t * 7) > 0.97) {
    cx.fillStyle = "rgba(29,22,48,.5)";
    cx.fillRect(840, 8, 212, 28);
  }
  EMIS.push({
    x: 946 - name.length * fs * 0.32,
    y: 14,
    w: name.length * fs * 0.64,
    h: fs,
    c: "#ff4fd8",
    a: 0.5 + 0.4 * n,
  });
  EMIS.push({ x: 818, y: 49, w: 244, h: 3, c: "#7af7ff", a: 0.4 + 0.4 * n });
  // La tele: juego (Emma jugando), dibujos (viéndola tumbada) o apagándose (dormida)
  const st = FKEMMA.st,
    scr =
      st === "sleep"
        ? `rgba(70,90,160,${0.5 + 0.1 * Math.sin(t * 2)})`
        : st === "tv"
          ? `hsl(${200 + Math.sin(t * 1.3) * 25},70%,${60 + Math.sin(t * 9) * 8}%)`
          : `hsl(${(t * 90) % 360},80%,62%)`;
  cx.fillStyle = scr;
  cx.fillRect(939, 401.5, 54, 6.5);
  EMIS.push({ x: 939, y: 400, w: 54, h: 9, c: st === "sleep" ? "#465aa0" : "#7af7ff", a: 0.5 + 0.3 * n });
  // Portal de las estrellas en el paso: anillo y luces que se encienden en vuelta
  cx.strokeStyle = "#7a8aa8";
  cx.lineWidth = 6;
  cx.beginPath();
  cx.ellipse(FZ.wall + 6, (DOOR.y0 + DOOR.y1) / 2, 8, (DOOR.y1 - DOOR.y0) / 2 + 4, 0, -Math.PI / 2, Math.PI / 2);
  cx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) * Math.PI) / 5,
      on = Math.floor(t * 3) % 5 === i,
      px = FZ.wall + 6 + Math.cos(a) * 8,
      py = (DOOR.y0 + DOOR.y1) / 2 + Math.sin(a) * ((DOOR.y1 - DOOR.y0) / 2 + 4);
    cx.fillStyle = on ? "#ffd27a" : "#ff8a3a";
    cx.beginPath();
    cx.arc(px, py, on ? 2.8 : 2, 0, 7);
    cx.fill();
  }
}

/** Escaparate y fachada de la zona (por delante de la gente, como la de la tienda). */
export function drawFkFront() {
  if (!S.fk) return;
  const y = 516;
  cx.fillStyle = "#3a2a58";
  cx.fillRect(FZ.x0 - 12, y, FZ.x1 - FZ.x0 + 12, 54);
  const gl = cx.createLinearGradient(0, 520, 0, 548);
  gl.addColorStop(0, "rgba(190,225,245,.05)");
  gl.addColorStop(1, "rgba(190,225,245,.3)");
  cx.fillStyle = gl;
  cx.fillRect(FZ.x0, 520, 120, 28);
  cx.fillRect(FZ.x0 + 164, 520, FZ.x1 - FZ.x0 - 168, 28);
  cx.fillStyle = "#1d1630";
  cx.fillRect(FZ.x0 + 124, 518, 36, 38); // la puerta de la calle
  cx.fillStyle = "rgba(190,225,245,.35)";
  cx.fillRect(FZ.x0 + 128, 522, 28, 34);
  cx.fillStyle = "#5b6470";
  for (let x = FZ.x0; x <= FZ.x1 - 4; x += 60) if (x < FZ.x0 + 120 || x > FZ.x0 + 160) cx.fillRect(x, 518, 3, 32);
  cx.fillStyle = "#2a1f3d";
  cx.fillRect(FZ.x0 - 12, 556, FZ.x1 - FZ.x0 + 12, 14);
  const name = fkName().toUpperCase(),
    fs = fitS(name, 10, 200);
  txt(name, (FZ.x0 + FZ.x1) / 2, 567, fs, "#ffd1ff", "center");
  EMIS.push({
    x: (FZ.x0 + FZ.x1) / 2 - name.length * fs * 0.32,
    y: 558,
    w: name.length * fs * 0.64,
    h: fs,
    c: "#ff4fd8",
    a: 0.3 + 0.5 * nightK(),
  });
}

/* ---------- Emma en su sofá ---------- */
// play: sentada con el mando · tv: tumbada viendo la tele · sleep: dormida (Zzz) · wake: recién despierta
export const FKEMMA = { st: "play", t: 30 };
