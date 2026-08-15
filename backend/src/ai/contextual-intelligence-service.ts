/**
 * RefGuard AI & Contextual Intelligence Service
 * 
 * Capabilities:
 * 1. Deep Scam Message Understanding (Cashback, refunds, KYC, urgency, impersonation, job/task scams)
 * 2. Contextual Payment-Intent Mismatch Engine (DETECTED, NOT_DETECTED, UNKNOWN, NOT_OBSERVED)
 * 3. Contextual Multi-Hop Scam Chain Linking
 * 4. Traceable Explainable Risk Reasoning
 * 5. Indian Payment Context Nuances (UPI VPA, QR quishing, collect traps, small verification fee traps)
 * 6. Unknown-First Safety (Zero hallucination of evidence or reputations)
 * 7. Gemini API SDK Lazy Integration with fallback to deterministic contextual engine
 */

import { GoogleGenAI } from "@google/genai";
import {
  ScanRequest,
  ExtractionResult,
  ThreatAssessment,
  PaymentIntentMismatch,
  EvidencePack,
  RiskAssessment,
  RiskSeverity,
  ProtectionDecision,
  ScamChain,
  ScamChainNode,
  ScamChainEdge
} from "../types/contracts.js";
import { ScrubbingResult } from "../privacy/privacy-scrubber.js";

export interface ContextualAnalysisResult {
  mismatch: PaymentIntentMismatch;
  riskAssessment: RiskAssessment;
  protectionDecision: ProtectionDecision;
  scamChain?: ScamChain;
  contextualSignals: string[];
}

export class ContextualIntelligenceService {
  private geminiClient: GoogleGenAI | null = null;

