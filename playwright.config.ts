import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5174",
    /* Run headed so CSS animations play at full speed (no headless throttling) */
    headless: false,
    /* Record video of every test run */
    video: "on",
    /* Keep trace on failure */
    trace: "retain-on-failure",
    /* Viewport matching typical laptop */
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* No webServer block — user starts dev server manually or separately */
});
