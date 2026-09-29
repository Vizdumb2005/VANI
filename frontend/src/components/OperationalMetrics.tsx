import React from 'react';

interface OperationalMetricsProps {
  hotspotsCount: number;
  signalsCount: number;
  dispatchedBatchesCount: number;
}

export const OperationalMetrics: React.FC<OperationalMetricsProps> = ({
  hotspotsCount,
  signalsCount,
  dispatchedBatchesCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="p-4 rounded-card border border-border bg-surface flex flex-col justify-between">
        <span className="text-[11px] font-mono uppercase text-secondary">
          Active Ingested Demand
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-serif font-bold text-charcoal">
            17,426
          </span>
          <span className="text-xs font-mono text-secondary">reports</span>
        </div>
        <div className="text-[11px] text-secondary mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-pastel-green-text"></span>
          <span>Omnichannel streaming</span>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="p-4 rounded-card border border-border bg-surface flex flex-col justify-between">
        <span className="text-[11px] font-mono uppercase text-secondary">
          Deduplicated Signals
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-serif font-bold text-charcoal">
            {signalsCount > 0 ? signalsCount.toLocaleString() : '2,854'}
          </span>
          <span className="text-xs font-mono text-secondary">clusters</span>
        </div>
        <div className="text-[11px] text-secondary mt-1">
          MinHash LSH spatial resolution
        </div>
      </div>

      {/* Metric 3 */}
      <div className="p-4 rounded-card border border-border bg-surface flex flex-col justify-between">
        <span className="text-[11px] font-mono uppercase text-secondary">
          Critical Hotspots
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-serif font-bold text-pastel-red-text">
            {hotspotsCount}
          </span>
          <span className="text-xs font-mono text-secondary">districts</span>
        </div>
        <div className="text-[11px] text-secondary mt-1">
          Elevated excess demand ratio
        </div>
      </div>

      {/* Metric 4 */}
      <div className="p-4 rounded-card border border-border bg-surface flex flex-col justify-between">
        <span className="text-[11px] font-mono uppercase text-secondary">
          CPGRAMS Dispatches
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-serif font-bold text-pastel-green-text">
            {dispatchedBatchesCount}
          </span>
          <span className="text-xs font-mono text-secondary">batches active</span>
        </div>
        <div className="text-[11px] text-secondary mt-1">
          Automated line ministry routing
        </div>
      </div>
    </div>
  );
};
