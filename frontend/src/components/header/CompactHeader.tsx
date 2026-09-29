"use client";

import React from "react";
import { Shield, Sparkles, Activity, FileText, CheckCircle2, Layers } from "lucide-react";

interface CompactHeaderProps {
  onOpenStatutoryModal: () => void;
  onOpenPresentation: () => void;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  onOpenStatutoryModal,
  onOpenPresentation,
}) => {
  return (
    <header className="sticky top-0 z-50 liquid-glass-strong border-b border-white/10 px-4 py-2.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 via-teal-500 to-amber-500 p-0.5 flex items-center justify-center shadow-cyanGlow">
            <div className="w-full h-full bg-[#070B14] rounded-[7px] flex items-center justify-center">
              <span className="text-accentCyan font-bold text-base tracking-tighter">वा</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wide uppercase text-white font-heading">
                VAANI
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-accentCyan border border-cyan-500/30">
                Sovereign DPI
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                GCP Live
              </span>
            </div>
            <p className="text-[11px] text-mutedText truncate max-w-[340px] sm:max-w-none">
              Voice-to-Network Aggregated National Intelligence • Ministry of Panchayati Raj LGD
            </p>
          </div>
        </div>

        {/* Live Telemetry Ribbon */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Activity className="w-3.5 h-3.5 text-accentCyan" />
            <span className="text-mutedText">Coverage:</span>
            <span className="text-white font-semibold">765 Districts (100%)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-mutedText">Vertex AI:</span>
            <span className="text-white font-semibold">Gemini 2.0 Flash</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-mutedText">DPDP Act §8(7):</span>
            <span className="text-emerald-400 font-semibold">0s Audio Retention</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStatutoryModal}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-accentCyan" />
            <span>Compliance & DPDP</span>
          </button>
          <button
            onClick={onOpenPresentation}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-accentCyan border border-cyan-500/30 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pitch Deck</span>
          </button>
        </div>
      </div>
    </header>
  );
};
