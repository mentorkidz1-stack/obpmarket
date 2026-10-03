import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout des parcours publics. Ils lisent le site réel (API + web en local) et n'écrivent rien :
 * ni commande, ni compte, ni message. Ils supposent les données de démonstration (`npm run seed` puis
 * `npm run seed:properties` dans apps/api).
 *
 *   npm run test:e2e            (lance l'API et le site s'ils ne tournent pas déjà)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "fr-FR",
  },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: "npm run start:dev", cwd: "../api", url: "http://localhost:3001/health", reuseExistingServer: true, timeout: 180_000 },
    { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 180_000 },
  ],
});
