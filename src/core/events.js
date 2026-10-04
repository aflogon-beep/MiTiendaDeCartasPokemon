// Temporada (según la fecha o la elegida) y eventos del día: lanzamiento, lluvia, VIP, torneo.
import { S, hasState } from "./state.js";
import { setName } from "./cards/sets.js";
export function season() {
  const o = (hasState() && S.season) || "auto";
  if (o !== "auto") return o;
  const d = new Date(),
    m = d.getMonth() + 1,
    dd = d.getDate();
  if (m === 12 || (m === 1 && dd <= 6)) return "xmas";
  if ((m === 10 && dd >= 15) || (m === 11 && dd <= 2)) return "hallo";
  return m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
}
export function evMul() {
  const t = S.ev && S.ev.t;
  return (
    (t === "launch" ? 1.4 : t === "rain" ? 0.65 : t === "vip" ? 1.25 : 1) *
    (S.tour ? 1.35 : 1) *
    ({ xmas: 1.25, hallo: 1.1, summer: 0.95 }[season()] || 1)
  );
}
export function evLabel() {
  const a = [];
  const e = S.ev;
  if (e && e.t === "launch")
    a.push(`🎉 Lanzamiento de ${setName(e.s)}: casi el doble de clientes y más ganas de sus sobres.`);
  if (e && e.t === "rain") a.push("🌧️ Día de lluvia: vendrá menos gente.");
  if (e && e.t === "vip") a.push("⭐ Visita VIP: vendrá alguien con mucho dinero.");
  if (S.tour) a.push("🏆 Torneo en la tienda: más coleccionistas e ingresos por inscripción.");
  return a.join(" ");
}
export function evShort() {
  const e = S.ev,
    a = [];
  if (e && e.t === "launch") a.push("🎉 Lanzamiento: " + setName(e.s));
  if (e && e.t === "rain") a.push("🌧️ Lluvia");
  if (e && e.t === "vip") a.push("⭐ Día VIP");
  if (S.tour) a.push("🏆 Torneo");
  return a.join(" · ");
}
