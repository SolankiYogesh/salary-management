import { Router } from "express";
import { createSalaryRecordSchema } from "./salaries.schemas.js";
import { addSalaryRecord, listSalaryHistory } from "./salaries.service.js";

export const salariesRouter = Router({ mergeParams: true });

salariesRouter.get("/", async (req, res, next) => {
  try {
    const history = await listSalaryHistory(req.params.employeeId);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

salariesRouter.post("/", async (req, res, next) => {
  try {
    const input = createSalaryRecordSchema.parse(req.body);
    const record = await addSalaryRecord(req.params.employeeId, input);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});
