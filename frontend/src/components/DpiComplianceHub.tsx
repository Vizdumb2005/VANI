import React, { useState } from 'react';
import { CpgramsBatch } from '../types';
import { syncCpgramsBatch } from '../services/api';

interface DpiComplianceHubProps {
  initialCpgramsBatch: CpgramsBatch;
  onOpenPolicy: (doc: 'privacy' | 'terms' | 'compliance' | 'dpo' | 'openapi') => void;
  onShowToast: (msg: string) => void;
}

export const DpiComplianceHub: React.FC<DpiComplianceHubProps> = ({
  initialCpgramsBatch,
  onOpenPolicy,
  onShowToast,
}) => {
  const [cpgramsBatch, setCpgramsBatch] = useState<CpgramsBatch>(initialCpgramsBatch);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const updated = await syncCpgramsBatch();
    setIsSyncing(false);
    setCpgramsBatch(updated);
    onShowToast("Batch synchronized with DARPG CPGRAMS endpoint");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif text-charcoal font-semibold">
            Institutional DPI & CPGRAMS Integration Ledger
          </h3>
          <p className="text-sm text-secondary mt-0.5">
            Bi-directional push adapter for DARPG Centralized Public Grievance Redress system and State CM Helplines.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => onOpenPolicy('privacy')}
            className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal"
          >
            Privacy Charter
          </button>
          <button
            onClick={() => onOpenPolicy('terms')}
            className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal"
          >
            Terms of Use
          </button>
          <button
            onClick={() => onOpenPolicy('compliance')}
            className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal"
          >
            Audit Certificate
          </button>
          <button
            onClick={() => onOpenPolicy('dpo')}
            className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle transition-colors text-charcoal"
          >
            DPO Redressal
          </button>
        </div>
      </div>

      {/* CPGRAMS Panel */}
      <div className="border border-border rounded-card bg-surface p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-secondary">
              DARPG CPGRAMS & State CM Portal Bi-Directional Adapter
            </div>
            <h4 className="font-serif text-lg font-semibold text-charcoal mt-0.5">
              Institutional Hotspot Dispatch Ledger
            </h4>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wider rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors shadow-subtle disabled:opacity-50"
          >
            {isSyncing ? 'Dispatching Batches...' : 'Sync Priority Batches to CPGRAMS'}
          </button>
        </div>

        <p className="text-xs text-secondary leading-relaxed">
          VAANI does not replace CPGRAMS. It acts as the Sovereign Ingestion and AI Intelligence Layer that verifies damage,
          resolves LGD spatial codes, aggregates co-located citizen reports into demand hotspots, and dispatches standardized batches directly to line ministries.
        </p>

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
