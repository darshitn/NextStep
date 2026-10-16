import React from 'react';
import { Calendar, ListOrdered, RotateCcw, TrendingUp } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'roadmap', label: 'Roadmap', icon: ListOrdered },
  { id: 'review', label: 'Review', icon: RotateCcw, showBadge: true },
  { id: 'insights', label: 'Insights', icon: TrendingUp }
];

export default function WorkspaceNav({ activeView, onSelectView, unresolvedReviewCount = 0 }) {
  return (
    <nav className="workspace-nav" aria-label="Workspace views">
      <div className="workspace-nav-list">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const hasBadge = item.showBadge && unresolvedReviewCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              id={`nav-${item.id}`}
              aria-current={isActive ? 'page' : undefined}
              className={`workspace-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectView(item.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              {hasBadge && (
                <span
                  className="workspace-nav-btn-badge"
                  aria-label={`${unresolvedReviewCount} review item${unresolvedReviewCount === 1 ? '' : 's'}`}
                >
                  {unresolvedReviewCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
