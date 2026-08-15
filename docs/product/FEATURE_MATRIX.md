# RefGuard — Core Feature Matrix (27 Features)
**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Implementation  
**Classification:** Phase 1 Product Functional Specifications  

---

## Overview

The RefGuard feature ecosystem is organized along the 6-stage threat intervention lifecycle:
`Discover` ➔ `Understand` ➔ `Protect` ➔ `Respond` ➔ `Learn` ➔ `Improve`.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. DISCOVER │───▶│2. UNDERSTAND │───▶│  3. PROTECT  │
│  (5 Features)│    │ (5 Features) │    │ (5 Features) │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
┌──────────────┐    ┌──────────────┐           ▼
│  6. IMPROVE  │◀───│   5. LEARN   │◀───┌──────────────┐
│ (4 Features) │    │ (4 Features) │    │  4. RESPOND  │
└──────────────┘    └──────────────┘    │ (4 Features) │
                                        └──────────────┘
```

---

## Complete 27-Feature Breakdown

### Phase 1: DISCOVER (Ingress & Signal Ingestion)

| ID | Feature Name | Description & Technical Capability | Target Platform | Priority |
|:---|:---|:---|:---|:---|
| **F01** | **Share Intent Interceptor** | Registers as a native Android Share Target (`ACTION_SEND`) and Web Share target to ingest forwarded messages, referral links, and text blobs directly from messaging apps. | Android / Web | P0 |
| **F02** | **Deep Link & Redirect Unroller** | Follows multi-hop HTTP redirect chains (`301`, `302`, `307`, meta-refresh, JS redirects, shorteners like bit.ly, tinyurl, t.me) safely in a headless sandbox to reveal the canonical destination URL. | Android / Web Backend | P0 |
| **F03** | **Clipboard Sentinel** | Optional background listener (with user opt-in and privacy guard) that scans newly copied text for UPI strings (`upi://pay`), payment links, or suspicious shortened domains. | Android | P1 |
| **F04** | **Optical QR & Quishing Scanner** | High-speed camera scanner with immediate offline parsing of QR codes, separating legitimate merchant payment URIs from malicious web links, collect requests, or phishing redirects. | Android / Web (Camera) | P0 |
| **F05** | **Screenshot & Visual OCR Analyzer** | Allows users to import or share screenshots of payment confirmations, WhatsApp lottery messages, or SMS alerts; runs on-device OCR (ML Kit / Tesseract) to parse text payloads. | Android / Web | P1 |

---

### Phase 2: UNDERSTAND (Threat Analysis & Context Synthesis)

| ID | Feature Name | Description & Technical Capability | Target Platform | Priority |
|:---|:---|:---|:---|:---|
| **F06** | **Payment-Intent Mismatch Engine** *(Core Pillar)* | Cross-references the linguistic claim of a message (e.g., *"You received ₹2,500 reward - Click to credit your account"*) against the underlying technical payload (e.g., executing a `upi://pay?pa=scammer@vpa&am=2500` outbound debit / collect request). Flags inverted financial transactions. | Android / Web | P0 |
| **F07** | **Scam Chain Visualization** *(Core Pillar)* | Graphically constructs and renders the step-by-step vector path: Ingress Message ➔ Shortener Hop ➔ Masquerading Fake Landing Page ➔ Viral WhatsApp Referral Script ➔ Malicious APK / UPI Debit. Gives users instant spatial understanding of the deception. | Android / Web | P0 |
| **F08** | **NLP Urgency & Social Engineering Detector** | On-device lightweight NLP classifier detecting artificial urgency hooks (e.g., *"Account will be blocked in 2 hours"*, *"Limited gift vouchers remaining"*), fear tactics, authority impersonation (e.g., Power Board, Bank KYC, Tax Dept), and false promises. | Android / Web | P0 |
| **F09** | **Domain Age, Typo-Squatting & SSL Fingerprinter** | Evaluates target domain registrations (WHOIS age < 30 days), homograph lookalikes (e.g., `amaz0n-offer.in`, `sb1-online.top`), SSL certificate mismatch, and ASN reputation. | Cloud Intelligence / Web | P0 |
| **F10** | **Malicious APK & Package Payload Inspector** | Inspects APK download links and payload MIME types, warning users if a supposed reward or invoice link attempts to sideload arbitrary Android application packages. | Android | P1 |

---

### Phase 3: PROTECT (Real-Time Enforcement & Safeguards)

| ID | Feature Name | Description & Technical Capability | Target Platform | Priority |
|:---|:---|:---|:---|:---|
| **F11** | **Dynamic Threat Verdict Overlay** | Color-coded, high-clarity overlay modal (Green = Safe, Amber = Caution, Red = Critical Scam) displaying the threat level, reasons, and calculated risk score (0–100) before any link execution. | Android / Web | P0 |
| **F12** | **VPA / UPI ID Blacklist & Reputation Guard** | Real-time verification of recipient Virtual Payment Addresses (VPAs) against known scam registry databases and community reporting feeds. | Android / Web | P0 |
| **F13** | **Isolated Sandbox Web Previewer** | Provides an ephemeral, script-disabled sandbox browser view of the destination webpage, allowing users to inspect the site safely without risk of cookie-theft, auto-downloads, or credential capture. | Android / Web | P1 |
| **F14** | **Phishing App & Brand Impersonation Blocker** | Detects landing pages mimicking popular banking portals, e-commerce giants, or government portals by analyzing visual DOM structure, favicon hashes, and brand keyword dissonance. | Android / Web | P0 |
| **F15** | **Biometric Friction Gate (Guardian Auth)** | For high-risk or critical scam targets, enforces mandatory fingerprint/face unlock and a 5-second reflection timer before allowing intentional manual overrides. | Android | P1 |

