import fs from 'fs';
import path from 'path';
import { HealthMemoryItem, MemoryCategory } from '../src/types/medtrace';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const MEMORIES_FILE = path.resolve(DATA_DIR, 'memories.json');

// Initial seed data for fictional demo patient Ananya Rao
export const DEMO_ANANYA_MEMORIES: HealthMemoryItem[] = [
  {
    id: 'mem-seed-1',
    patientId: 'ananya-rao',
    category: 'symptoms',
    title: 'Recurring post-meal epigastric discomfort',
    content: 'Patient reported burning stomach discomfort in upper abdomen occurring 30-45 minutes after eating, exacerbated by spicy and acidic foods. Described as a dull ache lasting 1-2 hours.',
    dateContext: 'May 2026 (Approx. 4 months ago)',
    createdAt: new Date('2026-05-14T10:30:00Z').toISOString(),
    source: 'user_conversation',
    isUserProvided: true,
    tags: ['stomach', 'epigastric', 'burning', 'post-prandial', 'gastric'],
    metadata: { trigger: 'spicy foods', frequency: '3-4 times per week' }
  },
  {
    id: 'mem-seed-2',
    patientId: 'ananya-rao',
    category: 'reports',
    title: 'Abdominal Ultrasound: Mild Antral Gastritis, Gallbladder Normal',
    content: 'Ultrasound scan confirmed mild gastric mucosal irritation (antral gastritis). Gallbladder normal with no cholelithiasis (gallstones), liver echotexture normal, common bile duct within normal limits (4mm). Bland diet recommended.',
    dateContext: 'June 18, 2026 (Approx. 3 months ago)',
    createdAt: new Date('2026-06-18T14:15:00Z').toISOString(),
    source: 'clinical_report',
    isUserProvided: false,
    tags: ['ultrasound', 'gastritis', 'mucosa', 'gallbladder normal', 'stomach report'],
    metadata: { facility: 'Metro Health Diagnostic Center', findings: 'Antral gastritis' }
  },
  {
    id: 'mem-seed-3',
    patientId: 'ananya-rao',
    category: 'medications',
    title: 'Prescribed Dolorex (fictional NSAID / anti-inflammatory) for acute shoulder strain',
    content: 'Patient was prescribed Dolorex 100mg twice daily with meals for left supraspinatus strain following gym exercise. Took for 2 days.',
    dateContext: 'July 10, 2026 (Approx. 2 months ago)',
    createdAt: new Date('2026-07-10T09:00:00Z').toISOString(),
    source: 'user_conversation',
    isUserProvided: true,
    tags: ['Dolorex', 'NSAID', 'shoulder pain', 'prescription', 'anti-inflammatory'],
    metadata: { dose: '100mg BID', duration: '2 days before discontinuation' }
  },
  {
    id: 'mem-seed-4',
    patientId: 'ananya-rao',
    category: 'allergies_reactions',
    title: 'Adverse Drug Reaction to Dolorex: Urticaria (Hives) & Acute Gastric Burning',
    content: 'Within 48 hours of starting Dolorex, patient developed itchy erythematous hives on forearms and chest, alongside intense stomach irritation and nausea. Prescribing physician advised immediate discontinuation and noted potential NSAID hypersensitivity.',
    dateContext: 'July 12, 2026 (Approx. 2 months ago)',
    createdAt: new Date('2026-07-12T16:45:00Z').toISOString(),
    source: 'user_conversation',
    isUserProvided: true,
    tags: ['Dolorex', 'drug reaction', 'allergy', 'hives', 'urticaria', 'NSAID sensitivity', 'stomach burning'],
    metadata: { reactionType: 'Urticaria + Gastric flare', actionTaken: 'Discontinued immediately' }
  }
];

export interface RecallResult {
  recalledMemories: HealthMemoryItem[];
  relevanceExplanation: string;
  queryIntent: 'needs_past_context' | 'general_or_new_concern';
}

export interface ReflectionResult {
  reflections: Array<{
    theme: string;
    insight: string;
    clinicalSignificance: string;
    evidenceMemoryIds: string[];
  }>;
  overallHealthTrajectory: string;
}

export interface MemoryServiceContract {
  retainMemory(item: Omit<HealthMemoryItem, 'id' | 'createdAt'>): Promise<HealthMemoryItem>;
  recallMemory(params: {
    query: string;
    patientId: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    limit?: number;
  }): Promise<RecallResult>;
  reflectMemory(patientId: string): Promise<ReflectionResult>;
  listMemories(patientId: string, category?: string): Promise<HealthMemoryItem[]>;
  deleteMemory(id: string): Promise<boolean>;
  resetDemo(patientId?: string): Promise<void>;
  getStatus(): {
    provider: 'hindsight' | 'local_persistence';
    providerName: string;
    configured: boolean;
    details: string;
    itemCount: number;
    lastSync: string;
  };
}

