export interface ConversationMessage {
  id: string;
  sender: "victim" | "scammer" | "unknown";
  text: string;
  timestamp?: string;
  flagged_tactics?: string[];
}

export interface ConversationAnalysisResult {
  scam_probability: number; // 0 to 100
  threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_scam_type: string;
  social_engineering_stages: Array<{
    stage_name: string;
    description: string;
    detected: boolean;
    evidence_snippet?: string;
  }>;
  emotional_manipulation_triggers: Array<{
    trigger_name: string;
    intensity: "LOW" | "MEDIUM" | "HIGH";
    explanation: string;
  }>;
  detected_requested_actions: string[];
  extracted_entities: {
    vpas: string[];
    urls: string[];
    phone_numbers: string[];
    amounts: number[];
  };
  recommended_safe_defusal_responses: Array<{
    title: string;
    response_text: string;
    tactic_countered: string;
  }>;
  summary: string;
}

export class ConversationAnalyzer {
  analyzeConversation(transcriptText: string): ConversationAnalysisResult {
    const text = transcriptText || "";
    const lower = text.toLowerCase();

    // 1. Extract entities
    const vpaRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:xyz|top|cc|site|online|link|info)[^\s]*)/gi;
    const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}/g;
    const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/gi;

    const vpas = Array.from(new Set(text.match(vpaRegex) || []));
    const urls = Array.from(new Set(text.match(urlRegex) || []));
    const phoneNumbers = Array.from(new Set(text.match(phoneRegex) || []));

    const amounts: number[] = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      const parsed = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(parsed)) amounts.push(parsed);
    }

    // 2. Emotional Manipulation Triggers
    const triggers: ConversationAnalysisResult["emotional_manipulation_triggers"] = [];

    // Urgency
    if (/urgent|immediately|tonight|within (?:10|15|30|5) mins?|power cut|disconnect|block|turant|jaldi|light cut|current cut/i.test(text)) {
      triggers.push({
        trigger_name: "Artificial Urgency & Panic",
        intensity: "HIGH",
        explanation: "Forces rushed decisions to prevent the victim from verifying claims with official channels."
      });
    }

    // Authority Impersonation
    if (/sbi|hdfc|police|officer|electricity board|customer care|manager|cyber cell|telecom|adhikari|karmchari/i.test(text)) {
      triggers.push({
        trigger_name: "Authority & Institution Impersonation",
        intensity: "HIGH",
        explanation: "Falsely claims official status to induce compliance and suppress skepticism."
      });
    }

    // Reward / Greed Bait
    if (/earn ₹|lottery|bonus|cashback|part[- ]time job|like youtube|daily profit|double|gharbaithe|kamaye|inam/i.test(text)) {
      triggers.push({
        trigger_name: "Unrealistic Financial Incentive Bait",
        intensity: "HIGH",
        explanation: "Promises effortless income or high returns to lure victim into registration fee traps."
      });
    }

    // Fear of Penalty / Loss
    if (/penalty|legal notice|fine|fir|deactivated|frozen|seized|karyawahi|band ho jayega/i.test(text)) {
      triggers.push({
        trigger_name: "Threat of Legal / Financial Penalty",
        intensity: "MEDIUM",
        explanation: "Manufactures consequences for non-compliance to coerce swift action."
      });
    }

    // 3. Social Engineering Stages
    const stages = [
      {
        stage_name: "Stage 1: Initial Hook & Bait",
        description: "Engages victim with tempting reward, job offer, or alarming warning notice.",
        detected: /congratulations|urgent alert|job offer|work from home|power cut|dear customer|badhai|shubh samachar|light cut/i.test(text),
        evidence_snippet: "Initiated contact with unsolicited offer or urgent warning."
      },
      {
        stage_name: "Stage 2: Trust Building & Context Framing",
        description: "Establishes fake legitimacy using bank names, ticket IDs, or Telegram channels.",
        detected: /telegram|whatsapp|executive|support ticket|verified|department|officer|group join/i.test(text),
        evidence_snippet: "Fabricated official credentials or redirected to private messaging channel."
      },
      {
        stage_name: "Stage 3: Pivot to Financial / Credential Demand",
        description: "Requires victim to make a payment, deposit a fee, click a link, or scan QR.",
        detected: /deposit|fee|pay|scan|upi:\/\/|click here|link|registration|paisa bhejo|karo payment|scan karo/i.test(text),
        evidence_snippet: "Requested outbound transfer or external link interaction."
      },
      {
        stage_name: "Stage 4: Credential & OTP Harvest Escalation",
        description: "Demands sensitive OTP, UPI PIN, or screen sharing app to compromise account.",
        detected: /otp|pin|anydesk|teamviewer|rustdesk|share screen|cvv|password|mpin|pin dalo|otp batao/i.test(text),
        evidence_snippet: "Requested security credentials or remote access tools."
      }
    ];

    // 4. Requested Actions
    const actions: string[] = [];
    if (/upi:\/\/|pay|deposit|transfer|send ₹|paisa bhejo|payment karo/i.test(text)) actions.push("Make immediate UPI/Bank Transfer");
    if (/otp|pin|mpin|cvv|otp batao|pin dalo/i.test(text)) actions.push("Share sensitive One-Time Password (OTP) or UPI PIN");
    if (/https?:\/\/|click link|download|apk|link kholo/i.test(text)) actions.push("Click untrusted link or install external application");
    if (/anydesk|teamviewer|rustdesk|quicksupport|screen share/i.test(text)) actions.push("Install remote screen sharing tool");

    // 5. Calculate Score & Threat Level
    let score = 10;
    if (triggers.length > 0) score += triggers.length * 20;
    if (stages.filter(s => s.detected).length >= 2) score += 25;
    if (/otp|pin|anydesk/i.test(text)) score += 35;
    if (vpas.length > 0 && /deposit|fee|activation/i.test(text)) score += 30;
    score = Math.min(100, score);

    let threat_level: ConversationAnalysisResult["threat_level"] = "LOW";
    if (score >= 80) threat_level = "CRITICAL";
    else if (score >= 60) threat_level = "HIGH";
    else if (score >= 35) threat_level = "MEDIUM";

    let primary_scam_type = "Unclassified Suspicious Dialogue";
    if (/job|telegram|like youtube|daily profit/i.test(text)) primary_scam_type = "Task-Based Employment / Advance Fee Scam";
    else if (/electricity|power|bill|disconnect/i.test(text)) primary_scam_type = "Utility Disconnection Threat Impersonation";
    else if (/kyc|bank|sbi|hdfc|blocked|otp/i.test(text)) primary_scam_type = "Bank Account Suspension & OTP Phishing";
    else if (/lottery|reward|scratch card|₹5,000/i.test(text)) primary_scam_type = "Fake Reward / Direction Inversion Lure";

    // 6. Safe Defusal Responses
    const defusalResponses = [
      {
        title: "Official Verification Boundary",
        response_text: "I do not authorize payments or share credentials over chat. I am visiting my nearest official branch / portal directly to verify this status.",
        tactic_countered: "Neutralizes fake authority pressure and breaks conversational urgency."
      },
      {
        title: "No-PIN Inbound Rule Clarification",
        response_text: "According to NPCI banking rules, UPI PIN and OTP are never needed to receive money or refunds. I will not enter my PIN or scan your QR.",
        tactic_countered: "Exposes collect/inversion scam mechanics directly to the scammer."
      },
      {
        title: "Refuse Remote Access / External APK",
        response_text: "I do not install third-party APKs or screen sharing software. Terminating this communication immediately.",
        tactic_countered: "Prevents device takeover and blocks AnyDesk/TeamViewer harvesting."
      }
    ];

    const summary = threat_level === "CRITICAL" || threat_level === "HIGH"
      ? `This conversation displays a high degree of manipulative pressure characteristic of ${primary_scam_type}. The counterparty utilizes ${triggers.map(t => t.trigger_name).join(" and ")} to compel unverified financial actions.`
      : `The conversation exhibits mild conversational ambiguity. Proceed with standard caution.`;

    return {
      scam_probability: score,
      threat_level,
      primary_scam_type,
      social_engineering_stages: stages,
      emotional_manipulation_triggers: triggers,
      detected_requested_actions: actions.length > 0 ? actions : ["Conversational verification"],
      extracted_entities: { vpas, urls, phone_numbers: phoneNumbers, amounts },
      recommended_safe_defusal_responses: defusalResponses,
      summary
    };
  }
}
