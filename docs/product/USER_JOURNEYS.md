# RefGuard — User Journeys & Technical Interaction Flows
**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Implementation  
**Classification:** Phase 1 Product Interaction Specifications  

---

## Journey 1: WhatsApp Viral Reward / Referral Scam

### 1.1 Context & Threat Profile
* **Actor:** Sunita (52, home maker, member of several neighborhood WhatsApp groups).
* **Incoming Message:** 
  > *"🎉 Tata Group 150th Anniversary Special Gift! Claim ₹5,000 Free Fuel Voucher or Cash directly in your bank account. Share with 5 groups or 10 friends to activate your gift voucher: `https://tata-gift[.]offer-claim[.]xyz/win?ref=8932`"*
* **Target Trap:** Multi-hop viral referral loop that steals phone numbers, shows adware, and attempts to initiate a reverse UPI collect request of ₹1,499 masquerading as a "Processing Verification Fee".

---

### 1.2 Step-by-Step Flowchart

```
[User Receives WhatsApp Forward]
               │
               ▼
[Action: Long-press message -> Tap Share -> Select 'RefGuard Shield']
               │
               ▼
┌────────────────────────────────────────────────────────┐
│             STEP 1: INGRESS & EXTRACTION               │
│ • Share Intent received: `android.intent.action.SEND`   │
│ • Text regex extracts URL: `https://tata-gift[.]xyz...` │
│ • Clipboard fallback verified                         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             STEP 2: DEEP LINK UNROLLING                │
│ • Sandboxed HTTP HEAD request to unroll redirects:     │
│   Hop 1: `https://tata-gift[.]offer-claim[.]xyz/win`   │
│   Hop 2: `https://302-redirect[.]top/session-893`      │
│   Final: `https://claim-cashback-instant[.]live/pay`   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         STEP 3: MULTI-VECTOR THREAT ANALYSIS           │
│ • NLP Urgency Detector: Matches "Claim ₹5000",         │
│   "Limited Gift", "Share to 5 groups" (Urgency: 94/100)│
│ • Domain Intel: Domain age = 3 days, no legitimate DNS │
│   link to Tata Sons / Official Brands (Risk: High)     │
│ • DOM Inspector: Detects WhatsApp Share Loop Script    │
│ • Payment Intent Parser: Identifies hidden UPI collect │
│   request `upi://pay?pa=fraudhunter@axis&am=1499`      │
│   (Mismatch: Claim is +₹5,000, Reality is -₹1,499)     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             STEP 4: RISK SCORE CALCULATION             │
│ • Score: 98/100 [CRITICAL THREAT: VIRAL REFERRAL SCAM]│
│ • Scam Chain: WhatsApp ➔ Shortener ➔ Loop ➔ UPI Debit  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         STEP 5: REAL-TIME OVERLAY UI SHOWN             │
│ • Screen darkens with high-contrast Red Shield Header  │
│ • Clear headline: "FAKE REWARD / REFERRAL TRAP"        │
│ • Scam Chain Visualized in 4 linked nodes              │
│ • "Payment Intent Mismatch" Callout:                   │
│   "Claims you get ₹5,000, but will charge you ₹1,499"  │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
[Tap: "Warn Group" Counter-Card]  [Tap: "Delete & Block"]
             │                           │
             ▼                           ▼
