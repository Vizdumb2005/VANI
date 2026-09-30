"use client";

import React, { useState } from "react";
import { BRICS_COUNTRIES } from "../../lib/constants";
import { Globe, ArrowRight } from "lucide-react";

export const BricsCountrySwitcher: React.FC = () => {
  const [selectedIso, setSelectedIso] = useState<string>("IND");

  const country = BRICS_COUNTRIES.find((c) => c.iso === selectedIso) || BRICS_COUNTRIES[0];

  return (
    <div className="liquid-glass p-5 border border-white/10 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accentCyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              BRICS Cross-Border DPI Scalability Engine
            </h2>
          </div>
          <p className="text-xs text-mutedText">
            Global South sovereign architecture adaptable from MoPR LGD to IBGE (Brazil) & MDB (South Africa)
          </p>
        </div>

        {/* Country Selector Tabs */}
        <div className="flex gap-1.5">
          {BRICS_COUNTRIES.map((c) => (
            <button
              key={c.iso}
              onClick={() => setSelectedIso(c.iso)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                selectedIso === c.iso
                  ? "bg-accentCyan/20 text-accentCyan border border-accentCyan/40 font-bold shadow-cyanGlow"
                  : "bg-white/5 hover:bg-white/10 text-mutedText border border-white/5"
              }`}
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10">{c.iso}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Country Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-black/20 border border-white/5 text-xs font-mono">
        <div>
          <span className="text-mutedText text-[11px] block">Spatial Gazetteer Standard</span>
          <span className="text-white font-semibold">{country.spatial_standard}</span>
        </div>
        <div>
          <span className="text-mutedText text-[11px] block">Sovereign Currency</span>
          <span className="text-accentCyan font-semibold">{country.currency}</span>
        </div>
        <div>
          <span className="text-mutedText text-[11px] block">Target Schemes</span>
          <span className="text-amber-400 font-semibold truncate block">
            {country.schemes.join(", ")}
          </span>
        </div>
      </div>
    </div>
  );
};
