import {
  ScanRequest,
  ExtractionResult,
  ExtractedEntity
} from "../types/contracts.js";

export class EntityExtractor {
  public extract(request: ScanRequest): ExtractionResult {
    const rawText = request.content_value || "";
    const extracted: ExtractedEntity[] = [];
    const inferred: ExtractedEntity[] = [];

    // 1. Check for UPI URI (e.g., upi://pay?pa=... or upi://collect?pa=...)
    const upiUriRegex = /upi:\/\/(pay|collect)\?([^\s"'<>]+)/gi;
    let upiMatch: RegExpExecArray | null;
    while ((upiMatch = upiUriRegex.exec(rawText)) !== null) {
      const fullUri = upiMatch[0];
      const actionType = upiMatch[1].toLowerCase();
      extracted.push({
        entity_type: "QR_DATA",
        value: fullUri,
        raw_value: fullUri,
        confidence: 0.99,
        provenance: "UPI_URI_DECODER"
      });

      // Parse query params in UPI URI
      try {
        const params = new URLSearchParams(upiMatch[2]);
        const pa = params.get("pa");
        const pn = params.get("pn");
        const am = params.get("am");
        const cu = params.get("cu") || "INR";

        if (pa) {
          extracted.push({
            entity_type: "UPI_VPA",
            value: pa,
            raw_value: `pa=${pa}`,
            confidence: 0.99,
            provenance: "UPI_URI_PARAM"
          });
        }
        if (pn) {
          extracted.push({
            entity_type: "BRAND",
            value: pn,
            raw_value: `pn=${pn}`,
            confidence: 0.85,
            provenance: "UPI_PAYEE_NAME"
          });
        }
        if (am) {
          const num = parseFloat(am);
          if (!isNaN(num)) {
            extracted.push({
              entity_type: "AMOUNT",
              value: am,
              raw_value: `am=${am}`,
              parsed_amount: num,
              currency: cu,
              confidence: 0.99,
              provenance: "UPI_URI_AMOUNT"
            });
          }
        }

        // Infer actual payment direction from UPI URI scheme
        inferred.push({
          entity_type: "PAYMENT_DIRECTION",
          value: actionType === "collect" ? "OUTBOUND_DEBIT" : "OUTBOUND_DEBIT",
          raw_value: `upi://${actionType}`,
          confidence: 0.95,
          provenance: "UPI_PROTOCOL_ANALYSIS"
        });
      } catch {
        // Continue if URLSearchParams parsing fails
      }
    }

    // 2. Extract standard UPI VPAs (e.g. user@okaxis, support.billing@icici)
    const vpaRegex = /\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/g;
    let vpaMatch: RegExpExecArray | null;
    while ((vpaMatch = vpaRegex.exec(rawText)) !== null) {
      const vpa = vpaMatch[1];
      // Exclude standard email domains unless ending in banking VPA handles
      const commonVpaHandles = [
        "okhdfcbank", "okaxis", "oksbi", "okicici", "paytm", "upi", "ybl",
        "ibl", "axl", "apl", "ptaxis", "ptsbi", "pthdfc", "postbank", "federal",
        "rbl", "kotak", "indus", "barodampay", "aubank", "freecharge"
      ];
      const handle = vpa.split("@")[1]?.toLowerCase();
      const isKnownVpa = commonVpaHandles.includes(handle) || vpa.toLowerCase().includes("upi");

      if (isKnownVpa || !vpa.includes(".com")) {
        extracted.push({
          entity_type: "UPI_VPA",
          value: vpa,
          raw_value: vpaMatch[0],
          confidence: isKnownVpa ? 0.95 : 0.8,
          provenance: "REGEX_VPA_PARSER"
        });
      }
    }

    // 3. Extract URLs & Domains
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/gi;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(rawText)) !== null) {
      const urlStr = urlMatch[1];
      extracted.push({
        entity_type: "URL",
        value: urlStr,
        raw_value: urlStr,
        confidence: 0.98,
        provenance: "URL_EXTRACTOR"
      });

      try {
        const urlObj = new URL(urlStr);
        extracted.push({
          entity_type: "DOMAIN",
          value: urlObj.hostname,
          raw_value: urlObj.hostname,
          confidence: 0.98,
          provenance: "URL_DOMAIN_PARSER"
        });
      } catch {
        // Invalid URL string
      }
    }

    // 4. Extract Amounts (e.g. ₹500, Rs. 3000, Rs 5,000, 500 INR)
    const amountRegex = /(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)|([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:₹|Rs\.?|INR)/gi;
    let amtMatch: RegExpExecArray | null;
    while ((amtMatch = amountRegex.exec(rawText)) !== null) {
      const numStr = (amtMatch[1] || amtMatch[2] || "").replace(/,/g, "");
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0) {
        extracted.push({
          entity_type: "AMOUNT",
          value: numStr,
          raw_value: amtMatch[0],
          parsed_amount: num,
          currency: "INR",
          confidence: 0.9,
          provenance: "CURRENCY_REGEX"
        });
      }
    }

    // 5. Extract Referral Codes (e.g. code: REF123, use code XYZ99, ref=ABC)
    const refCodeRegex = /(?:code|ref|referral|invite|coupon)[\s:=]+([A-Z0-9_\-]{4,15})\b/gi;
    let refMatch: RegExpExecArray | null;
    while ((refMatch = refCodeRegex.exec(rawText)) !== null) {
      extracted.push({
        entity_type: "REFERRAL_CODE",
        value: refMatch[1],
        raw_value: refMatch[0],
        confidence: 0.85,
        provenance: "REFERRAL_CODE_PARSER"
      });
    }

    // 6. Extract Brands
    const knownBrands = [
      "Google Pay", "GPay", "PhonePe", "Paytm", "BHIM", "SBI", "HDFC", "ICICI",
      "Axis Bank", "Kotak", "Amazon Pay", "Cred", "Telegram", "WhatsApp", "Electricity Board",
      "BESCOM", "Tata Power", "MSEDCL"
    ];
    for (const brand of knownBrands) {
      const brandRegex = new RegExp(`\\b${brand}\\b`, "i");
      if (brandRegex.test(rawText)) {
        extracted.push({
          entity_type: "BRAND",
          value: brand,
          raw_value: brand,
          confidence: 0.88,
          provenance: "BRAND_DICTIONARY"
        });
      }
    }

    // 7. Extract Phone Numbers (Indian format +91-9876543210 or 10 digits starting with 6-9)
    const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g;
    let phoneMatch: RegExpExecArray | null;
    while ((phoneMatch = phoneRegex.exec(rawText)) !== null) {
      extracted.push({
        entity_type: "PHONE",
        value: phoneMatch[0],
        raw_value: phoneMatch[0],
        confidence: 0.85,
        provenance: "PHONE_REGEX"
      });
    }

    // 8. Infer payment intent from natural language (including Hinglish/Hindi/Tamil/Telugu)
    const inboundIntentKeywords = [
      "cashback", "reward", "won", "winner", "receive", "credited", "refund", "claim",
      "prize", "scratch card", "lottery", "bonus", "instant transfer to your account",
      "paise aayenge", "paisa milega", "inam", "lottery lag gayi", "panam vandhuruchu", "dabbu vachindi"
    ];
    const lowerText = rawText.toLowerCase();
    const hasInboundIntent = inboundIntentKeywords.some(kw => lowerText.includes(kw));

    if (hasInboundIntent) {
      inferred.push({
        entity_type: "PAYMENT_DIRECTION",
        value: "INBOUND_CREDIT",
        raw_value: "Language claiming inbound financial reward/credit",
        confidence: 0.9,
        provenance: "NLP_INTENT_CLASSIFIER"
      });
    }

    // Add general text entity
    extracted.push({
      entity_type: "TEXT",
      value: rawText.length > 200 ? rawText.substring(0, 200) + "..." : rawText,
      raw_value: rawText,
      confidence: 1.0,
      provenance: "RAW_INPUT"
    });

    return {
      extracted_entities: extracted,
      inferred_entities: inferred
    };
  }
}
