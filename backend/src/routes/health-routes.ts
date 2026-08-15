import { Router, Request, Response } from "express";

export function createHealthRouter(): Router {
  const router = Router();

  const healthHandler = (req: Request, res: Response) => {
    res.status(200).json({
      status: "HEALTHY",
      service: "RefGuard-Backend-API",
      version: "1.0.0-PROPOSED",
      contract_layer: "v1",
      timestamp: new Date().toISOString()
    });
  };

  router.get("/health", healthHandler);
  router.get("/healthz", healthHandler);
  router.get("/ready", healthHandler);

  return router;
}
