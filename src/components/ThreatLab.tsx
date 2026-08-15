import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowRight,
  TrendingUp,
  HelpCircle,
  FileCheck,
  Ban,
  Lock,
  Eye,
  Sparkles,
  Smartphone,
  Shield,
  Radio,
  FileText
} from 'lucide-react';
import { ScanResponse } from '../types';
import { runClientEdgeClassifier, EdgeScanResult } from '../lib/edge-scanner';
import { AmbientProtectionIntervention } from './AmbientProtectionIntervention';

interface ThreatScenario {
  id: string;
  category: string;
  name: string;
  difficulty: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'SAFE';
  statedIntent: string;
  payload: string;
  expectedTactic: string;
  description: string;
}

const THREAT_SCENARIOS: ThreatScenario[] = [
  {
    id: 'SCENARIO-01',
    category: 'Quishing & Inversion',
    name: 'Fake Cashback Reward QR Inversion',
    difficulty: 'CRITICAL',
    statedIntent: 'Claim ₹5,000 Google Pay Diwali Cashback',
    payload: 'upi://pay?pa=cashback.rewards99@okaxis&pn=GPay%20Reward&am=5000&cu=INR&tn=Cashback%20Approval',
    expectedTactic: 'Payment-Intent Inversion (Debit disguised as Credit)',
    description: 'Scammer presents a QR code promising to send ₹5,000 reward to the user, but the QR actually debits ₹5,000 upon entering PIN.'
  },
  {
    id: 'SCENARIO-02',
    category: 'Urgency & Fear',
    name: 'Power Disconnection Panic SMS',
    difficulty: 'CRITICAL',
    statedIntent: 'Update electricity bill to prevent power cut tonight',
    payload: 'Dear consumer, power will be disconnected at 09:30 PM tonight. Pay ₹10 reconnection fee immediately at http://power-bill-update.xyz or call 9876543210.',
    expectedTactic: 'Authority Impersonation + Artificial Urgency',
    description: 'Creates imminent panic to force the victim into clicking a phishing link or paying a fraudulent fee.'
  },
  {
    id: 'SCENARIO-03',
    category: 'Task Fraud',
    name: 'Telegram YouTube Video Like Scam',
    difficulty: 'HIGH',
    statedIntent: 'Earn ₹3,500 daily for liking videos',
    payload: 'Join VIP Task Group. Like 3 YouTube videos to earn trial ₹150. Deposit ₹1,000 VIP fee to upi://pay?pa=vip.task@okaxis&am=1000 to withdraw ₹5,000.',
    expectedTactic: 'Task-based Advance Fee Fraud',
    description: 'Offers small initial payouts to build trust before requiring larger non-refundable deposit fees.'
  },
  {
    id: 'SCENARIO-04',
    category: 'Credential Harvesting',
    name: 'Bank Account Block & KYC OTP Lure',
    difficulty: 'CRITICAL',
    statedIntent: 'Complete KYC to unblock SBI savings account',
    payload: 'SBI Alert: Your YONO account is suspended. Update KYC at http://sbi-kyc-secure.top and share 6-digit OTP to unblock card.',
    expectedTactic: 'Brand Impersonation + OTP Harvesting',
    description: 'Pretends to be SBI customer care to harvest banking credentials and one-time passwords.'
  },
  {
    id: 'SCENARIO-05',
    category: 'Search Poisoning',
    name: 'Fake Airline Customer Care Refund',
    difficulty: 'CRITICAL',
    statedIntent: 'Receive ₹4,200 airline ticket refund',
    payload: 'Airline Care Executive: To receive ₹4,200 flight refund, approve UPI collect request sent by refund.desk@okaxis for ₹4,200.',
    expectedTactic: 'Collect Request Inversion + Search Poisoning',
    description: 'Scammer poses as airline customer care and sends a collect request telling the user it will refund their money.'
  },
  {
    id: 'SCENARIO-06',
    category: 'Ponzi Investment',
    name: 'High-Return Daily Crypto Doubler',
    difficulty: 'HIGH',
    statedIntent: 'Invest ₹2,000 to earn 200% returns in 24 hours',
    payload: 'Guaranteed 200% daily profit. Transfer minimum ₹2,000 to upi://pay?pa=crypto.growth@icici&am=2000. Limited slots!',
    expectedTactic: 'Unrealistic Financial Incentive Bait',
    description: 'Promises impossible investment returns to harvest upfront deposits.'
  },
  {
    id: 'SCENARIO-07',
    category: 'APK Dropper',
    name: 'Instant Loan App Approval Dropper',
    difficulty: 'CRITICAL',
    statedIntent: 'Get ₹50,000 instant collateral-free loan',
    payload: 'Congratulations! Instant ₹50,000 loan approved. Download APK at http://fast-loan-app.xyz/loan.apk to disburse funds.',
    expectedTactic: 'Malicious APK Dropper / Spyware',
    description: 'Lures users into installing malicious APKs that harvest contacts and photos for extortion.'
  },
  {
    id: 'SCENARIO-08',
    category: 'Safe Control',
    name: 'Routine P2P Dinner Payment (Safe)',
    difficulty: 'SAFE',
    statedIntent: 'Pay ₹650 for dinner split to colleague',
    payload: 'upi://pay?pa=rahul.verma@oksbi&pn=Rahul%20Verma&am=650&cu=INR&tn=Dinner%20Split',
    expectedTactic: 'Legitimate Transaction Baseline',
    description: 'Control scenario representing a routine, genuine peer-to-peer UPI transfer with zero scam indicators.'
  }
];

