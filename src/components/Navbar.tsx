import React, { useState } from 'react';
import { 
  Activity, 
  MessageSquare, 
  Clock, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  User,
  Info,
  ChevronDown
} from 'lucide-react';
import { MemoryServiceStatus, PatientProfile } from '../types/medtrace';

interface NavbarProps {
  activeTab: 'overview' | 'assistant' | 'history' | 'reports';
  setActiveTab: (tab: 'overview' | 'assistant' | 'history' | 'reports') => void;
  memoryStatus: MemoryServiceStatus | null;
  patient: PatientProfile;
  setPatient: (patient: PatientProfile) => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  memoryStatus,
  patient,
  setPatient,
  onResetDemo
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPatientMenu, setShowPatientMenu] = useState(false);

  const isHindsightActive = memoryStatus?.provider === 'hindsight' && memoryStatus?.configured;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#faf9f6]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Tagline */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-2.5 text-left focus:outline-none group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-600/20 group-hover:bg-amber-700 transition-colors">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold tracking-tight text-stone-900">MedTrace</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800">
                      AI Memory
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 hidden sm:block">
                    Connecting today's health with yesterday's story
                  </p>
                </div>
              </button>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 ml-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'text-stone-900 bg-stone-200/60 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'assistant'
                      ? 'text-stone-900 bg-stone-200/60 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Assistant
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'text-stone-900 bg-stone-200/60 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-stone-500" />
                  Health History
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'text-stone-900 bg-stone-200/60 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-stone-500" />
                  Reports
                </button>
              </nav>
            </div>

            {/* Right Controls: Memory Status + Patient Profile + CTA */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              
              {/* Memory Service Status Pill / Trigger */}
              <button
                onClick={() => setShowStatusModal(true)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white/70 hover:bg-white text-xs text-stone-600 transition-colors shadow-2xs"
                title="Inspect Long-Term Memory Service Architecture"
              >
                <span className={`w-2 h-2 rounded-full ${isHindsightActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-medium text-stone-700">
                  {isHindsightActive ? 'Hindsight Memory' : 'Memory Engine'}
                </span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-500">
                  {memoryStatus?.itemCount ?? 4} items
                </span>
                <Info className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
              </button>

              {/* Patient Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPatientMenu(!showPatientMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-800 transition-colors shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span className="truncate max-w-[110px] sm:max-w-[140px]">{patient.name}</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {showPatientMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-stone-200 bg-white shadow-lg p-2 z-50">
                    <div className="px-2 py-1.5 border-b border-stone-100 mb-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Active Patient Context</p>
                      <p className="text-xs text-stone-600 font-medium">{patient.summary}</p>
                    </div>

                    <button
                      onClick={() => {
                        setPatient({
                          id: 'ananya-rao',
                          name: 'Ananya Rao',
                          age: 34,
                          summary: 'Fictional demo patient with longitudinal stomach & medication history',
                          isFictionalDemo: true
                        });
                        setShowPatientMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        patient.id === 'ananya-rao' ? 'bg-amber-50 text-amber-900 font-medium' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">Ananya Rao (Demo)</div>
                        <div className="text-[11px] text-stone-500">Curated 4-stage health timeline</div>
                      </div>
                      {patient.id === 'ananya-rao' && <span className="text-amber-600 text-xs">✓</span>}
                    </button>

                    <button
                      onClick={() => {
                        setPatient({
                          id: 'custom-patient',
                          name: 'New Custom Patient',
                          age: 30,
                          summary: 'Clean slate for live memory testing & unexpected questions',
                          isFictionalDemo: false
                        });
                        setShowPatientMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        patient.id === 'custom-patient' ? 'bg-amber-50 text-amber-900 font-medium' : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">New Custom Patient</div>
                        <div className="text-[11px] text-stone-500">Blank record for fresh testing</div>
                      </div>
                      {patient.id === 'custom-patient' && <span className="text-amber-600 text-xs">✓</span>}
                    </button>

                    {patient.id === 'ananya-rao' && (
                      <div className="mt-2 pt-2 border-t border-stone-100">
                        <button
                          onClick={() => {
                            onResetDemo();
                            setShowPatientMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                          <span>Reset Demo Memories</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => setActiveTab('assistant')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-amber-600/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask MedTrace</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-stone-200/60 bg-white/70 px-4 py-1.5 justify-around text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1 px-2.5 rounded-md ${activeTab === 'overview' ? 'font-semibold text-amber-700' : 'text-stone-600'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`py-1 px-2.5 rounded-md ${activeTab === 'assistant' ? 'font-semibold text-amber-700' : 'text-stone-600'}`}
          >
            Assistant
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1 px-2.5 rounded-md ${activeTab === 'history' ? 'font-semibold text-amber-700' : 'text-stone-600'}`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-1 px-2.5 rounded-md ${activeTab === 'reports' ? 'font-semibold text-amber-700' : 'text-stone-600'}`}
          >
            Reports
          </button>
        </div>
      </header>

      {/* Memory Service Architecture Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  MedTrace Memory Service
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Long-term health memory architecture powered by Hindsight
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-600">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-stone-800">Current Provider</span>
                  <span className="font-medium text-amber-700">
                    {memoryStatus?.providerName || 'Local Persistent Memory Engine'}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  {memoryStatus?.details}
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-stone-200 flex items-center justify-between text-stone-500">
                  <span>Persisted Items: <strong>{memoryStatus?.itemCount || 0}</strong></span>
                  <span>Refresh Persistence: <strong>Active (Disk-backed)</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-stone-800 text-xs uppercase tracking-wider">Hindsight Core Operations</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60">
                    <div className="font-bold text-amber-900 text-xs mb-0.5">1. RETAIN</div>
                    <div className="text-[11px] text-amber-800">Extracts durable health facts from conversation</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60">
                    <div className="font-bold text-emerald-900 text-xs mb-0.5">2. RECALL</div>
                    <div className="text-[11px] text-emerald-800">Selects only relevant past items for the question</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/60">
                    <div className="font-bold text-indigo-900 text-xs mb-0.5">3. REFLECT</div>
                    <div className="text-[11px] text-indigo-800">Synthesizes longitudinal patterns & drug sensitivities</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 text-[11px] text-stone-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Clean Abstraction Guarantee:</strong> When real Hindsight credentials (<code className="font-mono text-stone-800">HINDSIGHT_API_KEY</code>) are set in environment secrets, MedTrace routes calls directly to Hindsight without rewriting application logic.
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
