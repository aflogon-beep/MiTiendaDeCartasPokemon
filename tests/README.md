# Tests

```bash
npm install
npm test            # Vitest (tests/unit) y Playwright (tests/e2e) contra la versión de Vite
npm run test:unit   # solo Vitest
npm run test:e2e    # solo Playwright, versión de Vite
npm run test:ref    # Playwright contra el HTML de referencia
npx playwright test 04 --project=vite   # un test concreto (por nombre de archivo)
```

Playwright tiene dos proyectos con los mismos tests:
- **`vite`**: compila el juego (`vite build`) y lo sirve con `vite preview`. Es la versión que se refactoriza.
- **`referencia`**: `reference/pokemon-card-shop-v22.html`, servido tal cual por `tests/static-server.js`.

## Estructura

| Ruta | Qué es |
|---|---|
| `fixtures/api.js` | API simulada de pokemontcg.io: 6 sets inventados (los 3 primeros con los ids de los sets por defecto: `sv3pt5`, `sv8pt5`, `sv3`), 61 cartas por set con rarezas variadas y precios `cardmarket`. Determinista. |
| `fixtures/carta.png` | PNG genérico que se devuelve para cualquier imagen de `images.pokemontcg.io`. |
| `fixtures/partida-v22.json` | Partida exportada desde la v22 (Más → Partida → Exportar) jugando contra la API simulada. La usa el test 11. |
| `e2e/helpers.js` | Abrir el juego con la red simulada, saltar el tutorial, cerrar paneles y acceder a las variables del juego. |
| `e2e/bot.js` | Bot jugador de los tests 4 y 5: repone, pone precios recomendados, llena la vitrina y cobra (en el test 4 también las misiones). |
| `e2e/01…13-*.spec.js` | Los 13 tests de la tabla de `CLAUDE.md`. |
| `unit/` | Tests de Vitest. De momento, los de la API simulada. Irán creciendo con la lógica pura extraída en R2. |

## Red

Cada test intercepta toda la red: la API (`api.pokemontcg.io`) responde con `fixtures/api.js`, las imágenes con el PNG genérico y Google Fonts con una hoja vacía. Cualquier otro host se bloquea y queda registrado: el test 1 comprueba que no hay ninguno. Con `mockNetwork(page, { failList: true, failSets: ["sv8pt5"] })` se simulan caídas de la API (test 12).

## Acceso a las variables del juego: `window.__pcs`

Los tests leen y cambian el estado del juego a través de `window.__pcs`:

```js
__pcs.S.money      // leer
__pcs.speed = 40   // escribir (solo los tests aceleran así el reloj del juego)
__pcs.spawn()      // llamar
```

- **Referencia:** son variables globales de un `<script>` clásico, y `helpers.js` las expone con un `Proxy` y `eval` indirecto.
- **Vite:** `src/main.js` crea `window.__pcs` con `src/debug.js`. Busca cada nombre primero en `G` (las variables que se reasignan: `M`, `speed`, `collSel`…) y después en los exports de todos los módulos. Así `__pcs.M` sigue funcionando aunque en el código sea `G.M`.

## Notas

- **Velocidad.** El jugador puede llegar a 4×. Los tests 4 y 5 suben `speed` a 20 para simular días enteros en segundos. El juego limita cada fotograma a 0,05 s reales, así que cada paso de la simulación es como mucho de 1 s de juego.
- **El bot va al ritmo del juego.** Actúa una vez por fotograma (con `requestAnimationFrame`), no cada X milisegundos. Así atiende igual de rápido en un ordenador lento (por ejemplo, en GitHub). Antes, con esperas fijas, allí los clientes se cansaban y el test 4 fallaba.
- **TPV en el bot.** El cobro con tarjeta anima unos 1,8 s reales. El bot teclea el importe exacto y aplica directamente lo mismo que hace `A.ckok()` al terminar (`track("cardpay")` + `finishCK`). El efectivo sí pasa por `A.ckgive()` con el cambio exacto.
- **Test 4 y el azar.** Sin cobrar las misiones, el bot llegaba a nivel 2 el día 7 en ~1 de cada 6 partidas (también con la referencia). Cobrándolas, como haría un jugador, llega casi siempre el día 4 o 5.
- **Azar.** El juego no tiene semilla. Los tests de simulación usan rangos amplios, y los de probabilidad (sobres, ladrón, falsas) muchas repeticiones.
- **Modo ahorro (test 13).** Para simular un móvil lento, cada fotograma tarda unos 45 ms más (se envuelve `requestAnimationFrame` desde el test, sin tocar el juego).
