import React from 'react';
import { PriorityProject } from '../types';

interface DossierModalProps {
  project: PriorityProject | null;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-hover animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
              Cabinet Project Dossier
            </span>
            <h2 className="text-xl font-serif font-semibold text-charcoal mt-1">
              {project.location} · Priority Rank #{project.rank}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-mono rounded border border-border hover:bg-surface-subtle transition-colors text-charcoal"
            >
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-subtle text-secondary hover:text-charcoal transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded border border-border bg-surface-subtle">
              <span className="text-[10px] font-mono text-secondary uppercase block">LGD Code</span>
              <span className="text-sm font-semibold text-charcoal mt-0.5 block">{project.lgd_district_code}</span>
            </div>
            <div className="p-3 rounded border border-border bg-surface-subtle">
              <span className="text-[10px] font-mono text-secondary uppercase block">Sector</span>
              <span className="text-sm font-semibold text-charcoal mt-0.5 block capitalize">{project.category.replace('_', ' ')}</span>
            </div>
            <div className="p-3 rounded border border-border bg-surface-subtle">
              <span className="text-[10px] font-mono text-secondary uppercase block">Excess Demand</span>
              <span className="text-sm font-semibold text-charcoal mt-0.5 block">{project.demand_intensity.excess_ratio}x</span>
            </div>
            <div className="p-3 rounded border border-border bg-surface-subtle">
              <span className="text-[10px] font-mono text-secondary uppercase block">Priority Index</span>
              <span className="text-sm font-semibold text-charcoal mt-0.5 block">{(project.priority * 100).toFixed(1)}</span>
            </div>
          </div>

          <div className="p-4 rounded border border-border bg-surface-subtle space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
              Central Sector Scheme Alignment
            </span>
            <div className="text-sm font-semibold text-charcoal">{project.scheme_match.scheme}</div>
            <p className="text-xs text-secondary leading-relaxed">{project.scheme_match.description}</p>
            <div className="text-xs font-mono text-secondary pt-1">
              Current Coverage: {(project.scheme_match.current_coverage * 100).toFixed(1)}% | Cost Proxy: ₹{project.cost_per_beneficiary_proxy}/beneficiary
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-secondary mb-3">
              MCDA Multi-Criteria Weight Attribution
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Demand Intensity (D)</span>
                <span className="font-mono text-charcoal font-medium">{(project.components.D_demand * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div className="bg-charcoal h-full" style={{ width: `${project.components.D_demand * 100}%` }}></div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-secondary">Deprivation Score (G)</span>
                <span className="font-mono text-charcoal font-medium">{(project.components.G_deprivation * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div className="bg-charcoal h-full" style={{ width: `${project.components.G_deprivation * 100}%` }}></div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-secondary">Population Density (P)</span>
                <span className="font-mono text-charcoal font-medium">{(project.components.P_population * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div className="bg-charcoal h-full" style={{ width: `${project.components.P_population * 100}%` }}></div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-secondary">Scheme Synergy (S)</span>
                <span className="font-mono text-charcoal font-medium">{(project.components.S_scheme_alignment * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div className="bg-charcoal h-full" style={{ width: `${project.components.S_scheme_alignment * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