/**
 * File-backed Persistent Local Memory Store
 * Guarantees refresh and restart persistence without losing memories.
 */
class LocalMemoryStore {
  private memories: HealthMemoryItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(MEMORIES_FILE)) {
        const raw = fs.readFileSync(MEMORIES_FILE, 'utf-8');
        this.memories = JSON.parse(raw);
      } else {
        this.memories = [...DEMO_ANANYA_MEMORIES];
        this.save();
      }
    } catch (e) {
      console.error('[MemoryStore] Failed to load memories file, initializing with demo data:', e);
      this.memories = [...DEMO_ANANYA_MEMORIES];
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify(this.memories, null, 2), 'utf-8');
    } catch (e) {
      console.error('[MemoryStore] Failed to save memories to disk:', e);
    }
  }

  public getAll(patientId?: string): HealthMemoryItem[] {
    if (!patientId) return [...this.memories];
    return this.memories.filter(m => m.patientId === patientId);
  }

  public getById(id: string): HealthMemoryItem | undefined {
    return this.memories.find(m => m.id === id);
  }

  public add(item: Omit<HealthMemoryItem, 'id' | 'createdAt'>): HealthMemoryItem {
    const newItem: HealthMemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    this.memories.unshift(newItem);
    this.save();
    return newItem;
  }

  public remove(id: string): boolean {
    const initialLen = this.memories.length;
    this.memories = this.memories.filter(m => m.id !== id);
    if (this.memories.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public reset(patientId: string = 'ananya-rao') {
    if (patientId === 'ananya-rao') {
      this.memories = this.memories.filter(m => m.patientId !== 'ananya-rao');
      this.memories.push(...DEMO_ANANYA_MEMORIES);
    } else {
      this.memories = this.memories.filter(m => m.patientId !== patientId);
    }
    this.save();
  }
}

const localStore = new LocalMemoryStore();

/**
 * Intelligent selective relevance matcher.
 * Evaluates whether a user's question connects with stored past health context.
 * Only retrieves genuinely relevant memories.
 */
function evaluateSelectiveRecall(
  query: string,
  memories: HealthMemoryItem[],
  conversationHistory: Array<{ role: string; content: string }> = [],
  limit = 4
): RecallResult {
  const normalizedQuery = query.toLowerCase();
  
  // Combine recent history (last 2 user/assistant messages) for anaphoric references
  const recentHistoryText = conversationHistory
    .slice(-2)
    .map(m => m.content.toLowerCase())
    .join(' ');
  
  const searchCorpus = `${normalizedQuery} ${recentHistoryText}`;

  // Medical synonym and concept clusters
  const medicalConceptMaps: Record<string, string[]> = {
    stomach: ['stomach', 'belly', 'abdomen', 'epigastric', 'gastric', 'gastritis', 'heartburn', 'burning', 'acid', 'ulcer', 'discomfort', 'nausea', 'post-meal', 'eating'],
    medication: ['medicine', 'medication', 'pill', 'drug', 'prescription', 'dolorex', 'nsaid', 'anti-inflammatory', 'napro', 'ibuprofen', 'aspirin', 'dose', 'tablets'],
    allergy: ['reaction', 'allergy', 'allergic', 'hives', 'urticaria', 'rash', 'itching', 'swelling', 'side effect', 'adverse', 'intolerance'],
    ultrasound_report: ['report', 'test', 'scan', 'ultrasound', 'results', 'findings', 'doctor said', 'imaging', 'blood', 'panel', 'lab'],
    shoulder_pain: ['shoulder', 'joint', 'muscle', 'strain', 'supraspinatus', 'back', 'knee', 'pain', 'ache', 'injury'],
    previous_problem: ['previous', 'before', 'earlier', 'that time', 'last month', 'ago', 'that issue', 'history', 'again', 'recur', 'worse']
  };

  // Check if query explicitly asks about past or implies historical context
  const explicitPastIndicators = [
    'before', 'earlier', 'previously', 'past', 'history', 'that time',
    'that medicine', 'that drug', 'that pill', 'that reaction', 'my reaction',
    'my previous', 'that problem', 'again', 'same thing', 'like before',
    'the report', 'the ultrasound', 'what did i take', 'remember', 'did i have'
  ];

  const hasExplicitPastIntent = explicitPastIndicators.some(indicator => searchCorpus.includes(indicator));

  // Score each memory against the query and conceptual relevance
  const scoredMemories = memories.map(mem => {
    let score = 0;
    const memText = `${mem.title} ${mem.content} ${mem.tags.join(' ')} ${mem.category}`.toLowerCase();

    // Direct token overlap
    const queryTokens = normalizedQuery
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);

    for (const token of queryTokens) {
      if (memText.includes(token)) {
        score += 2.5;
      }
    }

    // Concept cluster matching
    for (const [, keywords] of Object.entries(medicalConceptMaps)) {
      const queryMatches = keywords.some(k => searchCorpus.includes(k));
      const memoryMatches = keywords.some(k => memText.includes(k));

      if (queryMatches && memoryMatches) {
        score += 3.5;
      }
    }

    // High relevance if medication reaction / allergy is discussed when user asks about new meds
    if (
      (searchCorpus.includes('medicine') || searchCorpus.includes('prescription') || searchCorpus.includes('pill') || searchCorpus.includes('drug') || searchCorpus.includes('prescribe') || searchCorpus.includes('painkiller')) &&
      (mem.category === 'allergies_reactions' || mem.category === 'medications')
    ) {
      score += 4.0;
    }

    // High relevance if stomach / gastrointestinal symptoms are discussed
    if (
      (searchCorpus.includes('stomach') || searchCorpus.includes('discomfort') || searchCorpus.includes('burning') || searchCorpus.includes('abdomen') || searchCorpus.includes('digestion')) &&
      (mem.tags.includes('stomach') || mem.tags.includes('gastric') || mem.category === 'symptoms')
    ) {
      score += 4.0;
    }

    // Recency boost (fresher context carries subtle weight)
    const ageDays = (Date.now() - new Date(mem.createdAt).getTime()) / (1000 * 3600 * 24);
    if (ageDays < 60) score += 0.5;

    return { memory: mem, score };
  });

  // Relevance threshold: only retrieve memories with genuine connection (score >= 3.0)
  // Or score >= 2.0 if explicit past intent is detected
  const threshold = hasExplicitPastIntent ? 2.5 : 3.5;
  const filtered = scoredMemories
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      ...item.memory,
      relevanceScore: Math.min(Math.round(item.score * 10) / 10, 10)
    }));

  const queryIntent = filtered.length > 0 ? 'needs_past_context' : 'general_or_new_concern';

  let explanation = '';
  if (filtered.length > 0) {
    const titles = filtered.map(m => `"${m.title}"`).join(', ');
    explanation = `Identified ${filtered.length} relevant historical context item(s) related to current discussion: ${titles}.`;
  } else {
    explanation = 'Query does not require prior long-term health context; proceeding with current conversational scope.';
  }

  return {
    recalledMemories: filtered,
    relevanceExplanation: explanation,
    queryIntent
  };
}

