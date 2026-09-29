"use client";

import React, { useEffect, useState } from "react";
import { CabinetMemo, PriorityCard } from "../../types";
import { fetchCabinetMemo } from "../../lib/api";
import { Printer, X, Sparkles, Shield, CheckCircle } from "lucide-react";

interface PolicyDossierModalProps {
  rank: number;
  card: PriorityCard | null;
  onClose: () => void;
}

export const PolicyDossierModal: React.FC<PolicyDossierModalProps> = ({
  rank,
  card,
  onClose,
}) => {
  const [memo, setMemo] = useState<CabinetMemo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchCabinetMemo(rank).then((data) => {
      if (isMounted) {
        setMemo(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [rank]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="liquid-glass-strong border border-cyan-500/30 max-w-3xl w-full max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accentCyan" />
            <span className="text-xs font-mono uppercase text-accentCyan font-bold">
              Government of India • Cabinet Memorandum Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-accentCyan/20 hover:bg-accentCyan/30 text-accentCyan border border-accentCyan/40 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-mutedText hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Cabinet Memorandum Content */}
        <div className="p-8 overflow-y-auto flex-1 font-serif text-slate-100 bg-[#070B14] print:bg-white print:text-black">
          {loading ? (
            <div className="text-center py-16 text-mutedText font-mono text-sm">
              <Sparkles className="w-6 h-6 text-accentCyan animate-spin mx-auto mb-3" />
              Synthesizing Cabinet Policy Memorandum with Vertex AI Gemini 2.0 Flash...
            </div>
          ) : memo ? (
            <div className="space-y-6">
              {/* Official Header */}
              <div className="text-center border-b border-white/20 print:border-black pb-4">
                <div className="text-xs uppercase tracking-widest text-mutedText print:text-gray-600 font-mono">
                  CONFIDENTIAL • FOR CABINET COMMITTEE ON ECONOMIC AFFAIRS (CCEA) ONLY
                </div>
                <h1 className="text-xl font-bold tracking-wide mt-2 text-white print:text-black font-sans uppercase">
                  Government of India • Cabinet Secretariat
                </h1>
                <p className="text-xs text-accentCyan print:text-black font-mono mt-1">
                  VAANI Sovereign Digital Public Infrastructure • Project Dossier #{rank}
                </p>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-base font-bold text-amber-400 print:text-black">
                  {memo.memo_title}
                </h2>
                <div className="text-xs font-mono text-mutedText print:text-gray-600 mt-1">
                  Location: <b>{card?.location}</b> (LGD District Code: {card?.lgd_district_code}) • Sector: <b>{card?.category}</b>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono uppercase font-bold text-accentCyan print:text-black">
                  1. Executive Summary
                </h3>
                <p className="text-sm leading-relaxed text-slate-200 print:text-black">
                  {memo.executive_summary}
                </p>
              </div>

              {/* Urgency Justification */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono uppercase font-bold text-accentCyan print:text-black">
                  2. Empirical Urgency & Citizen Demand Grounding
                </h3>
                <p className="text-sm leading-relaxed text-slate-200 print:text-black">
                  {memo.urgency_justification}
                </p>
              </div>

              {/* PM GatiShakti Alignment */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono uppercase font-bold text-accentCyan print:text-black">
                  3. PM GatiShakti & Central Scheme Alignment
                </h3>
                <p className="text-sm leading-relaxed text-slate-200 print:text-black">
                  {memo.gatishakti_alignment}
                </p>
              </div>

              {/* Financial & Causal Projections Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 print:bg-gray-100 border border-white/10 print:border-gray-300 font-mono text-xs">
                <div>
                  <span className="text-mutedText print:text-gray-600 block">Recommended Capital Sanction:</span>
                  <span className="text-base font-bold text-emerald-400 print:text-black">
                    {memo.recommended_sanction_inr_crores}
                  </span>
                </div>
                <div>
                  <span className="text-mutedText print:text-gray-600 block">Projected Demand Decay Post-Completion:</span>
                  <span className="text-base font-bold text-accentCyan print:text-black">
                    -{memo.projected_demand_decay_pct}%
                  </span>
                </div>
              </div>

              {/* Metadata Signature */}
              <div className="pt-4 border-t border-white/10 print:border-gray-300 text-[11px] font-mono text-mutedText print:text-gray-600 flex justify-between items-center">
                <span>Model: {memo.model_used}</span>
                <span>Certified by: National Planning Informatics Cell</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
