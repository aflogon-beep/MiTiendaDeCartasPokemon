# Zona Funko · diseño

**Estado: aprobado por Alberto. F1 hecha** (librería, compra, nombre, zona dibujada y Emma en su sofá). Siguen F2–F5 (apartado 12). Cada fase termina con `npm test` en verde, un commit pequeño en español y capturas.

- Mockups: `docs/funkos/mockups.html` (14 pantallas; ábrelo en el navegador a 390 px).
- `docs/funkos/figuras.js`: generador de figuras de los mockups.
- `docs/funkos/zona.js`: la zona Funko vista desde arriba.
- `docs/funkos/tienda.jpg`: captura real de la tienda que usan los mockups.

## 1. La idea

A mitad de partida, la **librería de al lado** (pegada a la tienda, a la derecha de la caja) se traspasa. Si la compras, se abre un paso en la pared y la tienda crece con una **zona solo de Funkos**, de muchas colecciones (Marvel, DC, Star Wars, Harry Potter, anime, videojuegos, Pokémon, Disney…).

- **Es una ampliación, no una tienda nueva**, como la panadería: misma caja, misma cola, mismos clientes, mismo personal, mismo dinero y mismo día. El juego sigue dibujando una sola tienda, así que el móvil va igual de fluido.
- La zona es **mucho más friki** que la tienda de cartas: estatua de Darth Vader, Halcón Milenario colgado del techo, armadura de Iron Man, máquina de gancho, recreativa, alfombra de la Estrella de la Muerte…
- Más de **150 Funkos**. Los mejores (los «chetados») se desbloquean al **subir de nivel la zona Funko**.
- Lo que hace distintos a los Funkos: **Chase**, **olas** de lanzamiento, **descatalogados** que suben de precio, **exclusivas de convención** y el **estado de la caja**.

Decisiones de Alberto:

| Decisión | Elegido |
|---|---|
| Cómo se juega | Ampliación de la tienda: zona dedicada a Funkos, gestionada por la tienda normal |
| Dónde | Justo al lado: el local de la librería, a la derecha de la caja |
| Nombre | Lo pone el jugador al comprar el local |
| Emma | Se va a la zona Funko, a **su sofá con tele y mando** (es vaga, pero muy lista); sigue con el mismo papel en todo el juego |
| Encargado | Hay encargado de la zona (cobra más que el cajero): repone, pide stock y atiende |
| Personajes | Nombres reales (dibujo nuestro, sin logos oficiales) |
| Desbloqueo | Nivel 5 · 15.000 € |
| Figuras | Más de 150; las mejores se desbloquean con el nivel de la zona |
| Colecciones | Sí o sí: Marvel, Star Wars, Pokémon y Stranger Things (y el resto de la lista). **Terror, sí** |
| Eventos con exclusivas | **Más a menudo**: uno cada semana |
| Clientes dentro | 12 con la zona |
| Don Ramón y precio | Sí: Don Ramón el librero; local a 15.000 € y nivel 5 |

## 2. Desbloqueo y compra del local (mockups 1 y 2)

- La librería ya existe en la calle (a la derecha de la tienda). Al llegar a nivel 5 se le pone el cartel «SE TRASPASA» y se puede tocar, como la panadería.
- Al llegar a nivel 5, el aviso «🔓 ¡Nivel 5!» añade: «📚 Se traspasa la librería de al lado».
- Ficha: qué trae la zona y **Comprar el local · 15.000 €**. Antes del nivel 5, el botón está desactivado con el aviso «Necesitas nivel 5».
- Al comprarlo:
  - **Don Ramón**, el librero (personaje nuevo, con retrato como Emma, Álvaro y papá), entrega las llaves.
  - El jugador **escribe el nombre de la zona**, con sugerencias: Zona Funko, Pop Galaxy, Cabezones, El Rincón Friki.
  - Emma se pide el sofá de la zona y Álvaro alucina.
- La zona se abre con lo básico: el paso («portal de las estrellas»), estanterías vacías y su puerta a la calle. El resto del mobiliario se compra en Mejoras.

