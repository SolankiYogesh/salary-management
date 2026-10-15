import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function testDatabaseUrl(): string {
  const fromEnv = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;
  if (fromEnv) return fromEnv;
  const match = readFileSync("./.env", "utf8").match(/^TEST_DATABASE_URL="?([^"\n]+)"?/m);
  if (!match) {
    throw new Error("TEST_DATABASE_URL must be set in backend/.env to run tests");
  }
  return match[1];
}

export async function setup() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "inherit",
  });
}

export async function teardown() {}
