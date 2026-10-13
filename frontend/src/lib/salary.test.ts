import { describe, expect, it } from "vitest";
import { pickCurrentSalaryRecord } from "./salary";
import type { SalaryRecord } from "./types";

function record(partial: Partial<SalaryRecord>): SalaryRecord {
  return {
    id: "id",
    employeeId: "emp-1",
    amount: 0,
    currency: "USD",
    reason: "ANNUAL_REVIEW",
    effectiveDate: "2020-01-01",
    note: null,
    createdAt: "2020-01-01",
    ...partial,
  };
}

describe("pickCurrentSalaryRecord", () => {
  it("returns null for an empty history", () => {
    expect(pickCurrentSalaryRecord([])).toBeNull();
  });

  it("picks the record with the latest effective date", () => {
    const older = record({ id: "a", effectiveDate: "2021-01-01" });
    const newer = record({ id: "b", effectiveDate: "2023-01-01" });
    expect(pickCurrentSalaryRecord([older, newer])?.id).toBe("b");
  });

  it("breaks ties on effective date using createdAt", () => {
    const sameDate = "2023-01-01";
    const first = record({ id: "a", effectiveDate: sameDate, createdAt: "2023-01-01T09:00:00Z" });
    const second = record({ id: "b", effectiveDate: sameDate, createdAt: "2023-01-01T10:00:00Z" });
    expect(pickCurrentSalaryRecord([first, second])?.id).toBe("b");
  });
});
