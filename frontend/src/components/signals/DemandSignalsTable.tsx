"use client";

import React, { useState } from "react";
import { DemandSignal } from "../../types";
import { Radio, AlertCircle } from "lucide-react";

interface DemandSignalsTableProps {
  signals: DemandSignal[];
}

export const DemandSignalsTable: React.FC<DemandSignalsTableProps> = ({ signals }) => {
  const [minReports, setMinReports] = useState<number>(3);

  const filtered = signals.filter((s) => s.report_count >= minReports);

  return (
    <div className="liquid-glass p-5 border border-white/10 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-accentCyan animate-pulse" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              Real-Time Demand Signals (Urgency Ranked)
            </h2>
          </div>
          <p className="text-xs text-mutedText">
            Deduplicated MinHash LSH clusters enforcing k ≥ 3 privacy suppression (NDGFP compliant)
          </p>
        </div>

        {/* k-anonymity selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-mutedText">Privacy Threshold:</span>
          <select
            value={minReports}
            onChange={(e) => setMinReports(Number(e.target.value))}
            className="px-2 py-1 rounded bg-black/40 border border-white/10 text-white focus:outline-none font-mono"
          >
            <option value={3}>k ≥ 3 (Statutory Standard)</option>
            <option value={5}>k ≥ 5 (High Aggregation)</option>
            <option value={10}>k ≥ 10 (Critical Hotspots)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-white/10 text-mutedText font-mono text-[11px] uppercase">
              <th className="pb-2 pl-2">LGD Code</th>
              <th className="pb-2">District</th>
              <th className="pb-2">Sector</th>
              <th className="pb-2">Petitions (k)</th>
              <th className="pb-2">Clusters</th>
              <th className="pb-2 text-right pr-2">Urgency Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.slice(0, 8).map((sig, idx) => (
              <tr key={`${sig.lgd_district_code}-${sig.category}-${idx}`} className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 pl-2 font-mono text-mutedText">
                  {sig.lgd_district_code}
                </td>
                <td className="py-2.5 font-semibold text-white">
                  {sig.district}
                </td>
                <td className="py-2.5 capitalize text-slate-300">
                  {sig.category.replace("_", " ")}
                </td>
                <td className="py-2.5 font-mono text-white">
                  {sig.report_count}
                </td>
                <td className="py-2.5 font-mono text-mutedText">
                  {sig.signal_count}
                </td>
                <td className="py-2.5 text-right pr-2 font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sig.urgency >= 0.4
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    }`}
                  >
                    {sig.urgency.toFixed(3)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
