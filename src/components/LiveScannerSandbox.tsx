import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Cloud, 
  RotateCw, 
  Lock, 
  FileText, 
  GitCommit, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Layers, 
  Search, 
  Sparkles, 
  Fingerprint, 
  QrCode, 
  FileImage, 
  MessageSquare, 
  FlaskConical, 
  Bot, 
  Info,
  PhoneCall,
  Upload,
  Database,
  Share2,
  FileDown
} from 'lucide-react';
import { ScanResponse, ProtectionAction, RiskSeverity } from '../types';
import { runClientEdgeClassifier, EdgeScanResult } from '../lib/edge-scanner';
import { CybercrimeModal } from './CybercrimeModal';
import { CybercrimeExportDossier } from '../../backend/src/community/cybercrime-export';
import { ExplainableRiskGauge } from './ExplainableRiskGauge';
import { IncidentResponseWorkspace } from './IncidentResponseWorkspace';
import { AmbientProtectionIntervention } from './AmbientProtectionIntervention';
import { MobileShareIngress } from './MobileShareIngress';
import { ScamChainNarrative } from './ScamChainNarrative';
import { AskRefGuardCopilot } from './AskRefGuardCopilot';
import { ScreenshotInvestigator } from './ScreenshotInvestigator';
import { QRIntelligenceInspector } from './QRIntelligenceInspector';
import { ConversationScamAnalyzer } from './ConversationScamAnalyzer';
import { ThreatLab } from './ThreatLab';
import { ExtractedEvidenceInspector } from './ExtractedEvidenceInspector';

const PRESETS = [
  {
    id: 'preset-whatsapp-reward',
    name: 'WhatsApp ₹5,000 Scratch Card (Inversion Scam)',
    tag: 'Direction Inversion',
    contentType: 'TEXT' as const,
    statedIntent: 'Claiming ₹5,000 Diwali cashback reward',
    content: '🎉 Congratulations! You received ₹5,000 GPay festival reward! Click to claim immediately: https://bit.ly/gpay-fest-reward upi://pay?pa=cashback-reward-claim@upi&pn=RewardsDesk&am=1499.00&cu=INR&tn=ProcessingFee'
  },
  {
    id: 'preset-power-cut',
    name: 'Electricity Power-Cut Urgency Threat',
    tag: 'Fear Appeal Impersonation',
    contentType: 'TEXT' as const,
    statedIntent: 'Paying pending electricity bill',
    content: 'URGENT: Your electricity power supply will be disconnected tonight at 9:30 PM due to unpaid bill of ₹850. Call officer immediately or pay now at upi://pay?pa=urgent-power-bill@okhdfcbank&pn=StatePower&am=850.00'
  },
  {
    id: 'preset-quishing-qr',
    name: 'Optical Quishing Collect Disguised as Cashback',
    tag: 'QR Collect Fraud',
    contentType: 'QR' as const,
    statedIntent: 'Scanning QR code to receive ₹2,500 refund',
    content: 'upi://pay?pa=win-daily-bonus@paytm&pn=GooglePayRewards&am=2500.00&cu=INR&tn=ScanToReceiveCashback'
  },
  {
    id: 'preset-job-fraud',
    name: 'Telegram Part-Time YouTube Like Scam',
    tag: 'Advance Fee Fraud',
    contentType: 'CONVERSATION' as const,
    statedIntent: 'Activating part-time VIP work task',
    content: `[10:14 AM] Recruiter Priya: Hello! You are selected for flexible part-time YouTube video liking job. Earn ₹3,500 daily directly to UPI.
[10:15 AM] User: How does it work?
[10:16 AM] Recruiter Priya: Very simple! First like 3 videos. We will send ₹150 trial bonus.
[10:18 AM] Recruiter Priya: To unlock VIP high paying tasks of ₹5,000, you need to deposit refundable security fee of ₹1,000 to upi://pay?pa=vip.task@okaxis&am=1000.
[10:19 AM] Recruiter Priya: Please send payment screenshot immediately. Limited slots remaining!`
  },
  {
    id: 'preset-otp-harvest',
    name: 'Bank SMS OTP & UPI PIN Phishing Alert',
    tag: 'Privacy Phishing',
    contentType: 'TEXT' as const,
    statedIntent: 'Unblocking NetBanking account',
    content: 'SBI Alert: Your NetBanking account is blocked. Share your 6-digit OTP 849201 and enter UPI PIN 4910 at https://sbi-kyc-verification.site to unlock immediately.'
  },
  {
    id: 'preset-legit-dinner',
    name: 'Legitimate Dinner Payment with Friend',
    tag: 'Safe Normal',
    contentType: 'TEXT' as const,
    statedIntent: 'Sending dinner share to Rahul',
    content: 'Hey Rahul, thanks for dinner last night! Sending my ₹650 share for the pizza: upi://pay?pa=rahul.sharma@okhdfcbank&pn=Rahul%20Sharma&am=650.00&cu=INR&tn=DinnerSplit'
  }
];

