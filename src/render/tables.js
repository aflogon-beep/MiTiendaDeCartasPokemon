// Mesa de juego: los jugadores (caminando, sentados en las sillas) y las cartas que van jugando al centro.
import { cx } from "./canvas.js";
import { drawPersonAt } from "./people.js";
import { SEATS, players } from "../core/tables.js";

const MID = { x: 238, y: 284 };
function card(x, y, face) {
  cx.fillStyle = face ? "#fff" : "#c8281e";
  cx.fillRect(x - 3.5, y - 5, 7, 10);
  cx.fillStyle = face ? "#f2b705" : "#fff";
  cx.fillRect(x - 2.5, y - 1, 5, 2);
}
/** Añade a la lista de dibujo los jugadores y, encima de la mesa, sus cartas. */
export function tableLayers(L) {
  if (!players.length) return;
  players.forEach((p) => L.push({ y: p.y, f: () => drawPersonAt(p.x, p.y, p.ct, p.skin, p.ph, p.mv, p.type) }));
  L.push({
    y: 330.5, // justo encima de la mesa (y = 330), por debajo de los que se sientan delante
    f: () => {
      for (const p of players) {
        if (p.st !== "play") continue;
        const s = SEATS[p.seat],
          ey = s.y < 300 ? 270 : 300; // borde de la mesa en su lado
        // Su mano, boca abajo, y la carta que acaba de jugar, camino del centro
        card(s.x - 5, ey, false);
        card(s.x + 5, ey, false);
        if (p.card) {
          const k = p.card;
          card(s.x + (MID.x + (p.seat % 2 ? 9 : -9) - s.x) * k, ey + (MID.y + (s.y < 300 ? -5 : 5) - ey) * k, true);
        }
      }
    },
  });
}