[Copies polite warning note:      [Closes overlay; logs incident
 "RefGuard verified this link is   telemetry to zero-knowledge
 a scam. Do not share."]           global database]
```

---

### 1.3 UI State Wireframe (WhatsApp Shield Overlay)

```
┌──────────────────────────────────────────────────────┐
│  🛡️ RefGuard Shield Intercept                        │
├──────────────────────────────────────────────────────┤
│  🔴 CRITICAL SCAM DETECTED                           │
│  Risk Score: 98 / 100                                │
│                                                      │
│  ⚠️ DO NOT CLICK, SHARE, OR PAY                      │
│  "This message is a fake referral viral loop."       │
├──────────────────────────────────────────────────────┤
│  ⚡ SCAM CHAIN VISUALIZATION                         │
│                                                      │
│  [WhatsApp Forward] ──▶ [Fake Tata Page]             │
│         │                      │                     │
│         ▼                      ▼                     │
│  [Share Loop: 10 Grps] ─▶ [-₹1,499 Fake UPI Debit]   │
├──────────────────────────────────────────────────────┤
│  🔍 WHY WAS THIS FLAGGED?                            │
│  • Brand Impersonation: Not affiliated with Tata.    │
│  • Domain Age: Registered 3 days ago in Russia.      │
│  • Payment-Intent Mismatch: Promise: +₹5,000         │
│                            Actual: -₹1,499 Debit     │
├──────────────────────────────────────────────────────┤
│  [ 📢 Warn The Group (Copy Card) ]                   │
│  [ 🛡️ Close & Stay Safe ]                            │
└──────────────────────────────────────────────────────┘
```

---

## Journey 2: Physical QR Code Tampering Scam ("Quishing")

### 2.1 Context & Threat Profile
* **Actor:** Rajesh (34, parking his car in a busy commercial complex).
* **Environment:** A printed QR code sticker affixed onto a municipal parking payment board.
* **Target Trap:** Fraudsters pasted a rogue QR code sticker over the official civic payment QR code. The rogue QR encodes a spoofed UPI collect URI that initiates a recurring mandate or direct payment to a private personal VPA instead of the Municipal Corporation account.

---

### 2.2 Step-by-Step Flowchart

```
[User Approaches Parking Meter & Opens RefGuard Camera Scanner]
                                │
                                ▼
┌────────────────────────────────────────────────────────┐
│           STEP 1: OPTICAL SCAN & PARSING               │
│ • Camera stream frames decoded via ZXing/ML Kit        │
│ • Raw Payload Extracted:                               │
│   `upi://pay?pa=fake.parking99@okaxis&pn=SmartParking` │
│   `&mc=0000&tr=REF92831&am=200.00&cu=INR`              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         STEP 2: THREAT INTEL & VPA INTEGRITY           │
│ • VPA Validation Engine queries local cache + cloud:   │
│   - Merchant Category Code (`mc=0000` -> Personal VPA, │
│     NOT an authenticated Municipal Merchant MCC)       │
│   - Payee Name check: `SmartParking` is unverified     │
│   - Payee VPA has 14 negative community reports in     │
│     past 48 hours for "Parking Sticker Tampering"      │
│   - Check if payload is a deceptive "Collect" intent   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             STEP 3: RISK EVALUATION                    │
│ • Risk Score: 92/100 [HIGH RISK: QR STICKER TAMPERING] │
│ • Primary Flag: "Personal Account Masquerading as      │
│   Official Merchant" + "Recent Tampering Reports"      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             STEP 4: HARD BLOCK INTERCEPT               │
│ • Haptic vibration pulse (danger signal)               │
│ • Camera stream freezes with Red Shield Lockout UI     │
│ • Automatic launch of UPI app is BLOCKED               │
│ • Displays Official Merchant comparison:               │
│   - Expected: Municipal Corporation (Verified Blue VPA)│
│   - Found on Sticker: Unverified Personal VPA          │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
[Tap: "Report Tampered QR Code"]  [Tap: "View Safe Merchant Info"]
             │                           │
             ▼                           ▼
[Captures geotag + photo; alerts  [Displays official city parking
 local municipal fraud desk &      app link / verified SMS payment
 payment aggregator to freeze VPA] number]
```

---

### 2.3 UI State Wireframe (Physical QR Scanner Alert)

```
┌──────────────────────────────────────────────────────┐
│  🛡️ RefGuard QR Sentinel                            │
├──────────────────────────────────────────────────────┤
│  ⛔ BLOCKED: TAMPERED QR CODE DETECTED                │
│  Risk Score: 92 / 100                                │
│                                                      │
│  ⚠️ DO NOT SCAN WITH YOUR BANKING APP                │
│  "This physical sticker directs funds to an          │
│   unverified individual, not the parking authority." │
├──────────────────────────────────────────────────────┤
│  🔍 THREAT INTELLIGENCE ANALYSIS                     │
│                                                      │
│  • Intended Target: Municipal Smart Parking          │
│  • Actual Recipient: `fake.parking99@okaxis`         │
│  • Account Type: Personal VPA (MCC: 0000)            │
│  • Community Reports: 14 reports in your vicinity    │
├──────────────────────────────────────────────────────┤
│  📍 LOCATION INCIDENT REPORT                         │
│  Captured: Sector 18 Commercial Parking              │
│                                                      │
│  [ 🚨 Report Physical Tampering to Authorities ]     │
│  [ ℹ️ Find Official Payment Channel ]                 │
└──────────────────────────────────────────────────────┘
```

---

## Edge Case Handling & Fallback Matrices

| Scenario | System Behavior | Fallback / Safety Mechanism |
|:---|:---|:---|
| **No Internet Connection (Offline Mode)** | On-device NLP engine and local sqlite blacklist database evaluate string heuristics immediately. | Flags suspicious syntax with an "Offline Caution" yellow badge; advises waiting for connectivity before paying. |
| **Obfuscated / Broken Redirects** | Headless sandbox timeouts after 3.5s if redirect loops indefinitely. | Automatically scores as High Risk due to anti-analysis evasion tactics. |
| **Legitimate Merchant False Positive** | User or merchant can tap "Verify Identity" with registered business credentials. | Fast-track human verification queue with 15-minute SLA. |
| **Shortened SMS Smishing Link** | Android Notification Listener extracts bit.ly/is.gd links from incoming SMS. | Background unrolling displays a silent safety badge in notification shade. |