## 3. La zona en la tienda (mockups 3 y 4)

- **Sitio:** el local de la librería (`x 808–1084`, del mismo ancho que la panadería). La fachada de la librería pasa a ser el escaparate de la zona, con el nombre en neón.
- **Entradas:**
  - un **paso junto a la caja** (en la pared derecha, cerca del escaparate);
  - su **propia puerta a la calle**.
  - Los clientes de Funkos pueden entrar por cualquiera de las dos y pagan **en la misma caja**.
- **Aspecto:** suelo de nave espacial (hexágonos), luz morada, neón con el nombre, estandartes de Hogwarts en la pared y estanterías con tiras de LED.
- **Mobiliario** (leyenda del mockup 4):
  1. estantería iluminada del fondo;
  2. vitrinas altas de cristal;
  3. Darth Vader a tamaño real;
  4. Halcón Milenario colgado;
  5. isla en pirámide con foco;
  6. alfombra de la Estrella de la Muerte;
  7. cámara de los grails;
  8. armadura de Iron Man;
  9. máquina de gancho;
  10. recreativa;
  11. Pikachu gigante;
  12. portal;
  13. el rincón de Emma: sofá gamer, tele y consola.
- **Emma** pasa a estar en la zona Funko, en **su rincón: un sofá gamer con tele y un mando** (13 en el mockup 4). Es vaga, pero muy lista: se pasa el día jugando y, de vez en cuando, se levanta a dar un consejo («Ese Vader descatalogado ya vale el triple: yo lo subiría») y vuelve al sofá. Sigue igual que siempre en todo lo demás: sus frases, sus consejos, el tutorial y las cuentas. Álvaro sigue en la caja (o paseando si hay cajero).
- **Clientes:** el máximo de gente dentro sube de 10 a **12** con la zona, porque la tienda es más grande.
- La panadería sigue siendo la ampliación de la izquierda; las dos se pueden tener a la vez.

## 4. Personal: encargado de la zona Funko (mockup 7)

- Se contrata en **Mejoras → Personal**, junto al cajero. Sueldo: **45 €/día** (el cajero cobra 20).
- Lo que hace:
  - **repone** las estanterías de Funkos desde el almacén cuando se vacían;
  - **vuelve a pedir** al mayorista lo que se acaba, con un **tope de gasto por día** que eliges;
  - **compra figuras** a los clientes que vienen a vender Funkos, con un precio razonable, sin preguntarte.
- **Sin encargado lo haces tú:**
  - las figuras que llegan van al **almacén** y las estanterías se vacían hasta que las repones desde Stock;
  - los que vienen a vender Funkos esperan aparte, como las ofertas de cartas («📥 N ofertas esperando»).
- El almacén y la reposición son **solo de los Funkos**. Los sobres siguen como ahora.

## 5. El catálogo (mockup 13)

**Unas 200 figuras normales en 11 colecciones**, y además sus variantes (Chase, brillan en la oscuridad, metálicas, flocked, Diamond), con lo que pasan de 300 piezas. Todas inventadas por nosotros: nombres reales de personajes, dibujo propio y solo personajes de ficción (nada de personas reales).

| Colección | Ejemplos |
|---|---|
| Pokémon | Pikachu, Charmander, Bulbasaur, Squirtle, Eevee, Gengar, Mewtwo, Snorlax, Charizard… |
| Videojuegos | Mario, Luigi, Peach, Bowser, Link, Zelda, Sonic, Kirby, Master Chief, Steve, Creeper… |
| Disney y Pixar | Mickey, Minnie, Stitch, Woody, Buzz, Elsa, Olaf, Simba… |
| Marvel | Spider-Man, Iron Man, Capitán América, Thor, Hulk, Viuda Negra, Thanos, Groot, Deadpool, Lobezno… |
| Star Wars | Darth Vader, Luke, Leia, Han Solo, Chewbacca, Yoda, Grogu, Mandaloriano, Stormtrooper, Boba Fett… |
| Harry Potter | Harry, Hermione, Ron, Dumbledore, Snape, Hagrid, Voldemort, Dobby, Luna… |
| DC | Batman, Superman, Wonder Woman, Joker, Harley Quinn, Flash… |
| Anime | Goku, Vegeta, Naruto, Sasuke, Luffy, Zoro, Tanjiro, Nezuko, Totoro… |
| Stranger Things | Eleven, Mike, Dustin, Lucas, Will, Max, Steve, Hopper, Eddie, Demogorgon, Vecna… |
| Series y películas | Miércoles, Homer, Bart, Bob Esponja, E.T.… |
| Terror | Ghostface, Freddy, Jason, Pennywise, Chucky… |

