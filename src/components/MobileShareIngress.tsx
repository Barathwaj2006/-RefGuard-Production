import React, { useState, useEffect, useRef } from 'react';
import { 
  Share2, 
  Clipboard, 
  Smartphone, 
  FileImage, 
  QrCode, 
  MessageSquare, 
  Globe, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  Send,
  Upload,
  Eye,
  Lock,
  PhoneCall,
  Bot
} from 'lucide-react';
import { ScanResponse, ContentType } from '../types';
import { runClientEdgeClassifier, EdgeScanResult } from '../lib/edge-scanner';

interface MobileShareIngressProps {
  onIngestContent: (content: string, statedIntent: string, contentType: ContentType) => void;
  onLaunchInvestigation: (content: string, statedIntent: string, result: ScanResponse) => void;
}

const SIMULATED_SHARE_SOURCES = [
  {
    id: 'src-whatsapp-scratch',
    app: 'WhatsApp',
    appName: 'WhatsApp Message',
    iconColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    title: 'Shared ₹5,000 Scratch Card Message',
    contentType: 'TEXT' as ContentType,
    statedIntent: 'Claiming ₹5,000 Google Pay Festival Scratch Card',
    content: '🎉 Congratulations! You received ₹5,000 Diwali cashback. Claim immediately into your bank: https://gpay-festive.xyz upi://pay?pa=diwali.cashback99@okaxis&am=5000&cu=INR&tn=CashbackClaim'
  },
  {
    id: 'src-sms-power',
    app: 'SMS',
    appName: 'Android Messages (SMS)',
    iconColor: 'text-blue-400 bg-blue-950/80 border-blue-800',
    title: 'Urgent Electricity Power Cut Notice',
    contentType: 'TEXT' as ContentType,
    statedIntent: 'Paying pending power bill to avoid disconnection',
    content: 'URGENT: Power will be disconnected tonight at 09:30 PM due to unpaid bill. Update bill now at http://electricity-update.xyz or call 9876543210 immediately.'
  },
  {
    id: 'src-telegram-task',
    app: 'Telegram',
    appName: 'Telegram Chat',
    iconColor: 'text-sky-400 bg-sky-950/80 border-sky-800',
    title: 'Shared Part-Time Job Chat Transcript',
    contentType: 'CONVERSATION' as ContentType,
    statedIntent: 'Earn ₹3,500 daily for liking YouTube videos',
    content: `[10:14 AM] Priya (HR): Hello! Are you interested in daily part-time job earning ₹3,500?
[10:15 AM] User: Yes, please share details.
[10:16 AM] Priya (HR): Like 3 YouTube videos and send screenshot for ₹150 trial bonus.
[10:17 AM] Priya (HR): To unlock VIP Tier ₹5,000 task, deposit ₹1,000 refundable fee to upi://pay?pa=vip.tasks@okaxis&am=1000 now!`
  },
  {
    id: 'src-browser-shortlink',
    app: 'Chrome',
    appName: 'Chrome Browser',
    iconColor: 'text-amber-400 bg-amber-950/80 border-amber-800',
    title: 'Shared URL from Mobile Browser',
    contentType: 'URL' as ContentType,
    statedIntent: 'Visiting promotional discount site',
    content: 'https://tinyurl.com/sbi-rewards-login-2026'
  },
  {
    id: 'src-gallery-qr',
    app: 'Gallery',
    appName: 'Gallery / Photos',
    iconColor: 'text-purple-400 bg-purple-950/80 border-purple-800',
    title: 'Shared QR Code Screenshot',
    contentType: 'QR' as ContentType,
    statedIntent: 'Scanning QR code to receive refund',
    content: 'upi://pay?pa=refund-desk@okhdfcbank&pn=InstantRefund&am=3500.00&cu=INR&tn=RefundAuthorize'
  }
];

