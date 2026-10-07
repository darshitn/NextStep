import React from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import AppearanceControl from './AppearanceControl.jsx';
import { Compass, Sparkles, LogOut, User, ShieldAlert, Cpu } from 'lucide-react';

export default function AppShell({ user, onSignOut, isFixtureMode = true, sessionExpired = false, onRenewSession, children }) {
  return (
    <div className="min-h-screen flex flex-col ui-bg-page ui-text-ink">
      {/* Session Expired Banner */}
      {sessionExpired && (
        <div className="ui-bg-soft-a20 border-b ui-border-border-a40 ui-text-ink px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 ui-text-ink shrink-0" />
            <span>Your session has expired. Please sign in again to continue saving practice progress.</span>
          </div>
          {onRenewSession && (
            <button
              onClick={onRenewSession}
              className="px-2.5 py-1 ui-bg-soft-a30 hover:ui-bg-soft-a50 rounded font-medium transition-colors text-xs"
            >
              Sign In Again
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b ui-border-border px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl ui-bg-accent flex items-center justify-center shadow-glow">
            <Compass className="w-5 h-5 ui-text-inverse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight ui-text-ink">
                NextStep
              </span>
              {isFixtureMode && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ui-bg-soft-a20 ui-text-ink rounded-full border ui-border-border-a40 flex items-center gap-1 shadow-sm">
                  <Cpu className="w-2.5 h-2.5" />
                  Fixture Mode
                </span>
              )}
            </div>
            <p className="text-[11px] ui-text-muted hidden sm:block">Your goal, one doable step at a time</p>
          </div>
        </div>

        {/* Right side status / user */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          <AppearanceControl />
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg ui-bg-surface-a80 border ui-border-border text-xs ui-text-ink">
            <Sparkles className="w-3.5 h-3.5 ui-text-ink" />
            <span className="font-medium ui-text-ink">Track:</span>
            <span>DSA Foundations (12 missions)</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl ui-bg-surface-a90 border ui-border-border text-xs">
                <div className="w-5 h-5 rounded-full ui-bg-soft-a30 ui-text-ink flex items-center justify-center font-semibold text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <span className="font-medium ui-text-ink max-w-[140px] truncate">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out"
                className="p-2 rounded-xl ui-text-muted hover:ui-text-ink hover:ui-bg-surface border border-transparent hover:ui-border-border transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs ui-text-muted">Not signed in</span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t ui-border-border glass-panel py-6 px-4 text-center text-xs ui-text-muted">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 NextStep. Small steps. Real progress. Current track: DSA Foundations.</p>
          <div className="flex items-center gap-4 ui-text-muted">
            <span>Deterministic Scheduler</span>
            <span>•</span>
            <span>Asia/Kolkata Timezone</span>
            <span>•</span>
            <span>Self-Reported Progress</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
