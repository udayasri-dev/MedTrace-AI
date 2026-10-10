import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Plus, 
  Trash2, 
  Filter, 
  User, 
  FileText, 
  BrainCircuit, 
  Sparkles, 
  Calendar, 
  Tag, 
  Check, 
  X,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { HealthMemoryItem, MemoryCategory, PatientProfile } from '../types/medtrace';

interface HealthHistoryProps {
  patient: PatientProfile;
  memories: HealthMemoryItem[];
  onRefreshMemories: () => void;
}

export const HealthHistory: React.FC<HealthHistoryProps> = ({
  patient,
  memories,
  onRefreshMemories
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [reflectionsData, setReflectionsData] = useState<any>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for adding memory manually
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('symptoms');
  const [newDateContext, setNewDateContext] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Context' },
    { id: 'symptoms', label: 'Symptoms' },
    { id: 'medications', label: 'Medications' },
    { id: 'reports', label: 'Reports' },
    { id: 'allergies_reactions', label: 'Allergies & Reactions' },
    { id: 'treatments', label: 'Treatments' },
    { id: 'health_events', label: 'Health Events' },
    { id: 'other_context', label: 'Other Context' },
  ];

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory = selectedCategory === 'all' || mem.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshMemories();
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const tagList = newTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await fetch('/api/memory/retain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          category: newCategory,
          title: newTitle.trim(),
          content: newContent.trim(),
          dateContext: newDateContext.trim() || 'User added directly',
          tags: tagList,
          isUserProvided: true,
          source: 'user_conversation'
        })
      });

      if (res.ok) {
        onRefreshMemories();
        setShowAddModal(false);
        setNewTitle('');
        setNewContent('');
        setNewDateContext('');
        setNewTags('');
      }
    } catch (err) {
      console.error('Add error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerReflection = async () => {
    setIsReflecting(true);
    setShowReflections(true);
    try {
      const res = await fetch('/api/memory/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id })
      });
      if (res.ok) {
        const data = await res.json();
        setReflectionsData(data);
      }
    } catch (err) {
      console.error('Reflection error:', err);
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            <span>Health History Timeline</span>
            <span>·</span>
            <span className="text-amber-700 font-bold">{patient.name}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Remembered Health Context
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            A transparent timeline of symptoms, medications, clinical reports, and allergies retained over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTriggerReflection}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-2xs"
            title="Formulate high-level insights across stored memories via MemoryService.reflect()"
          >
            <BrainCircuit className="w-4 h-4 text-amber-600" />
            <span>Reflect on Trends</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Health Context</span>
          </button>
        </div>
      </div>

      {/* Reflective Insights Banner (if triggered) */}
      {showReflections && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold text-stone-900">
                Longitudinal Health Trajectory & Reflections
              </h3>
            </div>
            <button
              onClick={() => setShowReflections(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {isReflecting ? (
            <p className="text-xs text-stone-500 animate-pulse">
              Synthesizing clinical patterns across your timeline...
            </p>
          ) : reflectionsData ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                {reflectionsData.overallHealthTrajectory}
              </p>

              {reflectionsData.reflections?.map((r: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-amber-200/60 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">{r.theme}</span>
                    <span className="text-[11px] font-semibold text-amber-800">{r.clinicalSignificance}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{r.insight}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Buttons (Segmented control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms, medications, ultrasound reports, reactions..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-white space-y-3">
            <Clock className="w-8 h-8 text-stone-300 mx-auto" />
            <div className="text-sm font-semibold text-stone-700">No health context found</div>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              No memories match your active filter. Discuss health concerns with MedTrace to retain new items, or add context manually.
            </p>
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const isUserSource = mem.isUserProvided;

            return (
              <div
                key={mem.id}
                className="p-5 rounded-2xl border border-stone-200/90 bg-white shadow-2xs hover:border-stone-300 transition-all space-y-3"
              >
                {/* Header Row: Category · Date · User vs Diagnostic Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-500">
                    <span className="font-semibold uppercase tracking-wider text-amber-800">
                      {mem.category.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{mem.dateContext}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Clear distinction: User-Provided vs Clinical Diagnostic */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      {isUserSource ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>User-Provided Information</span>
                        </span>
                      ) : (
                        <span className="text-sky-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Clinical Diagnostic Finding</span>
                        </span>
                      )}
                    </div>

                    {/* Delete action */}
                    {deleteConfirmId === mem.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        <span className="text-[11px] text-red-700 font-semibold">Delete?</span>
                        <button
                          onClick={() => handleDelete(mem.id)}
                          className="text-red-700 hover:text-red-900 font-bold"
                          title="Confirm Delete"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-stone-400 hover:text-stone-600"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(mem.id)}
                        className="text-stone-300 hover:text-red-600 transition-colors p-1"
                        title="Delete memory item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {mem.title}
                </h3>

                {/* Content */}
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {mem.content}
                </p>

                {/* Tags and Metadata */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                  <span>Source: {mem.source.replace('_', ' ')}</span>
                  {mem.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <Tag className="w-3 h-3 text-stone-400" />
                        <span>{mem.tags.join(', ')}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Add Health Context Item
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Record past surgeries, allergies, ongoing medications, or diagnostic notes directly.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  <option value="symptoms">Symptoms</option>
                  <option value="medications">Medications</option>
                  <option value="allergies_reactions">Allergies & Reactions</option>
                  <option value="reports">Clinical Reports</option>
                  <option value="treatments">Treatments</option>
                  <option value="health_events">Health Events / Surgeries</option>
                  <option value="other_context">Other Context</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Title / Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penicillin Allergy (Rash & Wheezing) or Appendectomy"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Detailed Clinical Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what occurred, dosages, duration, or doctor recommendations..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Approximate Date / Context
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. March 2024 or Childhood"
                    value={newDateContext}
                    onChange={(e) => setNewDateContext(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. allergy, antibiotic, rash"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Retain to Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
