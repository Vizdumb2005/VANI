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

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const handleReset = () => {
    setW1(0.40);
    setW2(0.25);
    setW3(0.15);
    setW4(0.20);
  };

  return (
    <div className="space-y-4">
      {/* Clean Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-serif text-charcoal font-semibold">
            MCDA Prioritization Matrix
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
            Spearman &rho; = {computedProjects.spearman.toFixed(3)} ({computedProjects.spearman >= 0.80 ? 'Robust' : 'Moderate'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded border border-border bg-surface-subtle p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'table' ? 'bg-surface font-medium text-charcoal shadow-sm' : 'text-secondary hover:text-charcoal'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-surface font-medium text-charcoal shadow-sm' : 'text-secondary hover:text-charcoal'
              }`}
            >
              Cards View
            </button>
          </div>

          <button
            onClick={handleReset}
            className="px-2.5 py-1 text-xs font-mono border border-border rounded bg-surface hover:bg-surface-subtle transition-colors text-charcoal"
          >
            Reset
          </button>
          <button
            onClick={() => onOpenDossier(computedProjects.scored[0])}
            className="px-3 py-1 text-xs font-medium rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors shadow-subtle"
          >
            Export Dossier
          </button>
        </div>
      </div>

      {/* Sliders Card (Compact) */}
      <div className="border border-border rounded-card bg-surface p-3.5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary text-[11px]">w1 · Demand Intensity</span>
              <span className="font-mono font-semibold text-charcoal">{w1.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w1}
              onChange={(e) => setW1(parseFloat(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary text-[11px]">w2 · Deprivation Gap</span>
              <span className="font-mono font-semibold text-charcoal">{w2.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w2}
              onChange={(e) => setW2(parseFloat(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary text-[11px]">w3 · Population Density</span>
              <span className="font-mono font-semibold text-charcoal">{w3.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w3}
              onChange={(e) => setW3(parseFloat(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-secondary text-[11px]">w4 · Scheme Alignment</span>
              <span className="font-mono font-semibold text-charcoal">{w4.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={w4}
              onChange={(e) => setW4(parseFloat(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-charcoal"
            />
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="border border-border rounded-card bg-surface overflow-hidden">
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-secondary font-mono uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Reports (Excess)</th>
                  <th className="py-2.5 px-3 text-right">Deprivation</th>
                  <th className="py-2.5 px-3">Matched Scheme</th>
                  <th className="py-2.5 px-3 text-right">Cost Proxy</th>
                  <th className="py-2.5 px-3 text-right">Priority Score</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {computedProjects.scored.map((p, idx) => {
                  const score = p.dynamicScore || p.priority;
                  const pct = Math.min(100, Math.round(score * 100));

                  return (
                    <tr key={idx} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-2 px-3 font-mono font-semibold text-charcoal">
                        #{idx + 1}
                      </td>
                      <td className="py-2 px-3 font-medium capitalize">
                        <span className="inline-block px-2 py-0.5 rounded bg-surface-subtle border border-border text-[11px] font-mono">
                          {p.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-charcoal">
                        {p.location}{' '}
                        <span className="text-[10px] font-mono text-secondary">
                          (LGD {p.lgd_district_code})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {p.demand_intensity.report_count}{' '}
                        <span className="text-pastel-red-text font-semibold">
                          ({p.demand_intensity.excess_ratio}x)
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {p.deprivation_score}
                      </td>
                      <td className="py-2 px-3 text-secondary">
                        {p.scheme_match.scheme}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{p.cost_per_beneficiary_proxy}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                            <div className="bg-charcoal h-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-semibold text-charcoal">{score.toFixed(3)}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenMemo((p.origIdx ?? 0) + 1)}
                            className="px-2 py-0.5 text-[11px] font-mono border border-border rounded hover:bg-charcoal hover:text-white transition-colors"
                          >
                            Memo
                          </button>
                          <button
                            onClick={() => onOpenDossier(p)}
                            className="px-2 py-0.5 text-[11px] font-mono border border-border rounded text-secondary hover:text-charcoal hover:bg-surface-subtle transition-colors"
                          >
                            Dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Compact Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {computedProjects.scored.slice(0, 6).map((p, idx) => {
            const score = p.dynamicScore || p.priority;
            const pct = Math.min(100, Math.round(score * 100));

            return (
              <div
                key={idx}
                className="border border-border rounded-card bg-surface p-4 flex flex-col justify-between hover:shadow-subtle transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-subtle border border-border text-charcoal">
                      Priority #{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-semibold text-charcoal">
                      {score.toFixed(3)}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-semibold text-charcoal capitalize">
                    {p.category.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-[11px] font-mono text-secondary mb-2">
                    {p.location} (LGD {p.lgd_district_code})
                  </p>

                  <div className="space-y-1 text-xs py-1.5 border-t border-border text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-secondary">Demand:</span>
                      <span className="font-medium text-charcoal">
                        {p.demand_intensity.report_count} ({p.demand_intensity.excess_ratio}x)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Scheme:</span>
                      <span className="font-medium text-charcoal truncate max-w-[180px]">{p.scheme_match.scheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Cost Proxy:</span>
                      <span className="font-medium text-charcoal">₹{p.cost_per_beneficiary_proxy}</span>
                    </div>
                  </div>

                  <div className="w-full bg-surface-subtle h-1 rounded-full overflow-hidden mt-2 mb-3">
                    <div className="bg-charcoal h-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => onOpenMemo((p.origIdx ?? 0) + 1)}
                    className="flex-1 py-1 text-xs font-mono border border-border rounded bg-surface-subtle hover:bg-charcoal hover:text-white transition-colors"
                  >
                    Cabinet Brief
                  </button>
                  <button
                    onClick={() => onOpenDossier(p)}
                    className="flex-1 py-1 text-xs font-mono border border-border rounded bg-surface hover:bg-surface-subtle transition-colors text-secondary hover:text-charcoal"
                  >
                    Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
