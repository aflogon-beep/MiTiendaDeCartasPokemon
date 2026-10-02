import { defineConfig } from "@playwright/test";

// PCS_TARGET elige qué versión del juego se prueba:
//   reference (por defecto) → reference/pokemon-card-shop-v22.html servido tal cual
//   vite                    → la versión de Vite (fase R1 en adelante)
const TARGET = process.env.PCS_TARGET || "reference";
const PORT = TARGET === "vite" ? 4318 : 4317;
const GAME_PATH = TARGET === "vite" ? "/" : "/reference/pokemon-card-shop-v22.html";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
    gamePath: GAME_PATH,
  },
  webServer:
    TARGET === "vite"
      ? { command: `npx vite build && npx vite preview --port ${PORT} --strictPort`, port: PORT, reuseExistingServer: !process.env.CI }
      : { command: `node tests/static-server.js`, env: { PORT: String(PORT) }, port: PORT, reuseExistingServer: !process.env.CI },
});
