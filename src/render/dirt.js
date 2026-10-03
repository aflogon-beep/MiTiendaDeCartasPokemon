// Suciedad en el suelo (core/dirt.js): papeles arrugados, envoltorios de sobre y manchas de café.
import { cx } from "./canvas.js";

const FOIL = ["#3f9b4a", "#d65fae", "#e0622a", "#3f7fc4", "#f2b705"];
export function drawDirt(d) {
  cx.save();
  cx.translate(d.x, d.y);
  cx.scale(1.9, 1.9); // que se vea (y se toque) bien en el móvil
  if (d.k === "coffee") {
    cx.fillStyle = "rgba(92,58,30,.55)";
    cx.beginPath();
    cx.ellipse(0, 0, 9, 4.5, 0.3, 0, 7);
    cx.fill();
    cx.beginPath();
    cx.ellipse(7, 2, 3, 1.6, 0, 0, 7);
    cx.fill();
  } else if (d.k === "wrap") {
    // envoltorio de sobre abierto: tira de color con brillo
    cx.rotate((d.r - 3) * 0.35);
    cx.fillStyle = "rgba(0,0,0,.18)";
    cx.fillRect(-6, -1, 13, 5);
    cx.fillStyle = FOIL[d.r % FOIL.length];
    cx.fillRect(-7, -3, 13, 5);
    cx.fillStyle = "rgba(255,255,255,.65)";
    cx.fillRect(-5, -2, 4, 1.4);
  } else {
    // papel arrugado
    cx.rotate(d.r * 0.5);
    cx.fillStyle = "rgba(0,0,0,.18)";
    cx.beginPath();
    cx.ellipse(1, 2, 5, 2.2, 0, 0, 7);
    cx.fill();
    cx.fillStyle = "#f4f1ea";
    cx.beginPath();
    cx.moveTo(-5, 0);
    cx.lineTo(-2, -4);
    cx.lineTo(3, -3);
    cx.lineTo(5, 1);
    cx.lineTo(1, 3);
    cx.lineTo(-4, 2);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = "#c9c3b6";
    cx.lineWidth = 0.8;
    cx.beginPath();
    cx.moveTo(-3, -1);
    cx.lineTo(1, 0);
    cx.lineTo(3, -2);
    cx.stroke();
  }
  cx.restore();
}
