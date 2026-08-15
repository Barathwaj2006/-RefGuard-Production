import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  BarChart3, 
  FileText, 
  Lock, 
  ExternalLink,
  Github,
  Zap,
  CheckCircle2,
  GitBranch
} from 'lucide-react';
import { LiveScannerSandbox } from './components/LiveScannerSandbox';
import { EvaluationViewer } from './components/EvaluationViewer';
import { ArchitectureDocs } from './components/ArchitectureDocs';

export function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'evals' | 'specs'>('sandbox');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Ambient Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-100">RefGuard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  AMBIENT ACTIVE
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Pre-Payment Scam &amp; Referral Shield
              </span>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <nav className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Scanner Sandbox
            </button>
            <button
              onClick={() => setActiveTab('evals')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'evals'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Evaluation Benchmark (58/58)
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'specs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Specs &amp; Contracts (F01–F27)
            </button>
          </nav>

          {/* System Telemetry Pill */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Port 3000 Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sandbox' && <LiveScannerSandbox />}
        {activeTab === 'evals' && <EvaluationViewer />}
        {activeTab === 'specs' && <ArchitectureDocs />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>RefGuard — AI-Augmented Ambient Payment Protection Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Compliant with I4C / 1930 / NPCI UPI Security Guidelines</span>
            <span>•</span>
            <span>Zero-Knowledge Credential Sanitization</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
