/**
 * RefGuard API v1 Contract Types
 * Strictly aligned with /contracts/schemas/*.json
 */

export type ContentType =
  | "TEXT"
  | "URL"
  | "UPI_VPA"
  | "IMAGE"
  | "QR"
  | "SHARE_INTENT"
  | "CLIPBOARD"
  | "MANUAL";

export interface ScanRequest {
  content_type: ContentType;
  content_value: string;
  source_context?: string;
  timestamp: string;
}

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN";

export interface RiskAssessment {
  risk_score: number;
  risk_severity: RiskSeverity;
  confidence: number;
  signals: string[];
  evidence_references?: string[];
  human_explanation: string;
  recommended_action: string;
}

export type ProtectionAction =
  | "ALLOW"
  | "WARN_CAUTION"
  | "REQUIRE_CONFIRMATION"
  | "DISCOURAGE_PROCEED";

export interface ProtectionDecision {
  action: ProtectionAction;
  detected_summary: string;
  why_it_matters: string;
  user_instruction: string;
}

export type MismatchStatus = "DETECTED" | "NOT_DETECTED" | "UNKNOWN" | "NOT_OBSERVED";
export type PaymentDirection = "OUTBOUND_DEBIT" | "INBOUND_CREDIT" | "NONE" | "UNKNOWN";

export interface PaymentIntentMismatch {
  status: MismatchStatus;
  stated_intent?: string;
  actual_payment_action?: string;
  payment_direction: PaymentDirection;
  amount?: number;
  recipient_vpa?: string;
  confidence: number;
  provenance: string;
  evidence?: string[];
}

export type ScamChainNodeType =
  | "MESSAGE"
  | "REFERRAL"
  | "SHORT_LINK"
  | "REDIRECT"
  | "LANDING_PAGE"
  | "UPI_REQUEST"
  | "PAYMENT_ACTION";

export interface ScamChainNode {
  node_id: string;
  node_type: ScamChainNodeType;
  entity_reference?: string;
  evidence_references?: string[];
}

export interface ScamChainEdge {
  from_node: string;
  to_node: string;
  relationship: string;
  confidence: number;
  provenance: string;
  evidence_references?: string[];
}

export interface ScamChain {
  nodes: ScamChainNode[];
  edges: ScamChainEdge[];
}

export type EvidenceType =
  | "ORIGINAL_CONTENT"
  | "EXTRACTED_ENTITY"
  | "URL"
  | "UPI_IDENTIFIER"
  | "RISK_SIGNAL";

export interface EvidenceItem {
  evidence_id: string;
  evidence_type: EvidenceType;
  data: string;
}

export interface EvidencePack {
  incident_id: string;
  timestamp: string;
  items: EvidenceItem[];
}

export interface ScanResponse {
  scan_id: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  protection_decision: ProtectionDecision;
  payment_intent_mismatch?: PaymentIntentMismatch;
  scam_chain?: ScamChain;
  evidence_pack?: EvidencePack;
  extraction_result?: {
    upi_vpas: string[];
    urls: string[];
    phone_numbers: string[];
    amounts: number[];
    domains?: string[];
    brands?: string[];
  };
  conversation_analysis?: any;
}

export type IndicatorType = "URL" | "DOMAIN" | "UPI_VPA" | "PHONE" | "REFERRAL_CODE";
export type ThreatClassification = "SAFE" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN";
export type ThreatSourceType = "PUBLIC" | "CURATED" | "COMMUNITY" | "LOCAL_RULE" | "THIRD_PARTY";

export interface ThreatAssessment {
  indicator_type: IndicatorType;
  indicator_value: string;
  classification: ThreatClassification;
  confidence: number;
  source: string;
  source_type: ThreatSourceType;
  freshness_timestamp: string;
  provenance: string;
}

export type EntityType =
  | "URL"
  | "DOMAIN"
  | "UPI_VPA"
  | "QR_DATA"
  | "PHONE"
  | "AMOUNT"
  | "BRAND"
  | "REFERRAL_CODE"
  | "TEXT"
  | "PAYMENT_DIRECTION";

export interface ExtractedEntity {
  entity_type: EntityType;
  value?: string;
  raw_value?: string;
  parsed_amount?: number | null;
  currency?: string | null;
  confidence: number;
  provenance: string;
}

export interface ExtractionResult {
  extracted_entities: ExtractedEntity[];
  inferred_entities: ExtractedEntity[];
}

export type ModerationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface ScamReport {
  report_id: string;
  reported_indicator: string;
  report_category: string;
  description?: string;
  evidence_references?: string[];
  submission_timestamp: string;
  moderation_status: ModerationStatus;
  confidence: number;
  provenance: string;
}

export interface ErrorResponse {
  error_code: string;
  error_message: string;
  details?: string;
}
