import { ScanOrchestrator } from "../src/orchestrator/scan-orchestrator.js";
import { ReportService } from "../src/community/report-service.js";
import { validateScanRequest, validateScamReport, validateScanResponse } from "../src/validators/schema-validator.js";
import { ScanRequest, ScamReport } from "../src/types/contracts.js";

async function runAllTests() {
  console.log("============================================================");
  console.log("🧪 REFGUARD BACKEND MVP PIPELINE & CONTRACT VERIFICATION");
  console.log("============================================================\n");

  const orchestrator = new ScanOrchestrator();
  const reportService = new ReportService();
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

  // -------------------------------------------------------------
  // Test 1: Legitimate Referral Message
  // -------------------------------------------------------------
  console.log("[Test Suite 1] Legitimate Referral Message Flow");
  const legitReq: ScanRequest = {
    content_type: "TEXT",
    content_value: "Hey! Join Google Pay with my code REF12345 and get 21 INR on your first payment.",
    source_context: "com.whatsapp",
    timestamp: new Date().toISOString()
  };

  const legitValidation = validateScanRequest(legitReq);
  assert(legitValidation.isValid, "Legit request validation against schema");

  const legitRes = await orchestrator.orchestrateScan(legitReq);
  const legitResValidation = validateScanResponse(legitRes);
  assert(legitResValidation.isValid, "Legit scan response schema compliance", legitResValidation.error);
  assert(legitRes.risk_assessment.risk_severity === "LOW", "Legit scan classified as LOW risk");
  assert(legitRes.protection_decision.action === "ALLOW", "Legit scan action is ALLOW");
  assert(legitRes.evidence_pack !== undefined && legitRes.evidence_pack.items.length > 0, "Evidence pack generated");

  // -------------------------------------------------------------
  // Test 2: High-Risk Blacklisted UPI VPA (Electricity bill scam)
  // -------------------------------------------------------------
  console.log("\n[Test Suite 2] High-Risk Blacklisted UPI / Impersonation Flow");
  const upiReq: ScanRequest = {
    content_type: "UPI_VPA",
    content_value: "Dear consumer, your electricity power will be disconnected tonight at 9:30 PM. Pay bill immediately to electricity-bill-pay@ybl or call 9876543210.",
    source_context: "com.google.android.apps.messaging",
    timestamp: new Date().toISOString()
  };

  const upiValidation = validateScanRequest(upiReq);
  assert(upiValidation.isValid, "UPI scam request validation against schema");

  const upiRes = await orchestrator.orchestrateScan(upiReq);
  const upiResValidation = validateScanResponse(upiRes);
  assert(upiResValidation.isValid, "UPI scam response schema compliance", upiResValidation.error);
  assert(upiRes.risk_assessment.risk_score >= 60, "High risk score calculated for blacklisted VPA & fear appeal");
  assert(
    upiRes.protection_decision.action === "REQUIRE_CONFIRMATION" || upiRes.protection_decision.action === "DISCOURAGE_PROCEED",
    "Protective friction action advised"
  );
  assert(upiRes.risk_assessment.signals.some(s => s.includes("MALICIOUS_UPI_VPA") || s.includes("FEAR_URGENCY")), "Risk signals correctly identified");

  // -------------------------------------------------------------
  // Test 3: Payment Intent Mismatch (Cashback Inversion Lure)
  // -------------------------------------------------------------
  console.log("\n[Test Suite 3] Payment-Intent Mismatch Engine Flow");
  const mismatchReq: ScanRequest = {
    content_type: "SHARE_INTENT",
    content_value: "🎉 Congratulations! You have received ₹3,000 festive cashback reward! Scan this QR or click upi://pay?pa=cashback-reward-claim@upi&pn=Cashback&am=3000 to credit your account.",
    source_context: "com.whatsapp",
    timestamp: new Date().toISOString()
  };

  const mismatchValidation = validateScanRequest(mismatchReq);
  assert(mismatchValidation.isValid, "Mismatch request validation against schema");

  const mismatchRes = await orchestrator.orchestrateScan(mismatchReq);
  const mismatchResValidation = validateScanResponse(mismatchRes);
  assert(mismatchResValidation.isValid, "Mismatch scan response schema compliance", mismatchResValidation.error);
  assert(mismatchRes.payment_intent_mismatch !== undefined, "Payment intent mismatch object generated");
  assert(mismatchRes.payment_intent_mismatch?.status === "DETECTED", "Payment intent mismatch DETECTED");
  assert(mismatchRes.payment_intent_mismatch?.payment_direction === "OUTBOUND_DEBIT", "Payment direction identified as OUTBOUND_DEBIT");
  assert(mismatchRes.protection_decision.action === "DISCOURAGE_PROCEED", "Action is DISCOURAGE_PROCEED");
  assert(mismatchRes.risk_assessment.signals.includes("PAYMENT_INTENT_MISMATCH"), "Signal includes PAYMENT_INTENT_MISMATCH");

  // -------------------------------------------------------------
  // Test 4: QR Code Scam Simulation
  // -------------------------------------------------------------
  console.log("\n[Test Suite 4] Optical QR / Quishing Scanner Flow");
  const qrReq: ScanRequest = {
    content_type: "QR",
    content_value: "upi://pay?pa=scam-lottery@paytm&pn=LotteryDesk&am=5000&cu=INR",
    timestamp: new Date().toISOString()
  };

  const qrValidation = validateScanRequest(qrReq);
  assert(qrValidation.isValid, "QR request validation against schema");

  const qrRes = await orchestrator.orchestrateScan(qrReq);
  const qrResValidation = validateScanResponse(qrRes);
  assert(qrResValidation.isValid, "QR response schema compliance", qrResValidation.error);
  assert(qrRes.risk_assessment.risk_score >= 50, "QR scam assessed with high risk score");

  // -------------------------------------------------------------
  // Test 5: Viral Referral Scam Chain Construction
  // -------------------------------------------------------------
  console.log("\n[Test Suite 5] Scam Chain Multi-Hop Graph Construction");
  const chainReq: ScanRequest = {
    content_type: "TEXT",
    content_value: "Free Recharge Offer! Use code WIN500 at http://bit.ly/recharge-bonus-claim to get 500 INR instantly. Pay registration to win-daily-bonus@paytm.",
    timestamp: new Date().toISOString()
  };

  const chainRes = await orchestrator.orchestrateScan(chainReq);
  assert(chainRes.scam_chain !== undefined, "Scam chain graph generated");
  assert(chainRes.scam_chain!.nodes.length >= 2, "Scam chain contains 2+ nodes");
  assert(chainRes.scam_chain!.edges.length >= 1, "Scam chain contains 1+ directed edges");
  assert(chainRes.scam_chain!.nodes.some(n => n.node_type === "MESSAGE"), "Scam chain contains MESSAGE node");
  assert(chainRes.scam_chain!.nodes.some(n => n.node_type === "SHORT_LINK" || n.node_type === "LANDING_PAGE"), "Scam chain contains link node");

  // -------------------------------------------------------------
  // Test 6: Screenshot / Image OCR Scan
  // -------------------------------------------------------------
  console.log("\n[Test Suite 6] Screenshot / OCR Ingress Flow");
  const ocrReq: ScanRequest = {
    content_type: "IMAGE",
    content_value: "OCR_EXTRACTED: State Bank KYC expired. Update Aadhaar at http://sbi-kyc-verification.site to avoid account suspension.",
    timestamp: new Date().toISOString()
  };

  const ocrValidation = validateScanRequest(ocrReq);
  assert(ocrValidation.isValid, "Image OCR request validation against schema");

  const ocrRes = await orchestrator.orchestrateScan(ocrReq);
  assert(ocrRes.risk_assessment.risk_score >= 60, "Phishing domain in OCR text detected as high risk");
  assert(ocrRes.risk_assessment.signals.some(s => s.includes("MALICIOUS_DOMAIN")), "Malicious domain signal triggered");

  // -------------------------------------------------------------
  // Test 7: Schema Validation & Structured Error Responses (400)
  // -------------------------------------------------------------
  console.log("\n[Test Suite 7] Malformed Input Validation & Error Handling");
  const invalidTypeReq = {
    content_type: "UNKNOWN_UNSUPPORTED_TYPE",
    content_value: "Some test text",
    timestamp: new Date().toISOString()
  };
  const invalidTypeVal = validateScanRequest(invalidTypeReq);
  assert(!invalidTypeVal.isValid, "Rejected unsupported content_type");

  const missingTimestampReq = {
    content_type: "TEXT",
    content_value: "Hello world"
  };
  const missingTimestampVal = validateScanRequest(missingTimestampReq);
  assert(!missingTimestampVal.isValid, "Rejected payload missing required timestamp");

  const extraFieldReq = {
    content_type: "TEXT",
    content_value: "Hello world",
    timestamp: new Date().toISOString(),
    unauthorized_field: "injected"
  };
  const extraFieldVal = validateScanRequest(extraFieldReq);
  assert(!extraFieldVal.isValid, "Rejected payload with forbidden additionalProperties");

  // -------------------------------------------------------------
  // Test 8: Community Scam Report Submission
  // -------------------------------------------------------------
  console.log("\n[Test Suite 8] Community Scam Report Ingestion");
  const validReport: ScamReport = {
    report_id: "rep-9901",
    reported_indicator: "fraud-collector@upi",
    report_category: "UPI_COLLECT_FRAUD",
    description: "User attempted to send fake QR collect request disguised as payment receipt.",
    submission_timestamp: new Date().toISOString(),
    moderation_status: "PENDING",
    confidence: 0.9,
    provenance: "COMMUNITY_APP_SUBMISSION"
  };

  const reportValidation = validateScamReport(validReport);
  assert(reportValidation.isValid, "Valid ScamReport accepted by validator");

  const submitResult = reportService.submitReport(validReport);
  assert(submitResult.report_id === "rep-9901", "Report successfully registered with correct report_id");

  const invalidReport = {
    report_id: "rep-bad",
    reported_indicator: "something"
    // missing submission_timestamp, category, moderation_status, confidence, provenance
  };
  const invalidReportVal = validateScamReport(invalidReport);
  assert(!invalidReportVal.isValid, "Rejected malformed scam report");

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`📊 TEST RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("============================================================\n");

  if (passedCount === totalCount) {
    console.log("🎉 ALL BACKEND MVP SCAN FLOWS & CONTRACT TESTS COMPLETED SUCCESSFULLY!");
  } else {
    console.error("❌ Some backend tests failed.");
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
