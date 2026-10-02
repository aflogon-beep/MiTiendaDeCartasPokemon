import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// BASE_PATH lo pone el workflow de GitHub Pages (p. ej. /MiTiendaDeCartasPokemon/)
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [
    // App instalable (PWA). Actualización en silencio: la versión nueva se descarga sola y se usa
    // la próxima vez que se abre el juego; nunca recarga la página a mitad de partida.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
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
