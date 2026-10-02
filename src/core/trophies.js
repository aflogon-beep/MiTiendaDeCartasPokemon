// Sala de trofeos: tus cartas favoritas expuestas.
import { S } from "./state.js";
import { itemVal } from "./economy.js";
export const trophies = () => S.items.filter((i) => i.fav && !i.fkK).sort((a, b) => itemVal(b) - itemVal(a));
export const trophyOn = () => S.items.some((i) => i.fav);
export const trophyRep = () =>
  trophyOn() ? Math.min(5, trophies().filter((i) => itemVal(i) >= 5).length + Math.floor((S.admire || 0) / 8)) : 0;
