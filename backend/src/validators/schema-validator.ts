import {
  ScanRequest,
  ScamReport,
  ScanResponse,
  ContentType,
  RiskSeverity,
  ProtectionAction,
  MismatchStatus,
  PaymentDirection,
  ScamChainNodeType,
  EvidenceType
} from "../types/contracts.js";

const VALID_CONTENT_TYPES: ContentType[] = [
  "TEXT",
  "URL",
  "UPI_VPA",
  "IMAGE",
  "QR",
  "SHARE_INTENT",
  "CLIPBOARD",
  "MANUAL"
];

const VALID_RISK_SEVERITIES: RiskSeverity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "UNKNOWN"
];

const VALID_PROTECTION_ACTIONS: ProtectionAction[] = [
  "ALLOW",
  "WARN_CAUTION",
  "REQUIRE_CONFIRMATION",
  "DISCOURAGE_PROCEED"
];

const VALID_MISMATCH_STATUSES: MismatchStatus[] = [
  "DETECTED",
  "NOT_DETECTED",
  "UNKNOWN",
  "NOT_OBSERVED"
];

const VALID_PAYMENT_DIRECTIONS: PaymentDirection[] = [
  "OUTBOUND_DEBIT",
  "INBOUND_CREDIT",
  "NONE",
  "UNKNOWN"
];

const VALID_NODE_TYPES: ScamChainNodeType[] = [
  "MESSAGE",
  "REFERRAL",
  "SHORT_LINK",
  "REDIRECT",
  "LANDING_PAGE",
  "UPI_REQUEST",
  "PAYMENT_ACTION"
];

const VALID_EVIDENCE_TYPES: EvidenceType[] = [
  "ORIGINAL_CONTENT",
  "EXTRACTED_ENTITY",
  "URL",
  "UPI_IDENTIFIER",
  "RISK_SIGNAL"
];

function isValidIsoDate(str: string): boolean {
  if (typeof str !== "string" || !str.trim()) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

export function validateScanRequest(body: unknown): ValidationResult<ScanRequest> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { isValid: false, error: "Request body must be a JSON object" };
  }

  const obj = body as Record<string, unknown>;

  // Check additional properties (schema: additionalProperties: false)
  const allowedKeys = new Set(["content_type", "content_value", "source_context", "timestamp"]);
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.has(key)) {
      return { isValid: false, error: `Unrecognized field: ${key}` };
    }
  }

  if (!obj.content_type || typeof obj.content_type !== "string") {
    return { isValid: false, error: "Missing or invalid 'content_type'" };
  }

  if (!VALID_CONTENT_TYPES.includes(obj.content_type as ContentType)) {
    return {
      isValid: false,
      error: `'content_type' must be one of: ${VALID_CONTENT_TYPES.join(", ")}`
    };
  }

  if (typeof obj.content_value !== "string" || obj.content_value === undefined) {
    return { isValid: false, error: "Missing or invalid 'content_value'" };
  }

  if (obj.source_context !== undefined && typeof obj.source_context !== "string") {
    return { isValid: false, error: "'source_context' must be a string if provided" };
  }

  if (!obj.timestamp || typeof obj.timestamp !== "string" || !isValidIsoDate(obj.timestamp)) {
    return { isValid: false, error: "Missing or invalid 'timestamp' (must be ISO date-time string)" };
  }

  return {
    isValid: true,
    data: {
      content_type: obj.content_type as ContentType,
      content_value: obj.content_value,
      source_context: obj.source_context as string | undefined,
      timestamp: obj.timestamp
    }
  };
}

export function validateScamReport(body: unknown): ValidationResult<ScamReport> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { isValid: false, error: "Request body must be a JSON object" };
  }

  const obj = body as Record<string, unknown>;
  const allowedKeys = new Set([
    "report_id",
    "reported_indicator",
    "report_category",
    "description",
    "evidence_references",
    "submission_timestamp",
    "moderation_status",
    "confidence",
    "provenance"
  ]);

  for (const key of Object.keys(obj)) {
    if (!allowedKeys.has(key)) {
      return { isValid: false, error: `Unrecognized field: ${key}` };
    }
  }

  if (!obj.report_id || typeof obj.report_id !== "string") {
    return { isValid: false, error: "Missing or invalid 'report_id'" };
  }

  if (!obj.reported_indicator || typeof obj.reported_indicator !== "string") {
    return { isValid: false, error: "Missing or invalid 'reported_indicator'" };
  }

  if (!obj.report_category || typeof obj.report_category !== "string") {
    return { isValid: false, error: "Missing or invalid 'report_category'" };
  }

  if (obj.description !== undefined && typeof obj.description !== "string") {
    return { isValid: false, error: "'description' must be a string" };
  }

  if (obj.evidence_references !== undefined) {
    if (!Array.isArray(obj.evidence_references) || obj.evidence_references.some(item => typeof item !== "string")) {
      return { isValid: false, error: "'evidence_references' must be an array of strings" };
    }
  }

  if (!obj.submission_timestamp || typeof obj.submission_timestamp !== "string" || !isValidIsoDate(obj.submission_timestamp)) {
    return { isValid: false, error: "Missing or invalid 'submission_timestamp' (must be ISO date-time string)" };
  }

  if (!obj.moderation_status || !["PENDING", "VERIFIED", "REJECTED"].includes(obj.moderation_status as string)) {
    return { isValid: false, error: "'moderation_status' must be PENDING, VERIFIED, or REJECTED" };
  }

  if (typeof obj.confidence !== "number" || obj.confidence < 0 || obj.confidence > 1.0) {
    return { isValid: false, error: "'confidence' must be a number between 0 and 1.0" };
  }

  if (!obj.provenance || typeof obj.provenance !== "string") {
    return { isValid: false, error: "Missing or invalid 'provenance'" };
  }

  return {
    isValid: true,
    data: obj as unknown as ScamReport
  };
}

