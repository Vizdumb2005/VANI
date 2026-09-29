import React from 'react';
import { CabinetMemo } from '../types';

interface CabinetMemoModalProps {
  memo: CabinetMemo | null;
  onClose: () => void;
}

export const CabinetMemoModal: React.FC<CabinetMemoModalProps> = ({ memo, onClose }) => {
  if (!memo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-hover animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
              Statutory Instrument
            </span>
            <h2 className="text-xl font-serif font-semibold text-charcoal mt-1">
              Cabinet Sanction Memorandum
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-mono rounded border border-border hover:bg-surface-subtle transition-colors text-charcoal"
            >
              Print
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
          <div>
            <h3 className="text-base font-semibold text-charcoal">{memo.memo_title}</h3>
            <p className="text-sm text-secondary mt-2 leading-relaxed">{memo.executive_summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded border border-border bg-surface-subtle">
              <span className="text-[11px] font-mono text-secondary uppercase block">
                Recommended Capital Sanction
              </span>
              <span className="text-xl font-semibold text-charcoal mt-1 block">
                INR {typeof memo.recommended_sanction_inr_crores === 'number' ? `${memo.recommended_sanction_inr_crores} Cr` : memo.recommended_sanction_inr_crores}
              </span>
            </div>
            <div className="p-4 rounded border border-border bg-surface-subtle">
              <span className="text-[11px] font-mono text-secondary uppercase block">
                Projected Demand Decay
              </span>
              <span className="text-xl font-semibold text-charcoal mt-1 block">
                -{memo.projected_demand_decay_pct}%
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-secondary">
                Urgency Justification
              </h4>
              <p className="text-sm text-charcoal mt-1.5 leading-relaxed bg-surface p-3 rounded border border-border">
                {memo.urgency_justification}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-secondary">
                PM GatiShakti National Master Plan Alignment
              </h4>
              <p className="text-sm text-charcoal mt-1.5 leading-relaxed bg-surface p-3 rounded border border-border">
                {memo.gatishakti_alignment}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border bg-surface-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