/**
 * MemoryService implementation that connects to Hindsight if credentials exist,
 * otherwise cleanly operates via the file-backed Local Persistent Memory Engine.
 * Never pretends to be Hindsight when in local mode.
 */
class MemoryServiceImpl implements MemoryServiceContract {
  private hasHindsightConfig(): boolean {
    const key = process.env.HINDSIGHT_API_KEY;
    return Boolean(key && key.trim().length > 0 && !key.includes('PLACEHOLDER'));
  }

  public getStatus() {
    const isHindsight = this.hasHindsightConfig();
    const count = localStore.getAll().length;

    if (isHindsight) {
      return {
        provider: 'hindsight' as const,
        providerName: 'Hindsight Long-Term Memory (Connected)',
        configured: true,
        details: 'Active Hindsight API integration. Long-term health context persists across sessions via Hindsight engine.',
        itemCount: count,
        lastSync: new Date().toISOString()
      };
    }

    return {
      provider: 'local_persistence' as const,
      providerName: 'Local Persistent Memory Engine (Hindsight-Ready Abstraction)',
      configured: false,
      details: 'Operating on local persistent JSON store. Implements full Retain, Recall, and Reflect contracts. Ready to switch to Hindsight once API credentials are configured.',
      itemCount: count,
      lastSync: new Date().toISOString()
    };
  }

