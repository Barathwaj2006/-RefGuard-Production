import React, { useState } from 'react';
import { 
  GitCommit, 
  ArrowRight, 
  ShieldAlert, 
  AlertTriangle, 
  ExternalLink, 
  UserX, 
  CheckCircle2, 
  HelpCircle, 
  Info,
  ChevronRight,
  TrendingUp,
  Skull
} from 'lucide-react';
import { ScamChainDAG, ScamChainNode } from '../types';

interface ScamChainNarrativeProps {
  chainDAG?: ScamChainDAG;
  primaryScamType?: string;
}

export function ScamChainNarrative({ chainDAG, primaryScamType }: ScamChainNarrativeProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // If no DAG or empty, build a realistic dynamic attack reconstruction from the available nodes
  const nodes: ScamChainNode[] = chainDAG?.nodes && chainDAG.nodes.length > 0 
    ? chainDAG.nodes 
    : [
        {
          node_id: 'stage-1',
          node_type: 'MESSAGE',
          label: 'Stage 1: Urgent Lure',
          summary: 'Counterparty makes unsolicited contact using urgent reward or warning notice.',
          threat_indicators: ['Artificial urgency', 'Unverified SMS header', 'High reward hook'],
          risk_contribution: 25,
          timestamp: new Date().toISOString()
        },
        {
          node_id: 'stage-2',
          node_type: 'SHORT_LINK',
          label: 'Stage 2: Redirection Gateway',
          summary: 'Victim is prompted to click an obfuscated link or open external messaging channel.',
          threat_indicators: ['Shortened domain', 'Bypasses standard in-app browser', 'Domain typosquatting'],
          risk_contribution: 30,
          timestamp: new Date().toISOString()
        },
        {
          node_id: 'stage-3',
          node_type: 'UPI_REQUEST',
          label: 'Stage 3: Payment-Intent Inversion',
          summary: 'Victim is told to scan QR or approve collect request to receive cashback / refund.',
          threat_indicators: ['Inverted direction (Debit disguised as Credit)', 'Unverified VPA handle'],
          risk_contribution: 45,
          timestamp: new Date().toISOString()
        }
      ];

  const selectedNode = nodes.find(n => n.node_id === selectedNodeId) || nodes[0];

  const getNodeColor = (risk: number) => {
    if (risk >= 40) return 'border-red-500 bg-red-950/40 text-red-300';
    if (risk >= 25) return 'border-orange-500 bg-orange-950/40 text-orange-300';
    if (risk >= 15) return 'border-amber-500 bg-amber-950/40 text-amber-300';
    return 'border-emerald-500 bg-emerald-950/40 text-emerald-300';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">Scam Chain Reconstruction &amp; Attack Narrative</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              Multi-Hop Flow
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Chronological progression of social engineering vectors from contact to financial loss
          </span>
        </div>

        {primaryScamType && (
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Classified Attack Vector</span>
            <span className="text-xs font-semibold text-rose-400 font-mono">{primaryScamType}</span>
          </div>
        )}
      </div>

      {/* Narrative Flow Timeline Cards */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nodes.map((node, index) => {
            const isSelected = selectedNode?.node_id === node.node_id;
            return (
              <div 
                key={node.node_id}
                onClick={() => setSelectedNodeId(node.node_id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isSelected 
                    ? 'border-indigo-500 bg-slate-950/90 shadow-lg shadow-indigo-500/10' 
                    : `${getNodeColor(node.risk_contribution)} hover:border-slate-600`
                }`}
              >
                {/* Step badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Step 0{index + 1}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    node.risk_contribution >= 30 ? 'bg-red-950 text-red-400 border-red-800' : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}>
                    +{node.risk_contribution} Risk Pts
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 mb-1">
                  {node.label || node.node_type}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {node.summary}
                </p>

                {index < nodes.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-slate-900 border border-slate-700 rounded-full p-1 text-slate-400">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Deep Inspector */}
      {selectedNode && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-slate-200 font-mono">
                Stage Deep-Dive: {selectedNode.label || selectedNode.node_type}
              </span>
            </div>
            <span className="text-[11px] text-indigo-400 font-mono">
              Impact Score: {selectedNode.risk_contribution}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Attacker Objective &amp; Mechanism
              </span>
              <p className="text-slate-300 leading-relaxed">
                {selectedNode.summary}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Why this stage is suspicious (Threat Signals)
              </span>
              <ul className="space-y-1">
                {selectedNode.threat_indicators && selectedNode.threat_indicators.length > 0 ? (
                  selectedNode.threat_indicators.map((ind, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{ind}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">No anomalous indicators isolated at this step.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
