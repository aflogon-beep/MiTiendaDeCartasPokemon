// Zona Funko (docs/funkos/DISENO.md): ampliación de la tienda en el local de la librería de al lado.
// F1: se traspasa a nivel 5, se compra por 15.000 €, se le pone nombre y Emma se va a su sofá.
// Estado: S.fk (no existe hasta comprar el local; las partidas de antes no cambian).
//   S.fk = { name, since }   nombre que pone el jugador y día de la compra
import { S } from "./state.js";
import { level } from "./economy.js";
import { fkEnsure } from "./funko/zone.js";

export const FK_COST = 15000;
export const FK_LV = 5;
export const FK_NAMES = ["Zona Funko", "Pop Galaxy", "Cabezones", "El Rincón Friki"];

/** ¿Tienes la zona Funko? */
export const fkOn = () => !!S.fk;
/** ¿Se traspasa ya la librería? (nivel 5 y aún no es tuya) */
export const fkForSale = () => !S.fk && level() >= FK_LV;
/** ¿Puedes comprarla ahora? */
export const fkCanBuy = () => fkForSale() && S.money >= FK_COST;
/** Nombre de la zona (si aún no se le ha puesto, el de siempre). */
export const fkName = () => (S.fk && String(S.fk.name || "").trim()) || FK_NAMES[0];

/** Compra el local. Devuelve true si se ha comprado. */
export function fkBuy() {
  if (!fkCanBuy()) return false;
  S.money -= FK_COST;
  S.fk = { name: "", since: S.day };
  fkEnsure();
  return true;
}
/** Pone nombre a la zona (máximo 22 letras, como el de la tienda). */
export function fkSetName(n) {
  if (!S.fk) return false;
  S.fk.name = String(n || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 22);
  return true;
}

/** Lo que dice Emma cuando la despiertas en el sofá (es vaga, pero muy lista). Al azar, sin repetir seguidas. */
export const FK_WAKE = [
  "¿Dormida yo? Estaba pensando profundamente.",
  "No dormía: estaba meditando sobre el precio de los Funkos.",
  "Ojos cerrados, cerebro a tope. Así es como pienso mejor.",
  "Estaba en modo ahorro de energía. Muy eficiente, ¿eh?",
  "Shhh… estaba calculando las cuentas del mes con los ojos cerrados.",
  "¡Qué susto! Estaba soñando que el Funko de oro era nuestro.",
  "Solo descansaba la vista. La tengo agotada de tanto pensar.",
  "Era una siesta estratégica. Los genios las hacen todo el rato.",
  "¿Ya hay que trabajar? Cinco minutitos más…",
  "Eso no eran ronquidos: era la música del videojuego.",
  "Estaba cargando batería, como el móvil. Ya estoy al 100 %.",
  "¡Me has despertado en lo mejor! Le estaba ganando a Darth Vader.",
  "Estaba haciendo un estudio de mercado… del sofá. Es muy cómodo.",
  "No dormía, vigilaba la tienda por dentro de los párpados.",
];
let wakeLast = -1;
export function fkWakeLine(R = Math.random) {
  let i = Math.floor(R() * FK_WAKE.length);
  if (i === wakeLast) i = (i + 1) % FK_WAKE.length;
  wakeLast = i;
  return FK_WAKE[i];
}
