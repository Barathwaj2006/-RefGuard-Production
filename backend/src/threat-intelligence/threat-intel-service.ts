import {
  ExtractionResult,
  ThreatAssessment,
  IndicatorType,
  ThreatClassification,
  ThreatSourceType
} from "../types/contracts.js";

export interface IThreatIntelligenceProvider {
  name: string;
  sourceType: ThreatSourceType;
  checkIndicator(type: IndicatorType, value: string): Promise<ThreatAssessment | null>;
}

/**
 * Local Rule and Curated Threat Intelligence Provider
 * Contains curated threat indicators for Indian UPI, banking, electricity, and viral scam vectors.
 */
export class LocalCuratedThreatProvider implements IThreatIntelligenceProvider {
  public name = "RefGuard-Curated-Threat-Feed";
  public sourceType: ThreatSourceType = "CURATED";

  // Known malicious VPAs
  private maliciousVpas = new Map<string, { reason: string; severity: ThreatClassification }>([
    ["scam-lottery@paytm", { reason: "Reported in multiple lottery scam complaints", severity: "MALICIOUS" }],
    ["electricity-bill-pay@ybl", { reason: "Impersonating state electricity distribution board", severity: "MALICIOUS" }],
    ["urgent-power-bill@okhdfcbank", { reason: "Urgent power disconnection impersonation fraud", severity: "MALICIOUS" }],
    ["refund-claim-desk@upi", { reason: "Fake customer care refund fraud handle", severity: "MALICIOUS" }],
    ["cashback-reward-claim@upi", { reason: "Known QR collect fraud handle", severity: "MALICIOUS" }],
    ["customercare-helpline@okaxis", { reason: "Search engine poisoning fake support handle", severity: "MALICIOUS" }],
    ["win-daily-bonus@paytm", { reason: "Viral referral scam deposit receiver", severity: "MALICIOUS" }]
  ]);

  // Known suspicious / phishing domains & URL patterns
  private maliciousDomains = new Map<string, { reason: string; severity: ThreatClassification }>([
    ["claim-reward-gpay.xyz", { reason: "Impersonation of Google Pay rewards", severity: "MALICIOUS" }],
    ["free-recharge-offer.top", { reason: "Viral WhatsApp recharge phishing lure", severity: "MALICIOUS" }],
    ["power-bill-update.online", { reason: "Fake electricity payment portal", severity: "MALICIOUS" }],
    ["sbi-kyc-verification.site", { reason: "Banking credential harvesting portal", severity: "MALICIOUS" }],
    ["telegram-earning-bot.cc", { reason: "Task-based part-time job investment scam", severity: "MALICIOUS" }],
    ["apk-download-secure.ru", { reason: "Malicious APK distributor dropper", severity: "MALICIOUS" }]
  ]);

  // Short link domains frequently used for obfuscation
  private shortLinkDomains = new Set([
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "t.me"
  ]);

  // Verified safe domains
  private safeDomains = new Set([
    "google.com", "pay.google.com", "phonepe.com", "paytm.com", "onlinesbi.sbi",
    "hdfcbank.com", "icicibank.com", "npci.org.in", "bhimupi.org.in", "amazon.in"
  ]);

  public addThreatIndicator(type: IndicatorType, value: string, reason: string, severity: ThreatClassification = "MALICIOUS"): void {
    const normalized = value.trim().toLowerCase();
    if (type === "UPI_VPA") {
      this.maliciousVpas.set(normalized, { reason, severity });
    } else if (type === "DOMAIN" || type === "URL") {
      this.maliciousDomains.set(normalized, { reason, severity });
    }
  }

