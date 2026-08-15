import React, { useState } from 'react';
import { 
  Layers, 
  Globe, 
  Phone, 
  QrCode, 
  Tag, 
  Building2, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Search,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { ScanResponse } from '../types';

interface ExtractedEvidenceInspectorProps {
  scanResult: ScanResponse;
  onAskCopilotAboutEntity?: (entityValue: string) => void;
}

export function ExtractedEvidenceInspector({ scanResult, onAskCopilotAboutEntity }: ExtractedEvidenceInspectorProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VPA' | 'URL' | 'PHONE' | 'AMOUNT' | 'BRAND'>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const extraction = scanResult.extraction_result || {
    upi_vpas: [],
    urls: [],
    phone_numbers: [],
    amounts: [],
    domains: [],
    brands: []
  };

  const evidenceItems = scanResult.evidence_pack?.items || [];

  const vpas = extraction.upi_vpas || [];
  const urls = extraction.urls || [];
  const phoneNumbers = extraction.phone_numbers || [];
  const amounts = extraction.amounts || [];
  const brands = extraction.brands || [];
  const domains = extraction.domains || [];

  const totalEntities = vpas.length + urls.length + phoneNumbers.length + amounts.length + brands.length;

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5" id="section-evidence">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Extracted Threat Evidence &amp; Entity Intelligence</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              {totalEntities} Extracted Entities
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structured forensic extraction of payment addresses, URLs, contact numbers, and impersonated brands.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
              activeFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalEntities})
          </button>
          {vpas.length > 0 && (
            <button
              onClick={() => setActiveFilter('VPA')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                activeFilter === 'VPA' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              VPAs ({vpas.length})
            </button>
          )}
          {urls.length > 0 && (
            <button
              onClick={() => setActiveFilter('URL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                activeFilter === 'URL' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              URLs ({urls.length})
            </button>
          )}
          {phoneNumbers.length > 0 && (
            <button
              onClick={() => setActiveFilter('PHONE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                activeFilter === 'PHONE' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Phones ({phoneNumbers.length})
            </button>
          )}
          {amounts.length > 0 && (
            <button
              onClick={() => setActiveFilter('AMOUNT')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                activeFilter === 'AMOUNT' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Amounts ({amounts.length})
            </button>
          )}
          {brands.length > 0 && (
            <button
              onClick={() => setActiveFilter('BRAND')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                activeFilter === 'BRAND' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Brands ({brands.length})
            </button>
          )}
        </div>
      </div>

      {/* Grid of Extracted Artifacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* UPI VPAs */}
        {(activeFilter === 'ALL' || activeFilter === 'VPA') && vpas.map((vpa, idx) => (
          <div 
            key={`vpa-${idx}`}
            onClick={() => setSelectedEntity(vpa)}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-indigo-400 flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> UPI VPA Identifier
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Flagged Payee
                </span>
              </div>
              <p className="font-mono text-xs text-slate-200 font-semibold break-all">{vpa}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Handle: <strong className="text-slate-300">@{vpa.split('@')[1] || 'unknown'}</strong> • Reversal Status: <strong className="text-rose-400">Irreversible</strong>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px]">
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(vpa); }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                {copiedValue === vpa ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedValue === vpa ? 'Copied' : 'Copy VPA'}</span>
              </button>
              {onAskCopilotAboutEntity && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAskCopilotAboutEntity(`Tell me about this VPA: ${vpa}`); }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-mono text-[10px]"
                >
                  <span>Inspect</span> <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* URLs & Domains */}
        {(activeFilter === 'ALL' || activeFilter === 'URL') && urls.map((url, idx) => (
          <div 
            key={`url-${idx}`}
            onClick={() => setSelectedEntity(url)}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-indigo-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Suspicious URL / Phish Link
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Suspicious Gateway
                </span>
              </div>
              <p className="font-mono text-xs text-slate-200 font-semibold break-all line-clamp-2">{url}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Domain: <strong className="text-slate-300">{domains[idx] || url.replace(/^https?:\/\//, '').split('/')[0]}</strong>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px]">
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(url); }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                {copiedValue === url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedValue === url ? 'Copied' : 'Copy URL'}</span>
              </button>
              {onAskCopilotAboutEntity && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAskCopilotAboutEntity(`Is this link safe to visit? ${url}`); }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-mono text-[10px]"
                >
                  <span>Inspect</span> <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Phone Numbers */}
        {(activeFilter === 'ALL' || activeFilter === 'PHONE') && phoneNumbers.map((phone, idx) => (
          <div 
            key={`phone-${idx}`}
            onClick={() => setSelectedEntity(phone)}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-indigo-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Originating Phone / SMS Sender
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800">
                  Unverified Contact
                </span>
              </div>
              <p className="font-mono text-xs text-slate-200 font-semibold">{phone}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Country Format: <strong className="text-slate-300">+91 (India)</strong> • Carrier: <strong className="text-slate-300">Cellular / VoIP</strong>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px]">
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(phone); }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                {copiedValue === phone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedValue === phone ? 'Copied' : 'Copy Number'}</span>
              </button>
              {onAskCopilotAboutEntity && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAskCopilotAboutEntity(`Who is calling from this number? ${phone}`); }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-mono text-[10px]"
                >
                  <span>Inspect</span> <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Financial Amounts */}
        {(activeFilter === 'ALL' || activeFilter === 'AMOUNT') && amounts.map((amt, idx) => (
          <div 
            key={`amt-${idx}`}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-indigo-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Extracted Financial Transaction
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                  Target Amount
                </span>
              </div>
              <p className="font-mono text-base font-bold text-rose-400">₹{amt.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Direction: <strong className="text-rose-400">Outbound Debit</strong> • Currency: <strong className="text-slate-300">INR</strong>
              </p>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px] flex justify-between text-slate-400 font-mono text-[10px]">
              <span>Risk: Direct loss if PIN entered</span>
              <span className="text-emerald-400">Zero-PIN Rule Applies</span>
            </div>
          </div>
        ))}

        {/* Impersonated Brands */}
        {(activeFilter === 'ALL' || activeFilter === 'BRAND') && brands.map((brand, idx) => (
          <div 
            key={`brand-${idx}`}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-indigo-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Claimed Institution / Brand
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Brand Impersonation
                </span>
              </div>
              <p className="text-sm font-bold text-slate-200">{brand}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Authenticity: <strong className="text-rose-400">Unverified / P2P Spoofing</strong>
              </p>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px] flex justify-between text-slate-400 font-mono text-[10px]">
              <span>Check: Official app only</span>
              <span className="text-rose-400">Do not trust SMS header</span>
            </div>
          </div>
        ))}
      </div>

      {totalEntities === 0 && (
        <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
          No structured external entities (VPAs, URLs, or phone numbers) detected in this payload.
        </div>
      )}
    </div>
  );
}
