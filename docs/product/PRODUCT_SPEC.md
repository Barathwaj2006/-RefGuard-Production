# RefGuard — Product Specification (Phase 1)
**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Implementation  
**Author:** Agent 0 (Master Architect)  
**Target Platforms:** Android (Kotlin / Jetpack Compose) & Web (React / TypeScript)  

---

## 1. Executive Summary & Core Mission

> **RefGuard Core Mission:**  
> *"Check before you click, pay, or share."*

**RefGuard** is an ambient, AI-powered digital payment and referral scam shield engineered to safeguard users against the rapid proliferation of modern financial engineering, deceptive referral schemes, QR phishing ("quishing"), UPI/payment-intent fraud, and social engineering attacks.

Unlike conventional antivirus engines that focus primarily on file payloads or post-breach detection, RefGuard operates at the **pre-transaction behavioral layer**, intercepting and demystifying suspicious links, QR codes, payment intents, and referral traps *before* money moves or malicious links propagate through social circles.

---

## 2. The Problem Space

### 2.1 Scams Start Before the Payment Gateway
Modern digital scams do not begin when a user inputs their UPI PIN or credit card credentials. They begin upstream through psychological manipulation and deceptive entry points:

```
[Social Engineering / Greed / Fear Hook]
                │
                ▼
[Deceptive Referral / Shortened Link / QR Code]
                │
                ▼
[Misleading Web Page / Malicious APK / Masquerading Form]
                │
                ▼
[Payment-Intent Mismatch (Collect vs. Receive)]
                │
                ▼
[Irreversible Financial Loss & Viral Viralization]
```

Current payment apps (Google Pay, PhonePe, Paytm, Banking Apps) protect the cryptographic transaction channel itself, but are blind to the **upstream context**:
1. **Context Blindness:** Payment applications verify that you authenticated the transaction, but cannot determine if you were duped into believing you were *receiving* cashback instead of *paying* a fraudster.
2. **Viral Social Spreading:** Referral scams exploit social trust by demanding users share links to "10 WhatsApp Groups or 5 Friends" to unlock fake monetary rewards, turning victims into unwitting amplifiers.
3. **Quishing & Offline Spoofing:** Replacement or overlay of physical merchant QR codes with malicious "Collect Request" codes or phishing landing pages.
4. **Deep-Link & URL Obfuscation:** Cascades of 302 redirects, URL shorteners, and newly registered homograph domains evade static browser filters.

---

## 3. Target User Personas

RefGuard is designed for four primary user cohorts vulnerable to distinct threat vectors:

### Persona A: The Digital Novice / Elderly User ("Vulnerable Pioneer")
* **Profile:** 50–75+ years old, uses smartphones primarily for WhatsApp family chats, YouTube, and digital utility payments.
* **Vulnerability:** High trust in authority figures, difficulty distinguishing authentic bank SMS from smishing, easily startled by "account suspended" fear hooks.
* **Key RefGuard Value:** Ambient, non-intrusive warning overlays with plain-language explanations; "Guardian Mode" linking alerts to a designated family member.

### Persona B: The Gig Worker & Deal Hunter ("High-Velocity Transactor")
* **Profile:** 18–35 years old, rideshare/delivery partners, college students, active cashback/referral seekers.
* **Vulnerability:** Attracted to "Part-time rating jobs", "₹5000 Amazon festival scratch cards", and viral referral loops; frequent P2P transactor.
* **Key RefGuard Value:** Pre-share safety check, referral scam chain visualization, instant link unrolling, and fake job scam detection.

### Persona C: Small Business Owners & Merchants ("Point-of-Sale Defender")
* **Profile:** Kirana/retail owners, stall operators, freelance service providers using printed QR soundboxes and payment apps.
* **Vulnerability:** QR code tampering on physical stands, screenshot spoofing apps (fake payment confirmation screens), reverse-payment refund traps.
* **Key RefGuard Value:** QR Integrity Scanner, payment confirmation authenticity verifier, reverse collect-request warnings.

### Persona D: Everyday Connected Citizens ("Social Guardian")
* **Profile:** Active on multiple messaging platforms (WhatsApp, Telegram, Discord, SMS); forwards deals and updates to peers.
* **Vulnerability:** Unwittingly circulating referral spam or malicious links across group chats.
* **Key RefGuard Value:** 1-tap "Warn Group" counter-message card, clipboard-level preview, fast reputation scoring.

---

## 4. Product Pillars

| Pillar | Principle | Implementation Reality |
|---|---|---|
| **1. Pre-Transaction Interception** | Intervene before the commitment point | Android Share Sheet hooks, real-time clipboard monitor, camera QR intercept before web browser or payment app launches. |
| **2. Edge-First Intelligence** | Privacy by default, instant latency | On-device NLP heuristics and pattern matching (<50ms) supplemented by asynchronous threat intelligence querying (<200ms). |
| **3. Intent vs. Mechanism Verification** | Validate user expectation against reality | Detect "Payment-Intent Mismatches" where the UI text claims "Claim Prize" but the underlying payload executes an outbound debit / UPI collect request. |
| **4. Explainable, Actionable Scoring** | No black-box warnings | Transparent risk scores (0–100) with visual "Scam Chain" maps and plain-English reasons ("Why is this risky?"). |

---

## 5. Architectural High-Level System Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INGRESS CHANNELS                              │
│  [Android Share Sheet]  │  [Clipboard Stream]  │  [QR Camera Scanner]  │
│  [SMS / Notification]   │  [Manual Input URL]  │  [Screenshot OCR]     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   REFGUARD LOCAL INGESTION & PIPELINE                  │
│  • Deep Link Unroller (Unwinds multi-hop HTTP 301/302 redirects)       │
│  • Tokenizer & Intent Parser (NLP extraction of claimed action)        │
│  • UPI / Payment URI Deconstructor (`pa`, `pn`, `am`, `tr`, `mode`)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│       ON-DEVICE EDGE ENGINE      │ │       HYBRID THREAT CLOUD         │
│  • Regex & Linguistic Urgency    │ │  • Global Malicious Domain Feeds  │
│  • Homograph / Typo-Squatting    │ │  • Known Fraud VPA / UPI Blacklist│
│  • Scam Heuristic Classifier     │ │  • Domain Age & SSL Telemetry     │
│  • Payment-Intent Mismatch Logic │ │  • Community-Reported Hashes      │
└─────────────────┬────────────────┘ └─────────────────┬─────────────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SCAM RISK ENGINE & CHAIN GENERATOR                   │
│  • Aggregate Threat Score (0 - 100)                                     │
│  • Threat Classification: [Clean | Caution | High Risk | Critical]    │
│  • Dynamic Scam Chain Graph Reconstruction                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           ACTION & UI LAYER                            │
│  [Safe Intercept Modal] ── [Explainable Why] ── [1-Tap Warn / Report]  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Success Metrics & Performance KPIs

* **Interception Speed:** Total verdict render time under **250ms** for on-device checks and **<500ms** for full cloud-augmented verdicts.
* **Accuracy Target:** 
  * False Positive Rate: **< 0.15%** for verified authentic merchants and legitimate referral programs.
  * True Detection Rate: **> 98.5%** on known referral scams, phishing links, and deceptive UPI collect requests.
* **User Safety Friction:** 
  * "Safe" links introduce zero blocking delay (non-blocking passive toast).
  * "Critical" threats present a mandatory full-screen friction gate with biometric/explicit multi-step confirmation.
* **Community Impact:** Reduction in viral forward loops within monitored messaging circles by **> 70%** via 1-tap counter-warning cards.
