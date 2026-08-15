export interface EdgeScanResult {
  latency_ms: number;
  risk_score: number;
  risk_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  protection_action: "ALLOW" | "WARN_CAUTION" | "REQUIRE_CONFIRMATION" | "DISCOURAGE_PROCEED";
  detected_direction: "INBOUND_CREDIT" | "OUTBOUND_DEBIT" | "UNKNOWN";
  intent_mismatch: boolean;
  detected_credentials: string[];
  threat_indicators: string[];
  summary: string;
}

/**
 * Lightweight Zero-Dependency Edge Heuristic Classifier (<15ms)
 * Operates entirely in client WASM/JS or offline edge devices for instantaneous pre-flight check.
 */
export function runEdgeClassifier(content: string): EdgeScanResult {
  const startTime = performance.now();
  const lower = content.toLowerCase();

  let riskScore = 0;
  const threatIndicators: string[] = [];
  const detectedCredentials: string[] = [];

  // 1. Check for sensitive credential solicitation (Immediate Critical)
  const otpPatterns = [/\b(otp|one[-\s]?time[-\s]?password)\b/i, /\b\d{4,6}\s*(is your|code)\b/i];
  if (otpPatterns.some(p => p.test(lower)) && (lower.includes("share") || lower.includes("send") || lower.includes("enter") || lower.includes("verify"))) {
    riskScore += 65;
    threatIndicators.push("OTP_SOLICITATION");
    detectedCredentials.push("OTP");
  }

  if (lower.includes("upi pin") || lower.includes("mpin") || (lower.includes("pin") && lower.includes("enter to receive"))) {
    riskScore += 70;
    threatIndicators.push("UPI_PIN_HARVESTING");
    detectedCredentials.push("UPI_PIN");
  }

  if (lower.includes("cvv") || lower.includes("card expiry") || lower.includes("atm pin")) {
    riskScore += 75;
    threatIndicators.push("CARD_CREDENTIAL_SOLICITATION");
    detectedCredentials.push("CVV/ATM_PIN");
  }

  // 2. Intent Direction Detection & Direction Inversion
  const creditKeywords = ["received", "credited", "won", "reward", "cashback", "refund", "claim", "congratulations", "bonus"];
  const debitKeywords = ["pay", "send", "transfer", "debit", "collect", "scan to pay", "pa=", "upi://pay"];

  const hasCreditCues = creditKeywords.some(w => lower.includes(w));
  const hasDebitCues = debitKeywords.some(w => lower.includes(w));

  let detectedDirection: "INBOUND_CREDIT" | "OUTBOUND_DEBIT" | "UNKNOWN" = "UNKNOWN";
  let intentMismatch = false;

  if (hasCreditCues && hasDebitCues) {
    // Both present - classic direction inversion scam!
    riskScore += 50;
    intentMismatch = true;
    detectedDirection = "OUTBOUND_DEBIT";
    threatIndicators.push("PAYMENT_INTENT_INVERSION");
  } else if (hasDebitCues) {
    detectedDirection = "OUTBOUND_DEBIT";
  } else if (hasCreditCues) {
    detectedDirection = "INBOUND_CREDIT";
  }

  // 3. Urgency / Panic Pressure
  const urgencyWords = ["electricity", "power cut", "disconnected", "kyc expired", "blocked", "immediate", "urgent", "24 hours", "account suspended"];
  if (urgencyWords.some(w => lower.includes(w))) {
    riskScore += 35;
    threatIndicators.push("HIGH_PRESSURE_PANIC_LURE");
  }

  // 4. Obfuscated Shortlinks & Suspicious TLDs
  const shortlinkDomains = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy"];
  if (shortlinkDomains.some(d => lower.includes(d))) {
    riskScore += 30;
    threatIndicators.push("OBFUSCATED_SHORT_URL");
  }

  const badTlds = [".xyz", ".top", ".site", ".online", ".cc", ".buzz", ".click"];
  if (badTlds.some(t => lower.includes(t))) {
    riskScore += 30;
    threatIndicators.push("SUSPICIOUS_DOMAIN_TLD");
  }

  // 5. Part-Time Job / Task Investment Fraud
  if ((lower.includes("part-time") || lower.includes("youtube like") || lower.includes("telegram")) && (lower.includes("daily earn") || lower.includes("per day") || lower.includes("deposit"))) {
    riskScore += 55;
    threatIndicators.push("TASK_INVESTMENT_FRAUD");
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Severity and Action
  let riskSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let protectionAction: "ALLOW" | "WARN_CAUTION" | "REQUIRE_CONFIRMATION" | "DISCOURAGE_PROCEED" = "ALLOW";

  if (riskScore >= 80) {
    riskSeverity = "CRITICAL";
    protectionAction = "DISCOURAGE_PROCEED";
  } else if (riskScore >= 50) {
    riskSeverity = "HIGH";
    protectionAction = "DISCOURAGE_PROCEED";
  } else if (riskScore >= 25) {
    riskSeverity = "MEDIUM";
    protectionAction = "WARN_CAUTION";
  } else {
    riskSeverity = "LOW";
    protectionAction = "ALLOW";
  }

  let summary = "Content appears safe and standard.";
  if (riskSeverity === "CRITICAL" || riskSeverity === "HIGH") {
    summary = intentMismatch
      ? "Warning: Message claims incoming reward/money, but technical payload requests outbound money transfer."
      : "High threat indicators detected. Do not share credentials, scan QR, or transfer funds.";
  } else if (riskSeverity === "MEDIUM") {
    summary = "Unverified urgency or short link detected. Exercise caution before proceeding.";
  }

  const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    latency_ms: Math.max(0.1, latencyMs),
    risk_score: riskScore,
    risk_severity: riskSeverity,
    protection_action: protectionAction,
    detected_direction: detectedDirection,
    intent_mismatch: intentMismatch,
    detected_credentials: detectedCredentials,
    threat_indicators: threatIndicators,
    summary
  };
}
