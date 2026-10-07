import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Check, ArrowUpRight } from 'lucide-react';
import { activityByDay, dayPlan, localDay, mondayOf, readableDay, shiftDay } from '../services/activity.js';
import './practice-activity.css';

export default function PracticeActivity({ goal, missions }) {
  const [today, setToday] = useState(localDay);
  const [selected, setSelected] = useState(localDay);
  const [week, setWeek] = useState(() => mondayOf(localDay()));
  const [focusDay, setFocusDay] = useState(localDay);
  useEffect(() => {
    const timer = setInterval(() => setToday(localDay()), 60000);
    return () => clearInterval(timer);
  }, []);
  const activity = activityByDay(goal, missions);
  const first = shiftDay(mondayOf(today), -49);
  const dates = Array.from({ length: 56 }, (_, i) => shiftDay(first, i));
  const weekDates = Array.from({ length: 7 }, (_, i) => shiftDay(week, i));
  const planned = dayPlan(goal, missions, selected);
  const completed = activity[selected] || [];
  const pending = planned.filter(m => !goal.completions?.[m.id]);
  const activeDays = Object.keys(activity).filter(day => day <= today).length;
  const choose = day => { setSelected(day); setWeek(mondayOf(day)); };
  const heatKey = (event, day) => {
    const delta = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = shiftDay(day, delta);
    if (next < first || next > today) return;
    setFocusDay(next);
    event.currentTarget.closest('.ns-heat-grid').querySelector(`[data-day="${next}"]`)?.focus();
  };
  return (
    <section className="ns-practice" aria-label="Practice calendar and activity">
      <div className="ns-calendar">
        <div className="ns-section-heading">
          <div><span className="ns-eyebrow">MAKE ROOM FOR PROGRESS</span><h2><CalendarDays size={18} /> Your week</h2></div>
          <div className="ns-calendar-controls">
            <button aria-label="Previous week" onClick={() => setWeek(shiftDay(week, -7))}><ChevronLeft size={17} /></button>
            <button onClick={() => { setWeek(mondayOf(today)); setSelected(today); }}>Today</button>
            <button aria-label="Next week" onClick={() => setWeek(shiftDay(week, 7))}><ChevronRight size={17} /></button>
          </div>
        </div>
        <p className="ns-muted">{readableDay(week)} – {readableDay(shiftDay(week, 6), { year: 'numeric' })} · IST</p>
        <div className="ns-week">
          {weekDates.map(day => {
            const count = dayPlan(goal, missions, day).filter(m => !goal.completions?.[m.id]).length;
            const done = activity[day]?.length || 0;
            return <button key={day} className={`ns-day ${selected === day ? 'is-selected' : ''} ${today === day ? 'is-today' : ''}`} aria-pressed={selected === day} aria-label={`${readableDay(day)}, ${count} pending, ${done} completed`} onClick={() => choose(day)}>
              <span>{readableDay(day, { weekday: 'short' }).split(',')[0].slice(0, 3)}</span><strong>{Number(day.slice(-2))}</strong>
              <span className="ns-dots" aria-hidden="true">{done > 0 && <i className="ns-dot-done" />}{count > 0 && <i className="ns-dot-plan" />}{!count && !done && <i />}</span>
            </button>;
          })}
        </div>
        <div className="ns-day-details" aria-live="polite">
          <div className="ns-detail-title"><h3>{selected === today ? 'Today' : readableDay(selected, { weekday: 'short' })}</h3><span>{pending.length ? `${pending.reduce((sum, m) => sum + m.minutes, 0)} min planned` : 'No pending sessions'}</span></div>
          {!planned.length && !completed.length && <p className="ns-empty">{selected < goal.planStartDate ? 'Your plan has not started on this date.' : 'No session planned. Space to rest is part of the plan.'}</p>}
          {planned.map(m => <div key={m.id} className="ns-task"><span className={`ns-task-icon ${goal.completions?.[m.id] ? 'done' : ''}`}>{goal.completions?.[m.id] ? <Check size={14} /> : <ArrowUpRight size={14} />}</span><div><strong>{m.title}</strong><small>{goal.completions?.[m.id] ? `Completed ${readableDay(localDay(goal.completions[m.id].completedAt))}` : selected < today ? 'Needs rescheduling' : m.id === goal.nextMissionId ? 'Next eligible mission · open above' : 'Upcoming · complete earlier missions first'}</small></div></div>)}
          {completed.length > 0 && <div className="ns-completion-log"><span className="ns-eyebrow">ACTUALLY COMPLETED THIS DAY</span>{completed.map(m => <div key={m.id}><strong>{m.title}</strong>{m.completion.reflection && <p>{m.completion.reflection}</p>}</div>)}</div>}
        </div>
      </div>
      <div className="ns-activity">
        <div className="ns-section-heading"><div><span className="ns-eyebrow">SMALL STEPS ADD UP</span><h2>Practice activity</h2></div><span className="ns-active-count"><strong>{activeDays}</strong> active {activeDays === 1 ? 'day' : 'days'}</span></div>
        <p className="ns-muted">Your last 8 weeks. Every filled square is completed practice.</p>
        <div className="ns-heat-wrap">
          <div className="ns-heat-labels" aria-hidden="true">{['M','T','W','T','F','S','S'].map((s, i) => <span key={i}>{s}</span>)}</div>
          <div className="ns-heat-grid" role="group" aria-label="Completion activity. Use arrow keys to navigate; Enter to select a date.">
            {dates.map(day => {
              const count = activity[day]?.length || 0;
              const before = day < goal.planStartDate && !count;
              return <button key={day} data-day={day} disabled={day > today} tabIndex={focusDay === day ? 0 : -1} onFocus={() => setFocusDay(day)} onKeyDown={e => heatKey(e, day)} onClick={() => choose(day)} aria-pressed={selected === day} aria-label={`${readableDay(day, { year: 'numeric' })}: ${count} missions completed${before ? ', before plan start' : ''}`} title={`${readableDay(day)} · ${count} completed`} className={`ns-heat-cell intensity-${Math.min(count, 3)} ${before ? 'before-start' : ''} ${day === today ? 'is-today' : ''} ${selected === day ? 'is-selected' : ''}`} />;
            })}
          </div>
        </div>
        <div className="ns-heat-footer"><span>{readableDay(first)} – {readableDay(today)}</span><span className="ns-legend">Missions {['0','1','2','3+'].map((n,i) => <span key={n}><i className={`intensity-${i}`} />{n}</span>)}</span></div>
        <div className="ns-activity-note"><span className="ns-spark">✦</span><p>{activeDays ? 'A day of progress counts, even when the week changes. Select a square to revisit your work.' : 'Complete your first mission to start your activity history.'}</p></div>
        <p className="ns-footnote">Self-reported completions for this goal · Asia/Kolkata<br />Filled dot = completed activity · Square = scheduled work</p>
      </div>
    </section>
  );
}
