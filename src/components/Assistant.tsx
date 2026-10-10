import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Activity,
  BookmarkCheck,
  ShieldAlert,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, HealthMemoryItem, PatientProfile } from '../types/medtrace';

interface AssistantProps {
  patient: PatientProfile;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onRefreshMemories: () => void;
}

export const Assistant: React.FC<AssistantProps> = ({
  patient,
  initialQuery,
  onClearInitialQuery,
  onRefreshMemories
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello! I'm MedTrace, your AI health assistant. I remember your evolving health context over time, so you can speak naturally about ongoing symptoms, past test reports, or medications.\n\nHow are you feeling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial query if passed from overview or prompts
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          conversationHistory: historyPayload,
          patientId: patient.id,
          patientName: patient.name
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply || "I've reviewed your request. Could you clarify any symptoms?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recalledMemories: data.recalledMemories || [],
        retainedMemories: data.retainedMemories || [],
        emergencyAlert: data.emergencyAlert
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If new memories were retained, notify parent to refresh timeline
      if (data.retainedMemories && data.retainedMemories.length > 0) {
        onRefreshMemories();
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: "I'm having trouble retrieving your health context right now. Please check your connection and try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewSession = () => {
    setMessages([
      {
        id: `msg-welcome-new-${Date.now()}`,
        role: 'assistant',
        content: `New conversation session started for ${patient.name}. Your long-term health memories remain securely preserved. What would you like to discuss today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const suggestedPrompts = patient.id === 'ananya-rao' ? [
    { label: "Check medication compatibility", text: "My doctor suggested Napro-B for knee pain. Since I had that reaction to the other medicine before, should I tell them?" },
    { label: "Stomach follow-up", text: "I've been noticing that same burning discomfort in my stomach again after eating spicy food." },
    { label: "Recall ultrasound details", text: "What did that report I showed you earlier say about my gallbladder?" },
    { label: "Ask about a symptom", text: "Why do anti-inflammatory medicines sometimes irritate the stomach lining?" }
  ] : [
    { label: "Log a symptom", text: "I started getting a mild throbbing headache on my right temple yesterday." },
    { label: "Log a medication", text: "My doctor started me on Omeprazole 20mg once every morning." },
    { label: "Ask medical definition", text: "What is the difference between an allergic reaction and an adverse side effect?" },
    { label: "General inquiry", text: "How can I prepare questions for my upcoming annual physical?" }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      
      {/* Top Header / Session Controller */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <span>MedTrace Assistant</span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500 font-normal">{patient.name}</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Long-term memory active · Selective recall enabled
            </p>
          </div>
        </div>

        <button
          onClick={startNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-600 transition-colors shadow-2xs"
          title="Simulate returning weeks or months later with a clean conversation while keeping long-term memories"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
          <span>New Session</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-2">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const hasRecalled = !isUser && message.recalledMemories && message.recalledMemories.length > 0;
          const hasRetained = !isUser && message.retainedMemories && message.retainedMemories.length > 0;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              
              {/* Emergency Warning Banner if detected */}
              {message.emergencyAlert && (
                <div className="mb-2.5 w-full p-3.5 rounded-xl border border-red-300 bg-red-50 text-red-950 flex items-start gap-2.5 text-xs shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Medical Safety Alert:</strong> These symptoms may warrant urgent medical evaluation. If you are experiencing sudden severe chest pain, acute breathing difficulty, or severe allergic swelling, please call emergency services (e.g. 911) or seek the nearest emergency facility immediately.
                  </div>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`rounded-2xl px-4 sm:px-5 py-3.5 text-[15px] sm:text-[15.5px] leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-br-xs'
                    : 'bg-white border border-stone-200/90 text-stone-800 rounded-bl-xs'
                }`}
              >
                
                {/* Subtle "Relevant History" indicator for recalled memories */}
                {hasRecalled && (
                  <div className="mb-3 pb-2.5 border-b border-amber-100/80">
                    <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>From your previous conversations:</span>
                      </div>
                      <button
                        onClick={() => setExpandedMemoryId(expandedMemoryId === message.id ? null : message.id)}
                        className="text-[11px] text-amber-700 hover:text-amber-900 flex items-center gap-0.5 font-semibold"
                      >
                        <span>{message.recalledMemories!.length} item(s)</span>
                        {expandedMemoryId === message.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Compact bulleted summary */}
                    <div className="mt-1 space-y-0.5 text-xs text-stone-600">
                      {message.recalledMemories!.map((mem) => (
                        <div key={mem.id} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span className="font-medium text-stone-800">{mem.title}</span>
                          <span className="text-stone-400">·</span>
                          <span className="text-[11px] text-stone-500">{mem.dateContext}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable deeper transparency */}
                    {expandedMemoryId === message.id && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 space-y-2 text-xs">
                        {message.recalledMemories!.map((mem) => (
                          <div key={mem.id} className="text-stone-700">
                            <div className="font-semibold text-stone-900">{mem.title}</div>
                            <div className="text-[11px] text-stone-600 mt-0.5">{mem.content}</div>
                            <div className="text-[10px] text-stone-400 mt-1">
                              Recorded: {mem.dateContext} · Source: {mem.source.replace('_', ' ')} ({mem.isUserProvided ? 'User fact' : 'Clinical data'})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Text with simple paragraph formatting */}
                <div className="whitespace-pre-wrap space-y-2">
                  {message.content}
                </div>

                {/* Subtle "Retained to Memory" indicator when new information is saved */}
                {hasRetained && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Retained new health context: <strong>{message.retainedMemories!.map(m => m.title).join(', ')}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Message Timestamp */}
              <div className="text-[11px] text-stone-400 mt-1 px-1 flex items-center gap-1.5">
                <span>{message.timestamp}</span>
                {!isUser && hasRecalled && (
                  <>
                    <span>·</span>
                    <span className="text-amber-700 font-medium">Memory connected</span>
                  </>
                )}
              </div>

            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 max-w-xs text-xs text-stone-500 shadow-2xs">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
            <div className="space-y-0.5">
              <div className="font-medium text-stone-700">MedTrace is thinking...</div>
              <div className="text-[11px] text-stone-400">Recalling relevant context & reasoning</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (Optional, Non-intrusive) */}
      {messages.length <= 2 && (
        <div className="pt-2 pb-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Suggested questions to test memory:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                className="text-left p-2.5 rounded-xl border border-stone-200/90 bg-white hover:border-amber-400 hover:bg-amber-50/40 text-xs text-stone-700 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <span className="font-semibold text-stone-900">{p.label}</span>
                <span className="text-[11px] text-stone-500 truncate mt-0.5">"{p.text}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="pt-2 mt-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative rounded-2xl border border-stone-300 bg-white shadow-sm focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600 transition-all p-2"
        >
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask MedTrace anything about your health, symptoms, reports, or previous history...`}
            rows={2}
            className="w-full resize-none border-0 bg-transparent px-2 pt-1 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between pt-1 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Press Enter to send · Shift+Enter for new line
            </span>
            <span className="text-[11px] text-stone-400 sm:hidden">
              MedTrace AI Assistant
            </span>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors ml-auto"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <p className="text-[11px] text-center text-stone-400 mt-2">
          MedTrace provides informational support, not medical advice. In an emergency, please call 911 or visit an emergency room.
        </p>
      </div>

    </div>
  );
};
