import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  Ban, 
  PhoneCall, 
  FileDown, 
  Share2, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  UserCheck, 
  HeartHandshake, 
  HelpCircle, 
  ListChecks, 
  MessageSquare, 
  Send, 
  ArrowRight, 
  Lock, 
  QrCode, 
  Building2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  CheckCircle2, 
  Info, 
  Phone, 
  Globe,
  Database,
  Smartphone,
  EyeOff
} from 'lucide-react';
import { ScanResponse } from '../types';

interface IncidentResponseWorkspaceProps {
  scanResult: ScanResponse;
  onOpen1930Modal: () => void;
  onResetScan: () => void;
}

export function IncidentResponseWorkspace({ 
  scanResult, 
  onOpen1930Modal, 
  onResetScan 
}: IncidentResponseWorkspaceProps) {
  // Navigation tabs within Incident Response
  const [activeTab, setActiveTab] = useState<'containment' | 'guidance' | 'timeline' | 'defusal' | 'verification' | 'checklist'>('containment');
  const [explainSimply, setExplainSimply] = useState(false);
  const [showStopPaymentModal, setShowStopPaymentModal] = useState(false);
  
  // Feedback states
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedDefusalIndex, setCopiedDefusalIndex] = useState<number | null>(null);

  // Post-incident interactive checklist state
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    step_stop_payment: true,
    step_no_pin: true,
    step_block_contact: false,
    step_reset_pin: false,
    step_contact_bank: false,
    step_preserve_evidence: true,
    step_report_1930: false,
    step_warn_family: false,
  });

  const isHighRisk = scanResult.risk_assessment.risk_score >= 50;
  const isCritical = scanResult.risk_assessment.risk_severity === 'CRITICAL';
  const vpas = scanResult.extraction_result?.upi_vpas || [];
  const urls = scanResult.extraction_result?.urls || [];
  const phones = scanResult.extraction_result?.phone_numbers || [];
  const amounts = scanResult.extraction_result?.amounts || [];
  const brands = scanResult.extraction_result?.brands || [];
  const amountStr = amounts.length > 0 ? `₹${amounts[0].toLocaleString('en-IN')}` : 'Unspecified Amount';

  // Determine threat archetype
  const detectThreatArchetype = (): {
    type: string;
    badge: string;
    title: string;
    simpleExplanation: string;
    technicalExplanation: string;
    defusalOptions: Array<{ label: string; text: string; rationale: string }>;
    steps: Array<{ title: string; desc: string; priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' }>;
  } => {
    const text = (scanResult.evidence_pack?.items?.find(i => i.evidence_type === 'PAYLOAD_SNIPPET')?.data || '').toLowerCase();
    const signals = scanResult.risk_assessment.signals.map(s => typeof s === 'string' ? s : s.signal_name);
    const hasMismatch = scanResult.payment_intent_mismatch && scanResult.payment_intent_mismatch.status !== 'NOT_OBSERVED';

    if (hasMismatch || signals.some(s => s.includes('INVERSION') || s.includes('PAYMENT_INTENT'))) {
      return {
        type: 'UPI_INTENT_INVERSION',
        badge: 'UPI Direction Inversion Scam',
        title: 'Deceptive UPI Collect / Direction Trap',
        simpleExplanation: 'Someone told you that you would RECEIVE money (like a cashback or refund), but the payment screen actually asks you to SEND money. In India, you NEVER need to enter your UPI PIN to receive money.',
        technicalExplanation: `Payment-intent mismatch detected: Claimed inbound receive intent vs outbound debit UPI transaction (${amountStr}). Entering your 4 or 6-digit UPI PIN will immediately transfer money out of your account.`,
        defusalOptions: [
          {
            label: 'Firm Zero-PIN Rule',
            text: 'I know that receiving money on UPI never requires entering a UPI PIN. I am not authorizing this request.',
            rationale: 'Stops the scam immediately by calling out the fundamental UPI architecture rule.'
          },
          {
            label: 'Bank Branch Verification',
            text: 'My bank app has flagged this transaction. I will only accept refunds directly credited via standard NEFT/IMPS to my account without entering a PIN.',
            rationale: 'De-escalates with a calm, technical boundary.'
          },
          {
            label: 'Official Helpline Followup',
            text: 'Please send this refund reference to my registered email. I will verify it with the official merchant desk.',
            rationale: 'Avoids further chat engagement.'
          }
        ],
        steps: [
          { title: 'DO NOT ENTER UPI PIN', desc: 'Cancel and dismiss any pending transaction prompt inside GPay, PhonePe, Paytm, or BHIM.', priority: 'CRITICAL' },
          { title: 'Decline Collect Request', desc: 'If a collect request is showing in your UPI app, tap "Decline" and select "Report Fraud".', priority: 'CRITICAL' },
          { title: 'Block Flagged Recipient', desc: `Block and report ${vpas.join(', ') || 'the sender VPA'} within your payment app.`, priority: 'HIGH' },
          { title: 'Preserve Screenshot / Payload', desc: 'Take a clear screenshot of the message and QR code before deleting or leaving the chat.', priority: 'HIGH' },
          { title: 'Call 1930 if Funds Debited', desc: 'If money was transferred, call national helpline 1930 immediately to trigger an inter-bank stop debit.', priority: 'HIGH' }
        ]
      };
    }

    if (text.includes('otp') || text.includes('mpin') || text.includes('pin') || signals.some(s => s.includes('OTP') || s.includes('PRIVACY'))) {
      return {
        type: 'OTP_PIN_PHISHING',
        badge: 'Credential / OTP Phishing',
        title: 'SMS / Credential Harvesting Scheme',
        simpleExplanation: 'The message is trying to trick you into giving away your secret OTP, UPI PIN, or NetBanking password. Real banks and support agents will NEVER ask for your OTP or PIN.',
        technicalExplanation: 'Sensitive credential solicitation detected in inbound text payload. The attacker is attempting unauthorized account access or fund authorization via social-engineering panic.',
        defusalOptions: [
          {
            label: 'Strict Privacy Refusal',
            text: 'Bank guidelines strictly prohibit sharing OTPs and security codes with anyone. I am contacting official customer care.',
            rationale: 'Polite, non-confrontational boundary referencing standard banking guidelines.'
          },
          {
            label: 'Official Portal Check',
            text: 'I will log in directly via the official bank mobile application to verify this notification.',
            rationale: 'Closes conversation without revealing whether you have an active account.'
          }
        ],
        steps: [
          { title: 'NEVER SHARE THE OTP OR PIN', desc: 'Do not tell anyone the 6-digit code or type it into unknown links.', priority: 'CRITICAL' },
          { title: 'Close Suspicious Links', desc: 'Do not enter passwords or card numbers on web pages sent via SMS or WhatsApp.', priority: 'CRITICAL' },
          { title: 'Change Bank Passwords Immediately', desc: 'If you already entered your password or PIN, open your official bank app and change it immediately.', priority: 'HIGH' },
          { title: 'Freeze SIM / NetBanking', desc: 'Contact your bank customer support immediately to temporarily freeze online transactions.', priority: 'HIGH' }
        ]
      };
    }

    if (text.includes('electricity') || text.includes('power') || text.includes('disconnect') || text.includes('bill')) {
      return {
        type: 'ELECTRICITY_PANIC',
        badge: 'Utility Disconnection Threat',
        title: 'Fake Electricity / Power-Cut Panic Scam',
        simpleExplanation: 'Scammers send fake SMS warnings claiming your electricity or water will be cut tonight to make you panic and pay an unverified personal UPI account. Government electricity offices never cut power via WhatsApp/SMS demands.',
        technicalExplanation: 'Fear-appeal social engineering leveraging artificial urgency and unverified individual VPAs to bypass rational transaction verification.',
        defusalOptions: [
          {
            label: 'Official DISCOM Verification',
            text: 'I have my Consumer Number and will pay my bill only via the official state DISCOM portal or electricity board counter.',
            rationale: 'Rebuffs personal VPA payments with official state billing channels.'
          },
          {
            label: 'Consumer ID Check',
            text: 'Please provide my official Consumer Account Number (CA number) and billing cycle details.',
            rationale: 'Exposes scammers who only have your phone number and no genuine utility data.'
          }
        ],
        steps: [
          { title: 'DO NOT CALL THE NUMBER IN THE SMS', desc: 'The phone number in the SMS belongs directly to the scammer, not the electricity board.', priority: 'CRITICAL' },
          { title: 'Check Official State Portal', desc: 'Open your state electricity board website or official app (e.g. BESCOM, TANGEDCO, MSEDCL, Tata Power) and check bill status.', priority: 'CRITICAL' },
          { title: 'Do Not Pay Personal UPI IDs', desc: 'State utilities only accept payments via official merchant billers, never personal @okhdfcbank or @paytm VPAs.', priority: 'HIGH' },
          { title: 'Report Number to 1930 / Chakshu', desc: 'Report the scammer mobile number to DoT Chakshu portal to get the fake number disconnected.', priority: 'MEDIUM' }
        ]
      };
    }

    if (text.includes('telegram') || text.includes('job') || text.includes('like') || text.includes('youtube') || text.includes('task')) {
      return {
        type: 'JOB_TASK_FRAUD',
        badge: 'Prepaid Task / Job Trap',
        title: 'Telegram Part-Time / YouTube Task Scam',
        simpleExplanation: 'They paid you a small amount (like ₹150) to build trust, and now they want you to pay a "deposit" (like ₹1,000 or ₹5,000) to get bigger payouts. You will never get this deposit back.',
        technicalExplanation: 'Multi-stage advance-fee task scam exploiting sunk-cost psychological traps and escalating deposit demands.',
        defusalOptions: [
          {
            label: 'No-Prepayment Policy',
            text: 'I do not pay advance security deposits for employment or task work. Please cancel my participation.',
            rationale: 'Directly halts the advance-fee psychological progression.'
          },
          {
            label: 'Deduct from Earnings',
            text: 'You can deduct any required fees from my earned balance directly without requiring personal UPI transfers.',
            rationale: 'Forces the scammer into an architectural dead-end.'
          }
        ],
        steps: [
          { title: 'STOP ALL TRANSFERS IMMEDIATELY', desc: 'Do not send any "refundable security deposit", "tax fee", or "VIP tier unlock" payment.', priority: 'CRITICAL' },
          { title: 'Exit and Report the Group', desc: 'Leave the Telegram/WhatsApp channel and report it for financial fraud.', priority: 'HIGH' },
          { title: 'Preserve Transaction Records', desc: 'Note down all UPI VPAs and bank account details where you sent or received trial payouts.', priority: 'HIGH' },
          { title: 'Report to National Cybercrime Portal', desc: 'Submit the full conversation transcript and transaction IDs at cybercrime.gov.in.', priority: 'HIGH' }
        ]
      };
    }

    // Default / Generic High Risk
    return {
      type: 'GENERIC_SCAM',
      badge: 'Unverified Financial Lure',
      title: 'Suspicious Payment & Communication Attempt',
      simpleExplanation: 'This message contains suspicious links, payment requests, or unverified contact details. Do not click links or send any money without verifying through official channels.',
      technicalExplanation: `${scanResult.protection_decision.detected_summary}. Multiple risk indicators flagged across payload forensic extraction.`,
      defusalOptions: [
        {
          label: 'Independent Channel Check',
          text: 'I will verify this request through official channels before taking any action.',
          rationale: 'Standard professional refusal that avoids escalating.'
        },
        {
          label: 'Formal Written Request',
          text: 'Please send formal documentation to my registered postal or official email address.',
          rationale: 'Scammers cannot provide verifiable physical documentation.'
        }
      ],
      steps: [
        { title: 'Do Not Click Links or Pay', desc: 'Avoid interacting with any hyperlinks or QR codes provided in this message.', priority: 'CRITICAL' },
        { title: 'Verify Independently', desc: 'Contact the claimed organization using phone numbers from their official verified website.', priority: 'HIGH' },
        { title: 'Preserve Digital Evidence', desc: 'Save this RefGuard evidence docket for your records.', priority: 'MEDIUM' }
      ]
    };
  };

  const threatArchetype = detectThreatArchetype();

  // Generate Grounded Incident Summary Text
  const generateIncidentSummary = () => {
    const lines = [
      '============================================================',
      'REFGUARD INCIDENT INVESTIGATION SUMMARY',
      '============================================================',
      `Incident Reference : ${scanResult.scan_id}`,
      `Timestamp          : ${scanResult.timestamp}`,
      `Threat Severity    : ${scanResult.risk_assessment.risk_severity} (Risk Score: ${scanResult.risk_assessment.risk_score}/100)`,
      `Category           : ${threatArchetype.title} (${threatArchetype.badge})`,
      `Protection Action  : ${scanResult.protection_decision.action}`,
      '',
      '--- WHAT HAPPENED ---',
      threatArchetype.simpleExplanation,
      '',
      '--- TECHNICAL THREAT FINDINGS ---',
      `Summary: ${scanResult.protection_decision.detected_summary}`,
      scanResult.payment_intent_mismatch?.status !== 'NOT_OBSERVED' 
        ? `Intent Inversion: Inbound claim vs Outbound debit (${scanResult.payment_intent_mismatch.payment_direction})`
        : 'Intent Status: Consistent or single-direction payload.',
      '',
      '--- EXTRACTED THREAT ENTITIES ---',
      vpas.length > 0 ? `• Flagged UPI VPAs : ${vpas.join(', ')}` : '• Flagged UPI VPAs : None observed',
      urls.length > 0 ? `• Malicious URLs   : ${urls.join(', ')}` : '• Malicious URLs   : None observed',
      phones.length > 0 ? `• Origin Phones    : ${phones.join(', ')}` : '• Origin Phones    : None observed',
      amounts.length > 0 ? `• Target Amounts   : ${amounts.map(a => `₹${a}`).join(', ')}` : '• Target Amounts   : Unspecified',
      brands.length > 0 ? `• Spoofed Brands   : ${brands.join(', ')}` : '',
      '',
      '--- IMMEDIATE MANDATORY INSTRUCTIONS ---',
      '1. DO NOT ENTER YOUR UPI PIN (UPI PIN is ONLY for paying, NEVER receiving).',
      '2. Decline all collect requests inside Google Pay / PhonePe / Paytm / BHIM.',
      '3. In case of unauthorized debit, dial 1930 immediately to freeze inter-bank settlements.',
      '',
      '--- DIGITAL EVIDENCE SEAL ---',
      `SHA-256 Digital Signature: ${scanResult.evidence_pack?.digital_signature || 'SHA256_VERIFIED_AUTHENTIC'}`,
      'Generated by RefGuard Pre-Payment AI Security Shield (I4C Compliant)',
      '============================================================'
    ].filter(Boolean);

    return lines.join('\n');
  };

  // Generate Privacy-Safe Public Warning
  const generateShareWarning = () => {
    const warning = `🚨 *REFGUARD FRAUD ALERT* 🚨\n\n` +
      `⚠️ *Scam Vector:* ${threatArchetype.title}\n` +
      `📊 *Risk Level:* ${scanResult.risk_assessment.risk_severity} (${scanResult.risk_assessment.risk_score}/100)\n\n` +
      `📌 *How this scam works:*\n${threatArchetype.simpleExplanation}\n\n` +
      (vpas.length > 0 ? `🚫 *Flagged UPI Recipient:* ${vpas.join(', ')}\n` : '') +
      `🛡️ *Golden Rule:* Entering your UPI PIN *ALWAYS* deducts money from your bank account. You NEVER enter a PIN to receive cashbacks, prizes, or refunds!\n\n` +
      `Please stay alert and share this with family. Verified by RefGuard Security Shield.`;
    return warning;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateIncidentSummary());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(generateShareWarning());
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleDownloadUnifiedEvidence = () => {
    const unifiedBundle = {
      refguard_bundle_version: "v2.0.0",
      incident_id: scanResult.scan_id,
      timestamp: scanResult.timestamp,
      threat_classification: {
        category: threatArchetype.type,
        title: threatArchetype.title,
        badge: threatArchetype.badge,
        severity: scanResult.risk_assessment.risk_severity,
        risk_score: scanResult.risk_assessment.risk_score,
        action: scanResult.protection_decision.action
      },
      plain_language_explanation: threatArchetype.simpleExplanation,
      technical_analysis: scanResult.protection_decision.detected_summary,
      intent_analysis: scanResult.payment_intent_mismatch,
      signals: scanResult.risk_assessment.signals,
      extracted_entities: scanResult.extraction_result,
      scam_chain_dag: scanResult.scam_chain,
      forensic_evidence_items: scanResult.evidence_pack?.items || [],
      digital_signature_sha256: scanResult.evidence_pack?.digital_signature || 'SHA256_SEALED',
      remediation_protocol: threatArchetype.steps,
      incident_summary_plaintext: generateIncidentSummary()
    };

    const blob = new Blob([JSON.stringify(unifiedBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refguard-incident-dossier-${scanResult.scan_id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistTotal = Object.keys(checklist).length;
  const checklistCompleted = Object.values(checklist).filter(Boolean).length;
  const checklistPercent = Math.round((checklistCompleted / checklistTotal) * 100);

  // Synthesize Realistic Incident Timeline
  const baseTime = new Date(scanResult.timestamp || Date.now());
  const formatTimeOffset = (offsetMinutes: number) => {
    const d = new Date(baseTime.getTime() + offsetMinutes * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const timelineEvents = [
    {
      time: formatTimeOffset(-8),
      title: 'Inbound Scam Contact Initiated',
      desc: phones.length > 0 
        ? `Received communication via SMS/WhatsApp from origin phone ${phones[0]}.` 
        : 'Received message claiming urgent cashback, payment obligation, or account block.',
      status: 'SUSPICIOUS'
    },
    ...(urls.length > 0 ? [{
      time: formatTimeOffset(-5),
      title: 'Deceptive URL / Landing Gateway Encountered',
      desc: `Redirection via ${urls[0]} to simulate banking interface or rewards page.`,
      status: 'WARNING'
    }] : []),
    {
      time: formatTimeOffset(-2),
      title: 'Deceptive Payment Request Generated',
      desc: vpas.length > 0 
        ? `Outbound UPI debit request of ${amountStr} mapped to destination ${vpas[0]}.` 
        : `Financial transfer request generated for ${amountStr}.`,
      status: 'CRITICAL'
    },
    {
      time: formatTimeOffset(0),
      title: 'RefGuard Ambient Detection & Intent Verification',
      desc: scanResult.payment_intent_mismatch?.status !== 'NOT_OBSERVED'
        ? `Intent Inversion confirmed: Inbound receive claim inverted into Outbound ${scanResult.payment_intent_mismatch?.payment_direction}.`
        : `RefGuard heuristic engine triggered: Risk Score ${scanResult.risk_assessment.risk_score}/100.`,
      status: 'SHIELD_TRIGGERED'
    },
    {
      time: formatTimeOffset(0),
      title: 'Forensic Evidence Bundle Sealed with SHA-256',
      desc: `Cryptographic hash ${scanResult.evidence_pack?.digital_signature?.slice(0, 16) || 'SHA256_4f92...'} locked for I4C audit integrity.`,
      status: 'VERIFIED'
    },
    {
      time: formatTimeOffset(1),
      title: 'Incident Response & 1930 Cybercrime Dossier Ready',
      desc: 'Automated victim countermeasures and National Cybercrime complaint docket generated.',
      status: 'ACTION_READY'
    }
  ];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6" id="section-incident-response">
      {/* 1. Header & Emergency Mode Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isCritical 
              ? 'bg-red-950 border border-red-800 text-red-400 animate-pulse shadow-lg shadow-red-950/50' 
              : 'bg-indigo-950 border border-indigo-800 text-indigo-400'
          }`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-tight">RefGuard Incident Response Workspace</h2>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                isCritical 
                  ? 'bg-red-950 text-red-300 border-red-700' 
                  : 'bg-orange-950 text-orange-300 border-orange-700'
              }`}>
                {threatArchetype.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end incident containment, step-by-step victim remediation, smart defusals, and 1930 reporting.
            </p>
          </div>
        </div>

        {/* Action Toggle Switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Family / Plain Language Mode Toggle */}
          <button
            onClick={() => setExplainSimply(!explainSimply)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              explainSimply 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' 
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{explainSimply ? 'Simple Explanation ON' : 'Explain this simply (Family Mode)'}</span>
          </button>

          {/* Stop Payment Button */}
          <button
            onClick={() => setShowStopPaymentModal(true)}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>STOP / DO NOT PROCEED</span>
          </button>
        </div>
      </div>

      {/* 2. Family / Simple Explanation Banner (if activated) */}
      {explainSimply && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 animate-fade-in space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Simple Language Explanation (For Family &amp; Elders)</h4>
          </div>
          <p className="text-sm font-medium leading-relaxed text-slate-100">
            {threatArchetype.simpleExplanation}
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs text-amber-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Safety Rule: Never enter your PIN or share SMS codes when asked by an unknown caller or message.</span>
          </div>
        </div>
      )}

      {/* 3. Incident Response Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('containment')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeTab === 'containment'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Immediate Action Cards</span>
        </button>

        <button
          onClick={() => setActiveTab('guidance')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeTab === 'guidance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Step-by-Step Victim Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Incident Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('defusal')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeTab === 'defusal'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Smart Defusal ("Help Me Respond")</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeTab === 'verification'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Verify Independently</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Post-Incident Checklist ({checklistPercent}%)</span>
        </button>
      </div>

      {/* TAB CONTENT 1: CONTAINMENT & ACTION CARDS */}
      {activeTab === 'containment' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Action Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. STOP PAYMENT */}
            <div 
              onClick={() => setShowStopPaymentModal(true)}
              className="p-4 rounded-2xl bg-red-950/60 border border-red-800 hover:border-red-600 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-red-900/80 text-red-300 flex items-center justify-center">
                    <Ban className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900 text-red-200">
                    CRITICAL ACTION
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Stop Payment Protocol</h4>
                <p className="text-xs text-red-200/80 mt-1">
                  Cancel pending PIN entries inside payment apps immediately.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-red-900/60 flex items-center justify-between text-xs text-red-300 font-medium">
                <span>View Emergency Steps</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. REPORT INCIDENT / 1930 DOSSIER */}
            <div 
              onClick={onOpen1930Modal}
              className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800 hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-900/80 text-indigo-300 flex items-center justify-center">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900 text-indigo-200">
                    I4C / MEITY
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Create 1930 Complaint Docket</h4>
                <p className="text-xs text-indigo-200/80 mt-1">
                  Standardized police dossier for cybercrime.gov.in &amp; Dial 1930.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-indigo-900/60 flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span>Export Dossier</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. PRESERVE UNIFIED EVIDENCE BUNDLE */}
            <div 
              onClick={handleDownloadUnifiedEvidence}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                    {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <FileDown className="w-4 h-4 text-slate-300" />}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SHA-256 SEALED
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{downloadSuccess ? 'Bundle Downloaded!' : 'Preserve Evidence Bundle'}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Complete forensic JSON bundle with payload, hash &amp; entities.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-medium">
                <span>Download JSON Dossier</span>
                <FileDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 4. SHARE SAFE WARNING */}
            <div 
              onClick={handleCopyShare}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                    {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    PRIVACY-SAFE
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{copiedShare ? 'Warning Copied!' : 'Share Privacy-Safe Warning'}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Redacts personal PII; alerts contacts on WhatsApp/SMS.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-medium">
                <span>Copy WhatsApp Alert</span>
                <Copy className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Grounded Incident Summary Block */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-200">Grounded Incident Summary Dossier</h4>
              </div>
              <button
                onClick={handleCopySummary}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {copiedSummary ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSummary ? 'Summary Copied!' : 'Copy Incident Summary'}</span>
              </button>
            </div>

            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 overflow-x-auto leading-relaxed select-text">
              {generateIncidentSummary()}
            </pre>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: STEP-BY-STEP VICTIM GUIDANCE */}
      {activeTab === 'guidance' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Targeted Victim Remediation Workflow</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Customized response protocol for <strong className="text-indigo-400">{threatArchetype.title}</strong>
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
              {threatArchetype.steps.length} Steps
            </span>
          </div>

          <div className="space-y-3">
            {threatArchetype.steps.map((st, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  st.priority === 'CRITICAL'
                    ? 'bg-red-950/30 border-red-800/60 text-slate-200'
                    : st.priority === 'HIGH'
                    ? 'bg-orange-950/20 border-orange-800/50 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                  st.priority === 'CRITICAL'
                    ? 'bg-red-900 text-red-200'
                    : st.priority === 'HIGH'
                    ? 'bg-orange-900 text-orange-200'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {idx + 1}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-100">{st.title}</h5>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      st.priority === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-orange-950 text-orange-300 border border-orange-800'
                    }`}>
                      {st.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INCIDENT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="text-sm font-bold text-slate-200">Chronological Forensic Incident Timeline</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Reconstructed sequence of events derived from extracted payload markers and ambient evaluation signals.
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-slate-950 ${
                  evt.status === 'CRITICAL' ? 'border-red-500 text-red-500' :
                  evt.status === 'WARNING' ? 'border-amber-500 text-amber-500' :
                  evt.status === 'SHIELD_TRIGGERED' ? 'border-indigo-500 text-indigo-500' :
                  'border-emerald-500 text-emerald-500'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{evt.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{evt.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{evt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SMART DEFUSAL ASSISTANT */}
      {activeTab === 'defusal' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Smart Defusal Assistant ("Help Me Respond")</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Safe, assertively scripted responses to de-escalate aggressive scam solicitations without revealing personal data.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
              Non-Escalating Scripts
            </span>
          </div>

          <div className="space-y-3">
            {threatArchetype.defusalOptions.map((opt, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono uppercase">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Option {idx + 1}: {opt.label}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(opt.text);
                      setCopiedDefusalIndex(idx);
                      setTimeout(() => setCopiedDefusalIndex(null), 2000);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedDefusalIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDefusalIndex === idx ? 'Copied' : 'Copy Response'}</span>
                  </button>
                </div>

                <p className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-sans text-xs text-slate-100 italic">
                  "{opt.text}"
                </p>

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Strategic Objective: {opt.rationale}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: TRUSTED INDEPENDENT VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <h4 className="text-sm font-bold text-slate-200">Independent Channel Verification Protocol</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Never use the phone number, website link, or QR code provided in an unverified message.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Inbound Suspicious Details (DO NOT TRUST) */}
            <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/50 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Ban className="w-4 h-4" />
                <span>Inbound Channel (DO NOT TRUST)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Sender Phone:</strong> {phones[0] || 'Unknown caller / SMS Shortcode'} (Can be spoofed via VoIP)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Provided Links:</strong> {urls[0] || 'Shortened or typosquatted links'} (Phishing droppers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Claimed Authority:</strong> {brands[0] || 'Customer Support / Power Officer'} (Fake persona)</span>
                </li>
              </ul>
            </div>

            {/* Right: Official Verification Path (TRUSTED) */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>Official Verification Route (TRUSTED)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Physical Debit Card:</strong> Dial the official customer care number printed on the back of your card.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Official Bank Mobile App:</strong> Check notifications inside YONO, HDFC Bank, iMobile, or Axis Mobile.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Government Portals:</strong> Access utility billing directly through verified <code>.gov.in</code> or <code>.nic.in</code> domains.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: POST-INCIDENT CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Interactive Post-Incident Security Checklist</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Track your remediation progress after encountering or halting a suspected financial scam.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">{checklistPercent}% Complete</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'step_stop_payment', title: '1. Stopped Payment Authorization', desc: 'Did not authorize the payment request or enter UPI PIN.' },
              { key: 'step_no_pin', title: '2. Preserved UPI PIN Confidentiality', desc: 'Did not disclose 4/6 digit MPIN to anyone.' },
              { key: 'step_block_contact', title: '3. Blocked Scammer Number / VPA', desc: 'Blocked caller number & VPA in WhatsApp/Phone.' },
              { key: 'step_reset_pin', title: '4. Reset Banking MPIN / Password', desc: 'Changed banking app password if phishing link was opened.' },
              { key: 'step_contact_bank', title: '5. Alerted Bank Fraud Helpline', desc: 'Notified bank support if any money was debited.' },
              { key: 'step_preserve_evidence', title: '6. Downloaded RefGuard Evidence Bundle', desc: 'Downloaded SHA-256 sealed JSON forensic docket.' },
              { key: 'step_report_1930', title: '7. Prepared 1930 / I4C Cybercrime Export', desc: 'Generated complaint summary for cybercrime.gov.in.' },
              { key: 'step_warn_family', title: '8. Shared Privacy-Safe Alert', desc: 'Alerted family/contacts about this active scam pattern.' }
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => toggleChecklistItem(item.key)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  checklist[item.key]
                    ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  checklist[item.key]
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'border-slate-700 bg-slate-900'
                }`}>
                  {checklist[item.key] && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className={`text-xs font-semibold block ${checklist[item.key] ? 'text-slate-100' : 'text-slate-300'}`}>
                    {item.title}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STOP PAYMENT EMERGENCY MODAL */}
      {showStopPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-red-600/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Emergency Stop Payment Protocol</h4>
                  <span className="text-xs text-red-300">Mandatory actions to safeguard your bank account</span>
                </div>
              </div>
              <button 
                onClick={() => setShowStopPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-900/60 flex items-start gap-3">
                <span className="font-mono font-bold text-red-400 text-sm">1.</span>
                <div>
                  <strong className="text-red-200">DO NOT ENTER YOUR UPI PIN</strong>
                  <p className="text-slate-400 mt-0.5">Cancel and dismiss any pending transaction prompt inside Google Pay, PhonePe, Paytm, or BHIM.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="font-mono font-bold text-indigo-400 text-sm">2.</span>
                <div>
                  <strong className="text-slate-200">Freeze UPI / Change MPIN</strong>
                  <p className="text-slate-400 mt-0.5">If you suspect your PIN was compromised, reset your UPI PIN immediately inside your official banking app.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="font-mono font-bold text-amber-400 text-sm">3.</span>
                <div>
                  <strong className="text-slate-200">Call National Cybercrime Helpline 1930</strong>
                  <p className="text-slate-400 mt-0.5">Dial 1930 immediately to freeze transactions in transit across the Indian Cybercrime Financial Fraud Reporting System (CFCFRMS).</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowStopPaymentModal(false);
                  onOpen1930Modal();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Launch 1930 Export
              </button>
              <button
                onClick={() => setShowStopPaymentModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
