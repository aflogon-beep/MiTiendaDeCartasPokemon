# Pokémon Card Shop — Refactor a módulos

Juego de gestión de una tienda de cartas Pokémon con cartas y precios reales (pokemontcg.io / Cardmarket). Hoy es **un único HTML** (`reference/pokemon-card-shop-v22.html`, canvas 2D + HTML/CSS/JS sin frameworks). Funciona bien y se juega sobre todo en un **móvil Android (Xiaomi)**.

## Objetivo

Pasar el juego a un **proyecto Vite con módulos ES**, separando lógica, dibujo e interfaz, **sin cambiar nada de lo que hace el juego**.

## Regla de oro

**Refactor = mismo comportamiento.** Ni reglas nuevas, ni textos distintos, ni cambios de equilibrio o de aspecto.
- Si ves un error o algo mejorable, **apúntalo en `docs/pendientes.md` y pregunta**; no lo arregles de paso.
- Cada paso termina con `npm test` en verde y un commit pequeño.

## Fuente de verdad

- `reference/pokemon-card-shop-v22.html` es el juego completo. Antes de mover algo, léelo ahí.
- El archivo se construyó **por capas de versiones** (bloques `/* V11 … */` hasta `/* V22 … */`). Muchas funciones de bloques antiguos se **redefinen o amplían** en bloques posteriores (`Object.assign(LTK,…)`, `Object.assign(ICON,…)`, `LAY.shelf` sobrescrito, `paintNav`/`mMore`/`mColl` reescritos…). **La versión que cuenta es la última definición.** Al separar, conserva solo esa, sin duplicados.

## Stack

- **Vite + JavaScript (módulos ES)** en la fase de refactor. TypeScript llega después (fase R5), no antes.
- Sin frameworks de interfaz: se mantiene el HTML/CSS actual y el sistema de acciones `data-a` / objeto `A`.
- **Vitest** para tests de lógica y **Playwright** para tests del juego en el navegador.
- Publicación en **GitHub Pages** con GitHub Actions.

## Estructura objetivo

```
index.html
src/
  main.js                arranque: carga de cartas, partida, bucle
  core/                  lógica pura: NO toca DOM ni canvas
    state.js             objeto S, partida nueva, ensure()/migraciones
    save.js              guardado localStorage, exportar/importar, backup
    constants.js         DAYLEN, RENT, LV, RAR/RMAP, DECOR, STAFF, CT…
    rng.js               rnd, pick, wpick, srand
    bus.js               emisor de eventos (toast, sfx, vibe…) para que core no dependa de ui
    cards/               api.js (pokemontcg.io), cache.js (IndexedDB), sets.js, prices.js
    packs.js             eraCfg, roll (sin repetidas), calcEV, refreshPacks
    economy.js           precios, tolMul/patMul/spMul, accP y etiquetas de precio, netWorth, level
    customers/           spawn.js, decide.js, move.js (updateCusts), checkout.js
    deals.js lots.js fakes.js grading.js orders.js
    missions.js achievements.js medals.js story.js regulars.js
    events.js rival.js market.js theft.js trophies.js
    difficulty.js stats.js tips.js gift.js minigames.js delivery.js
  world/
    layout.js            LAY, LUX, TROPHY, AX(), constantes de ciudad (CX0…)
    nav.js               cuadrícula, A*, routeTo
  render/
    canvas.js camera.js  VIEW, fitCanvas, zoom, cámara automática
    shop.js people.js city.js cars.js lighting.js bloom.js effects.js weather.js
  ui/
    hud.js nav.js toast.js modals.js actions.js
    screens/             stock.js cards.js cardSheet.js album.js retos.js more.js stats.js…
    packOpening.js checkout.js inspect.js tutorial.js customize.js
  audio/sfx.js
  styles/                CSS dividido por zonas (base, hud, sheets, cards, pack…)
tests/
  e2e/                   Playwright
  unit/                  Vitest
  fixtures/              API simulada de pokemontcg.io (sets y cartas inventados)
reference/pokemon-card-shop-v22.html
docs/pendientes.md
```

**Dependencias permitidas:** `core` → solo `core` y `world`. `render` → `core`, `world`. `ui` → todo. Nunca `core` → `ui`/`render`: si `core` necesita avisar (un toast, un sonido), emite un evento por `bus.js`.

## Estado global: cómo mover sin romper

