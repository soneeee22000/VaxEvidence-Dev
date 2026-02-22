import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false, // Sequential to avoid auth state conflicts
    // setup.ts is imported by each test file (not a vitest setupFile)
    // to enable per-file describe.skipIf when env vars are missing
  },
});
