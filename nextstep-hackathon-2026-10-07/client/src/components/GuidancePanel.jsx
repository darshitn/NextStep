import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle, ArrowRight, Loader2, X, RefreshCw, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'too_difficult',
    label: 'Too Difficult',
    description: 'Stuck on concepts or cannot figure out where to begin'
  },
  {
    id: 'need_revision',
    label: 'Need Revision',
    description: 'Forgot prerequisite ideas like pointers or hashing'
  },
  {
    id: 'ready_to_continue',
    label: 'Ready to Continue',
    description: 'Understand the concept, looking for effective practice tips'
  }
];

export default function GuidancePanel({
  mission,
  guidanceData = null,
  onRequestGuidance,
  onClose,
  isLoading = false,
  error = null
}) {
  const [selectedCategory, setSelectedCategory] = useState('too_difficult');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRequestGuidance({
      missionId: mission.id,
      category: selectedCategory,
      feedback: feedback.trim()
    });
  };

  const modeBadges = {
    standard_practice: { label: 'Standard Practice', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    guided_practice: { label: 'Guided Practice', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    revision_first: { label: 'Revision First', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
  };

  return (
    <div className="glass-panel border-brand-500/30 rounded-2xl p-5 sm:p-6 my-4 shadow-glass animate-fade-in relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white">
            Personalized AI Mission Guidance
          </h3>
          <p className="text-xs text-slate-400">
            Adapting approach for <span className="text-slate-300 font-semibold">{mission.title}</span> (30m session)
          </p>
        </div>
      </div>

      {/* Honest AI Error Notice (e.g. AI_NOT_CONFIGURED from backend) */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 mb-4 shadow-sm">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300">
                AI Guidance Notice
              </span>
              {typeof error === 'object' && error.code && (
                <span className="px-1.5 py-0.5 font-mono text-[10px] bg-amber-900/60 text-amber-300 rounded border border-amber-600/40">
                  {error.code}
                </span>
              )}
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              {typeof error === 'string' ? error : error.message || 'AI guidance service is currently unavailable.'}
            </p>
          </div>
        </div>
      )}

      {/* Form section if no guidance yet or regenerating */}
      {!guidanceData && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
              Select Difficulty Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-brand-500/20 border-brand-500 text-white shadow-sm ring-1 ring-brand-500/50'
                      : 'bg-surface-200/50 border-slate-800 text-slate-300 hover:bg-surface-100'
                  }`}
                >
                  <span className="font-semibold text-xs block mb-0.5">{cat.label}</span>
                  <span className="text-[10px] text-slate-400 block leading-tight">{cat.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                What are you experiencing? (Optional, max 280 chars)
              </label>
              <span className={`text-[11px] ${feedback.length > 280 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {feedback.length}/280
              </span>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. 'I do not understand how the two pointers move without missing combinations.'"
              maxLength={280}
              rows={2}
              className="w-full glass-input rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-400 italic">
              Guidance adapts how you spend this 30 minutes; it never skips missions or drops workload.
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Guidance</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Render Guidance Response */}
      {guidanceData && (
        <div className="space-y-4 pt-1 animate-fade-in">
          {/* Mode Pill & Source */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggested Mode:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${modeBadges[guidanceData.mode]?.color || modeBadges.standard_practice.color}`}>
                {modeBadges[guidanceData.mode]?.label || guidanceData.mode}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-200 text-slate-400 border border-slate-800">
              Source: {guidanceData.source || 'gemini'}
            </span>
          </div>

          {/* Explanation */}
          <div className="bg-surface-200/50 rounded-xl p-3.5 border border-slate-800">
            <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-1">
              Personalized Approach
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {guidanceData.explanation}
            </p>
          </div>

          {/* Micro-steps */}
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Recommended 30-Minute Micro-Steps
            </p>
            <div className="space-y-2">
              {guidanceData.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-100/70 border border-slate-800/80 text-xs">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 leading-relaxed pt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Check Question */}
          {guidanceData.checkQuestion && (
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-1">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Quick Check For Understanding</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 italic pl-6">
                "{guidanceData.checkQuestion}"
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
            <button
              onClick={() => {
                // Clear guidance to ask again
                handleSubmit({ preventDefault: () => {} });
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Advice</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
            >
              Done & Start Mission
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
