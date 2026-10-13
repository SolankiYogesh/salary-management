import { Router } from "express";
import { COUNTRIES, DEPARTMENTS, EMPLOYEE_STATUSES, GENDERS, LEVELS, SALARY_CHANGE_REASONS } from "../../domain/constants.js";

export const metaRouter = Router();

metaRouter.get("/", (_req, res) => {
  res.json({
    countries: COUNTRIES,
    departments: DEPARTMENTS,
    levels: LEVELS,
    salaryChangeReasons: SALARY_CHANGE_REASONS,
    employeeStatuses: EMPLOYEE_STATUSES,
    genders: GENDERS,
  });
});
