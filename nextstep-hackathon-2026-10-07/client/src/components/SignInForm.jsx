import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Sparkles, Loader2, User, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SignInForm({
  onSignIn,
  onSignUp,
  isLoading = false,
  error = null,
  initialMode = 'signin'
}) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'check_email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [clientError, setClientError] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const displayedError = clientError || error;

  const handleSwitchMode = (nextMode) => {
    setMode(nextMode);
    setClientError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setClientError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setClientError('Please enter a valid student email address.');
      return;
    }
    if (!password) {
      setClientError('Please enter your password.');
      return;
    }
    onSignIn(cleanEmail, password);
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setClientError('Please enter a valid student email address.');
      return;
    }
    if (password.length < 6) {
      setClientError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setClientError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      const res = await onSignUp(cleanEmail, password, { fullName: fullName.trim() });
      if (res?.confirmationRequired) {
        setPendingEmail(cleanEmail);
        setMode('check_email');
      }
    } catch {
      // Server error passed via error prop
    }
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold ui-text-ink tracking-tight font-heading">
          {mode === 'check_email'
            ? 'Check Your Email'
            : mode === 'signup'
            ? 'Create Your NextStep Account'
            : 'Welcome Back to NextStep'}
        </h1>
        <p className="text-xs sm:text-sm ui-text-muted max-w-sm mx-auto">
          {mode === 'check_email'
            ? 'Confirm your email to begin your DSA practice track.'
            : mode === 'signup'
            ? 'Start your self-paced DSA foundations track with daily 30-minute missions.'
            : 'Sign in to continue your DSA practice schedule and saved notes.'}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass space-y-5 relative">
        {/* Sign In / Create Account Tab Switcher (hidden when on check_email) */}
        {mode !== 'check_email' && (
          <div className="flex p-1 rounded-xl ui-bg-soft border ui-border-border" role="tablist" aria-label="Authentication modes">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => handleSwitchMode('signin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'ui-bg-surface ui-text-ink shadow-sm border ui-border-border'
                  : 'ui-text-muted hover:ui-text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => handleSwitchMode('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'ui-bg-surface ui-text-ink shadow-sm border ui-border-border'
                  : 'ui-text-muted hover:ui-text-ink'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* --- View 1: Check Your Email (Confirmation Required) --- */}
        {mode === 'check_email' ? (
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl ui-bg-soft border ui-border-border flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Mail className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold ui-text-ink">Confirmation link sent</h2>
              <p className="text-xs ui-text-muted leading-relaxed">
                We sent a secure activation link to:
              </p>
              <p className="text-xs font-mono font-semibold ui-text-ink bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-1 px-2.5 inline-block">
                {pendingEmail || email}
              </p>
            </div>

            <div className="p-3.5 rounded-xl ui-bg-soft border ui-border-border text-left text-xs ui-text-muted space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold ui-text-ink">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Next steps:</span>
              </div>
              <p className="leading-relaxed">
                1. Open the confirmation link in your inbox.
              </p>
              <p className="leading-relaxed">
                2. You will be redirected back to NextStep with your account confirmed.
              </p>
              <p className="text-[11px] ui-text-muted pt-1 border-t ui-border-border">
                Can't find the email? Check your Spam/Junk folder or wait 60 seconds.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSwitchMode('signin')}
              className="w-full py-2.5 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border text-xs font-semibold ui-text-ink transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : mode === 'signup' ? (
          /* --- View 2: Create Account Form --- */
          <form onSubmit={handleSignUpSubmit} className="space-y-4 animate-fade-in">
            <div>
              <label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1">
                Full Name <span className="text-[10px] ui-text-muted font-normal">(optional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-name"
                  type="text"
                  maxLength={60}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  disabled={isLoading}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm ui-text-ink"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1">
                Student Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  disabled={isLoading}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm ui-text-ink"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider ui-text-ink">
                  Password <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] ui-text-muted">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm ui-text-ink"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm ui-text-ink"
                />
              </div>
            </div>

            {displayedError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{displayedError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ui-bg-accent ui-text-inverse font-semibold text-xs sm:text-sm hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs ui-text-muted pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('signin')}
                className="font-semibold ui-text-ink underline hover:opacity-80"
              >
                Sign in here
              </button>
            </p>
          </form>
        ) : (
          /* --- View 3: Sign In Form --- */
          <form onSubmit={handleSignInSubmit} className="space-y-4 animate-fade-in">
            <div>
              <label htmlFor="signin-email" className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1">
                Student Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  disabled={isLoading}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm ui-text-ink"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signin-password" className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 ui-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm ui-text-ink"
                />
              </div>
            </div>

            {displayedError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{displayedError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl ui-bg-accent ui-text-inverse font-semibold text-xs sm:text-sm hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
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

            <p className="text-center text-xs ui-text-muted pt-2">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('signup')}
                className="font-semibold ui-text-ink underline hover:opacity-80"
              >
                Create account
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Security notice */}
      <p className="text-center text-[11px] ui-text-muted max-w-xs mx-auto flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Authenticated directly via Supabase Auth. Your data remains isolated.</span>
      </p>
    </div>
  );
}
