import React, { useState } from 'react';
import { BRICS_PROFILES } from '../data/initialData';

export const BricsSettings: React.FC = () => {
  const [selectedBrics, setSelectedBrics] = useState<string>('IND');
  const brics = BRICS_PROFILES[selectedBrics] || BRICS_PROFILES['IND'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-serif text-charcoal font-semibold">
          BRICS Cross-Border DPI Scalability Settings
        </h3>
        <p className="text-sm text-secondary mt-1 max-w-3xl">
          Modular spatial gazetteers and scheme taxonomy supporting international deployment across India, Brazil, and South Africa.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedBrics('IND')}
          className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
            selectedBrics === 'IND' ? 'bg-charcoal text-white border-charcoal' : 'border-border bg-surface text-secondary hover:text-charcoal'
          }`}
        >
          Republic of India (LGD · PMGSY/JJM)
        </button>
        <button
          onClick={() => setSelectedBrics('BRA')}
          className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
            selectedBrics === 'BRA' ? 'bg-charcoal text-white border-charcoal' : 'border-border bg-surface text-secondary hover:text-charcoal'
          }`}
        >
          Federative Republic of Brazil (IBGE · Novo PAC)
        </button>
        <button
          onClick={() => setSelectedBrics('ZAF')}
          className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
            selectedBrics === 'ZAF' ? 'bg-charcoal text-white border-charcoal' : 'border-border bg-surface text-secondary hover:text-charcoal'
          }`}
        >
          Republic of South Africa (MDB · NDP 2030)
        </button>
      </div>

      <div className="border border-border rounded-card bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="font-serif text-lg font-semibold text-charcoal">{brics.name}</h4>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
            ISO: {brics.iso}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 border border-border rounded bg-surface-subtle">
            <span className="text-secondary block text-[10px] uppercase">Administrative Partition:</span>
            <strong className="text-charcoal block mt-1">{brics.administrative_level}</strong>
          </div>
          <div className="p-3 border border-border rounded bg-surface-subtle">
            <span className="text-secondary block text-[10px] uppercase">Spatial Gazetteer Standard:</span>
            <strong className="text-charcoal block mt-1">{brics.spatial_anchor}</strong>
          </div>
          <div className="p-3 border border-border rounded bg-surface-subtle">
            <span className="text-secondary block text-[10px] uppercase">Population Coverage:</span>
            <strong className="text-charcoal block mt-1">{brics.population_covered}</strong>
          </div>
        </div>

        <p className="text-xs text-secondary leading-relaxed pt-2">
          {brics.description}
        </p>

        <div className="pt-2 border-t border-border">
          <span className="text-xs font-mono uppercase text-secondary block mb-2">Mapped Infrastructure Schemes:</span>
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
