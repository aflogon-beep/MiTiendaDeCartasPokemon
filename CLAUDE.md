# Pokémon Card Shop

Juego de gestión de una tienda de cartas Pokémon con cartas y precios reales (pokemontcg.io / Cardmarket). Canvas 2D + HTML/CSS/JS sin frameworks, en un **proyecto Vite con módulos ES**. Se juega sobre todo en un **móvil Android (Xiaomi)**, instalado como app (PWA) desde GitHub Pages.

## Estado del proyecto

| Fase | Estado |
|---|---|
| R0 · Base y tests (Vite, Vitest, Playwright, API simulada) | ✅ |
| R1 · Mismo juego servido por Vite | ✅ |
| R2 · Separar en módulos | ✅ |
| R3 · Limpieza (duplicados, código muerto, CSS por zonas, Prettier) | ✅ |
| R4 · App instalable (PWA) | ✅ |
| Fase I · Intro, título, ranuras, historia, Emma, frases y visitas de papá (`docs/intro/`) | ✅ |
| Mejoras · Cartas gradeadas en su funda; aviso «Actualizar» con versión nueva | ✅ |
| Mejoras · Interruptor de vibración; Emma y Álvaro en la tienda | ✅ |
| Mejoras · Carga, título, «Prepara tu aventura» e historia más vistosos; bocadillos en la tienda; compartir partida; lista de deseos | ✅ |
| Mejoras · Botones en cuadrícula, velocidades 1,25×/1,5×, alertas de precio y recordatorio de copia | ✅ |
| Mejoras · Ticket con motivos de los que se van, desbloqueos por nivel (colecciones por época) y limpieza | ✅ |
| Mejoras · Sello de récord en el ticket, Álvaro con ojos de estrella y mesa de juego con jugadores | ✅ |
| Mejoras · Más frases de Emma, Álvaro y papá (varias por situación y situaciones nuevas) | ✅ |
| Mejoras · El nivel nunca baja; botón «atrás»; con cajero, las ofertas esperan aparte («📥 N ofertas esperando») | ✅ |
| Mejoras · Botones verde/gris/rojo; rediseño de Stock, Mejoras, Retos, colección y ficha de carta | ✅ |
| Mejoras · Sobre imitado (logo e ilustración reales), tarjetas con el color de la colección y banners con Emma, Álvaro y papá | ✅ |
| R5 · TypeScript | ⏸️ En pausa (decisión de Alberto; no es obligatoria) |
| R6 · Compartir `core/` con el proyecto 3D | ⏸️ En pausa (opcional) |

Pendiente: `docs/pendientes.md` §6 (la app se cerraba sola en el móvil: causa probable, el gesto «atrás»; arreglado en `ui/back.js`, falta que Alberto lo confirme; registro en `ui/diag.js`). §1, §2, §4 y §5 arreglados. Por hacer, cuando Alberto quiera: el guion de la Fase II de la historia.

## Reglas

- **Lo que ya existía se comporta igual.** Las funciones nuevas (como la Fase I) sí cambian el juego, pero solo en lo que se pidió. Si ves un error o algo mejorable fuera de lo pedido, **apúntalo en `docs/pendientes.md` y pregunta**; no lo arregles de paso.
- Ante cualquier duda de comportamiento, textos o aspecto: **pregunta antes de decidir**.
- Nada de textos que describan animaciones que no existen: si algo se cuenta, se ve (o no se pone).
- Cada paso termina con `npm test` en verde y un commit pequeño en español. Al acabar algo visible: resumen con capturas (móvil 390 px).
- Rendimiento: el juego debe ir igual de fluido en el móvil. Si algo empeora, avisa.

## Fuente de verdad

- El juego es el código de `src/`. `reference/pokemon-card-shop-v22.html` es la versión original (antes del refactor): sirve para los tests que comparan con ella (`npm run test:ref` y el test 14 de estilos).
- `docs/intro/` (INTRO.md, HISTORIA.md, personajes.html): especificación de la Fase I, el guion y los personajes.
- `docs/app.md`: instalar la app, funcionamiento sin red y actualizaciones.

## Stack

