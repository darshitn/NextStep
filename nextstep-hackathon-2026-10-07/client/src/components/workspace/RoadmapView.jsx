import React, { useState, useMemo } from 'react';
import { filterMissions } from '../../services/workspace.js';
import { localDay, readableDay } from '../../services/activity.js';
import {
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  X
} from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'next', label: 'Next' },
  { id: 'completed', label: 'Completed' },
  { id: 'upcoming', label: 'Upcoming' }
];

export default function RoadmapView({
  catalog,
  missions = [],
  goal,
  scheduleMap = {},
  onOpenPractice,
  onStartComplete,
  activeGuidanceMission
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const completions = goal?.completions || {};
  const nextMissionId = goal?.nextMissionId;

  // Filtered list derived using workspace helper
  const filteredMissions = useMemo(() => {
    return filterMissions(missions, {
      query: searchQuery,
      filter: activeFilter,
      nextMissionId,
      completions
    });
  }, [missions, searchQuery, activeFilter, nextMissionId, completions]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  return (
    <section id="view-roadmap" role="region" aria-labelledby="roadmap-heading" className="workspace-content">
      {/* Roadmap Header & Toolbar */}
      <div className="roadmap-toolbar">
        <div>
          <h2 id="roadmap-heading" className="text-xl font-bold ui-text-ink tracking-tight">12-Mission Starter Roadmap</h2>
          <p className="text-sm ui-text-muted mt-1">
            Structured DSA starter track · {missions.length} ordered 30-minute missions with scheduled focus sessions.
          </p>
        </div>

        {/* Search Input */}
        <div className="roadmap-search-row">
          <div className="roadmap-search-wrapper">
            <Search className="roadmap-search-icon" size={16} aria-hidden="true" />
            <label htmlFor="roadmap-search" className="sr-only">
              Search missions by title, ID, or step content
            </label>
            <input
              id="roadmap-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, ID (e.g. M03), or step content..."
              className="roadmap-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-xs ui-text-muted hover:ui-text-ink"
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filters and count */}
        <div className="roadmap-filter-row">
          <div className="roadmap-filter-group" role="group" aria-label="Filter missions by status">
            {FILTERS.map((f) => {
              const count = filterMissions(missions, {
                query: '',
                filter: f.id,
                nextMissionId,
                completions
              }).length;

              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={activeFilter === f.id}
                  className="roadmap-filter-btn"
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          <span className="roadmap-count-badge" role="status">
            Showing {filteredMissions.length} of {missions.length} missions
          </span>
        </div>
      </div>

      {/* Empty State */}
      {filteredMissions.length === 0 ? (
        <div className="workspace-empty-state">
          <h3>No missions found</h3>
          <p>
            No missions matched your search &quot;{searchQuery}&quot; with filter &quot;{activeFilter}&quot;.
          </p>
          <div className="workspace-empty-state-actions">
            <button
              type="button"
              onClick={handleResetFilters}
              className="secondary-button text-xs"
            >
              Reset search & filters
            </button>
          </div>
        </div>
      ) : (
        /* Compact Rows List */
        <div className="roadmap-rows-container" role="list" aria-label="Curriculum missions">
          {filteredMissions.map((mission) => {
            const isCompleted = Boolean(completions[mission.id]);
            const isCurrent = mission.id === nextMissionId;
            const isExpanded = expandedId === mission.id;
            const completionData = completions[mission.id];
            const scheduledDate = scheduleMap[mission.id];
            const hasLearning = Boolean(goal?.learning?.[mission.id]);
            const isPracticingThis = activeGuidanceMission?.id === mission.id;

            const practiceText = hasLearning || isPracticingThis ? 'Continue practising' : 'Start practising';

            return (
              <article
                key={mission.id}
                role="listitem"
                className={`roadmap-item ${isCurrent ? 'current-item' : ''} ${isCompleted ? 'completed-item' : ''}`}
                aria-label={`${isCurrent ? 'Current mission: ' : ''}${mission.title}`}
              >
                {/* Header row: Div container with separate expand trigger and action buttons (Zero nested buttons) */}
                <div className="roadmap-item-header">
                  <button
                    type="button"
                    className="roadmap-item-trigger"
                    onClick={() => toggleExpand(mission.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`mission-details-${mission.id}`}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${mission.id.toUpperCase()} · ${mission.title}`}
                  >
                    <span className="roadmap-item-id">{mission.id.toUpperCase()}</span>

                    {/* Status Badge */}
                    {isCurrent && (
                      <span className="status-badge status-accent text-xs">
                        Next
                      </span>
                    )}
                    {isCompleted && (
                      <span className="status-badge status-success text-xs">
                        <CheckCircle2 size={13} aria-hidden="true" />
                        Done
                      </span>
                    )}
                    {!isCurrent && !isCompleted && (
                      <span className="status-badge status-neutral text-xs">
                        Upcoming
                      </span>
                    )}

                    <div className="roadmap-item-title-col">
                      <h3 className="roadmap-item-title">{mission.title}</h3>
                      <div className="roadmap-item-meta">
                        <span>
                          <Clock size={12} className="inline mr-1" aria-hidden="true" />
                          {mission.minutes || 30} min
                        </span>
                        {isCompleted && completionData?.completedAt && (
                          <span>
                            Completed {readableDay(localDay(completionData.completedAt))} (
                            {completionData.outcome === 'independent' ? 'Independent' : 'With hint'})
                          </span>
                        )}
                        {!isCompleted && scheduledDate && (
                          <span>
                            Scheduled {readableDay(scheduledDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <span>
                          {mission.prerequisites?.length
                            ? `Prereq: ${mission.prerequisites.map((p) => p.toUpperCase()).join(', ')}`
                            : 'No prereqs'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Sibling action buttons */}
                  <div className="roadmap-item-actions">
                    {/* Quick practice action */}
                    {isCurrent && (
                      <button
                        type="button"
                        onClick={() => onOpenPractice(mission)}
                        className="primary-button text-xs py-1.5 px-3 min-h-[36px]"
                      >
                        {practiceText}
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => onOpenPractice(mission)}
                        className="secondary-button text-xs py-1.5 px-3 min-h-[36px]"
                      >
                        Reopen practice
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(mission.id)}
                      className="roadmap-expand-btn hover:ui-bg-soft"
                      aria-expanded={isExpanded}
                      aria-controls={`mission-details-${mission.id}`}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${mission.title}`}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expandable Details Container */}
                {isExpanded && (
                  <div id={`mission-details-${mission.id}`} className="roadmap-item-body">
                    <p className="text-sm ui-text-ink leading-relaxed">
                      <strong>Purpose:</strong> {mission.why}
                    </p>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider ui-text-muted mb-2">
                        Practice Steps
                      </h4>
                      <ol className="roadmap-item-steps">
                        {mission.steps.map((step, idx) => (
                          <li key={idx}>
                            <span aria-hidden="true">{idx + 1}</span>
                            <p>{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="mission-criteria text-sm">
                      <p>
                        <strong>Done when:</strong> {mission.doneWhen}
                      </p>
                      {mission.resourceUrl && (
                        <a
                          href={mission.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold ui-text-accent underline inline-flex items-center gap-1"
                        >
                          <span>{mission.resourceLabel || 'Practice resource'}</span>
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      )}
                    </div>

                    {isCompleted && completionData && (
                      <div className="mission-reflection">
                        <span className="section-label">
                          Completed {readableDay(localDay(completionData.completedAt))} ·{' '}
                          {completionData.outcome === 'independent' ? 'Independent' : 'With a hint'}
                        </span>
                        {completionData.reflection && (
                          <p className="mt-1 text-sm italic">&ldquo;{completionData.reflection}&rdquo;</p>
                        )}
                      </div>
                    )}

                    {/* Action area inside expanded row */}
                    <div className="roadmap-item-action-footer">
                      {isCurrent && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onStartComplete(mission)}
                            className="secondary-button text-xs"
                          >
                            <CheckCircle2 size={15} aria-hidden="true" />
                            Record completion
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPractice(mission)}
                            className="primary-button text-xs"
                          >
                            {practiceText}
                            <ArrowRight size={15} aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenPractice(mission)}
                            className="secondary-button text-xs"
                          >
                            <BookOpen size={15} aria-hidden="true" />
                            Revisit in practice panel
                          </button>
                        </div>
                      )}

                      {!isCurrent && !isCompleted && (
                        <p className="text-xs ui-text-muted">
                          Upcoming mission. Complete prior missions in order before recording completion.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
