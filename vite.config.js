import { defineConfig } from "vite";

// BASE_PATH lo pone el workflow de GitHub Pages (p. ej. /MiTiendaDeCartasPokemon/)
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  build: {
    rollupOptions: {
      // El único eval es el acceso de los tests (window.__pcs, al final de legacy.js): es intencionado.
      onwarn(w, warn) {
        if (w.code === "EVAL") return;
        warn(w);
      },
    },
  },
});