  public async checkIndicator(type: IndicatorType, value: string): Promise<ThreatAssessment | null> {
    const normalizedVal = value.trim().toLowerCase();
    const now = new Date().toISOString();

    if (type === "UPI_VPA") {
      for (const [vpa, info] of this.maliciousVpas.entries()) {
        if (normalizedVal === vpa.toLowerCase() || normalizedVal.includes("scam") || normalizedVal.includes("fake")) {
          return {
            indicator_type: "UPI_VPA",
            indicator_value: value,
            classification: info.severity,
            confidence: 0.95,
            source: this.name,
            source_type: this.sourceType,
            freshness_timestamp: now,
            provenance: `CURATED_BLOCKLIST: ${info.reason}`
          };
        }
      }
    }

    if (type === "DOMAIN" || type === "URL") {
      // Check exact domain match
      let domain = normalizedVal;
      try {
        if (value.startsWith("http://") || value.startsWith("https://")) {
          domain = new URL(value).hostname.toLowerCase();
        }
      } catch {
        domain = normalizedVal;
      }

      if (this.safeDomains.has(domain)) {
        return {
          indicator_type: "DOMAIN",
          indicator_value: domain,
          classification: "SAFE",
          confidence: 0.99,
          source: this.name,
          source_type: this.sourceType,
          freshness_timestamp: now,
          provenance: "VERIFIED_OFFICIAL_DOMAIN"
        };
      }

      for (const [badDomain, info] of this.maliciousDomains.entries()) {
        if (domain === badDomain || domain.endsWith("." + badDomain)) {
          return {
            indicator_type: "DOMAIN",
            indicator_value: domain,
            classification: info.severity,
            confidence: 0.98,
            source: this.name,
            source_type: this.sourceType,
            freshness_timestamp: now,
            provenance: `THREAT_DATABASE: ${info.reason}`
          };
        }
      }

      // Check Typosquatting / Brand Lookalikes
      const brandLookalikes = [
        { brand: "amazon", patterns: [/amaz0n/i, /amazon-rewards/i, /amazon-offer/i, /amzn-gift/i] },
        { brand: "googlepay", patterns: [/gpay-rewards/i, /gpay-claim/i, /google-pay-gift/i] },
        { brand: "phonepe", patterns: [/phonepe-cashback/i, /phonepe-reward/i, /phonepe-kyc/i] },
        { brand: "paytm", patterns: [/paytm-bonus/i, /paytm-lottery/i, /paytm-refund/i] },
        { brand: "sbi", patterns: [/sbi-kyc/i, /sbi-card-block/i, /onlinesbi-update/i] },
        { brand: "hdfc", patterns: [/hdfc-netbanking-alert/i, /hdfc-reward/i] }
      ];

      for (const lookalike of brandLookalikes) {
        if (lookalike.patterns.some(p => p.test(domain))) {
          return {
            indicator_type: "DOMAIN",
            indicator_value: domain,
            classification: "MALICIOUS",
            confidence: 0.96,
            source: this.name,
            source_type: "LOCAL_RULE",
            freshness_timestamp: now,
            provenance: `LOOKALIKE_PHISHING: Deceptive brand impersonation targeting ${lookalike.brand}`
          };
        }
      }

      // Check suspicious TLD or short links
      const suspiciousTlds = [".xyz", ".top", ".site", ".online", ".cc", ".work", ".click", ".buzz"];
      if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
        return {
          indicator_type: "DOMAIN",
          indicator_value: domain,
          classification: "SUSPICIOUS",
          confidence: 0.8,
          source: this.name,
          source_type: "LOCAL_RULE",
          freshness_timestamp: now,
          provenance: "HEURISTIC: High-risk TLD commonly associated with throwaway phishing domains"
        };
      }

      if (this.shortLinkDomains.has(domain)) {
        return {
          indicator_type: "DOMAIN",
          indicator_value: domain,
          classification: "SUSPICIOUS",
          confidence: 0.75,
          source: this.name,
          source_type: "LOCAL_RULE",
          freshness_timestamp: now,
          provenance: "HEURISTIC: Obfuscated short URL masking actual destination"
        };
      }
    }

    if (type === "REFERRAL_CODE") {
      if (normalizedVal.includes("scam") || normalizedVal.includes("bot")) {
        return {
          indicator_type: "REFERRAL_CODE",
          indicator_value: value,
          classification: "SUSPICIOUS",
          confidence: 0.8,
          source: this.name,
          source_type: "LOCAL_RULE",
          freshness_timestamp: now,
          provenance: "HEURISTIC: Suspicious referral token pattern"
        };
      }
    }

    return null;
  }
}

export class ThreatIntelService {
  private providers: IThreatIntelligenceProvider[] = [];
  private curatedProvider: LocalCuratedThreatProvider;

  constructor() {
    this.curatedProvider = new LocalCuratedThreatProvider();
    this.providers.push(this.curatedProvider);
  }

  public registerProvider(provider: IThreatIntelligenceProvider): void {
    this.providers.push(provider);
  }

  public addThreatIndicator(type: IndicatorType, value: string, reason: string, severity: ThreatClassification = "MALICIOUS"): void {
    this.curatedProvider.addThreatIndicator(type, value, reason, severity);
  }

  public async evaluateExtraction(extraction: ExtractionResult): Promise<ThreatAssessment[]> {
    const assessments: ThreatAssessment[] = [];
    const checked = new Set<string>();

    for (const entity of [...extraction.extracted_entities, ...extraction.inferred_entities]) {
      let indicatorType: IndicatorType | null = null;
      let indicatorVal = entity.value || entity.raw_value;

      if (!indicatorVal) continue;

      if (entity.entity_type === "UPI_VPA") {
        indicatorType = "UPI_VPA";
      } else if (entity.entity_type === "DOMAIN") {
        indicatorType = "DOMAIN";
      } else if (entity.entity_type === "URL") {
        indicatorType = "URL";
      } else if (entity.entity_type === "PHONE") {
        indicatorType = "PHONE";
      } else if (entity.entity_type === "REFERRAL_CODE") {
        indicatorType = "REFERRAL_CODE";
      }

      if (indicatorType && !checked.has(`${indicatorType}:${indicatorVal}`)) {
        checked.add(`${indicatorType}:${indicatorVal}`);

        for (const provider of this.providers) {
          const assessment = await provider.checkIndicator(indicatorType, indicatorVal);
          if (assessment) {
            assessments.push(assessment);
            break; // First provider match
          }
        }
      }
    }

    return assessments;
  }
}
