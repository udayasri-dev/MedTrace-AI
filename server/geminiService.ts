import { GoogleGenAI } from '@google/genai';
import { HealthMemoryItem, ReportFinding, MedicalTermDef } from '../src/types/medtrace';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODEL_NAME = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

async function generateWithRetry(requestParams: Parameters<typeof ai.models.generateContent>[0], maxAttempts = 3) {
  let lastError: any = null;
  const modelsToTry = [requestParams.model || MODEL_NAME, FALLBACK_MODEL];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentModel = attempt === 0 ? modelsToTry[0] : modelsToTry[1];
    try {
      return await ai.models.generateContent({
        ...requestParams,
        model: currentModel
      });
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      console.warn(`[GeminiService] Attempt ${attempt + 1} with ${currentModel} returned status ${status}. Retrying...`);
      // Wait with backoff
      await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  throw lastError;
}

// Emergency symptom red flags
const EMERGENCY_KEYWORDS = [
  'chest pain',
  'pressure in chest',
  'difficulty breathing',
  'cant breathe',
  "can't breathe",
  'shortness of breath',
  'anaphylaxis',
  'throat swelling',
  'lips swelling',
  'passing out',
  'loss of consciousness',
  'coughing blood',
  'vomiting blood',
  'severe bleeding',
  'sudden weakness',
  'facial drooping',
  'slurred speech',
  'worst headache of my life'
];

export function detectEmergencySymptoms(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

export interface GeminiHealthResponse {
  reply: string;
  emergencyAlert: boolean;
  usedMemories: HealthMemoryItem[];
  suggestedFollowUps?: string[];
}

export interface ExtractedMemoryProposal {
  shouldRetain: boolean;
  category?: HealthMemoryItem['category'];
  title?: string;
  content?: string;
  dateContext?: string;
  tags?: string[];
  isUserProvided?: boolean;
}

export interface AnalyzedReportResult {
  title: string;
  summary: string;
  reportType: 'ultrasound' | 'blood_work' | 'pathology' | 'imaging' | 'general';
  keyFindings: ReportFinding[];
  medicalTerms: MedicalTermDef[];
  doctorQuestions: string[];
}

/**
 * Generate a conversational health response combining:
 * 1. Current user message
 * 2. Multi-turn conversation history
 * 3. Selective relevant long-term health memories (from Hindsight / MemoryService)
 */
export async function generateHealthResponse(params: {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  recalledMemories: HealthMemoryItem[];
  patientName?: string;
}): Promise<GeminiHealthResponse> {
  const { message, conversationHistory, recalledMemories, patientName = 'the patient' } = params;
  const isEmergency = detectEmergencySymptoms(message);

  // Build the medical system instruction
  let systemInstruction = `You are MedTrace, a caring, clinical-grade AI health assistant.
Your motto: "Connecting today's health with yesterday's story."

Core Purpose:
You help users navigate their personal health journey by remembering their evolving health context over time. While normal chatbots only see the current message, you seamlessly connect relevant information from their past health context with what they are asking today.

Medical Safety & Guardrails:
1. You are an informational health assistant, NOT a medical doctor.
2. NEVER diagnose serious conditions with certainty.
3. NEVER prescribe medications, change dosages, or instruct users to start or stop prescription medications without their prescribing physician's guidance.
4. Clearly recommend consulting a licensed healthcare professional for personalized medical decisions.
5. If emergency symptoms are present (such as severe chest pain, shortness of breath, anaphylaxis, severe bleeding, sudden neurological deficits), calmly and clearly advise seeking immediate emergency medical care (call 911 or visit the nearest ER).
6. Always distinguish USER-PROVIDED statements ("You previously reported...") from clinical test findings ("Your June ultrasound showed...") and avoid confusing the two.

Tone & Conversational Intelligence:
- Warm, respectful, objective, and deeply human.
- Speak naturally. Never say "As an AI..." or "According to database query ID 123...".
- Resolve conversational pronouns naturally ("it", "that medicine", "my previous discomfort", "the test results").
- Multi-turn aware: respond directly to follow-ups without repeating yourself.
- Handle typos, colloquial descriptions, and short questions ("headache?") gracefully.`;

  // Inject relevant long-term memories if selective recall found any
  let memoryContextPrompt = '';
  if (recalledMemories.length > 0) {
    memoryContextPrompt = `\n\n=== RELEVANT LONG-TERM HEALTH CONTEXT (From MedTrace Memory Service) ===\n`;
    memoryContextPrompt += `The following relevant items were recalled from ${patientName}'s historical record because they connect to the current question:\n\n`;
    
    recalledMemories.forEach((mem, idx) => {
      memoryContextPrompt += `[Memory #${idx + 1}] Category: ${mem.category.toUpperCase()} | Recorded: ${mem.dateContext} | Source: ${mem.source} (${mem.isUserProvided ? 'User-Reported' : 'Clinical Diagnostic'})\n`;
      memoryContextPrompt += `Title: ${mem.title}\n`;
      memoryContextPrompt += `Details: ${mem.content}\n\n`;
    });

    memoryContextPrompt += `INSTRUCTION FOR MEMORY USAGE:
- Connect these past context items naturally to the user's current question.
- For example, if they ask about a new pain medicine, naturally reference their past reaction to Dolorex and their history of stomach sensitivity.
- Do NOT sound robotic. Phrase it organically: "Since you experienced hives and stomach discomfort when taking Dolorex back in July..." or "Given your history of mild antral gastritis...".
- Only reference what is actually pertinent. Do not dump irrelevant facts.`;
  } else {
    memoryContextPrompt = `\n\n(No historical long-term memories were deemed relevant to this specific query. Answer based on current context and general medical knowledge.)`;
  }

  // Format multi-turn conversation contents
  const rawTurns: Array<{ role: 'user' | 'model'; text: string }> = [];
  
  for (const turn of conversationHistory.slice(-8)) {
    if (!turn.content || turn.content.trim().length === 0) continue;
    rawTurns.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      text: turn.content
    });
  }

  // Remove leading model turns (Gemini requires the conversation history to start with a user message)
  while (rawTurns.length > 0 && rawTurns[0].role === 'model') {
    rawTurns.shift();
  }

  // Add current user turn with injected memory context
  rawTurns.push({
    role: 'user',
    text: `${message}${memoryContextPrompt}`
  });

  // Merge consecutive turns with the same role so Gemini strictly receives alternating user/model turns
  const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const turn of rawTurns) {
    if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === turn.role) {
      formattedContents[formattedContents.length - 1].parts[0].text += `\n\n${turn.text}`;
    } else {
      formattedContents.push({
        role: turn.role,
        parts: [{ text: turn.text }]
      });
    }
  }

  try {
    const response = await generateWithRetry({
      model: MODEL_NAME,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.4,
        topP: 0.9,
      }
    });

    const replyText = response.text || "I'm here to help. Could you tell me a little more about what you're experiencing?";

    return {
      reply: replyText,
      emergencyAlert: isEmergency,
      usedMemories: recalledMemories
    };
  } catch (error: unknown) {
    console.error('[GeminiService] Error calling Gemini API:', error);
    
    // Graceful fallback if API key or connection issues occur
    let safeFallback = "MedTrace is currently having trouble reaching the reasoning service. ";
    if (recalledMemories.length > 0) {
      safeFallback += `However, I found relevant notes in your health history: ${recalledMemories.map(m => m.title).join('; ')}. Please consult your healthcare provider regarding these previous events.`;
    } else {
      safeFallback += "Please check your network connection or try again in a moment.";
    }

    return {
      reply: safeFallback,
      emergencyAlert: isEmergency,
      usedMemories: recalledMemories
    };
  }
}

