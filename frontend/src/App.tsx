import React, { useState, useEffect } from 'react';
import { useAuth } from './auth';
import { ActiveView, PriorityProject, DemandSignal, ScmImpactReport, CabinetMemo } from './types';
import { INITIAL_HOTSPOTS, INITIAL_PRIORITIES, INITIAL_SIGNALS, INITIAL_IMPACT_REPORT, INITIAL_CPGRAMS_BATCH } from './data/initialData';
import { fetchPriorities, fetchSignals, fetchImpactReport, fetchCabinetMemo, syncCpgramsBatch } from './services/api';
import { Header } from './components/Header';
import { OperationalMetrics } from './components/OperationalMetrics';
import { Map, SlidersHorizontal, Radio, Landmark, TrendingUp, Globe, Shield } from 'lucide-react';
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
  const { user, token } = useAuth();
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
    if (!user || !['operator', 'admin'].includes(user.role) || !token) {
      showToast("Operator sign-in is required before CPGRAMS dispatch");
      return;
    }
    try {
      await syncCpgramsBatch(10, token);
      showToast("Synchronized 10 priority hotspot batches with DARPG CPGRAMS");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "CPGRAMS dispatch failed");
    }
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
          isOperator={Boolean(user && ['operator', 'admin'].includes(user.role))}
          userEmail={user?.email || null}
        />

        <main className="max-w-7xl mx-auto px-6 md:px-12 py-5 space-y-4">
          {/* Executive KPI Ribbon */}
          <OperationalMetrics
            hotspotsCount={hotspots.length}
            signalsCount={signals.length}
            dispatchedBatchesCount={INITIAL_CPGRAMS_BATCH.tickets.length}
          />

          {/* Modular Workspace Tab Strip - Zero Scroll Enterprise Fit */}
          <div className="border-b border-border pt-1">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none text-xs font-mono w-full">
              {[
                { key: 'gis' as ActiveView, label: 'GIS Command', icon: <Map className="w-3.5 h-3.5" />, count: hotspots.length },
                { key: 'mcda' as ActiveView, label: 'MCDA Matrix', icon: <SlidersHorizontal className="w-3.5 h-3.5" />, count: priorities.length },
                { key: 'gateways' as ActiveView, label: 'Gateways', icon: <Radio className="w-3.5 h-3.5" />, count: 5 },
                { key: 'cpgrams' as ActiveView, label: 'CPGRAMS Ledger', icon: <Landmark className="w-3.5 h-3.5" />, count: INITIAL_CPGRAMS_BATCH.tickets.length },
                { key: 'scm' as ActiveView, label: 'Causal SCM', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { key: 'brics' as ActiveView, label: 'BRICS Framework', icon: <Globe className="w-3.5 h-3.5" /> },
                { key: 'compliance' as ActiveView, label: 'Compliance & DPO', icon: <Shield className="w-3.5 h-3.5" /> },
              ].map((tab) => {
                const isSelected = activeView === tab.key || (activeView === 'dashboard' && tab.key === 'gis');
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveView(tab.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b-2 font-medium transition-all whitespace-nowrap ${
                      isSelected
                        ? 'border-charcoal text-charcoal bg-surface font-semibold shadow-xs'
                        : 'border-transparent text-secondary hover:text-charcoal hover:bg-surface-subtle'
                    }`}
                  >
                    <span className="opacity-80 shrink-0">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-charcoal text-white' : 'bg-surface-subtle border border-border text-secondary'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Workspace Sheet */}
          <div className="pt-2">
            {/* Sheet 1: GIS Command Map */}
            {(activeView === 'gis' || activeView === 'dashboard') && (
              <GisCommandMap hotspots={hotspots} signals={signals} />
            )}

            {/* Sheet 2: MCDA Prioritization Matrix */}
            {activeView === 'mcda' && (
              <McdaSensitivityTool
                priorities={priorities}
                onOpenMemo={handleOpenMemo}
                onOpenDossier={(p) => setDossierData(p)}
              />
            )}

            {/* Sheet 3: Omnichannel Gateways & Telemetry */}
            {activeView === 'gateways' && (
              <ProductionChannelGateway
                onShowToast={showToast}
                canDispatch={Boolean(user && ['operator', 'admin'].includes(user.role))}
              />
            )}

            {/* Sheet 4: Institutional CPGRAMS Dispatch Ledger */}
            {activeView === 'cpgrams' && (
              <DpiComplianceHub
                initialCpgramsBatch={INITIAL_CPGRAMS_BATCH}
                onOpenPolicy={(doc) => setPolicyDoc(doc)}
                onShowToast={showToast}
                canDispatch={Boolean(user && ['operator', 'admin'].includes(user.role))}
                operatorToken={token}
              />
            )}

            {/* Sheet 5: SCM Impact Engine */}
            {activeView === 'scm' && (
              <ScmImpactEngine impactReport={impactReport} />
            )}

            {/* Sheet 6: BRICS Settings */}
            {activeView === 'brics' && (
              <BricsSettings />
            )}

            {/* Sheet 7: Statutory Compliance Hub */}
            {activeView === 'compliance' && (
              <DpiComplianceHub
                initialCpgramsBatch={INITIAL_CPGRAMS_BATCH}
                onOpenPolicy={(doc) => setPolicyDoc(doc)}
                onShowToast={showToast}
                canDispatch={Boolean(user && ['operator', 'admin'].includes(user.role))}
                operatorToken={token}
              />
            )}
          </div>
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
