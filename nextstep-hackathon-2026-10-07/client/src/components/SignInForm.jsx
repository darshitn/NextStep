import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, UserCheck, Sparkles, Loader2 } from 'lucide-react';

export default function SignInForm({ onSignIn, demoAccounts = [], isLoading = false, error = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    onSignIn(email, password);
  };

  const handleSelectDemo = (demo) => {
    setEmail(demo.email);
    setPassword('demo123456');
    onSignIn(demo.email, 'demo123456');
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold ui-text-ink tracking-tight">
          Welcome to NextStep
        </h1>
        <p className="text-sm ui-text-muted">
          Make time for your goal, one manageable step at a time. Start with our DSA Foundations track.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1.5">
              Student Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm ui-text-ink placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm ui-text-ink placeholder-slate-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs ui-text-ink font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ui-bg-accent hover:ui-bg-accent ui-text-inverse font-semibold text-sm transition-all shadow-glow disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to NextStep</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick-Select Accounts */}
        {demoAccounts.length > 0 && (
          <div className="pt-4 border-t ui-border-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold ui-text-ink flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 ui-text-ink" />
                Quick Test Personas
              </span>
              <span className="ui-text-muted text-[11px]">One-click login</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((demo) => (
                <button
                  type="button"
                  key={demo.email}
                  onClick={() => handleSelectDemo(demo)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-xl ui-bg-soft-a60 hover:ui-bg-surface border ui-border-border hover:ui-border-border-a30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs ui-text-ink group-hover:ui-text-ink">
                      {demo.name}
                    </span>
                    <span className="text-[10px] font-mono ui-text-muted group-hover:ui-text-muted">
                      Select
                    </span>
                  </div>
                  <p className="text-[11px] ui-text-muted mt-0.5 leading-tight">
                    {demo.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
