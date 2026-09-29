import React, { useState, useEffect } from 'react';
import { ActiveView, PriorityProject, DemandSignal, ScmImpactReport, CabinetMemo } from './types';
import { INITIAL_HOTSPOTS, INITIAL_PRIORITIES, INITIAL_SIGNALS, INITIAL_IMPACT_REPORT, INITIAL_CPGRAMS_BATCH } from './data/initialData';
import { fetchPriorities, fetchSignals, fetchImpactReport, fetchCabinetMemo, syncCpgramsBatch } from './services/api';
import { Header } from './components/Header';
import { OperationalMetrics } from './components/OperationalMetrics';
import { GisCommandMap } from './components/GisCommandMap';
import { McdaSensitivityTool } from './components/McdaSensitivityTool';
import { ScmImpactEngine } from './components/ScmImpactEngine';
import { ProductionChannelGateway } from './components/ProductionChannelGateway';
import { DpiComplianceHub } from './components/DpiComplianceHub';
import { BricsSettings } from './components/BricsSettings';
import { CabinetMemoModal } from './components/CabinetMemoModal';
import { DossierModal } from './components/DossierModal';
import { PolicyModal } from './components/PolicyModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const [hotspots] = useState(INITIAL_HOTSPOTS);
  const [priorities, setPriorities] = useState<PriorityProject[]>(INITIAL_PRIORITIES);
  const [signals, setSignals] = useState<DemandSignal[]>(INITIAL_SIGNALS);
  const [impactReport, setImpactReport] = useState<ScmImpactReport>(INITIAL_IMPACT_REPORT);

  // Modals state
  const [memoData, setMemoData] = useState<CabinetMemo | null>(null);
  const [dossierData, setDossierData] = useState<PriorityProject | null>(null);
  const [policyDoc, setPolicyDoc] = useState<'privacy' | 'terms' | 'compliance' | 'dpo' | 'openapi' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPriorities().then(setPriorities);
    fetchSignals().then(setSignals);
    fetchImpactReport().then(setImpactReport);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const handleOpenMemo = async (rank: number) => {
    const memo = await fetchCabinetMemo(rank);
    setMemoData(memo);
  };

  const handleSyncCpgrams = async () => {
    await syncCpgramsBatch();
    showToast("Synchronized 10 priority hotspot batches with DARPG CPGRAMS");
  };

  return (
    <div className="min-h-screen bg-canvas text-charcoal flex flex-col justify-between selection:bg-pastel-blue selection:text-pastel-blue-text">
      <div>
        {/* Production Operational Header with 3-line Menu */}
        <Header
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenDossier={() => setDossierData(priorities[0] || null)}
          onSyncCpgrams={handleSyncCpgrams}
        />

        <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-10">
          {/* Main Singular Operational Dashboard */}
          {activeView === 'dashboard' && (
            <div className="space-y-10">
              {/* Daily Operations Metrics Ribbon */}
              <OperationalMetrics
                hotspotsCount={hotspots.length}
                signalsCount={signals.length}
                dispatchedBatchesCount={INITIAL_CPGRAMS_BATCH.tickets.length}
              />

              {/* Sovereign GIS Hotspot Command Map */}
              <section className="pt-2">
                <GisCommandMap hotspots={hotspots} signals={signals} />
              </section>

              {/* Dynamic MCDA Policy Decision Matrix */}
              <section className="pt-4 border-t border-border">
                <McdaSensitivityTool
                  priorities={priorities}
                  onOpenMemo={handleOpenMemo}
                  onOpenDossier={(p) => setDossierData(p)}
                />
              </section>

              {/* Live Channel Gateways & Pipeline Telemetry */}
              <section className="pt-4 border-t border-border">
                <ProductionChannelGateway onShowToast={showToast} />
              </section>

              {/* Institutional CPGRAMS Dispatch Ledger */}
              <section className="pt-4 border-t border-border">
                <DpiComplianceHub
                  initialCpgramsBatch={INITIAL_CPGRAMS_BATCH}
                  onOpenPolicy={(doc) => setPolicyDoc(doc)}
                  onShowToast={showToast}
                />
              </section>
            </div>
          )}

          {/* SCM Impact Engine View */}
          {activeView === 'scm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono uppercase text-secondary">
                  Module View · Synthetic Control Method
                </span>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-xs font-mono text-charcoal hover:underline"
                >
                  ← Return to Main Dashboard
                </button>
              </div>
              <ScmImpactEngine impactReport={impactReport} />
            </div>
          )}

          {/* Dedicated Channel Gateways View */}
          {activeView === 'gateways' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono uppercase text-secondary">
                  Module View · Channel Gateways & Telemetry
                </span>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-xs font-mono text-charcoal hover:underline"
                >
                  ← Return to Main Dashboard
                </button>
              </div>
              <ProductionChannelGateway onShowToast={showToast} />
            </div>
          )}

          {/* BRICS Settings View */}
          {activeView === 'brics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono uppercase text-secondary">
                  Module View · BRICS Cross-Border Settings
                </span>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-xs font-mono text-charcoal hover:underline"
                >
                  ← Return to Main Dashboard
                </button>
              </div>
              <BricsSettings />
            </div>
          )}

          {/* Compliance View */}
          {activeView === 'compliance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-mono uppercase text-secondary">
                  Module View · Statutory Governance & Audit
                </span>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-xs font-mono text-charcoal hover:underline"
                >
                  ← Return to Main Dashboard
                </button>
              </div>
              <DpiComplianceHub
                initialCpgramsBatch={INITIAL_CPGRAMS_BATCH}
                onOpenPolicy={(doc) => setPolicyDoc(doc)}
                onShowToast={showToast}
              />
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer onOpenPolicy={(doc) => setPolicyDoc(doc)} />

      {/* Modals */}
      <CabinetMemoModal memo={memoData} onClose={() => setMemoData(null)} />
      <DossierModal project={dossierData} onClose={() => setDossierData(null)} />
      <PolicyModal docKey={policyDoc} onClose={() => setPolicyDoc(null)} />
      <Toast message={toastMsg} />
    </div>
  );
};

export default App;
