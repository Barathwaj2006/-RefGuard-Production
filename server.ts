import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ScanOrchestrator } from "./backend/src/orchestrator/scan-orchestrator.js";
import { ReportService } from "./backend/src/community/report-service.js";
import { CopilotService } from "./backend/src/ai/copilot-service.js";
import { ConversationAnalyzer } from "./backend/src/ai/conversation-analyzer.js";
import { createScanRouter } from "./backend/src/routes/scan-routes.js";
import { createReportRouter } from "./backend/src/routes/report-routes.js";
import { createCopilotRouter } from "./backend/src/routes/copilot-routes.js";
import { createHealthRouter } from "./backend/src/routes/health-routes.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API v1 routers
  const scanOrchestrator = new ScanOrchestrator();
  const reportService = new ReportService();
  const copilotService = new CopilotService();
  const conversationAnalyzer = new ConversationAnalyzer();

  app.use("/api/v1", createScanRouter(scanOrchestrator));
  app.use("/api/v1", createReportRouter(reportService));
  app.use("/api/v1", createCopilotRouter(copilotService, conversationAnalyzer));
  app.use("/api/v1", createHealthRouter());
  app.use("/api", createHealthRouter());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
