import { describe, expect, it } from "vitest";
import {
  computeBreakdownBy,
  computeDistribution,
  computeGenderPayGap,
  computeOverview,
  type SalarySnapshot,
} from "../modules/analytics/analytics.service.js";

function snapshot(partial: Partial<SalarySnapshot>): SalarySnapshot {
  return {
    department: "Engineering",
    country: "United States",
    level: "L3",
    gender: "FEMALE",
    status: "ACTIVE",
    currentSalaryUsd: 100_000,
    ...partial,
  };
}

describe("computeOverview", () => {
  it("returns zeros for an empty data set", () => {
    expect(computeOverview([])).toEqual({ headcount: 0, totalPayrollUsd: 0, avgSalaryUsd: 0, medianSalaryUsd: 0 });
  });

  it("computes headcount, total, average and median", () => {
    const snapshots = [snapshot({ currentSalaryUsd: 50_000 }), snapshot({ currentSalaryUsd: 100_000 }), snapshot({ currentSalaryUsd: 150_000 })];
    const overview = computeOverview(snapshots);
    expect(overview.headcount).toBe(3);
    expect(overview.totalPayrollUsd).toBe(300_000);
    expect(overview.avgSalaryUsd).toBe(100_000);
    expect(overview.medianSalaryUsd).toBe(100_000);
  });

  it("averages the two middle values for an even-sized data set", () => {
    const snapshots = [snapshot({ currentSalaryUsd: 10 }), snapshot({ currentSalaryUsd: 20 }), snapshot({ currentSalaryUsd: 30 }), snapshot({ currentSalaryUsd: 40 })];
    expect(computeOverview(snapshots).medianSalaryUsd).toBe(25);
  });
});

describe("computeBreakdownBy", () => {
  it("groups snapshots by department and sorts by total payroll descending", () => {
    const snapshots = [
      snapshot({ department: "Sales", currentSalaryUsd: 60_000 }),
      snapshot({ department: "Engineering", currentSalaryUsd: 100_000 }),
      snapshot({ department: "Engineering", currentSalaryUsd: 120_000 }),
    ];
    const breakdown = computeBreakdownBy(snapshots, "department");
    expect(breakdown).toEqual([
      { key: "Engineering", headcount: 2, totalPayrollUsd: 220_000, avgSalaryUsd: 110_000 },
      { key: "Sales", headcount: 1, totalPayrollUsd: 60_000, avgSalaryUsd: 60_000 },
    ]);
  });
});

describe("computeDistribution", () => {
  it("buckets salaries into fixed-size ranges", () => {
    const snapshots = [snapshot({ currentSalaryUsd: 5_000 }), snapshot({ currentSalaryUsd: 15_000 }), snapshot({ currentSalaryUsd: 25_000 })];
    const buckets = computeDistribution(snapshots, 10_000);
    expect(buckets).toEqual([
      { rangeStartUsd: 0, rangeEndUsd: 10_000, count: 1 },
      { rangeStartUsd: 10_000, rangeEndUsd: 20_000, count: 1 },
      { rangeStartUsd: 20_000, rangeEndUsd: 30_000, count: 1 },
    ]);
  });

  it("returns an empty array for no data", () => {
    expect(computeDistribution([])).toEqual([]);
  });
});

describe("computeGenderPayGap", () => {
  it("computes a null gap when a department has only one gender represented", () => {
    const snapshots = [snapshot({ department: "Legal", gender: "FEMALE", currentSalaryUsd: 100_000 })];
    const [row] = computeGenderPayGap(snapshots);
    expect(row.gapPct).toBeNull();
  });

  it("computes the percentage gap between average male and female pay", () => {
    const snapshots = [
      snapshot({ department: "Engineering", gender: "MALE", currentSalaryUsd: 100_000 }),
      snapshot({ department: "Engineering", gender: "FEMALE", currentSalaryUsd: 90_000 }),
    ];
    const [row] = computeGenderPayGap(snapshots);
    expect(row.gapPct).toBeCloseTo(10, 5);
  });
});
