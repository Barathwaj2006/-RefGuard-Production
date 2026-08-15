# RefGuard 🛡️
> **Ambient, AI-Augmented Pre-Transaction Cybersecurity & Payment Scam Shield**  
> *"Check before you click, pay, or share."*

---

## 1. Executive Summary & Core Mission

**RefGuard** is an ambient, AI-powered digital payment and referral scam shield engineered to safeguard users against financial engineering, deceptive viral referrals, QR phishing ("quishing"), UPI payment-intent fraud, and social engineering attacks.

Unlike conventional antivirus engines that focus on post-breach detection or file hashes, RefGuard operates at the **pre-transaction behavioral layer**, intercepting and demystifying suspicious links, QR codes, payment intents, and referral traps **before** money moves or viral spam propagates through social circles.

---

## 2. The Upstream Pre-Transaction Threat Space

Modern digital payment scams (especially within UPI, WhatsApp, and Telegram ecosystems) do not start at the payment gateway:
1. **Context Blindness:** Payment applications (Google Pay, PhonePe, Paytm, BHIM) securely authenticate cryptographic transactions, but cannot determine if a victim was socially engineered into believing an outbound payment was a cashback reward or refund.
2. **Viral Referral Amplification:** Pyramid and phishing schemes demand victims share links to *"10 WhatsApp Groups"* to unlock fake money, turning users into unwitting scam amplifiers.
3. **Quishing & QR Spoofing:** Replacing merchant QR codes with collect-request payloads.
4. **Payment Direction Inversion:** Deceiving victims into entering their UPI PIN on an outbound `upi://pay` collect request under the guise of "receiving" funds.

```
[Social Engineering / Fear / Greed Hook]
                 │
                 ▼
[Deceptive Referral / Short Link / QR Code]
                 │
                 ▼
[Payment-Intent Mismatch (Collect vs. Receive)]
                 │
                 ▼
[RefGuard Pre-Flight Behavioral Interception] ──▶ [1-Tap Alert & 1930 Dossier]
```

---

## 3. Comprehensive 27-Feature Taxonomy (F01–F27)

All features are unified directly in the `main` branch across 6 threat lifecycle stages:

| Stage | Feature IDs | Capabilities |
|---|---|---|
| **1. Discover** | `F01`–`F05` | W3C Web Share Target API, Real-time Clipboard Sentinel, Optical Camera QR Scanner, Screenshot OCR Analyzer, Manual Ingress Sandbox |
| **2. Understand** | `F06`–`F11` | Direction Inversion / Payment-Intent Mismatch Engine, Multi-Hop Scam Chain Graph Generator, NLP Urgency & Panic Detector, Typo-Squatting Engine, Unshortener Engine, Privacy Redactor |
| **3. Protect** | `F12`–`F16` | Ambient "Before You Pay" Intervention Modal, Dynamic Risk Score Gauge (0–100), Blacklist Reputation Guard, Isolated Sandboxing, AI Security Copilot |
| **4. Respond** | `F17`–`F21` | 1-Tap "Warn Group" Counter-Card, 1930 Cybercrime Complaint Docket Generator, STIX 2.1 CTI Threat Bundle Export, Bank Nodal CSV Evidence, Emergency Bank Freeze Toll-Free Directory |
| **5. Learn** | `F22`–`F25` | Interactive Threat Lab (Electricity panic, YouTube job task, Scratch card cashback, QR swap), Contextual Micro-Lessons, Explainable Plain-Language Reasons |
| **6. Improve** | `F26`–`F27` | Zero-Knowledge Telemetry, Crowdsourced Community Reporting with Dynamic Threat Feed Blacklist Feedback Loop |

---

## 4. Codebase Architecture (`main` Branch)

The entire system is consolidated into a single unified repository:

```
├── backend/
│   ├── evals/                      # 58 Evaluation Scenarios & Benchmark Runner
│   │   ├── dataset.ts              # 7 Threat Categories (Legit, Scam, Mismatch, etc.)
│   │   └── eval-runner.ts          # Accuracy & Contract Compliance Validator
│   ├── src/
│   │   ├── ai/                     # Contextual AI, Copilot & Conversation Analyzers
│   │   ├── community/              # Crowdsourced Reports & 1930 Cybercrime Dossiers
│   │   ├── evidence/               # Cryptographic Evidence Pack Generator
│   │   ├── extraction/             # Sub-15ms Edge Classifier & Entity Extractor
│   │   ├── mismatch-engine/        # Mathematical Direction Inversion Detector
│   │   ├── orchestrator/           # End-to-End Scan Orchestrator Pipeline
│   │   ├── privacy/                # Zero-Knowledge OTP/PIN/Password Scrubber
│   │   ├── protection-engine/      # Decision Engine (ALLOW, WARN, REQUIRE_CONFIRM)
│   │   ├── risk-engine/            # Risk Scoring & Severity Aggregator
│   │   ├── scam-chain/             # Graph Topology & Narrative Vector Generator
│   │   ├── threat-intelligence/    # Curated Blacklists & Dynamic Community Threat Feed
│   │   └── types/contracts.ts      # Canonical OpenAPI/JSON-Schema TypeScript Types
│   └── tests/                      # Live HTTP API & Intelligence Integration Tests
├── contracts/                      # OpenAPI 3.0.3 YAML, JSON Schemas & Examples
├── docs/product/                   # Master Product Spec, Feature Matrix & User Journeys
├── src/                            # React 19 + Tailwind CSS Frontend UI
│   ├── components/                 # 15 Interactive Specialized Security Components
│   └── lib/edge-scanner.ts         # Client-Side Edge Classifier (<5ms, Offline-Ready)
├── server.ts                       # Express 4.21 + Vite Middleware Full-Stack Server
└── package.json                    # Unified Dependencies & Scripts
```

---

## 5. Verification & Test Suite

RefGuard includes a comprehensive test and evaluation suite:

```bash
# Run all unit tests, live HTTP API integration tests, and 58 AI benchmark scenarios
npm test

# Run the AI intelligence benchmark suite alone
npm run test:eval

# Run linter / TypeScript strict verification
npm run lint

# Compile production bundle
npm run build
```

### Benchmark Results
- **Total Scenarios Evaluated:** 58 / 58
- **Pass Rate:** **100.0%**
- **Contract Compliance:** **100.0%**
- **Privacy Scrubbing Rate:** **100.0%**
- **Average Scan Latency:** **0.53 ms**

---

## 6. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (Optional: add GEMINI_API_KEY for conversational AI)
cp .env.example .env

# 3. Start development server (Port 3000)
npm run dev

# 4. Build for production
npm run build
npm start
```
