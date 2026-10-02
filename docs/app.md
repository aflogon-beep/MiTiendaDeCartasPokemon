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

En silencio: cuando se publica una versión nueva, la app la descarga sola mientras juegas y la usa **la próxima vez que se abre**. Nunca recarga a mitad de partida. Para forzarla: cerrar la app del todo (desde recientes) y volver a abrirla.

## Iconos

`public/icons/` se genera con `python3 docs/icono/iconos.py` a partir de `docs/icono/original.jpg` (necesita `pip install pillow`).
