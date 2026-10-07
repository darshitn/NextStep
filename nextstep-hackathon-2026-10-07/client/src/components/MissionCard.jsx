import React from 'react';
import { localDay } from '../services/activity.js';
import { CheckCircle2, ExternalLink, HelpCircle, Sparkles, Clock, Check, Calendar, ArrowRight } from 'lucide-react';

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
          ? 'glass-panel border-brand-500/50 shadow-glow ring-1 ring-brand-500/30'
          : isCompleted
          ? 'glass-card border-emerald-500/20 bg-emerald-950/10'
          : 'glass-card border-slate-800/80 opacity-80 hover:opacity-100'
      } p-5 sm:p-6`}
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-surface-100 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-xs text-brand-300">
            {mission.id.toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white">
                {mission.title}
              </h3>
              {isCurrent && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/40">
                  {scheduledDate === localDay() ? "Today's mission" : scheduledDate < localDay() ? 'Ready to resume' : 'Start early if you like'}
                </span>
              )}
              {isCompleted && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            {scheduledDate && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                Scheduled: <span className="text-slate-300 font-medium">{scheduledDate}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-200/80 border border-slate-800 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {mission.minutes} min session
          </span>
        </div>
      </div>

      {/* Purpose / Why */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Why this matters</p>
        <p className="text-sm text-slate-300 leading-relaxed">{mission.why}</p>
      </div>

      {/* Concrete Steps */}
      <div className="mb-4 bg-surface-200/40 rounded-xl p-3.5 border border-slate-800/60">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Practice Steps</p>
        <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
          {mission.steps.map((step, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              <span className="text-slate-200">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Done When Criteria & External Resource */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
        <div className="text-slate-400">
          <span className="font-semibold text-slate-300">Done when:</span> {mission.doneWhen}
        </div>

        {mission.resourceUrl && (
          <a
            href={mission.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-brand-400 hover:text-brand-300 hover:underline shrink-0"
          >
            <span>{mission.resourceLabel || 'Practice Resource'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Completion info (if completed) */}
      {isCompleted && completionData && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 bg-surface-200/50 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-medium text-emerald-400">
              Completed {completionData.outcome === 'independent' ? '✓ Independent' : '⚡ With Hint'}
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date(completionData.completedAt).toLocaleDateString()}
            </span>
          </div>
          {completionData.reflection && (
            <p className="text-slate-300 italic mt-1 bg-surface-300/60 p-2 rounded border border-slate-800">
              "{completionData.reflection}"
            </p>
          )}
        </div>
      )}

      {/* Interactive Actions for Active Mission */}
      {isCurrent && !isCompleted && (
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          {onOpenGuidance && (
            <button
              onClick={() => onOpenGuidance(mission)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700/60 text-xs sm:text-sm font-semibold text-brand-300 hover:text-brand-200 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Get AI Guidance</span>
            </button>
          )}

          {onComplete && (
            <button
              onClick={() => onComplete(mission)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-xs sm:text-sm font-semibold text-white transition-all shadow-glow hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Completion</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
