import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BookOpen,
  RotateCcw,
  Target,
  ExternalLink,
  Pause,
  AlertTriangle,
  Award,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';
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

export default function PracticeSessionModal({
  isOpen,
  onClose,
  goal,
  catalog,
  activeSession,
  onSessionUpdated,
  onOpenProofStudio,
  onOpenContinuationPlan
}) {
  const modalRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [selectedKnowledgeOption, setSelectedKnowledgeOption] = useState(null);
  const [knowledgeFeedback, setKnowledgeFeedback] = useState(null);
  const [isAbandonConfirmOpen, setIsAbandonConfirmOpen] = useState(false);
  const [isVersionConflict, setIsVersionConflict] = useState(false);
  const [isRefreshingVersion, setIsRefreshingVersion] = useState(false);
  const [evaluatingCheck, setEvaluatingCheck] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const activeUpdateIdRef = useRef(null);

  const curriculum = catalog?.curriculum || {};
  const lessons = curriculum.lessons || [];
  const exercises = curriculum.exercises || [];
  const practiceProblems = curriculum.practiceProblems || [];

  const lessonById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const practiceById = useMemo(() => new Map(practiceProblems.map((p) => [p.id, p])), [practiceProblems]);

  const tasks = activeSession?.tasks || [];
  const currentTaskIndex = activeSession?.currentTaskIndex || 0;
  const currentTask = tasks[currentTaskIndex] || tasks[0] || null;

  // Detect fresh evaluated attempt in goal workspace matching current task requirements
  const freshAttempt = useMemo(() => {
    if (!currentTask?.exerciseId || !goal?.studyWorkspace?.exerciseAttempts) return null;
    const attempts = goal.studyWorkspace.exerciseAttempts[currentTask.exerciseId];
    if (!Array.isArray(attempts) || attempts.length === 0) return null;

    const baselineTime = currentTask.baselineTimestamp ? new Date(currentTask.baselineTimestamp).getTime() : 0;
    const requiredVariant = currentTask.variantKey || 'primary';

    const matching = attempts.filter((a) => {
      const matchVariant = (a.variantKey || 'primary') === requiredVariant;
      const matchTimestamp = (!currentTask.baselineTimestamp || new Date(a.timestamp || a.savedAt || 0).getTime() >= baselineTime);
      const notOldId = !currentTask.baselineLatestAttemptId || a.attemptId !== currentTask.baselineLatestAttemptId;
      return matchVariant && matchTimestamp && notOldId;
    });

    return matching.length > 0 ? matching[matching.length - 1] : null;
  }, [currentTask, goal?.studyWorkspace?.exerciseAttempts]);

  // Focus trap & Escape key
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

  const currentLesson = currentTask ? lessonById.get(currentTask.lessonId) : null;
  const currentExercise = currentTask?.exerciseId ? exerciseById.get(currentTask.exerciseId) : null;
  const currentPractice = currentTask?.problemId ? practiceById.get(currentTask.problemId) : null;

  // Refresh goal version non-destructively preserving selections
  const handleRefreshVersion = async () => {
    setIsRefreshingVersion(true);
    try {
      const res = await apiService.getGoal();
      if (res?.data?.goal && onSessionUpdated) {
        onSessionUpdated(activeSession, res.data.goal);
        setIsVersionConflict(false);
        setError(null);
      }
    } catch (err) {
      setError(err?.message || 'Failed to refresh workspace version.');
    } finally {
      setIsRefreshingVersion(false);
    }
  };

  // Evaluate knowledge check using authoritative service
  const handleSelectCheckOption = async (optionId) => {
    setSelectedKnowledgeOption(optionId);
    setEvaluatingCheck(true);
    setError(null);
    try {
      const res = await apiService.evaluateLessonCheck({
        lessonId: currentTask.lessonId,
        optionId
      });
      setCheckResult(res.data);
      setKnowledgeFeedback(res.data?.feedback || (res.data?.correct ? 'Correct understanding!' : 'Incorrect option.'));
    } catch (err) {
      setKnowledgeFeedback(err?.message || 'Evaluation service unavailable.');
    } finally {
      setEvaluatingCheck(false);
    }
  };

  // Pause session and exit
  const handlePauseAndExit = async () => {
    if (!activeSession) {
      onClose();
      return;
    }
    setIsUpdating(true);
    setError(null);
    setIsVersionConflict(false);
    if (!activeUpdateIdRef.current) {
      activeUpdateIdRef.current = makeUuid();
    }
    const updateId = activeUpdateIdRef.current;
    try {
      const res = await apiService.updatePracticeSession({
        expectedVersion: goal.version,
        sessionId: activeSession.sessionId,
        updateId,
        status: 'paused',
        currentTaskIndex
      });
      activeUpdateIdRef.current = null;
      if (onSessionUpdated) {
        onSessionUpdated(res.data.activePracticeSession, res.data.goal);
      }
      onClose();
    } catch (err) {
      if (err?.code === 'VERSION_CONFLICT') {
        setIsVersionConflict(true);
      }
      setError(err?.message || 'Failed to pause session. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Abandon session
  const handleAbandonSession = async () => {
    if (!activeSession) {
      onClose();
      return;
    }
    setIsUpdating(true);
    setError(null);
    setIsVersionConflict(false);
    if (!activeUpdateIdRef.current) {
      activeUpdateIdRef.current = makeUuid();
    }
    const updateId = activeUpdateIdRef.current;
    try {
      const res = await apiService.updatePracticeSession({
        expectedVersion: goal.version,
        sessionId: activeSession.sessionId,
        updateId,
        status: 'abandoned'
      });
      activeUpdateIdRef.current = null;
      if (onSessionUpdated) {
        onSessionUpdated(null, res.data.goal);
      }
      setSessionSummary(res.data.sessionSummary);
    } catch (err) {
      if (err?.code === 'VERSION_CONFLICT') {
        setIsVersionConflict(true);
      }
      setError(err?.message || 'Failed to abandon session.');
    } finally {
      setIsUpdating(false);
      setIsAbandonConfirmOpen(false);
    }
  };

  // Complete current task
  const handleCompleteCurrentTask = async (evidenceType, notes = null, attemptId = null) => {
    if (!activeSession || !currentTask) return;
    setIsUpdating(true);
    setError(null);
    setIsVersionConflict(false);

    if (!activeUpdateIdRef.current) {
      activeUpdateIdRef.current = makeUuid();
    }
    const updateId = activeUpdateIdRef.current;

    try {
      const isLastTask = currentTaskIndex >= tasks.length - 1;
      const nextStatus = isLastTask ? 'completed' : 'in_progress';
      const nextIndex = isLastTask ? currentTaskIndex : currentTaskIndex + 1;

      const res = await apiService.updatePracticeSession({
        expectedVersion: goal.version,
        sessionId: activeSession.sessionId,
        updateId,
        status: nextStatus,
        currentTaskIndex: nextIndex,
        completedTask: {
          taskId: currentTask.taskId,
          evidenceType,
          notes,
          attemptId
        }
      });

      activeUpdateIdRef.current = null;

      if (onSessionUpdated) {
        onSessionUpdated(res.data.activePracticeSession, res.data.goal);
      }

      if (isLastTask) {
        setSessionSummary(res.data.sessionSummary);
      } else {
        setSelectedKnowledgeOption(null);
        setKnowledgeFeedback(null);
        setCheckResult(null);
      }
    } catch (err) {
      if (err?.code === 'VERSION_CONFLICT') {
        setIsVersionConflict(true);
      }
      setError(err?.message || 'Failed to record task progress. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Summary View
  if (sessionSummary) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-summary-title"
        ref={modalRef}
      >
        <div className="relative w-full max-w-xl my-auto rounded-2xl border ui-border-border ui-bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          <div className="p-6 text-center border-b ui-border-border ui-bg-soft/40">
            <div className="w-12 h-12 rounded-full ui-bg-accent/15 ui-text-accent flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h2 id="practice-summary-title" className="text-xl font-extrabold ui-text-ink">
              {sessionSummary.status === 'completed' ? 'Practice Session Completed' : 'Practice Session Finished'}
            </h2>
            <p className="text-xs ui-text-muted mt-1">
              Authentic record of verified and self-reported learning activities.
            </p>
          </div>

          <div className="p-6 space-y-5 text-sm">
            {/* Authentic Separated Breakdown */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider ui-text-muted block mb-2.5">
                Activity Evidence Breakdown
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-surface flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                    {sessionSummary.viewedCount}
                  </div>
                  <div>
                    <div className="text-xs font-bold ui-text-ink">Viewed</div>
                    <div className="text-[11px] ui-text-muted">Worked examples studied</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-surface flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                    {sessionSummary.verifiedCount}
                  </div>
                  <div>
                    <div className="text-xs font-bold ui-text-ink">Verified</div>
                    <div className="text-[11px] ui-text-muted">Independent traces checked</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-surface flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                    {sessionSummary.hintedCount}
                  </div>
                  <div>
                    <div className="text-xs font-bold ui-text-ink">Hinted</div>
                    <div className="text-[11px] ui-text-muted">Traces with assistance</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-surface flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm">
                    {sessionSummary.selfReportedCount}
                  </div>
                  <div>
                    <div className="text-xs font-bold ui-text-ink">Self-Reported</div>
                    <div className="text-[11px] ui-text-muted">External practice & checks</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/50 text-xs space-y-1">
              <span className="font-semibold ui-text-ink">Next step suggestion:</span>
              <p className="ui-text-muted leading-relaxed">
                Your practice results have been saved to your workspace evidence ledger. Return to Today to continue your progression or review your weekly schedule.
              </p>
            </div>
          </div>

          <div className="p-5 border-t ui-border-border ui-bg-soft/30 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button text-xs py-2 px-3.5"
            >
              Return to Today
            </button>

            {onOpenContinuationPlan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContinuationPlan();
                }}
                className="primary-button text-xs py-2 px-3.5 flex items-center gap-2"
              >
                Plan Next Week
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-runner-title"
      ref={modalRef}
    >
      <div className="relative w-full max-w-2xl my-auto rounded-2xl border ui-border-border ui-bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b ui-border-border ui-bg-soft/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold ui-bg-accent/15 ui-text-accent">
                Activity {currentTaskIndex + 1} of {tasks.length}
              </span>
              <span className="text-xs ui-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activeSession.timeBudgetMinutes}m Session Budget
              </span>
            </div>
            <h2 id="practice-runner-title" className="text-base sm:text-lg font-extrabold ui-text-ink">
              {currentTask?.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePauseAndExit}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg border ui-border-border text-xs font-medium ui-text-muted hover:ui-text-ink hover:ui-bg-soft transition-colors flex items-center gap-1.5"
              title="Pause and return to Today"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause & Exit
            </button>

            <button
              type="button"
              onClick={() => setIsAbandonConfirmOpen(true)}
              disabled={isUpdating}
              className="p-1.5 rounded-lg text-xs ui-text-muted hover:text-red-500 hover:ui-bg-soft transition-colors"
              title="Abandon session"
              aria-label="Abandon session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abandon confirmation prompt */}
        {isAbandonConfirmOpen && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-xs flex items-center justify-between gap-3 text-red-600">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Abandon this practice session? Already completed activities will remain recorded.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAbandonConfirmOpen(false)}
                className="px-2.5 py-1 rounded border border-red-500/30 font-medium hover:bg-red-500/10"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={handleAbandonSession}
                className="px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700"
              >
                Yes, Abandon
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 text-xs font-medium space-y-2">
              <div>{error}</div>
              {isVersionConflict && (
                <button
                  type="button"
                  onClick={handleRefreshVersion}
                  disabled={isRefreshingVersion}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isRefreshingVersion ? 'Refreshing...' : 'Refresh Workspace & Keep Choices'}
                </button>
              )}
            </div>
          )}

          {/* Task Context Card */}
          <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/40 text-xs space-y-1">
            <div className="flex items-center gap-2 text-accent font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Targeted Focus</span>
            </div>
            <p className="ui-text-muted leading-relaxed">{currentTask?.reason}</p>
          </div>

          {/* Interactive Task Content: Worked Example */}
          {currentTask?.activityType === 'worked_example' && currentLesson?.workedExample && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border ui-border-border ui-bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                    Step-by-Step Worked Example
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                    Viewed Evidence
                  </span>
                </div>

                <div className="p-2.5 rounded-lg ui-bg-soft font-mono text-xs ui-text-ink">
                  Input: {currentLesson.workedExample.inputDescription}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold ui-text-ink">Trace Execution Steps:</span>
                  <ol className="space-y-2 list-decimal list-inside text-xs ui-text-muted leading-relaxed">
                    {currentLesson.workedExample.stepByStep?.map((step, idx) => (
                      <li key={idx} className="pl-1">
                        <span className="ui-text-ink">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {currentLesson.workedExample.invariantSummary && (
                  <div className="p-3 rounded-lg border border-accent/20 bg-accent/5 text-xs text-accent">
                    <span className="font-bold block mb-1">Invariant Summary:</span>
                    {currentLesson.workedExample.invariantSummary}
                  </div>
                )}

                {onOpenProofStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProofStudio({
                        topicId: currentTask.topicId,
                        lessonId: currentTask.lessonId,
                        exerciseId: currentTask.exerciseId,
                        variantKey: currentTask.variantKey || 'primary',
                        mode: 'learn',
                        section: 'proof-worked-example'
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 transition-colors text-xs font-medium flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Open Example in Proof Studio
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCompleteCurrentTask('viewed', 'Reviewed worked example step-by-step')}
                disabled={isUpdating}
                className="primary-button w-full py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                I Reviewed This Worked Example
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive Task Content: Lesson Check */}
          {currentTask?.activityType === 'lesson_check' && currentLesson?.knowledgeCheck && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border ui-border-border ui-bg-surface space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider ui-text-muted block">
                  Knowledge Check
                </span>
                <p className="text-sm font-semibold ui-text-ink leading-relaxed">
                  {currentLesson.knowledgeCheck.question}
                </p>

                <div className="space-y-2 pt-1" role="radiogroup" aria-label="Check options">
                  {currentLesson.knowledgeCheck.options?.map((opt) => {
                    const isSelected = selectedKnowledgeOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={evaluatingCheck || isUpdating}
                        onClick={() => handleSelectCheckOption(opt.id)}
                        className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? checkResult?.correct
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30'
                              : 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-amber-500/30'
                            : 'ui-border-border ui-bg-surface hover:ui-bg-soft ui-text-ink'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-current shrink-0 mt-0.5 flex items-center justify-center">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-current" />}
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {knowledgeFeedback && (
                  <div className={`p-3 rounded-lg text-xs leading-relaxed ${checkResult?.correct ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : 'ui-bg-soft ui-text-muted'}`}>
                    {knowledgeFeedback}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCompleteCurrentTask('self_reported', `Knowledge check option: ${selectedKnowledgeOption}`)}
                disabled={isUpdating || evaluatingCheck || !selectedKnowledgeOption || !checkResult?.correct}
                className="primary-button w-full py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Knowledge Check
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Interactive Task Content: Trace / Boundary Retry */}
          {(currentTask?.activityType === 'trace_retry' || currentTask?.activityType === 'boundary_retry') && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border ui-border-border ui-bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                    Interactive Proof Verification
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                    Verified Evaluation
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm ui-text-ink">
                    {currentExercise?.title || currentTask.title}
                  </h4>
                  <p className="text-xs ui-text-muted leading-relaxed">
                    {currentExercise?.objective || 'Verify invariant updates step-by-step.'}
                  </p>
                  <div className="text-xs ui-text-muted mt-1">
                    Target variant: <span className="font-mono font-semibold ui-text-ink">{currentTask.variantKey === 'alternate' ? 'Alternate input' : 'Primary input'}</span>
                  </div>
                </div>

                {onOpenProofStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProofStudio({
                        topicId: currentTask.topicId,
                        lessonId: currentTask.lessonId,
                        exerciseId: currentTask.exerciseId,
                        variantKey: currentTask.variantKey || 'primary',
                        mode: 'trace',
                        section: currentTask.activityType === 'boundary_retry' ? 'proof-edge-case-check' : 'proof-trace-container'
                      });
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Open Trace in Interactive Studio
                  </button>
                )}
              </div>

              {freshAttempt ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fresh evaluated trace attempt detected!</span>
                  </div>
                  <div className="text-xs ui-text-muted space-y-1">
                    <div>
                      Outcome:{' '}
                      <span className="font-semibold ui-text-ink">
                        {freshAttempt.outcome === 'independent' && (!freshAttempt.mistakeCount || freshAttempt.mistakeCount === 0)
                          ? 'Independent Success (Verified)'
                          : 'Assisted with hint / reference (Hinted)'}
                      </span>
                    </div>
                    <div>
                      Variant: <span className="font-mono font-semibold ui-text-ink">{freshAttempt.variantKey || 'primary'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCompleteCurrentTask(
                        freshAttempt.outcome === 'independent' && (!freshAttempt.mistakeCount || freshAttempt.mistakeCount === 0)
                          ? 'verified'
                          : 'hinted',
                        'Evaluated in Proof Studio',
                        freshAttempt.attemptId
                      )
                    }
                    disabled={isUpdating}
                    className="primary-button w-full py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Evaluated Attempt & Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/40 text-xs text-center space-y-1">
                  <span className="font-semibold ui-text-ink">Authoritative trace attempt required</span>
                  <p className="ui-text-muted leading-relaxed">
                    Click "Open Trace in Interactive Studio" above to solve and record this trace attempt. Progress will be verified automatically when you return.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Interactive Task Content: External Practice Problem */}
          {currentTask?.activityType === 'practice_problem' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border ui-border-border ui-bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                    External Problem Application
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-medium">
                    Self-Reported
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm ui-text-ink">
                    {currentPractice?.title || currentTask.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs ui-text-muted">
                    <span>{currentPractice?.provider || 'LeetCode'}</span>
                    <span>·</span>
                    <span>{currentPractice?.difficulty || 'Medium'}</span>
                    {currentPractice?.pattern && (
                      <>
                        <span>·</span>
                        <span>{currentPractice.pattern}</span>
                      </>
                    )}
                  </div>
                </div>

                {currentPractice?.url && (
                  <a
                    href={currentPractice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
                  >
                    Open problem on {currentPractice.provider || 'external platform'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCompleteCurrentTask('self_reported', 'External practice problem logged')}
                disabled={isUpdating}
                className="primary-button w-full py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Record Practice Completion & Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
