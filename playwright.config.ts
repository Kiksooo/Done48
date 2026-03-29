import { defineConfig, devices } from "@playwright/test";

const port = 3000;
/** Для проверки уже задеплоенного сайта: PLAYWRIGHT_BASE_URL=https://your.domain */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const useLocalWebServer = !process.env.PLAYWRIGHT_BASE_URL;

/** Дочерний процесс next не всегда наследует env; без NEXTAUTH_SECRET `next start` падает (NO_SECRET). */
const webServerEnv = {
  ...process.env,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ?? "playwright-e2e-secret-min-32-characters-00",
};

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
  webServer: useLocalWebServer
    ? process.env.CI
      ? {
          command: `npm run start -- -p ${port}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
          env: webServerEnv,
        }
      : {
          command: `npm run dev -- -p ${port}`,
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
          env: webServerEnv,
        }
    : undefined,
});
