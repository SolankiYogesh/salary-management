import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";

const app = createApp();

async function resetDatabase() {
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.exchangeRate.createMany({ data: [{ currency: "USD", rateToUsd: 1 }] });
}

async function seedEmployee(status: "ACTIVE" | "TERMINATED" = "ACTIVE") {
  return prisma.employee.create({
    data: {
      employeeCode: `EMP${Math.random().toString(36).slice(2, 8)}`,
      firstName: "Ada",
      lastName: "Lovelace",
      email: `ada-${Math.random().toString(36).slice(2, 8)}@acme-corp.com`,
      gender: "FEMALE",
      country: "United States",
      currency: "USD",
      department: "Engineering",
      jobTitle: "Senior Engineer",
      level: "L3",
      status,
      hireDate: new Date("2022-01-01"),
    },
  });
}

describe("POST /api/employees/:employeeId/salary-records", () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("adds a salary record for an active employee", async () => {
    const employee = await seedEmployee();

    const res = await request(app).post(`/api/employees/${employee.id}/salary-records`).send({
      amount: 95000,
      currency: "USD",
      reason: "ANNUAL_REVIEW",
      effectiveDate: "2023-06-01",
    });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(95000);
  });

  it("rejects an effective date before the employee's hire date", async () => {
    const employee = await seedEmployee();

    const res = await request(app).post(`/api/employees/${employee.id}/salary-records`).send({
      amount: 95000,
      currency: "USD",
      reason: "ANNUAL_REVIEW",
      effectiveDate: "2020-01-01",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a non-correction salary record for a terminated employee", async () => {
    const employee = await seedEmployee("TERMINATED");

    const res = await request(app).post(`/api/employees/${employee.id}/salary-records`).send({
      amount: 95000,
      currency: "USD",
      reason: "ANNUAL_REVIEW",
      effectiveDate: "2023-06-01",
    });

    expect(res.status).toBe(400);
  });

  it("allows a correction record for a terminated employee", async () => {
    const employee = await seedEmployee("TERMINATED");

    const res = await request(app).post(`/api/employees/${employee.id}/salary-records`).send({
      amount: 95000,
      currency: "USD",
      reason: "CORRECTION",
      effectiveDate: "2023-06-01",
    });

    expect(res.status).toBe(201);
  });

  it("returns 404 for an unknown employee", async () => {
    const res = await request(app).post("/api/employees/does-not-exist/salary-records").send({
      amount: 95000,
      currency: "USD",
      reason: "ANNUAL_REVIEW",
      effectiveDate: "2023-06-01",
    });

    expect(res.status).toBe(404);
  });
});
