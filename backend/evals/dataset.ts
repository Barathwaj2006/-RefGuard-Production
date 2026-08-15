import { EvalScenario } from "./types.js";

export const EVALUATION_DATASET: EvalScenario[] = [
  // =========================================================================
  // 1. LEGITIMATE SCENARIOS (8 Scenarios)
  // =========================================================================
  {
    id: "EVAL-LEGIT-01",
    category: "LEGITIMATE",
    name: "Normal P2P Dinner Payment",
    description: "Standard peer-to-peer dinner bill split with clear recipient handle and amount.",
    input: {
      content_type: "TEXT",
      content_value: "Hi Ramesh, paying ₹450 for yesterday dinner split to ramesh.kumar@okaxis. Thanks!",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW",
    minEvidenceItems: 2
  },
  {
    id: "EVAL-LEGIT-02",
    category: "LEGITIMATE",
    name: "Official Bank Merchant Cashback Notification",
    description: "Legitimate bank cashback credit confirmation without outbound payment request or suspicious link.",
    input: {
      content_type: "TEXT",
      content_value: "Your account XX1234 has been credited with ₹75 cashback on your transaction at BigBasket. Ref No: HDFC994827.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-LEGIT-03",
    category: "LEGITIMATE",
    name: "Legitimate Referral Program Sharing",
    description: "Standard app invite link using verified app domain without scam pressure or fee requests.",
    input: {
      content_type: "TEXT",
      content_value: "Hey! Use my referral code SWIGGY50 on Swiggy app to get 50% off on your first order. Download at https://swiggy.com",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-LEGIT-04",
    category: "LEGITIMATE",
    name: "Routine Electricity Bill Statement",
    description: "Monthly utility bill statement with due date from official utility board.",
    input: {
      content_type: "TEXT",
      content_value: "Dear Consumer, your electricity bill for CA No. 10029384 is ₹1,420 due on 25-Aug-2026. View bill at https://tnebnet.org",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-LEGIT-05",
    category: "LEGITIMATE",
    name: "Standard Customer Support Ticket Update",
    description: "Official customer service resolution message with ticket reference number.",
    input: {
      content_type: "TEXT",
      content_value: "Your support request regarding ticket #84920 has been updated by our customer care team. Check status in your app inbox.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["LOW", "MEDIUM"],
    expectedRiskRange: [0, 35],
    expectedPaymentIntentState: ["NOT_OBSERVED", "UNKNOWN"],
    expectedProtectionAction: ["ALLOW", "WARN_CAUTION"]
  },
  {
    id: "EVAL-LEGIT-06",
    category: "LEGITIMATE",
    name: "Direct Merchant UPI Payment Intent",
    description: "Normal merchant checkout UPI payment request with transparent merchant details.",
    input: {
      content_type: "TEXT",
      content_value: "upi://pay?pa=flipkart.pay@icici&pn=Flipkart%20India&am=1299.00&cu=INR&tn=Order%2394820",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-LEGIT-07",
    category: "LEGITIMATE",
    name: "Cab Fare Reimbursement",
    description: "Normal peer-to-peer cab ride split between colleagues.",
    input: {
      content_type: "TEXT",
      content_value: "Sent ₹220 for morning Uber ride to priya.sharma@okhdfcbank. Please check your UPI app.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-LEGIT-08",
    category: "LEGITIMATE",
    name: "Grocery Store QR Payment",
    description: "Routine local store checkout QR code data.",
    input: {
      content_type: "QR",
      content_value: "upi://pay?pa=kirana.store@sbi&pn=Sri%20Krishna%20Stores&am=340.00&cu=INR",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW"
  },

  // =========================================================================
  // 2. SCAM PATTERNS (12 Scenarios)
  // =========================================================================
  {
    id: "EVAL-SCAM-01",
    category: "SCAM_PATTERN",
    name: "Fake Cashback Scratch Card Lure",
    description: "Lure promising high cashback reward via external malicious link.",
    input: {
      content_type: "TEXT",
      content_value: "Congratulations! You have won ₹2,499 GPay Scratch Card reward! Click here to claim into bank account: http://claim-reward-gpay.xyz",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["MALICIOUS_DOMAIN_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-02",
    category: "SCAM_PATTERN",
    name: "Fake Failed-Transaction Refund Scheme",
    description: "Deceptive customer care refund link claiming money return.",
    input: {
      content_type: "TEXT",
      content_value: "Dear user, your failed transaction refund of ₹1,850 is waiting. Click http://refund-portal-desk.online or pay to refund-claim-desk@upi",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [65, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedPaymentIntentState: "DETECTED"
  },
  {
    id: "EVAL-SCAM-03",
    category: "SCAM_PATTERN",
    name: "Small Verification Fee Deposit Scam",
    description: "Demanding small token amount to unlock massive cashback credit.",
    input: {
      content_type: "TEXT",
      content_value: "You won ₹10,000 cash prize! Deposit ₹10 verification charge to verify_reward@okaxis to receive full ₹10,000 in your bank account.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [70, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["ADVANCE_FEE_TASK_FRAUD", "PAYMENT_INTENT_MISMATCH"]
  },
  {
    id: "EVAL-SCAM-04",
    category: "SCAM_PATTERN",
    name: "Electricity Disconnection Threat Panic",
    description: "Urgent power cutoff threat demanding immediate payment to unverified VPA.",
    input: {
      content_type: "TEXT",
      content_value: "URGENT: Your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Pay immediately to urgent-power-bill@okhdfcbank to prevent disconnection.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [75, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["FEAR_URGENCY_PRESSURE", "MALICIOUS_UPI_VPA_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-05",
    category: "SCAM_PATTERN",
    name: "Bank KYC Expiration Block Urgency",
    description: "Impersonating bank compliance demanding instant KYC update to avoid account suspension.",
    input: {
      content_type: "TEXT",
      content_value: "Dear SBI customer, your netbanking account is suspended today due to KYC incomplete. Update immediately at http://sbi-kyc-verification.site within 24 hours.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [75, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["FEAR_URGENCY_PRESSURE", "MALICIOUS_DOMAIN_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-06",
    category: "SCAM_PATTERN",
    name: "Fake Customer Care Search Poisoning",
    description: "Fake support helpline number redirecting to fraudulent collector.",
    input: {
      content_type: "TEXT",
      content_value: "Paytm official 24x7 customer care support helpline: Contact toll-free helpdesk officer at customercare-helpline@okaxis for immediate issue resolution.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [65, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["CUSTOMER_CARE_IMPERSONATION", "MALICIOUS_UPI_VPA_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-07",
    category: "SCAM_PATTERN",
    name: "Telegram Video Like Part-Time Job Fraud",
    description: "Task job scam promising daily salary after paying security deposit.",
    input: {
      content_type: "TEXT",
      content_value: "Earn daily ₹3,500 by liking YouTube videos & Telegram tasks! Part-time work from home salary guaranteed. Deposit ₹500 security fee to task_admin@okaxis to join.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [70, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["ADVANCE_FEE_TASK_FRAUD"]
  },
  {
    id: "EVAL-SCAM-08",
    category: "SCAM_PATTERN",
    name: "Viral WhatsApp Free Recharge Pyramid",
    description: "Viral distribution message claiming free phone recharge if forwarded to 10 groups.",
    input: {
      content_type: "TEXT",
      content_value: "Government offering ₹599 free recharge for all 5G users! Forward to 10 WhatsApp groups and claim at http://free-recharge-offer.top now!",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [75, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["VIRAL_PYRAMID_REFERRAL_LURE", "MALICIOUS_DOMAIN_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-09",
    category: "SCAM_PATTERN",
    name: "Obfuscated Short Link to Malicious Dropper",
    description: "Masked URL redirecting users to an unverified APK payload.",
    input: {
      content_type: "TEXT",
      content_value: "Exclusive festival rewards: Click https://bit.ly/secure-gift to download official reward voucher app.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [50, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["OBFUSCATED_SHORT_URL"]
  },
  {
    id: "EVAL-SCAM-10",
    category: "SCAM_PATTERN",
    name: "Blacklisted Lottery Scam VPA",
    description: "Direct payment collect from known lottery fraud handle.",
    input: {
      content_type: "TEXT",
      content_value: "Dear winner, claim your ₹25,00,000 Kaun Banega Crorepati lottery prize. Transfer registration charge to scam-lottery@paytm immediately.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "CRITICAL",
    expectedRiskRange: [80, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["MALICIOUS_UPI_VPA_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-11",
    category: "SCAM_PATTERN",
    name: "Deceptive Optical QR Quishing Scan",
    description: "QR payload presenting itself as reward receiver but executing a debit payment.",
    input: {
      content_type: "QR",
      content_value: "upi://pay?pa=cashback-reward-claim@upi&pn=Cashback%20Reward&am=2000.00&cu=INR",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [75, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["MALICIOUS_UPI_VPA_IDENTIFIED"]
  },
  {
    id: "EVAL-SCAM-12",
    category: "SCAM_PATTERN",
    name: "SIM Card Deactivation Panic Scam",
    description: "Urgent message warning of immediate SIM card deactivation unless verified.",
    input: {
      content_type: "TEXT",
      content_value: "Dear customer, your SIM card will be deactivated today due to incomplete KYC. Call immediately on helpline to submit KYC documents.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["MEDIUM", "HIGH"],
    expectedRiskRange: [30, 75],
    expectedProtectionAction: ["WARN_CAUTION", "DISCOURAGE_PROCEED"],
    expectedSignals: ["FEAR_URGENCY_PRESSURE"]
  },

  // =========================================================================
  // 3. PAYMENT-INTENT MISMATCH (8 Scenarios)
  // =========================================================================
  {
    id: "EVAL-MISMATCH-01",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Inverted Direction: Receive ₹500 vs Send UPI Pay",
    description: "Promising incoming refund while prompting user to authorize a debit transaction.",
    input: {
      content_type: "TEXT",
      content_value: "You will receive ₹500 cashback settlement. Please pay ₹500 to merchant@upi to complete the transfer.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [55, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["PAYMENT_INTENT_MISMATCH"]
  },
  {
    id: "EVAL-MISMATCH-02",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "QR Collect disguised as Receive Money",
    description: "Scanned QR code claiming to be 'Scan QR to Receive ₹1,500' but executing upi://pay debit.",
    input: {
      content_type: "QR",
      content_value: "upi://pay?pa=merchant.settle@axis&pn=Cash%20Settlement&am=1500.00&cu=INR",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["LOW", "MEDIUM", "HIGH"],
    expectedRiskRange: [0, 80],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: ["ALLOW", "WARN_CAUTION", "DISCOURAGE_PROCEED"]
  },
  {
    id: "EVAL-MISMATCH-03",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Claim Cashback with Inverted UPI Transfer",
    description: "Claim cashback lure prompting a direct money transfer.",
    input: {
      content_type: "TEXT",
      content_value: "Claim cashback of ₹800! Send money through UPI to claim_cashback@oksbi to receive credited funds.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [50, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["PAYMENT_INTENT_MISMATCH"]
  },
  {
    id: "EVAL-MISMATCH-04",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Genuine Outbound Payment (State: NOT_DETECTED)",
    description: "Explicit intent to send money matches outbound transaction payload.",
    input: {
      content_type: "TEXT",
      content_value: "Paying ₹1,200 for grocery purchase to bigbasket@hdfcbank.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-MISMATCH-05",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Ambiguous Urgency with No Direct Payload (State: UNKNOWN)",
    description: "Urgent electricity message containing support cues but without attached UPI payment handle.",
    input: {
      content_type: "TEXT",
      content_value: "Urgent notice: Your electricity power connection will be cut due to pending verification. Contact customer care desk.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["MEDIUM", "HIGH"],
    expectedRiskRange: [30, 75],
    expectedPaymentIntentState: "UNKNOWN",
    expectedProtectionAction: ["WARN_CAUTION", "DISCOURAGE_PROCEED"]
  },
  {
    id: "EVAL-MISMATCH-06",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Non-Payment Conversational Chat (State: NOT_OBSERVED)",
    description: "Ordinary text message with zero payment claims or payment endpoints.",
    input: {
      content_type: "TEXT",
      content_value: "Hey, are you free for a call this evening around 6 PM?",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-MISMATCH-07",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Incoming Cashback Claim without Outbound Payload (State: NOT_OBSERVED)",
    description: "Pure reward notification with no payment payload or VPA attached.",
    input: {
      content_type: "TEXT",
      content_value: "You have earned 200 reward points on your recent purchase. Redeem inside your banking app.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-MISMATCH-08",
    category: "PAYMENT_INTENT_MISMATCH",
    name: "Refund Settlement Fee Trap Inversion",
    description: "Stated credit of ₹4,000 coupled with actual debit of ₹25 token.",
    input: {
      content_type: "TEXT",
      content_value: "Receive ₹4,000 refund settlement. Pay ₹25 token charge to settle_refund@paytm to release funds.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [65, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["PAYMENT_INTENT_MISMATCH"]
  },

  // =========================================================================
  // 4. MULTI-HOP SCAM CHAINS (6 Scenarios)
  // =========================================================================
  {
    id: "EVAL-CHAIN-01",
    category: "MULTI_HOP_CHAIN",
    name: "Full Multi-Hop: Message -> Referral -> Short Link -> Landing Page -> UPI -> Action",
    description: "Complex viral reward lure traversing short link, redirect domain, and UPI collect receiver.",
    input: {
      content_type: "TEXT",
      content_value: "Festival Bonus! Claim ₹3,000 reward using referral code DIWALI50. Visit https://bit.ly/festive-cash and pay token to claim-reward-desk@upi",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedNodeTypesInChain: ["MESSAGE", "REFERRAL", "SHORT_LINK", "UPI_REQUEST", "PAYMENT_ACTION"]
  },
  {
    id: "EVAL-CHAIN-02",
    category: "MULTI_HOP_CHAIN",
    name: "Two-Hop: Message -> Short Link",
    description: "Simple lure directing user to a shortened URL.",
    input: {
      content_type: "TEXT",
      content_value: "Check your pending invoice status here: https://tinyurl.com/invoice-9482",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [50, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedNodeTypesInChain: ["MESSAGE", "SHORT_LINK"]
  },
  {
    id: "EVAL-CHAIN-03",
    category: "MULTI_HOP_CHAIN",
    name: "Three-Hop: Message -> Referral -> Landing Page",
    description: "Referral promotion redirecting to promotional domain.",
    input: {
      content_type: "TEXT",
      content_value: "Use referral code WINNER99 at https://claim-reward-gpay.xyz to unlock your lottery.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [65, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedNodeTypesInChain: ["MESSAGE", "REFERRAL", "LANDING_PAGE"]
  },
  {
    id: "EVAL-CHAIN-04",
    category: "MULTI_HOP_CHAIN",
    name: "Three-Hop: Message -> UPI Request -> Payment Action",
    description: "Direct message leading directly to UPI payment execution.",
    input: {
      content_type: "TEXT",
      content_value: "Please transfer ₹600 for maintenance charges to society.office@icici",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW",
    expectedNodeTypesInChain: ["MESSAGE", "UPI_REQUEST", "PAYMENT_ACTION"]
  },
  {
    id: "EVAL-CHAIN-05",
    category: "MULTI_HOP_CHAIN",
    name: "Quishing Multi-Hop: QR -> UPI Request -> Payment Action",
    description: "Scanned QR code parsed into structured UPI request and triggered action nodes.",
    input: {
      content_type: "QR",
      content_value: "upi://pay?pa=restaurant.pos@hdfcbank&pn=Urban%20Bistro&am=850.00&cu=INR",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW",
    expectedNodeTypesInChain: ["MESSAGE", "UPI_REQUEST", "PAYMENT_ACTION"]
  },
  {
    id: "EVAL-CHAIN-06",
    category: "MULTI_HOP_CHAIN",
    name: "Four-Hop: Message -> Referral -> UPI Request -> Payment Action",
    description: "Referral campaign directly prompting a UPI transaction.",
    input: {
      content_type: "TEXT",
      content_value: "Apply promo code FEST50 and transfer ₹499 to festival_store@okaxis to receive gift hamper.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["LOW", "MEDIUM", "HIGH"],
    expectedRiskRange: [0, 75],
    expectedProtectionAction: ["ALLOW", "WARN_CAUTION", "DISCOURAGE_PROCEED"],
    expectedNodeTypesInChain: ["MESSAGE", "REFERRAL", "UPI_REQUEST", "PAYMENT_ACTION"]
  },

  // =========================================================================
  // 5. PRIVACY ATTACKS & CREDENTIAL HARVESTING (8 Scenarios)
  // =========================================================================
  {
    id: "EVAL-PRIVACY-01",
    category: "PRIVACY_ATTACK",
    name: "Direct OTP Solicitation Scheme",
    description: "Attacker soliciting bank OTP under pretext of KYC or account unlock.",
    input: {
      content_type: "TEXT",
      content_value: "Your Bank verification code is 849201. Share this OTP with customer executive to unblock card.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["849201"]
  },
  {
    id: "EVAL-PRIVACY-02",
    category: "PRIVACY_ATTACK",
    name: "UPI PIN Enter to Receive Money Scam",
    description: "Deceptive claim asking user to enter UPI PIN to receive incoming cashback.",
    input: {
      content_type: "TEXT",
      content_value: "To receive ₹2,000 cashback, enter your UPI PIN 7391 on the payment prompt.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["7391"]
  },
  {
    id: "EVAL-PRIVACY-03",
    category: "PRIVACY_ATTACK",
    name: "Credit Card CVV Solicitation",
    description: "Phishing attempt asking for card security CVV number.",
    input: {
      content_type: "TEXT",
      content_value: "Update card details for rewards: Enter card ending in 4421 and CVV 839 to verify ownership.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["839"]
  },
  {
    id: "EVAL-PRIVACY-04",
    category: "PRIVACY_ATTACK",
    name: "NetBanking Password Solicitation",
    description: "Fake security check requesting banking password.",
    input: {
      content_type: "TEXT",
      content_value: "Security Alert: Verify netbanking account. Your temporary password is SecurePass#2026.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["SecurePass#2026"]
  },
  {
    id: "EVAL-PRIVACY-05",
    category: "PRIVACY_ATTACK",
    name: "Full 16-Digit Payment Card Number Solicitation",
    description: "Phishing message containing full debit card number.",
    input: {
      content_type: "TEXT",
      content_value: "Card verification required for Visa card 4532015982941029 to prevent auto-debit failure.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["4532015982941029"]
  },
  {
    id: "EVAL-PRIVACY-06",
    category: "PRIVACY_ATTACK",
    name: "Combined OTP and MPIN Harvest",
    description: "Aggressive attack soliciting both mobile OTP and 6-digit MPIN.",
    input: {
      content_type: "TEXT",
      content_value: "Enter UPI MPIN 928371 and OTP 492019 to authenticate your instant ₹5,000 refund credit.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["928371", "492019"]
  },
  {
    id: "EVAL-PRIVACY-07",
    category: "PRIVACY_ATTACK",
    name: "Fake Bank Login Credentials Prompt",
    description: "Message requesting username and password for account verification.",
    input: {
      content_type: "TEXT",
      content_value: "Dear customer, your login passwd is MySecretPass99. Confirm now to keep your account active.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["MySecretPass99"]
  },
  {
    id: "EVAL-PRIVACY-08",
    category: "PRIVACY_ATTACK",
    name: "ATM PIN Harvesting Lure",
    description: "Message asking for ATM PIN to unlock blocked debit card.",
    input: {
      content_type: "TEXT",
      content_value: "Debit card blocked. Type your ATM PIN 6029 to re-activate cash withdrawal services.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [60, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["SENSITIVE_CREDENTIAL_SOLICITATION"],
    sensitiveDataMustBeScrubbed: true,
    unredactedSecretsToVerifyAbsent: ["6029"]
  },

  // =========================================================================
  // 6. AMBIGUOUS & UNKNOWN INPUTS (8 Scenarios)
  // =========================================================================
  {
    id: "EVAL-UNKNOWN-01",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Incomplete / Malformed URL Fragment",
    description: "Truncated web URL without domain structure or payment intent.",
    input: {
      content_type: "TEXT",
      content_value: "Check info at http:// or https://",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-02",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Unseen / Unknown Neutral UPI VPA",
    description: "Clean payment to an unfamiliar VPA with no prior threat history.",
    input: {
      content_type: "TEXT",
      content_value: "Sending ₹350 for books to unknown.vendor2026@oksbi",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_DETECTED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-03",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Ambiguous Inbound Greeting without Payment Payload",
    description: "Friendly congratulations greeting without links, amounts, or payment VPAs.",
    input: {
      content_type: "TEXT",
      content_value: "Congratulations on your new job role! Wishing you all the best for the new beginning.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-04",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Vague Meeting Logistics Reminder",
    description: "Non-financial scheduling message with no threat indicators.",
    input: {
      content_type: "TEXT",
      content_value: "Team standup rescheduled to 11:30 AM in Conference Room B.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-05",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Contradictory Claim without Direct Payment Handler",
    description: "Confusing text mentioning refund and deduction but offering no payment handle.",
    input: {
      content_type: "TEXT",
      content_value: "Refund processed and bill payment debited on the same day for your monthly statement.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-06",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Empty / Minimalist Input String",
    description: "Extremely short neutral input testing boundary conditions.",
    input: {
      content_type: "TEXT",
      content_value: "OK thanks",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-07",
    category: "AMBIGUOUS_UNKNOWN",
    name: "Generic Tracking Number Notice",
    description: "Courier tracking update with neutral alphanumeric identifier.",
    input: {
      content_type: "TEXT",
      content_value: "Your parcel with tracking ID IN9842019482 is out for delivery today by 5 PM.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },
  {
    id: "EVAL-UNKNOWN-08",
    category: "AMBIGUOUS_UNKNOWN",
    name: "General OTP Informational Alert without Solicitation",
    description: "Bank security alert reminding users never to share OTPs (educational/legit alert).",
    input: {
      content_type: "TEXT",
      content_value: "Alert from Security Team: Official representatives never ask for confidential banking credentials. Keep your verification codes secure.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  },

  // =========================================================================
  // 7. ADVERSARIAL CASES (8 Scenarios)
  // =========================================================================
  {
    id: "EVAL-ADV-01",
    category: "ADVERSARIAL",
    name: "Scam Claim with Legitimate Trusted Domain",
    description: "Scam claim mimicking rewards but embedding an official google.com link.",
    input: {
      content_type: "TEXT",
      content_value: "Click here to claim ₹5,000 instant lucky bonus: https://pay.google.com and win lottery",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["LOW", "MEDIUM"],
    expectedRiskRange: [0, 45],
    expectedProtectionAction: ["ALLOW", "WARN_CAUTION"]
  },
  {
    id: "EVAL-ADV-02",
    category: "ADVERSARIAL",
    name: "Legitimate Wording with 'Pay' and 'Refund' in Same Message",
    description: "Accountant message discussing customer refund and vendor payment legitimately.",
    input: {
      content_type: "TEXT",
      content_value: "We processed customer refund of ₹300 and need to pay vendor ₹700 to vendor@hdfcbank.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [50, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED"
  },
  {
    id: "EVAL-ADV-03",
    category: "ADVERSARIAL",
    name: "Hinglish / Mixed-Language Urgency Scheme",
    description: "Urgent electricity disconnection message written in mixed Hindi-English script.",
    input: {
      content_type: "TEXT",
      content_value: "Aapka electricity bill pending hai. Power will be disconnected tonight at 9:30 PM. Contact electricity-bill-pay@ybl immediately.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [75, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["FEAR_URGENCY_PRESSURE", "MALICIOUS_UPI_VPA_IDENTIFIED"]
  },
  {
    id: "EVAL-ADV-04",
    category: "ADVERSARIAL",
    name: "Misleading Urgency in Benign Flight Reminder",
    description: "Flight boarding call using urgent wording in a completely non-financial scenario.",
    input: {
      content_type: "TEXT",
      content_value: "URGENT: Flight 6E-204 to Mumbai is now boarding at Gate 14. Board immediately to avoid baggage offload.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["LOW", "MEDIUM"],
    expectedRiskRange: [0, 35],
    expectedPaymentIntentState: ["NOT_OBSERVED", "UNKNOWN"],
    expectedProtectionAction: ["ALLOW", "WARN_CAUTION"]
  },
  {
    id: "EVAL-ADV-05",
    category: "ADVERSARIAL",
    name: "Multiple URLs in Single Message (Safe and Suspicious)",
    description: "Message containing a safe domain alongside an obfuscated short link.",
    input: {
      content_type: "TEXT",
      content_value: "Visit official site at https://npci.org.in or check quick rewards at https://bit.ly/claim-npci-gift",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [50, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["OBFUSCATED_SHORT_URL"]
  },
  {
    id: "EVAL-ADV-06",
    category: "ADVERSARIAL",
    name: "Multiple Payment Directions in Single Context",
    description: "Message noting both money received and money sent in a single status recap.",
    input: {
      content_type: "TEXT",
      content_value: "Received ₹500 from Alice and sent ₹500 to bob@okaxis for shared lunch.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [50, 100],
    expectedPaymentIntentState: "DETECTED",
    expectedProtectionAction: "DISCOURAGE_PROCEED"
  },
  {
    id: "EVAL-ADV-07",
    category: "ADVERSARIAL",
    name: "Typosquatting Subdomain Simulation",
    description: "Phishing lure using an impersonated sub-portal domain.",
    input: {
      content_type: "TEXT",
      content_value: "Your KYC expired. Update credentials on http://sbi-kyc-verification.site to prevent account lock.",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: ["HIGH", "CRITICAL"],
    expectedRiskRange: [75, 100],
    expectedProtectionAction: "DISCOURAGE_PROCEED",
    expectedSignals: ["MALICIOUS_DOMAIN_IDENTIFIED"]
  },
  {
    id: "EVAL-ADV-08",
    category: "ADVERSARIAL",
    name: "Legitimate Referral with High Amount Value",
    description: "Real enterprise cloud referral program with large credit numbers.",
    input: {
      content_type: "TEXT",
      content_value: "Refer a business partner to AWS Cloud and get $500 cloud credits. Share link https://amazon.in/referral",
      timestamp: "2026-08-14T09:00:00.000Z"
    },
    expectedRiskSeverity: "LOW",
    expectedRiskRange: [0, 24],
    expectedPaymentIntentState: "NOT_OBSERVED",
    expectedProtectionAction: "ALLOW"
  }
];
