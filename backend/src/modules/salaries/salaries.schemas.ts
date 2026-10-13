import { z } from "zod";
import { SALARY_CHANGE_REASONS } from "../../domain/constants.js";

export const createSalaryRecordSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  reason: z.enum(SALARY_CHANGE_REASONS),
  effectiveDate: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
});

export type CreateSalaryRecordInput = z.infer<typeof createSalaryRecordSchema>;