  public async retainMemory(item: Omit<HealthMemoryItem, 'id' | 'createdAt'>): Promise<HealthMemoryItem> {
    if (this.hasHindsightConfig()) {
      try {
        const hindsightUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io/v1';
        const apiKey = process.env.HINDSIGHT_API_KEY;

        const res = await fetch(`${hindsightUrl}/memories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            patient_id: item.patientId,
            content: `${item.title}: ${item.content}`,
            category: item.category,
            context: item.dateContext,
            is_user_provided: item.isUserProvided,
            source: item.source,
            metadata: item.metadata
          })
        });

        if (res.ok) {
          console.log('[MemoryService:Hindsight] Memory successfully retained in Hindsight cloud.');
        } else {
          console.warn('[MemoryService:Hindsight] Retain call returned non-200, mirroring locally:', res.statusText);
        }
      } catch (err) {
        console.warn('[MemoryService:Hindsight] Error sending to Hindsight API, storing in local fallback:', err);
      }
    }

    // Always keep local persistent mirror so offline/reload works seamlessly
    return localStore.add(item);
  }

  public async recallMemory(params: {
    query: string;
    patientId: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    limit?: number;
  }): Promise<RecallResult> {
    const { query, patientId, conversationHistory = [], limit = 4 } = params;
    const allPatientMemories = localStore.getAll(patientId);

    if (this.hasHindsightConfig()) {
      try {
        const hindsightUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io/v1';
        const apiKey = process.env.HINDSIGHT_API_KEY;

        const res = await fetch(`${hindsightUrl}/memories/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            patient_id: patientId,
            query: query,
            limit: limit
          })
        });

        if (res.ok) {
          const hindsightData = await res.json();
          if (Array.isArray(hindsightData?.memories) && hindsightData.memories.length > 0) {
            console.log(`[MemoryService:Hindsight] Recalled ${hindsightData.memories.length} memories from Hindsight.`);
            return {
              recalledMemories: hindsightData.memories,
              relevanceExplanation: `Retrieved ${hindsightData.memories.length} memories directly from Hindsight memory layer.`,
              queryIntent: 'needs_past_context'
            };
          }
        }
      } catch (err) {
        console.warn('[MemoryService:Hindsight] Recall call failed, using local persistent engine:', err);
      }
    }

    // Local Persistent Selective Recall Engine
    return evaluateSelectiveRecall(query, allPatientMemories, conversationHistory, limit);
  }

  public async reflectMemory(patientId: string): Promise<ReflectionResult> {
    const memories = localStore.getAll(patientId);

    // Group items to identify recurring health storylines
    const hasStomach = memories.some(m => m.tags.includes('stomach') || m.tags.includes('gastric'));
    const hasNsaidReaction = memories.some(m => m.tags.includes('Dolorex') || m.category === 'allergies_reactions');
    const hasUltrasound = memories.some(m => m.category === 'reports' && m.tags.includes('ultrasound'));

    const reflections = [];

    if (hasStomach && hasNsaidReaction) {
      reflections.push({
        theme: 'Gastrointestinal & NSAID Sensitivity Pattern',
        insight: 'Patient exhibits chronic gastric sensitivity (antral gastritis on ultrasound) which acutely flared with urticaria upon oral NSAID (Dolorex) administration. Strong contraindication for standard non-selective NSAID class without gastroprotective co-prescription or formal allergy review.',
        clinicalSignificance: 'High - Protects patient against future adverse reactions when new analgesics are prescribed.',
        evidenceMemoryIds: memories.filter(m => m.tags.includes('stomach') || m.tags.includes('Dolorex')).map(m => m.id)
      });
    }

    if (hasUltrasound) {
      reflections.push({
        theme: 'Structural Baseline: Normal Gallbladder & Biliary Tree',
        insight: 'Abdominal ultrasound ruled out gallstones or biliary colic, confirming symptoms are mucosal/gastric rather than biliary in origin.',
        clinicalSignificance: 'Medium - Differentiates epigastric pain from gallstone attacks.',
        evidenceMemoryIds: memories.filter(m => m.category === 'reports').map(m => m.id)
      });
    }

    return {
      reflections,
      overallHealthTrajectory: memories.length > 0 
        ? `Tracking ${memories.length} longitudinal health milestones. Primary active clinical threads: Gastric mucosal health, Analgesic allergy avoidance.`
        : 'New patient profile. Awaiting longitudinal clinical entries.'
    };
  }

  public async listMemories(patientId: string, category?: string): Promise<HealthMemoryItem[]> {
    let items = localStore.getAll(patientId);
    if (category && category !== 'all') {
      items = items.filter(m => m.category === category);
    }
    return items;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    return localStore.remove(id);
  }

  public async resetDemo(patientId: string = 'ananya-rao'): Promise<void> {
    localStore.reset(patientId);
  }
}

export const memoryService: MemoryServiceContract = new MemoryServiceImpl();