- **Vite + JavaScript (módulos ES)**. Sin frameworks de interfaz: HTML/CSS y el sistema de acciones `data-a` / objeto `A` (`ui/actions.js`; otros módulos añaden las suyas con `Object.assign(A, …)`).
- **vite-plugin-pwa**: manifest, service worker y aviso de versión nueva (`ui/update.js`, modo «prompt»).
- **Vitest** (lógica) y **Playwright** (juego en el navegador). **Prettier** (`npm run format`).
- Publicación en **GitHub Pages** con GitHub Actions (`.github/workflows/deploy.yml`: tests, build y despliegue).

## Estructura

```
index.html
src/
  main.js                arranque (carga de cartas, título), bucle del juego, eventos del bus
  debug.js               window.__pcs para los tests
  core/                  lógica: NO toca DOM ni canvas
    state.js             S, G (variables que se reasignan), partida nueva, ensure()
    save.js slots.js     guardado por ranuras (3), exportar/importar
    bus.js               eventos (toast, sfx, quip…) para que core no dependa de ui
    cards/ customers/    API y caché de cartas; clientes (con cajero, los que venden, cambian o traen lote esperan aparte: «aside»/«offer», `offers()`)
    quips.js             frases de Emma y Álvaro y visitas de papá: varias por situación (la 1.ª, la del guion; luego al azar sin repetir, S.quipV)
    wish.js              lista de deseos (S.wish): avisos si un cliente o un lote trae una carta
    alerts.js            alertas de precio (S.palert) y recordatorio de copia (S.bkpAt, 7 días reales)
    unlocks.js           desbloqueos por nivel: colecciones por época (1 · 3 · 5) y aviso «🔓 ¡Nivel N!» (S.lvSeen)
    dirt.js              suciedad en el suelo (S.dirt): se recoge tocándola; −3 % clientes por cosa (máx. −24 %)
    tables.js            mesa de juego: grupos de 2 o 4 juegan y pagan 2 € por jugador y partida; a veces compran (players, no se guardan)
    …                    economía, sobres, tratos, lotes, gradeo, misiones, rival, ladrón, día…
  world/                 layout.js (LAY…), nav.js (A*)
  render/                canvas, cámara, tienda, ciudad, gente, coches, luz, efectos
    characters.js        Emma, Álvaro y papá (drawPortrait, drawMini, charFace)
    family.js            Álvaro (caja; con cajero contratado, pasea; ojos de estrella con una carta rara) y Emma (mesa del ordenador ↔ sofá)
    tables.js            jugadores de la mesa de juego y las cartas que juegan
  story/script.js        guion de la historia de inicio, como datos
  ui/
    title.js             pantalla de carga, título, ranuras, «Prepara tu aventura», importar
    story.js             reproductor de la historia (escenas, bocadillo, nombre de la tienda)
    quips.js             bocadillos de frases y visita de papá
    slab.js              funda de plástico de las cartas gradeadas
    update.js            aviso «Actualizar», con la versión nueva y la que tienes (version.json)
    packart.js           sobre imitado: bordes dentados, brillo, logo oficial (sd.logo) e ilustración de la carta estrella
    hero.js              banners con Emma, Álvaro o papá en Stock, Mejoras, Retos y Cartas (data-fase)
    version.js           versión del juego = fecha del último commit (__BUILD__; mismo código, misma versión); se ve en Más → Ajustes
    diag.js              registro de cierres (pcs-diag-v1): si la app se cierra sola, al volver sale un aviso con los datos
    back.js              botón «atrás» de Android en la app instalada: cierra el panel; sin nada abierto, avisa antes de salir
    tutorial.js          tutorial con Emma
    screens/ …           paneles del juego
  audio/sfx.js
  styles/                01-base … 08-tutorial (juego) · 09-title · 10-story (Fase I)
public/icons/            iconos de la app (se generan con docs/icono/iconos.py)
tests/
  e2e/                   Playwright: 01–13 (tabla original), 14 estilos, 15 PWA, 16–19 Fase I, 20 mejoras
  unit/                  Vitest
  fixtures/              API simulada de pokemontcg.io y partida exportada de la v22
reference/pokemon-card-shop-v22.html
docs/                    pendientes.md, app.md, intro/, icono/
```

**Dependencias permitidas:** `core` → solo `core` y `world`. `render` → `core`, `world`. `ui` → todo. Nunca `core` → `ui`/`render`: si `core` necesita avisar (un toast, un sonido, una frase), emite un evento por `bus.js` (`ui.toast(…)`, `ui.quip("thief")`).

## Estado global

