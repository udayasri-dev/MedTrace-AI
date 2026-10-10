import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  FileText, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  Database
} from 'lucide-react';
import { HealthMemoryItem, PatientProfile } from '../types/medtrace';

interface OverviewProps {
  onAskMedTrace: (initialQuery?: string) => void;
  onNavigate: (tab: 'overview' | 'assistant' | 'history' | 'reports') => void;
  recentMemories: HealthMemoryItem[];
  patient: PatientProfile;
}

export const Overview: React.FC<OverviewProps> = ({
  onAskMedTrace,
  onNavigate,
  recentMemories,
  patient
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Hero Section */}
      <section className="space-y-6 max-w-4xl">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span>Longitudinal Conversational AI</span>
          <span className="text-stone-300">/</span>
          <span>Hindsight Memory Layer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-stone-900 leading-[1.12]">
          Your health story, <br />
          <span className="text-amber-600">remembered over time.</span>
        </h1>

        <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
          A conventional chatbot only answers what you ask right now. MedTrace understands when 
          pertinent context from your past health journey connects to today’s conversation—bringing 
          the right memory back exactly when it matters.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onAskMedTrace()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-sm sm:text-base font-semibold shadow-md shadow-amber-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask MedTrace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-sm sm:text-base font-medium transition-colors shadow-2xs"
          >
            <Clock className="w-4 h-4 text-stone-500" />
            <span>View Health History</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-sm sm:text-base font-medium transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4 text-stone-500" />
            <span>Translate Reports</span>
          </button>
        </div>
      </section>

      {/* Interactive Demonstration Card (P0 Hackathon Showcase) */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <span>Interactive Demonstration</span>
              <span>·</span>
              <span className="text-amber-700 font-bold">{patient.name}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              How MedTrace Connects Today with Yesterday
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Witness how earlier health events are recalled without dumping irrelevant records into Gemini.
            </p>
          </div>

          <button
            onClick={() => onAskMedTrace("My orthopedist suggested a medication called Napro-B for knee pain. Since I had that reaction to the other medicine before, should I tell them?")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Launch Step 4 Demo Question</span>
          </button>
        </div>

        {/* 4-Stage Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
          
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-stone-100 bg-stone-50/70 space-y-2">
            <div className="text-xs text-stone-400 font-medium">May 2026 · Step 1</div>
            <h3 className="text-sm font-bold text-stone-900">Stomach Discomfort</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Patient reported recurring burning upper abdominal discomfort after meals. Retained as early symptom baseline.
            </p>
            <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/50">
              Retained in Memory
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border border-stone-100 bg-stone-50/70 space-y-2">
            <div className="text-xs text-stone-400 font-medium">June 2026 · Step 2</div>
            <h3 className="text-sm font-bold text-stone-900">Ultrasound Report</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Scan confirmed mild antral gastritis. Gallbladder ruled normal (no stones). Verified clinical finding.
            </p>
            <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/50">
              Clinical Report Stored
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl border border-stone-100 bg-stone-50/70 space-y-2">
            <div className="text-xs text-stone-400 font-medium">July 2026 · Step 3</div>
            <h3 className="text-sm font-bold text-stone-900">Drug Reaction (Dolorex)</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Prescribed fictional anti-inflammatory. Developed hives (urticaria) and acute stomach burning within 48 hours.
            </p>
            <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/50">
              Allergy Context Retained
            </div>
          </div>

          {/* Step 4: Today */}
          <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/40 space-y-2 relative">
            <div className="text-xs font-semibold text-amber-700">Today · Step 4 (Recall)</div>
            <h3 className="text-sm font-bold text-stone-900">New Health Inquiry</h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              Patient asks: <em>"My doctor recommended a new medicine. Should I mention that previous reaction?"</em>
            </p>
            <div className="text-[11px] font-medium text-amber-800 pt-1 border-t border-amber-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Selectively recalls Dolorex allergy & gastritis</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main 2-Column Content: Recent Context + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Recent Remembered Context (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Recent Health Context</h2>
              <p className="text-xs text-stone-500">
                Persistent memory items stored for {patient.name}
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
            >
              View all ({recentMemories.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {recentMemories.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-stone-200/80 bg-white hover:border-stone-300 transition-colors shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-amber-800">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.dateContext}</span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {item.isUserProvided ? 'User-Reported' : 'Clinical Diagnostic'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                  {item.content}
                </p>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-400">
                  <span>Source: {item.source.replace('_', ' ')}</span>
                  {item.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">Tags: {item.tags.slice(0, 3).join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Key Capabilities & Architecture Restraint (1 col) */}
        <div className="space-y-6">
          
          {/* Architecture Card */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              Behind the Scenes Architecture
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              MedTrace does not overwhelm Gemini by dumping your whole medical chart. When you ask a question, 
              the Memory Service identifies only relevant context items before reasoning.
            </p>
            <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Conversational layer: Gemini 3.8 Flash</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Long-term memory layer: Hindsight</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span>Persistence: Active across browser reloads</span>
              </div>
            </div>
          </div>

          {/* Medical Safety Card */}
          <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Medical Safety Guardrails</span>
            </div>
            <p className="text-xs text-amber-950/80 leading-relaxed">
              MedTrace is an informational AI health companion, not a licensed physician. It never prescribes, 
              alters dosages, or replaces clinical consultations. Emergency symptoms are triaged immediately.
            </p>
          </div>

          {/* Quick Prompts to Test */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Natural Questions to Try
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onAskMedTrace("What was that medicine I took before that gave me hives?")}
                className="w-full text-left p-2.5 rounded-lg border border-stone-100 hover:border-amber-300 hover:bg-amber-50/50 text-xs text-stone-700 transition-colors"
              >
                "What was that medicine I took before that gave me hives?"
              </button>
              <button
                onClick={() => onAskMedTrace("Can you explain what antral gastritis means in plain words?")}
                className="w-full text-left p-2.5 rounded-lg border border-stone-100 hover:border-amber-300 hover:bg-amber-50/50 text-xs text-stone-700 transition-colors"
              >
                "Can you explain what antral gastritis means in plain words?"
              </button>
              <button
                onClick={() => onAskMedTrace("I had sudden severe chest pressure and shortness of breath.")}
                className="w-full text-left p-2.5 rounded-lg border border-stone-100 hover:border-red-300 hover:bg-red-50/40 text-xs text-stone-700 transition-colors"
              >
                (Safety test) "Sudden severe chest pressure..."
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer attribution */}
      <footer className="pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-amber-600" />
          <span>MedTrace Health Assistant</span>
          <span>·</span>
          <span>Long-term memory powered by Hindsight</span>
        </div>
        <p>For informational guidance only. Always consult a healthcare provider.</p>
      </footer>

    </div>
  );
};
