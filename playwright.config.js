import { defineConfig } from "@playwright/test";

// Dos versiones del mismo juego, con los mismos tests:
//   vite        → el juego compilado con Vite (vite build + vite preview). Es el que se refactoriza.
//   referencia  → reference/pokemon-card-shop-v22.html servido tal cual (la fuente de verdad).
const REF = 4317;
const VITE = 4318;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: [["list"]],
  use: {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "vite", use: { baseURL: `http://localhost:${VITE}`, gamePath: "/" } },
    { name: "referencia", use: { baseURL: `http://localhost:${REF}`, gamePath: "/reference/pokemon-card-shop-v22.html" } },
  ],
  webServer: [
    { command: "node tests/static-server.js", env: { PORT: String(REF) }, port: REF, reuseExistingServer: !process.env.CI },
    // Sin reutilizar: cada ejecución compila el código actual.
    { command: `npx vite build && npx vite preview --port ${VITE} --strictPort`, port: VITE, reuseExistingServer: false },
  ],
});
