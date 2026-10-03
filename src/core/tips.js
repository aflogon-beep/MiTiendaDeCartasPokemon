// Consejos de Emma a partir de lo que pasó en el día.
import { S } from "./state.js";
import { caseCap, caseItems, itemVal, pInfo, sealedCount, tolMul } from "./economy.js";
import { fmt, r05 } from "./util.js";
import { setName } from "./cards/sets.js";
export function tipsList(st) {
  const w = (st && st.why) || S.lastWhy || {},
    T = [],
    add = (p, t) => T.push([p, t]);
  if (!caseItems().length)
    add(9, "🃏 Tu vitrina está vacía y los coleccionistas entran y se van. Pon cartas en Cartas → «+ Vitrina».");
  else if (w.ce) add(8, `🃏 ${w.ce} cliente(s) encontraron la vitrina vacía.`);
  Object.keys(w).forEach((k) => {
    const n = w[k],
      [t, id] = k.split(":");
    if (t === "kp" && S.pack[id])
      add(
        7 + n,
        `💸 ${n} cliente(s) no compraron sobres de ${setName(id)} por precio. Prueba a ponerlos a ${fmt(r05(S.pack[id].ref * tolMul() * 0.94))} (ahora ${fmt(S.shelf[id])}).`,
      );
    if (t === "ks" && S.pack[id])
      add(7 + n, `📦 Se agotaron los sobres de ${setName(id)}: perdiste ${n} venta(s). Compra más en Stock.`);
    if (t === "pp") {
      const i = pInfo(id);
      if (i)
        add(
          5 + n,
          `💸 ${n} cliente(s) vieron caro «${i.n}». Precio recomendado: ${fmt(r05(i.ref * tolMul() * 0.94))}.`,
        );
    }
    if (t === "rv")
      add(
        6 + n,
        `🏪 ${n} cliente(s) se fueron a la tienda rival por su oferta en ${setName(id)}. Toca su tienda en la calle y haz una oferta del día.`,
      );
    if (t === "ps") {
      const i = pInfo(id);
      if (i) add(5 + n, `📦 Te pidieron «${i.n}» y no quedaba.`);
    }
  });
  if (w.cp >= 2)
    add(
      6 + w.cp,
      `🏷️ ${w.cp} cliente(s) vieron caras las cartas de la vitrina. Con un margen del 100–105 % se venden mucho más rápido.`,
    );
  if (w.thief)
    add(
      9,
      "🚨 Te robaron una carta de la vitrina. Cuando suene la alarma, toca al ladrón antes de que salga. Las cámaras de seguridad (Mejoras) ayudan.",
    );
  if (w.pat >= 2)
    add(
      6 + w.pat,
      `⏱️ ${w.pat} cliente(s) se cansaron de esperar en la cola. Cobra más rápido o contrata un cajero (Más → Mejoras).`,
    );
  {
    const n = S.dirt ? S.dirt.length : 0;
    if (n >= 3)
      add(
        6 + n,
        `🧹 Hay ${n} cosas en el suelo de la tienda y entran un ${Math.round(Math.min(0.24, n * 0.03) * 100)} % menos clientes. Tócalas para recogerlas.`,
      );
  }
  if (!sealedCount()) add(8, "🎴 No te quedan sobres, y son lo que más se vende. Compra en Stock.");
  const idle = S.items.filter((i) => i.case == null && !i.gq && !i.fkK && !i.lux && itemVal(i) >= 1),
    iv = idle.reduce((a, i) => a + itemVal(i), 0);
  if (idle.length >= 5)
    add(
      6,
      `💤 Tienes ${idle.length} cartas de más de 1 € guardadas (valen ${fmt(iv)}). Ponlas en la vitrina o véndelas al mayorista.`,
    );
  if (st && st.bought >= 3 && st.inc < st.bought * 15)
    add(
      5,
      "🤝 Hoy has comprado bastante y vendido poco. Compra a los clientes solo por debajo del 75 % del valor de mercado, y solo cartas que puedas revender.",
    );
  if (caseItems().length >= caseCap() && caseCap() <= 8)
    add(4, "🗄️ La vitrina está llena: la «Vitrina grande» (Más → Mejoras) te deja exponer el doble.");
  if (!S.seenCity) add(2, "🏙️ Aleja la cámara (⤢) y toca los edificios de la calle: banco, café, colegio, la plaza…");
  if (!Object.keys(S.prod || {}).some((k) => S.prod[k] > 0))
    add(3, "🛡️ Prueba con accesorios (fundas, toploaders): cuestan poco y dejan mucho margen.");
  return T.sort((a, b) => b[0] - a[0])
    .slice(0, 4)
    .map((x) => x[1]);
}
export function dedupTips(l) {
  const h = (S.tipHist = S.tipHist || {}),
    out = [];
  l.forEach((t) => {
    const k = t.replace(/[0-9,.€]/g, "").slice(0, 30);
    if (h[k] != null && S.day - h[k] <= 3 && out.length) return;
    out.push(t);
    h[k] = S.day;
  });
  return out.slice(0, 3);
}
