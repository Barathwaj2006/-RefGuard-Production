import React, { useState } from 'react';
import { 
  FileImage, 
  Upload, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Eye, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw,
  ExternalLink,
  Lock,
  Zap,
  PhoneCall
} from 'lucide-react';
import { ScanResponse } from '../types';

interface ScreenshotInvestigatorProps {
  onOpen1930Modal?: () => void;
  onLaunchInvestigationInStudio?: (text: string, statedIntent: string, result: ScanResponse) => void;
}

const SCREENSHOT_PRESETS = [
  {
    id: 'scratch-card',
    title: 'Fake PhonePe ₹4,999 Scratch Card',
    brandName: 'PhonePe (Impersonated)',
    mockText: 'Congratulations! You won ₹4,999 Scratch Card reward. Tap to claim cashback directly to your bank account via upi://pay?pa=cashback.rewards99@okaxis&am=4999',
    extractedVpa: 'cashback.rewards99@okaxis',
    extractedAmount: '₹4,999',
    opticalFlags: ['Deceptive reward banner', 'Urgent 15-min countdown timer', 'Forged UPI security logo'],
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'power-cut',
    title: 'Electricity Disconnection SMS Warning',
    brandName: 'State Electricity Board (Spoofed)',
    mockText: 'URGENT: Power will be disconnected tonight at 09:30 PM due to unpaid bill. Update bill now at http://electricity-update.xyz or call 9876543210.',
    extractedVpa: 'powerbill.recovery@okhdfcbank',
    extractedAmount: '₹10 Verification Fee',
    opticalFlags: ['Panic typography', 'Counterfeit seal', 'Obfuscated domain'],
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'telegram-job',
    title: 'Telegram Part-Time VIP Task Screenshot',
    brandName: 'Telegram VIP Tasks Group',
    mockText: 'Complete YouTube like tasks. To withdraw ₹15,000 profit, deposit VIP refundable tier fee of ₹2,500 to upi://pay?pa=vip.tasks@okaxis&am=2500.',
    extractedVpa: 'vip.tasks@okaxis',
    extractedAmount: '₹2,500',
    opticalFlags: ['Fake earnings statement', 'Unverified channel badge', 'Advance fee trap'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
  }
];

export function ScreenshotInvestigator({ onOpen1930Modal, onLaunchInvestigationInStudio }: ScreenshotInvestigatorProps) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'all' | 'ocr' | 'entities' | 'threats'>('all');

  const preset = SCREENSHOT_PRESETS[selectedPresetIndex];

  const handleRunInvestigation = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'screenshot_investigation',
          stated_intent: preset.title,
          content: preset.mockText
        })
      });

      if (!res.ok) throw new Error(`Investigation failed with HTTP ${res.status}`);
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error("Screenshot analysis error:", err);
    } finally {
      setIsAnalyzing(false);
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
                <FileImage className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Screenshot Forensic Investigation Studio</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Multimodal Vision + OCR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upload payment screenshots, reward cards, or chat captures to perform optical entity extraction, intent verification, and digital evidence hashing.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400">Forensic Presets:</span>
            {SCREENSHOT_PRESETS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setScanResult(null);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedPresetIndex === idx 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {p.title.split(' ')[0]} {p.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Target: <strong>{preset.title}</strong></span>
          </div>

          <button
            onClick={handleRunInvestigation}
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting Optical Evidence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Forensic Investigation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Forensic Visual Inspection Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Screenshot preview with forensic overlays */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" /> Optical Evidence Layer
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setActiveLayer('all')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${activeLayer === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveLayer('entities')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${activeLayer === 'entities' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'}`}
              >
                Entities
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[300px] flex items-center justify-center p-4">
            <div className="space-y-3 w-full">
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs">
                <span className="text-[10px] font-mono uppercase text-indigo-300 block mb-1">OCR Extracted Text:</span>
                <p className="font-mono text-slate-200 leading-relaxed text-[11px]">
                  "{preset.mockText}"
                </p>
              </div>

              {/* Optical flag badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Detected Visual Cues:</span>
                {preset.opticalFlags.map((flag, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 p-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Extracted Evidence & Threat Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Extracted Artifacts &amp; Intelligence
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">Zero-Knowledge Sanitized</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Impersonated Entity:</span>
                <span className="font-bold text-rose-400 text-xs mt-0.5 block">{preset.brandName}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Disguised Amount:</span>
                <span className="font-bold text-amber-300 text-xs mt-0.5 block">{preset.extractedAmount}</span>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Harvested UPI ID (VPA):</span>
                <span className="font-mono text-indigo-300 font-bold text-xs mt-0.5 block">{preset.extractedVpa}</span>
              </div>
            </div>

            {/* Pipeline Stage Visualization */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Investigation Pipeline Flow</span>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 overflow-x-auto pb-1">
                <span className="text-indigo-400 font-bold">SCREENSHOT</span>
                <span>→</span>
                <span className="text-violet-400 font-bold">EXTRACTED EVIDENCE</span>
                <span>→</span>
                <span className="text-amber-400 font-bold">THREAT ANALYSIS</span>
                <span>→</span>
                <span className="text-rose-400 font-bold">RISK VERDICT</span>
              </div>
            </div>
          </div>

          {/* Scan Results if run */}
          {scanResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold font-mono text-slate-200">RefGuard Risk Verdict</span>
                <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                  scanResult.risk_assessment.risk_severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-orange-950 text-orange-400'
                }`}>
                  {scanResult.risk_assessment.risk_score}/100 {scanResult.risk_assessment.risk_severity}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {scanResult.protection_decision.detected_summary}
              </p>

              <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                <span className="text-xs text-slate-400">Action: <strong>{scanResult.protection_decision.action}</strong></span>
                <div className="flex items-center gap-2">
                  {onLaunchInvestigationInStudio && (
                    <button
                      onClick={() => onLaunchInvestigationInStudio(preset.mockText, preset.title, scanResult)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open in Unified Studio</span>
                    </button>
                  )}
                  {onOpen1930Modal && (
                    <button
                      onClick={onOpen1930Modal}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Export 1930</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
