import { Router } from "express";
import { parsePageRequest } from "../../lib/pagination.js";
import { createEmployeeSchema, employeeListQuerySchema, updateEmployeeSchema } from "./employees.schemas.js";
import { createEmployee, getEmployeeById, listEmployees, updateEmployee } from "./employees.service.js";

export const employeesRouter = Router();

employeesRouter.get("/", async (req, res, next) => {
  try {
    const query = employeeListQuerySchema.parse(req.query);
    const pageRequest = parsePageRequest(req.query as Record<string, unknown>);
    const result = await listEmployees(query, pageRequest);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

employeesRouter.get("/:id", async (req, res, next) => {
  try {
    const employee = await getEmployeeById(req.params.id);
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

employeesRouter.post("/", async (req, res, next) => {
  try {
    const input = createEmployeeSchema.parse(req.body);
    const employee = await createEmployee(input);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
});

employeesRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = updateEmployeeSchema.parse(req.body);
    const employee = await updateEmployee(req.params.id, input);
    res.json(employee);
  } catch (err) {
    next(err);
  }
});