**Dibujo:**
- Todas comparten el mismo cuerpo de vinilo (cabezón, ojos negros). Cada figura es una lista de piezas: piel, cabeza, pelo, máscara o casco, lentes, capa, emblema y accesorio.
- En las pantallas se dibujan en SVG. En la tienda (canvas), cada figura se dibuja **una vez** y se reutiliza.
- La caja lleva franja negra, ventana, número, nombre y el color de la colección. Pegatinas: CHASE, EXCLUSIVA, BRILLA EN LA OSCURIDAD.

## 6. Nivel de la zona Funko (mockup 6)

La zona tiene **su propio nivel (1–10)**, aparte del nivel de la tienda (que nunca baja). Sube con **⭐ de Funko**, que se ganan vendiendo Funkos, completando el álbum y con encargos. El nivel de la zona tampoco baja.

| Nivel | Desbloquea |
|---|---|
| 1 | Pokémon, Videojuegos, Disney (comunes) |
| 2 | Marvel, Star Wars, Stranger Things (comunes y raras) |
| 3 | Harry Potter, DC, Anime · brillan en la oscuridad |
| 4 | Series y películas, Terror · metálicas y flocked |
| 5 | Eventos con exclusivas (uno cada semana) |
| 6 | Deluxe: escenas y figuras de 25 cm (el Halcón con Han, el Trono de Hierro…) |
| 7 | Chase más a menudo (1 de cada 4 cajas) |
| 8 | Diamond Collection (purpurina, muy buscadas) |
| 9 | Grails legendarios (ediciones de 480 unidades) |
| 10 | El Funko de oro de 24 quilates: una sola pieza, el Santo Grial |

Algunos muebles también piden nivel de la zona (mockup 5). Al subir de nivel sale el aviso «🔓 ¡Zona Funko nivel N!», como el de la tienda.

## 7. Mobiliario friki (mockup 5)

Se compra en **Mejoras → Zona Funko**. Cada mueble se ve en la zona y tiene un efecto:

| Mueble | Efecto | Precio | Pide |
|---|---|---|---|
| Portal de las estrellas (el paso) | — | Viene con el local | — |
| Vitrinas de cristal con LED | +8 huecos de exposición | 1.100 € | — |
| Estatua de Darth Vader (tamaño real) | Los fans de Star Wars compran un 15 % más | 1.200 € | — |
| Halcón Milenario colgado del techo | +8 % clientes en la zona | 900 € | — |
| Alfombra de la Estrella de la Muerte | +6 % clientes en la zona | 400 € | — |
| Máquina de gancho con Funkos | Los niños juegan: 1 € la partida (a veces se llevan un Funko) | 700 € | — |
| Máquina recreativa | +20 % de paciencia en la cola | 650 € | — |
| Pikachu gigante de 1 metro | +10 % clientes niños | 800 € | — |
| Sofá gamer con tele y consola (el de Emma) | Emma da un consejo al día | Viene con el local | — |
| Estandartes de Hogwarts | Los fans de Harry Potter compran un 15 % más | 500 € | Nivel 3 |
| Armadura de Iron Man en su cápsula | Los fans de Marvel aceptan precios un 6 % más altos | 1.500 € | Nivel 4 |
| Cámara de los grails | Las piezas de vitrina valen un 10 % más | 2.500 € | Nivel 5 |

## 8. Stock, almacén y venta (mockups 8 y 9)

