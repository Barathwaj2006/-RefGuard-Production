import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  Lock, 
  Eye, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronRight, 
  Zap, 
  Layers, 
  ShieldOff,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { ScanResponse, ProtectionAction, RiskSeverity } from '../types';

interface AmbientProtectionInterventionProps {
  scanResult: ScanResponse;
  onStopPayment: () => void;
  onVerifyIndependently: () => void;
  onAskRefGuard: (question: string) => void;
  onProceedAnyway?: () => void;
}

export function AmbientProtectionIntervention({
  scanResult,
  onStopPayment,
  onVerifyIndependently,
  onAskRefGuard,
  onProceedAnyway
}: AmbientProtectionInterventionProps) {
  // Proactive pre-flight confirmation check states
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    check_recipient: false,
    check_amount: false,
    check_direction: false,
    check_no_urgency: false,
    check_no_otp: true,
    check_no_redirection: false
  });

  const [sessionDecision, setSessionDecision] = useState<'IDLE' | 'STOPPED' | 'VERIFYING' | 'OVERRIDDEN'>('IDLE');
  const [showOtpWhyModal, setShowOtpWhyModal] = useState(false);
  const [acknowledgedOtp, setAcknowledgedOtp] = useState(false);
  const [acknowledgedUrgency, setAcknowledgedUrgency] = useState(false);

  const riskScore = scanResult.risk_assessment.risk_score;
  const severity = scanResult.risk_assessment.risk_severity;
  const isCritical = severity === 'CRITICAL' || riskScore >= 75;
  const isHighRisk = severity === 'HIGH' || riskScore >= 50;

  const vpas = scanResult.extraction_result?.upi_vpas || [];
  const amounts = scanResult.extraction_result?.amounts || [];
  const urls = scanResult.extraction_result?.urls || [];
  const phones = scanResult.extraction_result?.phone_numbers || [];
  const recipientVpa = vpas[0] || 'Unverified Personal Handle';
  const amountStr = amounts.length > 0 ? `₹${amounts[0].toLocaleString('en-IN')}` : 'Variable / Unspecified';

  const intentMismatch = scanResult.payment_intent_mismatch;
  const hasMismatch = intentMismatch && intentMismatch.status !== 'NOT_OBSERVED' && intentMismatch.status !== 'NOT_DETECTED';

  // Check for specific threat vectors
  const rawSnippet = (scanResult.evidence_pack?.items?.find(i => i.evidence_type === 'PAYLOAD_SNIPPET')?.data || '').toLowerCase();
  const signals = scanResult.risk_assessment.signals.map(s => typeof s === 'string' ? s : s.signal_name);

  const hasOtpThreat = rawSnippet.includes('otp') || rawSnippet.includes('mpin') || rawSnippet.includes('pin') || signals.some(s => s.includes('OTP') || s.includes('PRIVACY'));
  const hasUrgency = rawSnippet.includes('electricity') || rawSnippet.includes('disconnect') || rawSnippet.includes('urgent') || rawSnippet.includes('blocked') || rawSnippet.includes('suspended') || rawSnippet.includes('24 hours') || signals.some(s => s.includes('URGENCY') || s.includes('PANIC'));
  const hasTrustBoundaryShift = rawSnippet.includes('telegram') || rawSnippet.includes('apk') || rawSnippet.includes('download') || rawSnippet.includes('whatsapp') || rawSnippet.includes('kyc') || urls.length > 0;

  // Stated vs Actual analysis
  const statedAction = typeof intentMismatch?.stated_intent === 'object' && intentMismatch?.stated_intent
    ? intentMismatch.stated_intent.action
    : (scanResult.evidence_pack?.items?.find(i => i.evidence_type === 'PAYLOAD_SNIPPET')?.data || 'Claim cashback / reward / settlement');

  const actualAction = intentMismatch?.payment_direction === 'OUTBOUND_DEBIT'
    ? `Outbound payment transfer of ${amountStr} to ${recipientVpa}`
    : `UPI transaction execution request (${amountStr})`;

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksPassed = Object.values(checklist).every(Boolean);

  const handleStop = () => {
    setSessionDecision('STOPPED');
    onStopPayment();
  };

  const handleVerify = () => {
    setSessionDecision('VERIFYING');
    onVerifyIndependently();
  };

  const handleOverride = () => {
    setSessionDecision('OVERRIDDEN');
    if (onProceedAnyway) onProceedAnyway();
  };

  return (
    <div className="space-y-6" id="section-proactive-protection">
      {/* 1. AMBIENT PROTECTION HEADER STATUS */}
      <div className={`p-6 rounded-3xl border shadow-2xl transition-all ${
        isCritical 
          ? 'bg-red-950/40 border-red-700/80 shadow-red-950/30' 
          : isHighRisk 
          ? 'bg-orange-950/30 border-orange-700/70 shadow-orange-950/20'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isCritical ? 'bg-red-900/80 text-red-200 animate-pulse' : 'bg-indigo-600/20 text-indigo-400'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-100">
                  RefGuard Proactive Pre-Action Intervention
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  isCritical ? 'bg-red-950 text-red-300 border-red-700' : 'bg-orange-950 text-orange-300 border-orange-700'
                }`}>
                  {severity} — SCORE {riskScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                RefGuard intercepted this action BEFORE financial authorization occurred.
              </p>
            </div>
          </div>

          {/* Session Outcome Tag */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Protection Session:</span>
            <span className={`text-xs font-mono px-3 py-1 rounded-xl font-bold border ${
              sessionDecision === 'STOPPED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
              sessionDecision === 'VERIFYING' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
              sessionDecision === 'OVERRIDDEN' ? 'bg-amber-950 text-amber-300 border-amber-800' :
              'bg-slate-950 text-slate-300 border-slate-800'
            }`}>
              {sessionDecision === 'IDLE' ? 'INTERVENTION ACTIVE' : sessionDecision}
            </span>
          </div>
        </div>

        {/* 2. DIRECTION INVERSION CRITICAL STOP BANNER (If Mismatch Detected) */}
        {hasMismatch && (
          <div className="mt-5 p-5 rounded-2xl bg-red-950/70 border border-red-600 text-slate-100 space-y-4 animate-fade-in shadow-xl">
            <div className="flex items-center gap-2 text-red-300 text-xs font-bold font-mono uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>CRITICAL DIRECTION MISMATCH INTERCEPTED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-red-900/60 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">What you were told (User Intent):</span>
                <p className="font-semibold text-emerald-400 text-sm">
                  "{statedAction}"
                </p>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Expected direction: <strong className="text-slate-200">INBOUND CREDIT (Receive Funds)</strong>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-red-600/80 space-y-1">
                <span className="text-[10px] font-mono uppercase text-red-400 block font-bold">What the technical payload actually executes:</span>
                <p className="font-semibold text-red-300 text-sm">
                  "{actualAction}"
                </p>
                <span className="text-[11px] text-red-400 block mt-1 font-bold">
                  Actual execution: <strong className="text-red-200">OUTBOUND DEBIT (Money leaves your account)</strong>
                </span>
              </div>
            </div>

            <div className="p-3 bg-red-900/40 rounded-xl border border-red-800/80 text-xs text-red-200 flex items-center gap-2.5">
              <Ban className="w-5 h-5 text-red-400 shrink-0" />
              <span><strong>STOP IMMEDIATELY:</strong> Entering your 4 or 6-digit UPI PIN will transfer <strong>{amountStr}</strong> to the attacker. In India, UPI PIN is NEVER used to receive money!</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              <button
                onClick={handleStop}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>DO NOT PAY / CANCEL PROMPT</span>
              </button>

              <button
                onClick={handleVerify}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>VERIFY INDEPENDENTLY</span>
              </button>

              <button
                onClick={() => onAskRefGuard("Why does this payment request claim I will receive money but actually debits my bank account?")}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-indigo-300 font-semibold text-xs flex items-center gap-2 border border-slate-800 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>ASK REFGUARD WHY</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. "BEFORE YOU PAY" DEDICATED PRE-PAYMENT INTERVENTION */}
        <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">Before You Pay — Forensic Verification Card</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
              Pre-Flight Gateway
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Who are you paying?</span>
              <p className="font-mono font-bold text-indigo-300 break-all">{recipientVpa}</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">How much?</span>
              <p className="font-bold text-amber-300 text-sm">{amountStr}</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">What were you told?</span>
              <p className="font-medium text-slate-200 line-clamp-2">"{statedAction}"</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">What does request do?</span>
              <p className="font-medium text-rose-300 line-clamp-2">Debits {amountStr} from bank</p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={handleStop}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>DO NOT PAY</span>
              </button>

              <button
                onClick={handleVerify}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>VERIFY RECIPIENT INDEPENDENTLY</span>
              </button>
            </div>

            <button
              onClick={handleOverride}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Continue only if independently verified →
            </button>
          </div>
        </div>

        {/* 4. MULTI-SIGNAL COMBINED THREAT BREAKDOWN */}
        <div className="mt-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Combined Threat Intelligence Signals ({signals.length} Active Indicators)
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Multi-Vector Corroboration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {signals.map((sigName, idx) => {
              const isCrit = sigName.includes('INVERSION') || sigName.includes('OTP') || sigName.includes('HARVESTING') || sigName.includes('PHISHING');
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                    isCrit 
                      ? 'bg-red-950/30 border-red-900/60 text-red-200' 
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isCrit ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
                  <span className="font-mono text-[11px] truncate" title={sigName}>{sigName}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 pt-1 font-sans">
            These signals together strongly indicate that you should <strong>not proceed</strong> without independent verification through official banking channels.
          </p>
        </div>

        {/* 5. OTP / PIN PROTECTION PROACTIVE INTERVENTION (if OTP/PIN detected) */}
        {hasOtpThreat && (
          <div className="mt-5 p-5 rounded-2xl bg-rose-950/40 border border-rose-700 text-rose-100 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold font-mono uppercase tracking-wider">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>NEVER SHARE YOUR OTP / UPI PIN</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900 text-rose-200">
                CRITICAL PRIVACY RULE
              </span>
            </div>

            <p className="text-xs text-rose-200 leading-relaxed">
              Your 6-digit OTP or UPI MPIN is used strictly to <strong>authorize money leaving your account</strong> or grant access to your account. It is NEVER required to receive a prize, refund, or cashback.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setAcknowledgedOtp(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  acknowledgedOtp ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {acknowledgedOtp ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{acknowledgedOtp ? 'Rule Acknowledged: Will Not Share' : 'I Understand: Never Share OTP / PIN'}</span>
              </button>

              <button
                onClick={() => setShowOtpWhyModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
              >
                Why is OTP/PIN never needed to receive money?
              </button>
            </div>
          </div>
        )}

        {/* 6. URGENCY INTERRUPTER (if panic or urgency cues detected) */}
        {hasUrgency && (
          <div className="mt-5 p-5 rounded-2xl bg-amber-950/40 border border-amber-700/80 text-amber-100 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>TAKE A MOMENT — ARTIFICIAL URGENCY INTERRUPTER</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900 text-amber-200">
                PSYCHOLOGICAL HOOK
              </span>
            </div>

            <p className="text-xs text-amber-200 leading-relaxed">
              This message creates false urgency (e.g. <em>"Power disconnected tonight"</em> or <em>"Account blocked in 24 hours"</em>) to pressure you into acting before you can verify with your official bank or utility board.
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={handleVerify}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verify Through Official Website / App</span>
              </button>

              <button
                onClick={() => onAskRefGuard("How do electricity and bank scammers use urgent countdown timers to panic victims?")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
              >
                Analyze Panic Manipulation
              </button>
            </div>
          </div>
        )}

        {/* 7. TRUST BOUNDARY WARNING (if redirects to Telegram, APKs, or external links) */}
        {hasTrustBoundaryShift && (
          <div className="mt-5 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-700/80 text-indigo-100 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold font-mono uppercase tracking-wider">
                <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>THIS REQUEST CHANGES YOUR TRUST BOUNDARY</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900 text-indigo-200">
                EXTERNAL CHANNEL SHIFT
              </span>
            </div>

            <p className="text-xs text-indigo-200 leading-relaxed">
              You are being asked to leave secure, verified payment channels and move to an external environment (e.g., private Telegram channel, unknown shortlink {urls[0] ? `(${urls[0]})` : ''}, or unverified APK). Scammers shift channels to evade payment app fraud monitors.
            </p>
          </div>
        )}

        {/* 8. PRE-PAYMENT FINAL 6-POINT CONFIRMATION CHECKLIST */}
        <div className="mt-5 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Final Pre-Payment Safety Checklist
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {Object.values(checklist).filter(Boolean).length} / 6 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {[
              { key: 'check_recipient', label: '1. Recipient is personally verified by you', failWarn: recipientVpa.includes('cashback') || recipientVpa.includes('vip') },
              { key: 'check_amount', label: `2. Amount (${amountStr}) exactly matches expected bill`, failWarn: false },
              { key: 'check_direction', label: '3. Direction is explicitly to send, NOT claim refund', failWarn: hasMismatch },
              { key: 'check_no_urgency', label: '4. No artificial deadline / fear threat', failWarn: hasUrgency },
              { key: 'check_no_otp', label: '5. No OTP / UPI PIN requested over call/chat', failWarn: hasOtpThreat },
              { key: 'check_no_redirection', label: '6. No unknown QR / shortlink redirection', failWarn: urls.length > 0 }
            ].map(item => (
              <div
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                  checklist[item.key]
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-200'
                    : item.failWarn
                    ? 'bg-red-950/20 border-red-900/60 text-red-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-xs shrink-0 ${
                  checklist[item.key] ? 'bg-emerald-600 text-white' : 'border border-slate-700 bg-slate-950'
                }`}>
                  {checklist[item.key] && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <span className={`font-semibold block ${checklist[item.key] ? 'text-slate-100' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  {item.failWarn && !checklist[item.key] && (
                    <span className="text-[10px] text-red-400 font-mono block mt-0.5">⚠️ Flagged by RefGuard</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!allChecksPassed && (
            <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Pre-Flight Warning:</strong> Something about this payment does not match what you were told. Independent verification is strongly recommended.</span>
            </div>
          )}
        </div>
      </div>

      {/* WHY OTP IS NEVER NEEDED MODAL */}
      {showOtpWhyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">How Indian UPI &amp; OTP Banking Works</h4>
                  <span className="text-xs text-slate-400">Technical explanation of payment authorizations</span>
                </div>
              </div>
              <button 
                onClick={() => setShowOtpWhyModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-slate-100 block mb-1">1. Receiving Money requires ZERO authorization</strong>
                <p className="text-slate-400">
                  When someone genuinely sends money to your UPI ID or bank account, the funds are credited directly by NPCI. You do not need to scan a QR code, accept a collect prompt, or type your PIN.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-slate-100 block mb-1">2. UPI PIN is exclusively a Debit Signature</strong>
                <p className="text-slate-400">
                  The moment you type your 4 or 6-digit MPIN into Google Pay, PhonePe, Paytm, or BHIM, your bank is instructed to <strong>debit money out</strong> of your account.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-slate-100 block mb-1">3. OTP is a Single-Use Master Key</strong>
                <p className="text-slate-400">
                  OTPs received on SMS are generated by payment gateways to authenticate netbanking logins or card debits. Sharing it allows attackers to bypass two-factor authentication.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowOtpWhyModal(false);
                  setAcknowledgedOtp(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
