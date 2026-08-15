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

export interface EdgeThreatSignature {
  type: "VPA" | "DOMAIN" | "KEYWORD";
  pattern: string;
  threatLevel: "HIGH" | "CRITICAL";
  reason: string;
}

const DEFAULT_OFFLINE_SIGNATURES: EdgeThreatSignature[] = [
  { type: "VPA", pattern: "scam-lottery@paytm", threatLevel: "CRITICAL", reason: "Lottery scam handle" },
  { type: "VPA", pattern: "electricity-bill-pay@ybl", threatLevel: "CRITICAL", reason: "Fake electricity handle" },
  { type: "DOMAIN", pattern: "claim-reward-gpay.xyz", threatLevel: "CRITICAL", reason: "Google Pay phishing lookalike" },
  { type: "DOMAIN", pattern: "free-recharge-offer.top", threatLevel: "CRITICAL", reason: "WhatsApp recharge phishing" }
];

export function getOfflineSignatures(): EdgeThreatSignature[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = localStorage.getItem("refguard_edge_signatures");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }
  return DEFAULT_OFFLINE_SIGNATURES;
}

export function saveOfflineSignatures(signatures: EdgeThreatSignature[]): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem("refguard_edge_signatures", JSON.stringify(signatures));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Lightweight Zero-Dependency Edge Heuristic Classifier (<15ms)
 * Operates entirely in client browser or offline edge devices for instantaneous pre-flight check.
 * Supports multilingual cues (Hinglish, Hindi, Tamil, Telugu).
 */
export function runClientEdgeClassifier(content: string): EdgeScanResult {
  const startTime = performance.now();
  const lower = content.toLowerCase();

  let riskScore = 0;
  const threatIndicators: string[] = [];
  const detectedCredentials: string[] = [];

  // 1. Check for sensitive credential solicitation (Immediate Critical)
  const otpPatterns = [
    /\b(otp|one[-\s]?time[-\s]?password)\b/i,
    /\b\d{4,6}\s*(is your|code)\b/i,
    /otp bhejo/i, /otp share karo/i, /otp enter/i, /inbox me otp/i
  ];
  if (otpPatterns.some(p => p.test(lower)) && (lower.includes("share") || lower.includes("send") || lower.includes("enter") || lower.includes("verify") || lower.includes("bhejo") || lower.includes("karo"))) {
    riskScore += 65;
    threatIndicators.push("OTP_SOLICITATION");
    detectedCredentials.push("OTP");
  }

  if (
    lower.includes("upi pin") ||
    lower.includes("mpin") ||
    (lower.includes("pin") && (lower.includes("enter to receive") || lower.includes("paise aayenge") || lower.includes("pin podunga") || lower.includes("pin enter cheyandi")))
  ) {
    riskScore += 70;
    threatIndicators.push("UPI_PIN_HARVESTING");
    detectedCredentials.push("UPI_PIN");
  }

  if (lower.includes("cvv") || lower.includes("card expiry") || lower.includes("atm pin")) {
    riskScore += 75;
    threatIndicators.push("CARD_CREDENTIAL_SOLICITATION");
    detectedCredentials.push("CVV/ATM_PIN");
  }

  // 2. Intent Direction Detection & Direction Inversion (with Multilingual cues)
  const creditKeywords = [
    "received", "credited", "won", "reward", "cashback", "refund", "claim", "congratulations", "bonus",
    "paise aayenge", "paisa milega", "inam", "lottery lag gayi", "panam vandhuruchu", "dabbu vachindi"
  ];
  const debitKeywords = [
    "pay", "send", "transfer", "debit", "collect", "scan to pay", "pa=", "upi://pay",
    "paisa bhejo", "turant payment karo", "panam anupunga", "dabbu pampandi"
  ];

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

  // 3. Urgency / Panic Pressure (Hinglish/Hindi/Regional)
  const urgencyWords = [
    "electricity", "power cut", "disconnected", "kyc expired", "blocked", "immediate", "urgent", "24 hours", "account suspended",
    "light cut jayegi", "bijli bill", "turant", "current cut aagidum", "current bill kattali"
  ];
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
  if (
    (lower.includes("part-time") || lower.includes("youtube like") || lower.includes("telegram")) &&
    (lower.includes("daily earn") || lower.includes("per day") || lower.includes("deposit") || lower.includes("gharbaithe"))
  ) {
    riskScore += 55;
    threatIndicators.push("TASK_INVESTMENT_FRAUD");
  }

  // 6. Offline Blacklist Signature Matching
  const signatures = getOfflineSignatures();
  for (const sig of signatures) {
    if (lower.includes(sig.pattern.toLowerCase())) {
      riskScore = Math.max(riskScore, sig.threatLevel === "CRITICAL" ? 95 : 75);
      threatIndicators.push(`OFFLINE_SIGNATURE_MATCH: ${sig.reason}`);
    }
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
