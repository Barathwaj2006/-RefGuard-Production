import React, { useState } from 'react';
import { 
  QrCode, 
  ArrowRight, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  Zap,
  Lock
} from 'lucide-react';
import { ScanResponse } from '../types';

interface QRIntelligenceInspectorProps {
  onRunScan?: (payload: string, statedIntent?: string) => void;
  onLaunchInvestigationInStudio?: (payload: string, statedIntent: string, result: ScanResponse) => void;
}

const QR_PRESETS = [
  {
    title: "Fake ₹5,000 Reward Scratch Card (Inversion Trap)",
    statedIntent: "Receive ₹5,000 cashback reward",
    qrPayload: "upi://pay?pa=cashback.rewards99@okaxis&pn=PhonePe%20Rewards&am=5000&cu=INR&tn=Reward%20Refund%20Claim"
  },
  {
    title: "Electricity Disconnection Reconnection QR",
    statedIntent: "Clear pending power bill fee",
    qrPayload: "upi://pay?pa=powerbill.recovery@okhdfcbank&pn=State%20Electricity%20Board&am=10&cu=INR&tn=Immediate%20Reconnection%20Update"
  },
  {
    title: "Legitimate Supermarket Merchant Payment",
    statedIntent: "Pay ₹450 for grocery purchase",
    qrPayload: "upi://pay?pa=reliance.retail@icici&pn=Reliance%20Retail%20Ltd&am=450&cu=INR&tn=Store%20Checkout"
  },
  {
    title: "Quishing Dropper Link (Malicious APK)",
    statedIntent: "Download banking KYC update tool",
    qrPayload: "https://secure-banking-portal.xyz/download/sbi_kyc_update.apk"
  }
];

export function QRIntelligenceInspector({ onRunScan, onLaunchInvestigationInStudio }: QRIntelligenceInspectorProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [userIntent, setUserIntent] = useState(QR_PRESETS[0].statedIntent);
  const [qrRawPayload, setQrRawPayload] = useState(QR_PRESETS[0].qrPayload);
  const [analysisResult, setAnalysisResult] = useState<ScanResponse | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Parse UPI parameters locally for immediate preview
  const parseUPI = (uri: string) => {
    try {
      if (!uri.startsWith('upi://')) return null;
      const url = new URL(uri);
      return {
        vpa: url.searchParams.get('pa') || 'N/A',
        merchantName: decodeURIComponent(url.searchParams.get('pn') || 'N/A'),
        amount: url.searchParams.get('am') || '0',
        currency: url.searchParams.get('cu') || 'INR',
        transactionNote: decodeURIComponent(url.searchParams.get('tn') || 'N/A')
      };
    } catch {
      return null;
    }
  };

  const parsed = parseUPI(qrRawPayload);
  const isInboundClaim = /receive|cashback|refund|claim|get|win/i.test(userIntent);
  const isOutboundPayment = parsed !== null && parseFloat(parsed.amount) > 0;
  const isInversion = isInboundClaim && isOutboundPayment;

  const handleInspect = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'qr_scanner',
          stated_intent: userIntent,
          content: qrRawPayload
        })
      });

      if (!res.ok) throw new Error(`Scan failed with HTTP ${res.status}`);
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("QR scan error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Advanced QR Intelligence &amp; Quishing Decoder</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Direction Inversion Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dissects embedded UPI intent links, detects disguised debit requests, and unmasks optical phishing (Quishing) vectors.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400">Presets:</span>
            {QR_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedPreset(idx);
                  setUserIntent(p.statedIntent);
                  setQrRawPayload(p.qrPayload);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedPreset === idx 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {p.title.split(' ')[0]} {p.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              1. User Stated Expectation / Intent
            </label>
            <input
              type="text"
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="e.g. Receive ₹5,000 reward cashback"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              2. Technical QR Raw Payload (UPI URI / URL)
            </label>
            <input
              type="text"
              value={qrRawPayload}
              onChange={(e) => setQrRawPayload(e.target.value)}
              placeholder="upi://pay?pa=... or https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleInspect}
            disabled={isScanning || !qrRawPayload.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running QR Intelligence Scan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Deep QR &amp; Direction Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Intent Inversion Comparison Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <TrendingUp className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Payment-Intent Inversion Visualizer
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* User Stated Intent */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
              1. WHAT USER WAS PROMISED (INTENT)
            </span>
            <div className="text-base font-bold text-white">
              "{userIntent || 'Claim reward / refund'}"
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Expected Direction: <strong>INBOUND CREDIT (RECEIVE MONEY)</strong></span>
            </div>
          </div>

          {/* Actual Technical Payload */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isInversion ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-200'
          }`}>
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
              2. ACTUAL TECHNICAL PAYLOAD (EXECUTION)
            </span>
            <div className="text-base font-bold text-white font-mono">
              {parsed ? `Pay ₹${parsed.amount} to ${parsed.vpa}` : qrRawPayload}
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>Actual Direction: <strong>OUTBOUND DEBIT (SEND MONEY)</strong></span>
            </div>
          </div>
        </div>

        {/* Inversion Verdict Banner */}
        {isInversion && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-700 flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold text-red-200">
                CRITICAL PAYMENT-INTENT INVERSION DETECTED!
              </h4>
              <p className="text-xs text-red-300/90 mt-1 leading-relaxed">
                The victim is led to believe they are receiving funds, but approving this QR or entering their UPI PIN will instantly debit <strong>₹{parsed?.amount || '5,000'}</strong> from their personal bank account.
              </p>
            </div>
          </div>
        )}

        {/* Parsed Technical Telemetry */}
        {parsed && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Decoded UPI Intent Parameters</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Recipient VPA:</span>
                <span className="text-indigo-300 font-bold">{parsed.vpa}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Merchant Name:</span>
                <span className="text-slate-300">{parsed.merchantName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transaction Amount:</span>
                <span className="text-emerald-400 font-bold">₹{parsed.amount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transaction Note:</span>
                <span className="text-slate-300">{parsed.transactionNote}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backend Scan Result Summary if run */}
      {analysisResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Live RefGuard Scan Pipeline Verdict</h3>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              Risk: {analysisResult.risk_assessment.risk_score}/100 ({analysisResult.risk_assessment.risk_severity})
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {analysisResult.protection_decision.detected_summary}
          </p>

          <div className="flex items-center justify-between pt-2 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">Recommended Action:</span>
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                {analysisResult.protection_decision.action}
              </span>
            </div>
            {onLaunchInvestigationInStudio && (
              <button
                onClick={() => onLaunchInvestigationInStudio(qrRawPayload, userIntent, analysisResult)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Full Investigation in Studio</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
