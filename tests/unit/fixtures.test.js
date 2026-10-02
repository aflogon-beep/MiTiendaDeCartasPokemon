import { describe, it, expect } from "vitest";
import { FIX_SETS, FIX_CARDS, apiResponse, setsPayload, setIdOfUrl } from "../fixtures/api.js";

const API = "https://api.pokemontcg.io/v2/";
const cardsUrl = (id, page = 1, size = 250) =>
  `${API}cards?q=set.id:${id}&pageSize=${size}&page=${page}&select=id,name,number,rarity,images,cardmarket,hp,types,supertype`;

describe("API simulada de pokemontcg.io", () => {
  it("tiene los 3 sets por defecto del juego y alguno más", () => {
    const ids = FIX_SETS.map((s) => s.id);
    expect(ids.slice(0, 3)).toEqual(["sv3pt5", "sv8pt5", "sv3"]);
    expect(ids.length).toBeGreaterThan(3);
  });

  it("los sets por defecto suman más de 100 cartas (si no, el juego pasa a modo sin conexión)", () => {
    const n = ["sv3pt5", "sv8pt5", "sv3"].reduce((a, id) => a + FIX_CARDS[id].length, 0);
    expect(n).toBeGreaterThanOrEqual(100);
    // y también con uno de ellos caído
    expect(n - FIX_CARDS.sv8pt5.length).toBeGreaterThanOrEqual(100);
  });

  it("cada set tiene rarezas variadas, ids únicos y precios de Cardmarket", () => {
    for (const [id, cards] of Object.entries(FIX_CARDS)) {
      const rar = new Set(cards.map((c) => c.rarity));
      for (const r of ["Common", "Uncommon", "Rare", "Double Rare", "Illustration Rare", "Ultra Rare", "Special Illustration Rare", "Hyper Rare"]) expect(rar.has(r), `${id} sin ${r}`).toBe(true);
      expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
      const priced = cards.filter((c) => c.cardmarket && c.cardmarket.prices.trendPrice > 0);
      expect(priced.length).toBeGreaterThan(cards.length * 0.8);
      expect(cards.some((c) => !c.cardmarket)).toBe(true); // sin precio: el juego usa el de la rareza
    }
  });

  it("es determinista (mismos datos en cada ejecución)", async () => {
    const again = await import("../fixtures/api.js?otra=1");
    expect(again.FIX_CARDS).toEqual(FIX_CARDS);
  });

  it("responde a /sets como la API real", () => {
    const r = apiResponse(`${API}sets?select=id,name,series,releaseDate,total,printedTotal,images&orderBy=-releaseDate&pageSize=250`);
    expect(r.status).toBe(200);
    expect(r.body).toEqual(setsPayload());
    const dates = r.body.data.map((s) => s.releaseDate);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(r.body.data[0]).toHaveProperty("images.symbol");
  });

  it("responde a /cards filtrando por set y paginando", () => {
    const all = apiResponse(cardsUrl("sv3")).body;
    expect(all.totalCount).toBe(FIX_CARDS.sv3.length);
    expect(all.data.every((c) => c.id.startsWith("sv3-"))).toBe(true);
    const p1 = apiResponse(cardsUrl("sv3", 1, 25)).body, p3 = apiResponse(cardsUrl("sv3", 3, 25)).body;
    expect(p1.data).toHaveLength(25);
    expect(p3.data.map((c) => c.id)).toEqual(FIX_CARDS.sv3.slice(50, 75).map((c) => c.id));
    expect(apiResponse(cardsUrl("noexiste")).body.data).toEqual([]);
    expect(apiResponse(`${API}otra`)).toBeNull();
  });

  it("sabe a qué set va una URL de cartas (para simular fallos)", () => {
    expect(setIdOfUrl(cardsUrl("sv8pt5"))).toBe("sv8pt5");
    expect(setIdOfUrl(encodeURI(cardsUrl("fx4")))).toBe("fx4");
    expect(setIdOfUrl(`${API}sets`)).toBeNull();
  });
});
