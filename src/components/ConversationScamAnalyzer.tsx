import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Copy, 
  Bot, 
  Sparkles, 
  User, 
  Flame, 
  Zap, 
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ConversationAnalysisResponse {
  scam_probability: number;
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primary_scam_type: string;
  social_engineering_stages: Array<{
    stage_name: string;
    description: string;
    detected: boolean;
    evidence_snippet?: string;
  }>;
  emotional_manipulation_triggers: Array<{
    trigger_name: string;
    intensity: 'LOW' | 'MEDIUM' | 'HIGH';
    explanation: string;
  }>;
  detected_requested_actions: string[];
  extracted_entities: {
    vpas: string[];
    urls: string[];
    phone_numbers: string[];
    amounts: number[];
  };
  recommended_safe_defusal_responses: Array<{
    title: string;
    response_text: string;
    tactic_countered: string;
  }>;
  summary: string;
}

const CONVERSATION_PRESETS = [
  {
    title: "Telegram Part-Time Video Like Scam",
    text: `[10:14 AM] Recruiter Priya: Hello! You are selected for flexible part-time YouTube video liking job. Earn ₹3,500 daily directly to UPI.
[10:15 AM] User: How does it work?
[10:16 AM] Recruiter Priya: Very simple! First like 3 videos. We will send ₹150 trial bonus.
[10:18 AM] Recruiter Priya: To unlock VIP high paying tasks of ₹5,000, you need to deposit refundable security fee of ₹1,000 to upi://pay?pa=vip.task@okaxis&am=1000.
[10:19 AM] Recruiter Priya: Please send payment screenshot immediately. Limited slots remaining!`
  },
  {
    title: "Electricity Power-Cut Disconnection Panic",
    text: `[08:42 PM] +919876543210: Dear Consumer, your electricity power supply will be DISCONNECTED tonight at 9:30 PM because previous month bill was not updated.
[08:43 PM] +919876543210: Immediately call Electricity Officer Verma at 9876543210 or pay ₹10 reconnection update fee at http://power-bill-update.xyz.
[08:45 PM] +919876543210: Do not delay, your power line is in disconnect queue!`
  },
  {
    title: "Bank Account Block & KYC OTP Lure",
    text: `[02:15 PM] SBI Support Desk: Dear Customer, your SBI YONO account will be blocked within 2 hours due to pending PAN KYC verification.
[02:16 PM] SBI Support Desk: Click link to update KYC immediately: http://sbi-kyc-secure.top/login.
[02:18 PM] SBI Support Desk: We have sent 6-digit verification code to your registered mobile. Share the OTP to prevent permanent debit card block.`
  }
];

interface ConversationScamAnalyzerProps {
  initialTranscript?: string;
  initialAnalysis?: ConversationAnalysisResponse | null;
  onRunUnifiedScan?: (text: string) => void;
}

export function ConversationScamAnalyzer({ initialTranscript, initialAnalysis, onRunUnifiedScan }: ConversationScamAnalyzerProps = {}) {
  const [transcript, setTranscript] = useState(initialTranscript || CONVERSATION_PRESETS[0].text);
  const [analysis, setAnalysis] = useState<ConversationAnalysisResponse | null>(initialAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedResponseIndex, setCopiedResponseIndex] = useState<number | null>(null);

  // Sync if initialAnalysis changes
  React.useEffect(() => {
    if (initialAnalysis) {
      setAnalysis(initialAnalysis);
    }
  }, [initialAnalysis]);

  React.useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
    }
  }, [initialTranscript]);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/analyze/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_text: transcript })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error("Conversation analysis failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDefusal = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedResponseIndex(index);
    setTimeout(() => setCopiedResponseIndex(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Description & Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Conversation Scam &amp; Social Engineering Analyzer</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                Psychological Manipulation Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Paste suspicious chat logs, forwarded SMS threads, or Telegram dialogs to uncover coercive tactics and generate safe defusal replies.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400">Presets:</span>
            {CONVERSATION_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setTranscript(preset.text)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-300 transition-all cursor-pointer"
              >
                {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Area */}
        <div className="mt-4 space-y-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            placeholder="Paste raw conversation logs or chat dialogue here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !transcript.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Manipulation Patterns...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Conversation Threat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Output Section */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 ${
            analysis.threat_level === 'CRITICAL' ? 'bg-red-950/40 border-red-800/80 shadow-red-950/20' :
            analysis.threat_level === 'HIGH' ? 'bg-orange-950/30 border-orange-800/70' :
            'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800 stroke-current"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`stroke-current transition-all duration-1000 ${
                      analysis.threat_level === 'CRITICAL' ? 'text-red-500' :
                      analysis.threat_level === 'HIGH' ? 'text-orange-500' : 'text-amber-400'
                    }`}
                    strokeDasharray={`${analysis.scam_probability}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-bold font-mono text-white">{analysis.scam_probability}%</span>
                  <span className="text-[8px] uppercase font-mono text-slate-400">SCAM PROB</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Classified Threat</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded border uppercase ${
                    analysis.threat_level === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800' : 'bg-orange-950 text-orange-300 border-orange-800'
                  }`}>
                    {analysis.threat_level}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {analysis.primary_scam_type}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* Requested actions badge */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 min-w-[240px]">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Attacker Demands:</span>
              {analysis.detected_requested_actions.map((act, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid of Manipulation Triggers & Stages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emotional Manipulation Triggers */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Flame className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Psychological &amp; Emotional Triggers
                </h4>
              </div>

              <div className="space-y-3">
                {analysis.emotional_manipulation_triggers.map((trig, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{trig.trigger_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-900">
                        {trig.intensity} INTENSITY
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{trig.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Engineering Stages */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Attack Progression Stages
                </h4>
              </div>

              <div className="space-y-2.5">
                {analysis.social_engineering_stages.map((stage, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border flex items-start gap-3 ${
                      stage.detected 
                        ? 'bg-red-950/30 border-red-900/60 text-slate-200' 
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60 text-slate-400'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      stage.detected ? 'bg-red-900/60 text-red-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {stage.detected ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{stage.stage_name}</span>
                        <span className="text-[10px] font-mono">
                          {stage.detected ? 'DETECTED' : 'NOT OBSERVED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Safe Defusal Responses (What to reply?) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Bot className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Recommended Safe Defusal Responses
                </h4>
                <p className="text-[11px] text-slate-400">
                  Pre-drafted, assertive counter-responses to neutralize manipulation without escalating confrontation
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.recommended_safe_defusal_responses.map((defusal, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      {defusal.title}
                    </span>
                    <p className="text-[11px] text-slate-400 italic mb-2">
                      Counter: {defusal.tactic_countered}
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 font-mono select-all leading-relaxed">
                      "{defusal.response_text}"
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyDefusal(defusal.response_text, idx)}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedResponseIndex === idx ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
