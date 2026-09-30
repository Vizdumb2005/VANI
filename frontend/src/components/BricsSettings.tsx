import React, { useState } from 'react';
import { BRICS_PROFILES } from '../data/initialData';

export const BricsSettings: React.FC = () => {
  const [selectedBrics, setSelectedBrics] = useState<string>('IND');
  const brics = BRICS_PROFILES[selectedBrics] || BRICS_PROFILES['IND'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-serif text-charcoal font-semibold">
            BRICS Scalability Framework
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
            Cross-Border Taxonomy
          </span>
        </div>

        {/* Country Selector Tabs */}
        <div className="flex gap-1.5 font-mono text-xs">
          <button
            onClick={() => setSelectedBrics('IND')}
            className={`px-3 py-1 rounded border transition-colors ${
              selectedBrics === 'IND'
                ? 'bg-charcoal text-white border-charcoal font-medium shadow-xs'
                : 'border-border bg-surface text-secondary hover:text-charcoal'
            }`}
          >
            India (LGD)
          </button>
          <button
            onClick={() => setSelectedBrics('BRA')}
            className={`px-3 py-1 rounded border transition-colors ${
              selectedBrics === 'BRA'
                ? 'bg-charcoal text-white border-charcoal font-medium shadow-xs'
                : 'border-border bg-surface text-secondary hover:text-charcoal'
            }`}
          >
            Brazil (IBGE)
          </button>
          <button
            onClick={() => setSelectedBrics('ZAF')}
            className={`px-3 py-1 rounded border transition-colors ${
              selectedBrics === 'ZAF'
                ? 'bg-charcoal text-white border-charcoal font-medium shadow-xs'
                : 'border-border bg-surface text-secondary hover:text-charcoal'
            }`}
          >
            South Africa (MDB)
          </button>
        </div>
      </div>

      <div className="border border-border rounded-card bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="font-serif text-base font-semibold text-charcoal">{brics.name}</h4>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
            ISO Alpha-3: {brics.iso}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 border border-border rounded bg-surface-subtle">
            <span className="text-secondary block text-[10px] uppercase">Administrative Partition</span>
            <strong className="text-charcoal block mt-1 font-semibold">{brics.administrative_level}</strong>
          </div>
          <div className="p-3 border border-border rounded bg-surface-subtle">
            <span className="text-secondary block text-[10px] uppercase">Spatial Gazetteer Standard</span>
            <strong className="text-charcoal block mt-1 font-semibold">{brics.spatial_anchor}</strong>
          </div>
          <div className="p-3 border border-border rounded bg-surface-subtle">
            <span className="text-secondary block text-[10px] uppercase">Population Coverage</span>
            <strong className="text-charcoal block mt-1 font-semibold">{brics.population_covered}</strong>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <span className="text-[11px] font-mono uppercase text-secondary block mb-2">Mapped Infrastructure Schemes:</span>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {brics.primary_schemes.map((s: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 rounded border border-border bg-surface-subtle text-charcoal">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
