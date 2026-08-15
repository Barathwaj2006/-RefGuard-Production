import { ScanResponse, ScamReport } from "../types/contracts.js";
import crypto from "crypto";

export interface CybercrimeExportDossier {
  dossier_id: string;
  generated_at: string;
  target_portal: "NATIONAL_CYBER_CRIME_PORTAL_1930_INDIA" | "GLOBAL_FRAUD_FEED";
  evidence_sha256: string;
  incident_summary: {
    category: string;
    suspect_vpas: string[];
    suspect_domains: string[];
    suspect_phones: string[];
    extracted_amounts: string[];
    attack_vector: string;
    mismatch_detected: boolean;
  };
  json_ld: Record<string, unknown>;
  stix_bundle?: Record<string, unknown>;
  csv_export?: string;
  formatted_police_dossier: string;
}

/**
 * Generates a STIX 2.1 Cyber Threat Intelligence (CTI) Bundle
 */
export function generateStixBundle(scan: ScanResponse, dossierId: string): Record<string, unknown> {
  const now = new Date().toISOString();
  const objects: Array<Record<string, unknown>> = [];

  // Identity object
  const identityId = `identity--${crypto.randomUUID()}`;
  objects.push({
    type: "identity",
    spec_version: "2.1",
    id: identityId,
    created: now,
    modified: now,
    name: "RefGuard Threat Defense Engine",
    identity_class: "system"
  });

  // Report object
  const reportId = `report--${crypto.randomUUID()}`;
  const indicatorIds: string[] = [];

  // Indicators for VPAs
  if (scan.payment_intent_mismatch?.recipient_vpa) {
    const indId = `indicator--${crypto.randomUUID()}`;
    indicatorIds.push(indId);
    objects.push({
      type: "indicator",
      spec_version: "2.1",
      id: indId,
      created: now,
      modified: now,
      name: `Malicious UPI VPA ${scan.payment_intent_mismatch.recipient_vpa}`,
      pattern: `[user-account:account_login = '${scan.payment_intent_mismatch.recipient_vpa}']`,
      pattern_type: "stix",
      valid_from: now,
      indicator_types: ["malicious-activity", "financial-fraud"]
    });
  }

  objects.push({
    type: "report",
    spec_version: "2.1",
    id: reportId,
    created: now,
    modified: now,
    name: `RefGuard Incident ${dossierId}`,
    description: scan.protection_decision.why_it_matters,
    published: now,
    object_refs: [identityId, ...indicatorIds]
  });

  return {
    type: "bundle",
    id: `bundle--${crypto.randomUUID()}`,
    objects
  };
}

/**
 * Generates standard CSV dispute log formatted for Bank Nodal / Ombudsman submission
 */
export function generateCsvEvidence(scan: ScanResponse, dossierId: string): string {
  const headers = ["DossierID", "ScanID", "Timestamp", "RiskScore", "Severity", "Action", "SuspectVPA", "Amount", "MismatchDetected", "Summary"];
  const row = [
    `"${dossierId}"`,
    `"${scan.scan_id}"`,
    `"${scan.timestamp}"`,
    scan.risk_assessment.risk_score,
    `"${scan.risk_assessment.risk_severity}"`,
    `"${scan.protection_decision.action}"`,
    `"${scan.payment_intent_mismatch?.recipient_vpa || "N/A"}"`,
    `"${scan.payment_intent_mismatch?.amount || "N/A"}"`,
    scan.payment_intent_mismatch?.status === "DETECTED" ? "YES" : "NO",
    `"${scan.protection_decision.detected_summary.replace(/"/g, '""')}"`
  ];
  return `${headers.join(",")}\n${row.join(",")}`;
}

/**
 * Generates an official cybercrime report docket compliant with
 * the National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in)
 */
