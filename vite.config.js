import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const BUILD = new Date().toISOString();

// BASE_PATH lo pone el workflow de GitHub Pages (p. ej. /MiTiendaDeCartasPokemon/)
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  // Versión = fecha y hora de la publicación (ui/version.js): se ve en Más → Ajustes y en el aviso
  // «Actualizar», y va en el registro de cierres (ui/diag.js)
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    // version.json: la versión publicada, para que el aviso «Actualizar» diga a cuál se actualiza
    {
      name: "pcs-version",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ build: BUILD }) });
      },
    },
    // App instalable (PWA). Cuando hay versión nueva sale un aviso con el botón «Actualizar»
    // (ui/update.js): guarda la partida y recarga. Nunca recarga sola a mitad de partida.
    VitePWA({
      registerType: "prompt",
      injectRegister: false, // lo registra ui/update.js
      includeAssets: ["icons/favicon-64.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Pokémon Card Shop",
        short_name: "Card Shop",
        description: "Gestiona tu tienda de cartas Pokémon con cartas y precios reales.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#1b1f2a",
        theme_color: "#1b1f2a",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        clientsClaim: true, // la primera vez, el service worker se encarga de la página sin recargar
        globPatterns: ["**/*.{js,css,html,png}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Imágenes de las cartas: se guardan según se ven, para jugar sin red. Las cartas y los precios
          // no pasan por aquí: el juego ya los guarda en IndexedDB y decide cuándo renovarlos.
          {
            urlPattern: ({ url }) => url.hostname === "images.pokemontcg.io",
            handler: "CacheFirst",
            options: {
              cacheName: "pcs-img",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 3600, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === "fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "pcs-fonts-css" },
          },
          {
            urlPattern: ({ url }) => url.hostname === "fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "pcs-fonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
