import React from 'react';
import { readableDay } from '../services/activity.js';
export default function ProgressSummary({ goal, totalMissions = 12 }) {
  if (!goal) return null;
  const count = Math.min(Object.keys(goal.completions || {}).length, totalMissions);
  const percent = totalMissions ? Math.round(count / totalMissions * 100) : 0;
  return <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5" aria-label="Your progress">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs text-slate-400 mb-1">YOUR PROGRESS</p><p className="text-2xl font-bold text-white">{count}<span className="text-base font-normal text-slate-400"> / {totalMissions} missions</span></p></div>
      <div className="flex flex-wrap gap-6 text-sm"><div><p className="text-xs text-slate-400">Remaining practice</p><p className="font-semibold mt-1">{((goal.remainingMinutes ?? 0) / 60).toFixed(1)}h <span className="text-xs font-normal text-slate-500">estimated</span></p></div><div><p className="text-xs text-slate-400">Estimated finish</p><p className="font-semibold mt-1">{goal.estimatedFinishDate ? readableDay(goal.estimatedFinishDate) : '—'}</p></div><div><p className="text-xs text-slate-400">Target</p><p className="font-semibold mt-1">{goal.targetDate ? readableDay(goal.targetDate) : '—'}</p></div></div>
      <span className={`text-xs rounded-full px-3 py-1.5 border ${goal.status === 'over_capacity' ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'}`}>{goal.status === 'completed' ? 'Starter completed' : goal.status === 'over_capacity' ? 'Beyond target date' : 'Within target date'}</span>
    </div>
    <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-label="Missions completed" aria-valuemin={0} aria-valuemax={totalMissions} aria-valuenow={count}><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all motion-reduce:transition-none" style={{width:`${percent}%`}} /></div>
  </section>;
}
