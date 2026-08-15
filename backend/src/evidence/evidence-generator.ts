import { createHash } from "crypto";
import {
  ScanRequest,
  ExtractionResult,
  ThreatAssessment,
  PaymentIntentMismatch,
  EvidencePack,
  EvidenceItem
} from "../types/contracts.js";
import { PrivacyScrubber } from "../privacy/privacy-scrubber.js";

export class EvidenceGenerator {
  private privacyScrubber: PrivacyScrubber = new PrivacyScrubber();

  public generate(
    request: ScanRequest,
    extraction: ExtractionResult,
    threatAssessments: ThreatAssessment[],
    mismatch: PaymentIntentMismatch,
    riskSignals: string[],
    sanitizedContentValue?: string
  ): EvidencePack {
    const timestamp = new Date().toISOString();
    const cleanContent = sanitizedContentValue || this.privacyScrubber.scrub(request.content_value).sanitizedText;
    const incidentId = "inc-" + createHash("sha256").update(cleanContent + timestamp).digest("hex").substring(0, 12);
    const items: EvidenceItem[] = [];
    let counter = 1;

    // 1. Original content hash item (computed on sanitized content)
    const contentHash = createHash("sha256").update(cleanContent).digest("hex");
    items.push({
      evidence_id: `evid-${counter++}`,
      evidence_type: "ORIGINAL_CONTENT",
      data: `sha256:${contentHash} (type: ${request.content_type})`
    });

    // 2. Extracted entities
    for (const entity of extraction.extracted_entities) {
      if (entity.entity_type === "UPI_VPA") {
        items.push({
          evidence_id: `evid-${counter++}`,
          evidence_type: "UPI_IDENTIFIER",
          data: `vpa:${entity.value}`
        });
      } else if (entity.entity_type === "URL" || entity.entity_type === "DOMAIN") {
        items.push({
          evidence_id: `evid-${counter++}`,
          evidence_type: "URL",
          data: `url:${entity.value}`
        });
      } else if (entity.entity_type === "AMOUNT") {
        items.push({
          evidence_id: `evid-${counter++}`,
          evidence_type: "EXTRACTED_ENTITY",
          data: `amount:${entity.parsed_amount} ${entity.currency || "INR"}`
        });
      } else if (entity.entity_type === "REFERRAL_CODE") {
        items.push({
          evidence_id: `evid-${counter++}`,
          evidence_type: "EXTRACTED_ENTITY",
          data: `referral_code:${entity.value}`
        });
      }
    }

    // 3. Threat assessment evidence
    for (const ta of threatAssessments) {
      if (ta.classification === "MALICIOUS" || ta.classification === "SUSPICIOUS") {
        items.push({
          evidence_id: `evid-${counter++}`,
          evidence_type: "RISK_SIGNAL",
          data: `threat_intel:${ta.indicator_type}=${ta.indicator_value} [${ta.classification}] (${ta.provenance})`
        });
      }
    }

    // 4. Payment Intent Mismatch evidence
    if (mismatch.status === "DETECTED") {
      items.push({
        evidence_id: `evid-${counter++}`,
        evidence_type: "RISK_SIGNAL",
        data: `mismatch_detected: stated='${mismatch.stated_intent}' vs actual='${mismatch.actual_payment_action}'`
      });
    }

    // 5. General risk signals
    for (const signal of riskSignals) {
      items.push({
        evidence_id: `evid-${counter++}`,
        evidence_type: "RISK_SIGNAL",
        data: `signal:${signal}`
      });
    }

    return {
      incident_id: incidentId,
      timestamp,
      items
    };
  }
}
