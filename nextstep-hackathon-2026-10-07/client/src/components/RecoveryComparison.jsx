import React, { useState } from 'react';
import { Calendar, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, X } from 'lucide-react';
import AvailabilityPicker from './AvailabilityPicker.jsx';

export default function RecoveryComparison({
  goal,
  onApplyRecovery,
  onCancel,
  onPreviewRecovery,
  previewData = null,
  isApplying = false,
  isPreviewing = false,
  error = null
}) {
  const [proposedAvailability, setProposedAvailability] = useState(
    goal.availability || { mon: 30, tue: 0, wed: 30, thu: 0, fri: 30, sat: 0, sun: 0 }
  );

  const handleGeneratePreview = (e) => {
    e.preventDefault();
    onPreviewRecovery(proposedAvailability);
  };

  const handleApply = () => {
    if (!previewData) return;
    onApplyRecovery(proposedAvailability, previewData.previewForDate);
  };

  const completedCount = Object.keys(goal.completions || {}).length;

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass space-y-6 recovery-comparison">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ui-border-border">
        <div>
          <h2 className="text-xl font-bold ui-text-ink tracking-tight flex items-center gap-2">
            <span>Your week changed? Let’s make room.</span>
          </h2>
          <p className="text-xs sm:text-sm ui-text-muted mt-1">
            Adjust your available time. Your completed practice stays.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ui-bg-surface border ui-border-border text-xs ui-text-ink self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 ui-text-ink" />
          <span>{completedCount} completed missions preserved</span>
        </div>
      </div>

      {/* Form: Propose New Weekly Availability */}
      <div className="space-y-4">
        <AvailabilityPicker
          value={proposedAvailability}
          onChange={setProposedAvailability}
          disabled={isPreviewing || isApplying}
        />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={isPreviewing || isApplying}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ui-bg-accent hover:ui-bg-accent ui-text-inverse font-semibold text-xs sm:text-sm transition-colors shadow-glow disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPreviewing ? 'animate-spin' : ''}`} />
            <span>{isPreviewing ? 'Calculating Schedule...' : 'Preview Revised Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side Preview (if generated) */}
      {previewData && (
        <div className="pt-4 border-t ui-border-border space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider ui-text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 ui-text-ink" />
              <span>Before & After Comparison</span>
            </h3>
            <span className="text-xs ui-text-muted">
              Preview for date: <span className="font-mono ui-text-ink">{previewData.previewForDate}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan Card */}
            <div className="p-4 rounded-xl ui-bg-soft-a50 border ui-border-border space-y-3">
              <span className="text-xs font-bold uppercase ui-text-muted tracking-wider block">
                Current Plan
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="ui-text-muted">Est. Finish Date:</span>
                  <span className="font-semibold ui-text-ink">{goal.estimatedFinishDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="ui-text-muted">Target Deadline:</span>
                  <span className="font-semibold ui-text-ink">{goal.targetDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="ui-text-muted">Pacing Status:</span>
                  <span className="capitalize font-semibold ui-text-ink">{goal.status === 'over_capacity' ? 'Beyond target date' : goal.status === 'completed' ? 'Completed' : 'Within target date'}</span>
                </div>
              </div>
            </div>

            {/* Proposed Recovery Card */}
            <div className="p-4 rounded-xl ui-bg-soft border ui-border-border-a40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase ui-text-ink tracking-wider">
                  Proposed Recovery
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold ui-bg-soft-a20 ui-text-ink border ui-border-border-a40">
                  {previewData.movedMissionCount} Missions Rescheduled
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="ui-text-muted">New Est. Finish:</span>
                  <span className="font-semibold ui-text-ink">{previewData.estimatedFinishDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="ui-text-muted">Proposed Target:</span>
                  <span className="font-semibold ui-text-ink">
                    {previewData.proposedTargetDate}
                    {goal.deadlineMode === 'flexible' && previewData.proposedTargetDate > goal.targetDate && (
                      <span className="text-[10px] ui-text-ink ml-1">(Extended)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="ui-text-muted">New Pacing Status:</span>
                  <span className={`capitalize font-semibold ${
                    previewData.status === 'on_track' ? 'ui-text-ink' : 'ui-text-ink'
                  }`}>
                    {previewData.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode explanation alert */}
          <div className="p-3.5 rounded-xl ui-bg-surface-a60 border ui-border-border text-xs ui-text-ink flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 ui-text-ink shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold ui-text-ink">
                What changes when you accept
              </p>
              <p className="ui-text-muted mt-0.5 leading-relaxed">
                {goal.deadlineMode === 'flexible'
                  ? 'Your target date can move to fit the time you have. Completed missions stay saved.'
                  : 'Your target date stays fixed. If the work needs more time, we show that clearly and keep every mission in your plan.'}
              </p>
            </div>
          </div>

          {/* Explicit Apply & Cancel buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t ui-border-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={isApplying}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold ui-text-muted hover:ui-text-ink hover:ui-bg-surface transition-colors"
            >
              Cancel & Keep Current Plan
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl ui-bg-accent hover:ui-bg-accent ui-text-inverse font-semibold text-xs sm:text-sm transition-colors shadow-glow disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isApplying ? 'Applying Plan...' : 'Accept & Apply Revised Plan'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
