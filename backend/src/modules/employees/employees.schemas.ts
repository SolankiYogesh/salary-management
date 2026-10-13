import { z } from "zod";
import { DEPARTMENTS, EMPLOYEE_STATUSES, GENDERS, LEVELS } from "../../domain/constants.js";

export const employeeListQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  country: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["name", "hireDate", "currentSalaryUsd"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  gender: z.enum(GENDERS),
  country: z.string().min(1),
  currency: z.string().min(1),
  department: z.enum(DEPARTMENTS),
  jobTitle: z.string().trim().min(1).max(150),
  level: z.enum(LEVELS),
  hireDate: z.coerce.date(),
  startingSalary: z.number().positive(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  jobTitle: z.string().trim().min(1).max(150).optional(),
  level: z.enum(LEVELS).optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
