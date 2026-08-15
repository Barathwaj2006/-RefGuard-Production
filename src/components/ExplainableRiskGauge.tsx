import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Info, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { RiskAssessment, PaymentIntentMismatch } from '../types';

interface ExplainableRiskGaugeProps {
  riskAssessment: RiskAssessment;
  intentMismatch?: PaymentIntentMismatch;
  rawScore?: number;
}

export function ExplainableRiskGauge({ riskAssessment, intentMismatch }: ExplainableRiskGaugeProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  const score = riskAssessment?.risk_score ?? 0;
  const severity = riskAssessment?.risk_severity ?? 'LOW';
  const signals = riskAssessment?.signals ?? [];

  // Color mappings
  const getBadgeColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getMeterColor = (s: number) => {
    if (s >= 80) return 'from-red-500 to-rose-600';
    if (s >= 50) return 'from-amber-500 to-orange-500';
    if (s >= 25) return 'from-yellow-400 to-amber-500';
    return 'from-emerald-400 to-teal-500';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div 
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
          severity === 'CRITICAL' ? 'bg-red-500' :
          severity === 'HIGH' ? 'bg-orange-500' :
          severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        {/* Left: Score display */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800 stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`stroke-current transition-all duration-1000 ease-out ${
                  severity === 'CRITICAL' ? 'text-red-500' :
                  severity === 'HIGH' ? 'text-orange-500' :
                  severity === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                }`}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{score}</span>
              <span className="text-[10px] uppercase font-mono text-slate-400">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Calculated Risk Level</span>
              <span className={`px-2 py-0.5 text-[11px] font-bold font-mono rounded border uppercase ${getBadgeColor(severity)}`}>
                {severity}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">
              {severity === 'CRITICAL' && 'Critical Scam & Fraud Threat'}
              {severity === 'HIGH' && 'High Risk Deceptive Vector'}
              {severity === 'MEDIUM' && 'Suspicious Content — Caution Required'}
              {severity === 'LOW' && 'Verified Low Risk Transaction'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {riskAssessment?.explanation || 'Threat score determined by multi-factor semantic, optical, and network intelligence engines.'}
            </p>
          </div>
        </div>

        {/* Right: Payment Intent Inversion Flag if present */}
        {intentMismatch && intentMismatch.status === 'DETECTED' && (
          <div className="w-full lg:w-auto bg-red-950/60 border border-red-700/60 rounded-xl p-3.5 flex items-start gap-3 shadow-lg">
            <div className="p-2 bg-red-900/80 rounded-lg text-red-300 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse text-red-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-300 font-mono">
                  🚨 Payment-Intent Inversion
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-red-900/90 text-red-200 rounded font-mono">+40 pts</span>
              </div>
              <p className="text-xs text-red-200/90 mt-1 max-w-sm">
                Message promises you will <strong>{typeof intentMismatch.stated_intent === 'object' ? intentMismatch.stated_intent?.action : (intentMismatch.stated_intent || 'RECEIVE')} money</strong>, but the UPI payload is an outbound <strong>PAYMENT (DEBIT)</strong>!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Factors Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Why was this score assigned? (Explainable Threat Signals)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {signals.length} Signals Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {signals.length === 0 ? (
            <div className="col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No adverse heuristic or threat intelligence signals triggered. Transaction conforms to legitimate baselines.</span>
            </div>
          ) : (
            signals.map((rawSig, idx) => {
              const sigName = typeof rawSig === 'string' ? rawSig : rawSig.signal_name;
              const sigDesc = typeof rawSig === 'string' ? rawSig.replace(/_/g, ' ') : rawSig.description;
              const sigConf = typeof rawSig === 'string' ? 0.85 : rawSig.confidence;

              const isExpanded = expandedFactor === sigName;
              const isHighImpact = sigConf >= 0.7;

              return (
                <div 
                  key={idx}
                  onClick={() => setExpandedFactor(isExpanded ? null : sigName)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isHighImpact 
                      ? 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        isHighImpact ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                      }`} />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          {sigName.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {sigDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        sigConf >= 0.8 ? 'bg-red-950 text-red-400 border border-red-800/60' :
                        sigConf >= 0.5 ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {(sigConf * 100).toFixed(0)}% Conf
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1 bg-slate-900/40 p-2.5 rounded-lg">
                      <div className="flex justify-between text-slate-400">
                        <span>Detection Engine:</span>
                        <span className="font-mono text-indigo-300">RefGuard Edge Heuristic + Multimodal OCR</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Classification Weight:</span>
                        <span className="font-mono text-amber-300">{isHighImpact ? 'Critical Factor (+25-40 pts)' : 'Secondary Signal (+10-15 pts)'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
