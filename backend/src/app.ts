import express, { Express, Request, Response, NextFunction } from "express";
import { ScanOrchestrator } from "./orchestrator/scan-orchestrator.js";
import { ThreatIntelService } from "./threat-intelligence/threat-intel-service.js";
import { ReportService } from "./community/report-service.js";
import { CopilotService } from "./ai/copilot-service.js";
import { ConversationAnalyzer } from "./ai/conversation-analyzer.js";
import { createScanRouter } from "./routes/scan-routes.js";
import { createReportRouter } from "./routes/report-routes.js";
import { createHealthRouter } from "./routes/health-routes.js";
import { createCopilotRouter } from "./routes/copilot-routes.js";
import { ErrorResponse } from "./types/contracts.js";

export function createBackendApp(): Express {
  const app = express();

  // Basic Middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS Headers for API calls
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  });

  // Services
  const threatIntelService = new ThreatIntelService();
  const scanOrchestrator = new ScanOrchestrator(threatIntelService);
  const reportService = new ReportService(threatIntelService);
  const copilotService = new CopilotService();
  const conversationAnalyzer = new ConversationAnalyzer();

  // Routers
  const scanRouter = createScanRouter(scanOrchestrator);
  const reportRouter = createReportRouter(reportService);
  const copilotRouter = createCopilotRouter(copilotService, conversationAnalyzer);
  const healthRouter = createHealthRouter();

  // Mount API v1 endpoints
  app.use("/api/v1", scanRouter);
  app.use("/api/v1", reportRouter);
  app.use("/api/v1", copilotRouter);
  app.use("/api/v1", healthRouter);

  // Direct Health route
  app.use("/api", healthRouter);
  app.use("/", healthRouter);

  // 404 handler for API routes
  app.use("/api/*", (req: Request, res: Response) => {
    const errorRes: ErrorResponse = {
      error_code: "RESOURCE_NOT_FOUND",
      error_message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
      details: "Supported routes include POST /api/v1/scan, POST /api/v1/report, POST /api/v1/copilot/ask, and POST /api/v1/analyze/conversation"
    };
    res.status(404).json(errorRes);
  });

  return app;
}
