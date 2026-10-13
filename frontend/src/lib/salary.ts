import type { SalaryRecord } from "./types";

export function pickCurrentSalaryRecord(records: SalaryRecord[]): SalaryRecord | null {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => {
    const dateDiff = new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
}
