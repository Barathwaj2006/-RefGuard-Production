import { ScamReport } from "../types/contracts.js";
import { ThreatIntelService } from "../threat-intelligence/threat-intel-service.js";

export class ReportService {
  private reports: Map<string, ScamReport> = new Map();
  private threatIntelService?: ThreatIntelService;

  constructor(threatIntelService?: ThreatIntelService) {
    this.threatIntelService = threatIntelService;
  }

  public setThreatIntelService(service: ThreatIntelService): void {
    this.threatIntelService = service;
  }

  public submitReport(report: ScamReport): { report_id: string; status: string } {
    this.reports.set(report.report_id, report);

    // If threat intelligence service is hooked, dynamically feed suspicious indicator into blacklist
    if (this.threatIntelService && report.reported_indicator) {
      const indicator = report.reported_indicator.trim();
      const desc = report.description ? `: ${report.description.substring(0, 100)}` : "";
      if (indicator.includes("@")) {
        this.threatIntelService.addThreatIndicator(
          "UPI_VPA",
          indicator,
          `Crowdsourced Community Report (${report.report_category})${desc}`,
          "MALICIOUS"
        );
      } else if (indicator.startsWith("http") || indicator.includes(".")) {
        this.threatIntelService.addThreatIndicator(
          "DOMAIN",
          indicator,
          `Crowdsourced Community Report (${report.report_category})${desc}`,
          "MALICIOUS"
        );
      }
    }

    return {
      report_id: report.report_id,
      status: "Report successfully submitted and queued for community moderation"
    };
  }

  public getReport(reportId: string): ScamReport | undefined {
    return this.reports.get(reportId);
  }

  public getAllReports(): ScamReport[] {
    return Array.from(this.reports.values());
  }

  public getStats(): { total_reports: number; malicious_indicators_count: number } {
    return {
      total_reports: this.reports.size,
      malicious_indicators_count: this.reports.size
    };
  }
}