interface ThreatLabProps {
  onLaunchInvestigationInStudio?: (payload: string, statedIntent: string, result: ScanResponse) => void;
  onOpen1930Modal?: () => void;
}

export function ThreatLab({ onLaunchInvestigationInStudio, onOpen1930Modal }: ThreatLabProps = {}) {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'live_demo'>('live_demo');
  const [selectedScenario, setSelectedScenario] = useState<ThreatScenario>(THREAT_SCENARIOS[0]);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Live Demo Interactive State
  const [demoStep, setDemoStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [demoScenario, setDemoScenario] = useState<ThreatScenario>(THREAT_SCENARIOS[0]);
  const [demoEdgeResult, setDemoEdgeResult] = useState<EdgeScanResult | null>(null);
  const [demoFullScan, setDemoFullScan] = useState<ScanResponse | null>(null);
  const [demoUserDecision, setDemoUserDecision] = useState<'NONE' | 'STOPPED' | 'PROCEEDED'>('NONE');

  const handleRunSimulation = async (scenario: ThreatScenario) => {
    setSelectedScenario(scenario);
    setIsRunning(true);
    const startTime = performance.now();

    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'threat_lab_simulation',
          stated_intent: scenario.statedIntent,
          content: scenario.payload
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);

      if (!res.ok) throw new Error(`Scan failed with HTTP ${res.status}`);
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error("Threat lab scan error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  // Live Demo Handlers
  const handleStartDemoScenario = async (scen: ThreatScenario) => {
    setDemoScenario(scen);
    setDemoStep(1);
    setDemoUserDecision('NONE');
    setDemoEdgeResult(null);
    setDemoFullScan(null);
  };

  const handleAttemptAction = async () => {
    setDemoStep(2);
    // Instant edge evaluation
    const edge = runClientEdgeClassifier(demoScenario.payload + ' ' + demoScenario.statedIntent);
    setDemoEdgeResult(edge);
    setDemoStep(3);

    // Deep server scan in parallel
    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'live_protection_demo',
          stated_intent: demoScenario.statedIntent,
          content: demoScenario.payload
        })
      });
      if (res.ok) {
        const full = await res.json();
        setDemoFullScan(full);
      }
    } catch (e) {
      console.error(e);
    }

    setDemoStep(4);
  };

  const handleDemoStop = () => {
    setDemoUserDecision('STOPPED');
    setDemoStep(5);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-100">RefGuard Threat Lab &amp; Proactive Protection Center</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                Active Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test ambient pre-action intercepts, payment-intent direction inversions, and multi-engine forensics under live attack vectors.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('live_demo')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'live_demo'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Live Protection Demo</span>
            </button>

            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Attack Suite ({THREAT_SCENARIOS.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE PROTECTION DEMO EXPERIENCE */}
        {activeTab === 'live_demo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Interactive Pre-Action Protection Simulation
                </h3>
                <p className="text-xs text-slate-400">
                  Experience how RefGuard acts as an ambient safety layer right before a user authorizes a malicious request.
                </p>
              </div>

              {/* Scenario Preset Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Preset:</span>
                <select
                  value={demoScenario.id}
                  onChange={(e) => {
                    const found = THREAT_SCENARIOS.find(s => s.id === e.target.value);
                    if (found) handleStartDemoScenario(found);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500"
                >
                  {THREAT_SCENARIOS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.difficulty})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step Pipeline Tracker */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-mono">
              {[
                { step: 1, label: '1. Inbound Lure' },
                { step: 2, label: '2. User Tap' },
                { step: 3, label: '3. Edge Intercept (<15ms)' },
                { step: 4, label: '4. Interrupter Modal' },
                { step: 5, label: '5. Stop & Seal' },
                { step: 6, label: '6. Report Ready' }
              ].map(st => (
                <div 
                  key={st.step}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    demoStep === st.step
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold'
                      : demoStep > st.step
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  {st.label}
                </div>
              ))}
            </div>

            {/* STEP 1 & 2: SIMULATED INCOMING APP / SCREEN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulated Victim Device View */}
              <div className="lg:col-span-5 bg-slate-950 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono font-bold text-slate-300">Simulated Payment / SMS Screen</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">Target Device</span>
                </div>

                {/* Simulated Notification / Payment Prompt */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Incoming Payment / SMS</span>
                    <span className="text-[10px] text-slate-500 font-mono">Just Now</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{demoScenario.statedIntent}</h4>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 break-all leading-relaxed">
                    {demoScenario.payload}
                  </div>

                  {/* Stated Bait */}
                  <div className="pt-2">
                    <button
                      onClick={handleAttemptAction}
                      disabled={demoStep >= 3 && demoStep !== 6}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg ${
                        demoStep >= 3 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>{demoStep >= 3 ? 'Action Intercepted by RefGuard' : 'Attempt Action (Tap to Authorize)'}</span>
                    </button>
                  </div>
                </div>

                {/* Edge Classifier Sub-15ms Telemetry */}
                {demoEdgeResult && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800 text-xs space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        Zero-Latency Edge Decision
                      </span>
                      <span className="font-mono text-[10px] bg-indigo-900 px-2 py-0.5 rounded text-indigo-200">
                        {demoEdgeResult.latency_ms}ms (Sub-15ms Target)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Risk Assessment:</span>
                      <span className="font-bold text-rose-400">{demoEdgeResult.risk_severity} ({demoEdgeResult.risk_score}/100)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Pre-Flight Action:</span>
                      <span className="font-bold text-amber-300">{demoEdgeResult.protection_action}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Proactive Interrupter in Action */}
              <div className="lg:col-span-7 space-y-4">
                {demoStep === 1 && (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                    <Shield className="w-12 h-12 text-slate-700" />
                    <h4 className="text-sm font-bold text-slate-300">Ambient Shield Standing By</h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Tap <strong>"Attempt Action"</strong> on the left device panel to see RefGuard's sub-15ms ambient classifier interrupt the malicious request before payment PIN authorization.
                    </p>
                  </div>
                )}

                {demoStep >= 3 && demoFullScan && (
                  <div className="space-y-4 animate-fade-in">
                    <AmbientProtectionIntervention
                      scanResult={demoFullScan}
                      onStopPayment={handleDemoStop}
                      onVerifyIndependently={() => {
                        setDemoUserDecision('NONE');
                      }}
                      onAskRefGuard={(q) => {
                        if (onLaunchInvestigationInStudio) {
                          onLaunchInvestigationInStudio(demoScenario.payload, demoScenario.statedIntent, demoFullScan);
                        }
                      }}
                      onProceedAnyway={() => {
                        setDemoUserDecision('PROCEEDED');
                      }}
                    />

                    {demoStep >= 5 && (
                      <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-700 text-slate-100 space-y-3 animate-fade-in shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-800/80">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-mono">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>ATTACK NEUTRALIZED &amp; EVIDENCE SEALED</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                            ZERO LOSS PRESERVED
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          The user followed RefGuard's proactive intervention and aborted the transaction. Forensic evidence has been cryptographically sealed for 1930 Cybercrime submission.
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {onOpen1930Modal && (
                            <button
                              onClick={onOpen1930Modal}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Open 1930 Cybercrime Dossier</span>
                            </button>
                          )}
                          {onLaunchInvestigationInStudio && (
                            <button
                              onClick={() => onLaunchInvestigationInStudio(demoScenario.payload, demoScenario.statedIntent, demoFullScan)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-medium border border-slate-800 cursor-pointer"
                            >
                              Open Investigation in Studio →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-ATTACK SCENARIOS SUITE */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {THREAT_SCENARIOS.map((scen) => {
                const isSelected = selectedScenario.id === scen.id;
                return (
                  <button
                    key={scen.id}
                    onClick={() => handleRunSimulation(scen)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10' 
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{scen.category}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          scen.difficulty === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-800' :
                          scen.difficulty === 'HIGH' ? 'bg-orange-950 text-orange-400 border-orange-800' :
                          scen.difficulty === 'SAFE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                          'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {scen.difficulty}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{scen.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{scen.description}</p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 mt-3 pt-2 border-t border-slate-800/80">
                      <Play className="w-3 h-3" /> Launch Simulation
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Results of Scenario Scan */}
            {selectedScenario && (
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                      Simulation Vector: {selectedScenario.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-rose-400 font-bold">
                    {selectedScenario.expectedTactic}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Stated Victim Intent:</span>
                    <p className="font-semibold text-slate-200">"{selectedScenario.statedIntent}"</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Simulated Technical Payload:</span>
                    <p className="font-mono text-indigo-300 text-[11px] break-all">"{selectedScenario.payload}"</p>
                  </div>
                </div>

                {isRunning ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-300 font-mono">Executing multi-engine scan on attack vector...</span>
                  </div>
                ) : scanResult ? (
                  <div className="pt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-200">Detection Outcome</span>
                      <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                        scanResult.risk_assessment.risk_severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                        scanResult.risk_assessment.risk_severity === 'SAFE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        'bg-orange-950 text-orange-400 border border-orange-800'
                      }`}>
                        Risk Score: {scanResult.risk_assessment.risk_score}/100 ({scanResult.risk_assessment.risk_severity})
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {scanResult.protection_decision.detected_summary}
                    </p>

                    {onLaunchInvestigationInStudio && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onLaunchInvestigationInStudio(selectedScenario.payload, selectedScenario.statedIntent, scanResult)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <span>Open Full Investigation Dossier in Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
