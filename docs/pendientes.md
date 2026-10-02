# Pendientes

Errores o cosas mejorables encontradas durante el refactor. **No se arreglan de paso**: se apuntan aquí y se decide con Alberto.

---

## 1. Clientes que atraviesan muebles al ir a la cola · causa 1 ✅ arreglada · causa 2 ⏳ elegir opción

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
- **Tests**: el test 5 pasa en Vite (los clientes que van a huecos sin camino se cuentan aparte en su informe); en la referencia sigue como fallo conocido. La causa 2 está como fallo conocido (`it.fails`) en `tests/unit/nav.test.js`: al arreglarla, cambiarlo por `it`.
- ⏳ **Causa 2 (nueva, pendiente de decidir)**: con todo el mobiliario, **los huecos de la cola a partir del 7.º no tienen camino**. El 7.º (`y = 454`) cae encima de la zona de un mueble y el 8.º y siguientes quedan encerrados entre los muebles de abajo y el mostrador. Cuando `navPath` no encuentra camino devuelve una ruta vacía y el cliente va en línea recta, atravesando lo que haya. Solo pasa con colas de 7 o más personas (con el bot a 20× pasa a menudo). Es lo que sigue haciendo fallar el test 5.

**Opciones para la causa 2** (cambian cómo se ve una cola muy larga; hay que elegir):
- **A) La cola dobla**: a partir del hueco que ya no tiene sitio, la cola sigue por un pasillo libre (girando hacia la izquierda o hacia arriba). La cola se ve siempre en fila, pero más larga y con una curva.
- **B) Esperan cerca de la cola**: los que no caben esperan de pie en el sitio libre más cercano al final de la cola (se agrupan ahí) y van pasando a la fila según se liberan huecos. Más sencillo; la cola normal (hasta 6) no cambia.
- **C) Cola llena**: si ya hay 6 en la cola, los clientes nuevos siguen mirando las estanterías hasta que haya hueco. Cambia un poco el ritmo de la tienda (afecta a la paciencia), así que es la menos recomendable.

---

## 2. Al cargar una partida se recalcula el precio de mayorista de los sobres · 🔧 arreglar al terminar las fases (propuesta)

`ensure()` llama a `refreshPacks(true)` cada vez que se carga o importa una partida. En modo real eso fija `S.pack[s].w` al valor objetivo calculado con los precios actuales, en vez de seguir la media móvil del día a día (`w*.7 + objetivo*.3`), y recalcula `ref`. Por eso exportar y volver a importar una partida cambia ligeramente `S.pack`; todo lo demás se conserva igual.

Pasa cada vez que se abre el juego, no solo al importar.

**Parece un descuido:** `refreshPacks()` guarda `S.pack[s].init=1`, pero ese dato no se lee en ningún sitio. Lo lógico sería que el recálculo de golpe solo se hiciera la primera vez (`first && !S.pack[s].init`).

**Impacto:** pequeño. El precio de mayorista salta al valor objetivo en vez de acercarse poco a poco; no se pierde nada de la partida.

**Propuesta:** durante el refactor mantenerlo igual (mismo comportamiento) y arreglarlo junto al punto 1, al terminar las fases. Al arreglarlo, el test 11 podrá dejar de excluir `pack`.

## 3. Fase I · gag del tropiezo de Álvaro — descartado

`HISTORIA.md` pedía que Álvaro, «a veces, al correr por la tienda, tropieza y se levanta» («¡Estoy bien! ¡Estoy bien!»). En el juego el personaje del jugador está quieto detrás del mostrador, así que no hay animación para ese gag. **Decisión de Alberto: se quita.** No hay nada que hacer.
