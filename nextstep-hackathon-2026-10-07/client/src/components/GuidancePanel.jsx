import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Save,
  Send,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import DuplicateTrace from './DuplicateTrace.jsx';

const CATEGORIES = [
  {
    id: 'too_difficult',
    label: 'I’m stuck',
    description: 'Stuck on concepts or cannot figure out where to begin'
  },
  {
    id: 'need_revision',
    label: 'Help me revise',
    description: 'Forgot prerequisite ideas like pointers, sets, or hashing'
  },
  {
    id: 'ready_to_continue',
    label: 'Ready to practise',
    description: 'Understand the concept, looking for effective practice tips'
  }
];

const CURATED_MISSION_IDS = ['m02', 'm04', 'm06'];

const GuidancePanel = forwardRef(function GuidancePanel({
  mission,
  guidanceData = null,
  savedContext = null,
  onRequestGuidance,
  onSaveContext,
  onSubmitCheck,
  onClose,
  isLoading = false,
  isSavingContext = false,
  isSubmittingCheck = false,
  error = null,
  assessmentError = null
}, ref) {
  const isCuratedMission = CURATED_MISSION_IDS.includes(mission.id);

  // Active mission tracking
  const [activeMissionId, setActiveMissionId] = useState(mission.id);

  // Accessibility & scroll refs
  const panelHeadingRef = useRef(null);
  const checkQuestionRef = useRef(null);
  const pendingLeaveRef = useRef(null);

  // Blocker fields
  const [selectedCategory, setSelectedCategory] = useState(
    savedContext?.category || 'too_difficult'
  );
  const [whatTried, setWhatTried] = useState(savedContext?.whatTried || '');
  const [whereStuck, setWhereStuck] = useState(savedContext?.whereStuck || '');
  const [selfReportedStatus, setSelfReportedStatus] = useState(
    savedContext?.selfReportedStatus || 'still_unsure'
  );
  const [savedSuccessNotice, setSavedSuccessNotice] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Understanding check answer field
  const [answer, setAnswer] = useState(savedContext?.assessment?.answer || '');
  const [localAssessment, setLocalAssessment] = useState(savedContext?.assessment || null);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);

  // Check if student has modified uncommitted blocker draft
  const hasUnsavedBlocker =
    (whatTried.trim() !== (savedContext?.whatTried || '').trim()) ||
    (whereStuck.trim() !== (savedContext?.whereStuck || '').trim()) ||
    (selectedCategory !== (savedContext?.category || 'too_difficult'));

  const focusHeading = () => {
    const heading = panelHeadingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const requestLeave = action => {
    pendingLeaveRef.current = action;
    if (hasUnsavedBlocker) setShowCloseConfirm(true);
    else action?.();
  };
  useImperativeHandle(ref, () => ({ requestLeave, focusHeading }));

  // Scroll to heading when opened / mission changes (respecting reduced motion)
  useEffect(() => { focusHeading(); }, [mission.id]);

  const handleScrollToCheck = () => {
    if (checkQuestionRef.current) {
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      checkQuestionRef.current.focus({ preventScroll: true });
      checkQuestionRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  };

  // Safe close handling
  const handleAttemptClose = () => requestLeave(onClose);

  const handleSaveAndClose = async () => {
    const success = await handleExplicitSave();
    if (success) {
      setShowCloseConfirm(false);
      pendingLeaveRef.current?.();
    }
  };

  const handleDiscardAndClose = () => {
    setWhatTried(savedContext?.whatTried || '');
    setWhereStuck(savedContext?.whereStuck || '');
    setSelectedCategory(savedContext?.category || 'too_difficult');
    setShowCloseConfirm(false);
    pendingLeaveRef.current?.();
  };

  // Mission switching: cleanly reset state to the new mission's savedContext (do not leak prior mission drafts)
  useEffect(() => {
    if (mission.id !== activeMissionId) {
      setActiveMissionId(mission.id);
      setSelectedCategory(savedContext?.category || 'too_difficult');
      setWhatTried(savedContext?.whatTried || '');
      setWhereStuck(savedContext?.whereStuck || '');
      setSelfReportedStatus(savedContext?.selfReportedStatus || 'still_unsure');
      setAnswer(savedContext?.assessment?.answer || '');
      setLocalAssessment(savedContext?.assessment || null);
      setSavedSuccessNotice('');
      setShowCloseConfirm(false);
      setIsEditingAnswer(false);
    }
  }, [mission.id, activeMissionId, savedContext]);

  // Sync assessment if updated externally for the SAME mission (does NOT overwrite unsaved blocker drafts)
  useEffect(() => {
    if (mission.id === activeMissionId && savedContext) {
      if (savedContext.assessment) {
        setLocalAssessment(savedContext.assessment);
      }
    }
  }, [savedContext, mission.id, activeMissionId]);

  // Handle explicit save of blocker context
  const handleExplicitSave = async () => {
    if (!onSaveContext || isSavingContext || isSubmittingCheck || isLoading) return false;
    setSavedSuccessNotice('');
    try {
      await onSaveContext({
        missionId: mission.id,
        category: selectedCategory,
        whatTried: whatTried.trim(),
        whereStuck: whereStuck.trim(),
        selfReportedStatus,
        guidance: guidanceData || savedContext?.guidance || null
      });
      setSavedSuccessNotice('Practice notes saved. You can return to them later.');
      setTimeout(() => setSavedSuccessNotice(''), 4000);
      return true;
    } catch {
      // Failed save: clear notice so no false success is shown
      setSavedSuccessNotice('');
      return false;
    }
  };

  // Handle guidance request
  const handleGenerateGuidance = (e) => {
    if (e) e.preventDefault();
    if (isLoading || isSavingContext || isSubmittingCheck) return;
    onRequestGuidance({
      missionId: mission.id,
      category: selectedCategory,
      whatTried: whatTried.trim(),
      whereStuck: whereStuck.trim(),
      feedback: whereStuck.trim() || whatTried.trim()
    });
  };

  // Handle understanding check submission
  const handleSubmitCheck = async (e) => {
    if (e) e.preventDefault();
    if (!onSubmitCheck || !answer.trim() || isSubmittingCheck || isSavingContext) return;

    const questionId = guidanceData?.questionId || savedContext?.guidance?.questionId || (
      mission.id === 'm02' ? 'q_m02_trace_search' :
      mission.id === 'm04' ? 'q_m04_duplicate_set' :
      mission.id === 'm06' ? 'q_m06_hash_map_twosum' : null
    );

    if (!questionId) return;

    try {
      const result = await onSubmitCheck({
        missionId: mission.id,
        questionId,
        answer: answer.trim(),
        selfReportedStatus
      });
      if (result?.assessment) {
        setLocalAssessment(result.assessment);
        setIsEditingAnswer(false);
      }
    } catch {
      // Error handled by parent; answer preserved
    }
  };

  // Toggle self-reported status
  const handleStatusToggle = async (newStatus) => {
    if (isSavingContext || isSubmittingCheck) return;
    const prevStatus = selfReportedStatus;
    setSelfReportedStatus(newStatus);
    if (onSaveContext) {
      try {
        await onSaveContext({
          missionId: mission.id,
          category: selectedCategory,
          whatTried: whatTried.trim(),
          whereStuck: whereStuck.trim(),
          selfReportedStatus: newStatus,
          guidance: guidanceData || savedContext?.guidance || null
        });
      } catch {
        // Revert on failure to distinguish pending/failed saves from persisted success
        setSelfReportedStatus(prevStatus);
      }
    }
  };

  const modeBadges = {
    standard_practice: { label: 'Standard Practice', color: 'ui-bg-soft ui-text-ink border ui-border-border' },
    guided_practice: { label: 'Guided Practice', color: 'ui-bg-soft ui-text-ink border ui-border-border' },
    revision_first: { label: 'Revision First', color: 'ui-bg-soft ui-text-ink border ui-border-border' }
  };

  const assessmentBadges = {
    on_track: { label: 'On Track', color: 'status-success' },
    needs_another_try: { label: 'Needs Another Try', color: 'status-attention' },
    uncertain: { label: 'Uncertain / Clarify', color: 'status-neutral' }
  };

  const curatedCheckQuestion = isCuratedMission && mission.id === 'm02'
    ? 'Trace a linear search for target 8 in [4, 1, 8, 3]. How many comparisons are made, and what is the worst-case number of comparisons if the target is absent?'
    : isCuratedMission && mission.id === 'm04'
    ? 'Trace a set-based duplicate check on [2, 5, 2]. At which index is the duplicate detected, and what numbers are in the set immediately before it is detected?'
    : isCuratedMission && mission.id === 'm06'
    ? 'For Two Sum with target 9 and array [2, 7, 11, 15], when inspecting 7, what key does the hash map look up, and why is 7 not added before the check?'
    : null;

  const displayedQuestion = guidanceData?.checkQuestion ||
    guidanceData?.questionText ||
    savedContext?.guidance?.checkQuestion ||
    savedContext?.guidance?.questionText ||
    curatedCheckQuestion ||
    null;

  return (
    <div className="practice-workspace" aria-label="Practice workspace">
      {/* Close button with draft protection */}
      {onClose && (
        <button
          onClick={handleAttemptClose}
          className="absolute top-4 right-4 ui-text-muted hover:ui-text-ink transition-colors p-1"
          aria-label="Close practice panel"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div ref={panelHeadingRef} tabIndex={-1} className="practice-heading">
        <div className="w-8 h-8 rounded-xl ui-bg-accent flex items-center justify-center ui-text-inverse shadow-glow">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg ui-text-ink">
              Practice workspace
            </h3>
            {isCuratedMission && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold ui-bg-soft ui-text-ink border ui-border-border">
                Curated Check
              </span>
            )}
          </div>
          <p className="text-xs ui-text-muted">
            <span className="ui-text-ink font-semibold">{mission.title}</span> · 30-minute session
          </p>
        </div>
      </div>

      {/* Unsaved draft protection alert dialog */}
      {showCloseConfirm && (
        <div className="p-4 rounded-xl status-attention text-sm space-y-2 mb-4 animate-fade-in" role="alert">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>You have unsaved blocker notes</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Closing now without saving will discard your typed changes.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveAndClose}
              disabled={isSavingContext}
              className="px-3 py-1.5 rounded-lg ui-bg-accent ui-text-inverse font-semibold text-xs shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {isSavingContext ? 'Saving...' : 'Save and close'}
            </button>
            <button
              type="button"
              onClick={() => setShowCloseConfirm(false)}
              className="px-3 py-1.5 rounded-lg border ui-border-border ui-bg-surface hover:ui-bg-soft font-semibold text-xs ui-text-ink"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={handleDiscardAndClose}
              className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:underline font-semibold text-xs"
            >
              Discard changes
            </button>
          </div>
        </div>
      )}

      {/* Guidance error notice */}
      {error && (
        <div role="status" className="p-3.5 rounded-xl ui-bg-soft border ui-border-border text-xs ui-text-ink flex items-start gap-2.5 mb-4 shadow-sm">
          <AlertCircle className="w-4 h-4 ui-text-ink shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold ui-text-ink">
                AI Guidance Notice
              </span>
              {typeof error === 'object' && error.code && (
                <span className="px-1.5 py-0.5 font-mono text-[10px] ui-bg-surface ui-text-ink rounded border ui-border-border">
                  {error.code}
                </span>
              )}
            </div>
            <p className="ui-text-muted leading-relaxed">
              {typeof error === 'string' ? error : error.message || 'AI guidance service is currently unavailable.'}
            </p>
          </div>
        </div>
      )}

      {/* Assessment error notice */}
      {assessmentError && (
        <div role="status" className="p-3.5 rounded-xl ui-bg-soft border ui-border-border text-xs ui-text-ink flex items-start gap-2.5 mb-4 shadow-sm">
          <AlertCircle className="w-4 h-4 ui-text-ink shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold ui-text-ink">
                Assessment Notice
              </span>
              {typeof assessmentError === 'object' && assessmentError.code && (
                <span className="px-1.5 py-0.5 font-mono text-[10px] ui-bg-surface ui-text-ink rounded border ui-border-border">
                  {assessmentError.code}
                </span>
              )}
            </div>
            <p className="ui-text-muted leading-relaxed">
              {typeof assessmentError === 'string' ? assessmentError : assessmentError.message || 'Could not assess your answer. Your answer is preserved.'}
            </p>
          </div>
        </div>
      )}

      {/* Save Success Notice */}
      {savedSuccessNotice && (
        <div role="status" aria-live="polite" className="p-3 rounded-xl status-success text-sm flex items-center gap-2 mb-4 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{savedSuccessNotice}</span>
        </div>
      )}

      <div className="practice-columns">
        <div className="practice-main">
      {/* --- Interactive Step-by-Step Duplicate Trace for Mission M04 --- */}
      {mission.id === 'm04' && (
        <DuplicateTrace onProceedToCheck={handleScrollToCheck} />
      )}

      {/* --- Section C: Check My Understanding (Curated AI Assessment & Self-Report) --- */}
      {displayedQuestion && (
        <div ref={checkQuestionRef} tabIndex={-1} className="space-y-3 pt-4 border-t ui-border-border mt-4 focus:outline-none">
          <div className="p-3.5 rounded-xl ui-bg-soft border ui-border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 ui-text-ink text-xs font-semibold">
                <HelpCircle className="w-4 h-4 ui-text-ink" />
                <span>Quick Check For Understanding</span>
              </div>
              {isCuratedMission && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full status-badge status-accent">
                  Reasoning check
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm ui-text-ink italic pl-6">
              "{displayedQuestion}"
            </p>
          </div>

          {/* Curated Mission Answer Form & Assessment Feedback */}
          {isCuratedMission ? (
            <div className="space-y-3">
              {/* Show Assessment Results if available and not actively editing */}
              {localAssessment && !isEditingAnswer ? (
                <div className="p-3.5 rounded-xl border ui-border-border ui-bg-surface space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold ui-text-muted">Assessment:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${assessmentBadges[localAssessment.status]?.color || assessmentBadges.uncertain.color}`}>
                        {assessmentBadges[localAssessment.status]?.label || localAssessment.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono ui-text-muted">
                      Source: {localAssessment.source || 'gemini'}
                    </span>
                  </div>

                  <div className="text-xs ui-text-ink space-y-1">
                    <p className="font-semibold">Coaching Feedback:</p>
                    <p className="ui-text-muted leading-relaxed pl-2 border-l-2 ui-border-border">
                      {localAssessment.explanation}
                    </p>
                  </div>

                  {localAssessment.nextStep && (
                    <div className="text-xs ui-text-ink space-y-1">
                      <p className="font-semibold">Next Step:</p>
                      <p className="ui-text-muted leading-relaxed pl-2 border-l-2 ui-border-border">
                        {localAssessment.nextStep}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t ui-border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setIsEditingAnswer(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold ui-text-ink hover:underline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refine Answer & Try Again</span>
                    </button>
                    <span className="text-[10px] ui-text-muted italic">
                      Feedback helps you practise; it does not complete the mission.
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitCheck} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="curated-check-answer" className="text-xs font-semibold uppercase tracking-wider ui-text-ink">
                      Explain your reasoning
                    </label>
                    <span className={`text-[10px] ${answer.length > 1000 ? 'text-rose-500 font-bold' : 'ui-text-muted'}`}>
                      {answer.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="curated-check-answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Explain your reasoning and when the algorithm stops."
                    maxLength={1000}
                    rows={3}
                    required
                    className="w-full rounded-xl p-3 text-xs sm:text-sm ui-text-ink ui-bg-surface border ui-border-border focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] ui-text-muted italic">
                      Coaching feedback only. Your mission stays open until you record completion.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmittingCheck || isSavingContext || isLoading || !answer.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ui-bg-accent hover:opacity-90 ui-text-inverse font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingCheck ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Assessing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Check my reasoning</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <p className="text-[11px] ui-text-muted italic">
              Use this question to reflect on your approach before recording completion.
            </p>
          )}

          {/* Self-reported State Controls (Section 3.B) */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t ui-border-border text-xs">
            <span className="ui-text-muted font-medium">Your current feeling:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStatusToggle('still_unsure')}
                disabled={isSavingContext || isSubmittingCheck || isLoading}
                className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
                  selfReportedStatus === 'still_unsure'
                    ? 'ui-bg-soft ui-text-ink border-2 ui-border-border font-bold'
                    : 'ui-bg-surface ui-text-muted border ui-border-border hover:ui-text-ink'
                }`}
              >
                Still Unsure
              </button>
              <button
                type="button"
                onClick={() => handleStatusToggle('ready_to_continue')}
                disabled={isSavingContext || isSubmittingCheck || isLoading}
                className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
                  selfReportedStatus === 'ready_to_continue'
                    ? 'ui-bg-soft ui-text-ink border-2 ui-border-border font-bold'
                    : 'ui-bg-surface ui-text-muted border ui-border-border hover:ui-text-ink'
                }`}
              >
                Ready to Continue
              </button>
            </div>
          </div>
        </div>
      )}

          {!displayedQuestion && mission.id !== 'm04' && <p className="practice-intro">Work through the steps in your mission. Use the notes alongside to capture what you tried and get guidance.</p>}
        </div>
        <div className="practice-support"><h4 className="support-heading">Guidance &amp; your notes</h4>
      {/* --- Section A: Explain My Blocker Form --- */}
      <div className="blocker-form space-y-4 pb-4 border-b ui-border-border">
        <div>
          <label id="difficulty-category-label" className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-2">
            How can we help?
          </label>
          <div className="blocker-categories" role="group" aria-labelledby="difficulty-category-label">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  selectedCategory === cat.id
                    ? 'ui-bg-soft border-2 ui-border-border ui-text-ink shadow-sm'
                    : 'ui-bg-surface border ui-border-border ui-text-muted hover:ui-text-ink'
                }`}
              >
                <span className="font-semibold text-xs block mb-0.5">{cat.label}</span>
                <span className="text-[10px] ui-text-muted block leading-tight">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Two Bounded Blocker Fields */}
        <div className="blocker-fields">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="blocker-what-tried" className="text-xs font-semibold uppercase tracking-wider ui-text-ink">
                1. What have you tried?
              </label>
              <span className={`text-[10px] ${whatTried.length > 280 ? 'text-rose-500 font-bold' : 'ui-text-muted'}`}>
                {whatTried.length}/280
              </span>
            </div>
            <textarea
              id="blocker-what-tried"
              value={whatTried}
              onChange={(e) => setWhatTried(e.target.value)}
              placeholder="e.g. 'I traced the loop with 3 items on paper...'"
              maxLength={280}
              rows={2}
              className="w-full rounded-xl p-3 text-xs ui-text-ink ui-bg-surface border ui-border-border focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="blocker-where-stuck" className="text-xs font-semibold uppercase tracking-wider ui-text-ink">
                2. Where are you stuck?
              </label>
              <span className={`text-[10px] ${whereStuck.length > 280 ? 'text-rose-500 font-bold' : 'ui-text-muted'}`}>
                {whereStuck.length}/280
              </span>
            </div>
            <textarea
              id="blocker-where-stuck"
              value={whereStuck}
              onChange={(e) => setWhereStuck(e.target.value)}
              placeholder="e.g. 'I do not understand why the count increases when absent...'"
              maxLength={280}
              rows={2}
              className="w-full rounded-xl p-3 text-xs ui-text-ink ui-bg-surface border ui-border-border focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Blocker Action Row */}
        <div className="blocker-actions flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExplicitSave}
              disabled={isSavingContext || isSubmittingCheck || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ui-border-border ui-bg-surface hover:ui-bg-soft text-xs ui-text-ink font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingContext ? 'Saving...' : 'Save my notes'}</span>
            </button>
            <span className="text-[10px] ui-text-muted">
              {savedContext?.updatedAt ? `Saved ${new Date(savedContext.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Save notes to return to them later'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerateGuidance}
            disabled={isLoading || isSavingContext || isSubmittingCheck}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl ui-bg-accent hover:opacity-90 ui-text-inverse font-semibold text-xs sm:text-sm transition-colors shadow-glow disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing your guidance…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Help me get unstuck</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* --- Section B: Render Guidance Steps --- */}
      {guidanceData && (
        <div className="space-y-4 pt-4 animate-fade-in">
          {/* Mode Pill & Source */}
          <div className="flex items-center justify-between pb-2 border-b ui-border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold ui-text-muted uppercase tracking-wider">Approach Mode:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${modeBadges[guidanceData.mode]?.color || modeBadges.standard_practice.color}`}>
                {modeBadges[guidanceData.mode]?.label || guidanceData.mode}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded ui-bg-soft ui-text-muted border ui-border-border">
              Source: {guidanceData.source || 'gemini'}
            </span>
          </div>

          {/* Explanation */}
          <div className="ui-bg-soft rounded-xl p-3.5 border ui-border-border">
            <p className="text-xs font-semibold ui-text-ink uppercase tracking-wider mb-1">
              Personalized Approach
            </p>
            <p className="text-xs sm:text-sm ui-text-ink leading-relaxed">
              {guidanceData.explanation}
            </p>
          </div>

          {/* Micro-steps */}
          <div>
            <p className="text-xs font-semibold ui-text-ink uppercase tracking-wider mb-2">
              Your practice steps
            </p>
            <div className="space-y-2">
              {guidanceData.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg ui-bg-surface border ui-border-border text-xs">
                  <span className="w-5 h-5 rounded-full ui-bg-soft ui-text-ink flex items-center justify-center font-bold shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="ui-text-ink leading-relaxed pt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
      {/* Action Footer */}
      <div className="flex justify-between items-center pt-4 border-t ui-border-border mt-4 text-xs">
        <button
          onClick={handleAttemptClose}
          className="px-4 py-1.5 rounded-lg ui-bg-surface hover:ui-bg-soft ui-text-ink text-xs font-medium border ui-border-border transition-colors"
        >
          Close practice
        </button>
      </div>
    </div>
  );
});
export default GuidancePanel;
