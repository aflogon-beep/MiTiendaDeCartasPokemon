import { defineConfig } from "vite";

// BASE_PATH lo pone el workflow de GitHub Pages (p. ej. /MiTiendaDeCartasPokemon/)
export default defineConfig({
  base: process.env.BASE_PATH || "/",
});
