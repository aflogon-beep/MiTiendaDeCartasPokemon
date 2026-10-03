// Limpieza: los clientes, al irse, a veces dejan en el suelo un papel o un envoltorio de sobre (y alguna
// mancha de café si hay máquina de café). Se recogen tocándolos. Con la tienda sucia entran menos
// clientes: −3 % por cada cosa en el suelo, como mucho −24 %. La suciedad se queda de un día para otro.
import { S } from "./state.js";
import { AX, FRONT_Y, W } from "../world/layout.js";

export const DIRT_MAX = 12,
  DIRT_P = 0.09; // probabilidad de que un cliente deje algo al irse

/** Un cliente se va desde (x, y): a veces deja algo en el suelo. Devuelve lo que deja (o null). */
export function dirtDrop(x, y, rnd = Math.random) {
  if (rnd() >= DIRT_P) return null;
  if (y > FRONT_Y - 14 || x < AX() + 12 || x > W - 12) return null; // solo dentro de la tienda
  const l = (S.dirt = S.dirt || []);
  if (l.length >= DIRT_MAX) return null;
  const k = S.decor && S.decor.coffee && rnd() < 0.25 ? "coffee" : rnd() < 0.5 ? "paper" : "wrap",
    d = { x: Math.round(x + rnd() * 16 - 8), y: Math.round(y + rnd() * 6), k, r: Math.round(rnd() * 6) };
  l.push(d);
  return d;
}
/** Recoge lo que haya cerca de (x, y). Devuelve lo recogido (o null). */
export function dirtClean(x, y) {
  const l = S.dirt || [];
  let bi = -1,
    bd = 24;
  l.forEach((d, i) => {
    const dd = Math.hypot(d.x - x, d.y - y);
    if (dd < bd) ((bd = dd), (bi = i));
  });
  return bi < 0 ? null : l.splice(bi, 1)[0];
}
/** Cuántos clientes entran según la suciedad (1 = limpia). */
export const dirtMul = () => 1 - Math.min(0.24, (S.dirt ? S.dirt.length : 0) * 0.03);
