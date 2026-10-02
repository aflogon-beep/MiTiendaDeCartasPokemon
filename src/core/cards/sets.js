// Datos de cartas: sets conocidos, cartas cargadas e índices por id, set y rareza.
import { RAR, RMAP, LEGACY } from "../constants.js";

export const hue = (t) => {
  let h = 0;
  for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
};
/* Sets: lista completa desde pokemontcg.io. Los 3 primeros conservan su id antiguo para no perder partidas. */
export let SETDEF = [
  { id: "mew", api: "sv3pt5", n: "151", year: 2023, total: 207, dp: 4.5, fc: "#3f9b4a" },
  { id: "pre", api: "sv8pt5", n: "Evoluciones Prismáticas", year: 2025, total: 180, dp: 9.5, fc: "#d65fae" },
  { id: "obf", api: "sv3", n: "Llamas Obsidianas", year: 2023, total: 230, dp: 3.4, fc: "#e0622a" },
];
SETDEF.forEach((d) => (d.col = d.fc));
export const setName = (t) => (SETDEF.find((x) => x.id === t) || {}).n || t;
export const setCol = (t) => (SETDEF.find((x) => x.id === t) || {}).col || "#888";
// Cartas cargadas e índices. Tienen identidad estable: se cambian en sitio (setCards, indexCards).
export const CARDS = [];
export const BYID = {};
export const BYSR = {};
export const BYR = {};
export const BYS = {};
/** Sustituye la lista de cartas (en sitio, para que los imports sigan viendo la misma). */
export function setCards(list) {
  CARDS.length = 0;
  for (const c of list) CARDS.push(c);
}
export function mkSetDef(x) {
  const id = LEGACY[x.id] || x.id,
    year = +String(x.releaseDate || "2020").slice(0, 4),
    ex = SETDEF.find((d) => d.id === id);
  const o = ex || { id, dp: year >= 2020 ? 4.5 : 4 };
  Object.assign(o, {
    api: x.id,
    n: ex ? ex.n : x.name,
    series: x.series,
    year,
    total: x.total || x.printedTotal || 0,
    sym: x.images && x.images.symbol,
    date: x.releaseDate,
    col: (ex && ex.fc) || `hsl(${hue(id)} 55% 48%)`,
  });
  if (!ex) SETDEF.push(o);
  return o;
}
export function mapCard(d, sd) {
  const r = rarOf(d),
    p = (d.cardmarket && d.cardmarket.prices) || {};
  const b = p.trendPrice || p.averageSellPrice || p.avg30 || p.lowPrice || RAR[r].def;
  return {
    id: d.id,
    s: sd.id,
    name: d.name,
    num: d.number,
    r,
    img: d.images && d.images.small,
    b: Math.max(0.02, b),
    hp: d.hp ? +d.hp : null,
    types: d.types || null,
    sup: d.supertype || null,
    rv: p.reverseHoloTrend || null,
    seed: p.avg30 && p.avg7 && p.avg1 ? [p.avg30, p.avg7, p.avg1] : null,
  };
}
export function offlineCards() {
  const COM = ["Pidgey", "Rattata", "Zubat", "Magikarp", "Geodude", "Oddish", "Weedle", "Psyduck"],
    UNC = ["Pidgeotto", "Machoke", "Haunter", "Kadabra", "Growlithe"],
    RAREN = ["Ninetales", "Arcanine", "Gyarados"];
  const H = {
    mew: [
      ["Charizard ex", "SIR", 180],
      ["Mew ex", "SIR", 85],
      ["Invitación de Erika", "SIR", 120],
      ["Blastoise ex", "SIR", 45],
      ["Venusaur ex", "SIR", 35],
      ["Alakazam ex", "SIR", 28],
      ["Zapdos ex", "SIR", 22],
      ["Pikachu", "IR", 22],
      ["Charmander", "IR", 14],
      ["Squirtle", "IR", 12],
      ["Charizard ex", "DR", 9],
      ["Mew ex", "DR", 3],
      ["Kangaskhan ex", "DR", 2],
      ["Mewtwo", "UR", 6],
      ["Energía Psíquica", "HR", 8],
    ],
    pre: [
      ["Umbreon ex", "SIR", 900],
      ["Sylveon ex", "SIR", 240],
      ["Espeon ex", "SIR", 130],
      ["Vaporeon ex", "SIR", 110],
      ["Leafeon ex", "SIR", 95],
      ["Glaceon ex", "SIR", 85],
      ["Jolteon ex", "SIR", 80],
      ["Flareon ex", "SIR", 75],
      ["Eevee", "IR", 30],
      ["Umbreon ex", "DR", 12],
      ["Sylveon ex", "DR", 7],
      ["Espeon ex", "DR", 5],
      ["Pikachu", "UR", 8],
      ["Energía Fuego", "HR", 10],
    ],
    obf: [
      ["Charizard ex", "SIR", 95],
      ["Tyranitar ex", "SIR", 30],
      ["Pidgeot ex", "SIR", 18],
      ["Charmander", "IR", 6],
      ["Dreepy", "IR", 5],
      ["Bellibolt ex", "IR", 4],
      ["Charizard ex", "DR", 4],
      ["Tyranitar ex", "DR", 2],
      ["Pidgeot ex", "DR", 2],
      ["Charizard ex", "UR", 7],
      ["Energía Fuego", "HR", 4],
    ],
  };
  const out = [];
  SETDEF.filter((sd) => H[sd.id]).forEach((sd) => {
    const add = (name, r, b) =>
      out.push({ id: sd.id + "-" + out.length, s: sd.id, name, num: null, r, img: null, b, rv: null, seed: null });
    COM.forEach((n) => add(n, "C", 0.05));
    UNC.forEach((n) => add(n, "U", 0.1));
    RAREN.forEach((n) => add(n, "R", 0.35));
    H[sd.id].forEach((h) => add(h[0], h[1], h[2]));
  });
  return out;
}
export function indexCards() {
  for (const o of [BYID, BYSR, BYR, BYS]) for (const k in o) delete o[k];
  CARDS.forEach((c) => {
    BYID[c.id] = c;
    (BYSR[c.s + c.r] = BYSR[c.s + c.r] || []).push(c);
    (BYR[c.r] = BYR[c.r] || []).push(c);
    (BYS[c.s] = BYS[c.s] || []).push(c);
  });
}
export function rarOf(d) {
  const r = d.rarity;
  if (RMAP[r]) return RMAP[r];
  if (!r) return "R";
  if (/secret|rainbow|hyper|gold|black white/i.test(r)) return "HR";
  if (/special illustration/i.test(r)) return "SIR";
  if (/illustration|radiant|amazing|gallery/i.test(r)) return "IR";
  if (/ultra|shiny|shining|prism|star|vmax|vstar|gx|ex|lv\.x|break|legend/i.test(r)) return "UR";
  if (/holo|double/i.test(r)) return "DR";
  if (/uncommon/i.test(r)) return "U";
  if (/common/i.test(r)) return "C";
  return "R";
}
export function seriesList() {
  const m = {};
  SETDEF.forEach((d) => {
    if (!d.series) return;
    (m[d.series] = m[d.series] || { n: d.series, c: 0, d: "" }).c++;
    if ((d.date || "") > m[d.series].d) m[d.series].d = d.date || "";
  });
  return Object.values(m).sort((a, b) => b.d.localeCompare(a.d));
}