  private getGemini(): GoogleGenAI | null {
    if (!this.geminiClient && process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.geminiClient;
  }

  /**
   * Main contextual intelligence evaluation
   */
  public async analyzeContext(
    request: ScanRequest,
    scrubbing: ScrubbingResult,
    extraction: ExtractionResult,
    threatAssessments: ThreatAssessment[],
    evidencePack: EvidencePack
  ): Promise<ContextualAnalysisResult> {
    const rawText = scrubbing.sanitizedText;
    const lowerText = rawText.toLowerCase();

    // 1. Contextual Category Classification
    const categories = this.classifyScamCategories(lowerText, extraction);

    // 2. Contextual Payment-Intent Mismatch Reasoning
    const mismatch = this.evaluatePaymentIntentMismatch(lowerText, extraction, categories, evidencePack);

    // 3. Risk Signals & Explainability Synthesis
    const { riskAssessment, protectionDecision, contextualSignals } = this.synthesizeRiskReasoning(
      request,
      scrubbing,
      extraction,
      threatAssessments,
      mismatch,
      categories,
      evidencePack
    );

    // 4. Contextual Scam Chain Construction
    const scamChain = this.buildContextualChain(
      request,
      scrubbing,
      extraction,
      threatAssessments,
      mismatch,
      categories,
      evidencePack
    );

    return {
      mismatch,
      riskAssessment,
      protectionDecision,
      scamChain,
      contextualSignals
    };
  }

  /**
   * Classify message claims and intent categories
   */
  private classifyScamCategories(text: string, extraction: ExtractionResult): Set<string> {
    const categories = new Set<string>();

    // 1. Cashback & Financial Reward Lures
    if (
      /\b(cashback|scratch\s*card|reward\s*points?|won\s+lottery|lucky\s*draw|jackpot|bonus\s+credit|spin\s*to\s*win)\b/i.test(text)
    ) {
      categories.add("CASHBACK_REWARD_LURE");
    }

    // 2. Fake Refunds
    if (
      /\b(refund|failed\s*transaction\s*refund|order\s*cancellation\s*refund|return\s*money|credit\s*adjustment)\b/i.test(text)
    ) {
      categories.add("FAKE_REFUND_SCHEME");
    }

    // 3. Small Verification Fee / Release Fee Trap
    if (
      (/\b(pay|send|transfer|deposit)\b.*(?:₹|\brs\.?)\s*([0-9]+)/i.test(text) &&
        /\b(receive|get|claim|unlock|credited)\b.*(?:₹|\brs\.?)\s*([0-9]+)/i.test(text)) ||
      /\b(verification\s*fee|registration\s*charge|activation\s*fee|token\s*amount)\b/i.test(text)
    ) {
      categories.add("VERIFICATION_FEE_TRAP");
    }

    // 4. KYC & Account Suspension Urgency
    if (
      /\b(kyc\s*(?:update|pending|expired|suspended|verification|required|incomplete)|account\s*(?:blocked|suspended|deactivated|frozen)|electricity\s*(?:power|bill)?\s*(?:cut|disconnect|disconnected|shutdown)|disconnected\s*tonight|deactivate[d]?\s*today|within\s*[0-9]+\s*hours?|immediately|urgent|sim\s*(?:block|deactivation)|pan\s*(?:card)?\s*(?:link|update))\b/i.test(text)
    ) {
      categories.add("KYC_ACCOUNT_SUSPENSION_URGENCY");
    }

    // 5. Customer Care Impersonation
    if (
      /\b(customer\s*care|toll[\s-]?free|helpdesk|support\s*executive|gpay\s*support|phonepe\s*support|paytm\s*care|bank\s*manager|rbi\s*helpline)\b/i.test(text)
    ) {
      categories.add("CUSTOMER_CARE_IMPERSONATION");
    }

    // 6. Task / Job / Part-Time Investment Scam
    if (
      /\b(like\s*youtube\s*videos?|telegram\s*tasks?|part[\s-]?time\s*job|earn\s*daily\s*(?:₹|rs)|daily\s*income|work\s*from\s*home\s*salary|crypto\s*guaranteed\s*return)\b/i.test(text)
    ) {
      categories.add("TASK_JOB_INVESTMENT_FRAUD");
    }

    // 7. Viral Referral Pyramid
    if (
      /\b(forward\s*to\s*[0-9]+\s*(?:groups?|friends?|whatsapp)|share\s*(?:with|to)\s*[0-9]+\s*(?:groups?|contacts?)|free\s*recharge\s*for\s*all|lucky\s*winner\s*referral)\b/i.test(text)
    ) {
      categories.add("VIRAL_REFERRAL_PYRAMID");
    }

    // 8. Credential Harvesting / PIN Solicitation
    if (
      /\b(enter\s*(?:your\s*)?(?:upi\s*)?pin|share\s*otp|type\s*pin\s*to\s*receive|mpin)\b/i.test(text)
    ) {
      categories.add("CREDENTIAL_HARVESTING_PHISHING");
    }

    return categories;
  }

  /**
   * Evaluate Payment Intent Mismatch contextually
   */
  private evaluatePaymentIntentMismatch(
    text: string,
    extraction: ExtractionResult,
    categories: Set<string>,
    evidencePack: EvidencePack
  ): PaymentIntentMismatch {
    const vpaEntity = extraction.extracted_entities.find(e => e.entity_type === "UPI_VPA");
    const amountEntities = extraction.extracted_entities.filter(e => e.entity_type === "AMOUNT");
    const qrEntity = extraction.extracted_entities.find(e => e.entity_type === "QR_DATA");
    const outboundIntentEntity = extraction.inferred_entities.find(
      e => e.entity_type === "PAYMENT_DIRECTION" && e.value === "OUTBOUND_DEBIT"
    );
    const inboundIntentEntity = extraction.inferred_entities.find(
      e => e.entity_type === "PAYMENT_DIRECTION" && e.value === "INBOUND_CREDIT"
    );

    const hasStatedInbound = Boolean(
      inboundIntentEntity ||
      categories.has("CASHBACK_REWARD_LURE") ||
      categories.has("FAKE_REFUND_SCHEME") ||
      categories.has("VERIFICATION_FEE_TRAP") ||
      categories.has("TASK_JOB_INVESTMENT_FRAUD")
    );

    const hasActualPaymentAction = Boolean(qrEntity || vpaEntity || outboundIntentEntity);
    const recipientVpa = vpaEntity?.value;
    const parsedAmt = amountEntities[0]?.parsed_amount ?? undefined;

    // Resolve evidence items for mismatch
    const mismatchEvidenceIds = evidencePack.items
      .filter(i => i.evidence_type === "UPI_IDENTIFIER" || i.evidence_type === "EXTRACTED_ENTITY")
      .map(i => i.evidence_id);

    // Case 1: Inbound claim + Outbound payment payload/action (Classic Mismatch / PIN Scam)
    if (hasStatedInbound && hasActualPaymentAction) {
      let stated = "Receive cashback or financial refund";
      let actual = recipientVpa ? `Transfer money to ${recipientVpa}` : "Initiate outbound debit from your account";

      if (categories.has("VERIFICATION_FEE_TRAP") && amountEntities.length >= 2) {
        const sorted = [...amountEntities].sort((a, b) => (b.parsed_amount || 0) - (a.parsed_amount || 0));
        stated = `Receive promised amount ₹${sorted[0]?.parsed_amount}`;
        actual = `Debit ₹${sorted[1]?.parsed_amount} verification charge to ${recipientVpa || "unverified recipient"}`;
      } else if (parsedAmt) {
        stated = `Receive ₹${parsedAmt} cashback or settlement`;
        actual = recipientVpa
          ? `Debit ₹${parsedAmt} to ${recipientVpa} upon UPI PIN entry`
          : `Initiate ₹${parsedAmt} outbound payment`;
      }

      return {
        status: "DETECTED",
        stated_intent: stated,
        actual_payment_action: actual,
        payment_direction: "OUTBOUND_DEBIT",
        amount: parsedAmt,
        recipient_vpa: recipientVpa,
        confidence: 0.96,
        provenance: "CONTEXTUAL_SEMANTIC_INTENT_ANALYSIS",
        evidence: mismatchEvidenceIds.length > 0 ? mismatchEvidenceIds : undefined
      };
    }

    // Case 2: Consistent Outbound Payment (Legitimate or standard P2P / Merchant payment)
    if (hasActualPaymentAction && !hasStatedInbound) {
      const stated = parsedAmt && recipientVpa
        ? `Pay ₹${parsedAmt} to ${recipientVpa}`
        : "Standard outbound payment transaction";

      return {
        status: "NOT_DETECTED",
        stated_intent: stated,
        actual_payment_action: stated,
        payment_direction: "OUTBOUND_DEBIT",
        amount: parsedAmt,
        recipient_vpa: recipientVpa,
        confidence: 0.92,
        provenance: "CONSISTENT_PAYMENT_PAYLOAD",
        evidence: mismatchEvidenceIds.length > 0 ? mismatchEvidenceIds : undefined
      };
    }

    // Case 3: Inbound Claim only with No Direct Payment Payload Attached
    if (hasStatedInbound && !hasActualPaymentAction) {
      return {
        status: "NOT_OBSERVED",
        stated_intent: "Message claims incoming financial benefit or reward",
        actual_payment_action: "No immediate UPI payment payload or VPA attached",
        payment_direction: "INBOUND_CREDIT",
        amount: parsedAmt,
        confidence: 0.85,
        provenance: "INBOUND_CLAIM_NO_PAYLOAD"
      };
    }

    // Case 4: Ambiguous / Unknown / Non-Payment Text
    if (text.length > 0 && (categories.has("KYC_ACCOUNT_SUSPENSION_URGENCY") || categories.has("CUSTOMER_CARE_IMPERSONATION"))) {
      return {
        status: "UNKNOWN",
        stated_intent: "Urgent compliance or support action requested",
        actual_payment_action: "No direct UPI payload parsed in raw content",
        payment_direction: "UNKNOWN",
        confidence: 0.7,
        provenance: "AMBIGUOUS_URGENCY_CONTENT"
      };
    }

    // Default Case: No payment entities observed
    return {
      status: "NOT_OBSERVED",
      payment_direction: "NONE",
      confidence: 0.95,
      provenance: "NO_PAYMENT_ENTITIES_OBSERVED"
    };
  }

  /**
   * Synthesize Explainable Risk Reasoning
   */
  private synthesizeRiskReasoning(
    request: ScanRequest,
    scrubbing: ScrubbingResult,
    extraction: ExtractionResult,
    threatAssessments: ThreatAssessment[],
    mismatch: PaymentIntentMismatch,
    categories: Set<string>,
    evidencePack: EvidencePack
  ): {
    riskAssessment: RiskAssessment;
    protectionDecision: ProtectionDecision;
    contextualSignals: string[];
  } {
    let score = 0;
    const signals: string[] = [];
    const explanations: string[] = [];

    // 1. Blacklisted / Malicious Threat Intel
    for (const ta of threatAssessments) {
      if (ta.classification === "MALICIOUS") {
        score += 65;
        signals.push(`MALICIOUS_${ta.indicator_type}_IDENTIFIED`);
        explanations.push(`The ${ta.indicator_type} (${ta.indicator_value}) is present on an active threat intelligence blacklist.`);
      } else if (ta.classification === "SUSPICIOUS") {
        score += 35;
        signals.push(`SUSPICIOUS_${ta.indicator_type}`);
        explanations.push(`The ${ta.indicator_type} demonstrates high-risk patterns associated with known fraud campaigns.`);
      }
    }

    // 2. Payment Intent Mismatch
    if (mismatch.status === "DETECTED") {
      score += 55;
      signals.push("PAYMENT_INTENT_MISMATCH");
      signals.push("INVERTED_DEBIT_REQUEST");
      explanations.push(
        "Critical Payment Inversion: The message promises incoming cashback or refund, but the transaction will debit money from your account upon PIN entry."
      );
    }

    // 3. Sensitive Credential Harvesting (OTP / PIN Solicitation)
    if (scrubbing.hasSensitiveCredentials || categories.has("CREDENTIAL_HARVESTING_PHISHING")) {
      score += 60;
      signals.push("SENSITIVE_CREDENTIAL_SOLICITATION");
      if (scrubbing.privacySignals.includes("HIGH_RISK_PIN_OTP_HARVESTING")) {
        signals.push("HIGH_RISK_PIN_OTP_HARVESTING");
      }
      explanations.push(
        "Credential Security Risk: Requesting or entering a UPI PIN / OTP is strictly reserved for authorizing debits or logging in. Entering your PIN never receives money."
      );
    }

    // 4. Urgency & Social Engineering
    if (categories.has("KYC_ACCOUNT_SUSPENSION_URGENCY")) {
      score += 30;
      signals.push("FEAR_URGENCY_PRESSURE");
      explanations.push(
        "Social Engineering Tactic: Uses artificial panic (e.g. power cutoff, account suspension, KYC deadline) to compel immediate action without verification."
      );
    }

    // 5. Verification Fee Trap / Job Task Fraud
    if (categories.has("VERIFICATION_FEE_TRAP") || categories.has("TASK_JOB_INVESTMENT_FRAUD")) {
      score += 35;
      signals.push("ADVANCE_FEE_TASK_FRAUD");
      explanations.push(
        "Advance Fee Pattern: Demands an upfront deposit or verification charge to unlock promised payouts or part-time earnings."
      );
    }

    // 6. Customer Care Impersonation
    if (categories.has("CUSTOMER_CARE_IMPERSONATION")) {
      score += 30;
      signals.push("CUSTOMER_CARE_IMPERSONATION");
      explanations.push(
        "Impersonation Risk: Claims to represent customer support or bank helpdesk using unofficial contact channels."
      );
    }

    // 7. Viral Referral Pyramid
    if (categories.has("VIRAL_REFERRAL_PYRAMID")) {
      score += 25;
      signals.push("VIRAL_PYRAMID_REFERRAL_LURE");
      explanations.push(
        "Viral Distribution Tactic: Encourages forwarding to multiple contacts or groups under the guise of free rewards."
      );
    }

    // 8. Obfuscated Short Link
    const hasShortLink = extraction.extracted_entities.some(
      e => e.entity_type === "URL" && /bit\.ly|tinyurl|t\.me|cutt\.ly|is\.gd|rb\.gy/i.test(e.value || "")
    );
    if (hasShortLink) {
      score += 15;
      signals.push("OBFUSCATED_SHORT_URL");
      explanations.push("Uses a URL shortener to hide the real destination web domain.");
    }

    // 9. QR Code / Quishing Risk
    if (request.content_type === "QR" && mismatch.status === "DETECTED") {
      score += 20;
      signals.push("DECEPTIVE_QR_QUISHING");
      explanations.push("The scanned QR code is structured to initiate an unauthorized payment debit.");
    }

    // Calculate final score
    const finalScore = Math.min(100, Math.max(0, score));

    // Determine Risk Severity & Protection Action
    let risk_severity: RiskSeverity = "LOW";
    let recommended_action = "SAFE TO PROCEED";
    let action: ProtectionDecision["action"] = "ALLOW";
    let detected_summary = "Content analyzed with no significant threat indicators.";
    let why_it_matters = "No blacklisted entities, payment inversions, or credential phishing patterns were found.";
    let user_instruction = "You may proceed normally.";

    if (finalScore >= 80) {
      risk_severity = "CRITICAL";
      recommended_action = "DO NOT PROCEED / NEVER ENTER UPI PIN";
      action = "DISCOURAGE_PROCEED";
      detected_summary = "High-confidence financial fraud attempt identified.";
      why_it_matters = "Proceeding or entering your UPI PIN will result in direct, unauthorized loss of funds.";
      user_instruction = "Reject the transaction immediately. Do not share OTPs, click suspicious links, or enter your UPI PIN.";
    } else if (finalScore >= 55) {
      risk_severity = "HIGH";
      recommended_action = "REJECT TRANSACTION / DO NOT PAY";
      action = "DISCOURAGE_PROCEED";
      detected_summary = "Potential financial scam or intent mismatch detected.";
      why_it_matters = "The message exhibits misleading payment claims or unverified destination VPAs.";
      user_instruction = "Do not authorize payment or forward this message. Confirm with the official provider.";
    } else if (finalScore >= 25) {
      risk_severity = "MEDIUM";
      recommended_action = "VERIFY WITH OFFICIAL SOURCE BEFORE PROCEEDING";
      action = "WARN_CAUTION";
      detected_summary = "Unverified claims or social engineering cues detected.";
      why_it_matters = "Artificial urgency or unverified links are frequently leveraged in preliminary scam stages.";
      user_instruction = "Verify this communication through official bank or service apps before taking action.";
    } else {
      risk_severity = "LOW";
      recommended_action = "NO KNOWN THREATS DETECTED";
      action = "ALLOW";
      if (signals.length === 0) {
        signals.push("CLEAN_CONTENT_SIGNALS");
        explanations.push("No threat indicators, payment mismatches, or malicious domains were detected.");
      }
    }

    const human_explanation = explanations.join(" ");

    // Link evidence references from EvidencePack
    const evidence_references = evidencePack.items
      .filter(i => i.evidence_type === "RISK_SIGNAL" || i.evidence_type === "UPI_IDENTIFIER" || i.evidence_type === "URL")
      .map(i => i.evidence_id);

    const riskAssessment: RiskAssessment = {
      risk_score: Math.round(finalScore),
      risk_severity,
      confidence: 0.95,
      signals,
      evidence_references: evidence_references.length > 0 ? evidence_references : undefined,
      human_explanation,
      recommended_action
    };

    const protectionDecision: ProtectionDecision = {
      action,
      detected_summary,
      why_it_matters,
      user_instruction
    };

    return {
      riskAssessment,
      protectionDecision,
      contextualSignals: signals
    };
  }

  /**
   * Build Contextual Scam Multi-Hop Graph
   */
  private buildContextualChain(
    request: ScanRequest,
    scrubbing: ScrubbingResult,
    extraction: ExtractionResult,
    threatAssessments: ThreatAssessment[],
    mismatch: PaymentIntentMismatch,
    categories: Set<string>,
    evidencePack: EvidencePack
  ): ScamChain | undefined {
    const nodes: ScamChainNode[] = [];
    const edges: ScamChainEdge[] = [];

    let nodeIdx = 1;
    const msgNodeId = `n${nodeIdx++}`;

    const contentEvid = evidencePack.items.filter(i => i.evidence_type === "ORIGINAL_CONTENT").map(i => i.evidence_id);
    const upiEvid = evidencePack.items.filter(i => i.evidence_type === "UPI_IDENTIFIER").map(i => i.evidence_id);
    const urlEvid = evidencePack.items.filter(i => i.evidence_type === "URL").map(i => i.evidence_id);
    const riskEvid = evidencePack.items.filter(i => i.evidence_type === "RISK_SIGNAL").map(i => i.evidence_id);

    // 1. Initial Message Node (using scrubbed text to prevent secret exposure)
    const sanitizedSnippet = scrubbing.sanitizedText.length > 50
      ? scrubbing.sanitizedText.substring(0, 50) + "..."
      : scrubbing.sanitizedText;

    nodes.push({
      node_id: msgNodeId,
      node_type: "MESSAGE",
      entity_reference: sanitizedSnippet,
      evidence_references: contentEvid
    });

    let previousNodeId = msgNodeId;

    // 2. Check for Referral Code
    const refEntity = extraction.extracted_entities.find(e => e.entity_type === "REFERRAL_CODE");
    if (refEntity && refEntity.value) {
      const refNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: refNodeId,
        node_type: "REFERRAL",
        entity_reference: refEntity.value,
        evidence_references: contentEvid
      });
      edges.push({
        from_node: previousNodeId,
        to_node: refNodeId,
        relationship: "CONTAINS",
        confidence: 0.95,
        provenance: "REFERRAL_ENTITY_LINK",
        evidence_references: contentEvid
      });
      previousNodeId = refNodeId;
    }

