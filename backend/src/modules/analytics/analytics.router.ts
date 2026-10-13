import { Router } from "express";
import {
  computeBreakdownBy,
  computeDistribution,
  computeGenderPayGap,
  computeOverview,
  getActiveEmployeeSalarySnapshots,
} from "./analytics.service.js";

export const analyticsRouter = Router();

analyticsRouter.get("/overview", async (_req, res, next) => {
  try {
    const snapshots = await getActiveEmployeeSalarySnapshots();
    res.json(computeOverview(snapshots));
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/breakdown/:dimension", async (req, res, next) => {
  try {
    const dimension = req.params.dimension;
    if (dimension !== "department" && dimension !== "country" && dimension !== "level") {
      res.status(400).json({ message: "dimension must be one of department, country, level" });
      return;
    }
    const snapshots = await getActiveEmployeeSalarySnapshots();
    res.json(computeBreakdownBy(snapshots, dimension));
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/distribution", async (_req, res, next) => {
  try {
    const snapshots = await getActiveEmployeeSalarySnapshots();
    res.json(computeDistribution(snapshots));
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get("/gender-pay-gap", async (_req, res, next) => {
  try {
    const snapshots = await getActiveEmployeeSalarySnapshots();
    res.json(computeGenderPayGap(snapshots));
  } catch (err) {
    next(err);
  }
});
