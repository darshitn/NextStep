import React, { useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';
import { deriveWeeklyExecution } from '../../services/weeklyExecution.js';
import { readableDay } from '../../services/activity.js';

export default function WeeklyPlanView({ goal, catalog, onOpenProofLesson, onOpenPracticeProblem, onPlan, onSelectView }) {
  const [offset, setOffset] = useState(0);
  const model = deriveWeeklyExecution(goal, new Date(), offset);
  const [filter, setFilter] = useState('all');

  const starterMissions = catalog?.missions || [];
  const completedStarterIds = new Set(Object.keys(goal?.completions || {}));
  const uncompletedStarterMissions = starterMissions.filter(m => !completedStarterIds.has(m.id));
  const hasStarterWork = uncompletedStarterMissions.length > 0;

  const open = (session) => {
    if (session.itemType === 'practice') return onOpenPracticeProblem(session.itemId);
    const exercise = catalog?.curriculum?.exercises?.find(item => item.id === session.itemId);
    onOpenProofLesson({ topicId: session.topicId, lessonId: session.itemType === 'lesson' ? session.itemId : exercise?.lessonId, exerciseId: session.itemType === 'exercise' ? session.itemId : undefined });
  };
  const replan = () => onPlan({ itemIds: model.pendingItemIds, revisitItemIds: model.revisitItemIds, availability: model.availability });
  const row = (session) => (
    <article key={session.key} className={`week-session ${session.completed ? 'is-completed' : ''}`} data-testid="week-session" data-item-id={session.itemId}>
      <div className="week-session-copy">
        <div className="week-session-meta"><span>{session.isRevisit ? 'Review' : session.itemType === 'exercise' ? 'Proof trace' : session.itemType}</span><span>{session.allocatedMinutes}m allocated{session.totalParts > 1 ? ` · Part ${session.partIndex}/${session.totalParts}` : ''}</span></div>
        <h3>{session.title}</h3>
        {session.completed ? <p className="week-recorded"><CheckCircle2 size={13} /> Completion recorded</p> : <p className="ui-text-muted text-xs">{session.isRevisit ? 'A fresh attempt after plan acceptance is needed.' : 'Continue in your learning workspace.'}</p>}
      </div>
      {!session.completed && <button type="button" className="secondary-button text-xs shrink-0" onClick={() => open(session)} aria-label={`Start ${session.title}`}>Start <ArrowRight size={14} /></button>}
    </article>
  );
  return (
    <section id="view-week" className="workspace-content week-workspace" role="region" aria-labelledby="week-heading">
      <header className="week-heading" data-guide="week-heading">
        <div><span className="week-eyebrow"><CalendarDays size={15} /> YOUR EXECUTION WEEK</span><h1 id="week-heading">A plan you can act on.</h1><p className="ui-text-muted text-sm">See what is next, start one activity, and make room when life changes.</p></div>
        <button type="button" data-guide="week-plan-actions" className="primary-button text-xs" onClick={model.pendingActivities ? replan : () => onPlan(null)} disabled={model.pendingActivities > 40}><RotateCcw size={15} /> {model.pendingActivities ? 'Replan remaining work' : 'Plan study activities'}</button>
      </header>
      {!model.hasPlan ? (
        <div className="week-empty" data-guide="week-empty-state">
          <CalendarDays size={30} className="ui-text-accent" />
          <h2>No curriculum plan yet</h2>
          <p>Choose curriculum activities and your availability. Review the dates before saving; your starter track stays separate.</p>
          {hasStarterWork && (
            <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/50 text-xs ui-text-muted space-y-1.5 max-w-md mx-auto text-left">
              <p className="font-semibold ui-text-ink">
                Starter track is active ({starterMissions.length - uncompletedStarterMissions.length}/{starterMissions.length} completed)
              </p>
              <p>
                You have {uncompletedStarterMissions.length} scheduled starter mission{uncompletedStarterMissions.length === 1 ? '' : 's'} available to build regular study pacing.
              </p>
              <button
                type="button"
                className="secondary-button text-xs py-1.5 px-3 mt-1 inline-flex items-center gap-1.5"
                onClick={() => onSelectView('roadmap')}
              >
                <span>View Starter track missions</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button type="button" className="primary-button" onClick={() => onPlan(null)}>Build my week <ArrowRight size={15} /></button>
            <button type="button" className="secondary-button" onClick={() => onSelectView('atlas')}>Explore Learning path</button>
          </div>
        </div>
      ) : <>
        <div className="week-metrics" aria-label="Weekly plan summary">
          <div><span>Activities remaining</span><strong>{model.pendingActivities}</strong></div><div><span>Completed activities</span><strong>{model.completedActivities}</strong></div><div><span>Allocated in this view</span><strong>{model.weekMinutes}<small> min</small></strong></div>
        </div>
        {model.allCompleted && <div className="week-notice" role="status"><CheckCircle2 size={19} /><div><strong>Your planned activities are complete.</strong><p>Choose another week of learning when you are ready.</p></div></div>}
        {model.pendingActivities > 40 && <p role="status" className="week-notice">This plan has more than 40 unfinished activities. Finish some before replacing the plan; the planner accepts up to 40 selections.</p>}
        {model.missed.length > 0 && <section className="week-missed" aria-label="Missed allocations"><div className="week-section-heading"><h2>Make room to restart</h2><span>{model.missed.length} past allocation{model.missed.length === 1 ? '' : 's'}</span></div><p>These activities have no recorded completion. Nothing is lost or automatically moved. Replan remaining work to preview new dates.</p><details><summary>Show missed work</summary><div className="week-session-list">{model.missed.map(row)}</div></details></section>}
        <div className="week-toolbar">
          <div className="week-date-controls"><button type="button" className="secondary-button" aria-label="Previous seven days" onClick={() => setOffset(value => value - 1)} disabled={offset <= -52}><ChevronLeft size={16} /></button><div><h2>{readableDay(model.start, { month: 'short', day: 'numeric' })} – {readableDay(model.end, { month: 'short', day: 'numeric' })}</h2><span>Asia/Kolkata · seven-day view</span></div><button type="button" className="secondary-button" aria-label="Next seven days" onClick={() => setOffset(value => value + 1)} disabled={offset >= 52}><ChevronRight size={16} /></button><button type="button" className="week-text-button" onClick={() => setOffset(0)}>This week</button></div>
          <div className="week-filter" role="group" aria-label="Activity visibility">{[['all', 'All'], ['pending', 'Remaining'], ['completed', 'Completed']].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        </div>
        <div className="week-days" data-guide="week-days-container">{model.days.map(day => {
          const visible = day.sessions.filter(session => filter === 'all' || (filter === 'completed' ? session.completed : !session.completed));
          return <section key={day.date} className={`week-day ${day.isToday ? 'is-today' : ''}`} aria-label={day.date}><header><div><span>{new Date(day.date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })}</span><h2>{readableDay(day.date, { month: 'short', day: 'numeric' })}</h2>{day.isToday && <b>Today</b>}</div><span className="week-day-capacity"><Clock size={12} /> {day.allocated}m planned · {day.capacity}m available</span></header><div className="week-session-list">{visible.length ? visible.map(row) : <p className="week-rest">{day.sessions.length ? 'No activities match this filter.' : day.capacity ? 'Open capacity. No activity scheduled.' : 'Rest day. No time committed.'}</p>}</div></section>;
        })}</div>
        {model.spillover.length > 0 && <details className="week-missed"><summary>Beyond this view · {model.spillover.length} upcoming allocations</summary><div className="week-session-list">{model.spillover.map(session => <div key={session.key}><p className="week-eyebrow">{readableDay(session.date)}</p>{row(session)}</div>)}</div></details>}
        {model.unscheduled.length > 0 && <p className="week-notice" role="status">{model.unscheduled.length} selected activities have no scheduled slot. Adjust availability and preview again.</p>}
        <p className="week-footnote">Progress reflects recorded activity completion, not minutes tracked. Split allocations share one activity outcome. Replanning schedules unfinished activities at their full estimated effort.</p>
      </>}
    </section>
  );
}


