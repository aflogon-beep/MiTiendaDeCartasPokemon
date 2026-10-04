// Versión del juego: la fecha y hora del último cambio publicado (BUILD, la pone vite.config.js con la fecha del
// commit: el mismo código da siempre la misma versión). Se ve en
// Más → Ajustes y en el aviso «Actualizar» («Versión nueva: … · tienes: …»).
export const BUILD = typeof __BUILD__ !== "undefined" ? __BUILD__ : "";

/** «4 oct 2026 · 12:20» (hora del móvil). Sin fecha válida: «en desarrollo». */
export function verLabel(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return "en desarrollo";
  const f = d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
  return `${f} · ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

/** La versión publicada ahora mismo (version.json, sin caché). null si no se puede saber. */
export async function latestBuild() {
  try {
    const r = await fetch(import.meta.env.BASE_URL + "version.json?t=" + Date.now(), { cache: "no-store" });
    return r.ok ? (await r.json()).build : null;
  } catch (e) {
    return null;
  }
}