- **Stock → Funkos:** pestañas por colección. Una tarjeta por figura con:
  - la caja, el número, la ola y la rareza;
  - el precio de mercado y su tendencia;
  - unidades en el almacén y en la estantería;
  - el precio de venta.
- **Comunes:** se piden en **cajas de 6 iguales** (unos 9 € cada una) y llegan al día siguiente en la furgoneta. **1 de cada 6 cajas trae una Chase** (1 de cada 4 a partir del nivel 7 de la zona).
- **Raras y especiales:** se piden sueltas, a unos 20–25 €.
- **Descatalogadas:** ya no se pueden pedir. Llegan por clientes que venden, lotes o encargos.
- **Estanterías por colección:** cada una con su capacidad. Se reponen desde el almacén (o lo hace el encargado). Lo caro va a las vitrinas o a la cámara de los grails.
- **Clientes de la zona**, con cestas de 20 € o más, como el resto de la tienda:

| Cliente | Qué hace | Gasto típico |
|---|---|---|
| Fan | Busca su colección (un fan de Star Wars). Se lleva 1–3. | 20–45 € |
| Coleccionista | Mira la vitrina: Chase y descatalogadas. Paga más y regatea. | 40–150 € |
| Niño | Una común (a veces dos) y quizá una partida a la máquina de gancho. | 15–30 € |
| Regalo | Busca un regalo: 2–3 de lo que sea, sin mirar mucho el precio. | 30–50 € |
| Revendedor | Solo tras un evento: quiere exclusivas para revenderlas. | 30–60 € |

- Algunos clientes de cartas compran también un Funko y al revés: se suma a la misma cesta (como los extras de ahora).
- Si hay protectores de caja en stock, un 30 % se lleva también uno.

## 9. Lo «pro» de los Funkos (mockups 9, 10, 11 y 14)

- **Chase:**
  - variante de la figura (flocked, metálica u otro color) que vale unas ×5;
  - al llegar la caja que la trae sale «✨ ¡HA SALIDO UNA CHASE!», con confeti como las cartas buenas.
- **Olas y descatalogados:**
  - cada colección saca una ola nueva cada 7–10 días (3–5 figuras); se avisa en el ticket del día anterior;
  - la ola más antigua pasa a **descatalogada**: ya no se puede pedir y su precio sube poco a poco (hasta unas ×3 en varias semanas).
- **Eventos con exclusivas (desde el nivel 5 de la zona):**
  - **uno cada semana**, rotando: Salón del Cómic, Salón del Manga, Día de Star Wars, Noche de Terror, Festival Pokémon, Noche de Stranger Things… Se anuncian en el ticket y se ve la lista de los próximos;
  - ese día se compran exclusivas limitadas (1–3 por figura) a unos 30 €; en una semana valen ×2–3;
  - al día siguiente vienen fans y revendedores buscándolas, con cola en la puerta, como en los lanzamientos.
- **Estado de la caja:**
  - **Perfecta** o **Dañada** (vale un 40 % menos);
  - alguna llega dañada, y un cliente torpe puede dañar una de la estantería;
  - el **protector** (2,50 €) lo evita y también se vende a los clientes.
- **Precios de mercado:**
  - como las cartas, con gráfica y «7 d / 30 d» en la ficha;
  - las de ola nueva empiezan altas y bajan un poco; las descatalogadas suben; Chase y exclusivas cambian más.

## 10. Colección, álbum, encargos, logros y frases (mockup 12)

- **Mis Funkos:** las figuras que te quedas, como las cartas favoritas.
- **Álbum** por colección: silueta hasta que tienes la figura. Hay premio al completar cada colección (100–150 € y ⭐ de Funko) y al completar sus Chase.
- **Encargos:** un habitual busca una figura concreta y paga más si se la consigues a tiempo.
- **Logros y misiones** nuevos: primera Chase, colección completa, 10 exclusivas, 500 € de Funkos en un día…
- **Frases:** varias por situación, sin repetir, como ahora.
  - Emma: precios, olas y descatalogados.
  - Álvaro: ojos de estrella con una Chase.
  - Papá: frases frikis de cada saga.
  - Don Ramón: de visita («¡Dónde estaban mis libros ahora hay un Halcón Milenario!»).

