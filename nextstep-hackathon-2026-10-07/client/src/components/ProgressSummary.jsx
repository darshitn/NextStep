import React from 'react';
import { readableDay } from '../services/activity.js';
export default function ProgressSummary({ goal, totalMissions = 12 }) {
  if (!goal) return null;
  const count = Math.min(Object.keys(goal.completions || {}).length, totalMissions);
  const percent = totalMissions ? Math.round(count / totalMissions * 100) : 0;
  return <section className="progress-strip" aria-label="Your progress">
    <div className="progress-count"><span className="section-label">Your progress</span><p><strong>{count}</strong> / {totalMissions} missions</p>
      <div className="progress-track" role="progressbar" aria-label="Missions completed" aria-valuemin={0} aria-valuemax={totalMissions} aria-valuenow={count}><div style={{ width: `${percent}%` }} /></div>
    </div>
    <dl className="progress-metrics">
      <div><dt>Remaining practice</dt><dd>{((goal.remainingMinutes ?? 0) / 60).toFixed(1)} hours <small>estimated</small></dd></div>
      <div><dt>Estimated finish</dt><dd>{goal.estimatedFinishDate ? readableDay(goal.estimatedFinishDate) : '—'}</dd></div>
      <div><dt>Target date</dt><dd>{goal.targetDate ? readableDay(goal.targetDate) : '—'}</dd></div>
    </dl>
    <span className={`status-badge ${goal.status === 'over_capacity' ? 'status-attention' : 'status-success'}`}>
      {goal.status === 'completed' ? 'Starter completed' : goal.status === 'over_capacity' ? 'Beyond target date' : 'Within target date'}
    </span>
  </section>;
}
