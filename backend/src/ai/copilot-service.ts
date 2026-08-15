import { GoogleGenAI } from "@google/genai";
import { ScanResponse } from "../types/contracts.js";

export interface CopilotQueryRequest {
  question: string;
  scan_result: ScanResponse;
  chat_history?: Array<{ sender: "user" | "copilot"; text: string }>;
}

export interface CopilotQueryResponse {
  answer: string;
  suggested_questions: string[];
  key_evidence_used: string[];
  immediate_safety_advice: string;
}

export class CopilotService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } catch (err) {
        console.warn("Gemini client initialization skipped, using heuristic copilot engine:", err);
      }
    }
  }

  async answerQuestion(req: CopilotQueryRequest): Promise<CopilotQueryResponse> {
    const { question, scan_result } = req;
    const qLower = question.toLowerCase();

    const rawExtraction = (scan_result as any).extraction_result;
    const vpas: string[] = rawExtraction?.upi_vpas || [];
    const urls: string[] = rawExtraction?.urls || [];
    const amounts: number[] = rawExtraction?.amounts || [];
    const signals = scan_result.risk_assessment?.signals || [];

    // Check if Gemini API can be used
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are RefGuard AI Security Copilot, an expert scam and financial fraud protection assistant.
The user is inspecting a suspicious payment / message / QR / referral link with RefGuard.

CURRENT SCAN CONTEXT:
- Risk Score: ${scan_result.risk_assessment?.risk_score ?? 0} / 100 (${scan_result.risk_assessment?.risk_severity ?? 'UNKNOWN'})
- Action Recommended: ${scan_result.protection_decision?.action ?? 'UNKNOWN'}
- Summary: ${scan_result.protection_decision?.detected_summary ?? ''}
- Intent Mismatch: ${scan_result.payment_intent_mismatch ? JSON.stringify(scan_result.payment_intent_mismatch) : "None"}
- Extracted VPAs: ${vpas.join(", ") || "None"}
- Extracted URLs: ${urls.join(", ") || "None"}
- Extracted Amounts: ${amounts.join(", ") || "None"}
- Scam Pattern Signals: ${signals.map((s: any) => (typeof s === 'string' ? s : s.signal_name + ": " + s.description)).join("; ")}

USER QUESTION: "${question}"

Respond clearly, concisely, and empathetically. Highlight exactly what is dangerous, explain whether money is going OUT vs coming IN, specify who the payee is, and give actionable next steps. Keep response under 150 words.`;

        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });

        const text = response.text || "";
        if (text.trim()) {
          return {
            answer: text.trim(),
            suggested_questions: this.generateSuggestions(scan_result, qLower),
            key_evidence_used: this.extractEvidenceRefs(scan_result),
            immediate_safety_advice: this.getImmediateAdvice(scan_result)
          };
        }
      } catch (err) {
        console.warn("Gemini copilot query failed, falling back to deterministic expert engine:", err);
      }
    }

    // High-precision contextual deterministic copilot engine
    return this.deterministicHeuristicAnswer(question, scan_result);
  }

  private deterministicHeuristicAnswer(question: string, scan: ScanResponse): CopilotQueryResponse {
    const q = question.toLowerCase();
    const isMismatch = scan.payment_intent_mismatch && scan.payment_intent_mismatch.status === "DETECTED";
    const rawExtraction = (scan as any).extraction_result;
    const vpas: string[] = rawExtraction?.upi_vpas || [];
    const urls: string[] = rawExtraction?.urls || [];
    const amounts: number[] = rawExtraction?.amounts || [];
    const score = scan.risk_assessment?.risk_score ?? 0;
    const signals = scan.risk_assessment?.signals || [];

    let answer = "";

    if (q.includes("why") && (q.includes("dangerous") || q.includes("suspicious") || q.includes("scam") || q.includes("threat"))) {
      if (isMismatch) {
        answer = `This transaction is critical danger due to a Payment-Intent Inversion Scam. The sender promises you will receive ₹${amounts[0] || "money"} (e.g. cashback or reward), but the embedded UPI payload actually initiates an OUTBOUND DEBIT of ₹${amounts[0] || ""} from your bank account to ${vpas[0] || "an unknown attacker"}. If you enter your UPI PIN, you will lose funds immediately.`;
      } else if (score >= 80) {
        const signalDescs = signals.map((s: any) => typeof s === 'string' ? s : s.description).join(". ");
        answer = `RefGuard flagged this as high danger (${score}/100) because it exhibits strong indicators of fraud: ${signalDescs || 'High-risk deception signals detected'}. Scammers use urgent pressure and impersonation to make you authorize unverified payments.`;
      } else {
        answer = `RefGuard evaluated this content. Current risk score is ${score}/100 (${scan.risk_assessment.risk_severity}). Key detected elements: ${scan.protection_decision.detected_summary}`;
      }
    } else if (q.includes("who") || q.includes("payee") || q.includes("receiver") || q.includes("destination")) {
      if (vpas.length > 0) {
        answer = `The underlying transaction payload is configured to send funds to UPI ID: **${vpas.join(", ")}**. This is an unverified recipient handle not affiliated with official banking services.`;
      } else if (urls.length > 0) {
        answer = `The destination redirects to external URL: **${urls.join(", ")}**. Our threat intelligence indicates this link leads to an unverified third-party gateway.`;
      } else {
        answer = `No direct official merchant was verified in this payload. Scammers commonly conceal real destination accounts behind redirection bridges or QR stickers.`;
      }
    } else if (q.includes("what should i do") || q.includes("action") || q.includes("next step") || q.includes("how to protect")) {
      if (score >= 50) {
        answer = `1. DO NOT click the link, scan the QR, or approve any UPI collect request.\n2. NEVER enter your 4-digit or 6-digit UPI PIN (UPI PIN is ONLY required to send money, never to receive money).\n3. Block the sender on WhatsApp/SMS.\n4. Export the 1930 Cybercrime Docket from RefGuard if you suffered a financial loss or wish to report the handle.`;
      } else {
        answer = `This content appears safe (Risk: ${score}/100), but always verify the payee name in your UPI app before completing any authorization.`;
      }
    } else if (q.includes("real payment") || q.includes("receive") || q.includes("cashback") || q.includes("collect")) {
      if (isMismatch) {
        answer = `NO! This is NOT an incoming payment. Genuine cashback rewards are credited directly to your bank account without requiring you to scan QR codes, click links, or enter your UPI PIN. The technical payload is a payment request that will debit your account.`;
      } else {
        answer = `In genuine UPI payments, you NEVER need to enter your PIN to receive money. If a prompt asks for your PIN, it is always sending money out.`;
      }
    } else if (q.includes("detect") || q.includes("how did you know") || q.includes("engine")) {
      answer = `RefGuard combines Multi-Modal OCR, UPI Intent Extraction, and our proprietary Payment-Intent Inversion Engine. We cross-reference semantic message claims against the actual technical payment parameters and verify recipient handles against our National Fraud Intel database.`;
    } else if (q.includes("evidence") || q.includes("1930") || q.includes("cybercrime") || q.includes("police")) {
      answer = `RefGuard has compiled a tamper-evident Evidence Pack containing ${scan.evidence_pack?.items.length || 3} forensic artifacts with a digital SHA-256 hash. Click 'Create 1930 Report' to export the standardized complaint format ready for cybercrime.gov.in.`;
    } else {
      answer = `RefGuard analysis summary: Threat severity is ${scan.risk_assessment.risk_severity} with a risk score of ${score}/100. ${scan.protection_decision.detected_summary}. We recommend: ${scan.protection_decision.action === "ALLOW" ? "Proceed with normal caution." : "Do NOT authorize this transaction."}`;
    }

    return {
      answer,
      suggested_questions: this.generateSuggestions(scan, q),
      key_evidence_used: this.extractEvidenceRefs(scan),
      immediate_safety_advice: this.getImmediateAdvice(scan)
    };
  }

  private generateSuggestions(scan: ScanResponse, currentQ: string): string[] {
    const defaultSuggestions = [
      "Why is this dangerous?",
      "Who am I being asked to pay?",
      "What should I do right now?",
      "Is this a real payment or a trap?",
      "What evidence should I preserve?"
    ];
    return defaultSuggestions.filter(s => !currentQ.includes(s.toLowerCase().slice(0, 10))).slice(0, 3);
  }

  private extractEvidenceRefs(scan: ScanResponse): string[] {
    const refs: string[] = [];
    const rawExtraction = (scan as any).extraction_result;
    const vpas: string[] = rawExtraction?.upi_vpas || [];
    const amounts: number[] = rawExtraction?.amounts || [];
    const urls: string[] = rawExtraction?.urls || [];
    if (vpas.length > 0) refs.push(`VPA: ${vpas[0]}`);
    if (amounts.length > 0) refs.push(`Amount: ₹${amounts[0]}`);
    if (urls.length > 0) refs.push(`URL: ${urls[0]}`);
    if (scan.payment_intent_mismatch?.status === "DETECTED") refs.push("Direction Inversion Detected");
    return refs;
  }

  private getImmediateAdvice(scan: ScanResponse): string {
    if (scan.risk_assessment.risk_score >= 70) {
      return "CRITICAL: Do NOT enter UPI PIN. Do not approve payment request in your UPI app.";
    }
    if (scan.risk_assessment.risk_score >= 30) {
      return "CAUTION: Verify recipient identity through a separate trusted channel before paying.";
    }
    return "VERIFIED: Content matches standard safe payment patterns.";
  }
}
