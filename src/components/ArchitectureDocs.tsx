import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  Code,
  ShieldAlert,
  Compass
} from 'lucide-react';

const DOC_FILES = [
  {
    id: 'product-spec',
    path: '/docs/product/PRODUCT_SPEC.md',
    title: 'PRODUCT_SPEC.md',
    subtitle: 'Core Mission, Problem Space & Target Personas',
    badge: 'Mission & Vision',
    content: `# RefGuard — Product Specification (Phase 1)
**Document Version:** 1.0.0  
**Target Platforms:** Android (Kotlin / Jetpack Compose) & Web (React / TypeScript)  

---

## 1. Executive Summary & Core Mission

> **RefGuard Core Mission:**  
> *"Check before you click, pay, or share."*

RefGuard is an ambient, AI-powered digital payment and referral scam shield engineered to safeguard users against modern financial engineering, deceptive referral schemes, QR phishing ("quishing"), UPI/payment-intent fraud, and social engineering attacks.

Operates at the **pre-transaction behavioral layer**, intercepting and demystifying suspicious links, QR codes, payment intents, and referral traps before money moves or malicious links propagate through social circles.

---

## 2. Target Personas
1. **Persona A: Digital Novice / Senior Citizen**: High trust in authority, vulnerable to fake electricity/bank KYC notices.
2. **Persona B: Gig Worker & Deal Hunter**: Frequent cashback seeker, vulnerable to "₹5,000 festival scratch card" and part-time job lures.
3. **Persona C: Small Business Merchant**: Vulnerable to physical QR soundbox sticker swaps and fake payment receipts.
4. **Persona D: Everyday Connected Citizen**: Active in group chats, needs 1-tap counter-message cards to warn family/groups.

---

## 3. Product Pillars
- **Pre-Transaction Interception:** Intervene before irreversible commitment.
- **Edge-First Intelligence:** Low latency (<15ms) on-device screening with privacy by default.
- **Intent vs. Mechanism Verification:** Detect payment direction inversions (claims to credit, executes debit).
- **Explainable, Actionable Friction:** Plain-language guidance without black-box confusion.`
  },
  {
    id: 'feature-matrix',
    path: '/docs/product/FEATURE_MATRIX.md',
    title: 'FEATURE_MATRIX.md',
    subtitle: 'Complete 27-Feature Lifecycle & Edge Architecture (F01–F27)',
    badge: 'F01–F27 Specification',
    content: `# RefGuard — Complete Feature Matrix (F01 – F27)

| Feature ID | Feature Name | Description | Module |
|---|---|---|---|
| **F01** | Zero-Knowledge Privacy Scrubber | Strips OTPs, MPINs, CVVs before payload storage | Privacy |
| **F02** | UPI Parameter Extractor | Parses VPA, payee name, amount, and mode | Ingress |
| **F03** | Direction Inversion Detector | Flags inbound promise paired with outbound debit | Engine |
| **F04** | QR Quishing Integrity Check | Detects tampered QR overlays & collect traps | Vision |
| **F05** | Shortlink Unroller | Recursively unrolls bit.ly/tinyurl redirect chains | Threat Intel |
| **F06** | Typosquatting Domain Detector | Flags amaz0n, gpay-reward lookalikes | Threat Intel |
| **F07** | Multimodal Vision OCR | Gemini 3.7 Flash screenshot & QR visual analysis | Vision |
| **F08** | Scam Chain Graph DAG | Synthesizes multi-hop attack nodes and edges | Graph |
| **F09** | Evidence Pack Fingerprint | SHA-256 tamper-evident provenance records | Evidence |
| **F10** | Dynamic Time-Decay Scoring | Decays community reports over 30-day half-life | Community |
| **F11** | 1930 Cybercrime Incident Export | Formats official police & I4C compliant dossier | Community |
| **F12** | Edge Heuristic Classifier | Standalone <15ms offline pre-flight check | Edge |
| **F13** | Actionable Friction Generator | Generates ALLOW, CAUTION, DISCOURAGE actions | Decision |
| **F14** | Hinglish Dialect NLP | Detects regional vernacular manipulation lures | NLP |
| **F15** | Task Investment Fraud Filter | Detects YouTube like / Telegram deposit scams | NLP |
| **F16** | Power-Cut Impersonation Filter | Detects utility disconnection urgency panic | NLP |
| **F17** | Strict JSON Schema Validator | AJV Draft-07 enforcement across all endpoints | Schema |
| **F18** | Crowdsourced Ingestion API | Ingests community scam submissions | Community |
| **F19** | 58-Scenario Eval Benchmark | Automated test harness with 100% pass verification | Quality |
| **F20** | Ambient Shield Simulator | Live UI sandbox for real-time risk experimentation | Web |
| **F21** | Inversion Gauge Visualizer | Real-time visual comparison of intent vs payload | Web |
| **F22** | Brand Lookalike Intel Feed | Curated patterns for Google Pay, PhonePe, SBI, HDFC | Threat Intel |
| **F23** | Local Curated Threat Feed | Curated malicious VPAs & phishing domains | Threat Intel |
| **F24** | Health & Readiness Route | Multi-subsystem readiness check endpoint | Ops |
| **F25** | High-Velocity Transactor Guard | Rapid clipboard & share sheet monitor | Android |
| **F26** | Point-of-Sale Defender Hook | Soundbox & QR tamper detection engine | POS |
| **F27** | Social Guardian Counter-Card | 1-tap warning card generator for family chats | Social |`
  },
  {
    id: 'api-spec',
    path: '/contracts/api.yaml',
    title: 'OpenAPI 3.0 API Specification',
    subtitle: 'REST endpoints for /scan, /report, and /health',
    badge: 'API Contracts',
    content: `openapi: 3.0.3
info:
  title: RefGuard Ambient Pre-Payment Threat Shield API
  version: 1.0.0
  description: Official OpenAPI 3.0 schema for RefGuard backend services.

paths:
  /api/v1/scan:
    post:
      summary: Execute pre-transaction scam analysis
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ScanRequest'
      responses:
        '200':
          description: Successful scan analysis
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ScanResponse'

  /api/v1/report:
    post:
      summary: Submit crowdsourced scam incident report
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ScamReport'
      responses:
        '200':
          description: Report accepted

  /api/v1/report/export:
    post:
      summary: Export National Cyber Crime Portal (1930) complaint docket
      responses:
        '200':
          description: Official police dossier and JSON-LD evidence`
  }
];

export const ArchitectureDocs: React.FC = () => {
  const [activeDocId, setActiveDocId] = useState(DOC_FILES[0].id);
  const [copied, setCopied] = useState(false);

  const activeDoc = DOC_FILES.find((d) => d.id === activeDocId) || DOC_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Document Selector Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DOC_FILES.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDocId(doc.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeDocId === doc.id
                ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-semibold text-slate-200">{doc.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-indigo-400">
                {doc.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">{doc.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Document Content View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono text-slate-300">{activeDoc.path}</span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Content'}
          </button>
        </div>

        <div className="p-6 overflow-x-auto font-mono text-xs text-slate-300 bg-slate-950/40">
          <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono">
            {activeDoc.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
