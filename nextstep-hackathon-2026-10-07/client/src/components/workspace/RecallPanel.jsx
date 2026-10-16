import React, { useState } from 'react';
import {
  RotateCcw,
  BookOpen,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { readableDay, localDay } from '../../services/activity.js';

export default function RecallPanel({
  mission,
  item,
  recallDraft = '',
  onRecallDraftChange,
  onClose,
  onOpenPractice
}) {
  const [showReflection, setShowReflection] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  if (!mission) return null;

  const handleAttemptClose = () => {
    if (recallDraft.trim().length > 0) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  return (
    <section
      className="recall-panel rounded-2xl border ui-border-border ui-bg-surface p-5 sm:p-6 space-y-4 shadow-sm"
      aria-label={`Recall practice for ${mission.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
              {mission.id.toUpperCase()} · Recall Practice
            </span>
            <span className="status-badge status-neutral text-xs">
              <RotateCcw size={12} className="inline mr-1" aria-hidden="true" />
              Retrieval
            </span>
          </div>
          <h3 className="text-lg font-bold ui-text-ink">{mission.title}</h3>
        </div>

        <button
          type="button"
          onClick={handleAttemptClose}
          className="p-1.5 rounded-lg ui-text-muted hover:ui-text-ink hover:ui-bg-soft"
          aria-label="Close recall practice"
        >
          <X size={18} />
        </button>
      </div>

      {/* Inline Discard Confirmation Alert */}
      {showDiscardConfirm && (
        <div role="alert" className="rounded-xl border border-attention bg-attention-bg p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-attention-text">
            <AlertTriangle size={15} aria-hidden="true" />
            <span>Discard unsaved recall draft?</span>
          </div>
          <p className="text-attention-text">
            You have typed recall notes that are not saved. Closing will permanently discard this attempt.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(false)}
              className="px-3 py-1.5 rounded-lg ui-bg-surface border ui-border-border font-semibold text-xs ui-text-ink hover:ui-bg-soft"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={handleConfirmDiscard}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700"
            >
              Discard and close
            </button>
          </div>
        </div>
      )}

      {/* Recall Prompt: Original doneWhen */}
      <div className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
          Recall prompt (from mission criteria)
        </span>
        <p className="text-sm font-semibold ui-text-ink">{mission.doneWhen}</p>
        <p className="text-xs ui-text-muted">
          Try explaining your approach, edge cases, and time complexity from memory before checking what you previously recorded.
        </p>
      </div>

      {/* Unsaved Recall Draft Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="recall-attempt-draft" className="block text-xs font-bold uppercase tracking-wider ui-text-muted">
            Your recall attempt (session-only)
          </label>
          <span className="text-[11px] ui-text-muted">
            {recallDraft.length} / 2000
          </span>
        </div>
        <textarea
          id="recall-attempt-draft"
          value={recallDraft}
          maxLength={2000}
          onChange={(e) => onRecallDraftChange(e.target.value)}
          placeholder="Type what you remember about the solution, core data structures, or edge cases..."
          rows={4}
          className="w-full rounded-xl border ui-border-border p-3 ui-text-ink ui-bg-surface text-sm focus:outline-accent"
        />
        <div className="flex items-center gap-1.5 text-xs ui-text-muted">
          <AlertCircle size={13} aria-hidden="true" />
          <span>Drafts stay while switching workspace views or missions. Closing this attempt, leaving the dashboard or refreshing discards it. Not saved to cloud.</span>
        </div>
      </div>

      {/* Reveal Saved Reflection Toggle */}
      <div className="pt-2 border-t ui-border-border space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowReflection((prev) => !prev)}
            className="secondary-button text-xs py-1.5 px-3 min-h-[36px]"
          >
            {showReflection ? (
              <>
                <EyeOff size={14} aria-hidden="true" />
                <span>Hide saved reflection</span>
              </>
            ) : (
              <>
                <Eye size={14} aria-hidden="true" />
                <span>Reveal saved reflection</span>
              </>
            )}
          </button>
          <span className="text-xs ui-text-muted">Check your memory against what you recorded at completion</span>
        </div>

        {showReflection && (
          <div className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold ui-text-muted">
                Recorded at completion:
              </span>
              {item?.outcome && (
                <span
                  className={`status-badge text-xs ${
                    item.outcome === 'independent' ? 'status-success' : 'status-accent'
                  }`}
                >
                  {item.outcome === 'independent' ? 'Independent' : 'With a hint'}
                </span>
              )}
              {item?.completedAt && (
                <span className="text-xs ui-text-muted">
                  on {readableDay(localDay(item.completedAt))}
                </span>
              )}
            </div>

            {item?.reflection ? (
              <blockquote className="text-sm italic ui-text-ink pl-3 border-l-2 border-accent">
                &ldquo;{item.reflection}&rdquo;
              </blockquote>
            ) : (
              <p className="text-xs ui-text-muted italic">
                No written reflection was saved when this mission was completed.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t ui-border-border flex-wrap">
        <button
          type="button"
          onClick={() => onOpenPractice(mission)}
          className="secondary-button text-xs py-2 px-3"
        >
          <BookOpen size={14} aria-hidden="true" />
          <span>Open in practice panel</span>
        </button>

        <button
          type="button"
          onClick={handleAttemptClose}
          className="primary-button text-xs py-2 px-4"
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>Done with recall</span>
        </button>
      </div>
    </section>
  );
}
