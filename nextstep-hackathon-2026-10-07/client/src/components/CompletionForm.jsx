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
      <div className="glass-panel ui-border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="absolute top-5 right-5 ui-text-muted hover:ui-text-ink transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl ui-bg-soft-a20 ui-text-ink flex items-center justify-center border ui-border-border-a30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold ui-text-ink">Record Practice</h3>
            <p className="text-xs ui-text-muted">
              {mission.id.toUpperCase()}: {mission.title}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Outcome Radio Options */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-2">
              Practice Outcome
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  outcome === 'independent'
                    ? 'ui-bg-soft-a20 ui-border-border ui-text-ink shadow-sm'
                    : 'ui-bg-soft-a50 ui-border-border ui-text-ink hover:ui-bg-surface'
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
                <span className="text-[11px] ui-text-muted">Solved without looking up external solutions</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  outcome === 'with_hint'
                    ? 'ui-bg-soft-a20 ui-border-border ui-text-ink shadow-sm'
                    : 'ui-bg-soft-a50 ui-border-border ui-text-ink hover:ui-bg-surface'
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
                <span className="text-[11px] ui-text-muted">Needed editorial or test case assistance</span>
              </label>
            </div>
          </div>

          {/* Optional Reflection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink">
                Self-Reflection (Optional)
              </label>
              <span className={`text-[11px] ${reflection.length > 280 ? 'ui-text-ink font-bold' : 'ui-text-muted'}`}>
                {reflection.length}/280
              </span>
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What pattern or edge case did you discover? What remains uncertain?"
              rows={3}
              maxLength={280}
              className="w-full glass-input rounded-xl p-3 text-xs sm:text-sm ui-text-ink placeholder-slate-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Self-reported notice */}
          <div className="p-3 rounded-xl ui-bg-soft-a60 border ui-border-border text-[11px] ui-text-muted flex items-start gap-2">
            <AlertCircle className="w-4 h-4 ui-text-muted shrink-0 mt-0.5" />
            <span>
              Self-reported practice: accurately noting whether you needed a hint gives NextStep trustworthy data to adapt future mission pacing.
            </span>
          </div>

          {error && (
            <p className="text-xs ui-text-ink font-medium">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t ui-border-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium ui-text-muted hover:ui-text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ui-bg-accent hover:ui-bg-accent ui-text-inverse font-semibold text-xs sm:text-sm transition-all shadow-glow disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record practice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
