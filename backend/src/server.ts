import { createBackendApp } from "./app.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = "0.0.0.0";

const app = createBackendApp();

app.listen(PORT, HOST, () => {
  console.log(`RefGuard Backend API Server running on http://${HOST}:${PORT}`);
  console.log(`- Scan Endpoint: POST http://${HOST}:${PORT}/api/v1/scan`);
  console.log(`- Report Endpoint: POST http://${HOST}:${PORT}/api/v1/report`);
  console.log(`- Health Endpoint: GET http://${HOST}:${PORT}/api/v1/health`);
});
