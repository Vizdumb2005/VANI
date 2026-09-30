import React, { useState } from 'react';
import { ScmImpactReport } from '../types';

interface ScmImpactEngineProps {
  impactReport: ScmImpactReport;
}

export const ScmImpactEngine: React.FC<ScmImpactEngineProps> = ({ impactReport }) => {
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Varanasi');

  const districtData =
    impactReport.districts.find((d) => d.district === selectedDistrictName) ||
    impactReport.districts[0];

  const series = districtData.series;
  const months = impactReport.panel_months;

  const chartHeight = 240;
  const chartWidth = 640;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const allVals = [...series.observed, ...series.synthetic];
  const maxVal = Math.max(...allVals, 20);
  const minVal = 0;

  const getX = (index: number) => {
    const usableWidth = chartWidth - padding.left - padding.right;
    return padding.left + (index / (months.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    const usableHeight = chartHeight - padding.top - padding.bottom;
    return padding.top + usableHeight - ((val - minVal) / (maxVal - minVal)) * usableHeight;
  };

  const observedPath = series.observed
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`)
    .join(' ');

  const syntheticPath = series.synthetic
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`)
    .join(' ');

  const treatmentIdx = districtData.pre_months;
  const treatmentX = getX(treatmentIdx);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-serif text-charcoal font-semibold">
            Causal Impact Engine (SCM)
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
            Synthetic Control Evaluation
          </span>
        </div>
      </div>

      {/* District Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {impactReport.districts.map((d) => (
          <button
            key={d.district}
            onClick={() => setSelectedDistrictName(d.district)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              selectedDistrictName === d.district
                ? 'bg-charcoal text-white border-charcoal shadow-subtle'
                : 'border-border bg-surface text-secondary hover:text-charcoal hover:bg-surface-subtle'
            }`}
          >
            {d.district} ({d.category.replace(/_/g, ' ')})
          </button>
        ))}
      </div>

      {/* Main Grid: Chart + Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Time Series Chart (7 cols) */}
        <div className="lg:col-span-7 border border-border rounded-card bg-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-serif text-lg font-semibold text-charcoal">
                Demand Trajectory: {districtData.district}
              </h4>
              <p className="text-xs text-secondary">
                Treatment completed on {districtData.treatment_completed} ({districtData.category.replace(/_/g, ' ')})
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-charcoal inline-block"></span>
                <span>Observed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-secondary inline-block"></span>
                <span className="text-secondary">Synthetic</span>
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto py-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[500px]"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + (chartHeight - padding.top - padding.bottom) * ratio;
                const labelVal = Math.round(maxVal * (1 - ratio));
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#EAEAEA"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#787774"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              <line
                x1={treatmentX}
                y1={padding.top}
                x2={treatmentX}
                y2={chartHeight - padding.bottom}
                stroke="#9F2F2D"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={treatmentX + 4}
                y={padding.top + 12}
                fill="#9F2F2D"
                fontSize="9"
                fontFamily="monospace"
              >
                Intervention
              </text>

              <path
                d={syntheticPath}
                fill="none"
                stroke="#787774"
                strokeWidth="1.8"
                strokeDasharray="4 3"
              />

              <path
                d={observedPath}
                fill="none"
                stroke="#111111"
                strokeWidth="2.2"
              />

              {series.observed.map((v, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(v)}
                  r={i === treatmentIdx ? 4 : 2.5}
                  fill="#111111"
                />
              ))}

              {months.map((m, i) => (
                <text
                  key={i}
                  x={getX(i)}
                  y={chartHeight - 12}
                  fill="#787774"
                  fontSize="8.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {m.substring(5)}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Causal Metrics Ledger (5 cols) */}
        <div className="lg:col-span-5 border border-border rounded-card bg-surface p-5 space-y-4">
          <h4 className="font-serif text-lg font-semibold text-charcoal">
            Impact Verification Metrics
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-border rounded bg-surface-subtle">
              <span className="text-[11px] text-secondary block font-mono">Observed Post Mean</span>
              <span className="text-xl font-mono font-semibold text-charcoal">
                {districtData.observed_post_mean.toFixed(1)}
              </span>
              <span className="text-[10px] text-secondary block mt-1">Petitions per month</span>
            </div>

            <div className="p-3 border border-border rounded bg-surface-subtle">
              <span className="text-[11px] text-secondary block font-mono">Synthetic Counterfactual</span>
              <span className="text-xl font-mono font-semibold text-charcoal">
                {districtData.synthetic_post_mean.toFixed(1)}
              </span>
              <span className="text-[10px] text-secondary block mt-1">Expected absent work</span>
            </div>

            <div className="p-3 border border-border rounded bg-pastel-green">
              <span className="text-[11px] text-pastel-green-text block font-mono">Demand Decay Effect</span>
              <span className="text-xl font-mono font-bold text-pastel-green-text">
                -{districtData.decay_pct}%
              </span>
              <span className="text-[10px] text-pastel-green-text block mt-1">Net complaint reduction</span>
            </div>

            <div className="p-3 border border-border rounded bg-pastel-blue">
              <span className="text-[11px] text-pastel-blue-text block font-mono">In-Space Placebo p</span>
              <span className="text-xl font-mono font-bold text-pastel-blue-text">
                p = {districtData.inspace_placebo_pvalue.toFixed(2)}
              </span>
              <span className="text-[10px] text-pastel-blue-text block mt-1">Significant (p &le; 0.10)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="text-xs font-mono uppercase text-secondary block mb-2">
              Top Synthetic Donor Weights:
            </span>
            <div className="space-y-1 text-xs font-mono">
              {Object.entries(districtData.donor_weights_top).map(([donor, weight]) => (
                <div key={donor} className="flex justify-between items-center py-1 border-b border-border/50">
                  <span className="text-charcoal">{donor}</span>
                  <span className="text-secondary">{weight.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
