import React from 'react';
import { localDay, readableDay } from '../services/activity.js';
import { CheckCircle2, ExternalLink, ArrowRight, Clock } from 'lucide-react';
export default function MissionCard({ mission, isCurrent = false, isCompleted = false, completionData = null,
  scheduledDate = null, onComplete, onOpenGuidance, savedContextContent, practiceLabel = 'Start practising' }) {
  if (!mission) return null;
  const today = localDay();
  return <article className={`mission-card ${isCurrent ? 'mission-current' : ''} ${isCompleted ? 'mission-completed' : ''}`} aria-label={`${isCurrent ? 'Current mission: ' : ''}${mission.title}`}>
    <div className="mission-topline"><span className="section-label">{isCurrent ? 'Your next step' : 'Mission'} · {mission.id.toUpperCase()}</span><span className="mission-duration"><Clock size={15} />{mission.minutes} min</span></div>
    <div className="mission-title-row"><h2>{mission.title}</h2>
      {isCurrent && <span className="status-badge status-accent">{scheduledDate === today ? "Today's mission" : scheduledDate && scheduledDate < today ? 'Ready to resume' : 'You can start early'}</span>}
      {isCompleted && <span className="status-badge status-success"><CheckCircle2 size={14} />Completed</span>}
    </div>
    {scheduledDate && <p className="section-label">Scheduled for {readableDay(scheduledDate, { weekday: 'short', year: 'numeric' })}</p>}
    <p className="mission-purpose">{mission.why}</p>
    <ol className="mission-steps">{mission.steps.map((step, index) => <li key={index}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
    <div className="mission-criteria"><p><strong>Done when</strong> {mission.doneWhen}</p>
      {mission.resourceUrl && <a href={mission.resourceUrl} target="_blank" rel="noopener noreferrer">{mission.resourceLabel || 'Practice resource'}<ExternalLink size={15} /></a>}
    </div>
    {isCompleted && completionData && <div className="mission-reflection"><p className="section-label">Completed {readableDay(localDay(completionData.completedAt))} · {completionData.outcome === 'independent' ? 'Independent' : 'With a hint'}</p>{completionData.reflection && <p>{completionData.reflection}</p>}</div>}
    {isCurrent && !isCompleted && (onComplete || onOpenGuidance) && <div className="mission-action-area">
      {savedContextContent}
      <div className="mission-actions">{onComplete && <button type="button" className="secondary-button" onClick={() => onComplete(mission)}><CheckCircle2 size={17} />Record completion</button>}
        {onOpenGuidance && <button id="start-current-practice" type="button" className="primary-button" onClick={() => onOpenGuidance(mission)}>{practiceLabel}<ArrowRight size={18} /></button>}</div>
    </div>}
  </article>;
}
