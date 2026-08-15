import {
  ScanRequest,
  ExtractionResult,
  ThreatAssessment,
  PaymentIntentMismatch,
  EvidencePack,
  RiskAssessment,
  RiskSeverity
} from "../types/contracts.js";

export class RiskEvaluator {
  public evaluate(
    request: ScanRequest,
    extraction: ExtractionResult,
    threatAssessments: ThreatAssessment[],
    mismatch: PaymentIntentMismatch,
    evidencePack: EvidencePack
  ): RiskAssessment {
    let score = 0;
    const signals: string[] = [];
    const explanations: string[] = [];

    const rawText = request.content_value.toLowerCase();

    // 1. Evaluate Threat Intelligence Findings
    for (const ta of threatAssessments) {
      if (ta.classification === "MALICIOUS") {
        score += 65;
        signals.push(`MALICIOUS_${ta.indicator_type}_IDENTIFIED`);
        explanations.push(`The ${ta.indicator_type} (${ta.indicator_value}) is on a verified threat blacklist.`);
      } else if (ta.classification === "SUSPICIOUS") {
        score += 35;
        signals.push(`SUSPICIOUS_${ta.indicator_type}`);
        explanations.push(`The ${ta.indicator_type} shows suspicious patterns commonly used in phishing.`);
      }
    }

    // 2. Evaluate Payment Intent Mismatch
    if (mismatch.status === "DETECTED") {
      score += 55;
      signals.push("PAYMENT_INTENT_MISMATCH");
      signals.push("INVERTED_DEBIT_REQUEST");
      explanations.push(
        `Critical financial inversion: The message claims you will receive money or cashback, but the transaction actually debits money from your account upon PIN entry.`
      );
    }

    // 3. Evaluate Social Engineering & Urgency Signals
    const urgencyKeywords = [
      "immediately", "urgent", "disconnected tonight", "account blocked", "within 2 hours",
      "electricity power cut", "kyc pending", "suspend your account", "deactivated today"
    ];
    if (urgencyKeywords.some(k => rawText.includes(k))) {
      score += 25;
      signals.push("FEAR_URGENCY_PRESSURE");
      explanations.push("Contains artificial urgency and panic triggers to bypass careful verification.");
    }

    // 4. Evaluate Viral Referral & Prize Lures
    const prizeKeywords = [
      "lottery", "jackpot", "winner", "forward to 10 groups", "share on whatsapp to claim",
      "free recharge", "spin the wheel", "lucky draw", "daily cash bonus"
    ];
    if (prizeKeywords.some(k => rawText.includes(k))) {
      score += 30;
      signals.push("VIRAL_PYRAMID_REFERRAL_LURE");
      explanations.push("Uses viral referral or unrealistic prize incentives to spread across chat groups.");
    }

    // 5. Evaluate URL Shortener Obfuscation
    const hasShortLink = extraction.extracted_entities.some(
      e => e.entity_type === "URL" && /bit\.ly|tinyurl|t\.me|cutt\.ly|is\.gd/i.test(e.value || "")
    );
    if (hasShortLink) {
      score += 15;
      signals.push("OBFUSCATED_SHORT_URL");
      explanations.push("Uses a shortened URL to conceal the true destination website.");
    }

    // 6. Evaluate QR Code / Quishing Risk
    if (request.content_type === "QR") {
      const qrHasUpi = extraction.extracted_entities.some(e => e.entity_type === "QR_DATA");
      if (qrHasUpi && mismatch.status === "DETECTED") {
        score += 20;
        signals.push("DECEPTIVE_QR_QUISHING");
        explanations.push("QR code is weaponized to initiate an unauthorized payment request.");
      }
    }

    // 7. Cap and classify Risk Score
    const finalScore = Math.min(100, Math.max(0, score));

    let risk_severity: RiskSeverity = "LOW";
    let recommended_action = "SAFE TO PROCEED";

    if (finalScore >= 80) {
      risk_severity = "CRITICAL";
      recommended_action = "DO NOT PROCEED / DO NOT ENTER UPI PIN";
    } else if (finalScore >= 55) {
      risk_severity = "HIGH";
      recommended_action = "DO NOT PAY / REJECT TRANSACTION";
    } else if (finalScore >= 25) {
      risk_severity = "MEDIUM";
      recommended_action = "VERIFY WITH OFFICIAL SOURCE BEFORE PROCEEDING";
    } else {
      risk_severity = "LOW";
      recommended_action = "NO KNOWN THREATS DETECTED";
      if (signals.length === 0) {
        signals.push("CLEAN_CONTENT_SIGNALS");
        explanations.push("No threat indicators, payment mismatches, or malicious domains were detected.");
      }
    }

    const humanExplanation = explanations.join(" ");

    // Link evidence references from EvidencePack
    const evidence_references = evidencePack.items
      .filter(i => i.evidence_type === "RISK_SIGNAL" || i.evidence_type === "UPI_IDENTIFIER" || i.evidence_type === "URL")
      .map(i => i.evidence_id);

    return {
      risk_score: Math.round(finalScore),
      risk_severity,
      confidence: 0.95,
      signals,
      evidence_references: evidence_references.length > 0 ? evidence_references : undefined,
      human_explanation: humanExplanation,
      recommended_action
    };
  }
}
