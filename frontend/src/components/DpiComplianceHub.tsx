import React, { useState } from 'react';
import { CpgramsBatch } from '../types';
import { syncCpgramsBatch } from '../services/api';

interface DpiComplianceHubProps {
  initialCpgramsBatch: CpgramsBatch;
  onOpenPolicy: (doc: 'privacy' | 'terms' | 'compliance' | 'dpo' | 'openapi') => void;
  onShowToast: (msg: string) => void;
  canDispatch: boolean;
  operatorToken: string | null;
}

export const DpiComplianceHub: React.FC<DpiComplianceHubProps> = ({
  initialCpgramsBatch,
  onOpenPolicy,
  onShowToast,
  canDispatch,
  operatorToken,
}) => {
  const [cpgramsBatch, setCpgramsBatch] = useState<CpgramsBatch>(initialCpgramsBatch);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSync = async () => {
    if (!canDispatch || !operatorToken) {
      onShowToast("Operator sign-in is required before CPGRAMS dispatch");
      return;
    }
    setIsSyncing(true);
    try {
      const updated = await syncCpgramsBatch(5, operatorToken);
      setCpgramsBatch(updated);
      onShowToast("Batch synchronized with DARPG CPGRAMS endpoint");
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "CPGRAMS dispatch failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-serif text-charcoal font-semibold">
            Institutional CPGRAMS Dispatch Ledger
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-pastel-green text-pastel-green-text font-medium">
            DARPG v2 Protocol
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          <button
            onClick={() => onOpenPolicy('privacy')}
            className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal text-[11px]"
          >
            Privacy Charter
          </button>
          <button
            onClick={() => onOpenPolicy('terms')}
            className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal text-[11px]"
          >
            Terms of Use
          </button>
          <button
            onClick={() => onOpenPolicy('compliance')}
            className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal text-[11px]"
          >
            Audit Certificate
          </button>
          <button
            onClick={() => onOpenPolicy('dpo')}
            className="px-2.5 py-1 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal text-[11px]"
          >
            DPO Redressal
          </button>
        </div>
      </div>

      {/* CPGRAMS Panel */}
      <div className="border border-border rounded-card bg-surface p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-serif text-base font-semibold text-charcoal">
              Dispatched Institutional Batches
            </h4>
            <span className="text-[11px] font-mono text-secondary">
              Line Ministry Integration Ledger
            </span>
          </div>
          {canDispatch ? (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors shadow-subtle disabled:opacity-50"
            >
              {isSyncing ? 'Dispatching...' : 'Sync Priority Batches'}
            </button>
          ) : (
            <span className="rounded border border-border px-2.5 py-1 text-[11px] font-mono text-secondary">
              Read-only viewer ledger
            </span>
          )}
        </div>

        {/* Ledger table */}
        <div className="border border-border rounded overflow-hidden">
          <div className="px-4 py-2 bg-surface-subtle border-b border-border flex items-center justify-between text-xs font-mono">
            <span className="text-secondary">Batch Identifier: {cpgramsBatch.batch_id}</span>
            <span className="px-2 py-0.5 rounded bg-pastel-green text-pastel-green-text font-medium">
              {cpgramsBatch.status}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-secondary font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Registration ID</th>
                  <th className="py-2.5 px-3">Target Ministry / Line Agency</th>
                  <th className="py-2.5 px-3">Jurisdiction</th>
                  <th className="py-2.5 px-3 text-right">Aggregated Petitions</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cpgramsBatch.tickets.map((t, idx) => (
                  <tr key={idx} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-charcoal">
                      {t.grievance_registration_number}
                    </td>
                    <td className="py-2.5 px-3">{t.administrative_routing.ministry}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {t.administrative_routing.district_name} (LGD {t.administrative_routing.lgd_district_code})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {t.intelligence_metrics.deduplicated_petition_count}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-pastel-green text-pastel-green-text font-mono text-[10px] font-medium">
                        Dispatched
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* OpenAPI Directory */}
      <div className="border border-border rounded-card bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-lg font-semibold text-charcoal">
            OpenAPI 3.1.0 Institutional Endpoints
          </h4>
          <span className="text-xs font-mono text-secondary">
            Sovereign Interoperability Protocol
          </span>
        </div>

        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-border text-secondary font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Path</th>
                <th className="py-2.5 px-3">Specification & Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11.5px]">
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-blue-text">POST</td>
                <td className="py-2 px-3 font-medium text-charcoal">/requests</td>
                <td className="py-2 px-3 text-secondary font-sans">Omnichannel intake (Web/WhatsApp voice + text + photo)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-blue-text">POST</td>
                <td className="py-2 px-3 font-medium text-charcoal">/integrations/cpgrams/sync</td>
                <td className="py-2 px-3 text-secondary font-sans">Push verified community hotspots to DARPG CPGRAMS</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-green-text">GET</td>
                <td className="py-2 px-3 font-medium text-charcoal">/signals</td>
                <td className="py-2 px-3 text-secondary font-sans">Deduplicated demand signals (k &ge; 3 suppression)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-green-text">GET</td>
                <td className="py-2 px-3 font-medium text-charcoal">/priorities</td>
                <td className="py-2 px-3 text-secondary font-sans">MCDA project investment rankings</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-green-text">GET</td>
                <td className="py-2 px-3 font-medium text-charcoal">/priorities/{'{rank}'}/memo</td>
                <td className="py-2 px-3 text-secondary font-sans">Google Gemini executive Cabinet Policy Brief</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-green-text">GET</td>
                <td className="py-2 px-3 font-medium text-charcoal">/impact/{'{district}'}</td>
                <td className="py-2 px-3 text-secondary font-sans">Abadie synthetic control causal evaluation report</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-pastel-green-text">GET</td>
                <td className="py-2 px-3 font-medium text-charcoal">/compliance</td>
                <td className="py-2 px-3 text-secondary font-sans">Automated statutory regulatory audit matrix</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
