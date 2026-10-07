import React, { useState } from 'react';
import {
  Bookmark,
  ArrowRight,
  SlidersHorizontal,
  X,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ResumePracticeCard({
  resumeContext,
  onResume,
  onDismiss,
  onToggleStatus,
  onAdjustTime,
  isSaving = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!resumeContext || !resumeContext.record) return null;

  const { record, mission, isActiveMission } = resumeContext;
  const isReady = record.selfReportedStatus === 'ready_to_continue';
  const assessment = record.assessment;

  const categoryLabels = {
    too_difficult: "I’m stuck",
    need_revision: "Help me revise",
    ready_to_continue: "Ready to practise"
  };

  const assessmentBadge = assessment ? (
    assessment.status === 'on_track' ? {
      label: 'On track',
      className: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
    } : assessment.status === 'needs_another_try' ? {
      label: 'Needs another try',
      className: 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30'
    } : {
      label: 'Coaching guidance available',
      className: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 border border-indigo-500/30'
    }
  ) : null;

  const previewSnippet = record.whereStuck || record.whatTried || '';

  return (
    <aside
      aria-label="Resume practice from saved context"
      className="rounded-2xl border ui-border-border ui-bg-surface p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in relative transition-all"
    >
      {/* Header row: compact by default */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ui-bg-soft ui-text-ink border ui-border-border">
              <Bookmark className="w-3 h-3 ui-text-ink shrink-0" />
              <span>Saved blocker notes</span>
            </span>

            {/* Mission ownership badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                isActiveMission
                  ? 'bg-blue-500/10 text-blue-800 dark:text-blue-200 border border-blue-500/30'
                  : 'bg-purple-500/10 text-purple-800 dark:text-purple-200 border border-purple-500/30'
              }`}
            >
              {isActiveMission
                ? `Active step: ${mission?.title || record.missionId}`
                : `Earlier step: ${mission?.title || record.missionId}`}
            </span>

            {record.category && (
              <span className="text-xs ui-text-muted">
                ({categoryLabels[record.category] || record.category})
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold ui-text-ink mt-1 truncate">
            {isActiveMission
              ? `Pick up where you left off on ${mission?.title || 'your practice'}`
              : `Review your earlier notes for ${mission?.title || record.missionId}`}
          </h3>

          {!isExpanded && previewSnippet && (
            <p className="text-xs ui-text-muted truncate max-w-xl">
              <span className="font-semibold ui-text-ink">Stuck on: </span>
              <span className="italic">"{previewSnippet}"</span>
            </p>
          )}
        </div>

        {/* Top-right controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="p-1.5 rounded-lg ui-text-muted hover:ui-text-ink hover:ui-bg-soft border border-transparent hover:ui-border-border transition-colors text-xs inline-flex items-center gap-1"
            title={isExpanded ? 'Collapse notes' : 'Expand full blocker notes'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Details</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onDismiss && onDismiss(record.missionId)}
            disabled={isSaving}
            className="p-1.5 rounded-lg ui-text-muted hover:ui-text-ink hover:ui-bg-soft border border-transparent hover:ui-border-border transition-colors text-xs inline-flex items-center gap-1"
            title="Dismiss reminder from dashboard (saved notes remain intact)"
            aria-label="Dismiss resume card"
          >
            <X className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only text-xs">Dismiss</span>
          </button>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="rounded-xl ui-bg-soft-a50 border ui-border-border-a50 p-3.5 space-y-2 text-xs sm:text-sm animate-fade-in">
          {record.whereStuck && (
            <div>
              <span className="font-semibold ui-text-ink">Where you got stuck: </span>
              <span className="ui-text-muted italic leading-relaxed">"{record.whereStuck}"</span>
            </div>
          )}

          {record.whatTried && (
            <div>
              <span className="font-semibold ui-text-ink">What you tried: </span>
              <span className="ui-text-muted italic leading-relaxed">"{record.whatTried}"</span>
            </div>
          )}

          {/* Latest understanding check feedback if available */}
          {assessment && (
            <div className="pt-2 border-t ui-border-border-a30 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold ui-text-ink">Latest understanding check:</span>
                {assessmentBadge && (
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${assessmentBadge.className}`}>
                    {assessmentBadge.label}
                  </span>
                )}
              </div>

              {assessment.explanation && (
                <p className="text-xs ui-text-muted leading-relaxed">
                  {assessment.explanation}
                </p>
              )}

              {assessment.nextStep && (
                <p className="text-xs ui-text-ink font-medium">
                  <span className="font-semibold">Recommended step: </span>
                  {assessment.nextStep}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action and status row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Self-reported status toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs ui-text-muted">Self-reported:</span>
          <button
            type="button"
            onClick={() => onToggleStatus && onToggleStatus(record.missionId, record.selfReportedStatus)}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isReady
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Click to toggle self-reported readiness"
          >
            {isReady ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to practise</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Still unsure</span>
              </>
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onAdjustTime && (
            <button
              type="button"
              onClick={onAdjustTime}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border text-xs font-semibold ui-text-ink transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 ui-text-ink" />
              <span>Adjust my study time</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ui-bg-accent ui-text-inverse text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <span>Continue practising</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
