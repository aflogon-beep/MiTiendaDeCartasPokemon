// API simulada de pokemontcg.io: sets y cartas inventados, deterministas.
// La usan los tests de Playwright (interceptando https://api.pokemontcg.io/**)
// y los de Vitest (para comprobar que los datos tienen sentido).

const IMG = "https://images.pokemontcg.io";

// Los 3 primeros usan los ids de la API de los sets por defecto del juego
// (sv3pt5 → mew, sv8pt5 → pre, sv3 → obf). El resto son extra para Colecciones.
export const FIX_SETS = [
  { id: "sv3pt5", name: "Fixture Uno", series: "Serie Fixture", releaseDate: "2023/09/22" },
  { id: "sv8pt5", name: "Fixture Dos", series: "Serie Fixture", releaseDate: "2025/01/17" },
  { id: "sv3", name: "Fixture Tres", series: "Serie Fixture", releaseDate: "2023/08/11" },
  { id: "fx4", name: "Fixture Cuatro", series: "Serie Fixture", releaseDate: "2024/05/24" },
  { id: "fx5", name: "Fixture Media", series: "Serie Antigua", releaseDate: "2016/02/03" },
  { id: "fx6", name: "Fixture Clásica", series: "Serie Clásica", releaseDate: "2000/06/16" },
];

// Rarezas variadas: las mapeadas directamente por RMAP y alguna que pasa por rarOf().
const RARITY_PLAN = [
  ["Common", 20],
  ["Uncommon", 14],
  ["Rare", 8],
  ["Rare Holo", 3],
  ["Double Rare", 4],
  ["Illustration Rare", 4],
  ["Ultra Rare", 2],
  ["Special Illustration Rare", 3],
  ["Hyper Rare", 1],
  ["Rare Shiny Galáctica", 1], // no está en RMAP: rarOf() la deduce (UR)
  [null, 1], // sin rareza: rarOf() → R
];

// Precio base (€) por rareza: [mínimo, máximo]
const PRICE = {
  Common: [0.04, 0.2],
  Uncommon: [0.08, 0.35],
  Rare: [0.25, 1.6],
  "Rare Holo": [1, 4],
  "Double Rare": [1.2, 6],
  "Illustration Rare": [4, 18],
  "Ultra Rare": [6, 22],
  "Special Illustration Rare": [18, 110],
  "Hyper Rare": [9, 40],
  "Rare Shiny Galáctica": [3, 12],
  null: [0.3, 1],
};

const SYL = ["flo", "chis", "pa", "zu", "ma", "ron", "ti", "ka", "bel", "lu", "dra", "go", "ne", "vi", "so", "quo"];
const TYPES = ["Fire", "Grass", "Water", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Fairy", "Dragon", "Colorless"];

// Generador pseudoaleatorio con semilla (para que los datos sean siempre los mismos)
function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const seedOf = (t) => [...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483647, 7);
const r2 = (x) => Math.round(x * 100) / 100;

function inventedName(R, i) {
  const n = 2 + Math.floor(R() * 2);
  let s = "";
  for (let k = 0; k < n; k++) s += SYL[Math.floor(R() * SYL.length)];
  return s[0].toUpperCase() + s.slice(1) + "mon" + (i % 9 === 0 ? " ex" : "");
}

function makeCards(set) {
  const R = rng(seedOf(set.id));
  const cards = [];
  let n = 1;
  for (const [rarity, count] of RARITY_PLAN) {
    for (let k = 0; k < count; k++, n++) {
      const [lo, hi] = PRICE[rarity];
      const trend = r2(lo + (hi - lo) * R());
      const trainer = rarity === "Uncommon" && k % 5 === 0;
      const card = {
        id: `${set.id}-${n}`,
        name: trainer ? `Entrenador ${inventedName(R, n)}` : inventedName(R, n),
        number: String(n),
        supertype: trainer ? "Trainer" : "Pokémon",
        images: { small: `${IMG}/${set.id}/${n}.png`, large: `${IMG}/${set.id}/${n}_hires.png` },
      };
      if (rarity) card.rarity = rarity;
      if (!trainer) {
        card.hp = String(30 + 10 * Math.floor(R() * 25));
        card.types = [TYPES[Math.floor(R() * TYPES.length)]];
      }
      // Precios de Cardmarket con distintas formas: completos, solo tendencia o sin precio.
      const shape = n % 11;
      if (shape === 4) {
        // sin cardmarket: el juego usa el precio por defecto de la rareza
      } else if (shape === 7) {
        card.cardmarket = { url: "https://example.invalid", updatedAt: "2025/01/01", prices: { trendPrice: trend } };
      } else {
        card.cardmarket = {
          url: "https://example.invalid",
          updatedAt: "2025/01/01",
          prices: {
            averageSellPrice: r2(trend * 1.03),
            lowPrice: r2(trend * 0.7),
            trendPrice: trend,
            avg1: r2(trend * (0.95 + R() * 0.1)),
            avg7: r2(trend * (0.92 + R() * 0.12)),
            avg30: r2(trend * (0.85 + R() * 0.25)),
            reverseHoloTrend: ["Common", "Uncommon", "Rare"].includes(rarity) ? r2(trend * (1.5 + R() * 3)) : undefined,
          },
        };
      }
      cards.push(card);
    }
  }
  return cards;
}

export const FIX_CARDS = Object.fromEntries(FIX_SETS.map((s) => [s.id, makeCards(s)]));

export const setsPayload = () => {
  const data = FIX_SETS.map((s) => ({
    ...s,
    total: FIX_CARDS[s.id].length,
    printedTotal: FIX_CARDS[s.id].length - 3,
    images: { symbol: `${IMG}/${s.id}/symbol.png`, logo: `${IMG}/${s.id}/logo.png` },
  })).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return { data, page: 1, pageSize: 250, count: data.length, totalCount: data.length };
};

// Responde a una URL de la API como lo haría pokemontcg.io (solo lo que usa el juego).
// Devuelve { status, body } o null si la ruta no existe.
export function apiResponse(url) {
  const u = new URL(url);
  const path = u.pathname.replace(/\/+$/, "");
  if (path === "/v2/sets") return { status: 200, body: setsPayload() };
  if (path === "/v2/cards") {
    const q = u.searchParams.get("q") || "";
    const m = q.match(/set\.id:([\w.-]+)/);
    const all = m ? FIX_CARDS[m[1]] || [] : [];
    const pageSize = Math.min(250, +u.searchParams.get("pageSize") || 250);
    const page = Math.max(1, +u.searchParams.get("page") || 1);
    const data = all.slice((page - 1) * pageSize, page * pageSize);
    return { status: 200, body: { data, page, pageSize, count: data.length, totalCount: all.length } };
  }
  return null;
}

// Id de API → set de la URL de cartas (para simular fallos de un set concreto)
export const setIdOfUrl = (url) => {
  const m = decodeURIComponent(url).match(/set\.id:([\w.-]+)/);
  return m ? m[1] : null;
};
