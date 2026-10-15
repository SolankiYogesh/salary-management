import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { NotFoundError, ValidationError } from "../../lib/http-error.js";
import { toUsd } from "../../lib/currency.js";
import { toPageResult, type PageRequest, type PageResult } from "../../lib/pagination.js";
import type { CreateEmployeeInput, EmployeeListQuery, UpdateEmployeeInput } from "./employees.schemas.js";

export interface EmployeeListRow {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  country: string;
  jobTitle: string;
  level: string;
  status: string;
  hireDate: string;
  currentSalary: number;
  currentCurrency: string;
  currentSalaryUsd: number;
}

function buildListFilters(query: EmployeeListQuery): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];

  if (query.search) {
    const like = `%${query.search.toLowerCase()}%`;
    conditions.push(
      Prisma.sql`(lower(e."firstName") LIKE ${like} OR lower(e."lastName") LIKE ${like} OR lower(e.email) LIKE ${like} OR lower(e."employeeCode") LIKE ${like})`,
    );
  }
  if (query.department) {
    conditions.push(Prisma.sql`e.department = ${query.department}`);
  }
  if (query.country) {
    conditions.push(Prisma.sql`e.country = ${query.country}`);
  }
  if (query.status) {
    conditions.push(Prisma.sql`e.status = ${query.status}`);
  }

  if (conditions.length === 0) {
    return Prisma.sql``;
  }
  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

function buildOrderClause(query: EmployeeListQuery): Prisma.Sql {
  const dir = query.sortDir === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  switch (query.sortBy) {
    case "hireDate":
      return Prisma.sql`ORDER BY e."hireDate" ${dir}`;
    case "currentSalaryUsd":
      return Prisma.sql`ORDER BY e."lastName" ${dir}, e."firstName" ${dir}`;
    case "name":
    default:
      return Prisma.sql`ORDER BY e."lastName" ${dir}, e."firstName" ${dir}`;
  }
}

export async function listEmployees(
  query: EmployeeListQuery,
  pageRequest: PageRequest,
): Promise<PageResult<EmployeeListRow>> {
  const where = buildListFilters(query);
  const orderBy = buildOrderClause(query);
  const offset = (pageRequest.page - 1) * pageRequest.pageSize;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      email: string;
      department: string;
      country: string;
      jobTitle: string;
      level: string;
      status: string;
      hireDate: string;
      currentSalary: number;
      currentCurrency: string;
    }>
  >`
    SELECT
      e.id, e."employeeCode", e."firstName", e."lastName", e.email, e.department,
      e.country, e."jobTitle", e.level, e.status, e."hireDate",
      s.amount AS "currentSalary", s.currency AS "currentCurrency"
    FROM "Employee" e
    LEFT JOIN "SalaryRecord" s ON s.id = (
      SELECT sr.id FROM "SalaryRecord" sr
      WHERE sr."employeeId" = e.id
      ORDER BY sr."effectiveDate" DESC, sr."createdAt" DESC
      LIMIT 1
    )
    ${where}
  `;

  const rates = await getExchangeRateMap();
  const enriched = rows
    .map((row) => ({
      ...row,
      currentSalaryUsd: row.currentSalary ? row.currentSalary * (rates[row.currentCurrency] ?? 0) : 0,
    }))
    .sort((a, b) => compareForSort(a, b, query));

  const total = enriched.length;
  const items = enriched.slice(offset, offset + pageRequest.pageSize);

  return toPageResult(items, total, pageRequest);
}

function compareForSort(a: EmployeeListRow, b: EmployeeListRow, query: EmployeeListQuery): number {
  const dir = query.sortDir === "desc" ? -1 : 1;
  if (query.sortBy === "hireDate") {
    return dir * (new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime());
  }
  if (query.sortBy === "currentSalaryUsd") {
    return dir * (a.currentSalaryUsd - b.currentSalaryUsd);
  }
  const nameA = `${a.lastName} ${a.firstName}`;
  const nameB = `${b.lastName} ${b.firstName}`;
  return dir * nameA.localeCompare(nameB);
}

async function getExchangeRateMap(): Promise<Record<string, number>> {
  const rates = await prisma.exchangeRate.findMany();
  return Object.fromEntries(rates.map((r) => [r.currency, r.rateToUsd]));
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      salaryRecords: {
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!employee) {
    throw new NotFoundError(`Employee ${id} not found`);
  }
  return employee;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const existing = await prisma.employee.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ValidationError(`Email ${input.email} is already in use`);
  }

  return prisma.$transaction(async (tx) => {
    const count = await tx.employee.count();
    const employeeCode = `EMP${String(count + 1).padStart(6, "0")}`;

    const employee = await tx.employee.create({
      data: {
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        gender: input.gender,
        country: input.country,
        currency: input.currency,
        department: input.department,
        jobTitle: input.jobTitle,
        level: input.level,
        hireDate: input.hireDate,
        status: "ACTIVE",
      },
    });

    await tx.salaryRecord.create({
      data: {
        employeeId: employee.id,
        amount: input.startingSalary,
        currency: input.currency,
        reason: "HIRE",
        effectiveDate: input.hireDate,
      },
    });

    return employee;
  });
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  await getEmployeeById(id);
  return prisma.employee.update({ where: { id }, data: input });
}

export function toUsdSafe(amount: number, currency: string): number {
  try {
    return toUsd(amount, currency);
  } catch {
    return 0;
  }
}
