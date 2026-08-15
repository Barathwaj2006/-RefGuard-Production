import { Router, Request, Response } from "express";
import { ReportService } from "../community/report-service.js";
import { validateScamReport } from "../validators/schema-validator.js";
import { ErrorResponse } from "../types/contracts.js";
import { generateCybercrimeDossier } from "../community/cybercrime-export.js";

export function createReportRouter(reportService: ReportService): Router {
  const router = Router();

  router.post("/report", (req: Request, res: Response) => {
    try {
      const validation = validateScamReport(req.body);

      if (!validation.isValid || !validation.data) {
        const errorRes: ErrorResponse = {
          error_code: "INVALID_REPORT_PAYLOAD",
          error_message: "Report validation failed",
          details: validation.error || "The submitted payload does not match the ScamReport contract."
        };
        res.status(400).json(errorRes);
        return;
      }

      const result = reportService.submitReport(validation.data);
      res.status(200).json(result);
    } catch (err: unknown) {
      console.error("Error saving report:", err);
      const errorRes: ErrorResponse = {
        error_code: "REPORT_SUBMISSION_ERROR",
        error_message: "Failed to process scam report",
        details: err instanceof Error ? err.message : "Unknown internal error"
      };
      res.status(500).json(errorRes);
    }
  });

  // Export official National Cyber Crime Reporting Portal (1930) complaint dossier
  router.post("/report/export", (req: Request, res: Response) => {
    try {
      const { scan, report, complainant_note } = req.body;
      if (!scan || !scan.scan_id || !scan.risk_assessment) {
        const errorRes: ErrorResponse = {
          error_code: "INVALID_EXPORT_REQUEST",
          error_message: "Valid scan object is required for cybercrime dossier export",
          details: "Body must contain { scan: ScanResponse }"
        };
        res.status(400).json(errorRes);
        return;
      }

      const dossier = generateCybercrimeDossier(scan, report, complainant_note);
      res.status(200).json(dossier);
    } catch (err: unknown) {
      console.error("Error generating cybercrime dossier:", err);
      const errorRes: ErrorResponse = {
        error_code: "DOSSIER_GENERATION_FAILED",
        error_message: "Failed to generate official cybercrime dossier",
        details: err instanceof Error ? err.message : "Unknown internal error"
      };
      res.status(500).json(errorRes);
    }
  });

  return router;
}
