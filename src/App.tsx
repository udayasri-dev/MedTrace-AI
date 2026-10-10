import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Overview } from './components/Overview';
import { Assistant } from './components/Assistant';
import { HealthHistory } from './components/HealthHistory';
import { Reports } from './components/Reports';
import { HealthMemoryItem, MemoryServiceStatus, PatientProfile } from './types/medtrace';
import { ShieldCheck, Activity } from 'lucide-react';

const DEFAULT_DEMO_PATIENT: PatientProfile = {
  id: 'ananya-rao',
  name: 'Ananya Rao',
  age: 34,
  summary: 'Fictional demo patient with longitudinal stomach discomfort & Dolorex drug allergy',
  isFictionalDemo: true
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'assistant' | 'history' | 'reports'>('overview');
  const [patient, setPatient] = useState<PatientProfile>(DEFAULT_DEMO_PATIENT);
  const [memories, setMemories] = useState<HealthMemoryItem[]>([]);
  const [memoryStatus, setMemoryStatus] = useState<MemoryServiceStatus | null>(null);
  const [initialAssistantQuery, setInitialAssistantQuery] = useState<string | undefined>(undefined);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setMemoryStatus(data.memoryService);
      }
    } catch (err) {
      console.warn('Failed to load status:', err);
    }
  }, []);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch(`/api/memory?patientId=${patient.id}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.warn('Failed to load memories:', err);
    }
  }, [patient.id]);

  useEffect(() => {
    fetchStatus();
    fetchMemories();
  }, [fetchStatus, fetchMemories]);

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/memory/reset-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id })
      });
      if (res.ok) {
        await fetchMemories();
        await fetchStatus();
      }
    } catch (err) {
      console.error('Reset demo error:', err);
    }
  };

  const handleAskMedTrace = (query?: string) => {
    if (query) {
      setInitialAssistantQuery(query);
    }
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        memoryStatus={memoryStatus}
        patient={patient}
        setPatient={setPatient}
        onResetDemo={handleResetDemo}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <Overview
            onAskMedTrace={handleAskMedTrace}
            onNavigate={(tab) => setActiveTab(tab)}
            recentMemories={memories}
            patient={patient}
          />
        )}

        {activeTab === 'assistant' && (
          <Assistant
            patient={patient}
            initialQuery={initialAssistantQuery}
            onClearInitialQuery={() => setInitialAssistantQuery(undefined)}
            onRefreshMemories={fetchMemories}
          />
        )}

        {activeTab === 'history' && (
          <HealthHistory
            patient={patient}
            memories={memories}
            onRefreshMemories={fetchMemories}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            patient={patient}
            onRefreshMemories={fetchMemories}
            onAskMedTrace={handleAskMedTrace}
          />
        )}
      </main>

      {/* Persistent Medical Disclaimer & Status Footer */}
      <footer className="bg-white border-t border-stone-200 py-3 text-center text-[11px] text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>MedTrace is an AI health informational companion. It does not provide medical diagnoses or prescriptions.</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span>Memory Architecture: Hindsight Layer</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-500">Ananya Rao Fictional Patient Demo</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
