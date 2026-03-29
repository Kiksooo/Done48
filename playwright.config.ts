import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.CI
    ? {
        command: `npm run start -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: `npm run dev -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
