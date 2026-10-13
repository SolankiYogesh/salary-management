import type { SalaryRecord } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { NotFoundError, ValidationError } from "../../lib/http-error.js";
import type { CreateSalaryRecordInput } from "./salaries.schemas.js";

export function pickCurrentSalaryRecord(records: SalaryRecord[]): SalaryRecord | null {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => {
    const dateDiff = b.effectiveDate.getTime() - a.effectiveDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0];
}

export async function addSalaryRecord(employeeId: string, input: CreateSalaryRecordInput) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new NotFoundError(`Employee ${employeeId} not found`);
  }

  if (input.effectiveDate < employee.hireDate) {
    throw new ValidationError("Effective date cannot be before the employee's hire date");
  }

  if (employee.status === "TERMINATED" && input.reason !== "CORRECTION") {
    throw new ValidationError("Only CORRECTION salary records can be added for a terminated employee");
  }

  return prisma.salaryRecord.create({
    data: {
      employeeId,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
      effectiveDate: input.effectiveDate,
      note: input.note,
    },
  });
}

export async function listSalaryHistory(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new NotFoundError(`Employee ${employeeId} not found`);
  }
  return prisma.salaryRecord.findMany({
    where: { employeeId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
}