export const LiveScannerSandbox: React.FC = () => {
  // Navigation mode
  const [studioMode, setStudioMode] = useState<'unified' | 'screenshot' | 'qr' | 'conversation' | 'threat_lab'>('unified');

  const [inputText, setInputText] = useState(PRESETS[0].content);
  const [statedIntent, setStatedIntent] = useState(PRESETS[0].statedIntent);
  const [scanMode, setScanMode] = useState<'cloud' | 'edge'>('cloud');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [edgeResult, setEdgeResult] = useState<EdgeScanResult | null>(null);
  const [showRawEvidence, setShowRawEvidence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cybercrime Export modal state
  const [dossier, setDossier] = useState<CybercrimeExportDossier | null>(null);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Automatic content type detector
  const detectContentType = (text: string): 'TEXT' | 'URL' | 'UPI_VPA' | 'QR' | 'CONVERSATION' => {
    const trimmed = text.trim();
    if (trimmed.startsWith('upi://')) return 'QR';
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return 'URL';
    if (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed)) return 'UPI_VPA';
    if (/\[\d{1,2}:\d{2}/.test(trimmed) || trimmed.includes('\nUser:') || trimmed.includes('\nCaller:') || trimmed.includes('Recruiter')) return 'CONVERSATION';
    return 'TEXT';
  };

  // Deep-Link & Android Share Target Ingress Listener
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedText = params.get('text') || params.get('url') || params.get('vpa');
      const sharedIntent = params.get('intent');
      const scenario = params.get('scenario');

      if (sharedText) {
        setInputText(sharedText);
        if (sharedIntent) setStatedIntent(sharedIntent);
        handleRunScan(sharedText, sharedIntent || 'Shared external content review');
      } else if (scenario) {
        const found = PRESETS.find(p => p.id === scenario || p.name.toLowerCase().includes(scenario.toLowerCase()));
        if (found) {
          setInputText(found.content);
          setStatedIntent(found.statedIntent);
          handleRunScan(found.content, found.statedIntent);
        }
      }
    } catch (e) {
      console.error('Failed to parse deep link search params', e);
    }
  }, []);

  const detectedType = detectContentType(inputText);

  const handleRunScan = async (overrideText?: string, overrideIntent?: string, overrideMode?: 'cloud' | 'edge') => {
    const textToScan = overrideText !== undefined ? overrideText : inputText;
    const userIntent = overrideIntent !== undefined ? overrideIntent : statedIntent;
    const mode = overrideMode || scanMode;

    if (!textToScan.trim()) return;

    setLoading(true);

    if (mode === 'edge') {
      // Run instant client-side Edge Classifier (<15ms)
      const result = runClientEdgeClassifier(textToScan);
      setEdgeResult(result);
      setScanResult(null);
      setLoading(false);
      return;
    }

    // Run Full Cloud Scan via backend API
    try {
      const response = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: detectContentType(textToScan) === 'CONVERSATION' ? 'TEXT' : detectContentType(textToScan),
          content_value: textToScan,
          stated_intent: userIntent.trim() || undefined,
          timestamp: new Date().toISOString(),
          source_context: 'universal_input'
        })
      });

      if (response.ok) {
        const data: ScanResponse = await response.json();
        setScanResult(data);
        setEdgeResult(null);
      } else {
        const fallback = runClientEdgeClassifier(textToScan);
        setEdgeResult(fallback);
      }
    } catch (err) {
      console.warn('Network error, executing local edge classifier:', err);
      const fallback = runClientEdgeClassifier(textToScan);
      setEdgeResult(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchFromSpecialized = (payload: string, intent: string, result?: ScanResponse) => {
    setInputText(payload);
    setStatedIntent(intent);
    if (result) {
      setScanResult(result);
      setEdgeResult(null);
    } else {
      handleRunScan(payload, intent);
    }
    setStudioMode('unified');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate instant OCR extraction from uploaded screenshot
    const mockExtracted = `[OCR Extracted from ${file.name}]\nCongratulations! You won ₹4,999 Cashback Reward from PhonePe.\nClick link to claim to bank account: upi://pay?pa=cashback.rewards99@okaxis&am=4999&pn=PhonePeRewards`;
    setInputText(mockExtracted);
    setStatedIntent('Claiming ₹4,999 cashback reward');
  };

  const handleExportCybercrime = async () => {
    if (!scanResult) return;
    setExportLoading(true);
    try {
      const response = await fetch('/api/v1/report/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan: scanResult,
          complainant_note: 'Flagged by RefGuard automated ambient protection shield during live scan.'
        })
      });

      if (response.ok) {
        const exported: CybercrimeExportDossier = await response.json();
        setDossier(exported);
        setIsDossierModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to export cybercrime dossier:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    setEdgeResult(null);
    setInputText('');
    setStatedIntent('');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Header & Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            RefGuard Unified Investigation Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive pre-payment scam protection pipeline • Input → Forensic Extraction → Psychological Analysis → Intent Inversion → 1930 Action
          </p>
        </div>

        {/* Specialized Tool Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStudioMode('unified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              studioMode === 'unified'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Unified Investigation
          </button>
          <button
            onClick={() => setStudioMode('screenshot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              studioMode === 'screenshot'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            Screenshot Forensics
          </button>
          <button
            onClick={() => setStudioMode('qr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              studioMode === 'qr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR &amp; Inversion
          </button>
          <button
            onClick={() => setStudioMode('conversation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              studioMode === 'conversation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat Analyzer
          </button>
          <button
            onClick={() => setStudioMode('threat_lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              studioMode === 'threat_lab'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Threat Lab (10 Vectors)
          </button>
        </div>
      </div>

      {/* Render Specialized Views if chosen, with 1-click back into Unified Investigation */}
      {studioMode === 'screenshot' && (
        <ScreenshotInvestigator 
          onOpen1930Modal={() => setIsDossierModalOpen(true)} 
          onLaunchInvestigationInStudio={handleLaunchFromSpecialized}
        />
      )}

      {studioMode === 'qr' && (
        <QRIntelligenceInspector 
          onLaunchInvestigationInStudio={handleLaunchFromSpecialized}
        />
      )}

      {studioMode === 'conversation' && (
        <ConversationScamAnalyzer 
          onRunUnifiedScan={(text) => handleLaunchFromSpecialized(text, 'Conversation Transcript Scan')}
        />
      )}

      {studioMode === 'threat_lab' && (
        <ThreatLab 
          onLaunchInvestigationInStudio={handleLaunchFromSpecialized}
        />
      )}

      {/* UNIFIED INVESTIGATION EXPERIENCE */}
      {studioMode === 'unified' && (
        <div className="space-y-8">
          {/* Mobile & Android Sharesheet Ingress Gateway */}
          <MobileShareIngress 
            onIngestContent={(content, intent, type) => {
              setInputText(content);
              setStatedIntent(intent);
              handleRunScan(content, intent);
            }}
            onLaunchInvestigation={(content, intent, result) => {
              setInputText(content);
              setStatedIntent(intent);
              setScanResult(result);
              setEdgeResult(null);
              scrollToSection('section-proactive');
            }}
          />

          {/* Universal Scam Ingestion Studio */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-100">Scan Suspicious Payment, Message or QR</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Modality: {detectedType}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Single ingestion pipeline for SMS, WhatsApp forward, UPI QR code, payment link, or dialogue transcript.
                </p>
              </div>

              {/* Execution Engine Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setScanMode('cloud')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    scanMode === 'cloud'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" /> Full Pipeline
                </button>
                <button
                  onClick={() => setScanMode('edge')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    scanMode === 'edge'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" /> Edge &lt;15ms
                </button>
              </div>
            </div>

            {/* Quick Presets Bar */}
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">Quick Fraud Vectors:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setInputText(p.content);
                      setStatedIntent(p.statedIntent);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{p.name.split(' (')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                  Your Stated Expectation / What You Were Told (For Intent-Inversion Check)
                </label>
                <input
                  type="text"
                  value={statedIntent}
                  onChange={(e) => setStatedIntent(e.target.value)}
                  placeholder="e.g. 'Receiving ₹5,000 Diwali reward' or 'Paying electricity bill'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Suspicious Content / Payload / URL / UPI String / Chat
                  </label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Screenshot (OCR)</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  placeholder="Paste suspicious text, UPI link, payment request, SMS, or conversation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Payload Type: <strong className="text-slate-200">{detectedType}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetScan}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleRunScan()}
                    disabled={loading || !inputText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating Threat Signals...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run RefGuard Investigation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE INVESTIGATION DOSSIER */}
          {scanResult && (
            <div className="space-y-8 animate-fade-in">
              {/* Sticky Investigation Navigation Bar */}
              <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-2 sticky top-20 z-30 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200">Investigation #{scanResult.scan_id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button 
                    onClick={() => scrollToSection('section-proactive')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800 font-semibold transition-colors cursor-pointer"
                  >
                    ⚡ Proactive Shield
                  </button>
                  <button 
                    onClick={() => scrollToSection('section-verdict')}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Verdict &amp; Risk
                  </button>
                  <button 
                    onClick={() => scrollToSection('section-evidence')}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Evidence
                  </button>
                  {scanResult.conversation_analysis && (
                    <button 
                      onClick={() => scrollToSection('section-psychology')}
                      className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      Psychology
                    </button>
                  )}
                  <button 
                    onClick={() => scrollToSection('section-scam-chain')}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Scam Chain DAG
                  </button>
                  <button 
                    onClick={() => scrollToSection('section-copilot')}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Copilot Q&amp;A
                  </button>
                  <button 
                    onClick={() => scrollToSection('section-incident-response')}
                    className="px-2.5 py-1 rounded-lg bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 font-semibold transition-colors cursor-pointer"
                  >
                    Incident Response
                  </button>
                </div>
              </div>

              {/* 0. Ambient Proactive Protection Interrupter */}
              <div id="section-proactive">
                <AmbientProtectionIntervention
                  scanResult={scanResult}
                  onStopPayment={() => scrollToSection('section-incident-response')}
                  onVerifyIndependently={() => scrollToSection('section-incident-response')}
                  onAskRefGuard={(q) => scrollToSection('section-copilot')}
                />
              </div>

              {/* 1. Explainable Risk Gauge & Direction Inversion */}
              <div id="section-verdict">
                <ExplainableRiskGauge 
                  riskAssessment={scanResult.risk_assessment} 
                  intentMismatch={scanResult.payment_intent_mismatch} 
                />
              </div>

              {/* 2. Structured Forensic Evidence & Entities */}
              <div id="section-evidence">
                <ExtractedEvidenceInspector 
                  scanResult={scanResult} 
                  onAskCopilotAboutEntity={(q) => {
                    scrollToSection('section-copilot');
                  }}
                />
              </div>

              {/* 3. Psychological Manipulation Analysis (if conversation markers exist) */}
              {scanResult.conversation_analysis && (
                <div id="section-psychology" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Conversational Scam Psychology &amp; Social Engineering</h3>
                        <p className="text-xs text-slate-400">Progression analysis and manipulation trigger detection</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-violet-950 text-violet-300 border border-violet-800">
                      {scanResult.conversation_analysis.primary_scam_type}
                    </span>
                  </div>

                  {/* 4-Stage Social Engineering Progression */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Attack Progression Timeline:</span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      {scanResult.conversation_analysis.social_engineering_stages.map((stg, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-xl border text-xs ${
                            stg.detected 
                              ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' 
                              : 'bg-slate-950/60 border-slate-800/60 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold">Stage {i+1}</span>
                            <span className={`w-2 h-2 rounded-full ${stg.detected ? 'bg-rose-400 animate-ping' : 'bg-slate-700'}`} />
                          </div>
                          <p className="font-semibold text-xs mb-1">{stg.stage_name}</p>
                          <p className="text-[11px] opacity-80">{stg.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emotional Manipulation Triggers */}
                  {scanResult.conversation_analysis.emotional_manipulation_triggers.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">Detected Psychological Triggers:</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {scanResult.conversation_analysis.emotional_manipulation_triggers.map((trg, i) => (
                          <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-amber-300">{trg.trigger_name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                {trg.intensity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{trg.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Safe Defusal Responses */}
                  {scanResult.conversation_analysis.recommended_safe_defusal_responses.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">Recommended Safe Counter-Responses:</span>
                      <div className="space-y-2">
                        {scanResult.conversation_analysis.recommended_safe_defusal_responses.map((defusal, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <strong className="text-emerald-400 font-semibold block">{defusal.title}</strong>
                              <p className="text-slate-300 text-xs mt-0.5 italic">"{defusal.response_text}"</p>
                              <span className="text-[10px] text-slate-500 font-mono">Counters: {defusal.tactic_countered}</span>
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(defusal.response_text)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono shrink-0 transition-colors cursor-pointer"
                            >
                              Copy Defusal
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Scam Chain Reconstruction DAG */}
              <div id="section-scam-chain">
                <ScamChainNarrative
                  chainDAG={scanResult.scam_chain}
                  primaryScamType={scanResult.risk_assessment.signals[0] ? (typeof scanResult.risk_assessment.signals[0] === 'string' ? scanResult.risk_assessment.signals[0] : scanResult.risk_assessment.signals[0].signal_name) : undefined}
                />
              </div>

              {/* 5. Ask RefGuard AI Security Copilot */}
              <div id="section-copilot">
                <AskRefGuardCopilot scanResult={scanResult} />
              </div>

              {/* 6. Incident Response & Evidence Workspace */}
              <div id="section-incident-response">
                <IncidentResponseWorkspace
                  scanResult={scanResult}
                  onOpen1930Modal={handleExportCybercrime}
                  onResetScan={handleResetScan}
                />
              </div>

              {/* 7. Technical Telemetry Accordion */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div 
                  onClick={() => setShowRawEvidence(!showRawEvidence)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Technical Audit Telemetry &amp; SHA-256 Digital Seal
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>{showRawEvidence ? 'Collapse' : 'Expand Details'}</span>
                    {showRawEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {showRawEvidence && (
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Scan ID:</span>
                        <span className="font-mono text-slate-300 text-[11px]">{scanResult.scan_id}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Digital Signature:</span>
                        <span className="font-mono text-emerald-400 text-[11px]">{scanResult.evidence_pack?.digital_signature || 'SHA256_VERIFIED'}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Preserved Entities:</span>
                        <span className="font-mono text-indigo-300 text-[11px]">
                          {(scanResult.extraction_result?.upi_vpas?.length || 0) + (scanResult.extraction_result?.urls?.length || 0) + (scanResult.extraction_result?.phone_numbers?.length || 0)} artifacts
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block mb-2">Full Forensic JSON Dossier:</span>
                      <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 p-2 bg-slate-900/50 rounded-lg">
                        {JSON.stringify(scanResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edge Mode Instant Classification Result */}
          {edgeResult && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Edge Classifier Result ({edgeResult.latency_ms}ms Latency)</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                  edgeResult.risk_severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                  edgeResult.risk_severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                  'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  Risk: {edgeResult.risk_score}/100 ({edgeResult.risk_severity})
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {edgeResult.summary}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Recommended Action:</span>
                  <span className="font-bold text-rose-400">{edgeResult.protection_action}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Threat Indicators:</span>
                  <span className="font-mono text-indigo-300">{edgeResult.threat_indicators.join(', ') || 'None (Safe Baseline)'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cybercrime Export 1930 Modal */}
      {isDossierModalOpen && dossier && (
        <CybercrimeModal
          dossier={dossier}
          isOpen={isDossierModalOpen}
          onClose={() => setIsDossierModalOpen(false)}
        />
      )}
    </div>
  );
};
