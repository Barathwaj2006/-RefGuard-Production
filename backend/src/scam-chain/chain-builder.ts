import {
  ExtractionResult,
  PaymentIntentMismatch,
  EvidencePack,
  ScamChain,
  ScamChainNode,
  ScamChainEdge
} from "../types/contracts.js";

export class ScamChainBuilder {
  public buildChain(
    rawText: string,
    extraction: ExtractionResult,
    mismatch: PaymentIntentMismatch,
    evidencePack: EvidencePack
  ): ScamChain | undefined {
    const nodes: ScamChainNode[] = [];
    const edges: ScamChainEdge[] = [];

    let nodeIdx = 1;
    const msgNodeId = `n${nodeIdx++}`;

    // Get all evidence IDs
    const allEvidenceIds = evidencePack.items.map(i => i.evidence_id);
    const contentEvid = evidencePack.items.filter(i => i.evidence_type === "ORIGINAL_CONTENT").map(i => i.evidence_id);
    const upiEvid = evidencePack.items.filter(i => i.evidence_type === "UPI_IDENTIFIER").map(i => i.evidence_id);
    const urlEvid = evidencePack.items.filter(i => i.evidence_type === "URL").map(i => i.evidence_id);
    const riskEvid = evidencePack.items.filter(i => i.evidence_type === "RISK_SIGNAL").map(i => i.evidence_id);

    // 1. Initial Message / Context Node
    nodes.push({
      node_id: msgNodeId,
      node_type: "MESSAGE",
      entity_reference: rawText.length > 50 ? rawText.substring(0, 50) + "..." : rawText,
      evidence_references: contentEvid
    });

    let previousNodeId = msgNodeId;

    // 2. Check for Referral Code
    const refEntity = extraction.extracted_entities.find(e => e.entity_type === "REFERRAL_CODE");
    if (refEntity && refEntity.value) {
      const refNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: refNodeId,
        node_type: "REFERRAL",
        entity_reference: refEntity.value,
        evidence_references: allEvidenceIds.slice(0, 2)
      });
      edges.push({
        from_node: previousNodeId,
        to_node: refNodeId,
        relationship: "CONTAINS",
        confidence: 0.95,
        provenance: "EXTRACTION_PARSER",
        evidence_references: allEvidenceIds.slice(0, 2)
      });
      previousNodeId = refNodeId;
    }

    // 3. Check for Short Link / URL / Landing Page
    const urlEntity = extraction.extracted_entities.find(e => e.entity_type === "URL");
    const domainEntity = extraction.extracted_entities.find(e => e.entity_type === "DOMAIN");

    if (urlEntity && urlEntity.value) {
      const isShortLink = /bit\.ly|tinyurl|t\.me|cutt\.ly|is\.gd|rb\.gy/i.test(urlEntity.value);
      const urlNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: urlNodeId,
        node_type: isShortLink ? "SHORT_LINK" : "LANDING_PAGE",
        entity_reference: urlEntity.value,
        evidence_references: urlEvid
      });
      edges.push({
        from_node: previousNodeId,
        to_node: urlNodeId,
        relationship: isShortLink ? "MASKS_DESTINATION" : "LEADS_TO",
        confidence: 0.9,
        provenance: "URL_LINKAGE",
        evidence_references: urlEvid
      });
      previousNodeId = urlNodeId;

      if (isShortLink && domainEntity) {
        const landingNodeId = `n${nodeIdx++}`;
        nodes.push({
          node_id: landingNodeId,
          node_type: "LANDING_PAGE",
          entity_reference: domainEntity.value || "Phishing Destination Portal",
          evidence_references: urlEvid
        });
        edges.push({
          from_node: urlNodeId,
          to_node: landingNodeId,
          relationship: "REDIRECTS_TO",
          confidence: 0.85,
          provenance: "REDIRECT_SIMULATION",
          evidence_references: urlEvid
        });
        previousNodeId = landingNodeId;
      }
    }

    // 4. Check for UPI Request / Payment Action / Inversion
    const vpaEntity = extraction.extracted_entities.find(e => e.entity_type === "UPI_VPA");
    const qrEntity = extraction.extracted_entities.find(e => e.entity_type === "QR_DATA");

    if (qrEntity || vpaEntity || mismatch.status === "DETECTED") {
      const upiNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: upiNodeId,
        node_type: "UPI_REQUEST",
        entity_reference: vpaEntity?.value || qrEntity?.value || "UPI Pay Request",
        evidence_references: upiEvid.length > 0 ? upiEvid : riskEvid
      });
      edges.push({
        from_node: previousNodeId,
        to_node: upiNodeId,
        relationship: mismatch.status === "DETECTED" ? "INVERTS_CLAIM_TO_COLLECT" : "REQUESTS",
        confidence: 0.95,
        provenance: "PAYMENT_PAYLOAD_ANALYSIS",
        evidence_references: upiEvid.length > 0 ? upiEvid : riskEvid
      });
      previousNodeId = upiNodeId;

      // Final Payment Action Node
      const payActionNodeId = `n${nodeIdx++}`;
      nodes.push({
        node_id: payActionNodeId,
        node_type: "PAYMENT_ACTION",
        entity_reference: mismatch.amount ? `Debit ₹${mismatch.amount}` : "Account Debit on PIN Entry",
        evidence_references: riskEvid
      });
      edges.push({
        from_node: upiNodeId,
        to_node: payActionNodeId,
        relationship: "TRIGGERS",
        confidence: 0.98,
        provenance: "UPI_EXECUTION_FLOW",
        evidence_references: riskEvid
      });
    }

    // Only return chain if we have at least 2 nodes and 1 edge
    if (nodes.length >= 2 && edges.length >= 1) {
      return { nodes, edges };
    }

    return undefined;
  }
}
