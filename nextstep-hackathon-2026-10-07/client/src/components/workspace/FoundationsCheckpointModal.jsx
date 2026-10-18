import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Calendar
} from 'lucide-react';
import { apiService } from '../../services/apiService.js';

export default function FoundationsCheckpointModal({
  isOpen,
  onClose,
  goal,
  onGoalUpdated,
  onStartNextWeekPlan,
  onOpenProofLesson
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkpoint, setCheckpoint] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selfReportedAssistance, setSelfReportedAssistance] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [reflection, setReflection] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState(null);

  const modalRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Load checkpoint definition and saved draft/attempt
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    async function loadData() {
      try {
        const res = await apiService.getCheckpoint('chk_foundations_v1');
        if (!mounted) return;

        if (res?.data?.checkpoint) {
          setCheckpoint(res.data.checkpoint);
          const savedAnswers = res.data.draft?.answers || {};
          setAnswers(savedAnswers);

          if (res.data.latestAttempt) {
            setEvaluation(res.data.latestAttempt);
            if (res.data.latestAttempt.reflection) {
              setReflection(res.data.latestAttempt.reflection);
            }
          }
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load checkpoint:', err);
        setError(err.message || 'Failed to load Foundations Checkpoint.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Focus trap, body scroll lock, and Escape focus restoration
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
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
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
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
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const questions = checkpoint?.questions || [];
  const currentQuestion = questions[currentIndex] || null;

  const handleSelectOption = async (optionId) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);

    // Auto-save draft on selection
    try {
      setIsSavingDraft(true);
      const res = await apiService.saveCheckpointDraft({
        expectedVersion: goal.version,
        checkpointId: 'chk_foundations_v1',
        draftAnswers: newAnswers
      });
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setDraftNotice('Draft saved');
        setTimeout(() => setDraftNotice(null), 2500);
      }
    } catch (err) {
      console.warn('Draft auto-save notice:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleToggleHint = (qId) => {
    setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
    setSelfReportedAssistance((prev) => ({
      ...prev,
      [qId]: { usedHint: true }
    }));
  };

  const handleManualSaveDraft = async () => {
    setIsSavingDraft(true);
    setError(null);
    try {
      const res = await apiService.saveCheckpointDraft({
        expectedVersion: goal.version,
        checkpointId: 'chk_foundations_v1',
        draftAnswers: answers
      });
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setDraftNotice('Draft saved successfully');
        setTimeout(() => setDraftNotice(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    setIsSubmitting(true);
    setError(null);
    const attemptId = crypto.randomUUID();

    try {
      const res = await apiService.evaluateCheckpoint({
        expectedVersion: goal.version,
        attemptId,
        checkpointId: 'chk_foundations_v1',
        answers,
        selfReportedAssistance,
        reflection
      });

      if (res?.data) {
        if (res.data.goal) onGoalUpdated(res.data.goal);
        if (res.data.evaluation) setEvaluation(res.data.evaluation);
      }
    } catch (err) {
      console.error('Checkpoint evaluation error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Goal version changed concurrently. Your draft answers are preserved; please retry.');
      } else {
        setError(err.message || 'Failed to evaluate checkpoint.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiService.resetCheckpoint({
        expectedVersion: goal.version,
        checkpointId: 'chk_foundations_v1'
      });
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setEvaluation(null);
        setAnswers({});
        setRevealedHints({});
        setSelfReportedAssistance({});
        setCurrentIndex(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset checkpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkpoint-title"
      ref={modalRef}
    >
      <div className="relative w-full max-w-3xl my-auto rounded-2xl border ui-border-border ui-bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b ui-border-border ui-bg-soft/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold ui-bg-accent/15 ui-text-accent">
                Foundations Checkpoint
              </span>
              <span className="text-xs ui-text-muted">Estimated 10 mins</span>
              {draftNotice && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {draftNotice}
                </span>
              )}
            </div>
            <h2 id="checkpoint-title" className="text-lg sm:text-xl font-extrabold ui-text-ink mt-1">
              Verify Core DSA Patterns
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:ui-bg-soft ui-text-muted hover:ui-text-ink transition-colors"
            aria-label="Close checkpoint"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{error}</p>
                <p className="text-xs opacity-90">Your answers remain safe. You can retry submission.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm ui-text-muted">Loading foundations checkpoint...</p>
            </div>
          ) : evaluation ? (
            /* ================= EVALUATION RESULTS SCREEN ================= */
            <div className="space-y-6">
              {/* Score Banner */}
              <div
                className={`p-5 rounded-2xl border ${
                  evaluation.category === 'ready_to_continue'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30'
                } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        evaluation.category === 'ready_to_continue'
                          ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}
                    >
                      {evaluation.category === 'ready_to_continue'
                        ? 'Ready to Continue'
                        : evaluation.category === 'revisit_recommended'
                        ? 'Targeted Revisit Recommended'
                        : 'Insufficient Evidence'}
                    </span>
                    <span className="text-xs ui-text-muted">Authoritative Server Evaluation</span>
                  </div>
                  <h3 className="text-xl font-extrabold ui-text-ink">
                    Score: {evaluation.score.correct} / {evaluation.score.total} Correct
                  </h3>
                  <p className="text-xs ui-text-muted">
                    {evaluation.category === 'ready_to_continue'
                      ? 'Solid foundation across arrays, hashing, and binary search boundaries.'
                      : 'You demonstrated strong effort. A targeted revisit will cement edge-case boundaries before moving into Two Pointers and Sliding Window.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartNextWeekPlan) onStartNextWeekPlan();
                  }}
                  className="primary-button text-sm px-4 py-2.5 whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Plan My Next Week</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Per-Topic Review Cards */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold ui-text-ink">Topic Feedback &amp; Next Actions</h4>
                {checkpoint.topics.map((topic) => {
                  const tResult = evaluation.topicResults?.[topic.id];
                  if (!tResult) return null;

                  return (
                    <div
                      key={topic.id}
                      className="p-4 rounded-xl border ui-border-border ui-bg-surface space-y-2.5 hover:ui-border-border-a40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {tResult.correct ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          )}
                          <span className="text-sm font-bold ui-text-ink">{topic.title}</span>
                          {tResult.usedHint && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ui-bg-soft ui-text-muted">
                              Hint Assisted
                            </span>
                          )}
                        </div>

                        {tResult.revisitRecommended && tResult.recommendedAction && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onOpenProofLesson) {
                                onOpenProofLesson({
                                  topicId: tResult.recommendedAction.topicId,
                                  lessonId: tResult.recommendedAction.lessonId,
                                  exerciseId: tResult.recommendedAction.exerciseId
                                });
                              }
                            }}
                            className="text-xs font-semibold ui-text-accent hover:underline flex items-center gap-1"
                          >
                            <span>Open in Proof Studio</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs ui-text-muted leading-relaxed pl-6">{tResult.feedback}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reflection note if saved */}
              {evaluation.reflection && (
                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/40 space-y-1">
                  <span className="text-[11px] font-semibold ui-text-muted uppercase tracking-wider">
                    Your Saved Reflection
                  </span>
                  <p className="text-xs ui-text-ink italic">"{evaluation.reflection}"</p>
                </div>
              )}

              {/* Footer action buttons in results mode */}
              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap border-t ui-border-border">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl border ui-border-border text-xs font-semibold ui-text-muted hover:ui-text-ink hover:ui-bg-soft flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Checkpoint</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium ui-text-ink hover:ui-bg-soft transition-colors"
                  >
                    Back to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onStartNextWeekPlan) onStartNextWeekPlan();
                    }}
                    className="primary-button text-xs py-2 px-4"
                  >
                    <span>Proceed to Next-Week Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : currentQuestion ? (
            /* ================= QUESTION VIEW ================= */
            <div className="space-y-6">
              {/* Question Navigation Tabs */}
              <div className="flex items-center justify-between gap-2 border-b ui-border-border pb-3 flex-wrap">
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Question progress">
                  {questions.map((q, idx) => {
                    const isAnswered = Boolean(answers[q.id]);
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        onClick={() => setCurrentIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isCurrent
                            ? 'ui-bg-accent ui-text-inverse'
                            : isAnswered
                            ? 'ui-bg-soft ui-text-ink border ui-border-border'
                            : 'ui-text-muted hover:ui-bg-soft'
                        }`}
                      >
                        Q{idx + 1} {isAnswered && '✓'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs ui-text-muted">
                    {answeredCount} of {questions.length} answered
                  </span>
                  <button
                    type="button"
                    onClick={handleManualSaveDraft}
                    disabled={isSavingDraft}
                    className="p-1.5 rounded-lg border ui-border-border hover:ui-bg-soft text-xs ui-text-muted hover:ui-text-ink transition-colors flex items-center gap-1"
                    title="Save draft"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save draft</span>
                  </button>
                </div>
              </div>

              {/* Active Question Prompt */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider ui-text-accent">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs ui-text-muted">·</span>
                  <span className="text-xs ui-text-muted">
                    {checkpoint.topics.find((t) => t.id === currentQuestion.topicId)?.title}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold ui-text-ink leading-relaxed">
                  {currentQuestion.prompt}
                </p>

                {currentQuestion.codeSnippet && (
                  <pre className="p-3.5 rounded-xl border ui-border-border bg-black/5 dark:bg-black/30 font-mono text-xs overflow-x-auto ui-text-ink leading-relaxed">
                    <code>{currentQuestion.codeSnippet}</code>
                  </pre>
                )}
              </div>

              {/* Choice Options */}
              <div className="space-y-2.5" role="radiogroup" aria-labelledby="question-prompt">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm'
                          : 'ui-border-border hover:ui-bg-soft/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => handleSelectOption(opt.id)}
                        className="mt-0.5 accent-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs sm:text-sm ui-text-ink leading-relaxed select-none">{opt.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Hint Accordion */}
              {currentQuestion.hint && (
                <div className="rounded-xl border ui-border-border ui-bg-soft/30 p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleToggleHint(currentQuestion.id)}
                    className="text-xs font-semibold ui-text-muted hover:ui-text-ink flex items-center gap-1.5 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{revealedHints[currentQuestion.id] ? 'Hide hint' : 'Need a hint? (Recorded as assisted)'}</span>
                  </button>

                  {revealedHints[currentQuestion.id] && (
                    <p className="text-xs ui-text-muted leading-relaxed pl-5 border-l-2 border-amber-500">
                      {currentQuestion.hint}
                    </p>
                  )}
                </div>
              )}

              {/* Reflection note input on final question */}
              {currentIndex === questions.length - 1 && (
                <div className="space-y-2 pt-2 border-t ui-border-border">
                  <label htmlFor="checkpoint-reflection" className="block text-xs font-semibold ui-text-ink">
                    Optional learning reflection (max 500 characters)
                  </label>
                  <textarea
                    id="checkpoint-reflection"
                    rows={2}
                    maxLength={500}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What felt solid? Where did you hesitate or need a hint?"
                    className="w-full rounded-xl border ui-border-border ui-bg-surface p-3 text-xs ui-text-ink placeholder:ui-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Bottom Pagination & Submit */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t ui-border-border">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-2 rounded-xl border ui-border-border text-xs font-semibold ui-text-muted hover:ui-text-ink hover:ui-bg-soft flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                    className="primary-button text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitEvaluation}
                    disabled={isSubmitting || answeredCount === 0}
                    className="primary-button text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Evaluating on server...' : 'Submit Checkpoint'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
