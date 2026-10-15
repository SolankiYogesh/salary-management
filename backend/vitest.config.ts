import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

function testDatabaseUrl(): string {
  const fromEnv = process.env.TEST_DATABASE_URL;
  if (fromEnv) return fromEnv;
  const match = readFileSync("./.env", "utf8").match(/^TEST_DATABASE_URL="?([^"\n]+)"?/m);
  if (!match) {
    throw new Error("TEST_DATABASE_URL must be set in backend/.env to run tests");
  }
  return match[1];
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    testTimeout: 15000,
    globalSetup: ["./src/tests/global-setup.ts"],
    env: { DATABASE_URL: testDatabaseUrl() },
    fileParallelism: false,
  },
});
