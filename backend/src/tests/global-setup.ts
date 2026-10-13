import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";

const DB_FILE = "test.db";

export async function setup() {
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: `file:${DB_FILE}` },
    stdio: "inherit",
  });
}

export async function teardown() {
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
  if (existsSync(`${DB_FILE}-journal`)) unlinkSync(`${DB_FILE}-journal`);
}
