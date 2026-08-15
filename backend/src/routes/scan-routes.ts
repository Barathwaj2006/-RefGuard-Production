import { Router, Request, Response } from "express";
import { ScanOrchestrator } from "../orchestrator/scan-orchestrator.js";
import { validateScanRequest } from "../validators/schema-validator.js";
import { ErrorResponse } from "../types/contracts.js";

export function createScanRouter(orchestrator: ScanOrchestrator): Router {
  const router = Router();

  router.post("/scan", async (req: Request, res: Response) => {
    try {
      const validation = validateScanRequest(req.body);

      if (!validation.isValid || !validation.data) {
        const errorRes: ErrorResponse = {
          error_code: "INVALID_REQUEST_BODY",
          error_message: "Request validation failed",
          details: validation.error || "The submitted payload does not match the ScanRequest contract."
        };
        res.status(400).json(errorRes);
        return;
      }

      const scanResult = await orchestrator.orchestrateScan(validation.data);
      res.status(200).json(scanResult);
    } catch (err: unknown) {
      console.error("Error executing scan:", err);
      const errorRes: ErrorResponse = {
        error_code: "INTERNAL_SCAN_ERROR",
        error_message: "An error occurred while analyzing the content",
        details: err instanceof Error ? err.message : "Unknown internal server error"
      };
      res.status(500).json(errorRes);
    }
  });

  return router;
}
