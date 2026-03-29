import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const root = __dirname;
  const env = loadEnv(mode, root, "");
  if (env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = env.TEST_DATABASE_URL;
  } else if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }

  return {
    test: {
      environment: "node",
      globals: true,
      globalSetup: ["./tests/global-setup.ts"],
      setupFiles: ["./tests/setup.ts"],
      include: ["tests/**/*.test.ts"],
      fileParallelism: false,
      testTimeout: 30_000,
      hookTimeout: 30_000,
    },
    resolve: {
      alias: {
        "@": path.resolve(root, "./src"),
      },
    },
  };
});
