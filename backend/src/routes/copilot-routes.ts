import { Router, Request, Response } from "express";
import { CopilotService } from "../ai/copilot-service.js";
import { ConversationAnalyzer } from "../ai/conversation-analyzer.js";
import { ErrorResponse } from "../types/contracts.js";

export function createCopilotRouter(copilotService: CopilotService, conversationAnalyzer: ConversationAnalyzer): Router {
  const router = Router();

  // Ask Copilot inside scan result
  router.post("/copilot/ask", async (req: Request, res: Response) => {
    try {
      const { question, scan_result, chat_history } = req.body;

      if (!question || typeof question !== "string") {
        const errRes: ErrorResponse = {
          error_code: "INVALID_QUESTION",
          error_message: "Field 'question' is required as a string.",
          details: "Please provide a valid question to Ask RefGuard Copilot."
        };
        res.status(400).json(errRes);
        return;
      }

      if (!scan_result || !scan_result.risk_assessment) {
        const errRes: ErrorResponse = {
          error_code: "MISSING_SCAN_RESULT",
          error_message: "Field 'scan_result' is required with valid scan data.",
          details: "Copilot requires scan context to produce grounded analysis."
        };
        res.status(400).json(errRes);
        return;
      }

      const response = await copilotService.answerQuestion({
        question,
        scan_result,
        chat_history
      });

      res.status(200).json(response);
    } catch (err: unknown) {
      console.error("Error in copilot route:", err);
      const errRes: ErrorResponse = {
        error_code: "COPILOT_ERROR",
        error_message: "An error occurred while generating copilot guidance.",
        details: err instanceof Error ? err.message : "Unknown error"
      };
      res.status(500).json(errRes);
    }
  });

  // Analyze Conversation transcripts
  router.post("/analyze/conversation", (req: Request, res: Response) => {
    try {
      const { conversation_text } = req.body;

      if (!conversation_text || typeof conversation_text !== "string") {
        const errRes: ErrorResponse = {
          error_code: "INVALID_CONVERSATION_TEXT",
          error_message: "Field 'conversation_text' is required as a non-empty string.",
          details: "Please provide the conversation transcript text to analyze."
        };
        res.status(400).json(errRes);
        return;
      }

      const analysis = conversationAnalyzer.analyzeConversation(conversation_text);
      res.status(200).json(analysis);
    } catch (err: unknown) {
      console.error("Error in conversation analyzer route:", err);
      const errRes: ErrorResponse = {
        error_code: "CONVERSATION_ANALYSIS_ERROR",
        error_message: "Failed to analyze conversation transcript.",
        details: err instanceof Error ? err.message : "Unknown error"
      };
      res.status(500).json(errRes);
    }
  });

  return router;
}