/**
 * Intelligent Retain Extractor:
 * Analyzes the user's message to check if they provided a new, durable health fact
 * that should be retained into their long-term health story.
 */
export async function extractRetainableHealthInfo(params: {
  message: string;
  conversationReply: string;
  existingMemories: HealthMemoryItem[];
}): Promise<ExtractedMemoryProposal> {
  const { message } = params;

  // Filter out short chatter or greetings
  const trimmed = message.trim();
  if (trimmed.length < 15) return { shouldRetain: false };

  const lowText = trimmed.toLowerCase();
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'thanks', 'thank you', 'okay', 'got it'];
  if (greetings.some(g => lowText === g || lowText.startsWith(g + ' '))) {
    if (trimmed.split(' ').length < 6) return { shouldRetain: false };
  }

  const prompt = `Analyze the following message from a patient to an AI health assistant.
Determine whether the user is providing a NEW, DURABLE health fact about themselves that should be retained in their long-term health record.

Retainable examples:
- New or recurring symptoms with onset/duration ("I started having lower back spasms two days ago")
- Drug allergies or adverse reactions ("I broke out in a rash after taking amoxicillin")
- New medications or supplements started/stopped ("My doctor switched me to Pantoprazole 40mg")
- Diagnoses, lab results, or test outcomes ("My blood work showed low ferritin")
- Past medical history, procedures, or family history ("I had my gallbladder removed 5 years ago")

Non-retainable examples:
- Questions ("What does dehydration feel like?", "Should I take Tylenol?")
- Hypothetical questions ("Can people take aspirin with milk?")
- Greetings, acknowledgments, or conversational filler ("Thanks that makes sense", "Hello how are you")
- Vague statements without clinical value ("I don't feel great today")

User Message: "${message}"

Respond strictly in JSON format:
{
  "shouldRetain": true or false,
  "category": "symptoms" | "medications" | "reports" | "allergies_reactions" | "treatments" | "health_events" | "other_context",
  "title": "Concise 4-8 word title of the health fact",
  "content": "Clear, objective summary of the user-reported fact",
  "dateContext": "Approximate date or timeframe mentioned (e.g., 'September 2026', 'Recent onset', or 'Past week')",
  "tags": ["tag1", "tag2", "tag3"],
  "isUserProvided": true
}`;

  try {
    const res = await generateWithRetry({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const raw = res.text?.trim() || '{}';
    const parsed = JSON.parse(raw);
    if (parsed.shouldRetain && parsed.title && parsed.content) {
      return {
        shouldRetain: true,
        category: parsed.category || 'other_context',
        title: parsed.title,
        content: parsed.content,
        dateContext: parsed.dateContext || 'Recently reported',
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['patient-reported'],
        isUserProvided: true
      };
    }
    return { shouldRetain: false };
  } catch (err) {
    console.error('[GeminiService] Error extracting retainable info:', err);
    return { shouldRetain: false };
  }
}

/**
 * Multimodal & Text Medical Report Analyzer
 * Analyzes health reports, lab tests, ultrasound scans, or pathology results.
 * Explains medical jargon into plain English, extracts key markers, and suggests doctor questions.
 */
export async function analyzeMedicalReport(params: {
  reportText?: string;
  imagePart?: { data: string; mimeType: string };
  patientName?: string;
}): Promise<AnalyzedReportResult> {
  const { reportText = '', imagePart, patientName = 'Patient' } = params;

  const prompt = `You are a clinical translation assistant in MedTrace.
Analyze this medical report/diagnostic test for ${patientName}.
Explain complex medical terminology in plain, reassuring, patient-friendly language.
Highlight key lab values or imaging findings, note if any are elevated, low, or need attention, and formulate thoughtful questions the patient can ask their doctor.

IMPORTANT SAFETY NOTICE:
- Do NOT provide a conclusive medical diagnosis.
- Emphasize that all findings should be interpreted by the ordering physician in clinical context.

Report Text Content:
"""
${reportText}
"""

Please respond ONLY with valid JSON in this exact structure:
{
  "title": "Short descriptive title of the report (e.g. Abdominal Ultrasound - Antral Gastritis)",
  "reportType": "ultrasound" | "blood_work" | "pathology" | "imaging" | "general",
  "summary": "2-3 sentence plain English summary of what the report shows and what it means.",
  "keyFindings": [
    {
      "marker": "Name of organ or blood marker (e.g. Hemoglobin, Gallbladder, ALT)",
      "value": "Measured value or finding (e.g. 13.8 g/dL, No gallstones detected, Mild mucosal thickening)",
      "normalRange": "Standard reference range if applicable (e.g. 12.0 - 15.5 g/dL)",
      "status": "normal" | "elevated" | "low" | "attention",
      "clinicalNote": "Brief plain language note explaining what this finding signifies."
    }
  ],
  "medicalTerms": [
    {
      "term": "Medical term used in report (e.g. Antral Gastritis, Cholelithiasis)",
      "plainExplanation": "Clear, friendly non-jargon translation of the term."
    }
  ],
  "doctorQuestions": [
    "Specific question 1 for their doctor",
    "Specific question 2 for their doctor",
    "Specific question 3 for their doctor"
  ]
}`;

  try {
    const parts: any[] = [];
    if (imagePart) {
      parts.push({
        inlineData: {
          data: imagePart.data,
          mimeType: imagePart.mimeType
        }
      });
    }
    parts.push({ text: prompt });

    const response = await generateWithRetry({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      title: parsed.title || 'Medical Report Summary',
      reportType: parsed.reportType || 'general',
      summary: parsed.summary || 'Report analysis completed.',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      medicalTerms: Array.isArray(parsed.medicalTerms) ? parsed.medicalTerms : [],
      doctorQuestions: Array.isArray(parsed.doctorQuestions) ? parsed.doctorQuestions : [
        'What are the next steps based on these findings?',
        'Are any lifestyle or dietary adjustments recommended?',
        'When should follow-up testing or consultation occur?'
      ]
    };
  } catch (err) {
    console.error('[GeminiService] Error analyzing report:', err);
    return {
      title: 'Report Summary',
      reportType: 'general',
      summary: 'Report recorded in your health files. Please review specific markers with your physician.',
      keyFindings: [],
      medicalTerms: [],
      doctorQuestions: ['Could you please walk me through the key findings of this report?']
    };
  }
}
