import React from 'react';
import { Compass, Sparkles, LogOut, User, ShieldAlert, Cpu } from 'lucide-react';

export default function AppShell({ user, onSignOut, isFixtureMode = true, sessionExpired = false, onRenewSession, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      {/* Session Expired Banner */}
      {sessionExpired && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Your session has expired. Please sign in again to continue saving practice progress.</span>
          </div>
          {onRenewSession && (
            <button
              onClick={onRenewSession}
              className="px-2.5 py-1 bg-amber-500/30 hover:bg-amber-500/50 rounded font-medium transition-colors text-xs"
            >
              Sign In Again
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-glow">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                NextStep
              </span>
              {isFixtureMode && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40 flex items-center gap-1 shadow-sm">
                  <Cpu className="w-2.5 h-2.5" />
                  Fixture Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">DSA Placement Copilot</p>
          </div>
        </div>

        {/* Right side status / user */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100/80 border border-slate-700/60 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-medium text-slate-200">Track:</span>
            <span>DSA Foundations (12 missions)</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100/90 border border-slate-700/60 text-xs">
                <div className="w-5 h-5 rounded-full bg-brand-500/30 text-brand-300 flex items-center justify-center font-semibold text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <span className="font-medium text-slate-200 max-w-[140px] truncate">
                  {user.name || user.email}
                </span>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-surface-100 border border-transparent hover:border-slate-700/60 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Not signed in</span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 glass-panel py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 NextStep. Curated DSA starter practice for campus placement preparation.</p>
          <div className="flex items-center gap-4 text-slate-400">
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
