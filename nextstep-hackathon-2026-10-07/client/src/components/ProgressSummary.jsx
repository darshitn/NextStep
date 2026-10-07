import React from 'react';
import { Award, CheckCircle2, Clock, CalendarCheck, AlertTriangle, Sparkles } from 'lucide-react';

export default function ProgressSummary({ goal, totalMissions = 12 }) {
  if (!goal) return null;

  const completions = goal.completions || {};
  const completedCount = Object.keys(completions).length;
  const progressPct = Math.round((completedCount / totalMissions) * 100);
  const remainingMinutes = goal.remainingMinutes ?? (30 * (totalMissions - completedCount));
  const remainingHours = (remainingMinutes / 60).toFixed(1);

  const statusConfig = {
    on_track: {
      label: 'On Track',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle2,
      description: 'Pacing matches your target completion date.'
    },
    over_capacity: {
      label: 'Over Capacity',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: AlertTriangle,
      description: 'Projected finish extends past your target date. Recovery available.'
    },
    completed: {
      label: 'Track Complete',
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: Sparkles,
      description: 'All 12 foundational missions completed!'
    }
  };

  const currentStatus = statusConfig[goal.status] || statusConfig.on_track;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-glass relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top row: Status and Level/XP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Your Practice Horizon</h2>
            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatus.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{currentStatus.label}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{currentStatus.description}</p>
        </div>

        {/* XP and Level card */}
        <div className="flex items-center gap-3 bg-surface-100/90 border border-slate-700/60 rounded-xl px-4 py-2 self-start sm:self-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-white">{goal.xp || 0} XP</span>
              <span className="text-xs font-medium text-brand-300">Level {goal.level || 1}</span>
            </div>
            <span className="text-[10px] text-slate-400">20 XP / completed mission</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-5">
        <div className="p-3.5 rounded-xl bg-surface-200/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Missions Done</span>
          </div>
          <div className="text-xl font-bold text-slate-100">
            {completedCount} <span className="text-xs font-normal text-slate-500">/ {totalMissions}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-200/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Remaining Work</span>
          </div>
          <div className="text-xl font-bold text-slate-100">
            {remainingHours}h <span className="text-xs font-normal text-slate-500">({remainingMinutes}m)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-200/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CalendarCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Est. Finish</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {goal.estimatedFinishDate || 'Pending'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-200/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Deadline</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-100 truncate">
            {goal.targetDate}
            <span className="text-[10px] block font-normal text-slate-500 capitalize">
              Mode: {goal.deadlineMode}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pt-2">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Starter Track Completion</span>
          <span className="text-brand-300 font-bold">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-surface-200 border border-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
