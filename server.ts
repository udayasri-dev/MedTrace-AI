import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { memoryService } from './server/memoryService';
import { 
  generateHealthResponse, 
  extractRetainableHealthInfo, 
  analyzeMedicalReport,
  detectEmergencySymptoms
} from './server/geminiService';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Health Check & Status
app.get('/api/status', (req, res) => {
  const status = memoryService.getStatus();
  res.json({
    app: 'MedTrace',
    version: '1.0.0',
    tagline: "Connecting today's health with yesterday's story",
    memoryService: status,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Main Chat Endpoint with Selective Recall + Reasoning + Automatic Retain
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      message, 
      conversationHistory = [], 
      patientId = 'ananya-rao',
      patientName = 'Ananya Rao'
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message string is required.' });
      return;
    }

    // Step 1: Selective Recall from MemoryService (Hindsight or Local Persistent Engine)
    const recallResult = await memoryService.recallMemory({
      query: message,
      patientId,
      conversationHistory,
      limit: 3
    });

    // Step 2: Reasoning & Natural Response Generation via Gemini
    const geminiResult = await generateHealthResponse({
      message,
      conversationHistory,
      recalledMemories: recallResult.recalledMemories,
      patientName
    });

    // Step 3: Automatic Retain Evaluation
    // Check if user provided new durable health information to remember
    const allMemories = await memoryService.listMemories(patientId);
    const retainProposal = await extractRetainableHealthInfo({
      message,
      conversationReply: geminiResult.reply,
      existingMemories: allMemories
    });

    const retainedList = [];
    if (retainProposal.shouldRetain && retainProposal.title && retainProposal.content) {
      const retained = await memoryService.retainMemory({
        patientId,
        category: retainProposal.category || 'other_context',
        title: retainProposal.title,
        content: retainProposal.content,
        dateContext: retainProposal.dateContext || 'Recently reported',
        source: 'user_conversation',
        isUserProvided: true,
        tags: retainProposal.tags || ['patient-reported'],
        metadata: { conversationalSnippet: message.substring(0, 120) }
      });
      retainedList.push(retained);
      console.log(`[MemoryService] Automatically retained new health context: "${retained.title}"`);
    }

    res.json({
      reply: geminiResult.reply,
      recalledMemories: recallResult.recalledMemories,
      retainedMemories: retainedList,
      emergencyAlert: geminiResult.emergencyAlert,
      relevanceExplanation: recallResult.relevanceExplanation,
      queryIntent: recallResult.queryIntent,
      memoryStatus: memoryService.getStatus()
    });
  } catch (error: any) {
    console.error('[API /api/chat] Error:', error);
    res.status(500).json({
      error: 'An error occurred while generating the health response.',
      details: error.message
    });
  }
});

// Memory Listing & Filtering
app.get('/api/memory', async (req, res) => {
  try {
    const patientId = (req.query.patientId as string) || 'ananya-rao';
    const category = req.query.category as string;
    const memories = await memoryService.listMemories(patientId, category);
    res.json({
      patientId,
      memories,
      total: memories.length,
      status: memoryService.getStatus()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Explicit Manual Retain
app.post('/api/memory/retain', async (req, res) => {
  try {
    const { 
      patientId = 'ananya-rao', 
      category = 'other_context', 
      title, 
      content, 
      dateContext = 'User provided', 
      tags = [],
      isUserProvided = true,
      source = 'user_conversation'
    } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required to retain memory.' });
      return;
    }

    const item = await memoryService.retainMemory({
      patientId,
      category,
      title,
      content,
      dateContext,
      source,
      isUserProvided,
      tags
    });

    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Memory
app.delete('/api/memory/:id', async (req, res) => {
  try {
    const success = await memoryService.deleteMemory(req.params.id);
    res.json({ success, id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reflective Synthesis
app.post('/api/memory/reflect', async (req, res) => {
  try {
    const patientId = req.body.patientId || 'ananya-rao';
    const reflection = await memoryService.reflectMemory(patientId);
    res.json(reflection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Demo Data
app.post('/api/memory/reset-demo', async (req, res) => {
  try {
    const patientId = req.body.patientId || 'ananya-rao';
    await memoryService.resetDemo(patientId);
    const memories = await memoryService.listMemories(patientId);
    res.json({ success: true, count: memories.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Report Analysis
app.post('/api/reports/analyze', async (req, res) => {
  try {
    const { reportText, imagePart, patientName = 'Ananya Rao' } = req.body;
    if (!reportText && !imagePart) {
      res.status(400).json({ error: 'Either report text or image part is required.' });
      return;
    }

    const analysis = await analyzeMedicalReport({
      reportText,
      imagePart,
      patientName
    });

    res.json(analysis);
  } catch (error: any) {
    console.error('[API /api/reports/analyze] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MedTrace Server] Running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
