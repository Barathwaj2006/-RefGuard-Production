/**
 * RefGuard Privacy & Credential Scrubber
 * 
 * Strict Privacy Mandates:
 * - NEVER retain, log, or expose UPI PINs, OTPs, CVVs, passwords, or banking credentials.
 * - Redacts sensitive secret values before inclusion in EvidencePack or explanations.
 * - Flags credential harvesting and sensitive credential exposure risks.
 */

export interface ScrubbingResult {
  sanitizedText: string;
  detectedSecrets: {
    type: "OTP" | "UPI_PIN" | "CVV" | "PASSWORD" | "CARD_NUMBER";
    matchedPlaceholder: string;
  }[];
  hasSensitiveCredentials: boolean;
  privacySignals: string[];
}

export class PrivacyScrubber {
  // Regex patterns for sensitive credentials in Indian payment context
  private static readonly OTP_PATTERNS = [
    /\b(?:otp|one[\s-]?time[\s-]?password|verification[\s-]?code)[\s:=is]+([0-9]{4,8})\b/gi,
    /\b([0-9]{4,8})\s+(?:is\s+your\s+(?:login|bank|upi|verification)?\s*otp)\b/gi
  ];

  private static readonly PIN_PATTERNS = [
    /\b(?:upi[\s-]?pin|mpin|secret[\s-]?pin|atm[\s-]?pin)[\s:=is]+([0-9]{4,6})\b/gi,
    /\b(?:enter|share|type)\s+(?:your\s+)?(?:upi[\s-]?pin|pin)\s+([0-9]{4,6})\b/gi
  ];

  private static readonly CVV_PATTERNS = [
    /\b(?:cvv|cvv2|cvc|security[\s-]?code)[\s:=is]+([0-9]{3,4})\b/gi
  ];

  private static readonly PASSWORD_PATTERNS = [
    /\b(?:password|passwd|pwd|netbanking[\s-]?pass)[\s:=is]+([^\s,;]+)\b/gi
  ];

  private static readonly CARD_PATTERNS = [
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13})\b/g
  ];

  public scrub(rawText: string): ScrubbingResult {
    let sanitizedText = rawText;
    const detectedSecrets: ScrubbingResult["detectedSecrets"] = [];
    const privacySignals: string[] = [];

    // 1. Scrub OTPs
    for (const pattern of PrivacyScrubber.OTP_PATTERNS) {
      sanitizedText = sanitizedText.replace(pattern, (match, secretVal) => {
        detectedSecrets.push({ type: "OTP", matchedPlaceholder: "[REDACTED_OTP]" });
        return match.replace(secretVal, "[REDACTED_OTP]");
      });
    }

    // 2. Scrub UPI PINs
    for (const pattern of PrivacyScrubber.PIN_PATTERNS) {
      sanitizedText = sanitizedText.replace(pattern, (match, secretVal) => {
        detectedSecrets.push({ type: "UPI_PIN", matchedPlaceholder: "[REDACTED_UPI_PIN]" });
        return match.replace(secretVal, "[REDACTED_UPI_PIN]");
      });
    }

    // 3. Scrub CVVs
    for (const pattern of PrivacyScrubber.CVV_PATTERNS) {
      sanitizedText = sanitizedText.replace(pattern, (match, secretVal) => {
        detectedSecrets.push({ type: "CVV", matchedPlaceholder: "[REDACTED_CVV]" });
        return match.replace(secretVal, "[REDACTED_CVV]");
      });
    }

    // 4. Scrub Passwords
    for (const pattern of PrivacyScrubber.PASSWORD_PATTERNS) {
      sanitizedText = sanitizedText.replace(pattern, (match, secretVal) => {
        detectedSecrets.push({ type: "PASSWORD", matchedPlaceholder: "[REDACTED_SECRET]" });
        return match.replace(secretVal, "[REDACTED_SECRET]");
      });
    }

    // 5. Scrub Card Numbers
    for (const pattern of PrivacyScrubber.CARD_PATTERNS) {
      sanitizedText = sanitizedText.replace(pattern, () => {
        detectedSecrets.push({ type: "CARD_NUMBER", matchedPlaceholder: "[REDACTED_CARD_NUMBER]" });
        return "[REDACTED_CARD_NUMBER]";
      });
    }

    const hasSensitiveCredentials = detectedSecrets.length > 0;

    if (hasSensitiveCredentials) {
      privacySignals.push("SENSITIVE_CREDENTIAL_SOLICITATION");
      if (detectedSecrets.some(s => s.type === "OTP" || s.type === "UPI_PIN")) {
        privacySignals.push("HIGH_RISK_PIN_OTP_HARVESTING");
      }
    }

    return {
      sanitizedText,
      detectedSecrets,
      hasSensitiveCredentials,
      privacySignals
    };
  }
}
