# Pendientes

Errores o cosas mejorables encontradas durante el refactor. **No se arreglan de paso**: se apuntan aquí y se decide con Alberto.

---

## 1. Clientes que atraviesan muebles al ir a la cola · ✅ arreglado (causas 1 y 2)

**Qué pasa.** Con mobiliario en la tienda, a veces un cliente que va hacia la caja (`st: "toq"`) cruza en línea recta por encima de un mueble: la máquina de café, una maceta, una estantería, la mesa de juego o el mueble de «Sellado y accesorios». Es un roce de unos píxeles o lo cruza entero.

**Cómo se ve en el test 5** (con todo el mobiliario y la ampliación, 2 días a 20×): en cada ejecución aparecen entre 8 y 20 posiciones de clientes dentro de obstáculos. A 4× (la velocidad máxima del juego) también pasa, pero menos. Ejemplos reales medidos:

| Cliente | Ruta calculada al decidir | Qué pasó después | Mueble atravesado |
|---|---|---|---|
| quería una carta | hacia el hueco 3 de la cola `(622,358)`, último punto `(435,389)` | la cola avanzó; desde `(435,389)` fue recto al hueco 1 `(622,294)` | café `[560,306,598,330]` |
| quería sobres | hacia el hueco 1 `(622,294)`, último punto `(325,239)` | la cola avanzó; fue recto al hueco 0 `(622,262)` | maceta `[552,250,572,266]` |
| quería sobres | hacia el hueco 3 `(622,358)`, último punto `(425,399)` | fue recto al hueco 0 `(622,262)` | mueble de producto `[368,294,546,320]` |

**Causa (en `reference/pokemon-card-shop-v22.html`).**
- `decide()` acaba con `routeTo(c, LAY.qx, LAY.qy + queue.length*LAY.qs)`: la ruta se calcula **una sola vez**, hacia el hueco de la cola que había en ese momento.
- `navPath()` quita los últimos puntos de la ruta cuando desde el penúltimo ya se ve el destino.
- En `updateCusts()`, cuando se acaban los puntos (`c.wps`), el objetivo pasa a ser `qpos(c)`, el hueco **actual**. Si la cola ha avanzado mientras caminaba, el último tramo va en línea recta al hueco nuevo **sin recalcular la ruta**, y puede cruzar lo que haya en medio.

Pasa más cuanto más larga es la cola y cuanto más rápido se atiende (la cola se mueve mientras el cliente camina).

**Decisión (Alberto):** arreglarlo al terminar las fases (idea: recalcular la ruta cuando cambia el hueco de la cola).

**Estado (tras la Fase I):**
- ✅ **Causa 1 arreglada**: `routeTo` recuerda el destino (`c.rg`) y, mientras el cliente va a la cola, si su hueco cambia se recalcula la ruta desde donde está (`updateCusts`). Vale para todos los caminos que llevan a la cola (clientes que compran, que venden, lotes e intercambios). Test unitario en `tests/unit/nav.test.js`.
- ✅ **Causa 2 arreglada (opción B, elegida por Alberto)**: con todo el mobiliario, los huecos de la cola a partir del 7.º no tenían camino (el 7.º, `y = 454`, cae encima de la zona de un mueble y los siguientes quedan encerrados entre los muebles de abajo y el mostrador); `navPath` devolvía una ruta vacía y el cliente iba en línea recta atravesando lo que hubiera. Ahora `queueSpot(i)` (`world/nav.js`) da el sitio de cada puesto de la cola: la fila de siempre mientras los huecos tengan camino desde la puerta; a partir del primero que no lo tiene, los clientes esperan de pie en los sitios libres más cercanos al último de la fila (separados entre sí) y pasan a la fila según se liberan huecos, con la ruta recalculada. Sin muebles que corten la fila, nada cambia. `qpos` usa `queueSpot`.
- **Tests**: el test 5 es estricto (ningún cliente dentro de un obstáculo, también con colas de 7 o más; su informe dice la cola más larga). En la referencia sigue como fallo conocido. En `tests/unit/nav.test.js`: sin muebles la cola es la fila de siempre; con todo el mobiliario, los 12 primeros sitios tienen camino, no caen dentro de muebles, están separados y los que no caben quedan cerca del final de la fila.
- ✅ **Caso raro encontrado después** (fallaba ~1 de cada 40 veces el test 5): con 10 o más en la cola, el hueco que se pedía al llegar (`LAY.qy + queue.length*LAY.qs`) caía fuera de la tienda; `routeTo` no hacía ruta ni guardaba el destino, y el cliente iba recto desde la calle hasta su sitio. Ahora, si no hay destino guardado, también se calcula la ruta. Lo cubre una simulación en `tests/unit/nav.test.js` (clientes que llegan de la calle, cola que avanza al azar, pasos grandes).
- **Detalle**: mientras un cliente que ya esperaba fuera de la fila camina hasta su hueco, su paciencia no corre (igual que al caminar por una ruta con puntos).

---

## 2. Al cargar una partida se recalcula el precio de mayorista de los sobres · ✅ arreglado

`ensure()` llama a `refreshPacks(true)` cada vez que se carga o importa una partida. En modo real eso fija `S.pack[s].w` al valor objetivo calculado con los precios actuales, en vez de seguir la media móvil del día a día (`w*.7 + objetivo*.3`), y recalcula `ref`. Por eso exportar y volver a importar una partida cambia ligeramente `S.pack`; todo lo demás se conserva igual.

Pasa cada vez que se abre el juego, no solo al importar.

