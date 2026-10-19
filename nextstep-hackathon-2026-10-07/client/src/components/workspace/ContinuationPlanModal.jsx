import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { deriveWorkspaceReviewQueue } from '../../services/workspace.js';

export default function ContinuationPlanModal({
  isOpen,
  onClose,
  goal,
  catalog,
  onGoalUpdated,
  onPlanAccepted
}) {
  const [step, setStep] = useState('config'); // 'config' | 'preview'
  const [availability, setAvailability] = useState(
    goal?.availability || { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 }
  );
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Extract checkpoint latest attempt & status for evidence display
  const continuation = goal?.studyWorkspace?.continuation;
  const checkpoint = continuation?.checkpoint;
  const latestAttempt = checkpoint?.latestAttempt;
  const checkpointStatus = continuation?.status || checkpoint?.status || 'not_started';

  const failedTopics = useMemo(() => {
    const list = [];
    if (latestAttempt?.topicResults) {
      for (const [tId, res] of Object.entries(latestAttempt.topicResults)) {
        if (res.revisitRecommended) {
          list.push({ topicId: tId, ...res });
        }
      }
    }
    return list;
  }, [latestAttempt]);

  // Derive candidate activities based on real student evidence & curriculum
  const candidateActivities = useMemo(() => {
    const candidates = [];
    const addedIds = new Set();
    const curriculum = catalog?.curriculum;
    const lessons = curriculum?.lessons || [];
    const topics = curriculum?.topics || [];
    const topicById = new Map(topics.map((t) => [t.id, t]));
    const lessonById = new Map(lessons.map((l) => [l.id, l]));

    // 1. Checkpoint revisits
    if (latestAttempt?.topicResults) {
      for (const [topicId, tr] of Object.entries(latestAttempt.topicResults)) {
        if (tr.revisitRecommended && tr.recommendedAction?.lessonId) {
          const lid = tr.recommendedAction.lessonId;
          const lesson = lessonById.get(lid);
          const topic = topicById.get(topicId);
          addedIds.add(lid);
          candidates.push({
            id: lid,
            title: lesson ? lesson.title : lid,
            topicId,
            topicTitle: topic ? topic.title : topicId.replace('topic_', '').replace(/_/g, ' '),
            type: 'revisit',
            badge: 'Targeted Revisit',
            reason: `Foundations Checkpoint recommended revisit for ${topic ? topic.title : topicId}`,
            estimatedMinutes: lesson?.estimatedMinutes || 20
          });
        }
      }
    }

    // 2. Due reviews from workspace review queue (exercises and practice)
    if (curriculum) {
      try {
        const reviewQueue = deriveWorkspaceReviewQueue(goal, catalog?.curriculum ? catalog : { curriculum }, new Date());
        for (const item of reviewQueue) {
          if (!item.isDue) continue;
          if (candidates.length >= 3) break;
          if (!addedIds.has(item.itemId)) {
            addedIds.add(item.itemId);
            candidates.push({
              id: item.itemId,
              title: item.title,
              topicId: item.topicId,
              topicTitle: item.topicTitle,
              type: 'revisit',
              badge: item.kind === 'exercise' ? 'Due Proof Review' : 'Due Practice Review',
              reason: item.reason,
              estimatedMinutes: item.kind === 'exercise' ? 15 : 20
            });
          }
        }
      } catch (err) {
        console.warn('Could not derive review queue for continuation plan:', err);
      }
    }

    // 3. Next uncompleted curriculum lessons in prerequisite order
    const completedLessons = new Set(
      Object.entries(goal?.studyWorkspace?.lessonProgress || {})
        .filter(([k, lp]) => lp && (lp.status === 'completed' || lp.completedAt))
        .map(([k, lp]) => lp.lessonId || k)
    );

    const topicOrderMap = new Map(topics.map((t) => [t.id, t.order]));
    const sortedLessons = [...lessons].sort((a, b) => {
      const tA = topicOrderMap.get(a.topicId) ?? 99;
      const tB = topicOrderMap.get(b.topicId) ?? 99;
      if (tA !== tB) return tA - tB;
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    });

    for (const lesson of sortedLessons) {
      if (!completedLessons.has(lesson.id) && !addedIds.has(lesson.id)) {
        const prereqsMet = (lesson.prerequisites || []).every(
          (p) => completedLessons.has(p) || addedIds.has(p)
        );
        if (prereqsMet) {
          addedIds.add(lesson.id);
          const topic = topicById.get(lesson.topicId);
          candidates.push({
            id: lesson.id,
            title: lesson.title,
            topicId: lesson.topicId,
            topicTitle: topic ? topic.title : lesson.topicId.replace('topic_', '').replace(/_/g, ' '),
            type: 'new_lesson',
            badge: 'Frontier Lesson',
            reason: `Eligible progression into ${topic ? topic.title : lesson.topicId}`,
            estimatedMinutes: lesson.estimatedMinutes || 20
          });
          const frontierCount = candidates.filter((c) => c.type === 'new_lesson').length;
          if (frontierCount >= 2 || candidates.length >= 5) break;
        }
      }
    }

    // 4. End-of-library / deliberate review: if all curriculum lessons completed, offer foundational mastery revisit
    if (candidates.length === 0) {
      if (lessons.length > 0) {
        const first = lessons[0];
        candidates.push({
          id: first.id,
          title: first.title,
          topicId: first.topicId,
          topicTitle: topicById.get(first.topicId)?.title || 'Arrays & Hashing',
          type: 'revisit',
          badge: 'Mastery Review',
          reason: 'Library complete: deliberate foundational invariant revisit to maintain mastery',
          estimatedMinutes: first.estimatedMinutes || 20
        });
      } else {
        candidates.push({
          id: 'les_arrays_01',
          title: 'Dynamic Array Allocation & Geometry',
          topicId: 'topic_arrays',
          topicTitle: 'Arrays & Hashing',
          type: 'revisit',
          badge: 'Mastery Review',
          reason: 'Library complete: deliberate foundational invariant revisit to maintain mastery',
          estimatedMinutes: 20
        });
      }
    }

    return candidates;
  }, [catalog, latestAttempt, goal]);

  // Sync state on open
  useEffect(() => {
    if (!isOpen) {
      setStep('config');
      setPreview(null);
      setError(null);
    } else {
      if (goal?.availability) {
        setAvailability(goal.availability);
      }
      setSelectedItemIds(candidateActivities.map((c) => c.id));
    }
  }, [isOpen, goal, candidateActivities]);

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

  const totalWeeklyCapacity = Object.values(availability).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  const handleToggleActivity = (activityId) => {
    // Invalidate preview on selection change
    if (step === 'preview') {
      setStep('config');
      setPreview(null);
    }
    setSelectedItemIds((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleAvailabilityChange = (newAvail) => {
    // Invalidate preview on availability change
    if (step === 'preview') {
      setStep('config');
      setPreview(null);
    }
    setAvailability(newAvail);
  };

  const handleGeneratePreview = async () => {
    if (selectedItemIds.length === 0) {
      setError('Please select at least one study activity.');
      return;
    }
    if (totalWeeklyCapacity === 0) {
      setError('Weekly availability is 0 minutes. Please set at least one study day.');
      return;
    }

    setIsLoadingPreview(true);
    setError(null);

    const candidateMap = new Map(candidateActivities.map((c) => [c.id, c]));
    const revisitItemIds = selectedItemIds.filter((id) => candidateMap.get(id)?.type === 'revisit');

    try {
      const res = await apiService.previewContinuationPlan({
        expectedVersion: goal.version,
        availability,
        selectedItemIds,
        revisitItemIds
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

    const candidateMap = new Map(candidateActivities.map((c) => [c.id, c]));
    const revisitItemIds = (preview.selectedItemIds || selectedItemIds).filter(
      (id) => candidateMap.get(id)?.type === 'revisit'
    );

    try {
      const res = await apiService.applyContinuationPlan({
        expectedVersion: preview.baseVersion,
        previewForDate: preview.previewForDate,
        curriculumVersion: preview.curriculumVersion,
        availability,
        selectedItemIds: preview.selectedItemIds,
        revisitItemIds: preview.revisitItemIds || revisitItemIds,
        targetDate: preview.targetDate,
        previewToken: preview.previewToken
      });

      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        if (onPlanAccepted) onPlanAccepted(res.data.studyPlan);
        onClose();
      }
    } catch (err) {
      console.error('Apply continuation plan error:', err);
      if (err.status === 409) {
        setError('Schedule conflict: Activities, availability or date changed since preview. Please generate a fresh preview.');
        setStep('config');
        setPreview(null);
      } else {
        setError(err.message || 'Failed to apply continuation plan.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCandidates = candidateActivities.filter((c) => selectedItemIds.includes(c.id));
  const weekSessions = preview?.weekSessions || preview?.sessions?.filter((s) => s.date <= (preview?.horizonEndDate || '9999-99-99')) || [];
  const spilloverSessions = preview?.spilloverSessions || preview?.sessions?.filter((s) => s.date > (preview?.horizonEndDate || '9999-99-99')) || [];

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
              <span className="text-xs ui-text-muted">Capacity-aware 7-day proposal</span>
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
            /* ================= STEP 1: CONFIG & EDITABLE ACTIVITIES ================= */
            <div className="space-y-6">
              {/* Evidence-Based Context Box */}
              <div className="p-4 rounded-xl border ui-border-border ui-bg-soft/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold ui-text-ink uppercase tracking-wider">
                    Evidence Behind Your Plan
                  </span>
                </div>

                <div className="space-y-2 text-xs ui-text-muted">
                  {checkpointStatus === 'completed' && latestAttempt ? (
                    failedTopics.length > 0 ? (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">Targeted Revisit:</span>
                        <span>
                          Foundations checkpoint recommended review on{' '}
                          {failedTopics.map((t) => t.topicId.replace('topic_', '').replace(/_/g, ' ')).join(', ')}.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Proficient Foundations:</span>
                        <span>All evaluated checkpoint concepts achieved proficiency (100% score).</span>
                      </div>
                    )
                  ) : checkpointStatus === 'skipped' ? (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Self-Reported Progress:</span>
                      <span>Foundations checkpoint was skipped. Progression is based on completed starter missions without verified pattern comprehension.</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Unverified Starter Baseline:</span>
                      <span>Foundations checkpoint not yet completed. Self-reported starter progress; core pattern comprehension has not been independently verified.</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="font-semibold ui-text-ink">Next Frontier:</span>
                    <span>
                      Eligible curriculum progression into Two Pointers &amp; Sliding Window patterns
                      {selectedCandidates.length > 0 && ` (${selectedCandidates.map((c) => c.title).join(', ')})`}.
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Activities Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold ui-text-ink uppercase tracking-wider">
                    Select Next-Week Activities ({selectedItemIds.length} of {candidateActivities.length} selected)
                  </h3>
                  {selectedItemIds.length === 0 && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Select at least 1 activity
                    </span>
                  )}
                </div>

                <div className="space-y-2" role="group" aria-label="Candidate study activities">
                  {candidateActivities.map((cand) => {
                    const isSelected = selectedItemIds.includes(cand.id);
                    return (
                      <label
                        key={cand.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'ui-border-accent/40 ui-bg-soft/60'
                            : 'ui-border-border ui-bg-surface hover:ui-bg-soft/30 opacity-75'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleActivity(cand.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold ui-text-ink">{cand.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                cand.type === 'revisit'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              }`}
                            >
                              {cand.badge}
                            </span>
                            <span className="text-[11px] ui-text-muted flex items-center gap-1 ml-auto shrink-0">
                              <Clock className="w-3 h-3" />
                              {cand.estimatedMinutes}m
                            </span>
                          </div>
                          <p className="text-[11px] ui-text-muted mt-0.5 leading-relaxed">{cand.reason}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Availability Picker */}
              <div className="space-y-2">
                <AvailabilityPicker
                  value={availability}
                  onChange={handleAvailabilityChange}
                  disabled={isLoadingPreview}
                />
                {totalWeeklyCapacity === 0 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Weekly commitment is 0 minutes. Increase your daily availability to schedule study sessions.
                  </p>
                )}
              </div>

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
                  disabled={isLoadingPreview || selectedItemIds.length === 0 || totalWeeklyCapacity === 0}
                  className="primary-button text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isLoadingPreview ? 'Calculating schedule...' : 'Preview Next-Week Plan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : preview ? (
            /* ================= STEP 2: READ-ONLY 7-DAY PREVIEW ================= */
            <div className="space-y-6">
              {/* Plan Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1">
                  <span className="text-[10px] font-semibold ui-text-muted uppercase tracking-wider">Start Date</span>
                  <p className="text-xs sm:text-sm font-bold ui-text-ink">{preview.planStartDate} (IST)</p>
                </div>

                <div className="p-3 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1">
                  <span className="text-[10px] font-semibold ui-text-muted uppercase tracking-wider">Est. Finish</span>
                  <p className="text-xs sm:text-sm font-bold ui-text-ink">{preview.estimatedFinishDate || preview.horizonEndDate} (IST)</p>
                </div>

                <div className="p-3 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1">
                  <span className="text-[10px] font-semibold ui-text-muted uppercase tracking-wider">7-Day Horizon</span>
                  <p className="text-xs sm:text-sm font-bold ui-text-ink">{preview.horizonEndDate} (IST)</p>
                </div>

                <div className="p-3 rounded-xl border ui-border-border ui-bg-soft/30 space-y-1">
                  <span className="text-[10px] font-semibold ui-text-muted uppercase tracking-wider">Status</span>
                  <p
                    className={`text-xs sm:text-sm font-bold ${
                      preview.status === 'on_track'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {preview.status === 'on_track' ? 'On Track' : 'Over Capacity'}
                  </p>
                </div>
              </div>

              {/* Proposed Week Sessions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold ui-text-ink uppercase tracking-wider">
                    Planned Study Sessions ({weekSessions.length} sessions in 7-day horizon)
                  </h4>
                  <span className="text-xs ui-text-muted">
                    {weekSessions.reduce((acc, s) => acc + s.allocatedMinutes, 0)} mins total
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {weekSessions.length > 0 ? (
                    weekSessions.map((session, idx) => (
                      <div
                        key={`${session.itemId}-${session.date}-${idx}`}
                        className="p-3 rounded-xl border ui-border-border ui-bg-surface flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[11px] ui-text-muted px-2 py-0.5 rounded-md ui-bg-soft shrink-0">
                            {session.date}
                          </span>
                          <div className="min-w-0 truncate">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold ui-text-ink truncate">{session.title}</p>
                              {session.isRevisit && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                  Revisit
                                </span>
                              )}
                            </div>
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
                    ))
                  ) : (
                    <p className="text-xs ui-text-muted p-3 text-center">No sessions scheduled in this 7-day period.</p>
                  )}
                </div>
              </div>

              {/* Future Spillover Sessions if any */}
              {spilloverSessions.length > 0 && (
                <div className="space-y-3 pt-3 border-t ui-border-border">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Future Spillover Sessions ({spilloverSessions.length} beyond 7-day horizon)</span>
                    </h4>
                    <span className="text-xs font-mono">
                      {spilloverSessions.reduce((acc, s) => acc + s.allocatedMinutes, 0)} mins
                    </span>
                  </div>
                  <p className="text-xs ui-text-muted">
                    These sessions exceed your 7-day availability and will be scheduled in subsequent weeks.
                  </p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {spilloverSessions.map((session, idx) => (
                      <div
                        key={`spill-${session.itemId}-${session.date}-${idx}`}
                        className="p-2.5 rounded-xl border border-dashed ui-border-border ui-bg-soft/20 flex items-center justify-between gap-3 text-xs opacity-85"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] ui-text-muted px-1.5 py-0.5 rounded ui-bg-soft shrink-0">
                            {session.date}
                          </span>
                          <p className="font-medium ui-text-ink truncate">{session.title}</p>
                        </div>
                        <span className="font-mono text-[11px] ui-text-muted shrink-0">{session.allocatedMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unscheduled Warning if any */}
              {preview.unscheduledItemIds?.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-semibold">Items exceeding available capacity:</p>
                  <p className="mt-0.5">
                    {preview.unscheduledItemIds.length} item(s) could not be scheduled due to insufficient availability.
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
                  <span>Edit Activities &amp; Availability</span>
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