El juego usa globales (`S`, `M`, `VIS`, `custs`, `queue`, `deal`, `LOT`, `CK`…).
- Exporta cada uno desde un módulo y **no lo reasignes nunca desde fuera**: los imports de ES son de solo lectura.
- `S`: objeto con identidad estable. Para cargar una partida usa `replaceState(obj)`, que vacía y hace `Object.assign`. Nada de `S = …`.
- Arrays como `custs` y `queue`: se mutan en sitio (`length = 0`, `push`, `splice`).
- Variables sueltas que se reasignan (`M`, `deal`, `LOT`, `CK`, `speed`, `paused`…): agrúpalas en un objeto `G` exportado (`G.M`, `G.deal`…). Este es el único cambio de nombres permitido en el refactor.
- **No renombres** el resto de funciones ni variables (`mColl`, `tipsList`, `S.lt.psold`…): minimiza el diff.

## Compatibilidad obligatoria

- Mismas claves de **localStorage** (`pcs-save-real-v3`, `pcs-save-offline-v3`, `pcs-sets-v1`…) y misma base **IndexedDB** (`pcs`, almacén `kv`). La partida de Alberto debe cargarse tal cual.
- Mismo formato de exportación: `{app:"pcs", v:5, mode, date, S}`.
- Red: solo `api.pokemontcg.io`, `images.pokemontcg.io` y Google Fonts.

## Red de seguridad (antes de mover nada)

Tests de Playwright contra la **API simulada** (`tests/fixtures`: interceptar `https://api.pokemontcg.io/**` con sets y cartas inventados, rarezas variadas y precios `cardmarket`; imágenes con un PNG genérico). Se ejecutan primero contra `reference/…v22.html` (deben pasar) y después contra la versión de Vite.

| # | Test | Comprueba |
|---|---|---|
| 1 | Arranque | Carga los 3 sets por defecto, sin errores de consola |
| 2 | Tutorial completo | Los 12 pasos avanzan hasta el final |
| 3 | Día completo | Con cajero: abrir, clientes, cierre, ticket del día |
| 4 | Simulación de 14 días | Bot que repone, pone precios recomendados, llena la vitrina y cobra. En Normal llega a nivel 2 antes del día 7 y la empresa crece (rangos amplios: hay azar) |
| 5 | Navegación | Con todo el mobiliario y la ampliación: 0 clientes dentro de obstáculos |
| 6 | Móvil 360 y 390 px | Sin desbordamiento horizontal; la tienda mide lo mismo abierta y cerrada |
| 7 | Sobres | 300 sobres sin cartas repetidas dentro del mismo |
| 8 | Falsas | La inspección marca pistas y una falsa falla en 2 de 3 pruebas |
| 9 | Favoritas | No se venden, no van a la vitrina, no se roban |
| 10 | Ladrón | Se puede pillar (recupera la carta) y escapar (se pierde); máximo 1 al día |
| 11 | Importar partida | Un JSON exportado desde la v22 carga sin pérdidas |
| 12 | Colecciones | La lista y los sets fallidos se reintentan; aviso y botón visibles |
| 13 | Modo ahorro | Con FPS bajos se activa solo |

Además, tests de Vitest para la lógica pura según se vaya extrayendo: `roll`, `accP`, `tipsList`/`dedupTips`, `navPath`, `makeDeal` según la dificultad, `rivalUpd`, `level`, guardado e importación.

## Fases (no avanzar sin que Alberto valide la anterior)

**R0 · Base y tests.** Vite, Vitest, Playwright, la API simulada y los 13 tests **pasando contra el HTML de referencia**.

**R1 · Mismo juego, servido por Vite.** CSS a `src/styles/`, JS a un único `src/legacy.js` sin cambios, HTML limpio. Tests en verde. Deploy a GitHub Pages.

**R2 · Separar en módulos.** En este orden, con tests en verde tras cada paso:
1. constantes, rng y datos de cartas
2. estado y guardado
3. lógica de juego (economía, clientes, eventos…)
4. navegación y mundo
5. dibujo
6. interfaz

**R3 · Limpieza.** Quitar duplicados de las capas de versiones, código muerto e imports sobrantes. Sin cambiar comportamiento.

**R4 · App.** PWA instalable en el móvil (opcional).

**R5 · TypeScript poco a poco.** Empezar por el tipo de `S` y `core/`.

**R6 · (Opcional) Compartir `core/` con el proyecto 3D** (Three.js), como paquete o carpeta común.

## Forma de trabajar

- Antes de cada fase: plan breve y lista de archivos que vas a tocar.
- Commits pequeños en español, uno por módulo movido.
- Al acabar cada fase: resumen, cómo probarlo y estado de los tests.
- Rendimiento: el juego debe ir igual de fluido en el móvil. Si algo empeora, avisa.
- Ante cualquier duda sobre comportamiento: **pregunta antes de decidir**.
