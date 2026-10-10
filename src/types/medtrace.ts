export type MemoryCategory = 
  | 'symptoms'
  | 'medications'
  | 'reports'
  | 'allergies_reactions'
  | 'treatments'
  | 'health_events'
  | 'other_context';

export type MemorySource = 
  | 'user_conversation'
  | 'clinical_report'
  | 'reflective_synthesis';

export interface HealthMemoryItem {
  id: string;
  patientId: string;
  category: MemoryCategory;
  title: string;
  content: string;
  dateContext: string; // e.g. "May 2026", "Approx. 3 months ago", or user-provided date
  createdAt: string;   // ISO timestamp
  source: MemorySource;
  isUserProvided: boolean; // clearly distinguishes user-stated fact from AI interpretation
  sourceConversationId?: string;
  tags: string[];
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recalledMemories?: HealthMemoryItem[];
  retainedMemories?: HealthMemoryItem[];
  emergencyAlert?: boolean;
  thinkingNote?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  summary: string;
  isFictionalDemo: boolean;
}

export interface ReportFinding {
  marker: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'elevated' | 'low' | 'attention';
  clinicalNote: string;
}

export interface MedicalTermDef {
  term: string;
  plainExplanation: string;
}

export interface HealthReport {
  id: string;
  patientId: string;
  title: string;
  date: string;
  facility: string;
  reportType: 'ultrasound' | 'blood_work' | 'pathology' | 'imaging' | 'general';
  summary: string;
  keyFindings: ReportFinding[];
  medicalTerms: MedicalTermDef[];
  doctorQuestions: string[];
  rawContent?: string;
  retainedToHistory?: boolean;
}

export interface MemoryServiceStatus {
  provider: 'hindsight' | 'local_persistence';
  providerName: string;
  configured: boolean;
  details: string;
  itemCount: number;
  lastSync?: string;
}
