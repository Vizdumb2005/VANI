"use client";

import React, { useState } from "react";
import { Shield, FileText, CheckCircle2, Mail, ExternalLink, X } from "lucide-react";

interface StatutoryPolicyModalProps {
  onClose: () => void;
}

export const StatutoryPolicyModal: React.FC<StatutoryPolicyModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"dpdp" | "dpga" | "terms" | "dpo" | "openapi">("dpdp");

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="liquid-glass-strong border border-white/10 max-w-3xl w-full max-h-[85vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accentCyan" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Sovereign DPI Statutory & Compliance Matrix
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-mutedText hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20 text-xs font-mono px-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dpdp")}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "dpdp"
                ? "border-accentCyan text-accentCyan font-bold"
                : "border-transparent text-mutedText hover:text-white"
            }`}
          >
            DPDP Act 2023 (§8(7))
          </button>
          <button
            onClick={() => setActiveTab("dpga")}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "dpga"
                ? "border-accentCyan text-accentCyan font-bold"
                : "border-transparent text-mutedText hover:text-white"
            }`}
          >
            DPGA 9-Indicators
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "terms"
                ? "border-accentCyan text-accentCyan font-bold"
                : "border-transparent text-mutedText hover:text-white"
            }`}
          >
            Terms of Use
          </button>
          <button
            onClick={() => setActiveTab("dpo")}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "dpo"
                ? "border-accentCyan text-accentCyan font-bold"
                : "border-transparent text-mutedText hover:text-white"
            }`}
          >
            DPO Contact (72h SLA)
          </button>
          <button
            onClick={() => setActiveTab("openapi")}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "openapi"
                ? "border-accentCyan text-accentCyan font-bold"
                : "border-transparent text-mutedText hover:text-white"
            }`}
          >
            OpenAPI 3.1.0
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-200 leading-relaxed font-sans space-y-4">
          {activeTab === "dpdp" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-accentCyan font-mono">
                Digital Personal Data Protection Act, 2023 (DPDP Act) Invariants
              </h3>
              <p>
                VAANI operates under the lawful basis of <b>Section 4</b> and <b>Section 7(a),(b)</b> of India's DPDP Act 2023 for legitimate civic infrastructure grievance intake and public service delivery.
              </p>
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-[11px] space-y-1.5">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Section 8(7) Zero Audio Retention Invariant
                </div>
                <div>
                  Citizen voice inputs are decoded in RAM and destroyed immediately upon transcript generation. Ephemeral audio scratch buckets enforce automated 1-day deletion lifecycle rules. Zero raw citizen audio is persisted to disk or cloud storage.
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] space-y-1">
                <div className="text-white font-bold">HMAC-SHA256 Pseudonymization</div>
                <div>
                  Citizen device and phone numbers are converted to irreversible salted one-way hashes before lakehouse ingestion. Raw PII is scrubbed before disk writes.
                </div>
              </div>
            </div>
          )}

          {activeTab === "dpga" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-accentCyan font-mono">
                Digital Public Goods Alliance (DPGA) Standard Assessment
              </h3>
              <p>
                VAANI conforms strictly to all 9 indicators of the UN-endorsed Digital Public Goods Standard:
              </p>
              <ul className="space-y-2 list-disc list-inside font-mono text-[11px] text-slate-300">
                <li><b>Indicator 1 (Relevance to SDGs):</b> Fulfills SDG 9 (Industry, Innovation & Infrastructure) & SDG 16 (Peace, Justice & Strong Institutions).</li>
                <li><b>Indicator 2 (Open License):</b> Codebase under MIT License; aggregated open datasets under CC-BY 4.0.</li>
                <li><b>Indicator 3 (Clear Ownership):</b> Maintained by VAANI Sovereign DPI Secretariat.</li>
                <li><b>Indicator 4 (Documentation):</b> Complete OpenAPI 3.1.0 contracts, architecture design docs, and reproducible evaluation notebooks.</li>
                <li><b>Indicator 5 (Data Extraction):</b> REST APIs for civic signal extraction without proprietary lock-in.</li>
                <li><b>Indicator 6 (Adherence to Privacy):</b> Built-in privacy by design, k ≥ 3 aggregation threshold, and zero audio retention.</li>
                <li><b>Indicator 7 (Do No Harm):</b> Bias audits and Inter-Language Equity Gap ΔF1 ≤ 0.10 across all 22 scheduled languages.</li>
              </ul>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-accentCyan font-mono">
                Terms of Use & Non-Emergency Disclaimer
              </h3>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                <b>IMPORTANT NOTICE:</b> VAANI is a civic infrastructure prioritization platform and NOT an emergency life-safety dispatch system. For immediate police, fire, or medical emergencies, citizens must dial <b>112 (ERSS)</b>.
              </div>
              <p>
                VAANI aggregates citizen feedback for long-term capital allocation under Central and State infrastructure schemes. Individual petitions are grouped into geographic clusters and dispatched to DARPG CPGRAMS according to statutory SLAs.
              </p>
            </div>
          )}

          {activeTab === "dpo" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-accentCyan font-mono">
                Data Protection Officer & Grievance Redressal
              </h3>
              <p>
                Under Section 10 of India's DPDP Act 2023, citizens may submit data rectification, consent withdrawal, or inquiry notices directly to the designated Data Protection Officer:
              </p>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-accentCyan" />
                  <span>dpo@vaani-dpg.org</span>
                </div>
                <div className="text-mutedText">
                  Organization: <b>VAANI Sovereign DPI Secretariat</b>
                </div>
                <div className="text-mutedText">
                  Statutory SLA: <b>Resolution within 72 working hours</b>
                </div>
              </div>
            </div>
          )}

          {activeTab === "openapi" && (
            <div className="space-y-3 font-mono text-xs">
              <h3 className="text-sm font-bold text-accentCyan">
                OpenAPI 3.1.0 Protocol Endpoints
              </h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-emerald-400 font-bold">POST /requests</span>
                  <span className="text-mutedText">Omnichannel Intake (Web, Voice, WhatsApp)</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-cyan-400 font-bold">GET /signals</span>
                  <span className="text-mutedText">Deduplicated Demand Clusters (k ≥ 3)</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-cyan-400 font-bold">GET /priorities</span>
                  <span className="text-mutedText">Dynamic MCDA Composite Rankings</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-purple-400 font-bold">GET /priorities/&#123;rank&#125;/memo</span>
                  <span className="text-mutedText">Vertex AI Cabinet Policy Brief</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-cyan-400 font-bold">GET /impact/&#123;district&#125;</span>
                  <span className="text-mutedText">Synthetic Control Causal Decay</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 flex justify-between">
                  <span className="text-emerald-400 font-bold">POST /integrations/cpgrams/sync</span>
                  <span className="text-mutedText">DARPG NIC Dispatch Adapter</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