- `S.lvMax`: nivel más alto alcanzado. **El nivel nunca baja** (decisión de Alberto): `level()` devuelve este aunque la empresa valga menos tras gastar en mejoras. Partidas de antes: arranca en `S.lvSeen`.
- `S.held`: sobres y productos que llevan los clientes a la caja (`holdNote`); al cargar vuelven al stock (`releaseHolds`, junto con las cartas de vitrina apartadas).
- `S.recInc`: récord de ventas de un día (sello «¡RÉCORD!» en el ticket; el primer día no cuenta).
- `S.wish`: ids de las cartas de la lista de deseos (se crea al añadir la primera).
- `S.meSet`: lo elegido en Personalizar para Álvaro (solo lo que se ha tocado; `""` = lo suyo). Las partidas de antes solo tienen `S.me`: `meSetOf()` lo deduce.
- `S`: objeto con identidad estable. Para cargar una partida, `replaceState(obj)`. Nada de `S = …`.
- `custs`, `queue`: arrays que se mutan en sitio.
- Lo que se reasigna va en `G` (`G.M`, `G.deal`, `G.SLOT`, `G.TITLE`, `G.STORY`…).
- **Los nombres exportados deben ser únicos en todo `src/`**: `window.__pcs` busca cada nombre en todos los módulos (si hay dos iguales, los tests encuentran el que no es).
- No renombres funciones ni variables del juego sin motivo: minimiza el diff.

## Compatibilidad obligatoria

- **localStorage**: la ranura 1 usa la clave de siempre (`pcs-save-real-v3` / `pcs-save-offline-v3`); las ranuras 2 y 3, la misma con `-s2` / `-s3`; `pcs-slots-v1` recuerda la última ranura. También `pcs-sets-v1`, `pcs-sound`, `pcs-music`, `pcs-vibe` (nueva: vibración) y `pcs-diag-v1` (registro de cierres, `ui/diag.js`). **IndexedDB** `pcs`, almacén `kv`. La partida de Alberto debe cargarse tal cual.
- Formato de exportación: `{app:"pcs", v:5, mode, date, S}`.
- Red: solo `api.pokemontcg.io`, `images.pokemontcg.io` y Google Fonts.

## Tests

`npm test` = Vitest + Playwright contra la versión de Vite. `npm run test:ref` = los mismos tests de juego contra el HTML original. Detalles en `tests/README.md`. Claves:

- **API simulada** (`tests/fixtures/api.js`): sets y cartas inventados; imágenes con un PNG genérico.
- **Los tests saltan el título y la historia**: `openGame` pone `window.__pcsSkipTitle` y el juego entra directo en la última partida, como antes de la Fase I. Para probar el título: `openGame(page, gamePath, { title: true })`.
- **Service worker bloqueado** en todos los tests salvo el 15 (`serviceWorkers: "block"`).
- **Test 14 (estilos)**: compara los estilos calculados de 44 pantallas con el HTML original. Lo nuevo que aparece dentro de pantallas de siempre lleva **`data-fase="I"`** y se quita antes de comparar; así lo de siempre se sigue comparando. Si añades algo visible a una pantalla existente, márcalo igual. Si una mejora pedida cambia el estilo de un elemento de siempre, márcalo con **`data-mejora`** (el test quita el atributo antes de comparar). En la versión de Vite, el test 14 también pone `G.noLocks` (colecciones sin candado, como en el original). Las mejoras generales de estilo van bajo **`html.ux`** (p. ej. los botones de los paneles en cuadrícula); el test quita la clase antes de comparar. Con la tienda abierta ya no hay texto de ayuda (`html.no-hint`) y la tienda es 58 px más alta (test 6). La tarjeta de cada sobre en Stock (`.stk`) y las pantallas de `REDISENO` (Stock, Mejoras, Stock · sellado y accesorios, Tareas, Cartas, ficha de carta) se rediseñaron a petición de Alberto: el test 14 no compara su contenido.
- Test 5: en Vite pasa y es estricto (`docs/pendientes.md` §1 arreglado; con colas largas, los que no caben esperan cerca del final de la fila: `queueSpot` en `world/nav.js`). En la referencia, `test.fail()`. Test 4: 2 reintentos (partida con azar).

## Forma de trabajar

- Antes de algo grande: plan breve y lista de archivos.
- Commits pequeños en español; push a la rama de trabajo. No crear PR ni unir ramas sin que Alberto lo pida.
- Al acabar: resumen, cómo probarlo, capturas y estado de los tests.
