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
| Mejoras · Menos clientes y cestas más grandes (≥ 20 €): reputación con techo ×2, máx. 10 dentro, extras en la cesta | ✅ |
| Zona Funko · F1: la librería se traspasa (nivel 5, 15.000 €), Don Ramón, nombre, zona dibujada y Emma en su sofá (`docs/funkos/`) | ✅ |
| Zona Funko · F2–F5: catálogo (220 figuras + Deluxe, grails y oro), stock, venta en la misma caja, encargado, nivel de zona, mobiliario, Chase, olas, eventos, álbum, encargos y logros | ✅ |
| Mejoras · Pantalla de niveles (tocar «Nivel» arriba) y premios en los niveles 4, 6, 8 y 9 | ✅ |
| Nube · Partida online con usuario y contraseña (Supabase), 7 copias por ranura y registro de errores (`docs/nube.md`) | ✅ (probado en el móvil de Alberto) |
| Nube · Las 3 ranuras en la nube, sin recordatorio de copia con la nube al día y 🏆 Ranking en Retos (tabla `ranks`, `docs/nube.md`) | ✅ (tabla creada y probada contra el proyecto de Alberto) |
| Nube · Ranking con 4 pestañas (empresa, carta, colección, Funkos), visitar tiendas y regalar o cambiar cartas y Funkos entre cuentas (tabla `trades`, `core/trade.js`) | ✅ (falta que Alberto ejecute el SQL de `docs/nube.md`) |
| R5 · TypeScript | ⏸️ En pausa (decisión de Alberto; no es obligatoria) |
| R6 · Compartir `core/` con el proyecto 3D | ⏸️ En pausa (opcional) |

Pendiente: nada en `docs/pendientes.md` (todo arreglado y confirmado por Alberto). Por hacer, cuando Alberto quiera: el guion de la Fase II de la historia. Hecha: la **zona Funko**, ampliación de la tienda en el local de la librería (`docs/funkos/DISENO.md`, F1–F5).

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
- `docs/nube.md`: partida en la nube (Supabase): cómo montarlo, el SQL y el aviso diario.
- `docs/funkos/` (DISENO.md, mockups.html, figuras.js, zona.js): diseño aprobado de la zona Funko (ampliación de la tienda), por fases F1–F5.

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
    cloud.js             partida en la nube (Supabase sin librería, con fetch): cuenta (usuario → correo interno), subir/bajar
                         comprimida (gzip), copias, registro de errores; pcs-cloud-v1. Vacío CLOUD_URL = sin nube (no se ve nada)
    trade.js             regalos y cambios entre cuentas: paquetes de carta o Funko, sacar al mandar y meter al aceptar
    bus.js               eventos (toast, sfx, quip…) para que core no dependa de ui
    cards/ customers/    API y caché de cartas; clientes (con cajero, los que venden, cambian o traen lote esperan aparte: «aside»/«offer», `offers()`)
                         menos clientes y cestas grandes: `repMul` (reputación, máx. ×2), `CUST_MAX` (10 dentro), `PQTY` (sobres por tipo)
                         y `addExtras` (sobres y accesorio de más: `c.hold.x`, `c.hold.base` = lo principal, para el regateo)
    quips.js             frases de Emma y Álvaro y visitas de papá: varias por situación (la 1.ª, la del guion; luego al azar sin repetir, S.quipV)
    wish.js              lista de deseos (S.wish): avisos si un cliente o un lote trae una carta
    alerts.js            alertas de precio (S.palert) y recordatorio de copia (S.bkpAt, 7 días reales)
    unlocks.js           desbloqueos por nivel: colecciones por época (1 · 3 · 5) y aviso «🔓 ¡Nivel N!» (S.lvSeen);
                         nivel 4 préstamo de 10.000 €, 6 y 8 reputación (`lvRep` en economy.js), 9 premio de 50.000 € (`lvPrize`)
    dirt.js              suciedad en el suelo (S.dirt): se recoge tocándola; −3 % clientes por cosa (máx. −24 %)
    tables.js            mesa de juego: grupos de 2 o 4 juegan y pagan 2 € por jugador y partida; a veces compran (players, no se guardan)
    funko.js             zona Funko (S.fk): la librería se traspasa a nivel 5 (FK_LV) por 15.000 € (FK_COST), nombre, frases de Emma al despertarla
    funko/               catalog.js (11 colecciones, FIGS/DLX/GRAILS/GOLD, look), zone.js (nivel ⭐, mercado, olas, pedidos,
                         almacén/estanterías/vitrina, encargado, eventos, encargos, álbum, logros, cierre del día),
                         sell.js (clientes de la zona, gancho, torpe, quien vende un Funko)
    …                    economía, sobres, tratos, lotes, gradeo, misiones, rival, ladrón, día…
  world/                 layout.js (LAY…), nav.js (A*)
  render/                canvas, cámara, tienda, ciudad, gente, coches, luz, efectos
    characters.js        Emma, Álvaro y papá (drawPortrait, drawMini, charFace)
    family.js            Álvaro (caja; con cajero contratado, pasea; ojos de estrella con una carta rara) y Emma (mesa del ordenador ↔ sofá;
                         con la zona Funko, en su sofá gamer: jugando → tele tumbada → dormida; tocarla dormida la despierta)
    funkoZone.js         zona Funko en el local de la librería (x 808–1084): caché + neón, tele y portal; escaparate (drawFkFront); FKEMMA
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
    screens/levels.js    niveles de la tienda: al tocar «Nivel N» arriba (qué da cada uno y cuánto falta)
    screens/funko.js     zona Funko: ficha de la librería (fklocal) y poner nombre (fkname), con Don Ramón
    screens/funkoStock.js  Stock → 🧸 Funkos, ficha de figura (fkfig), nivel (fklv), colección (fkcolec), evento (fkev), Chase (fkchase)
    funko/fig.js         dibujo SVG de las figuras (piezas del catálogo y variantes) y de su caja (boxHTML)
    version.js           versión del juego = fecha del último commit (__BUILD__; mismo código, misma versión); se ve en Más → Ajustes
    diag.js              registro de cierres (pcs-diag-v1): si la app se cierra sola, al volver sale un aviso con los datos
                         (con cuenta en la nube, los errores y cierres van también a la tabla logs)
    cloud.js             nube: subida al terminar el día, pendiente sin red, aviso «Hay otra partida en la nube» (cloudCheck)
    screens/cloud.js     pantallas ☁️ Nube (cloud), aviso (cloudnew), 🏆 Ranking con pestañas (rank, en Retos), visita a una
                         tienda (visit), elegir qué mandar (tdgive) y 📬 regalos y cambios (trades)
    back.js              botón «atrás» de Android en la app instalada: cierra el panel; sin nada abierto, avisa antes de salir
    tutorial.js          tutorial con Emma
    screens/ …           paneles del juego
  audio/sfx.js
  styles/                01-base … 08-tutorial (juego) · 09-title · 10-story (Fase I) · 11-funko (zona Funko)
