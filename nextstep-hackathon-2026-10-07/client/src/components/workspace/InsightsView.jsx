import React, { useState } from 'react';
import { CheckCircle2, Calendar, Download, Sparkles } from 'lucide-react';
import { readableDay } from '../../services/activity.js';
import { buildGoalExportData } from '../../services/workspace.js';

export default function InsightsView({ stats, goal, catalog }) {
  const [exportNotice, setExportNotice] = useState('');

  const {
    totalCatalogMissions = 0,
    completedCount = 0,
    independentCount = 0,
    withHintCount = 0,
    activeDaysCount = 0,
    estimatedRemainingMinutes = 0,
    latestReflections = []
  } = stats || {};

  const percentComplete = totalCatalogMissions
    ? Math.round((completedCount / totalCatalogMissions) * 100)
    : 0;

  const handleExport = () => {
    try {
      const data = buildGoalExportData(goal, catalog);
      if (!data) return;
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeTrack = (data.track?.trackId || 'dsa').replace(/[^a-z0-9_-]/gi, '-');
      const safeDate = new Date().toISOString().slice(0, 10);
      const filename = `nextstep-goal-${safeTrack}-${safeDate}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportNotice('Snapshot prepared; download started on your device.');
      setTimeout(() => setExportNotice(''), 5000);
    } catch (err) {
      setExportNotice('Could not prepare download snapshot.');
    }
  };

  return (
    <section id="view-insights" role="region" aria-labelledby="insights-heading" className="workspace-content insights-view-container">
      {/* Short heading and plain copy */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 id="insights-heading" className="text-xl font-bold ui-text-ink tracking-tight">Practice insights</h2>
          <p className="text-sm ui-text-muted mt-1">
            Your recorded practice, outcomes and reflections.
          </p>
        </div>

        {/* Goal Export Button */}
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleExport}
            className="secondary-button text-xs py-2 px-3.5"
            aria-label="Download goal snapshot as JSON"
          >
            <Download size={14} aria-hidden="true" />
            <span>Export goal data (JSON)</span>
          </button>
          {exportNotice && (
            <span role="status" className="text-xs font-semibold ui-text-accent">
              {exportNotice}
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="insights-metrics-grid">
        {/* Completed missions */}
        <div className="insights-metric-card">
          <span className="insights-metric-label">Completed Missions</span>
          <div className="insights-metric-value">
            {completedCount} <span className="text-base font-normal ui-text-muted">/ {totalCatalogMissions}</span>
          </div>
          <span className="insights-metric-detail">
            {percentComplete}% of DSA starter track
          </span>
        </div>

        {/* Independent vs With Hint */}
        <div className="insights-metric-card">
          <span className="insights-metric-label">Recorded Outcomes</span>
          <div className="insights-metric-value text-xl">
            {independentCount} <span className="text-sm font-normal ui-text-muted">solo</span> · {withHintCount} <span className="text-sm font-normal ui-text-muted">hint</span>
          </div>
          <span className="insights-metric-detail">
            Self-reported completion mode
          </span>
        </div>

        {/* Active Days */}
        <div className="insights-metric-card">
          <span className="insights-metric-label">Active Days</span>
          <div className="insights-metric-value">{activeDaysCount}</div>
          <span className="insights-metric-detail">
            Unique dates in Asia/Kolkata (IST)
          </span>
        </div>

        {/* Estimated Remaining Duration */}
        <div className="insights-metric-card">
          <span className="insights-metric-label">Estimated Remaining</span>
          <div className="insights-metric-value">
            {(estimatedRemainingMinutes / 60).toFixed(1)} <span className="text-base font-normal ui-text-muted">hrs</span>
          </div>
          <span className="insights-metric-detail">
            {estimatedRemainingMinutes} min planned duration
          </span>
        </div>
      </div>

      {/* Plain Grounding Note */}
      <div className="insights-disclosure-card" role="note">
        <strong>About these metrics:</strong> All statistics reflect self-reported completions and saved notes. NextStep does not measure elapsed focus time or show simulated trend charts. Estimated remaining practice is calculated from the remaining 30-minute authored curriculum missions.
      </div>

      {/* Recorded Reflections Section */}
      <section className="insights-reflections-section" aria-label="Recorded completion reflections">
        <h3 className="text-lg font-bold ui-text-ink flex items-center gap-2">
          <Sparkles size={18} className="ui-text-accent" aria-hidden="true" />
          <span>Recorded completion reflections</span>
        </h3>

        {latestReflections.length === 0 ? (
          <div className="workspace-empty-state">
            <h4>No written reflections recorded yet</h4>
            <p>
              When you record completion for a mission and include an optional written reflection, your takeaways will be chronologically preserved here.
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Reflections list">
            {latestReflections.map((ref, idx) => (
              <article key={`${ref.missionId}-${idx}`} role="listitem" className="insights-reflection-card">
                <div className="insights-reflection-header">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                      {ref.missionId.toUpperCase()}
                    </span>
                    <h4 className="font-semibold text-sm ui-text-ink">{ref.missionTitle}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`status-badge text-xs ${
                        ref.outcome === 'independent' ? 'status-success' : 'status-accent'
                      }`}
                    >
                      {ref.outcome === 'independent' ? (
                        <>
                          <CheckCircle2 size={12} aria-hidden="true" />
                          <span>Independent</span>
                        </>
                      ) : (
                        <span>With a hint</span>
                      )}
                    </span>
                    {ref.localDate && (
                      <span className="text-xs ui-text-muted">
                        <Calendar size={12} className="inline mr-1" aria-hidden="true" />
                        {readableDay(ref.localDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                <blockquote className="insights-reflection-text">
                  &ldquo;{ref.reflection}&rdquo;
                </blockquote>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