export function validateScanResponse(res: ScanResponse): ValidationResult<ScanResponse> {
  if (!res.scan_id || typeof res.scan_id !== "string") {
    return { isValid: false, error: "Response missing 'scan_id'" };
  }

  if (!res.timestamp || !isValidIsoDate(res.timestamp)) {
    return { isValid: false, error: "Response missing valid 'timestamp'" };
  }

  // Risk Assessment
  const ra = res.risk_assessment;
  if (!ra || typeof ra !== "object") {
    return { isValid: false, error: "Response missing 'risk_assessment'" };
  }
  if (typeof ra.risk_score !== "number" || ra.risk_score < 0 || ra.risk_score > 100) {
    return { isValid: false, error: "'risk_score' must be an integer between 0 and 100" };
  }
  if (!VALID_RISK_SEVERITIES.includes(ra.risk_severity)) {
    return { isValid: false, error: "'risk_severity' is invalid" };
  }
  if (typeof ra.confidence !== "number" || ra.confidence < 0 || ra.confidence > 1.0) {
    return { isValid: false, error: "'confidence' must be between 0 and 1.0" };
  }
  if (!Array.isArray(ra.signals)) {
    return { isValid: false, error: "'signals' must be an array" };
  }
  if (typeof ra.human_explanation !== "string" || !ra.human_explanation) {
    return { isValid: false, error: "'human_explanation' must be a non-empty string" };
  }
  if (typeof ra.recommended_action !== "string" || !ra.recommended_action) {
    return { isValid: false, error: "'recommended_action' must be a non-empty string" };
  }

  // Protection Decision
  const pd = res.protection_decision;
  if (!pd || typeof pd !== "object") {
    return { isValid: false, error: "Response missing 'protection_decision'" };
  }
  if (!VALID_PROTECTION_ACTIONS.includes(pd.action)) {
    return { isValid: false, error: "'action' in protection_decision is invalid" };
  }
  if (typeof pd.detected_summary !== "string" || typeof pd.why_it_matters !== "string" || typeof pd.user_instruction !== "string") {
    return { isValid: false, error: "Fields in protection_decision must be strings" };
  }

  // Payment Intent Mismatch (optional)
  if (res.payment_intent_mismatch) {
    const pim = res.payment_intent_mismatch;
    if (!VALID_MISMATCH_STATUSES.includes(pim.status)) {
      return { isValid: false, error: "Invalid payment_intent_mismatch.status" };
    }
    if (!VALID_PAYMENT_DIRECTIONS.includes(pim.payment_direction)) {
      return { isValid: false, error: "Invalid payment_intent_mismatch.payment_direction" };
    }
  }

  // Scam Chain (optional)
  if (res.scam_chain) {
    const sc = res.scam_chain;
    if (!Array.isArray(sc.nodes) || !Array.isArray(sc.edges)) {
      return { isValid: false, error: "scam_chain must have nodes and edges arrays" };
    }
    for (const node of sc.nodes) {
      if (!node.node_id || !VALID_NODE_TYPES.includes(node.node_type)) {
        return { isValid: false, error: `Invalid node in scam_chain: ${JSON.stringify(node)}` };
      }
    }
    for (const edge of sc.edges) {
      if (!edge.from_node || !edge.to_node || !edge.relationship || typeof edge.confidence !== "number") {
        return { isValid: false, error: `Invalid edge in scam_chain: ${JSON.stringify(edge)}` };
      }
    }
  }

  // Evidence Pack (optional)
  if (res.evidence_pack) {
    const ep = res.evidence_pack;
    if (!ep.incident_id || !isValidIsoDate(ep.timestamp) || !Array.isArray(ep.items)) {
      return { isValid: false, error: "Invalid evidence_pack structure" };
    }
    for (const item of ep.items) {
      if (!item.evidence_id || !VALID_EVIDENCE_TYPES.includes(item.evidence_type) || typeof item.data !== "string") {
        return { isValid: false, error: `Invalid evidence item: ${JSON.stringify(item)}` };
      }
    }
  }

  return { isValid: true, data: res };
}
