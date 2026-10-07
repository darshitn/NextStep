import React, { useId } from 'react';
import { Bookmark, ChevronDown, X, ArrowRight } from 'lucide-react';
export default function ResumePracticeCard({ resumeContext, onResume, onDismiss, onToggleStatus, isSaving = false }) {
  const id = useId();
  if (!resumeContext?.record) return null;
  const { record, mission, isActiveMission } = resumeContext;
  const isReady = record.selfReportedStatus === 'ready_to_continue';
  const assessment = record.assessment;
  return <details className="saved-context">
    <summary><Bookmark size={16} /><span>Saved notes <small>· {isActiveMission ? 'Current' : 'Earlier'} mission {mission?.id.toUpperCase() || record.missionId}</small></span><ChevronDown size={16} /></summary>
    <div className="saved-context-body" aria-label="Resume practice from saved context">
      <p className="saved-owner"><strong>{mission?.id.toUpperCase() || record.missionId}: {mission?.title}</strong></p>
      <dl>{record.whatTried && <div><dt>What you tried</dt><dd>{record.whatTried}</dd></div>}
        {record.whereStuck && <div><dt>Where you got stuck</dt><dd>{record.whereStuck}</dd></div>}</dl>
      {assessment && <div className="saved-assessment"><span className={`status-badge ${assessment.status === 'on_track' ? 'status-success' : 'status-attention'}`}>
        {assessment.status === 'on_track' ? 'On track' : assessment.status === 'needs_another_try' ? 'Needs another try' : 'Coaching guidance available'}</span>
        <p>{assessment.explanation}</p>{assessment.nextStep && <p><strong>Next step:</strong> {assessment.nextStep}</p>}</div>}
      <div className="saved-context-actions"><div><span className="section-label" id={id}>Your readiness</span>
        <button type="button" className={`status-badge ${isReady ? 'status-success' : 'status-attention'}`} aria-describedby={id}
          onClick={() => onToggleStatus?.(record.missionId, record.selfReportedStatus)} disabled={isSaving}>
          {isReady ? 'Ready to practise' : 'Still unsure'} · Change
        </button></div>
        <div className="saved-buttons">
          <button type="button" className="text-button" onClick={() => onDismiss?.(record.missionId)} disabled={isSaving} aria-label="Dismiss saved notes reminder"><X size={15} /> Dismiss reminder</button>
          <button type="button" className="text-button" onClick={onResume}>Resume {mission?.id.toUpperCase() || record.missionId}<ArrowRight size={15} /></button>
        </div>
      </div>
      <p className="section-label">Dismissing the reminder keeps your saved notes.</p>
    </div>
  </details>;
}
