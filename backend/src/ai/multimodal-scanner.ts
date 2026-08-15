import { GoogleGenAI } from "@google/genai";

export interface MultimodalAnalysisResult {
  extracted_text: string;
  detected_vpas: string[];
  detected_urls: string[];
  detected_amounts: string[];
  optical_tampering_detected: boolean;
  visual_signals: string[];
  brand_impersonation?: string;
  confidence: number;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  return aiClient;
}

/**
 * Multimodal Screenshot & QR Vision Scanner
 * Uses Gemini 3.7 Flash to extract visual text, optical tampering cues, and embedded payment parameters.
 */
export async function analyzeScreenshotOrQR(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<MultimodalAnalysisResult> {
  const client = getAiClient();
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "").trim();

  // If payload is already raw text (e.g. mock or pre-extracted OCR text string), use heuristic directly
  const isBase64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  const isLikelyBase64 = isBase64Pattern.test(cleanBase64) && cleanBase64.length > 50 && !cleanBase64.includes(" ");

  if (!isLikelyBase64 || !client) {
    return fallbackOpticalExtraction(imageBase64);
  }

  try {
    const prompt = `Analyze this digital payment receipt, WhatsApp screenshot, or QR code image for cyber fraud detection.
Extract and analyze the following in strict JSON format:
{
  "extracted_text": "all readable text transcribed accurately",
  "detected_vpas": ["list of UPI IDs like user@bank or merchant@icici"],
  "detected_urls": ["list of URLs found"],
  "detected_amounts": ["list of amounts with currency like ₹500, Rs. 1000"],
  "optical_tampering_detected": boolean (true if text font misalignments, forged green checkmarks, or overlay edits exist),
  "visual_signals": ["list of visual deception cues e.g. FAKE_TRANSACTION_STATUS, IMPERSONATED_BANK_HEADER, URGENT_COUNTDOWN_OVERLAY"],
  "brand_impersonation": "name of impersonated brand if any (e.g. Google Pay, PhonePe, SBI, Paytm)",
  "confidence": number between 0.0 and 1.0
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/png"
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText.trim());

    return {
      extracted_text: parsed.extracted_text || "",
      detected_vpas: Array.isArray(parsed.detected_vpas) ? parsed.detected_vpas : [],
      detected_urls: Array.isArray(parsed.detected_urls) ? parsed.detected_urls : [],
      detected_amounts: Array.isArray(parsed.detected_amounts) ? parsed.detected_amounts : [],
      optical_tampering_detected: Boolean(parsed.optical_tampering_detected),
      visual_signals: Array.isArray(parsed.visual_signals) ? parsed.visual_signals : [],
      brand_impersonation: parsed.brand_impersonation || undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9
    };
  } catch (err) {
    console.warn("Gemini multimodal scanning failed, falling back to heuristic parsing:", err);
    return fallbackOpticalExtraction(imageBase64);
  }
}

/**
 * Heuristic optical fallback when vision API is offline
 */
function fallbackOpticalExtraction(base64Payload: string): MultimodalAnalysisResult {
  // Decode text if base64 contains simulated text data or QR URI
  let decodedText = base64Payload;
  try {
    const raw = Buffer.from(base64Payload.replace(/^data:image\/[a-z]+;base64,/, ""), "base64").toString("utf-8");
    if (raw.includes("upi://") || raw.includes("http") || raw.includes("₹") || raw.includes("Rs")) {
      decodedText = raw;
    }
  } catch {
    decodedText = base64Payload;
  }

  const vpas: string[] = [];
  const urls: string[] = [];
  const amounts: string[] = [];
  const signals: string[] = [];

  const vpaRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  const matches = decodedText.match(vpaRegex);
  if (matches) {
    vpas.push(...matches);
  }

  const urlRegex = /https?:\/\/[^\s]+/g;
  const urlMatches = decodedText.match(urlRegex);
  if (urlMatches) {
    urls.push(...urlMatches);
  }

  const amtRegex = /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)/gi;
  let amtMatch;
  while ((amtMatch = amtRegex.exec(decodedText)) !== null) {
    amounts.push(amtMatch[0]);
  }

  if (decodedText.toLowerCase().includes("scratch card") || decodedText.toLowerCase().includes("cashback")) {
    signals.push("PROMOTIONAL_CASHBACK_LURE");
  }
  if (decodedText.toLowerCase().includes("power cut") || decodedText.toLowerCase().includes("disconnected")) {
    signals.push("FEAR_URGENCY_PRESSURE");
  }

  return {
    extracted_text: decodedText || "Optical QR / Screenshot image received for forensic analysis",
    detected_vpas: vpas,
    detected_urls: urls,
    detected_amounts: amounts,
    optical_tampering_detected: false,
    visual_signals: signals,
    confidence: 0.85
  };
}