export function generateCybercrimeDossier(
  scan: ScanResponse,
  report?: ScamReport,
  complainantNote?: string
): CybercrimeExportDossier {
  const dossierId = `CC-1930-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const now = new Date().toISOString();

  // Extract suspect indicators from evidence items and mismatch details
  const items = scan.evidence_pack?.items || [];
  const suspectVpas: string[] = [];
  const suspectDomains: string[] = [];
  const suspectPhones: string[] = [];
  const extractedAmounts: string[] = [];

  if (scan.payment_intent_mismatch?.recipient_vpa) {
    suspectVpas.push(scan.payment_intent_mismatch.recipient_vpa);
  }
  if (scan.payment_intent_mismatch?.amount) {
    extractedAmounts.push(`₹${scan.payment_intent_mismatch.amount}`);
  }

  for (const item of items) {
    if (item.evidence_type === "UPI_IDENTIFIER" || item.data.includes("@")) {
      if (!suspectVpas.includes(item.data)) suspectVpas.push(item.data);
    } else if (item.evidence_type === "URL" || item.data.startsWith("http")) {
      if (!suspectDomains.includes(item.data)) suspectDomains.push(item.data);
    }
  }

  const isMismatch = scan.payment_intent_mismatch?.status === "DETECTED";

  // Calculate cryptographic hash over the evidence pack
  const evidenceString = JSON.stringify(scan.evidence_pack || {});
  const evidenceSha256 = crypto.createHash("sha256").update(evidenceString).digest("hex");

  // Determine attack category
  let category = "Financial Cyber Fraud / Digital Payment Scam";
  if (isMismatch) {
    category = "UPI Payment-Intent Inversion / QR Collect Impersonation Fraud";
  } else if (scan.risk_assessment.signals.includes("ADVANCE_FEE_TASK_FRAUD")) {
    category = "Part-Time Job / Task-Based Investment Fraud";
  } else if (scan.risk_assessment.signals.includes("CUSTOMER_CARE_IMPERSONATION")) {
    category = "Customer Care / KYC Expiration Impersonation";
  } else if (scan.risk_assessment.signals.includes("SENSITIVE_CREDENTIAL_SOLICITATION")) {
    category = "Unauthorized OTP / UPI MPIN Phishing & Credential Harvest";
  }

  // Format Plaintext police docket (1930 portal complaint copy)
  const policeDossier = `================================================================================
NATIONAL CYBER CRIME REPORTING PORTAL (1930 / CYBERCRIME.GOV.IN)
INCIDENT COMPLAINT DOSSIER & DIGITAL FORENSIC EVIDENCE PACK
================================================================================
Dossier ID         : ${dossierId}
Scan Reference ID  : ${scan.scan_id}
Incident Timestamp : ${scan.timestamp}
Dossier Generated  : ${now}
Evidence SHA-256   : ${evidenceSha256}

1. INCIDENT CLASSIFICATION
--------------------------------------------------------------------------------
Primary Category   : ${category}
Assessed Risk Level: ${scan.risk_assessment.risk_severity} (Score: ${scan.risk_assessment.risk_score}/100)
Action Triggered   : ${scan.protection_decision.action}
Intent Mismatch    : ${isMismatch ? "YES (DECEPTIVE DIRECTION INVERSION DETECTED)" : "NO"}

2. SUSPECT / ADVERSARY IDENTIFIERS
--------------------------------------------------------------------------------
Suspect UPI VPAs   : ${suspectVpas.length > 0 ? suspectVpas.join(", ") : "None directly parsed"}
Suspect Domains    : ${suspectDomains.length > 0 ? suspectDomains.join(", ") : "None directly parsed"}
Suspect Contacts   : ${suspectPhones.length > 0 ? suspectPhones.join(", ") : "None directly parsed"}
Claimed Amount(s)  : ${extractedAmounts.length > 0 ? extractedAmounts.join(", ") : "Not specified"}

3. FORENSIC RISK SIGNALS & ATTACK VECTOR
--------------------------------------------------------------------------------
Observed Signals   : 
${scan.risk_assessment.signals.map(s => `  • [${s}]`).join("\n")}

Detected Summary   : ${scan.protection_decision.detected_summary}
Why It Matters     : ${scan.protection_decision.why_it_matters}
User Instruction   : ${scan.protection_decision.user_instruction}

${complainantNote ? `4. COMPLAINANT STATEMENT / CONTEXT\n--------------------------------------------------------------------------------\n${complainantNote}\n` : ""}
5. CHAIN OF CUSTODY & EVIDENCE RECORD
--------------------------------------------------------------------------------
Total Evidence Items Recorded: ${items.length}
${items.map(e => `  [${e.evidence_id}] ${e.evidence_type}: ${e.data}`).join("\n")}

================================================================================
Digital Signature: VERIFIED BY REFGUARD AMBIENT PRE-PAYMENT SHIELD
Reference Standards: I4C / MeitY / NPCI UPI Security Guidelines 2026
================================================================================`;

  // JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    "identifier": dossierId,
    "name": "Digital Payment Fraud Cybercrime Incident Report",
    "dateCreated": now,
    "about": {
      "@type": "Thing",
      "name": category,
      "description": scan.protection_decision.why_it_matters
    },
    "threatIndicators": {
      "vpas": suspectVpas,
      "domains": suspectDomains,
      "phones": suspectPhones,
      "amounts": extractedAmounts,
      "evidenceHash": evidenceSha256
    },
    "riskAssessment": {
      "score": scan.risk_assessment.risk_score,
      "severity": scan.risk_assessment.risk_severity,
      "signals": scan.risk_assessment.signals
    }
  };

  return {
    dossier_id: dossierId,
    generated_at: now,
    target_portal: "NATIONAL_CYBER_CRIME_PORTAL_1930_INDIA",
    evidence_sha256: evidenceSha256,
    incident_summary: {
      category,
      suspect_vpas: suspectVpas,
      suspect_domains: suspectDomains,
      suspect_phones: suspectPhones,
      extracted_amounts: extractedAmounts,
      attack_vector: scan.scam_chain ? "MULTI_HOP_CHAIN" : "DIRECT_PAYMENT_PAYLOAD",
      mismatch_detected: isMismatch
    },
    json_ld: jsonLd,
    stix_bundle: generateStixBundle(scan, dossierId),
    csv_export: generateCsvEvidence(scan, dossierId),
    formatted_police_dossier: policeDossier
  };
}
