"use client";

import React, { useState, useMemo } from "react";
import { PriorityCard } from "../../types";
import { McdaWeights, reRankPriorityCards } from "../../lib/mcda";
import { Sliders, Sparkles, TrendingUp, Award, ExternalLink } from "lucide-react";

interface McdaSensitivityToolProps {
  initialCards: PriorityCard[];
  onOpenMemo: (rank: number, card: PriorityCard) => void;
}

export const McdaSensitivityTool: React.FC<McdaSensitivityToolProps> = ({
  initialCards,
  onOpenMemo,
}) => {
  const [weights, setWeights] = useState<McdaWeights>({
    w_demand: 0.35,
    w_deprivation: 0.25,
    w_population: 0.20,
    w_scheme: 0.20,
  });

  const { scoredCards, spearmanRho } = useMemo(() => {
    return reRankPriorityCards(initialCards, weights);
  }, [initialCards, weights]);

  const handleSliderChange = (key: keyof McdaWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetWeights = () => {
    setWeights({
      w_demand: 0.35,
      w_deprivation: 0.25,
      w_population: 0.20,
      w_scheme: 0.20,
    });
  };

  return (
    <div className="liquid-glass p-5 border border-white/10 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              Dynamic Multi-Criteria Decision Analysis (MCDA)
            </h2>
          </div>
          <p className="text-xs text-mutedText">
            Score = w<sub>D</sub>·D + w<sub>G</sub>·G + w<sub>P</sub>·P + w<sub>S</sub>·S • Real-time sensitivity & Spearman rank correlation
          </p>
        </div>

        {/* Live Spearman Rho Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono flex items-center gap-2">
            <span className="text-mutedText">Spearman ρ:</span>
            <span
              className={`font-bold ${
                spearmanRho >= 0.8
                  ? "text-emerald-400"
                  : spearmanRho >= 0.5
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {spearmanRho.toFixed(3)}
            </span>
          </div>
          <button
            onClick={resetWeights}
            className="text-[11px] font-mono px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-mutedText border border-white/10 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 p-3 rounded-lg bg-black/20 border border-white/5">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-accentCyan font-semibold">w₁ Demand (D)</span>
            <span className="text-white">{weights.w_demand.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.w_demand}
            onChange={(e) => handleSliderChange("w_demand", parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-amber-400 font-semibold">w₂ Deprivation (G)</span>
            <span className="text-white">{weights.w_deprivation.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.w_deprivation}
            onChange={(e) => handleSliderChange("w_deprivation", parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-emerald-400 font-semibold">w₃ Population (P)</span>
            <span className="text-white">{weights.w_population.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.w_population}
            onChange={(e) => handleSliderChange("w_population", parseFloat(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-purple-400 font-semibold">w₄ Schemes (S)</span>
            <span className="text-white">{weights.w_scheme.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.w_scheme}
            onChange={(e) => handleSliderChange("w_scheme", parseFloat(e.target.value))}
            className="w-full accent-purple-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
          />
        </div>
      </div>

      {/* Top Recommendations Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-white/10 text-mutedText font-mono text-[11px] uppercase">
              <th className="pb-2 pl-2">Rank</th>
              <th className="pb-2">Location</th>
              <th className="pb-2">Sector & Scheme</th>
              <th className="pb-2">Demand Vol.</th>
              <th className="pb-2">Deprivation</th>
              <th className="pb-2">Composite Score</th>
              <th className="pb-2 text-right pr-2">Cabinet Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scoredCards.slice(0, 6).map((card) => (
              <tr key={card.location + card.category} className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 pl-2 font-mono">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                      card.rank === 1
                        ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                        : card.rank === 2
                        ? "bg-slate-300/20 text-slate-300 border border-slate-300/30"
                        : card.rank === 3
                        ? "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                        : "bg-white/5 text-mutedText"
                    }`}
                  >
                    #{card.rank}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="font-semibold text-white">{card.location}</div>
                  <div className="text-[10px] text-mutedText font-mono">LGD {card.lgd_district_code}</div>
                </td>
                <td className="py-2.5">
                  <div className="text-white capitalize">{card.category.replace("_", " ")}</div>
                  <div className="text-[10px] text-accentCyan font-mono">{card.scheme_match?.scheme || "PMGSY"}</div>
                </td>
                <td className="py-2.5 font-mono">
                  <div className="text-white font-medium">{card.demand_intensity.report_count} petitions</div>
                  <div className="text-[10px] text-amber-400 font-semibold">{card.demand_intensity.excess_ratio}× baseline</div>
                </td>
                <td className="py-2.5 font-mono text-mutedText">
                  <div className="text-white font-medium">{card.deprivation_score.toFixed(2)}</div>
                  <div className="text-[10px]">NFHS-5 Index</div>
                </td>
                <td className="py-2.5 font-mono">
                  <div className="text-base font-bold text-accentCyan">{card.priority.toFixed(4)}</div>
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-amber-400"
                      style={{ width: `${Math.min(100, card.priority * 100)}%` }}
                    />
                  </div>
                </td>
                <td className="py-2.5 text-right pr-2">
                  <button
                    onClick={() => onOpenMemo(card.rank, card)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accentCyan/15 hover:bg-accentCyan/25 text-accentCyan border border-accentCyan/30 text-[11px] font-mono transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Memo</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
