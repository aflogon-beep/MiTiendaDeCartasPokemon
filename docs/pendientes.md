# Pendientes

Errores o cosas mejorables encontradas durante el refactor. **No se arreglan de paso**: se apuntan aquí y se decide con Alberto.

---

## 1. Clientes que atraviesan muebles al ir a la cola · ✅ DECIDIDO: arreglar al terminar las fases

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

**Decisión (Alberto):** el test 5 queda marcado como «fallo conocido» (`test.fail()`) y se arregla cuando terminen las fases del refactor (idea: recalcular la ruta cuando cambia el hueco de la cola). Al arreglarlo, quitar `test.fail()` del test 5.

---

## 2. Al cargar una partida se recalcula el precio de mayorista de los sobres · 🔧 arreglar al terminar las fases (propuesta)

`ensure()` llama a `refreshPacks(true)` cada vez que se carga o importa una partida. En modo real eso fija `S.pack[s].w` al valor objetivo calculado con los precios actuales, en vez de seguir la media móvil del día a día (`w*.7 + objetivo*.3`), y recalcula `ref`. Por eso exportar y volver a importar una partida cambia ligeramente `S.pack`; todo lo demás se conserva igual.

Pasa cada vez que se abre el juego, no solo al importar.

**Parece un descuido:** `refreshPacks()` guarda `S.pack[s].init=1`, pero ese dato no se lee en ningún sitio. Lo lógico sería que el recálculo de golpe solo se hiciera la primera vez (`first && !S.pack[s].init`).

**Impacto:** pequeño. El precio de mayorista salta al valor objetivo en vez de acercarse poco a poco; no se pierde nada de la partida.

**Propuesta:** durante el refactor mantenerlo igual (mismo comportamiento) y arreglarlo junto al punto 1, al terminar las fases. Al arreglarlo, el test 11 podrá dejar de excluir `pack`.
