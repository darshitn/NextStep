import React from 'react';
import { localDay } from '../services/activity.js';
import { CheckCircle2, ExternalLink, Sparkles, Clock, Check, Calendar } from 'lucide-react';

export default function MissionCard({
  mission,
  isCurrent = false,
  isCompleted = false,
  completionData = null,
  scheduledDate = null,
  onComplete,
  onOpenGuidance
}) {
  if (!mission) return null;

  return (
    <div
      className={`rounded-2xl transition-all border ${
        isCurrent
          ? 'glass-panel ui-border-border-a50 shadow-glow ring-1 ring-brand-500/30'
          : isCompleted
          ? 'glass-card ui-border-border-a20 ui-bg-soft'
          : 'glass-card ui-border-border opacity-80 hover:opacity-100'
      } p-5 sm:p-6`}
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b ui-border-border">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg ui-bg-surface border ui-border-border flex items-center justify-center font-mono font-bold text-xs ui-text-ink">
            {mission.id.toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg ui-text-ink">
                {mission.title}
              </h3>
              {isCurrent && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ui-bg-soft-a20 ui-text-ink rounded-full border ui-border-border-a40">
                  {scheduledDate === localDay() ? "Today's mission" : scheduledDate < localDay() ? 'Ready to resume' : 'Start early if you like'}
                </span>
              )}
              {isCompleted && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ui-bg-soft-a20 ui-text-ink rounded-full border ui-border-border-a40 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            {scheduledDate && (
              <p className="text-xs ui-text-muted mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 ui-text-muted" />
                Scheduled: <span className="ui-text-ink font-medium">{scheduledDate}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ui-bg-soft-a80 border ui-border-border text-xs ui-text-muted">
            <Clock className="w-3.5 h-3.5 ui-text-ink" />
            {mission.minutes} min session
          </span>
        </div>
      </div>

      {/* Purpose / Why */}
      <div className="mb-4">
        <p className="text-xs font-semibold ui-text-muted uppercase tracking-wider mb-1">Why this matters</p>
        <p className="text-sm ui-text-ink leading-relaxed">{mission.why}</p>
      </div>

      {/* Concrete Steps */}
      <div className="mb-4 ui-bg-soft-a40 rounded-xl p-3.5 border ui-border-border">
        <p className="text-xs font-semibold ui-text-muted uppercase tracking-wider mb-2">Practice Steps</p>
        <ol className="space-y-1.5 text-xs ui-text-ink list-decimal list-inside">
          {mission.steps.map((step, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              <span className="ui-text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Done When Criteria & External Resource */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
        <div className="ui-text-muted">
          <span className="font-semibold ui-text-ink">Done when:</span> {mission.doneWhen}
        </div>

        {mission.resourceUrl && (
          <a
            href={mission.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 ui-text-ink hover:ui-text-ink hover:underline shrink-0"
          >
            <span>{mission.resourceLabel || 'Practice Resource'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Completion info (if completed) */}
      {isCompleted && completionData && (
        <div className="mt-4 pt-3 border-t ui-border-border ui-bg-soft-a50 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between ui-text-muted mb-1">
            <span className="font-medium ui-text-ink">
              Completed {completionData.outcome === 'independent' ? '✓ Independent' : '⚡ With Hint'}
            </span>
            <span className="text-[11px] ui-text-muted">
              {new Date(completionData.completedAt).toLocaleDateString()}
            </span>
          </div>
          {completionData.reflection && (
            <p className="ui-text-ink italic mt-1 ui-bg-soft-a60 p-2 rounded border ui-border-border">
              "{completionData.reflection}"
            </p>
          )}
        </div>
      )}

      {/* Interactive Actions for Active Mission */}
      {isCurrent && !isCompleted && (
        <div className="mt-5 pt-4 border-t ui-border-border flex flex-col sm:flex-row items-center justify-end gap-3">
          {onComplete && (
            <button
              type="button"
              onClick={() => onComplete(mission)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border text-xs sm:text-sm font-semibold ui-text-ink hover:ui-text-ink transition-all shadow-sm order-2 sm:order-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record completion</span>
            </button>
          )}

          {onOpenGuidance && (
            <button
              type="button"
              onClick={() => onOpenGuidance(mission)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl ui-bg-accent hover:opacity-90 text-xs sm:text-sm font-semibold ui-text-inverse transition-all shadow-glow hover:shadow-lg order-1 sm:order-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start practising</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
