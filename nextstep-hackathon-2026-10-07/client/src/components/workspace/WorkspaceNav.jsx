import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Compass,
  Code2,
  ExternalLink,
  ListOrdered,
  RotateCcw,
  TrendingUp,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: Calendar, primary: true },
  { id: 'week', label: 'Week', icon: Calendar, primary: false },
  { id: 'atlas', label: 'Atlas', icon: Compass, primary: true },
  { id: 'proof', label: 'Proof', icon: Code2, primary: true },
  { id: 'practice', label: 'Practice', icon: ExternalLink, primary: true },
  { id: 'roadmap', label: 'Roadmap', icon: ListOrdered, primary: false },
  { id: 'review', label: 'Review', icon: RotateCcw, showBadge: true, primary: false },
  { id: 'insights', label: 'Insights', icon: TrendingUp, primary: false }
];

export default function WorkspaceNav({ activeView, onSelectView, unresolvedReviewCount = 0 }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const triggerRef = useRef(null);

  // Close more menu on click outside or escape key with focus restoration
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && moreOpen) {
        e.preventDefault();
        setMoreOpen(false);
        triggerRef.current?.focus();
      }
    }
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
        // Avoid blanket focus changes for ordinary pointer outside clicks
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreOpen]);

  const activeItem = NAV_ITEMS.find((item) => item.id === activeView);
  const isMoreItemActive = activeItem && !activeItem.primary;
  const secondaryItems = NAV_ITEMS.filter((item) => !item.primary);

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setMoreOpen(true);
      requestAnimationFrame(() => {
        const firstItem = moreRef.current?.querySelector('[role="menuitem"]');
        firstItem?.focus();
      });
    }
  };

  const handleMenuItemKeyDown = (e, index) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setMoreOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const menuItems = moreRef.current?.querySelectorAll('[role="menuitem"]');
    if (!menuItems || menuItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % menuItems.length;
      menuItems[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + menuItems.length) % menuItems.length;
      menuItems[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      menuItems[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    }
  };

  const handleSelectSecondary = (itemId) => {
    setMoreOpen(false);
    onSelectView(itemId);
    // Shift focus to the destination view / heading to prevent stranding in body;
    // poll across animation frames to accommodate asynchronous chunk loading.
    const tryFocus = (attempt = 0) => {
      const target =
        document.getElementById(`view-${itemId}`) ||
        document.getElementById(`${itemId}-heading`) ||
        document.querySelector(`#view-${itemId} [role="region"], #view-${itemId} h1, #view-${itemId} h2`);
      if (target) {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: false });
      } else if (attempt < 20) {
        requestAnimationFrame(() => tryFocus(attempt + 1));
      }
    };
    requestAnimationFrame(() => tryFocus(0));
  };

  return (
    <nav className="workspace-nav" aria-label="Workspace views">
      {/* 1. Desktop Rail (Visible on >= 768px via CSS) */}
      <div className="workspace-nav-desktop">
        <div className="workspace-nav-list" role="tablist" aria-orientation="vertical">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const hasBadge = item.showBadge && unresolvedReviewCount > 0;

            return (
              <button
                key={item.id}
                type="button"
                id={`nav-${item.id}`}
                role="tab"
                aria-selected={isActive}
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
      </div>

      {/* 2. Mobile Compact Navigation Bar (Visible on < 768px via CSS) */}
      <div className="workspace-nav-mobile">
        <div className="workspace-nav-mobile-bar" role="tablist">
          {/* Primary View Buttons */}
          {NAV_ITEMS.filter((item) => item.primary).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={`mobile-${item.id}`}
                type="button"
                id={`mobile-nav-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={`workspace-nav-mobile-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setMoreOpen(false);
                  onSelectView(item.id);
                }}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* More Menu Trigger */}
          <div className="workspace-nav-more-wrap" ref={moreRef}>
            <button
              ref={triggerRef}
              type="button"
              id="nav-more-trigger"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label={isMoreItemActive ? `More views (current: ${activeItem.label})` : 'More navigation views'}
              className={`workspace-nav-mobile-btn ${isMoreItemActive ? 'active' : ''}`}
              onClick={() => {
                setMoreOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    requestAnimationFrame(() => {
                      const firstItem = moreRef.current?.querySelector('[role="menuitem"]');
                      firstItem?.focus();
                    });
                  }
                  return next;
                });
              }}
              onKeyDown={handleTriggerKeyDown}
            >
              <MoreHorizontal size={15} aria-hidden="true" />
              <span>More</span>
              <ChevronDown size={11} aria-hidden="true" className={moreOpen ? 'rotate-180' : ''} />
              {unresolvedReviewCount > 0 && !isMoreItemActive && (
                <span className="workspace-nav-btn-badge">{unresolvedReviewCount}</span>
              )}
            </button>

            {/* Accessible Dropdown Menu */}
            {moreOpen && (
              <div
                className="workspace-nav-dropdown"
                role="menu"
                aria-label="Additional workspace views"
              >
                {secondaryItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  const hasBadge = item.showBadge && unresolvedReviewCount > 0;

                  return (
                    <button
                      key={`menu-${item.id}`}
                      type="button"
                      id={`menu-nav-${item.id}`}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                      className={`workspace-nav-menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectSecondary(item.id)}
                      onKeyDown={(e) => handleMenuItemKeyDown(e, idx)}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{item.label}</span>
                      {hasBadge && (
                        <span className="workspace-nav-btn-badge ml-auto">
                          {unresolvedReviewCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
