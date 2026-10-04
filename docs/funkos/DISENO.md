# Tienda de Funkos · diseño

**Estado: diseño y mockups. No está implementado.** Este documento lo aprueba Alberto antes de empezar. Cuando esté aprobado, se hace por fases (apartado 13) y cada fase termina con `npm test` en verde, commit pequeño en español y capturas.

Mockups: `docs/funkos/mockups.html` (12 pantallas, ábrelo en el navegador a 390 px). El generador de figuras de los mockups está en `docs/funkos/figuras.js`.

## 1. La idea

A mitad de partida, el **local de juguetes del señor Paco** (en la misma calle) se traspasa. Si lo compras, abres una **segunda tienda solo de Funkos**, de muchas colecciones (Marvel, DC, Star Wars, Harry Potter, anime, videojuegos, Pokémon, Disney…).

- Juegas **en una tienda a la vez**. La otra la lleva un **encargado** que vende solo (algo peor que tú). Cambias cuando quieras.
- El dinero, el día, el nivel y la reputación son **los mismos** para las dos tiendas.
- Lo que hace distinto a los Funkos: **Chase**, **olas** de lanzamiento, **descatalogados** que suben de precio, **exclusivas de convención** y el **estado de la caja**.

Decisiones ya tomadas por Alberto:

| Decisión | Elegido |
|---|---|
| Dos tiendas | Una a la vez + encargado |
| Personajes | Nombres reales (dibujo nuestro, sin logos oficiales) |
| Desbloqueo | Nivel 5 · 15.000 € |
| Nombre del producto | «Funkos» |

## 2. Desbloqueo y compra del local (mockups 1 y 2)

- En la calle hay un local nuevo, **Juguetes Paco**, con el cartel «SE TRASPASA». Siempre se ve; se toca como los demás edificios (banco, café…).
- Ficha del local: qué trae la tienda y el botón **Comprar el local · 15.000 €** (desactivado hasta nivel 5, con el aviso «Necesitas nivel 5»).
- Al llegar a nivel 5, el aviso «🔓 ¡Nivel 5!» incluye una línea: «🧸 Se traspasa la tienda de juguetes de la calle».
- Al comprarlo: el **señor Paco** (personaje nuevo, dibujado como Emma, Álvaro y papá en `render/characters.js`) entrega las llaves y se **pone nombre a la tienda**, como con la tienda de cartas en la historia. Sugerencias: Funko Corner, Pop Galaxy, Cabezones, Vinilo Store.
- La tienda se abre vacía: hay que comprar stock y (si quieres) contratar encargado.

## 3. Dos tiendas (mockups 3, 4 y 5)

### Cambiar de tienda
- Botón fijo en la tienda (arriba a la derecha): «🃏 Poké Cards · encargada: Lucía» / «🧸 Pop Galaxy». También desde la calle.
- Al cambiar: la cámara baja por la calle (1–2 s) y entra en la otra tienda. Emma y Álvaro van contigo.
- Se puede cambiar en cualquier momento del día. Los clientes que están dentro de la tienda que dejas **pasan al encargado** (se cuenta lo que compran) y desaparecen de la pantalla.
- El reloj del día es el mismo. La persiana se baja en las dos a la vez.

### El encargado
- Se contrata en **Mejoras → Personal** (como el cajero). Tres candidatos:

| Encargado | Vende | Repone solo | Sueldo |
|---|---|---|---|
| Marcos (estudiante) | 65 % | No | 50 €/día |
| Lucía (habitual de la tienda) | 80 % | Sí | 90 €/día |
| Doña Pili (ex dependienta de Paco) | 95 % | Sí, y regatea bien | 160 €/día |

- «Vende un X %»: cada día, la tienda en la que no estás vende lo que venderías tú con su stock y sus precios, por ese porcentaje. No se dibuja (no se mueve gente): es una cuenta al cerrar el día y una cifra en directo en el botón de cambiar de tienda.
- «Repone solo»: si se acaba un producto, lo vuelve a pedir al precio de mayorista, con un tope de gasto por día que eliges.
- **Sin encargado**, la tienda en la que no estás está cerrada ese día.
- El encargado sirve para **las dos tiendas**: si estás en la de Funkos, lleva la de cartas, y al revés.