**Parece un descuido:** `refreshPacks()` guarda `S.pack[s].init=1`, pero ese dato no se lee en ningún sitio. Lo lógico sería que el recálculo de golpe solo se hiciera la primera vez (`first && !S.pack[s].init`).

**Impacto:** pequeño. El precio de mayorista salta al valor objetivo en vez de acercarse poco a poco; no se pierde nada de la partida.

**Propuesta:** durante el refactor mantenerlo igual (mismo comportamiento) y arreglarlo junto al punto 1, al terminar las fases. Al arreglarlo, el test 11 podrá dejar de excluir `pack`.

**Estado:** ✅ arreglado. `refreshPacks(true)` (al cargar o importar) solo fija el precio de golpe en los sobres que aún no lo tenían (`init`): una partida nueva o un set recién añadido. Si ya lo tenían, se conserva tal cual. Al cerrar cada día se sigue acercando poco a poco al objetivo (`w*.7 + objetivo*.3`). Las partidas guardadas ya tienen `init`, así que la de Alberto carga su precio de mayorista guardado. El test 11 ya no excluye `pack` en Vite (en la referencia sí, porque allí sigue el comportamiento antiguo); test unitario en `tests/unit/logica.test.js`.

---

## 3. Fase I · gag del tropiezo de Álvaro — descartado

`HISTORIA.md` pedía que Álvaro, «a veces, al correr por la tienda, tropieza y se levanta» («¡Estoy bien! ¡Estoy bien!»). En el juego el personaje del jugador está quieto detrás del mostrador, así que no hay animación para ese gag. **Decisión de Alberto: se quita.** No hay nada que hacer.

---

## 4. Avisos del juego encima de la pantalla de título · ✅ arreglado

**Qué pasa.** Al abrir el juego, mientras se ve el título, aparecen encima avisos de la partida de fondo: «🗂️ 6 colecciones disponibles en Más → Colecciones» y «🎯 He bajado el precio de 1 set(s) de sobres…». Tapan el logo y no tienen sentido todavía (aún no has elegido partida). En la historia ya se ocultan (`html.st-on #toast`), en el título no.

**Propuesta.** Ocultarlos también mientras se ve el título (o guardarlos y enseñarlos al entrar en la partida). Pendiente de que Alberto diga cuál.

**Estado:** ✅ Alberto eligió guardarlos. Mientras se ve el título, los avisos que llegan por el bus se guardan (`holdToast`, `ui/toast.js`) y se enseñan al entrar en la partida (`flushToasts`). Los de la partida de fondo solo si se entra en esa misma (misma ranura); en una partida nueva se descartan. Los generales (`{ keep: true }`, como «N colecciones disponibles») salen siempre; en una partida nueva, al terminar la historia. Test 20n.

---

## 5. En la historia sale el tendero genérico en la caja, junto a papá · ✅ arreglado

**Qué pasa.** En los planos generales de la historia, papá está detrás del mostrador y, a su lado, sigue dibujado el tendero de siempre (camiseta y gorra rojas). Pasaba igual antes de las mejoras (en la historia se mantuvo la tienda como antes). Ahora que Álvaro ya es el de la caja, ese tendero sobra en la historia.

**Propuesta.** En la historia, no dibujar a nadie en la caja (papá ocupa ese sitio). Pendiente de que Alberto lo confirme.

**Estado:** ✅ confirmado y hecho: durante la historia no se dibuja el tendero de la caja (`render/draw.js`).

---

## 6. La app se cierra sola al acercarse el cierre, de noche · 🔍 investigando

**Qué pasa.** Alberto, jugando en el móvil (app instalada y actualizada): con la tienda abierta, según se acerca la hora de cerrar y ya es de noche, la app se cierra sola. Al volver a abrirla, el día empieza de nuevo (eso es lo de siempre: la partida solo guarda los días cerrados).

**Lo probado.** En el navegador (también en modo móvil y con su partida antigua, mesa de juego, cajero, ampliación, sofá y cafetera) se llega al cierre sin errores, sin que suba la memoria y sin que se acumulen lienzos ni elementos.

**Primer registro (día 11, tienda cerrada).** 60 FPS, 10 MB de memoria, sin errores; lo último: abrir Más → Partida, cerrar el panel y, en menos de 2 s, fuera. Nada pesado en marcha.

**Causa más probable:** el botón o gesto «atrás» de Android. El juego no lo controlaba y, en la app instalada, «atrás» sin historial cierra la app al instante (con los gestos de Xiaomi basta deslizar desde el borde de la pantalla, fácil al arrastrar la tienda o cerrar un panel). Además, al salir así no siempre llega el aviso de «segundo plano», por eso el registro lo tomó por un cierre.

**Arreglo (`ui/back.js`, solo en la app instalada):** «atrás» cierra lo que esté abierto (como la ✕); en pantallas completas (sobres, gradeo, celebraciones, historia) no hace nada; sin nada abierto avisa «Vuelve atrás otra vez para salir» y solo sale si se repite en 2,5 s. Cada «atrás» queda apuntado en el registro, y salir así no cuenta como cierre. Test 20x. Pendiente de que Alberto confirme que ya no se cierra.

**Registro:** hay un registro (`ui/diag.js`, clave `pcs-diag-v1`): cada 2 s, con el juego en pantalla, apunta qué pasa (día, % del día, panel abierto, velocidad, clientes, jugadores, FPS, memoria, elementos y lienzos) y los últimos errores. Si la app se cierra sola estando en pantalla, al volver a abrirla sale un aviso con esos datos y el botón «📋 Copiar» para mandárselos a Claude.
