import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { analyticsRouter } from "./modules/analytics/analytics.router.js";
import { employeesRouter } from "./modules/employees/employees.router.js";
import { metaRouter } from "./modules/meta/meta.router.js";
import { salariesRouter } from "./modules/salaries/salaries.router.js";
import { HttpError } from "./lib/http-error.js";
import { ZodError } from "zod";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/employees", employeesRouter);
  app.use("/api/employees/:employeeId/salary-records", salariesRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/meta", metaRouter);

  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ message: "Validation failed", issues: err.issues });
      return;
    }
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

const app = createApp();

export default app;
