import React, { useState } from 'react';
import { ShieldAlert, Download, Copy, Check, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CybercrimeExportDossier } from '../../backend/src/community/cybercrime-export';

interface CybercrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: CybercrimeExportDossier | null;
}

export const CybercrimeModal: React.FC<CybercrimeModalProps> = ({ isOpen, onClose, dossier }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'stix' | 'csv' | 'json'>('text');

  if (!isOpen || !dossier) return null;

  const getContentToCopy = () => {
    switch (activeTab) {
      case 'text':
        return dossier.formatted_police_dossier;
      case 'stix':
        return JSON.stringify(dossier.stix_bundle || dossier.json_ld, null, 2);
      case 'csv':
        return dossier.csv_export || "";
      case 'json':
      default:
        return JSON.stringify(dossier.json_ld, null, 2);
    }
  };

  const handleCopy = () => {
    const textToCopy = getContentToCopy();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getContentToCopy();
    let ext = "txt";
    let mime = "text/plain";
    if (activeTab === "json" || activeTab === "stix") {
      ext = "json";
      mime = "application/json";
    } else if (activeTab === "csv") {
      ext = "csv";
      mime = "text/csv";
    }

    const element = document.createElement('a');
    const file = new Blob([content], { type: mime });
    element.href = URL.createObjectURL(file);
    element.download = `${dossier.dossier_id}_cybercrime_${activeTab}.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-100">National Cyber Crime Reporting Portal (1930)</h3>
                <span className="px-2 py-0.5 text-xs font-mono bg-red-950/80 text-red-300 border border-red-800 rounded-md">
                  Official Complaint Docket
                </span>
              </div>
              <p className="text-xs text-slate-400">Standardized I4C / MeitY compliant digital evidence docket & STIX 2.1 threat feed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Meta Summary */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Dossier Identifier</span>
            <span className="font-mono font-medium text-slate-200">{dossier.dossier_id}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Evidence SHA-256</span>
            <span className="font-mono text-emerald-400 truncate block" title={dossier.evidence_sha256}>
              {dossier.evidence_sha256.substring(0, 16)}...
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Attack Category</span>
            <span className="font-medium text-amber-400 truncate block">{dossier.incident_summary.category}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Intent Mismatch</span>
            <span className="font-medium text-red-400">
              {dossier.incident_summary.mismatch_detected ? "DETECTED" : "NONE"}
            </span>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'text'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1930 Police Docket (Text)
            </button>
            <button
              onClick={() => setActiveTab('stix')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'stix'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              STIX 2.1 CTI (JSON)
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'csv'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Bank Dispute (CSV)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'json'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              JSON-LD
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy All'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6 flex-1 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/80">
          <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono text-slate-200">
            {getContentToCopy()}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Digital Evidence SHA-256 Verified. Ready for submission at <strong>cybercrime.gov.in</strong> or Dial <strong>1930</strong>.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
