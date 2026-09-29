"use client";

import React, { useState } from "react";
import { syncCpgramsBatch } from "../../lib/api";
import { Send, CheckCircle2, Clock, Landmark, ShieldCheck } from "lucide-react";

export const CpgramsDispatchLedger: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);

  const pendingHotspots = [
    { district: "Jabalpur", lgd: 153, category: "public_safety", reports: 141, excess: "4.8×", ministry: "MHA (Safe City)", sla: "15 Days (P1)" },
    { district: "Varanasi", lgd: 102, category: "roads", reports: 68, excess: "3.4×", ministry: "MoRTH (PMGSY)", sla: "15 Days (P1)" },
    { district: "Gaya", lgd: 215, category: "water_sanitation", reports: 54, excess: "3.1×", ministry: "Jal Shakti (JJM)", sla: "15 Days (P1)" },
    { district: "Madurai", lgd: 588, category: "power", reports: 49, excess: "2.9×", ministry: "Power (RDSS)", sla: "30 Days (P2)" },
    { district: "Salem", lgd: 593, category: "education", reports: 38, excess: "2.5×", ministry: "MoE (Samagra)", sla: "30 Days (P2)" },
  ];

  const handleSync = async () => {
    setLoading(true);
    try {
      const data = await syncCpgramsBatch(5);
      setReceipt(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-glass p-5 border border-white/10 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-accentCyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              DARPG CPGRAMS & State CM Portal Push Ledger
            </h2>
          </div>
          <p className="text-xs text-mutedText">
            Bi-directional institutional dispatch adapter with automated ministry routing & statutory resolution SLAs
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#070B14] font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? "Dispatching..." : "Push Batch to DARPG NIC"}</span>
        </button>
      </div>

      {/* Dispatch Ledger Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-white/10 text-mutedText font-mono text-[11px] uppercase">
              <th className="pb-2 pl-2">Hotspot District</th>
              <th className="pb-2">LGD Code</th>
              <th className="pb-2">Target Ministry</th>
              <th className="pb-2">Demand Vol.</th>
              <th className="pb-2">Statutory SLA</th>
              <th className="pb-2 text-right pr-2">Protocol Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pendingHotspots.map((item) => (
              <tr key={item.district + item.category} className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 pl-2 font-semibold text-white">
                  {item.district}
                </td>
                <td className="py-2.5 font-mono text-mutedText">
                  LGD {item.lgd}
                </td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px]">
                    {item.ministry}
                  </span>
                </td>
                <td className="py-2.5 font-mono">
                  <span className="text-white font-medium">{item.reports} reports</span>{" "}
                  <span className="text-amber-400 font-semibold">({item.excess})</span>
                </td>
                <td className="py-2.5 font-mono text-[11px] text-accentCyan flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.sla}</span>
                </td>
                <td className="py-2.5 text-right pr-2">
                  <span className="text-emerald-400 text-[11px] font-mono flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>QUEUED FOR SYNC</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync Receipt Modal/Card */}
      {receipt && (
        <div className="p-3.5 rounded-lg liquid-glass-strong border border-emerald-500/30 text-xs font-mono space-y-1.5 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Batch Dispatched: {receipt.batch_id}
            </span>
            <span className="text-mutedText">{receipt.timestamp}</span>
          </div>
          <div className="text-slate-300">
            NIC Receipt Hash: <span className="text-accentCyan font-bold">{receipt.nic_receipt_hash}</span> • Records: {receipt.records_dispatched}
          </div>
          <div className="text-[11px] text-mutedText">
            Delivery confirmation acknowledged via DARPG CPGRAMS v2 institutional push protocol.
          </div>
        </div>
      )}
    </div>
  );
};
