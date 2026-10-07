import React, { useState } from 'react';
import { CheckCircle2, X, Award, HelpCircle, AlertCircle } from 'lucide-react';

export default function CompletionForm({ mission, onSubmit, onCancel, isSubmitting = false }) {
  const [outcome, setOutcome] = useState('independent');
  const [reflection, setReflection] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reflection.length > 280) {
      setError('Reflection must not exceed 280 characters.');
      return;
    }
    setError(null);
    onSubmit({
      missionId: mission.id,
      outcome,
      reflection: reflection.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Record Mission Completion</h3>
            <p className="text-xs text-slate-400">
              {mission.id.toUpperCase()}: {mission.title}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Outcome Radio Options */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
              Practice Outcome
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  outcome === 'independent'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-sm'
                    : 'bg-surface-200/50 border-slate-800 text-slate-300 hover:bg-surface-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Independent</span>
                  <input
                    type="radio"
                    name="outcome"
                    value="independent"
                    checked={outcome === 'independent'}
                    onChange={() => setOutcome('independent')}
                    className="accent-brand-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400">Solved without looking up external solutions</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  outcome === 'with_hint'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-sm'
                    : 'bg-surface-200/50 border-slate-800 text-slate-300 hover:bg-surface-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">With Hint</span>
                  <input
                    type="radio"
                    name="outcome"
                    value="with_hint"
                    checked={outcome === 'with_hint'}
                    onChange={() => setOutcome('with_hint')}
                    className="accent-brand-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400">Needed editorial or test case assistance</span>
              </label>
            </div>
          </div>

          {/* Optional Reflection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Self-Reflection (Optional)
              </label>
              <span className={`text-[11px] ${reflection.length > 280 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {reflection.length}/280
              </span>
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What pattern or edge case did you discover? What remains uncertain?"
              rows={3}
              maxLength={280}
              className="w-full glass-input rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Self-reported notice */}
          <div className="p-3 rounded-xl bg-surface-200/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Self-reported practice: accurately noting whether you needed a hint gives NextStep trustworthy data to adapt future mission pacing.
            </span>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Record + Earn 20 XP'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
