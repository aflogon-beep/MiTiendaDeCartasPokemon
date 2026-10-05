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
| `e2e/14-estilos.spec.js` | Compara los estilos calculados de todos los elementos (también `::before`/`::after`) entre Vite y la referencia en 44 pantallas y dos tamaños. Solo se ejecuta en el proyecto `vite` (abre las dos versiones a la vez). Con `margin: auto`, Chrome a veces informa 0px en vez del margen calculado: si solo difieren los márgenes laterales y la caja está en el mismo sitio, no cuenta como diferencia. |
| `e2e/15-pwa.spec.js` | App instalable: manifest e iconos, service worker activo y el juego vuelve a abrir sin red (con las cartas de IndexedDB). Solo en el proyecto `vite`. |
| `e2e/16-ranuras.spec.js` | Fase I · ranuras de partida: una partida guardada por la v22 aparece como ranura 1 con los mismos datos; cambiar de ranura no mezcla partidas y la última usada se recuerda. Solo en el proyecto `vite`. |
| `e2e/17-titulo.spec.js` | Fase I · pantalla de carga y título: primera vez (solo «Nueva partida»), «Continuar», «Cargar partida», sobrescribir y borrar con confirmación, importar en una ranura, volver al título y ajustes rápidos. Solo en el proyecto `vite`. |
| `e2e/18-historia.spec.js` | Fase I · historia de inicio: saltarla y llegar al tutorial con Emma; verla entera tocando (nombre de la tienda en la escena 7, que aparece en el cartel; la mascota elegida); repetirla desde Más sin pedir el nombre; «menos animaciones». Solo en el proyecto `vite`. |
| `e2e/19-frases.spec.js` | Fase I · frases recurrentes (bocadillo con retrato, sin amontonarse, nunca en el tutorial; desde la lógica por el bus y desde los sobres) y visitas de papá (entra, consejo, despedida y se va; también al subir de nivel); frase al subir la persiana y variedad al repetirse (19d). Solo en el proyecto `vite`. |
| `e2e/20-mejoras.spec.js` | Cartas gradeadas en su funda (colección y ficha), aviso de versión nueva con «Actualizar» (guarda la partida antes de recargar) , interruptor de vibración, Álvaro en la caja con lo elegido en Personalizar (con cajero, el cajero en la caja y Álvaro paseando) y Emma (mesa del ordenador ↔ sofá); título y carga, «Prepara tu aventura», historia a pantalla completa, bocadillos en la tienda, compartir partida y lista de deseos (20g–20l); Stock, velocidades, avisos y alertas (20m–20p); ticket con motivos, desbloqueos por nivel y limpieza (20q–20s); sello de récord en el ticket, Álvaro con ojos de estrella y mesa de juego (20t–20v); registro de cierres (20w), fondos que Android vacía (20aa) botón «atrás» (20x) ofertas aparte con cajero (20y) y versión del juego (20z). Solo en el proyecto `vite`. |
| `e2e/21-funkos.spec.js` | Zona Funko · F1: la librería se traspasa a nivel 5 (sin dinero no se compra), se compra, se le pone nombre, tocar la zona abre su ficha y se guarda al recargar (21a); Emma en su sofá: despierta, tocarla no hace nada; dormida, se despierta con una frase, se tumba a ver la tele y se vuelve a dormir (21b); Stock → Funkos: pedir, llegar, reponer y ficha (21c); clientes que compran en la zona y ticket (21d); Mejoras, Chase, quien vende un Funko y evento (21e). Solo en el proyecto `vite`. Lógica en `unit/funko-zona.test.js`. |
| `e2e/22-nube.spec.js` | Partida en la nube contra un Supabase simulado (`fixtures/supa.js`): crear cuenta (errores en español), subir, subida al terminar el día, sin red queda pendiente y se sube al volver (22a); aviso «Hay otra partida en la nube», seguir con esta, cargar una copia y cerrar sesión (22b); con cuenta, los errores van a la tabla `logs` (22c); se suben también las otras ranuras sin pisar las de otro dispositivo (22d); ranking por valor de la empresa con las filas propias resaltadas (22e). Solo en el proyecto `vite`. Lógica en `unit/nube.test.js`. |
| `unit/` | Tests de Vitest de la lógica pura (`core/` y `world/`) y de la API simulada. |

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
- **El bot recoge la suciedad** (solo en Vite, `core/dirt.js`), como haría un jugador; si no, entrarían menos clientes.
- **TPV en el bot.** El cobro con tarjeta anima unos 1,8 s reales. El bot teclea el importe exacto y aplica directamente lo mismo que hace `A.ckok()` al terminar (`track("cardpay")` + `finishCK`). El efectivo sí pasa por `A.ckgive()` con el cambio exacto.
- **Test 4 y el azar.** Sin cobrar las misiones, el bot llegaba a nivel 2 el día 7 en ~1 de cada 6 partidas (también con la referencia). Cobrándolas, como haría un jugador, llega casi siempre el día 4 o 5; aun así, alguna vez (≈1 de cada 5) tiene mala racha y llega el día 7, así que el test 4 tiene 2 reintentos.
- **Azar.** El juego no tiene semilla. Los tests de simulación usan rangos amplios, y los de probabilidad (sobres, ladrón, falsas) muchas repeticiones.
- **Modo ahorro (test 13).** Para simular un móvil lento, cada fotograma tarda unos 45 ms más (se envuelve `requestAnimationFrame` desde el test, sin tocar el juego).
- **Service worker.** Todos los tests lo bloquean (`serviceWorkers: "block"` en `playwright.config.js`) para que la red simulada vea todas las peticiones; solo el test 15 lo activa.
- **Pantalla de título.** `openGame` la salta (pone `window.__pcsSkipTitle`) y el juego entra directo en la última partida, como antes de la Fase I. Para probar el título: `openGame(page, gamePath, { title: true })`.
- **Test 14 y la Fase I.** Lo nuevo de la Fase I que aparece dentro de las pantallas de siempre lleva `data-fase="I"` y el test 14 lo quita antes de comparar con la referencia.
