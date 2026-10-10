import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  BookmarkCheck, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Loader2
} from 'lucide-react';
import { PatientProfile, ReportFinding, MedicalTermDef } from '../types/medtrace';

interface ReportsProps {
  patient: PatientProfile;
  onRefreshMemories: () => void;
  onAskMedTrace: (query?: string) => void;
}

const SAMPLE_ANANYA_REPORT = `METRO HEALTH DIAGNOSTIC CENTER
PATIENT: Rao, Ananya | AGE: 34 | REF: Dr. K. Mehta
EXAMINATION: Transabdominal Ultrasound (Upper Abdomen) & Basic Metabolic Panel
DATE OF STUDY: June 18, 2026

CLINICAL INDICATION:
34-year-old female presenting with 6-week history of episodic post-prandial epigastric burning and upper abdominal discomfort, worse following acidic or spiced meals. Rule out cholelithiasis, biliary dyskinesia, or hepatic pathology.

ULTRASOUND FINDINGS:
1. HEPATOBILIARY SYSTEM:
   - Liver: Normal parenchymal echogenicity. No focal solid or cystic hepatic mass identified.
   - Gallbladder: Well-distended with thin, regular walls measured at 2.1 mm (normal < 3.0 mm). Sonographic Murphy's sign is negative. No acoustic shadowing calculi, biliary sludge, or cholelithiasis identified.
   - Biliary Tree: Common bile duct is normal in caliber measuring 4.1 mm. No intrahepatic ductal dilatation.
   - Pancreas & Spleen: Visualized portions appear normal within physiological limits.

2. GASTRODUODENAL EVALUATION:
   - Gastric Antrum: Mild prominent mucosal fold thickening with localized hyperemia observed along the antral mucosa. Findings are sonographically compatible with mild superficial antral gastritis. No hypertrophic pyloric stenosis or mass.

LABORATORY FINDINGS (SERUM):
- ALT (Alanine Aminotransferase): 22 U/L [Reference: 7 - 35 U/L] -> Normal
- AST (Aspartate Aminotransferase): 20 U/L [Reference: 8 - 33 U/L] -> Normal
- Alkaline Phosphatase: 68 U/L [Reference: 44 - 147 U/L] -> Normal
- Total Bilirubin: 0.8 mg/dL [Reference: 0.2 - 1.2 mg/dL] -> Normal
- Serum Lipase: 34 U/L [Reference: 10 - 140 U/L] -> Normal
- H. pylori Stool Antigen: Negative

IMPRESSION:
1. No sonographic evidence of cholelithiasis, cholecystitis, or biliary ductal obstruction.
2. Mild mucosal irritation localized to gastric antrum, suggestive of mild antral gastritis.
3. Liver and pancreatic enzymes strictly unremarkable.
RECOMMENDATION: Clinical correlation with dietary modifications and gastroprotective therapy if indicated by primary physician.`;