---

### Phase 4: RESPOND (Incident Mitigation & Action)

| ID | Feature Name | Description & Technical Capability | Target Platform | Priority |
|:---|:---|:---|:---|:---|
| **F16** | **1-Tap "Warn Group" Counter-Card** | Generates a clean, non-accusatory warning image/text card (e.g., *"RefGuard flagged this link as a fake referral scam. Do not share or click."*) for users to paste back into the originating WhatsApp/Telegram group. | Android / Web | P0 |
| **F17** | **1-Tap Official Cybercrime Report Dispatcher** | Pre-formats and exports standardized incident telemetry (domain, timestamp, screenshot, UPI VPA, scam chain) formatted for National Cyber Crime Reporting Portals (1930 / cybercrime.gov.in) and payment gateway fraud desks. | Android / Web | P1 |
| **F18** | **Victim Recovery Playbook & Emergency Freeze** | Step-by-step guidance if a user has already transacted: emergency bank toll-free hotlines, UPI app transaction dispute filing links, and SIM-swap emergency steps. | Android / Web | P0 |
| **F19** | **Family & Guardian Safety Alerts** | Allows designated family members (e.g., tech-savvy child monitoring elderly parent) to receive instant notifications when a Critical-tier scam interaction is intercepted. | Android / Cloud | P2 |

---

### Phase 5: LEARN (Behavioral Immunity & Education)

| ID | Feature Name | Description & Technical Capability | Target Platform | Priority |
|:---|:---|:---|:---|:---|
| **F20** | **Contextual Micro-Lessons ("Why Was This Flagged?")** | 15-second bite-sized interactive breakdowns attached to each intercepted threat explaining the psychological trick used (e.g., *"How the 'Share to 10 Groups' loop benefits the scammer"*). | Android / Web | P0 |
| **F21** | **Interactive Scam Simulator & Training Dojo** | Safe, gamified simulated scam scenarios (e.g., fake lottery, electricity bill SMS, crypto part-time job) where users practice identifying red flags. | Web / Android | P1 |
| **F22** | **Deconstructed Scam Archive & Case Studies** | Searchable database of real-world trending scam templates deconstructed with annotated callouts showing the hidden traps. | Web / Android | P1 |
| **F23** | **Personal Scam Immunity Score & Badges** | Gamified metric tracking the user's defense history, safe forwards, completed lessons, and threat awareness milestones. | Android / Web | P2 |

---

### Phase 6: IMPROVE (Ecosystem Intelligence & Feedback Loop)

| ID | Feature Name | Description & Technical Capability | Target Platform | Priority |
|:---|:---|:---|:---|:---|
| **F24** | **Crowdsourced Threat Verification & Voting** | Community network where users can flag novel scam patterns; peer and analyst voting rapidly confirms emerging threat campaigns. | Web / Cloud Backend | P0 |
| **F25** | **Zero-Knowledge Privacy-Preserving Telemetry** | Anonymizes URLs by hashing query parameters, stripping personal phone numbers, and submitting only domain topologies and scam signatures to the global threat feed. | Android / Web | P0 |
| **F26** | **False-Positive Appeal & Continuous Calibration** | Fast-path feedback mechanism for legitimate merchants and developers to appeal incorrect risk categorizations, reviewed via automated re-indexing and human verification. | Web / Android | P1 |
| **F27** | **Federated Edge Model Weight Updates** | On-device NLP threat models periodically receive lightweight delta weights based on aggregate global scam linguistics without exporting user interaction logs. | Android / Cloud Backend | P2 |

---

## Summary Matrix Grouping

```
┌─────────────────────────────────────────────────────────────┐
│                      FEATURE SUMMARY                        │
├─────────────────────┬──────────────┬────────────────────────┤
│ Category            │ Count        │ Primary Value          │
├─────────────────────┼──────────────┼────────────────────────┤
│ 1. Discover         │ 5 Features   │ Ingestion & Intercept  │
│ 2. Understand       │ 5 Features   │ Deep Context & NLP     │
│ 3. Protect          │ 5 Features   │ Friction & Enforcement │
│ 4. Respond          │ 4 Features   │ Counter-Action & Report│
│ 5. Learn            │ 4 Features   │ Cognitive Defense      │
│ 6. Improve          │ 4 Features   │ Global Threat Shield   │
├─────────────────────┼──────────────┼────────────────────────┤
│ TOTAL CORE FEATURES │ 27 Features  │ Complete Scam Shield   │
└─────────────────────┴──────────────┴────────────────────────┘
```