public/icons/            iconos de la app (se generan con docs/icono/iconos.py)
tests/
  e2e/                   Playwright: 01–13 (tabla original), 14 estilos, 15 PWA, 16–19 Fase I, 20 mejoras, 21 zona Funko, 22 nube
  unit/                  Vitest
  fixtures/              API simulada de pokemontcg.io, Supabase simulado (supa.js) y partida exportada de la v22
reference/pokemon-card-shop-v22.html
docs/                    pendientes.md, app.md, intro/, icono/, funkos/
```

**Dependencias permitidas:** `core` → solo `core` y `world`. `render` → `core`, `world`. `ui` → todo. Nunca `core` → `ui`/`render`: si `core` necesita avisar (un toast, un sonido, una frase), emite un evento por `bus.js` (`ui.toast(…)`, `ui.quip("thief")`).

## Estado global

- `S.lvMax`: nivel más alto alcanzado. **El nivel nunca baja** (decisión de Alberto): `level()` devuelve este aunque la empresa valga menos tras gastar en mejoras. Partidas de antes: arranca en `S.lvSeen`.
- `S.held`: sobres y productos que llevan los clientes a la caja (`holdNote`); al cargar vuelven al stock (`releaseHolds`, junto con las cartas de vitrina apartadas).
- `S.recInc`: récord de ventas de un día (sello «¡RÉCORD!» en el ticket; el primer día no cuenta).
- `S.wish`: ids de las cartas de la lista de deseos (se crea al añadir la primera).
- `S.fk`: zona Funko; no existe hasta comprar el local. `name`, `since`, `u` (unidades: f, v variante, d dañada, p protector, at a|s|v|m|h), `mk` (mercado), `wv`/`wd`/`vd` (olas y descatalogados), `pp` (precios), `del` (pedidos), `xp`/`lv` (nivel de la zona, no baja), `mob` (muebles), `stf`/`bud` (encargado), `ev`/`evd` (eventos), `ord` (encargos), `alb`/`albR` (álbum), `ach` (logros), `st` (cuentas del día). Ver `core/funko/zone.js`. Con ella, la tienda llega hasta x 1084 (`RX()` en `world/layout.js`: luz de noche, lluvia/hojas y persiana) y la librería desaparece de la calle.
- `S.meSet`: lo elegido en Personalizar para Álvaro (solo lo que se ha tocado; `""` = lo suyo). Las partidas de antes solo tienen `S.me`: `meSetOf()` lo deduce.
- `S`: objeto con identidad estable. Para cargar una partida, `replaceState(obj)`. Nada de `S = …`.
- `custs`, `queue`: arrays que se mutan en sitio.
- Lo que se reasigna va en `G` (`G.M`, `G.deal`, `G.SLOT`, `G.TITLE`, `G.STORY`…).
- **Los nombres exportados deben ser únicos en todo `src/`**: `window.__pcs` busca cada nombre en todos los módulos (si hay dos iguales, los tests encuentran el que no es).
- No renombres funciones ni variables del juego sin motivo: minimiza el diff.

## Compatibilidad obligatoria

- **localStorage**: la ranura 1 usa la clave de siempre (`pcs-save-real-v3` / `pcs-save-offline-v3`); las ranuras 2 y 3, la misma con `-s2` / `-s3`; `pcs-slots-v1` recuerda la última ranura. También `pcs-sets-v1`, `pcs-sound`, `pcs-music`, `pcs-vibe` (nueva: vibración) `pcs-diag-v1` (registro de cierres, `ui/diag.js`) y `pcs-cloud-v1` (cuenta de la nube: sesión y qué copia tiene cada ranura). **IndexedDB** `pcs`, almacén `kv`. La partida de Alberto debe cargarse tal cual.
- Formato de exportación: `{app:"pcs", v:5, mode, date, S}`.
- Red: solo `api.pokemontcg.io`, `images.pokemontcg.io`, Google Fonts y el proyecto de Supabase de `docs/nube.md` (aprobado por Alberto).

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
