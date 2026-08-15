import {
  RiskAssessment,
  PaymentIntentMismatch,
  ProtectionDecision,
  ProtectionAction
} from "../types/contracts.js";

export class ProtectionEvaluator {
  public evaluate(
    riskAssessment: RiskAssessment,
    mismatch: PaymentIntentMismatch
  ): ProtectionDecision {
    let action: ProtectionAction = "ALLOW";
    let detected_summary = "Content Appears Safe";
    let why_it_matters = "No suspicious indicators, blacklisted accounts, or payment mismatches were found.";
    let user_instruction = "You may safely proceed with this interaction.";

    if (mismatch.status === "DETECTED" || riskAssessment.risk_severity === "CRITICAL") {
      action = "DISCOURAGE_PROCEED";
      if (mismatch.status === "DETECTED") {
        detected_summary = "High-Risk Payment Intent Inversion";
        why_it_matters = "You were promised money or cashback, but this QR/link is an outbound debit request that will take money from your bank if you enter your UPI PIN.";
        user_instruction = "Decline this request immediately. Never enter your UPI PIN to receive money.";
      } else {
        detected_summary = "Critical Scam Threat Detected";
        why_it_matters = "This content matches known financial scam campaigns designed to compromise accounts or steal funds.";
        user_instruction = "Do not click links, do not install any downloaded apps, and do not make payments.";
      }
    } else if (riskAssessment.risk_severity === "HIGH") {
      action = "REQUIRE_CONFIRMATION";
      detected_summary = "Suspicious Payment / Link Detected";
      why_it_matters = "High-risk indicators and social engineering tactics were identified in this interaction.";
      user_instruction = "Verify the recipient's identity through official channels before authorizing any transaction.";
    } else if (riskAssessment.risk_severity === "MEDIUM") {
      action = "WARN_CAUTION";
      detected_summary = "Unverified Referral or Link";
      why_it_matters = "The destination domain or referral mechanism uses obfuscation or unverified external portals.";
      user_instruction = "Proceed with caution. Avoid providing personal information or financial details.";
    }

    return {
      action,
      detected_summary,
      why_it_matters,
      user_instruction
    };
  }
}