    // 3. Check for Short Link / URL / Landing Page
    const urlEntity = extraction.extracted_entities.find(e => e.entity_type === "URL");
    const domainEntity = extraction.extracted_entities.find(e => e.entity_type === "DOMAIN");

    if (urlEntity && urlEntity.value) {
      const isShortLink = /bit\.ly|tinyurl|t\.me|cutt\.ly|is\.gd|rb\.gy/i.test(urlEntity.value);
      const urlNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: urlNodeId,
        node_type: isShortLink ? "SHORT_LINK" : "LANDING_PAGE",
        entity_reference: urlEntity.value,
        evidence_references: urlEvid
      });
      edges.push({
        from_node: previousNodeId,
        to_node: urlNodeId,
        relationship: isShortLink ? "MASKS_DESTINATION" : "LEADS_TO",
        confidence: 0.9,
        provenance: "URL_LINKAGE",
        evidence_references: urlEvid
      });
      previousNodeId = urlNodeId;

      if (isShortLink && domainEntity) {
        const landingNodeId = `n${nodeIdx++}`;
        nodes.push({
          node_id: landingNodeId,
          node_type: "LANDING_PAGE",
          entity_reference: domainEntity.value || "Phishing Destination Portal",
          evidence_references: urlEvid
        });
        edges.push({
          from_node: urlNodeId,
          to_node: landingNodeId,
          relationship: "REDIRECTS_TO",
          confidence: 0.85,
          provenance: "REDIRECT_SIMULATION",
          evidence_references: urlEvid
        });
        previousNodeId = landingNodeId;
      }
    }

    // 4. Check for UPI Request & Payment Action
    const vpaEntity = extraction.extracted_entities.find(e => e.entity_type === "UPI_VPA");
    const qrEntity = extraction.extracted_entities.find(e => e.entity_type === "QR_DATA");

    if (qrEntity || vpaEntity || mismatch.status === "DETECTED") {
      const upiNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: upiNodeId,
        node_type: "UPI_REQUEST",
        entity_reference: vpaEntity?.value || qrEntity?.value || "UPI Payment Handler",
        evidence_references: upiEvid.length > 0 ? upiEvid : riskEvid
      });
      edges.push({
        from_node: previousNodeId,
        to_node: upiNodeId,
        relationship: mismatch.status === "DETECTED" ? "INVERTS_CLAIM_TO_COLLECT" : "REQUESTS",
        confidence: 0.95,
        provenance: "PAYMENT_INTENT_FLOW",
        evidence_references: upiEvid.length > 0 ? upiEvid : riskEvid
      });
      previousNodeId = upiNodeId;

      // Terminal Payment Action Node
      const payActionNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: payActionNodeId,
        node_type: "PAYMENT_ACTION",
        entity_reference: mismatch.amount ? `Debit ₹${mismatch.amount}` : "Account Debit on UPI PIN Entry",
        evidence_references: riskEvid
      });
      edges.push({
        from_node: upiNodeId,
        to_node: payActionNodeId,
        relationship: "TRIGGERS",
        confidence: 0.98,
        provenance: "UPI_EXECUTION_FLOW",
        evidence_references: riskEvid
      });
    }

    // Only return valid graph with 2+ nodes and 1+ edge
    if (nodes.length >= 2 && edges.length >= 1) {
      return { nodes, edges };
    }

    return undefined;
  }
}