## 4. El catálogo (mockup 11)

Unas **130–150 figuras** en **10 colecciones**, todas inventadas por nosotros (nombres reales de personajes, dibujo propio). Cada figura tiene: colección, número (#), ola, rareza y precio base.

| Colección | Ejemplos |
|---|---|
| Marvel | Spider-Man, Iron Man, Capitán América, Thor, Hulk, Viuda Negra, Thanos, Groot, Deadpool, Lobezno, Pantera Negra, Venom… |
| DC | Batman, Superman, Wonder Woman, Joker, Harley Quinn, Flash, Robin… |
| Star Wars | Darth Vader, Luke, Leia, Han Solo, Chewbacca, Yoda, Grogu, Mandaloriano, Stormtrooper, Boba Fett, R2-D2… |
| Harry Potter | Harry, Hermione, Ron, Dumbledore, Snape, Hagrid, Voldemort, Dobby, Luna… |
| Anime | Goku, Vegeta, Naruto, Sasuke, Luffy, Zoro, Tanjiro, Nezuko, Totoro… |
| Videojuegos | Mario, Luigi, Peach, Bowser, Link, Zelda, Sonic, Kirby, Master Chief, Steve, Creeper… |
| Pokémon | Pikachu, Charmander, Bulbasaur, Squirtle, Eevee, Gengar, Mewtwo, Snorlax… |
| Disney y Pixar | Mickey, Minnie, Stitch, Woody, Buzz, Elsa, Olaf, Simba… |
| Series y películas | Eleven, Miércoles, Homer, Bart, Bob Esponja, E.T.… |
| Terror | Ghostface, Freddy, Jason, Pennywise, Chucky… (ver preguntas abiertas) |

- Solo personajes de ficción: nada de personas reales (futbolistas, cantantes).
- Al empezar hay **2–3 olas** por colección a la venta; el resto sale con el tiempo (apartado 7).

### El dibujo: generador de figuras
- Todas comparten el **mismo cuerpo de vinilo** (cabezón, ojos negros, cuerpo pequeño). Cada figura es una lista de piezas: color de piel, cabeza (redonda o cuadrada), pelo, máscara o casco, lentes, capa, emblema y accesorio (espada láser, varita, escudo, cuchillo…).
- En las pantallas se dibuja en SVG (como en los mockups). En la tienda (canvas), cada figura se dibuja **una vez** en una imagen pequeña y se reutiliza: así no pesa al móvil.
- La caja: franja negra «POP! VINILO», ventana con la figura, número, nombre y el color de la colección. Pegatinas: **CHASE**, **EXCLUSIVA**, **BRILLA EN LA OSCURIDAD**.

## 5. Comprar stock (mockup 6)

- **Stock** de la tienda de Funkos: pestañas por colección; una tarjeta por figura (caja, número, ola, rareza, mercado, tendencia, unidades y precio de venta), con el mismo estilo que la de los sobres.
- **Comunes**: se piden en **cajas de 6 iguales** (unos 9 € cada una al mayorista) y llegan al día siguiente en la furgoneta. **1 de cada 6 cajas trae una Chase** en lugar de una normal.
- **Raras** (ediciones especiales, brillan en la oscuridad, metálicas): se piden sueltas, unos 20–25 €.
- **Descatalogadas**: ya no se pueden pedir. Solo llegan por clientes que venden, lotes o encargos.
- Precio de venta: uno por figura, con un botón «precio para toda la colección» (por ejemplo, mercado + 5 %).

## 6. Vender (mockup 3)

### La tienda por dentro
- Estanterías de pared por colección, islas en el centro, **vitrina de grails** (Chase, exclusivas y descatalogadas caras) y la caja.
- Las estanterías se asignan a colecciones (como los huecos de sobres). Más estanterías y una vitrina más grande se compran en **Mejoras** de esta tienda.
- Decoración propia: neón con el nombre, alfombra, figura gigante en la puerta (+ clientes, como la decoración de la otra tienda).

### Clientes de la tienda de Funkos
Mismo sistema que la tienda de cartas (cestas de 20 € o más, como máximo 10 dentro), con tipos propios:

| Cliente | Qué hace | Gasto típico |
|---|---|---|
| Fan | Busca su colección (un fan de Star Wars). Se lleva 1–3. | 20–45 € |
| Coleccionista | Mira la vitrina: Chase y descatalogadas. Paga más, regatea. | 40–150 € |
| Niño | Una figura común, a veces dos. | 15–30 € |
| Regalo | Alguien que busca un regalo: 2–3 de lo que sea, poco exigente con el precio. | 30–50 € |
| Revendedor | Solo en días de convención: quiere exclusivas para revenderlas. | 30–60 € |

- Si hay protectores de caja en stock, un 30 % se lleva también uno.
- También hay clientes que **venden** Funkos (como los que venden cartas), con figuras descatalogadas o Chase.

## 7. Lo «pro» de los Funkos (mockups 7, 8, 9 y 12)

### Chase
- 1 de cada 6 cajas. Variante de la figura (flocked, metálica, otro color). Vale **unas ×5** la normal.
- Al abrir la caja que la trae: pantalla «✨ ¡HA SALIDO UNA CHASE!» (mockup 8), con confeti como las cartas buenas.

### Olas y descatalogados
- Cada colección saca una **ola nueva cada 7–10 días** (3–5 figuras). Aviso en el ticket del día anterior: «📢 Mañana sale la ola 3 de Star Wars».
- La **ola más antigua pasa a descatalogada**: ya no se puede pedir y su precio de mercado sube poco a poco (de ×1 a unas ×3 en varias semanas).
- Esto premia guardar figuras… o venderlas en el momento justo.

### Exclusivas de convención (mockup 9)
- Una vez por temporada, un **Salón del Cómic**. Se anuncia unos días antes en el ticket.
- Ese día se pueden comprar **exclusivas** (unidades limitadas, 1–3 por figura) a precio de convención (unos 30 €). En una semana valen unas ×2–3.
- Al día siguiente vienen a tu tienda revendedores y fans buscándolas: hay cola en la puerta (como en los lanzamientos de sobres).

### Estado de la caja (mockup 7)
- Cada figura tiene caja **Perfecta** o **Dañada** (vale un 40 % menos).
- A veces llega alguna dañada en una caja de 6, y un cliente torpe puede dañar una de la estantería.
- **Protector de caja** (2,50 €): la que lo lleva no se daña. También se vende a los clientes como accesorio.

### Precios de mercado
- Como las cartas: cada figura tiene un precio que sube y baja cada día, con gráfica y «7 d / 30 d» en su ficha.
- Las de ola nueva empiezan altas y bajan un poco; las descatalogadas suben; las Chase y exclusivas son más volátiles.

## 8. Colección personal, álbum, encargos y logros (mockup 10)

- **Mis Funkos**: las figuras que te quedas (como las cartas favoritas). No se venden ni van a la vitrina sin quitarlas antes.
- **Álbum** por colección: casillas con silueta hasta que tienes la figura. Premio al completar cada colección (100–150 €) y otro al completar todas las Chase de una colección.
- **Encargos**: un habitual busca una figura concreta (a veces Chase o descatalogada) y paga más si se la consigues antes de una fecha.
- **Logros** nuevos: primera Chase, colección completa, 10 exclusivas, tienda de Funkos con 1.000 € en un día…
- **Misiones del día** de la tienda de Funkos (vende N figuras, coloca una Chase en la vitrina…).

## 9. Personajes y frases

- **Señor Paco** (nuevo): el antiguo dueño. Aparece al traspasar el local y de visita de vez en cuando («¡Cómo ha cambiado mi tienda!»).
- **Emma**: lleva las cuentas; frases sobre precios, descatalogados y olas.
- **Álvaro**: loco por los Funkos; ojos de estrella con una Chase (como con las cartas raras).
- **Papá**: frases frikis de cada saga («Que la Fuerza os acompañe, padawans…»).
- Varias frases por situación, sin repetir, como ahora (`core/quips.js`).

## 10. Ticket del día (mockup 12)

- Una línea por tienda (quién la llevaba y cuánto vendió), Chase vendidas, sueldo del encargado y alquiler de los dos locales.
- El récord de ventas («¡RÉCORD!») cuenta el total de las dos tiendas.
- Avisos para mañana: ola nueva, convención, figuras que pasan a descatalogadas.

## 11. Números de partida (primer ajuste, se probarán con el bot)

| Concepto | Valor |
|---|---|
| Local | 15.000 € · nivel 5 |
| Alquiler del local | 40 €/día |
| Figura común | ~9 € al mayorista · ~15 € de mercado |
| Caja de 6 | ~54 € · 1 de cada 6 con Chase |
| Chase | ~×5 la normal |
| Rara / especial | ~20–25 € al mayorista · ~30–40 € de mercado |
| Exclusiva de convención | ~30 € · luego ×2–3 |
| Descatalogada | sube hasta ~×3 en varias semanas |
| Caja dañada | −40 % |
| Protector | 1 € al mayorista · 2,50 € de venta |
| Objetivo | la tienda de Funkos vende parecido a la de cartas (unos 600–1.000 €/día a mitad de partida) |

## 12. Cómo se hará (técnica)

- **Estado** nuevo en `S.fk` (la tienda de Funkos: nombre, stock, precios, mercado, olas, colección, álbum, encargos, encargado) y `S.here` (`"cards"` o `"funko"`). Las partidas de antes no tienen `S.fk`: todo sigue igual hasta comprar el local. El formato de exportación no cambia (`v: 5`).
- **Tamaño de la partida**: el historial de precios de 150 figuras (31 días, 6 cifras) ocupa unos 40 KB.
- **Archivos nuevos** (casi todo va aparte; de lo de siempre solo se toca la calle, el ticket, Mejoras → Personal y el bucle del día):
  - `core/funko/`: catálogo, mercado y olas, stock y pedidos, clientes, encargado, convención, álbum y encargos.
  - `world/funkoLayout.js`: posiciones de la tienda de Funkos.
  - `render/funkoShop.js` y `render/funkoFig.js`: la tienda y las figuras en el canvas (figuras en caché).
  - `ui/funko/` y `ui/screens/funkos.js`: Stock, ficha, colección, convención, cambiar de tienda.
- **Dependencias**: las de siempre (`core` sin DOM; avisos por `bus.js`).
- **Rendimiento**: una sola tienda se dibuja y se mueve a la vez; la otra es una cuenta. Figuras dibujadas una vez y reutilizadas.
- **Tests**: unitarios (catálogo, mercado, olas, encargado, partidas de antes) y de navegador (comprar el local, cambiar de tienda, ticket con las dos tiendas, comprar y vender figuras). El test 14 no cambia: las pantallas de siempre siguen igual.

## 13. Fases

| Fase | Qué se puede hacer al terminarla |
|---|---|
| **F1 · El local** | Comprar el local, ponerle nombre, entrar en la tienda de Funkos (vacía) y volver. Encargado en Mejoras → Personal. Ticket con las dos tiendas. Señor Paco. |
| **F2 · Catálogo y figuras** | Generador de figuras y cajas, 10 colecciones, precios de mercado. Stock de Funkos: pedir cajas, que lleguen en la furgoneta. |
| **F3 · Vender** | Estanterías por colección, vitrina, clientes propios con cestas grandes, precios de venta. El encargado vende de verdad en la tienda en la que no estás. |
| **F4 · Lo pro** | Chase, olas y descatalogados, convención con exclusivas, estado de la caja y protectores. |
| **F5 · Colección** | Mis Funkos, álbum, encargos, logros, misiones y frases de Emma, Álvaro, papá y Paco. |

Cada fase se une a `main` cuando Alberto lo pida.

## 14. Preguntas abiertas (para Alberto)

1. **¿Quién está en la caja de cada tienda?** Propuesta: Emma y Álvaro van siempre contigo; en la tienda en la que no estás solo está el encargado.
2. **Colección «Terror»**: Ghostface, Chucky, Pennywise… ¿la ponemos o la quitamos (por los peques)?
3. **¿Qué colecciones o personajes quieres sí o sí?** (y si sobra alguna de la lista).
4. **Convención**: ¿una por temporada (unas 4 al año de juego) o más a menudo?
5. **Encargado**: ¿te gustan los tres candidatos y sus números, o lo hacemos más sencillo (uno solo)?
6. **¿Puede el encargado llevar la tienda de cartas?** (propuesta: sí, cuando estás en la de Funkos).
7. **El señor Paco**: ¿te parece bien como personaje nuevo, con retrato como Emma, Álvaro y papá?
