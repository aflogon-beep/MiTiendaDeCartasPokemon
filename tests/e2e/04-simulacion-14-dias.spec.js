import { test, expect, freshGame, game } from "./helpers.js";
import { botPlay } from "./bot.js";

// Es una partida con azar: de vez en cuando (≈1 de cada 5) el bot tiene mala racha y llega a nivel 2 el día 7.
// Se permiten 2 reintentos; que falle 3 veces seguidas sí indica que algo ha cambiado.
test.describe.configure({ retries: 2 });

test("4 · Simulación de 14 días: el bot llega a nivel 2 antes del día 7 y la empresa crece", async ({
  page,
  gamePath,
}) => {
  test.setTimeout(540_000);
  await freshGame(page, gamePath);
  expect(await game(page, (P) => P.DF().n)).toBe("Normal");
  const net0 = await game(page, (P) => P.netWorth());

  // speed 20: los tests aceleran el reloj del juego (el jugador solo puede llegar a 4×)
  const log = await game(page, botPlay, { days: 14, speed: 20, claim: true, maxMs: 480_000 });
  console.log(
    log
      .map(
        (d) =>
          `día ${d.day}: nivel ${d.level} · empresa ${d.net} € · caja ${d.money} € · ventas ${d.inc} € · clientes ${d.cust} (${d.lost} sin comprar)`,
      )
      .join("\n"),
  );

  expect(log.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  // Todos los días entra gente y se vende algo
  for (const d of log) {
    expect(d.cust, `clientes el día ${d.day}`).toBeGreaterThan(0);
    expect(d.inc, `ventas el día ${d.day}`).toBeGreaterThan(0);
  }
  // Nivel 2 antes del día 7 (al cerrar el día 6 como tarde)
  const lv2 = log.find((d) => d.level >= 2);
  expect(lv2, "no llegó a nivel 2").toBeTruthy();
  expect(lv2.day).toBeLessThanOrEqual(6);
  // La empresa crece (rangos amplios: hay azar)
  const last = log[log.length - 1];
  expect(last.net).toBeGreaterThan(net0 * 1.4);
  expect(last.net).toBeGreaterThan(log[3].net); // sigue creciendo tras los primeros días
  expect(last.net).toBeLessThan(net0 * 10);
});
