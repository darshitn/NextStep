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
    <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Schedule Recovery & Calibration</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Life happened? Recalibrate your daily capacity without losing previously completed missions.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 border border-slate-700/60 text-xs text-slate-300 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isPreviewing ? 'animate-spin' : ''}`} />
            <span>{isPreviewing ? 'Calculating Schedule...' : 'Preview Revised Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side Preview (if generated) */}
      {previewData && (
        <div className="pt-4 border-t border-slate-800 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Before & After Comparison</span>
            </h3>
            <span className="text-xs text-slate-400">
              Preview for date: <span className="font-mono text-slate-300">{previewData.previewForDate}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan Card */}
            <div className="p-4 rounded-xl bg-surface-200/50 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
                Current Plan
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Finish Date:</span>
                  <span className="font-semibold text-slate-200">{goal.estimatedFinishDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Deadline:</span>
                  <span className="font-semibold text-slate-200">{goal.targetDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pacing Status:</span>
                  <span className="capitalize font-semibold text-slate-300">{goal.status}</span>
                </div>
              </div>
            </div>

            {/* Proposed Recovery Card */}
            <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-brand-300 tracking-wider">
                  Proposed Recovery
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                  {previewData.movedMissionCount} Missions Rescheduled
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">New Est. Finish:</span>
                  <span className="font-semibold text-brand-200">{previewData.estimatedFinishDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Proposed Target:</span>
                  <span className="font-semibold text-brand-200">
                    {previewData.proposedTargetDate}
                    {goal.deadlineMode === 'flexible' && previewData.proposedTargetDate > goal.targetDate && (
                      <span className="text-[10px] text-amber-300 ml-1">(Extended)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">New Pacing Status:</span>
                  <span className={`capitalize font-semibold ${
                    previewData.status === 'on_track' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {previewData.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode explanation alert */}
          <div className="p-3.5 rounded-xl bg-surface-100/60 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">
                Deterministic Allocation Notice
              </p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                {goal.deadlineMode === 'flexible'
                  ? 'In flexible mode, accepting this recovery safely adjusts your target deadline to match your revised capacity.'
                  : 'In fixed mode, your target deadline remains unchanged. If your revised availability requires more time, NextStep marks remaining work as over capacity rather than dropping missions.'}
              </p>
            </div>
          </div>

          {/* Explicit Apply & Cancel buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={isApplying}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-surface-100 transition-colors"
            >
              Cancel & Keep Current Plan
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow disabled:opacity-50"
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
