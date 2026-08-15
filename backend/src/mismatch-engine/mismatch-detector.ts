import {
  ExtractionResult,
  PaymentIntentMismatch,
  PaymentDirection,
  MismatchStatus
} from "../types/contracts.js";

export class MismatchDetector {
  public detectMismatch(extraction: ExtractionResult, rawText: string): PaymentIntentMismatch {
    // 1. Look for stated inbound intent (e.g. cashback, reward, refund, receive)
    const inboundIntentEntity = extraction.inferred_entities.find(
      e => e.entity_type === "PAYMENT_DIRECTION" && e.value === "INBOUND_CREDIT"
    );

    // 2. Look for actual outbound payment action (e.g. UPI URI `upi://pay` or `upi://collect`, or VPA with parsed amount)
    const outboundIntentEntity = extraction.inferred_entities.find(
      e => e.entity_type === "PAYMENT_DIRECTION" && e.value === "OUTBOUND_DEBIT"
    );

    const vpaEntity = extraction.extracted_entities.find(e => e.entity_type === "UPI_VPA");
    const amountEntity = extraction.extracted_entities.find(e => e.entity_type === "AMOUNT");
    const qrEntity = extraction.extracted_entities.find(e => e.entity_type === "QR_DATA");

    const hasStatedInbound = Boolean(inboundIntentEntity);
    const hasActualPaymentAction = Boolean(qrEntity || vpaEntity || outboundIntentEntity);

    // Contextual phrasing for stated intent
    let statedIntent: string | undefined;
    let actualPaymentAction: string | undefined;
    let paymentDirection: PaymentDirection = "NONE";
    let status: MismatchStatus = "NOT_OBSERVED";
    let confidence = 0.5;
    let provenance = "HEURISTIC_INTENT_EVALUATION";

    const parsedAmt = amountEntity?.parsed_amount;
    const recipientVpa = vpaEntity?.value;

    if (hasStatedInbound && hasActualPaymentAction) {
      // Inversion Detected: User is promised credit/reward, but technical payload triggers a debit request!
      status = "DETECTED";
      paymentDirection = "OUTBOUND_DEBIT";
      statedIntent = parsedAmt
        ? `Receive ₹${parsedAmt} cashback / reward into your bank account`
        : "Receive money / cashback reward";
      actualPaymentAction = parsedAmt && recipientVpa
        ? `Debit ₹${parsedAmt} from your account to ${recipientVpa}`
        : recipientVpa
        ? `Send money / initiate payment to ${recipientVpa}`
        : "Initiate outbound debit transaction from your account";
      confidence = 0.95;
      provenance = "CROSS_MODAL_INTENT_VS_PAYLOAD_ANALYSIS";
    } else if (hasActualPaymentAction) {
      status = "NOT_DETECTED";
      paymentDirection = "OUTBOUND_DEBIT";
      statedIntent = parsedAmt && recipientVpa
        ? `Send ₹${parsedAmt} payment to ${recipientVpa}`
        : "Direct payment transaction";
      actualPaymentAction = statedIntent;
      confidence = 0.9;
      provenance = "CONSISTENT_PAYMENT_PAYLOAD";
    } else if (hasStatedInbound) {
      status = "NOT_OBSERVED";
      paymentDirection = "INBOUND_CREDIT";
      statedIntent = "Text claims incoming financial reward/cashback";
      actualPaymentAction = "No immediate UPI payment payload attached";
      confidence = 0.75;
      provenance = "TEXT_ONLY_INTENT";
    } else {
      status = "NOT_OBSERVED";
      paymentDirection = "NONE";
      confidence = 0.9;
      provenance = "NO_PAYMENT_ENTITIES_OBSERVED";
    }

    return {
      status,
      stated_intent: statedIntent,
      actual_payment_action: actualPaymentAction,
      payment_direction: paymentDirection,
      amount: parsedAmt,
      recipient_vpa: recipientVpa,
      confidence,
      provenance
    };
  }
}
