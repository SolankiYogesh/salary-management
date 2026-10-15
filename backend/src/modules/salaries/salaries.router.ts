import { Router } from "express";
import { createSalaryRecordSchema } from "./salaries.schemas.js";
import { addSalaryRecord, listSalaryHistory } from "./salaries.service.js";

export const salariesRouter = Router({ mergeParams: true });

salariesRouter.get("/", async (req, res, next) => {
  try {
    const { employeeId } = req.params as { employeeId: string };
    const history = await listSalaryHistory(employeeId);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

salariesRouter.post("/", async (req, res, next) => {
  try {
    const input = createSalaryRecordSchema.parse(req.body);
    const { employeeId } = req.params as { employeeId: string };
    const record = await addSalaryRecord(employeeId, input);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});