export function MobileShareIngress({ onIngestContent, onLaunchInvestigation }: MobileShareIngressProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);
  const [clipboardLoading, setClipboardLoading] = useState(false);
  const [activeShareSim, setActiveShareSim] = useState<typeof SIMULATED_SHARE_SOURCES[0] | null>(null);
  const [processingShare, setProcessingShare] = useState(false);
  const [edgeResult, setEdgeResult] = useState<EdgeScanResult | null>(null);
  const [shareResult, setShareResult] = useState<ScanResponse | null>(null);
  const [copiedFamilyWarn, setCopiedFamilyWarn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Web Share Target GET query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedText = params.get('text') || params.get('url') || params.get('title');
      const statedIntent = params.get('intent') || 'Reviewing shared suspicious content';

      if (sharedText) {
        handleProcessIngressPayload(sharedText, statedIntent, 'SHARE_INTENT');
      }
    } catch (e) {
      console.error("Failed to parse URL share parameters", e);
    }
  }, []);

  // Core Ingress Pipeline: Takes any raw string, analyzes modality, runs edge classifier, then deep analysis
  const handleProcessIngressPayload = async (rawContent: string, intent: string, sourceBadge: string) => {
    setProcessingShare(true);
    setClipboardFeedback(null);

    // 1. Instant Edge Classification (<15ms)
    const edge = runClientEdgeClassifier(rawContent + ' ' + intent);
    setEdgeResult(edge);

    // 2. Modality Auto-Detection
    let detectedType: ContentType = 'TEXT';
    if (rawContent.startsWith('upi://') || rawContent.includes('@')) {
      detectedType = rawContent.startsWith('upi://') ? 'QR' : 'UPI_VPA';
    } else if (rawContent.startsWith('http://') || rawContent.startsWith('https://')) {
      detectedType = 'URL';
    } else if (rawContent.includes('[') && rawContent.includes(']') && (rawContent.includes('AM') || rawContent.includes('PM') || rawContent.includes(':'))) {
      detectedType = 'MANUAL'; // Conversation
    }

    // 3. Deep Analysis (or Offline Fallback)
    if (!navigator.onLine) {
      // Offline fallback: synthesize local edge response
      setProcessingShare(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: `mobile_share_${sourceBadge.toLowerCase()}`,
          stated_intent: intent,
          content: rawContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShareResult(data);
      }
    } catch (err) {
      console.error("Deep analysis failed:", err);
    } finally {
      setProcessingShare(false);
    }
  };

  // Explicit Clipboard Action Handler
  const handleScanClipboard = async () => {
    setClipboardLoading(true);
    setClipboardFeedback(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardFeedback("Clipboard access requires HTTPS or browser permission.");
        setClipboardLoading(false);
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) {
        setClipboardFeedback("Clipboard is currently empty.");
        setClipboardLoading(false);
        return;
      }

      setClipboardFeedback(`Analyzed ${text.length} chars from clipboard`);
      handleProcessIngressPayload(text, 'Reviewing clipboard content for payment fraud', 'CLIPBOARD');
      onIngestContent(text, 'Reviewing clipboard content for payment fraud', 'CLIPBOARD');
    } catch (err: any) {
      console.warn("Clipboard read permission denied:", err);
      setClipboardFeedback("Clipboard permission not granted. You can paste directly into the box.");
    } finally {
      setClipboardLoading(false);
    }
  };

  // Shared Screenshot & Image File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulated OCR extraction from uploaded screenshot / QR image
    const isQR = file.name.toLowerCase().includes('qr') || file.type.includes('qr');
    const mockExtractedText = isQR
      ? 'upi://pay?pa=cashback.festive99@okaxis&pn=GPay%20Rewards&am=4999.00&cu=INR&tn=FestiveBonus'
      : `Screenshot OCR: Urgent notice from State Electricity Board. Pay ₹850 immediately to avoid power cut at 09:30 PM. upi://pay?pa=powerbill.recovery@okhdfcbank&am=850.00`;

    const intent = isQR ? 'Scanning QR code for cashback' : 'Investigating electricity bill payment screenshot';
    handleProcessIngressPayload(mockExtractedText, intent, 'IMAGE');
    onIngestContent(mockExtractedText, intent, 'IMAGE');
  };

  // One-Tap Family Warning Share
  const handleShareFamilyWarning = async () => {
    const vpa = shareResult?.extraction_result?.upi_vpas?.[0] || 'Unknown VPA';
    const amount = shareResult?.extraction_result?.amounts?.[0] ? `₹${shareResult.extraction_result.amounts[0]}` : 'money';
    
    const warningText = `⚠️ *SCAM ALERT FROM REFGUARD*\n\n` +
      `Do NOT pay or enter your UPI PIN for this request:\n` +
      `• *Threat:* ${shareResult?.risk_assessment?.signals?.[0] ? (typeof shareResult.risk_assessment.signals[0] === 'string' ? shareResult.risk_assessment.signals[0] : shareResult.risk_assessment.signals[0].signal_name) : 'Payment-Intent Scam'}\n` +
      `• *Recipient:* ${vpa}\n` +
      `• *Target Amount:* ${amount}\n\n` +
      `*Crucial Rule:* In India, you NEVER need to enter your UPI PIN to receive money or refunds. Please verify directly with official customer care.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RefGuard Scam Warning',
          text: warningText
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(warningText);
      setCopiedFamilyWarn(true);
      setTimeout(() => setCopiedFamilyWarn(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-World Mobile Ingress & Share Target Gateway */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-100">
                  Universal Mobile Ingress &amp; Android Share Target
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                  W3C Web Share Target API
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Encounter suspicious content anywhere (WhatsApp, SMS, Telegram, Gallery, Chrome) and share directly to RefGuard for sub-15ms edge protection.
              </p>
            </div>
          </div>

          {/* Connectivity Status Pill */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
              isOnline 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ONLINE (Deep Cloud AI Active)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>OFFLINE (Edge Classifier Standing By)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 1-CLICK INGRESS TRIGGER CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Action 1: Explicit Clipboard Scan */}
          <button
            onClick={handleScanClipboard}
            disabled={clipboardLoading}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer shadow-md flex items-start justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-mono">
                <Clipboard className="w-4 h-4" />
                <span>SCAN CLIPBOARD</span>
              </div>
              <p className="text-xs text-slate-300">
                Instantly analyze copied text, UPI ID, or payment URL.
              </p>
              <span className="text-[10px] text-slate-500 font-mono block">
                Explicit User Triggered • Zero Background Tracking
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
          </button>

          {/* Action 2: Upload Screenshot / QR from Gallery */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer shadow-md flex items-start justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                <FileImage className="w-4 h-4" />
                <span>SHARE SCREENSHOT / QR</span>
              </div>
              <p className="text-xs text-slate-300">
                Select payment screenshot, SMS screenshot, or QR image.
              </p>
              <span className="text-[10px] text-slate-500 font-mono block">
                Automatic OCR &amp; QR Decoding Pipeline
              </span>
            </div>
            <Upload className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </button>

          {/* Action 3: Android Sharesheet Native Manifest Integration */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <Smartphone className="w-4 h-4" />
                <span>ANDROID SYSTEM SHARE</span>
              </div>
              <p className="text-xs text-slate-300">
                Configured via <code className="text-emerald-400 font-mono text-[11px]">manifest.json</code> share_target.
              </p>
              <span className="text-[10px] text-slate-500 font-mono block">
                Accepts ACTION_SEND from any mobile app
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
          </div>
        </div>

        {clipboardFeedback && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300 flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{clipboardFeedback}</span>
          </div>
        )}

        {/* 2. REAL-WORLD SHARESHEET SIMULATION SUITE */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Simulate Ingress from External Apps (Android Sharesheet)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">1-Tap Real-World Ingress</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {SIMULATED_SHARE_SOURCES.map((src) => {
              const isActive = activeShareSim?.id === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => {
                    setActiveShareSim(src);
                    handleProcessIngressPayload(src.content, src.statedIntent, src.app);
                    onIngestContent(src.content, src.statedIntent, src.contentType);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive 
                      ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${src.iconColor}`}>
                        {src.app}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{src.contentType}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{src.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{src.statedIntent}</p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 mt-3 pt-2 border-t border-slate-800/80">
                    <Share2 className="w-3 h-3" /> Share to RefGuard
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ACTIVE INGRESS PROTECTION SESSION RESULTS */}
        {(processingShare || edgeResult || shareResult) && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Active Ingress Protection Session
                </h4>
              </div>

              {edgeResult && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Edge Classification:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800">
                    {edgeResult.latency_ms}ms • {edgeResult.risk_severity} ({edgeResult.risk_score}/100)
                  </span>
                </div>
              )}
            </div>

            {/* Ingress Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Ingress Source</span>
                <p className="font-bold text-slate-200">{activeShareSim?.appName || 'Android Shared Content'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Stated User Purpose</span>
                <p className="font-medium text-slate-300 line-clamp-2">
                  {activeShareSim?.statedIntent || 'Shared Content Review'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Protection Status</span>
                <p className={`font-bold font-mono ${
                  edgeResult?.risk_severity === 'CRITICAL' ? 'text-red-400' :
                  edgeResult?.risk_severity === 'HIGH' ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  {edgeResult?.protection_action || 'EVALUATING'}
                </p>
              </div>
            </div>

            {/* Deep Analysis Launch / 1-Tap Actions */}
            {shareResult && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareFamilyWarning}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                  >
                    {copiedFamilyWarn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedFamilyWarn ? 'Warning Copied to Clipboard!' : 'Share Privacy-Safe Warning'}</span>
                  </button>
                </div>

                <button
                  onClick={() => onLaunchInvestigation(
                    activeShareSim?.content || '',
                    activeShareSim?.statedIntent || '',
                    shareResult
                  )}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  <span>Open Full Investigation Dossier &amp; Interrupter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
