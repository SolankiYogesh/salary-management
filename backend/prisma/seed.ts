import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import {
  COUNTRIES,
  DEPARTMENTS,
  EXCHANGE_RATES_TO_USD,
  GENDERS,
  LEVELS,
  type Department,
  type Level,
} from "../src/domain/constants.js";

const prisma = new PrismaClient();

const EMPLOYEE_COUNT = 10_000;
const TERMINATED_RATIO = 0.06;
const DAY_MS = 24 * 60 * 60 * 1000;

const BASE_SALARY_USD: Record<Level, number> = {
  L1: 55_000,
  L2: 72_000,
  L3: 92_000,
  L4: 118_000,
  L5: 148_000,
  L6: 185_000,
  M1: 128_000,
  M2: 158_000,
  M3: 205_000,
};

const ROLE_NAME: Record<Department, string> = {
  Engineering: "Engineer",
  Product: "Product Manager",
  Design: "Product Designer",
  Sales: "Account Executive",
  Marketing: "Marketing Specialist",
  "Customer Support": "Support Specialist",
  Finance: "Financial Analyst",
  "Human Resources": "HR Specialist",
  Operations: "Operations Analyst",
  Legal: "Legal Counsel",
};

const IC_PREFIX: Record<string, string> = {
  L1: "Associate",
  L2: "",
  L3: "Senior",
  L4: "Staff",
  L5: "Principal",
  L6: "Distinguished",
};

function buildTitle(department: Department, level: Level): string {
  const role = ROLE_NAME[department];
  if (level === "M1") return `${department} Manager`;
  if (level === "M2") return `Senior ${department} Manager`;
  if (level === "M3") return `Director of ${department}`;

  const prefix = IC_PREFIX[level];
  return prefix ? `${prefix} ${role}` : role;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface GeneratedEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  country: string;
  currency: string;
  department: Department;
  jobTitle: string;
  level: Level;
  status: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GeneratedSalaryRecord {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  reason: string;
  effectiveDate: Date;
  note: string | null;
  createdAt: Date;
}

function generateSalaryHistory(
  employeeId: string,
  currency: string,
  level: Level,
  hireDate: Date,
  now: Date,
): GeneratedSalaryRecord[] {
  const usdRate = EXCHANGE_RATES_TO_USD[currency];
  const baseUsd = BASE_SALARY_USD[level] * (0.9 + Math.random() * 0.2);
  let currentUsd = baseUsd;

  const records: GeneratedSalaryRecord[] = [
    {
      id: crypto.randomUUID(),
      employeeId,
      amount: round2(currentUsd / usdRate),
      currency,
      reason: "HIRE",
      effectiveDate: hireDate,
      note: null,
      createdAt: hireDate,
    },
  ];

  const yearsSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (365 * DAY_MS));
  const raiseCount = Math.min(yearsSinceHire, 5);

  for (let i = 1; i <= raiseCount; i += 1) {
    const effectiveDate = new Date(hireDate.getTime() + i * 365 * DAY_MS + faker.number.int({ min: -10, max: 10 }) * DAY_MS);
    if (effectiveDate > now) break;

    currentUsd *= 1 + (0.03 + Math.random() * 0.05);
    const reason = Math.random() < 0.15 ? "MARKET_ADJUSTMENT" : "ANNUAL_REVIEW";

    records.push({
      id: crypto.randomUUID(),
      employeeId,
      amount: round2(currentUsd / usdRate),
      currency,
      reason,
      effectiveDate,
      note: null,
      createdAt: effectiveDate,
    });
  }

  return records;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomPastDate(yearsBack: number): Date {
  const now = Date.now();
  const past = now - yearsBack * 365 * DAY_MS;
  return new Date(past + Math.random() * (now - past));
}

async function chunkedCreateMany<T>(items: T[], size: number, create: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await create(items.slice(i, i + size));
  }
}

async function main() {
  faker.seed(42);

  console.log("Resetting database...");
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.exchangeRate.deleteMany();

  console.log("Seeding exchange rates...");
  await prisma.exchangeRate.createMany({
    data: Object.entries(EXCHANGE_RATES_TO_USD).map(([currency, rateToUsd]) => ({ currency, rateToUsd })),
  });

  console.log(`Generating ${EMPLOYEE_COUNT} employees...`);
  const now = new Date();
  const employees: GeneratedEmployee[] = [];
  const emailCounts = new Map<string, number>();

  for (let i = 0; i < EMPLOYEE_COUNT; i += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const baseEmail = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "");
    const dupeCount = emailCounts.get(baseEmail) ?? 0;
    emailCounts.set(baseEmail, dupeCount + 1);
    const email = dupeCount === 0 ? `${baseEmail}@acme-corp.com` : `${baseEmail}${dupeCount}@acme-corp.com`;

    const countryInfo = pick(COUNTRIES);
    const department = pick(DEPARTMENTS);
    const level = pick(LEVELS);
    const hireDate = randomPastDate(8);
    const status = Math.random() < TERMINATED_RATIO ? "TERMINATED" : "ACTIVE";

    employees.push({
      id: crypto.randomUUID(),
      employeeCode: `EMP${String(i + 1).padStart(6, "0")}`,
      firstName,
      lastName,
      email,
      gender: pick(GENDERS),
      country: countryInfo.country,
      currency: countryInfo.currency,
      department,
      jobTitle: buildTitle(department, level),
      level,
      status,
      hireDate,
      createdAt: hireDate,
      updatedAt: hireDate,
    });
  }

  console.log("Inserting employees...");
  await chunkedCreateMany(employees, 1000, (chunk) => prisma.employee.createMany({ data: chunk }));

  console.log("Generating and inserting salary history...");
  let salaryBuffer: GeneratedSalaryRecord[] = [];
  for (const employee of employees) {
    const history = generateSalaryHistory(employee.id, employee.currency, employee.level, employee.hireDate, now);
    salaryBuffer.push(...history);
    if (salaryBuffer.length >= 2000) {
      await prisma.salaryRecord.createMany({ data: salaryBuffer });
      salaryBuffer = [];
    }
  }
  if (salaryBuffer.length > 0) {
    await prisma.salaryRecord.createMany({ data: salaryBuffer });
  }

  const employeeTotal = await prisma.employee.count();
  const salaryTotal = await prisma.salaryRecord.count();
  console.log(`Done. Employees: ${employeeTotal}, salary records: ${salaryTotal}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
