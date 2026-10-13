import { prisma } from "../../db/client.js";

export interface SalarySnapshot {
  department: string;
  country: string;
  level: string;
  gender: string;
  status: string;
  currentSalaryUsd: number;
}

export interface Overview {
  headcount: number;
  totalPayrollUsd: number;
  avgSalaryUsd: number;
  medianSalaryUsd: number;
}

export interface GroupBreakdown {
  key: string;
  headcount: number;
  totalPayrollUsd: number;
  avgSalaryUsd: number;
}

export interface HistogramBucket {
  rangeStartUsd: number;
  rangeEndUsd: number;
  count: number;
}

export interface GenderGapRow {
  department: string;
  avgByGender: Record<string, number>;
  gapPct: number | null;
}

export async function getActiveEmployeeSalarySnapshots(): Promise<SalarySnapshot[]> {
  return prisma.$queryRaw<SalarySnapshot[]>`
    SELECT
      e.department as department,
      e.country as country,
      e.level as level,
      e.gender as gender,
      e.status as status,
      COALESCE(s.amount * r.rateToUsd, 0) as currentSalaryUsd
    FROM Employee e
    LEFT JOIN SalaryRecord s ON s.id = (
      SELECT sr.id FROM SalaryRecord sr
      WHERE sr.employeeId = e.id
      ORDER BY sr.effectiveDate DESC, sr.createdAt DESC
      LIMIT 1
    )
    LEFT JOIN ExchangeRate r ON r.currency = s.currency
    WHERE e.status = 'ACTIVE'
  `;
}

export function computeOverview(snapshots: SalarySnapshot[]): Overview {
  const headcount = snapshots.length;
  const totalPayrollUsd = sum(snapshots.map((s) => s.currentSalaryUsd));
  const avgSalaryUsd = headcount === 0 ? 0 : totalPayrollUsd / headcount;
  const medianSalaryUsd = median(snapshots.map((s) => s.currentSalaryUsd));
  return { headcount, totalPayrollUsd, avgSalaryUsd, medianSalaryUsd };
}

export function computeBreakdownBy(
  snapshots: SalarySnapshot[],
  key: "department" | "country" | "level",
): GroupBreakdown[] {
  const groups = new Map<string, SalarySnapshot[]>();
  for (const snapshot of snapshots) {
    const groupKey = snapshot[key];
    const bucket = groups.get(groupKey) ?? [];
    bucket.push(snapshot);
    groups.set(groupKey, bucket);
  }

  return Array.from(groups.entries())
    .map(([groupKey, items]) => {
      const totalPayrollUsd = sum(items.map((i) => i.currentSalaryUsd));
      return {
        key: groupKey,
        headcount: items.length,
        totalPayrollUsd,
        avgSalaryUsd: totalPayrollUsd / items.length,
      };
    })
    .sort((a, b) => b.totalPayrollUsd - a.totalPayrollUsd);
}

export function computeDistribution(snapshots: SalarySnapshot[], bucketSizeUsd = 20000): HistogramBucket[] {
  if (snapshots.length === 0) return [];
  const maxSalary = Math.max(...snapshots.map((s) => s.currentSalaryUsd));
  const bucketCount = Math.floor(maxSalary / bucketSizeUsd) + 1;

  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    rangeStartUsd: i * bucketSizeUsd,
    rangeEndUsd: (i + 1) * bucketSizeUsd,
    count: 0,
  }));

  for (const snapshot of snapshots) {
    const index = Math.min(bucketCount - 1, Math.floor(snapshot.currentSalaryUsd / bucketSizeUsd));
    buckets[index].count += 1;
  }

  return buckets;
}

export function computeGenderPayGap(snapshots: SalarySnapshot[]): GenderGapRow[] {
  const byDepartment = new Map<string, SalarySnapshot[]>();
  for (const snapshot of snapshots) {
    const bucket = byDepartment.get(snapshot.department) ?? [];
    bucket.push(snapshot);
    byDepartment.set(snapshot.department, bucket);
  }

  return Array.from(byDepartment.entries())
    .map(([department, items]) => {
      const byGender = new Map<string, number[]>();
      for (const item of items) {
        const list = byGender.get(item.gender) ?? [];
        list.push(item.currentSalaryUsd);
        byGender.set(item.gender, list);
      }

      const avgByGender: Record<string, number> = {};
      for (const [gender, salaries] of byGender.entries()) {
        avgByGender[gender] = sum(salaries) / salaries.length;
      }

      const male = avgByGender.MALE;
      const female = avgByGender.FEMALE;
      const gapPct = male && female ? ((male - female) / male) * 100 : null;

      return { department, avgByGender, gapPct };
    })
    .sort((a, b) => a.department.localeCompare(b.department));
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