export const Reports: React.FC<ReportsProps> = ({
  patient,
  onRefreshMemories,
  onAskMedTrace
}) => {
  const [reportText, setReportText] = useState(SAMPLE_ANANYA_REPORT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    summary: string;
    reportType: string;
    keyFindings: ReportFinding[];
    medicalTerms: MedicalTermDef[];
    doctorQuestions: string[];
  } | null>({
    title: 'Upper Abdominal Ultrasound & Metabolic Panel',
    summary: 'Ultrasound confirmed mild antral gastritis (stomach lining irritation), while completely ruling out gallstones or gallbladder inflammation. All liver and pancreatic blood enzymes are within healthy normal ranges.',
    reportType: 'ultrasound',
    keyFindings: [
      {
        marker: 'Gastric Antrum',
        value: 'Mild mucosal thickening & hyperemia',
        normalRange: 'Normal mucosal folds',
        status: 'attention',
        clinicalNote: 'Indicates mild surface inflammation of the stomach lining (antral gastritis).'
      },
      {
        marker: 'Gallbladder & CBD',
        value: 'Wall 2.1mm, CBD 4.1mm, No calculi',
        normalRange: 'Wall < 3.0mm, No stones',
        status: 'normal',
        clinicalNote: 'Completely rules out gallstones as the cause of your upper abdominal symptoms.'
      },
      {
        marker: 'Liver Enzymes (ALT / AST)',
        value: 'ALT: 22 U/L, AST: 20 U/L',
        normalRange: 'ALT: 7-35, AST: 8-33',
        status: 'normal',
        clinicalNote: 'Healthy liver cell function; no hepatic stress detected.'
      },
      {
        marker: 'H. pylori Antigen',
        value: 'Negative',
        normalRange: 'Negative',
        status: 'normal',
        clinicalNote: 'No bacterial H. pylori infection identified as the source of gastritis.'
      }
    ],
    medicalTerms: [
      {
        term: 'Antral Gastritis',
        plainExplanation: 'Irritation and inflammation located in the lower portion of the stomach (antrum) where food collects before entering the small intestine.'
      },
      {
        term: 'Cholelithiasis',
        plainExplanation: 'The medical term for gallstones forming inside the gallbladder.'
      },
      {
        term: 'Sonographic Murphy’s Sign',
        plainExplanation: 'A diagnostic maneuver during an ultrasound where the doctor presses the probe against the gallbladder; a negative result means no focal tenderness or acute gallbladder infection.'
      }
    ],
    doctorQuestions: [
      'Since my ultrasound showed mild gastritis rather than gallstones, should I adjust my meal schedule or avoid certain acidic foods?',
      'Would a short course of an acid reducer or mucosal protective agent be appropriate?',
      'If I am ever prescribed medications like anti-inflammatories, do I need extra stomach protection?'
    ]
  });

  const [hasSavedToHistory, setHasSavedToHistory] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setIsAnalyzing(true);
    setHasSavedToHistory(false);
    setSaveSuccessMsg('');

    try {
      const res = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText,
          patientName: patient.name
        })
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Report analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetainToHistory = async () => {
    if (!analysisResult) return;

    try {
      const res = await fetch('/api/memory/retain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          category: 'reports',
          title: analysisResult.title,
          content: `${analysisResult.summary} Key findings: ${analysisResult.keyFindings.map(f => `${f.marker}: ${f.value}`).join('; ')}`,
          dateContext: 'June 2026 (Diagnostic Report)',
          tags: ['report', analysisResult.reportType, 'diagnostics'],
          isUserProvided: false,
          source: 'clinical_report'
        })
      });

      if (res.ok) {
        setHasSavedToHistory(true);
        setSaveSuccessMsg('Report summary saved to Health History as long-term memory.');
        onRefreshMemories();
      }
    } catch (err) {
      console.error('Save to history error:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setReportText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            <span>Clinical Reports & Diagnostics</span>
            <span>·</span>
            <span className="text-amber-700 font-bold">{patient.name}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Report Explainer & Document Translation
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            Translate complex lab panels and ultrasound imaging into plain English. Retain findings into MedTrace long-term memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Upload Document (TXT/PDF)</span>
            <input
              type="file"
              accept=".txt,.pdf,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 2-Column: Left Document Viewer / Input | Right Plain English Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Raw Report Text (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Diagnostic Document Text</span>
              </h3>
              <button
                onClick={() => setReportText(SAMPLE_ANANYA_REPORT)}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
              >
                Reset to Demo Report
              </button>
            </div>

            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={16}
              className="w-full font-mono text-xs text-stone-800 bg-stone-50/70 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 leading-relaxed resize-y"
              placeholder="Paste raw medical report text or lab results here..."
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !reportText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating Medical Terms with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Report in Plain English</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/60 text-xs text-stone-500 space-y-1">
            <div className="font-semibold text-stone-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Medical Safety Rule</span>
            </div>
            <p className="leading-relaxed">
              MedTrace extracts and summarizes existing text without inventing values or offering formal medical diagnoses. Always review diagnostic results with the ordering physician.
            </p>
          </div>
        </div>

        {/* Right Col: Gemini Structured Explanation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <div className="space-y-6">
              
              {/* Summary Card */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800">
                      Plain English Breakdown
                    </span>
                    <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                      {analysisResult.title}
                    </h2>
                  </div>

                  <button
                    onClick={handleRetainToHistory}
                    disabled={hasSavedToHistory}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                      hasSavedToHistory
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {hasSavedToHistory ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saved to History</span>
                      </>
                    ) : (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Retain to Long-Term Memory</span>
                      </>
                    )}
                  </button>
                </div>

                {saveSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <p className="text-sm text-stone-700 leading-relaxed">
                  {analysisResult.summary}
                </p>

                {/* Key Findings Table */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Key Findings & Values
                  </h3>
                  <div className="rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                    {analysisResult.keyFindings.map((finding, idx) => (
                      <div key={idx} className="p-3 bg-white hover:bg-stone-50/50 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5 max-w-sm">
                          <span className="font-bold text-stone-900">{finding.marker}</span>
                          <p className="text-[11px] text-stone-500">{finding.clinicalNote}</p>
                        </div>

                        <div className="text-right sm:text-right shrink-0">
                          <div className="font-mono text-xs font-semibold text-stone-800">
                            {finding.value}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            Ref: {finding.normalRange}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical Terms Glossary */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Medical Terms Defined in Simple Language
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {analysisResult.medicalTerms.map((term, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                        <div className="font-bold text-stone-900">{term.term}</div>
                        <p className="text-stone-600 leading-relaxed">{term.plainExplanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions for Doctor */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs">
                  <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-700" />
                    <span>Questions to Ask Your Doctor</span>
                  </h3>
                  <ul className="space-y-1.5 text-stone-700">
                    {analysisResult.doctorQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold shrink-0">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Follow-up CTA */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onAskMedTrace(`Regarding my ${analysisResult.title}, can you explain more about what this means for my diet?`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900"
                  >
                    <span>Ask MedTrace follow-up questions in Assistant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-white space-y-3">
              <FileCheck className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-sm font-semibold text-stone-700">No report analyzed yet</div>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Paste your laboratory results or ultrasound text on the left and click "Explain Report" to view a patient-friendly breakdown.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
