/**
 * RefGuard AI & Contextual Intelligence Layer Test Suite
 * 
 * Test Scenarios:
 * 1. Scam Message Understanding (Cashback, Refund, KYC, Customer Care, Job Scam, Viral Referral)
 * 2. Payment-Intent Mismatch Contextual Resolution (DETECTED, NOT_DETECTED, UNKNOWN, NOT_OBSERVED)
 * 3. Contextual Multi-Hop Scam Chain Generation
 * 4. Legitimate Payment Scenarios (ALLOW, LOW risk, NOT_DETECTED)
 * 5. Unknown-First Safety (Zero hallucination of URLs, VPAs, or reputations)
 * 6. Privacy & Sensitive Credential Redaction (OTP, UPI PIN, CVV, Passwords)
 * 7. Full Strict Contract Schema Compliance
 */

import { ScanOrchestrator } from "../src/orchestrator/scan-orchestrator.js";
import { ScanRequest } from "../src/types/contracts.js";
import { validateScanResponse } from "../src/validators/schema-validator.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runAIIntelligenceTests() {
  console.log("============================================================");
  console.log("🤖 REFGUARD AI & CONTEXTUAL INTELLIGENCE TEST SUITE");
  console.log("============================================================");

  const orchestrator = new ScanOrchestrator();

  // Test Suite 1: Verification Fee Trap & Payment Intent Mismatch
  console.log("\n[Test Suite 1] Scam Understanding: Verification Fee & Payment Intent Mismatch");
  {
    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: "Congratulations! You will receive ₹5000 refund for failed order. Pay ₹10 verification charge to verify_refund@okaxis to unlock your refund.",
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for verification fee scam");
    assert(res.payment_intent_mismatch !== undefined, "Payment intent mismatch object generated");
    assert(res.payment_intent_mismatch?.status === "DETECTED", "Payment intent mismatch status is DETECTED");
    assert(res.payment_intent_mismatch?.payment_direction === "OUTBOUND_DEBIT", "Payment direction identified as OUTBOUND_DEBIT");
    assert(res.risk_assessment.risk_severity === "HIGH" || res.risk_assessment.risk_severity === "CRITICAL", "Risk severity classified as HIGH/CRITICAL");
    assert(res.protection_decision.action === "DISCOURAGE_PROCEED", "Protection action is DISCOURAGE_PROCEED");
    assert(res.risk_assessment.signals.includes("PAYMENT_INTENT_MISMATCH"), "Signals include PAYMENT_INTENT_MISMATCH");
    assert(res.risk_assessment.signals.includes("ADVANCE_FEE_TASK_FRAUD"), "Signals include ADVANCE_FEE_TASK_FRAUD");
  }

  // Test Suite 2: Electricity / KYC Urgency Social Engineering
  console.log("\n[Test Suite 2] Scam Understanding: KYC & Electricity Power-Cut Urgency");
  {
    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: "Dear customer, your electricity power will be disconnected tonight at 9:30 PM due to KYC pending. Call customer care immediately or pay pending bill to avoid power cut.",
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for KYC urgency message");
    assert(res.risk_assessment.signals.includes("FEAR_URGENCY_PRESSURE"), "Signals include FEAR_URGENCY_PRESSURE");
    assert(res.risk_assessment.signals.includes("CUSTOMER_CARE_IMPERSONATION"), "Signals include CUSTOMER_CARE_IMPERSONATION");
    assert(res.risk_assessment.risk_score >= 50, "Risk score elevated for high-panic urgency cues");
    assert(res.protection_decision.action === "WARN_CAUTION" || res.protection_decision.action === "DISCOURAGE_PROCEED", "Protection action triggers caution/friction");
  }

  // Test Suite 3: Telegram Task / Job Investment Fraud
  console.log("\n[Test Suite 3] Scam Understanding: Part-Time Job & Task Investment Fraud");
  {
    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: "Earn daily ₹3000 by liking YouTube videos and Telegram tasks! Work from home salary guaranteed. Deposit ₹500 security fee to task_admin@okaxis to start earning.",
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for job scam message");
    assert(res.payment_intent_mismatch?.status === "DETECTED", "Job advance fee recognized as intent mismatch");
    assert(res.risk_assessment.signals.includes("ADVANCE_FEE_TASK_FRAUD"), "Signals include ADVANCE_FEE_TASK_FRAUD");
    assert(res.protection_decision.action === "DISCOURAGE_PROCEED", "Action discourages proceeding with task scam");
  }

  // Test Suite 4: Multi-Hop Scam Chain with Short URL & VPA
  console.log("\n[Test Suite 4] Contextual Scam Chain: Multi-Hop Resolution");
  {
    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: "Festive Cashback! Claim ₹2000 scratch card with referral code DIWALI2026. Visit https://bit.ly/claim-festive and pay token to claim_festive@upi",
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for multi-hop scam message");
    assert(res.scam_chain !== undefined, "Scam chain graph generated");
    assert(res.scam_chain!.nodes.length >= 4, "Scam chain contains at least 4 nodes (Message, Referral, Short Link, UPI/Payment)");
    assert(res.scam_chain!.edges.length >= 3, "Scam chain contains at least 3 directed edges");
    assert(res.scam_chain!.nodes.some(n => n.node_type === "REFERRAL"), "Scam chain includes REFERRAL node");
    assert(res.scam_chain!.nodes.some(n => n.node_type === "SHORT_LINK"), "Scam chain includes SHORT_LINK node");
    assert(res.scam_chain!.nodes.some(n => n.node_type === "UPI_REQUEST"), "Scam chain includes UPI_REQUEST node");
  }

  // Test Suite 5: Legitimate Peer-to-Peer Payment
  console.log("\n[Test Suite 5] Legitimate Transaction: P2P Dinner Split");
  {
    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: "Hi Ramesh, paying ₹450 for yesterday dinner split to ramesh.kumar@okaxis. Thanks!",
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for legitimate P2P payment");
    assert(res.risk_assessment.risk_severity === "LOW", "Risk severity classified as LOW");
    assert(res.risk_assessment.risk_score < 25, "Risk score is minimal (<25)");
    assert(res.protection_decision.action === "ALLOW", "Protection decision action is ALLOW");
    assert(res.payment_intent_mismatch?.status === "NOT_DETECTED", "Payment intent mismatch is NOT_DETECTED (legitimate outbound)");
  }

  // Test Suite 6: Unknown-First Safety (Ambiguous / Insufficient Content)
  console.log("\n[Test Suite 6] Unknown-First Safety: Ambiguous / Vague Message");
  {
    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: "Hello, meeting scheduled for tomorrow at 4 PM in cafeteria.",
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for clean neutral message");
    assert(res.risk_assessment.risk_severity === "LOW", "Risk severity is LOW without hallucinated threats");
    assert(res.protection_decision.action === "ALLOW", "Action is ALLOW");
    assert(res.payment_intent_mismatch === undefined || res.payment_intent_mismatch.status === "NOT_OBSERVED", "Mismatch is NOT_OBSERVED for non-payment content");
  }

  // Test Suite 7: Privacy & Sensitive Credential Redaction
  console.log("\n[Test Suite 7] Privacy Protection: OTP & UPI PIN Sanitization");
  {
    const rawSecretMsg = "Your Bank OTP is 894012. Enter UPI PIN 4910 to verify and receive ₹1000 cashback.";
    const scrubber = new (await import("../src/privacy/privacy-scrubber.js")).PrivacyScrubber();
    const scrubbed = scrubber.scrub(rawSecretMsg);

    assert(scrubbed.hasSensitiveCredentials, "Privacy scrubber detects sensitive credentials");
    assert(scrubbed.sanitizedText.includes("[REDACTED_OTP]"), "Scrubbed text includes [REDACTED_OTP]");
    assert(scrubbed.sanitizedText.includes("[REDACTED_UPI_PIN]"), "Scrubbed text includes [REDACTED_UPI_PIN]");
    assert(!scrubbed.sanitizedText.includes("894012"), "Scrubbed text does not contain raw OTP");
    assert(!scrubbed.sanitizedText.includes("4910"), "Scrubbed text does not contain raw UPI PIN");

    const req: ScanRequest = {
      content_type: "TEXT",
      content_value: rawSecretMsg,
      timestamp: new Date().toISOString()
    };
    const res = await orchestrator.orchestrateScan(req);
    const validation = validateScanResponse(res);

    assert(validation.isValid, "Schema validation passes for credential harvesting message");
    assert(res.risk_assessment.signals.includes("SENSITIVE_CREDENTIAL_SOLICITATION"), "Signals include SENSITIVE_CREDENTIAL_SOLICITATION");

    // Stringify entire response to verify NO raw secret exists anywhere in the output!
    const jsonStr = JSON.stringify(res);
    assert(!jsonStr.includes("894012"), "Raw OTP (894012) is NEVER leaked or stored in ScanResponse");
    assert(!jsonStr.includes("4910"), "Raw UPI PIN (4910) is NEVER leaked or stored in ScanResponse");
    assert(res.risk_assessment.risk_severity === "CRITICAL" || res.risk_assessment.risk_severity === "HIGH", "Risk severity elevated due to credential solicitation");
  }

  console.log("\n============================================================");
  console.log("📊 AI & CONTEXTUAL INTELLIGENCE TEST RESULTS: ALL PASSED");
  console.log("============================================================\n");
}

runAIIntelligenceTests().catch(err => {
  console.error("Test execution failure:", err);
  process.exit(1);
});
