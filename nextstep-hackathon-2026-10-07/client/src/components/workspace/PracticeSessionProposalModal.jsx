import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  RotateCcw,
  Target,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { derivePracticeSessionProposal } from '../../services/workspace.js';
import { apiService } from '../../services/apiService.js';

function makeUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PracticeSessionProposalModal({
  isOpen,
  onClose,
  goal,
  catalog,
  onSessionStarted
}) {
  const [timeBudgetMinutes, setTimeBudgetMinutes] = useState(20);
  const [excludedActivityIds, setExcludedActivityIds] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const proposal = useMemo(() => {
    return derivePracticeSessionProposal(goal, catalog, {
      timeBudgetMinutes,
      excludedActivityIds
    });
  }, [goal, catalog, timeBudgetMinutes, excludedActivityIds]);

  // Focus trap, body scroll lock, Escape key
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector(
        'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus({ preventScroll: true });
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = [
          ...modalRef.current.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        ];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExcludeTask = (targetId) => {
    setExcludedActivityIds((prev) => [...prev, targetId]);
  };

  const handleResetExclusions = () => {
    setExcludedActivityIds([]);
  };

  const handleStartSession = async () => {
    if (!proposal.tasks || proposal.tasks.length === 0) return;
    setIsStarting(true);
    setError(null);

    try {
      const sessionId = makeUuid();
      const res = await apiService.startPracticeSession({
        expectedVersion: goal.version,
        sessionId,
        timeBudgetMinutes,
        title: `Targeted Practice (${timeBudgetMinutes}m)`,
        reason: proposal.reason,
        tasks: proposal.tasks.map((t, idx) => ({
          taskId: t.taskId || `task_${idx + 1}`,
          activityType: t.activityType,
          targetId: t.targetId,
          lessonId: t.lessonId,
          exerciseId: t.exerciseId || undefined,
          problemId: t.problemId || undefined,
          variantKey: t.variantKey || 'primary',
          title: t.title,
          topicId: t.topicId,
          topicTitle: t.topicTitle,
          estimatedMinutes: t.estimatedMinutes,
          reason: t.reason,
          evidenceType: t.evidenceType,
          section: t.section,
          status: 'pending'
        }))
      });

      if (onSessionStarted) {
        onSessionStarted(res.data.activePracticeSession, res.data.goal);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to start practice session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-proposal-title"
      ref={modalRef}
    >
      <div className="relative w-full max-w-2xl my-auto rounded-2xl border ui-border-border ui-bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b ui-border-border ui-bg-soft/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold ui-bg-accent/15 ui-text-accent flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Targeted Reinforcement
              </span>
              <span className="text-xs ui-text-muted">Adaptive practice companion</span>
            </div>
            <h2 id="practice-proposal-title" className="text-lg sm:text-xl font-extrabold ui-text-ink mt-1">
              Practise What Needs Work
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-xs ui-text-muted hover:ui-text-ink hover:ui-bg-soft transition-colors"
            aria-label="Close proposal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {error && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Time Budget Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider ui-text-muted mb-2">
              Choose your practice budget
            </label>
            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Time budget">
              {[10, 20, 30].map((mins) => {
                const isSelected = timeBudgetMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTimeBudgetMinutes(mins)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'ui-border-accent ui-bg-soft ui-text-accent font-bold ring-2 ui-border-border'
                        : 'ui-border-border ui-bg-surface hover:ui-bg-soft ui-text-ink'
                    }`}
                  >
                    <span className="text-base font-extrabold">{mins} min</span>
                    <span className="text-[11px] ui-text-muted">
                      {mins === 10 ? '1 targeted step' : mins === 20 ? '1–2 activities' : 'Up to 3 tasks'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Proposal Explanation */}
          <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/50 flex items-start gap-3">
            <Target className="w-5 h-5 ui-text-accent shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold ui-text-ink">Why this session:</span>
              <p className="ui-text-muted leading-relaxed">{proposal.reason}</p>
            </div>
          </div>

          {/* Proposed Activities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                Proposed Activities ({proposal.tasks.length} of max {timeBudgetMinutes === 10 ? 1 : timeBudgetMinutes === 20 ? 2 : 3})
              </span>
              <span className="text-xs ui-text-muted font-medium">
                ~{proposal.totalEstimatedMinutes} min allocated
              </span>
            </div>

            {proposal.tasks.length === 0 ? (
              <div className="p-6 text-center border border-dashed ui-border-border rounded-xl ui-text-muted text-xs">
                No eligible reinforcement tasks match your current filter.
                {excludedActivityIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetExclusions}
                    className="mt-2 block mx-auto ui-text-accent hover:underline font-semibold"
                  >
                    Restore removed activities
                  </button>
                )}
              </div>
            ) : (
              proposal.tasks.map((task, index) => (
                <div
                  key={task.taskId || task.targetId}
                  className="p-4 rounded-xl border ui-border-border ui-bg-surface hover:border-accent/30 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md ui-bg-soft ui-text-ink">
                        Activity {index + 1}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md ui-bg-accent/10 ui-text-accent">
                        {task.activityType === 'worked_example'
                          ? 'Worked Example'
                          : task.activityType === 'trace_retry'
                          ? 'Trace Verification'
                          : task.activityType === 'boundary_retry'
                          ? 'Boundary Case'
                          : task.activityType === 'lesson_check'
                          ? 'Concept Check'
                          : 'Practice Problem'}
                      </span>
                      <span className="text-xs ui-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimatedMinutes}m
                      </span>
                    </div>

                    <h4 className="font-bold text-sm ui-text-ink truncate">{task.title}</h4>
                    <p className="text-xs ui-text-muted leading-relaxed line-clamp-2">{task.reason}</p>
                    <div className="text-[11px] ui-text-muted font-medium">{task.topicTitle}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExcludeTask(task.targetId)}
                    title="Replace with alternative activity"
                    className="p-1.5 rounded-lg ui-text-muted hover:ui-text-ink hover:ui-bg-soft transition-colors shrink-0"
                    aria-label={`Replace ${task.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            {proposal.canRegenerate && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleResetExclusions}
                  className="text-xs ui-text-accent hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset activity preferences
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t ui-border-border ui-bg-soft/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button text-xs py-2.5 px-4"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={isStarting || proposal.tasks.length === 0}
            className="primary-button text-xs py-2.5 px-5 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Preparing session...
              </>
            ) : (
              <>
                Start Practice Session
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
