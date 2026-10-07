import React from 'react';
import { readableDay } from '../services/activity.js';
export default function ProgressSummary({ goal, totalMissions = 12 }) {
  if (!goal) return null;
  const count = Math.min(Object.keys(goal.completions || {}).length, totalMissions);
  const percent = totalMissions ? Math.round(count / totalMissions * 100) : 0;
  return <section className="rounded-2xl border ui-border-border ui-bg-surface p-5" aria-label="Your progress">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs ui-text-muted mb-1">YOUR PROGRESS</p><p className="text-2xl font-bold ui-text-ink">{count}<span className="text-base font-normal ui-text-muted"> / {totalMissions} missions</span></p></div>
      <div className="flex flex-wrap gap-6 text-sm"><div><p className="text-xs ui-text-muted">Remaining practice</p><p className="font-semibold mt-1">{((goal.remainingMinutes ?? 0) / 60).toFixed(1)}h <span className="text-xs font-normal ui-text-muted">estimated</span></p></div><div><p className="text-xs ui-text-muted">Estimated finish</p><p className="font-semibold mt-1">{goal.estimatedFinishDate ? readableDay(goal.estimatedFinishDate) : '—'}</p></div><div><p className="text-xs ui-text-muted">Target</p><p className="font-semibold mt-1">{goal.targetDate ? readableDay(goal.targetDate) : '—'}</p></div></div>
      <span className={`text-xs rounded-full px-3 py-1.5 border ${goal.status === 'over_capacity' ? 'ui-text-ink ui-border-border-a30 ui-bg-soft-a10' : 'ui-text-ink ui-border-border-a30 ui-bg-soft-a10'}`}>{goal.status === 'completed' ? 'Starter completed' : goal.status === 'over_capacity' ? 'Beyond target date' : 'Within target date'}</span>
    </div>
    <div className="mt-4 h-2 rounded-full ui-bg-soft overflow-hidden" role="progressbar" aria-label="Missions completed" aria-valuemin={0} aria-valuemax={totalMissions} aria-valuenow={count}><div className="h-full rounded-full ui-bg-accent transition-all motion-reduce:transition-none" style={{width:`${percent}%`}} /></div>
  </section>;
}
