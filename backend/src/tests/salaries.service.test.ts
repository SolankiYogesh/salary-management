import type { SalaryRecord } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { pickCurrentSalaryRecord } from "../modules/salaries/salaries.service.js";

function record(partial: Partial<SalaryRecord>): SalaryRecord {
  return {
    id: partial.id ?? "id",
    employeeId: "emp-1",
    amount: 0,
    currency: "USD",
    reason: "ANNUAL_REVIEW",
    effectiveDate: new Date("2020-01-01"),
    note: null,
    createdAt: new Date("2020-01-01"),
    ...partial,
  };
}

describe("pickCurrentSalaryRecord", () => {
  it("returns null when there are no records", () => {
    expect(pickCurrentSalaryRecord([])).toBeNull();
  });

  it("picks the record with the latest effective date", () => {
    const older = record({ id: "a", amount: 80_000, effectiveDate: new Date("2021-01-01") });
    const newer = record({ id: "b", amount: 95_000, effectiveDate: new Date("2023-01-01") });
    expect(pickCurrentSalaryRecord([older, newer])?.id).toBe("b");
  });

  it("breaks ties on effective date using createdAt", () => {
    const sameDate = new Date("2023-01-01");
    const createdFirst = record({ id: "a", effectiveDate: sameDate, createdAt: new Date("2023-01-01T09:00:00Z") });
    const createdSecond = record({ id: "b", effectiveDate: sameDate, createdAt: new Date("2023-01-01T10:00:00Z") });
    expect(pickCurrentSalaryRecord([createdFirst, createdSecond])?.id).toBe("b");
  });

  it("does not mutate the input array", () => {
    const records = [record({ id: "a", effectiveDate: new Date("2022-01-01") }), record({ id: "b", effectiveDate: new Date("2021-01-01") })];
    const copy = [...records];
    pickCurrentSalaryRecord(records);
    expect(records).toEqual(copy);
  });
});
