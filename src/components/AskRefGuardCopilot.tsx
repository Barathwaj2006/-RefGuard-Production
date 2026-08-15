import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  FileCheck, 
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { ScanResponse } from '../types';

interface AskRefGuardCopilotProps {
  scanResult: ScanResponse;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  evidenceUsed?: string[];
  immediateAdvice?: string;
  timestamp: string;
}

export function AskRefGuardCopilot({ scanResult }: AskRefGuardCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      sender: 'copilot',
      text: `Hello! I am your RefGuard Security Copilot. I've analyzed this scan and grounded my intelligence in the extracted payload, intent mismatch, and threat signals. Ask me anything about this transaction!`,
      immediateAdvice: scanResult.risk_assessment.risk_score >= 60 
        ? "🚨 Urgent Advice: Do NOT enter your UPI PIN or approve this transaction in any payment app."
        : "✅ Preliminary Verdict: No active fraud patterns were confirmed in this payload.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    "Why is this dangerous?",
    "Explain this simply",
    "Help me respond to this person",
    "Who am I being asked to pay?",
    "What should I do right now?",
    "How to preserve evidence for 1930?",
    "Is this a real payment or collect request?"
  ];

  const handleAsk = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/copilot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          scan_result: scanResult,
          chat_history: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error(`Copilot API responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: data.answer,
        evidenceUsed: data.key_evidence_used,
        immediateAdvice: data.immediate_safety_advice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, copilotMsg]);
    } catch (err: unknown) {
      const fallbackMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: `Based on the active scan evidence (Risk: ${scanResult.risk_assessment.risk_score}/100): ${scanResult.protection_decision.detected_summary}. We advise taking caution and avoiding entering your UPI PIN.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Ask RefGuard Security Copilot</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Grounded AI
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Contextual Q&amp;A referencing this active investigation</span>
          </div>
        </div>
      </div>

      {/* Chat Messages scroll area */}
      <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-4 font-sans text-xs">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3.5 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
              }`}
            >
              {msg.sender === 'copilot' && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 mb-1.5 uppercase font-bold">
                  <Sparkles className="w-3 h-3" /> RefGuard Intel Assistant
                </div>
              )}
              <div className="whitespace-pre-line leading-relaxed">
                {msg.text}
              </div>

              {msg.immediateAdvice && (
                <div className="mt-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>{msg.immediateAdvice}</span>
                </div>
              )}

              {msg.evidenceUsed && msg.evidenceUsed.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-mono">Evidence:</span>
                  {msg.evidenceUsed.map((ev, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
                      {ev}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>RefGuard Copilot analyzing scan evidence...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="shrink-0 pt-2 border-t border-slate-800/60">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-400" /> Suggested Prompts:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleAsk(q)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(inputQuestion);
          }}
          className="flex items-center gap-2 mt-1"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask a question about this threat..."
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
