import cors from "cors";
import express, { Express, Router } from "express";
import { SnapshotPollingControllers } from "./controllers";
import { adminRoutes, publicRoutes } from "../api/routes";

export default (app: Express, controllers: SnapshotPollingControllers) => {
  app.use(cors());
  app.use(express.json());
  app.get("/status", (_req, res) => {
    res.status(200).send({ status: "up" });
  });

  const router = Router();

  adminRoutes(router, controllers);
  publicRoutes(router, controllers);

  app.use("/api", router);

  app.use((req, res, next) => {
    const err: any = new Error("Not Found");
    err["status"] = 404;
    next(err);
  });

  app.use((err: any, req: any, res: any, next: any) => {
    if (err.name === "UnauthorizedError") {
      return res.status(err.status).send({ message: err.message }).end();
    }
    return next(err);
  });

  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
      },
    });
  });

  return app;
};
