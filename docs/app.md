# App instalable (PWA)

El juego publicado en GitHub Pages se puede instalar en el móvil como una app: icono propio, pantalla completa y arranque sin red.

## Instalar en Android (Xiaomi)

1. Abre la página del juego en **Chrome**.
2. Menú ⋮ → **Instalar aplicación** (o **Añadir a pantalla de inicio**).
3. Aparece el icono «Card Shop» en el escritorio. En MIUI/HyperOS, si no aparece, revisa en Ajustes → Aplicaciones → Chrome → Permisos que pueda **crear accesos directos en la pantalla de inicio**.

La partida es la misma que en el navegador: se guarda en el mismo sitio (`localStorage` de la página), así que no se pierde nada al instalarla.

## Qué funciona sin red

- El juego (código, estilos e iconos) se guarda al instalarlo.
- Las cartas y precios ya se guardaban en IndexedDB; sin red se usan los últimos descargados.
- Las imágenes de las cartas se guardan según se ven (hasta 300, durante 60 días).

## Actualizaciones

Cuando se publica una versión nueva, la app la descarga mientras juegas y sale un aviso abajo: **«✨ Hay una versión nueva del juego · Actualizar»**. Al tocar «Actualizar» se guarda la partida y la app se recarga con la versión nueva. Con «✕» se deja para más tarde (vuelve a salir al abrir la app). Mientras está abierta, la app busca versión nueva cada hora y cada vez que vuelves a ella.

Nunca se recarga sola a mitad de partida.

> La primera vez que se pasa de la versión antigua (actualización en silencio) a esta, el botón aún no sale: hay que cerrar la app del todo y volver a abrirla una vez.

## Iconos

`public/icons/` se genera con `python3 docs/icono/iconos.py` a partir de `docs/icono/original.jpg` (necesita `pip install pillow`).