## 11. Ticket del día (mockup 14)

- Es el mismo ticket con una sección **🧸 Zona Funko**: ventas, Chase vendidas, máquina de gancho y el sueldo del encargado.
- El récord de ventas cuenta toda la tienda.
- Debajo:
  - ⭐ de Funko ganadas y cuánto falta para el siguiente nivel;
  - avisos de ola nueva, convención y figuras que pasan a descatalogadas.

## 12. Fases

| Fase | Qué se puede hacer al terminarla |
|---|---|
| **F1 · El local** | Librería «SE TRASPASA», comprarla, Don Ramón, poner nombre, paso en la pared, zona dibujada con lo básico (suelo, pared, neón, estanterías vacías, escaparate). Emma se pasa a su sofá de la zona. |
| **F2 · Catálogo y stock** | Generador de figuras y cajas, 200 figuras en 10 colecciones, precios de mercado, Stock → Funkos, pedir cajas, almacén y reponer estanterías. |
| **F3 · Vender y nivel** | Clientes de la zona y cestas, venta en la misma caja, encargado de la zona, nivel de la zona y desbloqueos, mobiliario friki en Mejoras. |
| **F4 · Lo pro** | Chase, olas y descatalogados, eventos semanales con exclusivas, estado de la caja y protectores, máquina de gancho. |
| **F5 · Colección** | Mis Funkos, álbum, encargos, logros, misiones y frases de Emma, Álvaro, papá y Don Ramón. |

Cada fase se une a `main` cuando Alberto lo pida.

## 13. Cómo se hará (técnica)

- **Estado nuevo en `S.fk`:** nombre, nivel y ⭐ de la zona, almacén, estanterías, precios de venta, mercado, olas, muebles, colección, álbum, encargos y encargado.
  - Las partidas de antes no tienen `S.fk`, así que todo sigue igual hasta comprar el local.
  - El formato de exportación no cambia (`v: 5`).
  - El historial de precios de unas 300 piezas (31 días, 6 cifras) ocupa unos 80 KB.
- **Archivos nuevos:**
  - `core/funko/`: catálogo, mercado y olas, almacén y pedidos, clientes, encargado, nivel, convención, álbum y encargos;
  - `render/funkoZone.js` y `render/funkoFig.js`: la zona y las figuras en el canvas, con las figuras en caché;
  - `ui/screens/funkos.js` y `ui/funko/`: Stock, ficha, colección, nivel y convención.
- **Cambios en lo que ya existe** (pocos y marcados):
  - la calle: la librería y su cartel;
  - `world/layout.js` y `world/nav.js`: la zona, el paso y la puerta;
  - el fondo de la tienda;
  - Mejoras: personal y una pestaña nueva;
  - el ticket;
  - el máximo de clientes con la zona.
- **Rendimiento:** una sola tienda, como ahora. Las figuras se dibujan una vez y se reutilizan. Se mide en el móvil antes de unir.
- **Tests:**
  - unitarios: catálogo, mercado, olas, nivel, encargado y partidas de antes;
  - en el navegador: comprar el local, nombre, reponer, vender un Funko en la caja y ticket.
  - El test 14 no cambia: sin la zona, la tienda se ve igual.

## 14. Preguntas resueltas

Todas contestadas por Alberto (ver la tabla del apartado 1): Terror sí; Marvel, Star Wars, Pokémon y Stranger Things sí o sí; eventos cada semana; Emma en su sofá con tele y mando; 12 clientes; Don Ramón sí; 15.000 € a nivel 5.

**F1 hecha.** Además, a petición de Alberto: si Emma está dormida en el sofá y la tocas, se despierta con una frase graciosa («Estaba pensando profundamente»…), al rato se tumba a ver la tele y luego se vuelve a dormir.

**Siguiente paso:** F2 · Catálogo y stock, cuando Alberto diga.
