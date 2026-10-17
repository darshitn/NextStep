import React, { useState } from 'react';
import {
  RotateCcw,
  BookOpen,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { readableDay, localDay } from '../../services/activity.js';

export const CONFIDENCE_OPTIONS = [
  { value: 1, label: '1 · Forgot', intervalDays: 1, helper: '+1 day' },
  { value: 2, label: '2 · Struggled', intervalDays: 2, helper: '+2 days' },
  { value: 3, label: '3 · Effort', intervalDays: 3, helper: '+3 days' },
  { value: 4, label: '4 · Good', intervalDays: 7, helper: '+7 days' },
  { value: 5, label: '5 · Easy', intervalDays: 14, helper: '+14 days' },
];

function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function RecallPanel({
  mission,
  item,
  goal,
  recallDraft = '',
  onRecallDraftChange,
  confidence = null,
  onConfidenceChange,
  attemptId = null,
  onAttemptIdChange,
  onSaveRecallAttempt,
  onClose,
  onOpenPractice,
  onRefresh
}) {
  const [showReflection, setShowReflection] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'network_error' | 'version_conflict' | 'attempt_conflict' | 'error', message, nextReviewDate, savedAt }

  if (!mission) return null;

  // Derive canonical recall history from goal state, falling back to item
  const missionLearning = goal?.learning?.[mission.id];
  const recallHistory = Array.isArray(missionLearning?.recallHistory)
    ? missionLearning.recallHistory
    : Array.isArray(item?.recallHistory)
    ? item.recallHistory
    : [];

  const latestSavedAttempt = recallHistory.length > 0 ? recallHistory[recallHistory.length - 1] : null;

  // Handle draft text change
  const handleDraftChange = (newText) => {
    // If an error previously occurred, regenerate attemptId because the payload changed
    if (saveStatus && saveStatus.type !== 'success') {
      if (onAttemptIdChange) onAttemptIdChange(generateUuid());
      setSaveStatus(null);
    }
    onRecallDraftChange(newText);
  };

  // Handle confidence selection
  const handleConfidenceSelect = (val) => {
    if (saveStatus && saveStatus.type !== 'success') {
      if (onAttemptIdChange) onAttemptIdChange(generateUuid());
      setSaveStatus(null);
    }
    if (onConfidenceChange) onConfidenceChange(val);
  };

  // Save review attempt
  const handleSaveReview = async () => {
    const trimmed = recallDraft.trim();
    if (!trimmed || !confidence || !onSaveRecallAttempt) return;

    const activeAttemptId = attemptId || generateUuid();
    if (!attemptId && onAttemptIdChange) {
      onAttemptIdChange(activeAttemptId);
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await onSaveRecallAttempt({
        missionId: mission.id,
        attemptId: activeAttemptId,
        attemptText: trimmed,
        confidence
      });

      const savedRecord = res?.recallAttempt;
      setSaveStatus({
        type: 'success',
        message: 'Recall review saved!',
        savedAt: savedRecord?.savedAt || new Date().toISOString(),
        nextReviewDate: savedRecord?.nextReviewDate || null
      });

      // Reset draft and confidence on actual save success
      onRecallDraftChange('');
      if (onConfidenceChange) onConfidenceChange(null);
      if (onAttemptIdChange) onAttemptIdChange(generateUuid());
    } catch (err) {
      console.error('Failed to save recall review:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setSaveStatus({
          type: 'version_conflict',
          message: 'Your practice plan was updated in another session. Please refresh your plan to retry saving without losing your draft.'
        });
      } else if (err.code === 'ATTEMPT_CONFLICT') {
        // Attempt ID reused with different content; create a new attempt ID
        if (onAttemptIdChange) onAttemptIdChange(generateUuid());
        setSaveStatus({
          type: 'attempt_conflict',
          message: 'This attempt ID was already used with different content. A new attempt ID has been created so you can retry.'
        });
      } else {
        setSaveStatus({
          type: 'network_error',
          message: err.message || 'Could not save recall review. Check your connection and retry.'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshPlan = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      // Clear version conflict message so student can retry save
      if (saveStatus?.type === 'version_conflict') {
        setSaveStatus(null);
      }
    } catch (err) {
      console.error('Plan refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAttemptClose = () => {
    if (isSaving) return;
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
      className="recall-panel rounded-2xl border ui-border-border ui-bg-surface p-5 sm:p-6 space-y-5 shadow-sm"
      aria-label={`Recall practice for ${mission.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
              {mission.id.toUpperCase()} · Recall Practice
            </span>
            <span className="status-badge status-neutral text-xs">
              <RotateCcw size={12} className="inline mr-1" aria-hidden="true" />
              Retrieval
            </span>
            {latestSavedAttempt?.nextReviewDate && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full ui-bg-soft ui-text-accent border ui-border-border">
                Next review: {latestSavedAttempt.nextReviewDate}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold ui-text-ink">{mission.title}</h3>
        </div>

        <button
          type="button"
          onClick={handleAttemptClose}
          disabled={isSaving}
          className="p-1.5 rounded-lg ui-text-muted hover:ui-text-ink hover:ui-bg-soft disabled:opacity-40"
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

      {/* Recall Textarea Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="recall-attempt-draft" className="block text-xs font-bold uppercase tracking-wider ui-text-muted">
            Your recall attempt
          </label>
          <span className="text-[11px] ui-text-muted">
            {recallDraft.length} / 2000
          </span>
        </div>
        <textarea
          id="recall-attempt-draft"
          value={recallDraft}
          maxLength={2000}
          disabled={isSaving}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder="Type what you remember about the solution, core data structures, or edge cases..."
          rows={4}
          className="w-full rounded-xl border ui-border-border p-3 ui-text-ink ui-bg-surface text-sm focus:outline-accent disabled:opacity-60"
        />
        <div className="flex items-center gap-1.5 text-xs ui-text-muted">
          <AlertCircle size={13} aria-hidden="true" />
          <span>Unsaved text is session-only. Click &ldquo;Save review&rdquo; below to persist your attempt and calculate your next review due date.</span>
        </div>
      </div>

      {/* Confidence Rating Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider ui-text-muted">
            Self-rated confidence (1–5)
          </label>
          {confidence && (
            <span className="text-xs font-semibold ui-text-accent">
              Interval: {CONFIDENCE_OPTIONS.find((c) => c.value === confidence)?.helper}
            </span>
          )}
        </div>
        <div
          role="radiogroup"
          aria-label="Self-rated confidence level"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2"
        >
          {CONFIDENCE_OPTIONS.map((opt) => {
            const isSelected = confidence === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isSaving}
                onClick={() => handleConfidenceSelect(opt.value)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/10 ui-text-ink ring-2 ring-accent'
                    : 'ui-border-border ui-bg-surface ui-text-muted hover:ui-text-ink hover:ui-bg-soft'
                } disabled:opacity-50`}
              >
                <span className="font-bold">{opt.label}</span>
                <span className="text-[11px] font-normal opacity-80 mt-0.5">{opt.helper}</span>
              </button>
            );
          })}
        </div>
        {!confidence && (
          <p className="text-[11px] ui-text-muted">
            Select how comfortably you recalled this mission to calculate your next review interval (+1 to +14 days).
          </p>
        )}
      </div>

      {/* Save Status / Feedback Alerts */}
      {saveStatus?.type === 'success' && (
        <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-semibold">{saveStatus.message}</p>
            <p className="opacity-90">
              Next review due: <strong>{saveStatus.nextReviewDate || 'Scheduled'}</strong>. Your attempt is preserved in the history below.
            </p>
          </div>
        </div>
      )}

      {saveStatus?.type === 'version_conflict' && (
        <div role="alert" className="rounded-xl border border-attention bg-attention-bg p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-attention-text">
            <AlertTriangle size={15} aria-hidden="true" />
            <span>Practice plan updated in another session</span>
          </div>
          <p className="text-attention-text">{saveStatus.message}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRefreshPlan}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg ui-bg-surface border ui-border-border font-semibold text-xs ui-text-ink hover:ui-bg-soft inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh plan'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveReview}
              disabled={isSaving}
              className="primary-button text-xs py-1.5 px-3"
            >
              Retry save
            </button>
          </div>
        </div>
      )}

      {(saveStatus?.type === 'network_error' || saveStatus?.type === 'attempt_conflict') && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
            <AlertCircle size={15} aria-hidden="true" />
            <span>Save error</span>
          </div>
          <p className="ui-text-ink">{saveStatus.message}</p>
          <button
            type="button"
            onClick={handleSaveReview}
            disabled={isSaving}
            className="primary-button text-xs py-1.5 px-3"
          >
            Retry save
          </button>
        </div>
      )}

      {/* Save Action Row */}
      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <button
          type="button"
          disabled={isSaving || !recallDraft.trim() || !confidence}
          onClick={handleSaveReview}
          className="primary-button text-xs py-2 px-4"
        >
          {isSaving ? (
            <>
              <RefreshCw size={13} className="animate-spin mr-1" aria-hidden="true" />
              <span>Saving review...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>Save review</span>
            </>
          )}
        </button>

        <span className="text-xs ui-text-muted">
          {!recallDraft.trim()
            ? 'Type your recall attempt to enable saving'
            : !confidence
            ? 'Select a confidence rating (1–5) to enable saving'
            : 'Ready to save'}
        </span>
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

      {/* Saved Recall History Section */}
      <div className="pt-3 border-t ui-border-border space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <RotateCcw size={15} className="ui-text-accent" aria-hidden="true" />
            <h4 className="text-sm font-bold ui-text-ink">
              Saved recall history ({recallHistory.length} of max 20 retained)
            </h4>
          </div>
          {latestSavedAttempt?.nextReviewDate && (
            <span className="text-xs font-medium ui-text-muted">
              Next scheduled: <strong className="ui-text-ink">{latestSavedAttempt.nextReviewDate}</strong>
            </span>
          )}
        </div>

        <p className="text-xs ui-text-muted">
          NextStep retains up to your latest 20 recall attempts for this mission. Review intervals (+1, +2, +3, +7, +14 days) are starter scheduling suggestions based on your self-rated confidence, not a formal cognitive assessment.
        </p>

        {recallHistory.length === 0 ? (
          <p className="text-xs ui-text-muted italic rounded-xl border ui-border-border ui-bg-soft p-3">
            No saved recall attempts yet for this mission. Type your memory retrieval above, rate your confidence, and click &ldquo;Save review&rdquo;.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1" role="list" aria-label="Saved recall attempts">
            {[...recallHistory].reverse().map((att, idx) => (
              <div
                key={att.attemptId || idx}
                role="listitem"
                className="rounded-xl border ui-border-border ui-bg-soft p-3 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="status-badge status-neutral text-[11px]">
                      Confidence {att.confidence}/5
                    </span>
                    <span className="ui-text-muted text-[11px]">
                      {att.savedAt ? readableDay(localDay(att.savedAt)) : 'Saved'}
                    </span>
                  </div>
                  {att.nextReviewDate && (
                    <span className="text-[11px] font-semibold ui-text-accent">
                      Due: {att.nextReviewDate}
                    </span>
                  )}
                </div>
                <p className="ui-text-ink whitespace-pre-wrap break-words">
                  {att.attemptText}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t ui-border-border flex-wrap">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onOpenPractice(mission)}
          className="secondary-button text-xs py-2 px-3 disabled:opacity-50"
        >
          <BookOpen size={14} aria-hidden="true" />
          <span>Open in practice panel</span>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleAttemptClose}
          className="secondary-button text-xs py-2 px-4 disabled:opacity-50"
        >
          <span>Done with recall</span>
        </button>
      </div>
    </section>
  );
}
