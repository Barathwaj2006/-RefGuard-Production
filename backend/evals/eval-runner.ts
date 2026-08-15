import { ScanOrchestrator } from "../src/orchestrator/scan-orchestrator.js";
import { validateScanResponse } from "../src/validators/schema-validator.js";
import { EVALUATION_DATASET } from "./dataset.js";
import {
  EvalCategory,
  EvalScenario,
  EvalScenarioResult,
  EvalReportSummary
} from "./types.js";

export class EvalRunner {
  private orchestrator: ScanOrchestrator;

  constructor() {
    this.orchestrator = new ScanOrchestrator();
  }

  public async runScenario(scenario: EvalScenario): Promise<EvalScenarioResult> {
    const startTime = Date.now();
    const failureReasons: string[] = [];
    let privacyPassed = true;
    let contractValid = true;

    try {
      const response = await this.orchestrator.orchestrateScan(scenario.input);
      const executionTimeMs = Date.now() - startTime;

      // 1. Contract compliance validation
      const validation = validateScanResponse(response);
      if (!validation.isValid) {
        contractValid = false;
        failureReasons.push(`Contract schema validation failed: ${validation.error || "Unknown validation error"}`);
      }

      // 2. Risk severity check
      const actualSeverity = response.risk_assessment.risk_severity;
      const expectedSeverities = Array.isArray(scenario.expectedRiskSeverity)
        ? scenario.expectedRiskSeverity
        : [scenario.expectedRiskSeverity];
      if (!expectedSeverities.includes(actualSeverity)) {
        failureReasons.push(
          `Risk severity mismatch: expected one of [${expectedSeverities.join(", ")}], got '${actualSeverity}'`
        );
      }

      // 3. Risk score range check
      const actualScore = response.risk_assessment.risk_score;
      const [minScore, maxScore] = scenario.expectedRiskRange;
      if (actualScore < minScore || actualScore > maxScore) {
        failureReasons.push(
          `Risk score out of range: expected [${minScore}, ${maxScore}], got ${actualScore}`
        );
      }

      // 4. Payment intent mismatch state check
      const actualMismatchState = response.payment_intent_mismatch
        ? response.payment_intent_mismatch.status
        : "NOT_OBSERVED";
      if (scenario.expectedPaymentIntentState) {
        const expectedStates = Array.isArray(scenario.expectedPaymentIntentState)
          ? scenario.expectedPaymentIntentState
          : [scenario.expectedPaymentIntentState];
        if (!expectedStates.includes(actualMismatchState)) {
          failureReasons.push(
            `Payment intent status mismatch: expected one of [${expectedStates.join(", ")}], got '${actualMismatchState}'`
          );
        }
      }

      // 5. Protection decision action check
      const actualAction = response.protection_decision.action;
      const expectedActions = Array.isArray(scenario.expectedProtectionAction)
        ? scenario.expectedProtectionAction
        : [scenario.expectedProtectionAction];
      if (!expectedActions.includes(actualAction)) {
        failureReasons.push(
          `Protection action mismatch: expected one of [${expectedActions.join(", ")}], got '${actualAction}'`
        );
      }

      // 6. Expected signals check
      const actualSignals = response.risk_assessment.signals || [];
      if (scenario.expectedSignals) {
        for (const sig of scenario.expectedSignals) {
          if (!actualSignals.includes(sig)) {
            failureReasons.push(`Missing expected signal '${sig}' in [${actualSignals.join(", ")}]`);
          }
        }
      }

      // 7. Expected node types in ScamChain
      if (scenario.expectedNodeTypesInChain && response.scam_chain) {
        const chainNodeTypes = response.scam_chain.nodes.map(n => n.node_type);
        for (const requiredNodeType of scenario.expectedNodeTypesInChain) {
          if (!chainNodeTypes.includes(requiredNodeType as any)) {
            failureReasons.push(
              `ScamChain missing required node type '${requiredNodeType}' in [${chainNodeTypes.join(", ")}]`
            );
          }
        }
      }

      // 8. Minimum evidence count check
      if (scenario.minEvidenceItems && response.evidence_pack) {
        if (response.evidence_pack.items.length < scenario.minEvidenceItems) {
          failureReasons.push(
            `Insufficient evidence items: expected at least ${scenario.minEvidenceItems}, got ${response.evidence_pack.items.length}`
          );
        }
      }

      // 9. Privacy leak check
      if (scenario.sensitiveDataMustBeScrubbed && scenario.unredactedSecretsToVerifyAbsent) {
        const fullResponseJson = JSON.stringify(response);
        for (const secret of scenario.unredactedSecretsToVerifyAbsent) {
          if (fullResponseJson.includes(secret)) {
            privacyPassed = false;
            failureReasons.push(`PRIVACY LEAK DETECTED: Secret token '${secret}' found in ScanResponse JSON!`);
          }
        }
      }

      return {
        id: scenario.id,
        category: scenario.category,
        name: scenario.name,
        passed: failureReasons.length === 0,
        actualRiskScore: actualScore,
        actualRiskSeverity: actualSeverity,
        actualPaymentIntentState: actualMismatchState,
        actualProtectionAction: actualAction,
        actualSignals,
        privacyPassed,
        contractValid,
        failureReasons,
        executionTimeMs
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return {
        id: scenario.id,
        category: scenario.category,
        name: scenario.name,
        passed: false,
        actualRiskScore: -1,
        actualRiskSeverity: "LOW",
        actualProtectionAction: "ALLOW",
        actualSignals: [],
        privacyPassed: false,
        contractValid: false,
        failureReasons: [`Unhandled exception during execution: ${err.message || String(err)}`],
        executionTimeMs
      };
    }
  }

  public async runAll(scenarios: EvalScenario[] = EVALUATION_DATASET): Promise<{
    results: EvalScenarioResult[];
    summary: EvalReportSummary;
  }> {
    const results: EvalScenarioResult[] = [];

    for (const scenario of scenarios) {
      const res = await this.runScenario(scenario);
      results.push(res);
    }

    const categories: EvalCategory[] = [
      "LEGITIMATE",
      "SCAM_PATTERN",
      "PAYMENT_INTENT_MISMATCH",
      "MULTI_HOP_CHAIN",
      "PRIVACY_ATTACK",
      "AMBIGUOUS_UNKNOWN",
      "ADVERSARIAL"
    ];

    const categoryBreakdown: Record<EvalCategory, { total: number; passed: number; passRate: number }> = {} as any;

    for (const cat of categories) {
      const catResults = results.filter(r => r.category === cat);
      const passed = catResults.filter(r => r.passed).length;
      categoryBreakdown[cat] = {
        total: catResults.length,
        passed,
        passRate: catResults.length > 0 ? (passed / catResults.length) * 100 : 100
      };
    }

    const totalScenarios = results.length;
    const passedScenarios = results.filter(r => r.passed).length;
    const privacyPassedCount = results.filter(r => r.privacyPassed).length;
    const contractValidCount = results.filter(r => r.contractValid).length;
    const totalExecTime = results.reduce((acc, r) => acc + r.executionTimeMs, 0);

    const summary: EvalReportSummary = {
      timestamp: new Date().toISOString(),
      totalScenarios,
      passedScenarios,
      failedScenarios: totalScenarios - passedScenarios,
      passRatePercentage: totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0,
      categoryBreakdown,
      privacyScrubbingPassRate: totalScenarios > 0 ? (privacyPassedCount / totalScenarios) * 100 : 100,
      contractCompliancePassRate: totalScenarios > 0 ? (contractValidCount / totalScenarios) * 100 : 100,
      averageExecutionTimeMs: totalScenarios > 0 ? totalExecTime / totalScenarios : 0
    };

    return { results, summary };
  }
}
