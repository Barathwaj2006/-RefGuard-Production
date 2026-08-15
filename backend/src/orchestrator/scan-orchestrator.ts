import { createHash } from "crypto";
import {
  ScanRequest,
  ScanResponse
} from "../types/contracts.js";
import { EntityExtractor } from "../extraction/entity-extractor.js";
import { ThreatIntelService } from "../threat-intelligence/threat-intel-service.js";
import { EvidenceGenerator } from "../evidence/evidence-generator.js";
import { PrivacyScrubber } from "../privacy/privacy-scrubber.js";
import { ContextualIntelligenceService } from "../ai/contextual-intelligence-service.js";
import { ConversationAnalyzer } from "../ai/conversation-analyzer.js";
import { validateScanResponse } from "../validators/schema-validator.js";
import { analyzeScreenshotOrQR } from "../ai/multimodal-scanner.js";

export class ScanOrchestrator {
  private extractor: EntityExtractor;
  private threatIntel: ThreatIntelService;
  private evidenceGenerator: EvidenceGenerator;
  private privacyScrubber: PrivacyScrubber;
  private contextualAI: ContextualIntelligenceService;

  constructor(threatIntel?: ThreatIntelService) {
    this.extractor = new EntityExtractor();
    this.threatIntel = threatIntel || new ThreatIntelService();
    this.evidenceGenerator = new EvidenceGenerator();
    this.privacyScrubber = new PrivacyScrubber();
    this.contextualAI = new ContextualIntelligenceService();
  }

  public getThreatIntelService(): ThreatIntelService {
    return this.threatIntel;
  }

  public async orchestrateScan(request: ScanRequest): Promise<ScanResponse> {
    const timestamp = new Date().toISOString();
    const scanId = "scan-" + createHash("sha256").update(request.content_value + timestamp + Math.random()).digest("hex").substring(0, 10);

    let effectiveRequest = { ...request };

    // Multimodal Vision / OCR Ingress for Image Scans
    if (request.content_type === "IMAGE" && request.content_value) {
      try {
        const visualAnalysis = await analyzeScreenshotOrQR(request.content_value);
        if (visualAnalysis.extracted_text) {
          effectiveRequest.content_value = visualAnalysis.extracted_text;
        }
      } catch (err) {
        console.warn("Multimodal vision scan skipped, using raw payload:", err);
      }
    }

    // 1. Privacy Scrubbing (Strip OTPs, PINs, Passwords, Card numbers from sensitive storage)
    const scrubbing = this.privacyScrubber.scrub(effectiveRequest.content_value);

    // 2. Entity Extraction
    const extraction = this.extractor.extract(effectiveRequest);

    // 3. Threat Intelligence Evaluation
    const threatAssessments = await this.threatIntel.evaluateExtraction(extraction);

    // 4. Initial Evidence Pack Generation
    const rawSignals: string[] = [...scrubbing.privacySignals];
    for (const ta of threatAssessments) {
      if (ta.classification === "MALICIOUS") rawSignals.push(`MALICIOUS_${ta.indicator_type}`);
    }

    const initialMismatch = {
      status: "NOT_OBSERVED" as const,
      payment_direction: "NONE" as const,
      confidence: 0.5,
      provenance: "PRE_AI_INITIALIZATION"
    };

    const evidencePack = this.evidenceGenerator.generate(
      request,
      extraction,
      threatAssessments,
      initialMismatch,
      rawSignals,
      scrubbing.sanitizedText
    );

    // 5. AI & Contextual Intelligence Reasoning Layer
    const contextualResult = await this.contextualAI.analyzeContext(
      request,
      scrubbing,
      extraction,
      threatAssessments,
      evidencePack
    );

    // Add contextual mismatch evidence if detected
    if (contextualResult.mismatch.status === "DETECTED") {
      const mismatchEvidItem = {
        evidence_id: `evid-${evidencePack.items.length + 1}`,
        evidence_type: "RISK_SIGNAL" as const,
        data: `mismatch_detected: stated='${contextualResult.mismatch.stated_intent}' vs actual='${contextualResult.mismatch.actual_payment_action}'`
      };
      evidencePack.items.push(mismatchEvidItem);
      contextualResult.mismatch.evidence = [mismatchEvidItem.evidence_id];
    }

    // Extract structured entities for client investigation view
    const vpas = extraction.extracted_entities.filter(e => e.entity_type === "UPI_VPA").map(e => e.value);
    const urls = extraction.extracted_entities.filter(e => e.entity_type === "URL").map(e => e.value);
    const phoneNumbers = extraction.extracted_entities.filter(e => e.entity_type === "PHONE").map(e => e.value);
    const amounts = extraction.extracted_entities.filter(e => e.entity_type === "AMOUNT" && e.parsed_amount !== undefined).map(e => e.parsed_amount!);
    const domains = extraction.extracted_entities.filter(e => e.entity_type === "DOMAIN").map(e => e.value);
    const brands = extraction.extracted_entities.filter(e => e.entity_type === "BRAND").map(e => e.value);

    // Run conversational scam psychology analysis if conversational markers or dialogs are detected
    const conversationCues = /\[\d{1,2}:\d{2}|user:|caller:|recruiter:|support:|dear customer|congratulations|telegram|job offer|power cut/i.test(effectiveRequest.content_value);
    let conversationAnalysis = undefined;
    if (conversationCues || effectiveRequest.content_value.includes("\n")) {
      try {
        const convAnalyzer = new ConversationAnalyzer();
        conversationAnalysis = convAnalyzer.analyzeConversation(effectiveRequest.content_value);
      } catch (err) {
        console.warn("Conversation analysis skipped:", err);
      }
    }

    const response: ScanResponse = {
      scan_id: scanId,
      timestamp,
      risk_assessment: contextualResult.riskAssessment,
      protection_decision: contextualResult.protectionDecision,
      payment_intent_mismatch: contextualResult.mismatch.status !== "NOT_OBSERVED" ? contextualResult.mismatch : undefined,
      scam_chain: contextualResult.scamChain,
      evidence_pack: evidencePack,
      extraction_result: {
        upi_vpas: Array.from(new Set(vpas)),
        urls: Array.from(new Set(urls)),
        phone_numbers: Array.from(new Set(phoneNumbers)),
        amounts: Array.from(new Set(amounts)),
        domains: Array.from(new Set(domains)),
        brands: Array.from(new Set(brands))
      },
      conversation_analysis: conversationAnalysis
    };

    // Strict internal contract check before returning
    const validation = validateScanResponse(response);
    if (!validation.isValid) {
      console.warn("Scan response internal contract warning:", validation.error);
    }

    return response;
  }
}
