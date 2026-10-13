import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";

const app = createApp();

async function resetDatabase() {
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.exchangeRate.createMany({
    data: [
      { currency: "USD", rateToUsd: 1 },
      { currency: "EUR", rateToUsd: 1.08 },
    ],
  });
}

async function seedEmployee(overrides: Partial<Parameters<typeof prisma.employee.create>[0]["data"]> = {}) {
  return prisma.employee.create({
    data: {
      employeeCode: overrides.employeeCode ?? `EMP${Math.random().toString(36).slice(2, 8)}`,
      firstName: "Ada",
      lastName: "Lovelace",
      email: `ada-${Math.random().toString(36).slice(2, 8)}@acme-corp.com`,
      gender: "FEMALE",
      country: "United States",
      currency: "USD",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      level: "L3",
      status: "ACTIVE",
      hireDate: new Date("2021-01-01"),
      ...overrides,
    },
  });
}

describe("GET /api/employees", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a paginated, empty result when there are no employees", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0, page: 1, pageSize: 25 });
  });

  it("filters by department", async () => {
    const engineer = await seedEmployee({ department: "Engineering" });
    await seedEmployee({ department: "Sales", email: "sales@acme-corp.com", employeeCode: "EMP900001" });

    const res = await request(app).get("/api/employees").query({ department: "Engineering" });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(engineer.id);
  });

  it("paginates results", async () => {
    for (let i = 0; i < 5; i += 1) {
      await seedEmployee({
        employeeCode: `EMP10000${i}`,
        email: `person${i}@acme-corp.com`,
        lastName: `Lastname${i}`,
      });
    }

    const res = await request(app).get("/api/employees").query({ pageSize: 2, page: 2 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
  });

  it("rejects an invalid department filter", async () => {
    const res = await request(app).get("/api/employees").query({ department: "NotARealDept" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/employees", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates an employee with an initial HIRE salary record", async () => {
    const res = await request(app)
      .post("/api/employees")
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace.hopper@acme-corp.com",
        gender: "FEMALE",
        country: "United States",
        currency: "USD",
        department: "Engineering",
        jobTitle: "Principal Engineer",
        level: "L5",
        hireDate: "2024-01-15",
        startingSalary: 150000,
      });

    expect(res.status).toBe(201);
    expect(res.body.employeeCode).toMatch(/^EMP\d{6}$/);

    const salaryRecords = await prisma.salaryRecord.findMany({ where: { employeeId: res.body.id } });
    expect(salaryRecords).toHaveLength(1);
    expect(salaryRecords[0].reason).toBe("HIRE");
    expect(salaryRecords[0].amount).toBe(150000);
  });

  it("rejects a duplicate email", async () => {
    await seedEmployee({ email: "dupe@acme-corp.com" });

    const res = await request(app)
      .post("/api/employees")
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: "dupe@acme-corp.com",
        gender: "FEMALE",
        country: "United States",
        currency: "USD",
        department: "Engineering",
        jobTitle: "Principal Engineer",
        level: "L5",
        hireDate: "2024-01-15",
        startingSalary: 150000,
      });

    expect(res.status).toBe(400);
  });

  it("rejects a non-positive starting salary", async () => {
    const res = await request(app)
      .post("/api/employees")
      .send({
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace2@acme-corp.com",
        gender: "FEMALE",
        country: "United States",
        currency: "USD",
        department: "Engineering",
        jobTitle: "Principal Engineer",
        level: "L5",
        hireDate: "2024-01-15",
        startingSalary: -5,
      });

    expect(res.status).toBe(400);
  });
});
