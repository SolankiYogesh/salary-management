import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    testTimeout: 15000,
    globalSetup: ["./src/tests/global-setup.ts"],
    env: { DATABASE_URL: "file:./test.db" },
    fileParallelism: false,
  },
});
