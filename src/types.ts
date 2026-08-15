export type ContentType =
  | "TEXT"
  | "URL"
  | "UPI_VPA"
  | "IMAGE"
  | "QR"
  | "SHARE_INTENT"
  | "CLIPBOARD"
  | "MANUAL";

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNKNOWN" | "SAFE";

export interface RiskSignalItem {
  signal_name: string;
  description: string;
  confidence: number;
}

export interface RiskAssessment {
  risk_score: number;
  risk_severity: RiskSeverity;
  confidence: number;
  signals: (string | RiskSignalItem)[];
  evidence_references?: string[];
  human_explanation?: string;
  explanation?: string;
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
  stated_intent?: {
    action: string;
    target_entity?: string;
    amount?: number;
  } | string;
  actual_payment_action?: {
    action: string;
    target_entity?: string;
    amount?: number;
  } | string;
  payment_direction: PaymentDirection;
  amount?: number;
  recipient_vpa?: string;
  confidence: number;
  provenance?: string;
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
  node_type: ScamChainNodeType | string;
  label?: string;
  summary?: string;
  threat_indicators?: string[];
  risk_contribution: number;
  timestamp?: string;
  entity_reference?: string;
  evidence_references?: string[];
}

export interface ScamChainEdge {
  from_node: string;
  to_node: string;
  relationship: string;
  confidence: number;
  provenance?: string;
  evidence_references?: string[];
}

export interface ScamChainDAG {
  nodes: ScamChainNode[];
  edges: ScamChainEdge[];
}

export interface EvidenceItem {
  evidence_id: string;
  evidence_type: string;
  data: string;
}

export interface EvidencePack {
  incident_id?: string;
  digital_signature?: string;
  timestamp: string;
  items: EvidenceItem[];
}

export interface ConversationStage {
  stage_name: string;
  description: string;
  detected: boolean;
  evidence_snippet?: string;
}

export interface EmotionalTrigger {
  trigger_name: string;
  intensity: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
}

export interface DefusalResponse {
  title: string;
  response_text: string;
  tactic_countered: string;
}

export interface ConversationAnalysisData {
  scam_probability: number;
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_scam_type: string;
  social_engineering_stages: ConversationStage[];
  emotional_manipulation_triggers: EmotionalTrigger[];
  detected_requested_actions: string[];
  extracted_entities: {
    vpas: string[];
    urls: string[];
    phone_numbers: string[];
    amounts: number[];
  };
  recommended_safe_defusal_responses: DefusalResponse[];
  summary: string;
}

export interface ScanResponse {
  scan_id: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  protection_decision: ProtectionDecision;
  payment_intent_mismatch?: PaymentIntentMismatch;
  scam_chain?: ScamChainDAG;
  evidence_pack?: EvidencePack;
  extraction_result?: {
    upi_vpas: string[];
    urls: string[];
    phone_numbers: string[];
    amounts: number[];
    domains?: string[];
    brands?: string[];
  };
  conversation_analysis?: ConversationAnalysisData;
}
