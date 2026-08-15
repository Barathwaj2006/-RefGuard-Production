import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  FileDown, 
  Share2, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertOctagon,
  Copy,
  ExternalLink,
  Ban
} from 'lucide-react';
import { ScanResponse } from '../types';

interface EmergencyActionCenterProps {
  scanResult: ScanResponse;
  onOpen1930Modal: () => void;
  onResetScan: () => void;
}

export function EmergencyActionCenter({ scanResult, onOpen1930Modal, onResetScan }: EmergencyActionCenterProps) {
  const [showStopPaymentModal, setShowStopPaymentModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isHighRisk = scanResult.risk_assessment.risk_score >= 50;
  const isCritical = scanResult.risk_assessment.risk_severity === 'CRITICAL';
  const vpas = scanResult.extraction_result?.upi_vpas || [];
  const amount = scanResult.extraction_result?.amounts?.[0] || 'Unspecified';

  // Handle downloading evidence pack JSON
  const handleDownloadEvidence = () => {
    const evidenceData = {
      refguard_verification_version: "v1.0.4",
      scan_id: scanResult.scan_id,
      timestamp: scanResult.timestamp,
      risk_score: scanResult.risk_assessment.risk_score,
      risk_severity: scanResult.risk_assessment.risk_severity,
      evidence_hash: scanResult.evidence_pack?.digital_signature || "SHA256_VERIFIED",
      protection_decision: scanResult.protection_decision,
      extracted_entities: scanResult.extraction_result,
      payment_intent_mismatch: scanResult.payment_intent_mismatch,
      audit_evidence_items: scanResult.evidence_pack?.items || []
    };

    const blob = new Blob([JSON.stringify(evidenceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refguard-evidence-${scanResult.scan_id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Generate shareable warning card text
  const handleShareWarning = () => {
    const warningText = `🚨 *REFGUARD FRAUD ALERT* 🚨\n\n` +
      `⚠️ *Risk:* ${scanResult.risk_assessment.risk_severity} (Score: ${scanResult.risk_assessment.risk_score}/100)\n` +
      `📌 *Threat:* ${scanResult.protection_decision.detected_summary}\n` +
      (vpas.length > 0 ? `🚫 *Flagged UPI ID:* ${vpas.join(', ')}\n` : '') +
      `🔒 *Crucial Rule:* UPI PIN is NEVER required to receive money or refunds!\n\n` +
      `Verified by RefGuard Pre-Payment AI Shield.`;

    navigator.clipboard.writeText(warningText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className={`rounded-2xl p-6 border shadow-xl transition-all ${
      isCritical 
        ? 'bg-red-950/40 border-red-800/80 shadow-red-950/20' 
        : isHighRisk 
        ? 'bg-orange-950/30 border-orange-800/70 shadow-orange-950/10'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isCritical ? 'bg-red-900/80 text-red-200 animate-pulse' : 'bg-indigo-600/20 text-indigo-400'
          }`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Emergency Action Center &amp; Evidence Control
              {isCritical && (
                <span className="px-2 py-0.5 text-[10px] font-mono bg-red-900 text-red-200 rounded-full border border-red-700">
                  CRITICAL DEFENSE ACTIVE
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Immediate countermeasures, incident response, and I4C evidence preservation
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {/* 1. STOP PAYMENT */}
        <button
          onClick={() => setShowStopPaymentModal(true)}
          className="p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer"
        >
          <Ban className="w-4 h-4" />
          <span>STOP PAYMENT</span>
        </button>

        {/* 2. CREATE 1930 REPORT */}
        <button
          onClick={onOpen1930Modal}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>1930 REPORT</span>
        </button>

        {/* 3. SAVE EVIDENCE */}
        <button
          onClick={handleDownloadEvidence}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
        >
          {downloadSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <FileDown className="w-4 h-4 text-indigo-400" />}
          <span>{downloadSuccess ? 'EVIDENCE SAVED' : 'SAVE EVIDENCE'}</span>
        </button>

        {/* 4. SHARE WARNING */}
        <button
          onClick={handleShareWarning}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
        >
          {copiedShare ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
          <span>{copiedShare ? 'COPIED CARD!' : 'SHARE WARNING'}</span>
        </button>

        {/* 5. NATIONAL CYBER PORTAL */}
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition-all text-center"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" />
          <span>CYBERCRIME.GOV</span>
        </a>

        {/* 6. ANALYZE AGAIN */}
        <button
          onClick={onResetScan}
          className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <span>ANALYZE AGAIN</span>
        </button>
      </div>

      {/* Stop Payment Protocol Modal */}
      {showStopPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-600/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-800">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Emergency Stop Payment Protocol</h4>
                  <span className="text-xs text-red-300">Follow these immediate steps to safeguard your funds</span>
                </div>
              </div>
              <button 
                onClick={() => setShowStopPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/60 flex items-start gap-3">
                <span className="font-mono font-bold text-red-400 text-sm">1.</span>
                <div>
                  <strong className="text-red-200">DO NOT ENTER YOUR UPI PIN</strong>
                  <p className="text-slate-400 mt-0.5">Cancel any pending prompt inside Google Pay, PhonePe, or Paytm.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="font-mono font-bold text-indigo-400 text-sm">2.</span>
                <div>
                  <strong className="text-slate-200">Freeze UPI / Change MPIN</strong>
                  <p className="text-slate-400 mt-0.5">If you suspect your PIN was compromised, reset your UPI PIN immediately inside your banking app.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="font-mono font-bold text-amber-400 text-sm">3.</span>
                <div>
                  <strong className="text-slate-200">Call National Helpline 1930</strong>
                  <p className="text-slate-400 mt-0.5">Dial 1930 immediately to freeze transactions in transit across the Indian Cybercrime Financial Fraud Reporting System (CFCFRMS).</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowStopPaymentModal(false);
                  onOpen1930Modal();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Launch 1930 Export
              </button>
              <button
                onClick={() => setShowStopPaymentModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
