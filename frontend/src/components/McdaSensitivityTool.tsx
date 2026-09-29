import React, { useState, useMemo } from 'react';
import { PriorityProject } from '../types';

interface McdaSensitivityToolProps {
  priorities: PriorityProject[];
  onOpenMemo: (rank: number) => void;
  onOpenDossier: (project: PriorityProject) => void;
}

export const McdaSensitivityTool: React.FC<McdaSensitivityToolProps> = ({
  priorities,
  onOpenMemo,
  onOpenDossier,
}) => {
  const [w1, setW1] = useState<number>(0.40); // Demand
  const [w2, setW2] = useState<number>(0.25); // Deprivation
  const [w3, setW3] = useState<number>(0.15); // Population
  const [w4, setW4] = useState<number>(0.20); // Scheme

  const baselineRanks = useMemo(() => priorities.map((_, i) => i + 1), [priorities]);

  const computedProjects = useMemo(() => {
    const sumW = w1 + w2 + w3 + w4 || 1.0;
    const scored = priorities.map((p, origIdx) => {
      const d = p.components.D_demand;
      const g = p.components.G_deprivation;
      const pop = p.components.P_population;
      const s = p.components.S_scheme_alignment;
      const score = (w1 * d + w2 * g + w3 * pop + w4 * s) / sumW;
      return {
        ...p,
        dynamicScore: score,
        origIdx,
      };
    });

    scored.sort((a, b) => (b.dynamicScore || 0) - (a.dynamicScore || 0));

    const newRanks = new Array(scored.length);
    scored.forEach((item, newRank) => {
      newRanks[item.origIdx] = newRank + 1;
    });

    const n = baselineRanks.length;
    let d2 = 0;
    for (let i = 0; i < n; i++) {
      const diff = baselineRanks[i] - newRanks[i];
      d2 += diff * diff;
    }
    const spearman = 1 - (6 * d2) / (n * (n * n - 1));

    return { scored, spearman };
  }, [priorities, w1, w2, w3, w4, baselineRanks]);

  const handleReset = () => {
    setW1(0.40);
    setW2(0.25);
    setW3(0.15);
    setW4(0.20);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif text-charcoal font-semibold">
            MCDA Policy Prioritization Matrix
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Real-time sensitivity vectors balancing citizen demand intensity against deprivation deficits, population served, and national scheme alignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-mono border border-border rounded bg-surface hover:bg-surface-subtle transition-colors text-charcoal"
          >
            Reset Baseline Weights
          </button>
          <button
            onClick={() => onOpenDossier(computedProjects.scored[0])}
            className="px-3.5 py-1.5 text-xs font-medium rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors shadow-subtle"
          >
            Export Top Dossier
          </button>
        </div>
      </div>

      {/* Sliders Card */}
      <div className="border border-border rounded-card bg-surface p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary">w1 · Demand Intensity</span>
              <span className="font-mono font-semibold text-charcoal">{w1.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w1}
              onChange={(e) => setW1(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
            <p className="text-[10px] text-secondary">Hotspot excess ratio & volume</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary">w2 · Deprivation Gap</span>
              <span className="font-mono font-semibold text-charcoal">{w2.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w2}
              onChange={(e) => setW2(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
            <p className="text-[10px] text-secondary">Census & NFHS-5 multidimensional index</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary">w3 · Population Density</span>
              <span className="font-mono font-semibold text-charcoal">{w3.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w3}
              onChange={(e) => setW3(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
            <p className="text-[10px] text-secondary">Habitation reach per unit expenditure</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary">w4 · Scheme Alignment</span>
              <span className="font-mono font-semibold text-charcoal">{w4.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w4}
              onChange={(e) => setW4(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
            <p className="text-[10px] text-secondary">PMGSY, JJM, IPDS scheme mapping</p>
          </div>
        </div>

        {/* Robustness metric bar */}
        <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase text-secondary">Ranking Stability:</span>
            <span className="font-mono font-semibold text-charcoal">
              Spearman rho = {computedProjects.spearman.toFixed(3)}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              computedProjects.spearman >= 0.80
                ? 'bg-pastel-green text-pastel-green-text font-medium'
                : 'bg-pastel-yellow text-pastel-yellow-text'
            }`}>
              {computedProjects.spearman >= 0.80 ? 'Robust (rho >= 0.80)' : 'Moderate Variance'}
            </span>
          </div>
          <span className="text-secondary text-[11px] font-mono">
            Active Priority Formula = (w1*D + w2*G + w3*P + w4*S) / (w1+w2+w3+w4)
          </span>
        </div>
      </div>

      {/* Priority Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {computedProjects.scored.slice(0, 6).map((p, idx) => {
          const score = p.dynamicScore || p.priority;
          const pct = Math.min(100, Math.round(score * 100));

          return (
            <div
              key={idx}
              className="border border-border rounded-card bg-surface p-5 flex flex-col justify-between hover:shadow-subtle transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-subtle border border-border text-charcoal">
                    Priority #{idx + 1}
                  </span>
                  <span className="font-mono text-xs font-semibold text-charcoal">
                    Score: {score.toFixed(3)}
                  </span>
                </div>

                <h4 className="font-serif text-lg font-semibold text-charcoal capitalize">
                  {p.category.replace(/_/g, ' ')}
                </h4>
                <p className="text-xs font-mono text-secondary mb-3">
                  {p.location} (LGD {p.lgd_district_code})
                </p>

                <div className="space-y-1.5 text-xs py-2 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-secondary">Demand Intensity:</span>
                    <span className="font-medium text-charcoal">
                      {p.demand_intensity.report_count} reports ({p.demand_intensity.excess_ratio}x)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Deprivation Score:</span>
                    <span className="font-medium text-charcoal">{p.deprivation_score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Scheme Match:</span>
                    <span className="font-medium text-charcoal">{p.scheme_match.scheme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Beneficiary Cost Proxy:</span>
                    <span className="font-medium text-charcoal">INR {p.cost_per_beneficiary_proxy}</span>
                  </div>
                </div>

                <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden mt-3 mb-4">
                  <div
                    className="bg-charcoal h-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => onOpenMemo((p.origIdx ?? 0) + 1)}
                  className="flex-1 py-1.5 text-xs font-mono border border-border rounded bg-surface-subtle hover:bg-charcoal hover:text-white transition-colors"
                >
                  Cabinet Brief
                </button>
                <button
                  onClick={() => onOpenDossier(p)}
                  className="flex-1 py-1.5 text-xs font-mono border border-border rounded bg-surface hover:bg-surface-subtle transition-colors text-secondary hover:text-charcoal"
                >
                  Dossier
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
