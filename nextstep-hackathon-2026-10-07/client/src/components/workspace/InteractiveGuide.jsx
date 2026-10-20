import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  GUIDE_CHAPTERS,
  loadGuidePreferences,
  saveGuidePreferences
} from '../../services/guideService.js';

export default function InteractiveGuide({
  isOpen,
  onClose,
  user,
  activeView,
  onSelectView,
  initialChapter = 'start_learning',
  triggerRef = null
}) {
  const [activeChapterId, setActiveChapterId] = useState(initialChapter);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const guideDialogRef = useRef(null);
  const lastTriggerRef = useRef(null);

  const titleId = useId();
  const descId = useId();

  const chapter = GUIDE_CHAPTERS.find((c) => c.id === activeChapterId) || GUIDE_CHAPTERS[0];
  const step = chapter.steps[currentStepIdx] || chapter.steps[0];
  const totalSteps = chapter.steps.length;

  // Reset state on open or explicit initialChapter change (R2)
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIdx(0);
      setActiveChapterId(initialChapter || 'start_learning');
      setTargetMissing(false);
      setTargetRect(null);

      // Capture actual launching element
      if (triggerRef?.current) {
        lastTriggerRef.current = triggerRef.current;
      } else if (typeof document !== 'undefined' && document.activeElement && document.activeElement !== document.body) {
        lastTriggerRef.current = document.activeElement;
      }
    }
  }, [isOpen, initialChapter, triggerRef]);

  // Track target element location with bounding rect calculation (autoScroll only when explicitly requested)
  const updateTargetRect = useCallback((autoScroll = false) => {
    if (!isOpen || !step) return false;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
        setTargetMissing(false);

        // Only auto-scroll when step changes or explicitly requested, NEVER on user scroll event!
        if (autoScroll) {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          const availableHeight = isMobile ? window.innerHeight - 250 : window.innerHeight;

          const inView =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= availableHeight &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);

          if (!inView) {
            const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
          }
        }
        return true;
      }
    }
    setTargetRect(null);
    return false;
  }, [isOpen, step]);

  // If a step specifies a required mode, ensure view mode is matched (R1)
  const syncStepMode = useCallback(() => {
    if (!step?.mode) return;
    if (step.mode === 'trace') {
      const tryTab = document.querySelector('[data-guide="proof-try-tab"]');
      if (tryTab && tryTab.getAttribute('aria-selected') !== 'true') {
        tryTab.click();
      }
    } else if (step.mode === 'learn') {
      const learnTab = document.querySelector('[data-guide="proof-learn-tab"]');
      if (learnTab && learnTab.getAttribute('aria-selected') !== 'true') {
        learnTab.click();
      }
    }
  }, [step]);

  // Always attach and clean up geometry listeners (scroll, resize, mutation) even when target is immediate
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      setTargetMissing(false);
      return;
    }

    const onScrollOrResize = () => {
      // Synchronize geometry without fighting intentional user scrolling
      updateTargetRect(false);
    };

    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    syncStepMode();
    const found = updateTargetRect(true);

    let attempts = 0;
    let timerId = null;

    const poll = () => {
      syncStepMode();
      const foundNow = updateTargetRect(false);
      if (foundNow) return;

      if (attempts < 25) {
        attempts++;
        timerId = setTimeout(poll, 100);
      } else {
        setTargetMissing(true);
        // Continue slower periodic check while target is reported missing
        timerId = setTimeout(poll, 800);
      }
    };

    if (!found) {
      timerId = setTimeout(poll, 100);
    }

    // MutationObserver to catch asynchronously mounted elements instantly
    let observer = null;
    if (typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver(() => {
        syncStepMode();
        updateTargetRect(false);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isOpen, step, updateTargetRect, syncStepMode, activeView]);

  // Advance guide if user executes the primary activity on Step 2 directly (for curriculum proof lesson)
  useEffect(() => {
    if (isOpen && activeChapterId === 'start_learning' && currentStepIdx === 1 && activeView === 'proof') {
      setCurrentStepIdx(2);
    }
  }, [isOpen, activeChapterId, currentStepIdx, activeView]);

  // Close guide and restore focus to launching trigger or fallback (R2)
  const handleClose = useCallback(() => {
    onClose();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        const target = triggerRef?.current || lastTriggerRef.current;
        if (target && typeof target.focus === 'function' && document.body.contains(target)) {
          target.focus();
        } else {
          const fallback =
            document.querySelector('[data-guide="getting-started-trigger"]') ||
            document.querySelector('#view-today') ||
            document.querySelector('main');
          if (fallback && typeof fallback.focus === 'function') {
            if (!fallback.hasAttribute('tabindex')) fallback.setAttribute('tabindex', '-1');
            fallback.focus();
          }
        }
      });
    }
  }, [onClose, triggerRef]);

  // Handle Escape key to close guide and restore focus (R2)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // If a modal dialog opens from Step 2 (e.g. Checkpoint or Continuation Plan modal), close guide cleanly without overlap
  useEffect(() => {
    if (!isOpen) return;
    if (activeChapterId === 'start_learning' && currentStepIdx === 1) {
      const modal = document.querySelector('[role="dialog"]:not([data-guide="interactive-guide-dialog"])');
      if (modal) {
        const currentPrefs = loadGuidePreferences(user);
        const completed = new Set(currentPrefs.completedChapters || []);
        completed.add(activeChapterId);
        saveGuidePreferences(user, {
          ...currentPrefs,
          completedChapters: Array.from(completed)
        });
        handleClose();
      }
    }
  }, [isOpen, activeChapterId, currentStepIdx, user, handleClose]);

  // Branch Step 2 behavior and messaging by recommended activity type
  const primaryBtnEl = typeof document !== 'undefined'
    ? document.querySelector('[data-guide="today-primary-action-btn"]')
    : null;
  const primaryActionType = primaryBtnEl?.getAttribute('data-action-type') || 'proof';

  let stepTitle = step.title;
  let stepContent = step.content;

  if (activeChapterId === 'start_learning' && currentStepIdx === 1) {
    if (primaryActionType === 'checkpoint') {
      stepTitle = 'Start Foundations Checkpoint';
      stepContent = 'You completed the 12-mission Starter Track! Your recommended next step is Check My Foundations — a 10-minute conceptual check to personalize your curriculum roadmap. Clicking Next opens the Foundations Checkpoint and concludes this walkthrough.';
    } else if (primaryActionType === 'continuation_plan') {
      stepTitle = 'Build your study week';
      stepContent = 'Your recommended next step is to plan your study week. Clicking Next opens your weekly schedule and concludes this walkthrough.';
    } else if (primaryActionType === 'mission') {
      stepTitle = 'Start daily starter mission';
      stepContent = 'Your recommended activity is your daily Starter Track mission. Clicking Next opens the mission workspace and concludes this walkthrough.';
    } else if (primaryActionType === 'practice') {
      stepTitle = 'Start practice problem';
      stepContent = 'Your recommended next step is a curriculum practice problem. Clicking Next opens the Practice Library and concludes this walkthrough.';
    }
  }

  const handleNext = () => {
    // If advancing from Step 2 of start_learning:
    if (activeChapterId === 'start_learning' && currentStepIdx === 1) {
      const primaryBtn = document.querySelector('[data-guide="today-primary-action-btn"]');
      const actionType = primaryBtn?.getAttribute('data-action-type') || 'proof';

      // For non-lesson recommendations (checkpoint, planner, starter, practice):
      // Conclude the guide cleanly and open the real destination!
      if (actionType !== 'proof') {
        const currentPrefs = loadGuidePreferences(user);
        const completed = new Set(currentPrefs.completedChapters || []);
        completed.add(activeChapterId);
        saveGuidePreferences(user, {
          ...currentPrefs,
          completedChapters: Array.from(completed)
        });
        handleClose();
        if (primaryBtn) {
          primaryBtn.click();
        }
        return;
      }

      // For curriculum lesson:
      if (primaryBtn) {
        primaryBtn.click();
        setCurrentStepIdx(2);
        return;
      }
    }

    if (currentStepIdx < totalSteps - 1) {
      const nextIdx = currentStepIdx + 1;
      const nextStep = chapter.steps[nextIdx];
      if (nextStep.view && nextStep.view !== activeView && onSelectView) {
        onSelectView(nextStep.view);
      }
      setCurrentStepIdx(nextIdx);
    } else {
      // Completed chapter
      const currentPrefs = loadGuidePreferences(user);
      const completed = new Set(currentPrefs.completedChapters || []);
      completed.add(chapter.id);
      saveGuidePreferences(user, {
        ...currentPrefs,
        completedChapters: Array.from(completed)
      });
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      const prevStep = chapter.steps[prevIdx];
      if (prevStep.view && prevStep.view !== activeView && onSelectView) {
        onSelectView(prevStep.view);
      }
      setCurrentStepIdx(prevIdx);
    }
  };

  const handleSwitchChapter = (chapterId) => {
    setActiveChapterId(chapterId);
    setCurrentStepIdx(0);
    const targetChapter = GUIDE_CHAPTERS.find((c) => c.id === chapterId);
    if (targetChapter?.steps[0]?.view && targetChapter.steps[0].view !== activeView && onSelectView) {
      onSelectView(targetChapter.steps[0].view);
    }
  };

  const handleRetrySearch = () => {
    setTargetMissing(false);
    syncStepMode();
    const found = updateTargetRect(true);
    if (!found && step.view && step.view !== activeView && onSelectView) {
      onSelectView(step.view);
    }
  };

  if (!isOpen) {
    return (
      <div data-guide-active-step="closed" style={{ display: 'none' }} aria-hidden="true" />
    );
  }

  // Responsive callout placement
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  let desktopCalloutStyle = {};
  if (!isMobile && targetRect) {
    const dialogEstimatedHeight = 280;
    const dialogWidth = 360;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const showBelow = spaceBelow >= dialogEstimatedHeight || targetRect.top < dialogEstimatedHeight;

    let topPos = showBelow ? targetRect.bottom + 12 : targetRect.top - dialogEstimatedHeight - 12;
    // Constrain topPos so the dialog NEVER extends beyond the viewport top or bottom
    topPos = Math.max(16, Math.min(window.innerHeight - dialogEstimatedHeight - 16, topPos));
    const leftPos = Math.max(16, Math.min(window.innerWidth - dialogWidth - 16, targetRect.left));

    desktopCalloutStyle = {
      position: 'fixed',
      top: `${Math.round(topPos)}px`,
      left: `${Math.round(leftPos)}px`,
      width: `${dialogWidth}px`,
      maxHeight: `${window.innerHeight - 32}px`,
      overflowY: 'auto',
      zIndex: 60
    };
  }

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="interactive-guide-overlay"
      data-guide-active-step={currentStepIdx + 1}
    >
      {/* Screen-reader announcement for step changes (R2) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Chapter: ${chapter.title}. Step ${currentStepIdx + 1} of ${totalSteps}: ${stepTitle}. ${stepContent}`}
      </div>

      {/* Target element spotlight highlight (operable target through pointer-events: none) */}
      {targetRect && (
        <div
          className="guide-spotlight"
          style={{
            position: 'fixed',
            top: `${Math.max(0, targetRect.top - 4)}px`,
            left: `${Math.max(0, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 0 3px var(--accent, #10b981)',
            pointerEvents: 'none',
            zIndex: 50,
            transition: 'box-shadow 150ms ease-out'
          }}
          aria-hidden="true"
        />
      )}

      {/* Guide Dialog Callout */}
      <div
        ref={guideDialogRef}
        data-guide="interactive-guide-dialog"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={!isMobile && targetRect ? desktopCalloutStyle : undefined}
        className={
          isMobile
            ? 'fixed bottom-0 inset-x-0 z-[60] p-4 ui-bg-surface border-t ui-border-border rounded-t-2xl shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200'
            : !targetRect
            ? 'fixed top-20 right-6 z-[60] w-96 p-5 ui-bg-surface border ui-border-border rounded-2xl shadow-2xl space-y-3.5 animate-in fade-in duration-200'
            : 'p-4 sm:p-5 ui-bg-surface border ui-border-border rounded-2xl shadow-2xl space-y-3.5 animate-in fade-in duration-180'
        }
      >
        {/* Header with chapter selection, step counter, and close button */}
        <div className="flex items-center justify-between gap-2 border-b ui-border-border pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="p-1 rounded-lg ui-bg-accent/15 ui-text-accent shrink-0">
              <chapter.icon size={14} aria-hidden="true" />
            </span>
            <span className="text-xs font-bold ui-text-ink truncate">{chapter.title}</span>
            <span className="text-[11px] font-semibold ui-text-muted shrink-0">
              ({currentStepIdx + 1} of {totalSteps})
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg hover:ui-bg-soft ui-text-muted hover:ui-text-ink transition-colors"
              aria-label="Close walkthrough"
              title="Close walkthrough (Esc)"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Missing Target Fallback Notice (R1) */}
        {targetMissing && (
          <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 text-xs ui-text-muted space-y-1.5">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Step target is not on this screen
            </p>
            <p>
              This step focuses on <code>{step.view}</code> view.
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {step.view && step.view !== activeView && onSelectView ? (
                <button
                  type="button"
                  onClick={() => onSelectView(step.view)}
                  className="secondary-button text-xs py-1 px-2.5"
                >
                  Go to {step.view} view
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRetrySearch}
                  className="secondary-button text-xs py-1 px-2.5 inline-flex items-center gap-1"
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  <span>Retry finding target</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step Body */}
        <div className="space-y-1.5">
          <h3 id={titleId} className="text-sm font-extrabold ui-text-ink tracking-tight">
            {stepTitle}
          </h3>
          <p id={descId} className="text-xs ui-text-muted leading-relaxed">
            {stepContent}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t ui-border-border flex-wrap">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-semibold ui-text-muted hover:ui-text-ink px-2 py-1"
          >
            Skip guide
          </button>

          <div className="flex items-center gap-2">
            {currentStepIdx > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="secondary-button text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="primary-button text-xs py-1.5 px-3.5 inline-flex items-center gap-1"
            >
              <span>{currentStepIdx === totalSteps - 1 ? 'Finish' : 'Next'}</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Quick Chapter Switcher */}
        <div className="pt-2 border-t ui-border-border flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="ui-text-muted font-medium shrink-0">Chapters:</span>
          {GUIDE_CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleSwitchChapter(ch.id)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap font-semibold transition-colors ${
                ch.id === activeChapterId
                  ? 'ui-bg-accent/15 ui-text-accent'
                  : 'ui-bg-soft/70 ui-text-muted hover:ui-text-ink'
              }`}
            >
              {ch.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
