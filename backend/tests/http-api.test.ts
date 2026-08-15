import { createBackendApp } from "../src/app.js";
import { Server } from "http";

async function runHttpTests() {
  console.log("============================================================");
  console.log("🌐 REFGUARD BACKEND LIVE HTTP API INTEGRATION TESTS");
  console.log("============================================================\n");

  const app = createBackendApp();
  const PORT = 3099;

  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, "127.0.0.1", () => {
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Health Endpoint
    console.log("[HTTP Test 1] Health Checks");
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(healthRes.status === 200, "GET /api/v1/health returns 200 OK");
    const healthJson = await healthRes.json() as Record<string, unknown>;
    assert(healthJson.status === "HEALTHY", "Health status is HEALTHY");

    // 2. Scan Endpoint - Valid Scan
    console.log("\n[HTTP Test 2] POST /api/v1/scan - Valid Request");
    const scanReqBody = {
      content_type: "TEXT",
      content_value: "Join Google Pay with code REF9988 and get ₹50 bonus!",
      source_context: "com.whatsapp",
      timestamp: new Date().toISOString()
    };
    const scanRes = await fetch(`${baseUrl}/api/v1/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scanReqBody)
    });
    assert(scanRes.status === 200, "POST /api/v1/scan returns 200 OK");
    const scanJson = await scanRes.json() as Record<string, unknown>;
    assert(typeof scanJson.scan_id === "string", "Response contains scan_id");
    assert(typeof scanJson.risk_assessment === "object", "Response contains risk_assessment");
    assert(typeof scanJson.protection_decision === "object", "Response contains protection_decision");

    // 3. Scan Endpoint - 400 Bad Request (Missing required fields)
    console.log("\n[HTTP Test 3] POST /api/v1/scan - Invalid Request (400)");
    const badScanRes = await fetch(`${baseUrl}/api/v1/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_type: "INVALID_TYPE" })
    });
    assert(badScanRes.status === 400, "POST /api/v1/scan with invalid payload returns 400 Bad Request");
    const badScanJson = await badScanRes.json() as Record<string, unknown>;
    assert(badScanJson.error_code === "INVALID_REQUEST_BODY", "Error response contains error_code");

    // 4. Report Endpoint - 200 OK
    console.log("\n[HTTP Test 4] POST /api/v1/report - Valid Submission");
    const reportReqBody = {
      report_id: "rep-http-1",
      reported_indicator: "scam-collector@upi",
      report_category: "PHISHING",
      description: "Phishing collect request",
      submission_timestamp: new Date().toISOString(),
      moderation_status: "PENDING",
      confidence: 0.95,
      provenance: "MOBILE_APP"
    };
    const reportRes = await fetch(`${baseUrl}/api/v1/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportReqBody)
    });
    assert(reportRes.status === 200, "POST /api/v1/report returns 200 OK");
    const reportJson = await reportRes.json() as Record<string, unknown>;
    assert(reportJson.report_id === "rep-http-1", "Report registered report_id");

    // 5. Copilot Endpoint - Valid Request
    console.log("\n[HTTP Test 5] POST /api/v1/copilot/ask - Valid Request");
    const copilotRes = await fetch(`${baseUrl}/api/v1/copilot/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Why is this dangerous?",
        scan_result: scanJson
      })
    });
    assert(copilotRes.status === 200, "POST /api/v1/copilot/ask returns 200 OK");
    const copilotJson = await copilotRes.json() as Record<string, unknown>;
    assert(typeof copilotJson.answer === "string" && copilotJson.answer.length > 0, "Copilot returns non-empty grounded answer");

    // 6. Conversation Analyzer Endpoint - Valid Request
    console.log("\n[HTTP Test 6] POST /api/v1/analyze/conversation - Valid Request");
    const convRes = await fetch(`${baseUrl}/api/v1/analyze/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_text: "You won ₹5,000 lottery! Send registration fee of ₹500 to upi://pay?pa=win@upi immediately!"
      })
    });
    assert(convRes.status === 200, "POST /api/v1/analyze/conversation returns 200 OK");
    const convJson = await convRes.json() as Record<string, unknown>;
    assert(typeof convJson.scam_probability === "number", "Conversation analysis returns scam_probability");
    assert(Array.isArray(convJson.recommended_safe_defusal_responses), "Conversation analysis returns defusal responses");

    // 7. 404 Route Handling
    console.log("\n[HTTP Test 7] 404 Route Handling");
    const notFoundRes = await fetch(`${baseUrl}/api/v1/unknown-endpoint`);
    assert(notFoundRes.status === 404, "Unknown API route returns 404");

    console.log("\n============================================================");
    console.log(`📊 LIVE HTTP TEST RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
    console.log("============================================================\n");
  } finally {
    server!.close();
  }
}

runHttpTests().catch((err) => {
  console.error("HTTP test failed:", err);
  process.exit(1);
});
