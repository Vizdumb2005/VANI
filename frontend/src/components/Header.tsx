import React, { useState } from 'react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenDossier: () => void;
  onSyncCpgrams: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenDossier,
  onSyncCpgrams,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: { key: ActiveView; label: string; description: string }[] = [
    { key: 'dashboard', label: 'Operations Command Dashboard', description: 'GIS Map, MCDA Matrix, Live Gateways & CPGRAMS' },
    { key: 'scm', label: 'Synthetic Control Impact Engine', description: 'Abadie causal counterfactual trajectories & placebos' },
    { key: 'gateways', label: 'Omnichannel Ingestion Gateways', description: 'Meta WhatsApp v21.0, Twilio IVR & Cloud Pub/Sub' },
    { key: 'brics', label: 'BRICS Cross-Border Settings', description: 'India LGD, Brazil IBGE, South Africa MDB' },
    { key: 'compliance', label: 'Statutory Compliance & DPO', description: 'DPDP Act, audit certificates, and OpenAPI spec' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border px-6 md:px-12 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity without academic version fluff */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectView('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-charcoal text-white flex items-center justify-center font-serif font-bold text-base shadow-subtle">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-serif tracking-tight text-charcoal font-semibold">
                  VAANI
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-subtle border border-border text-charcoal font-medium">
                  Operations Portal
                </span>
              </div>
              <p className="text-[11px] text-secondary font-normal hidden sm:block">
                Voice-to-Network Aggregated National Intelligence
              </p>
            </div>
          </button>

          {/* Operational live status indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-border bg-surface-subtle text-xs font-mono text-secondary">
            <span className="w-2 h-2 rounded-full bg-pastel-green-text animate-pulse"></span>
            <span>Network: Operational</span>
            <span className="text-secondary/50">·</span>
            <span>Cloud Run (asia-south1)</span>
          </div>
        </div>

        {/* Action Controls & 3-Line Hamburger Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSyncCpgrams}
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-mono font-medium rounded border border-border bg-surface hover:bg-surface-subtle text-charcoal transition-colors"
          >
            Sync CPGRAMS
          </button>

          <button
            onClick={onOpenDossier}
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors shadow-subtle"
          >
            Export Dossier
          </button>

          {/* 3-Line Hamburger Menu Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded border border-border bg-surface hover:bg-surface-subtle text-charcoal transition-colors flex items-center justify-center"
              aria-label="Navigation Menu"
            >
              <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-card shadow-hover z-50 py-2 divide-y divide-border animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-secondary">
                    Operational Modules
                  </div>

                  <div className="py-1">
                    {navItems.map((item) => {
                      const isActive = activeView === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            onSelectView(item.key);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex flex-col transition-colors ${
                            isActive
                              ? 'bg-surface-subtle text-charcoal font-medium'
                              : 'text-secondary hover:text-charcoal hover:bg-surface-subtle/60'
                          }`}
                        >
                          <div className="text-xs font-medium flex items-center justify-between">
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-charcoal"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-secondary mt-0.5 leading-tight">
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-surface-subtle/50 text-[11px] font-mono text-secondary flex justify-between items-center">
                    <span>Sovereign DPI Protocol</span>
                    <span>OpenAPI 3.1</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
