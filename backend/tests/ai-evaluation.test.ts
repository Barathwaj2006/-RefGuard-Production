/**
 * RefGuard AI Intelligence Comprehensive Evaluation & Regression Suite
 * Executes all 58 deterministic evaluation scenarios across 7 core categories.
 */

import { EvalRunner } from "../evals/eval-runner.js";
import { EVALUATION_DATASET } from "../evals/dataset.js";

async function runEvaluationSuite() {
  console.log("============================================================");
  console.log("🎯 REFGUARD AI INTELLIGENCE COMPREHENSIVE EVALUATION HARNESS");
  console.log("============================================================");

  const runner = new EvalRunner();
  const startTime = Date.now();
  const { results, summary } = await runner.runAll(EVALUATION_DATASET);
  const totalDuration = Date.now() - startTime;

  let currentCategory = "";
  for (const res of results) {
    if (res.category !== currentCategory) {
      currentCategory = res.category;
      console.log(`\n[Category: ${currentCategory}]`);
    }

    if (res.passed) {
      console.log(
        `  ✓ PASS: ${res.id} - ${res.name} (Risk: ${res.actualRiskScore} [${res.actualRiskSeverity}], Action: ${res.actualProtectionAction}, ${res.executionTimeMs}ms)`
      );
    } else {
      console.error(
        `  ❌ FAIL: ${res.id} - ${res.name} (Risk: ${res.actualRiskScore} [${res.actualRiskSeverity}], Action: ${res.actualProtectionAction})`
      );
      for (const reason of res.failureReasons) {
        console.error(`     ↳ ${reason}`);
      }
    }
  }

  console.log("\n============================================================");
  console.log("📊 REFGUARD AI EVALUATION SUMMARY");
  console.log("============================================================");
  console.log(`Total Scenarios Evaluated : ${summary.totalScenarios}`);
  console.log(`Passed Scenarios          : ${summary.passedScenarios}`);
  console.log(`Failed Scenarios          : ${summary.failedScenarios}`);
  console.log(`Overall Pass Rate         : ${summary.passRatePercentage.toFixed(1)}%`);
  console.log(`Contract Compliance Rate  : ${summary.contractCompliancePassRate.toFixed(1)}%`);
  console.log(`Privacy Scrubbing Rate    : ${summary.privacyScrubbingPassRate.toFixed(1)}%`);
  console.log(`Avg Latency per Scan      : ${summary.averageExecutionTimeMs.toFixed(2)}ms`);
  console.log(`Total Evaluation Time     : ${totalDuration}ms`);

  console.log("\n📈 Category Breakdown:");
  for (const [cat, data] of Object.entries(summary.categoryBreakdown)) {
    console.log(`  - ${cat.padEnd(26)}: ${data.passed}/${data.total} passed (${data.passRate.toFixed(1)}%)`);
  }
  console.log("============================================================");

  if (summary.failedScenarios > 0) {
    console.error(`\n❌ AI EVALUATION FAILED: ${summary.failedScenarios} scenarios did not meet criteria.`);
    process.exit(1);
  } else {
    console.log("\n🎉 ALL 58 AI EVALUATION SCENARIOS PASSED WITH 100% ACCURACY & CONTRACT COMPLIANCE!");
  }
}

runEvaluationSuite().catch(err => {
  console.error("Evaluation runner encountered fatal error:", err);
  process.exit(1);
});
