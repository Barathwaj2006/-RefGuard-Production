import {
  ScanRequest,
  RiskSeverity,
  ProtectionAction,
  MismatchStatus
} from "../src/types/contracts.js";

export type EvalCategory =
  | "LEGITIMATE"
  | "SCAM_PATTERN"
  | "PAYMENT_INTENT_MISMATCH"
  | "MULTI_HOP_CHAIN"
  | "PRIVACY_ATTACK"
  | "AMBIGUOUS_UNKNOWN"
  | "ADVERSARIAL";

export interface EvalScenario {
  id: string;
  category: EvalCategory;
  name: string;
  description: string;
  input: ScanRequest;
  expectedRiskSeverity: RiskSeverity | RiskSeverity[];
  expectedRiskRange: [number, number]; // [min, max]
  expectedPaymentIntentState?: MismatchStatus | MismatchStatus[];
  expectedProtectionAction: ProtectionAction | ProtectionAction[];
  expectedSignals?: string[];
  expectedNodeTypesInChain?: string[];
  sensitiveDataMustBeScrubbed?: boolean;
  unredactedSecretsToVerifyAbsent?: string[];
  minEvidenceItems?: number;
}

export interface EvalScenarioResult {
  id: string;
  category: EvalCategory;
  name: string;
  passed: boolean;
  actualRiskScore: number;
  actualRiskSeverity: RiskSeverity;
  actualPaymentIntentState?: MismatchStatus;
  actualProtectionAction: ProtectionAction;
  actualSignals: string[];
  privacyPassed: boolean;
  contractValid: boolean;
  failureReasons: string[];
  executionTimeMs: number;
}

export interface EvalReportSummary {
  timestamp: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRatePercentage: number;
  categoryBreakdown: Record<EvalCategory, { total: number; passed: number; passRate: number }>;
  privacyScrubbingPassRate: number;
  contractCompliancePassRate: number;
  averageExecutionTimeMs: number;
}
