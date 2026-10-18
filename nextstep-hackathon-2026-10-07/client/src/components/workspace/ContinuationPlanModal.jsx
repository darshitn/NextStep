import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import AvailabilityPicker from '../AvailabilityPicker.jsx';
import { apiService } from '../../services/apiService.js';

export default function ContinuationPlanModal({
  isOpen,
  onClose,
  goal,
  onGoalUpdated,
  onPlanAccepted
}) {
  const [step, setStep] = useState('config'); // 'config' | 'preview'
  const [availability, setAvailability] = useState(
    goal?.availability || { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
  );
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setPreview(null);
      setError(null);
    } else if (goal?.availability) {
      setAvailability(goal.availability);
    }
  }, [isOpen, goal]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract checkpoint latest attempt for evidence display
  const continuation = goal?.studyWorkspace?.continuation;
  const latestAttempt = continuation?.checkpoint?.latestAttempt;
  const failedTopics = [];
  if (latestAttempt?.topicResults) {
    for (const [tId, res] of Object.entries(latestAttempt.topicResults)) {
      if (res.revisitRecommended) {
        failedTopics.push(res);
      }
    }
  }

  const handleGeneratePreview = async () => {
    setIsLoadingPreview(true);
    setError(null);

    try {
      const res = await apiService.previewContinuationPlan({
        expectedVersion: goal.version,
        availability
      });

      if (res?.data) {
        setPreview(res.data);
        setStep('preview');
      }
    } catch (err) {
      console.error('Continuation plan preview error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Your goal state updated in another session. Please reload to preview latest schedule.');
      } else {
        setError(err.message || 'Failed to generate continuation plan preview.');
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!preview) return;
    setIsApplying(true);
    setError(null);

    try {
      const res = await apiService.applyContinuationPlan({
        expectedVersion: preview.baseVersion,
        previewForDate: preview.previewForDate,
        curriculumVersion: preview.curriculumVersion,
        availability,
        selectedItemIds: preview.selectedItemIds,
        targetDate: preview.targetDate
      });

      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        if (onPlanAccepted) onPlanAccepted(res.data.studyPlan);
        onClose();
      }
    } catch (err) {
      console.error('Apply continuation plan error:', err);
      if (err.status === 409) {
        setError('Schedule conflict: Date or version changed since preview. Please generate a fresh preview.');
        setStep('config');
      } else {
        setError(err.message || 'Failed to apply continuation plan.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="continuation-plan-title"
      ref={modalRef}
    >
      <div className="relative w-full max-w-2xl my-auto rounded-2xl border ui-border-border ui-bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b ui-border-border ui-bg-soft/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold ui-bg-accent/15 ui-text-accent">
                Next-Week Study Plan
              </span>
              <span className="text-xs ui-text-muted">Evidence-based progression</span>
            </div>
            <h2 id="continuation-plan-title" className="text-lg sm:text-xl font-extrabold ui-text-ink mt-1">
              {step === 'config' ? 'Configure Your Next Step' : 'Review & Confirm Your Plan'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:ui-bg-soft ui-text-muted hover:ui-text-ink transition-colors"
            aria-label="Close plan dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{error}</p>
                <p className="text-xs opacity-90">Please adjust your inputs and try again.</p>
              </div>
            </div>
          )}

          {step === 'config' ? (
            /* ================= STEP 1: CONFIG & SUGGESTIONS ================= */
            <div className="space-y-6">
              {/* Evidence-Based Suggestions Box */}
              <div className="p-4 rounded-xl border ui-border-border ui-bg-soft/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold ui-text-ink uppercase tracking-wider">
                    Evidence Behind Your Plan
                  </span>
                </div>

                <div className="space-y-2 text-xs ui-text-muted">
                  {failedTopics.length > 0 ? (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Targeted Revisit:</span>
                      <span>
                        Foundations checkpoint recommended review on{' '}
                        {failedTopics.map((t) => t.topicId.replace('topic_', '').replace(/_/g, ' ')).join(', ')}.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Foundation Ready:</span>
                      <span>Completed 12/12 starter missions with verified core pattern comprehension.</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="font-semibold ui-text-ink">Next Frontier:</span>
                    <span>Eligible curriculum progression into Two Pointers &amp; Sliding Window patterns.</span>
                  </div>
                </div>
              </div>

              {/* Weekly Availability Picker */}
              <AvailabilityPicker value={availability} onChange={setAvailability} disabled={isLoadingPreview} />

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t ui-border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium ui-text-ink hover:ui-bg-soft transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={isLoadingPreview}
                  className="primary-button text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isLoadingPreview ? 'Calculating schedule...' : 'Preview Next-Week Plan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : preview ? (
            /* ================= STEP 2: READ-ONLY PREVIEW ================= */
            <div className="space-y-6">
              {/* Plan Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1">
                  <span className="text-[11px] font-semibold ui-text-muted uppercase tracking-wider">Start Date</span>
                  <p className="text-sm font-bold ui-text-ink">{preview.planStartDate} (IST)</p>
                </div>

                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1">
                  <span className="text-[11px] font-semibold ui-text-muted uppercase tracking-wider">Est. Finish</span>
                  <p className="text-sm font-bold ui-text-ink">{preview.estimatedFinishDate} (IST)</p>
                </div>

                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold ui-text-muted uppercase tracking-wider">Capacity</span>
                  <p
                    className={`text-sm font-bold ${
                      preview.status === 'on_track'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {preview.status === 'on_track' ? 'On Track' : 'Over Capacity'}
                  </p>
                </div>
              </div>

              {/* Scheduled Sessions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold ui-text-ink uppercase tracking-wider">
                  Planned Study Sessions ({preview.sessions.length} sessions)
                </h4>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {preview.sessions.map((session, idx) => (
                    <div
                      key={`${session.itemId}-${session.date}-${idx}`}
                      className="p-3 rounded-xl border ui-border-border ui-bg-surface flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] ui-text-muted px-2 py-0.5 rounded-md ui-bg-soft shrink-0">
                          {session.date}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="font-semibold ui-text-ink truncate">{session.title}</p>
                          <span className="text-[10px] ui-text-muted uppercase tracking-wider">
                            {session.itemType} · Part {session.partIndex} of {session.totalParts}
                          </span>
                        </div>
                      </div>

                      <span className="font-medium ui-text-muted shrink-0 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {session.allocatedMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unscheduled Warning if any */}
              {preview.unscheduledItemIds?.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-semibold">Items exceeding weekly horizon:</p>
                  <p className="mt-0.5">
                    {preview.unscheduledItemIds.length} items will spill into future weeks according to your weekly availability.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t ui-border-border">
                <button
                  type="button"
                  onClick={() => setStep('config')}
                  disabled={isApplying}
                  className="px-3.5 py-2 rounded-xl border ui-border-border text-xs font-semibold ui-text-muted hover:ui-text-ink hover:ui-bg-soft flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Availability</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyPlan}
                  disabled={isApplying}
                  className="primary-button text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApplying ? 'Applying plan...' : 'Accept & Start This Plan'}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
