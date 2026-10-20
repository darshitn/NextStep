import React, { Component, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

function useTemporaryDialog(onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current?.(); }
      if (event.key !== 'Tab') return;
      const buttons = [...(dialogRef.current?.querySelectorAll('button:not(:disabled)') || [])];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return dialogRef;
}

/**
 * ChunkErrorBoundary catches dynamic import / chunk loading errors in React 18.
 * It provides an accessible error fallback (role="alert") and a retry callback.
 */
export class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Surface diagnostic information without breaking logging hygiene
    console.warn(
      `[AsyncViewBoundary] Chunk load error for "${this.props.label || 'view'}":`,
      error?.message
    );
  }

  handleRetry = () => {
    this.setState({ error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry
        });
      }

      if (this.props.isModal) {
        return (
          <ModalErrorFallback
            label={this.props.label}
            error={this.state.error}
            onRetry={this.handleRetry}
            onClose={this.props.onClose}
          />
        );
      }

      return (
        <ViewErrorFallback
          label={this.props.label}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Accessible inline loading state matching NextStep theme.
 */
export function ViewLoadingFallback({ label = 'workspace view' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center min-h-[340px] py-16 px-4 animate-fade-in text-center"
      data-testid="async-view-loading"
    >
      <span className="sr-only">Loading {label}...</span>
      <div className="relative mb-4">
        <div className="w-10 h-10 rounded-full border-2 ui-border-border-a20 border-t-brand-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full ui-bg-soft-a40 animate-ping" />
        </div>
      </div>
      <p className="ui-text-ink font-semibold text-sm tracking-wide">
        Loading {label}...
      </p>
      <p className="text-xs ui-text-muted mt-1">Preparing your workspace</p>
    </div>
  );
}

/**
 * Accessible modal loading state for heavy dialogs.
 */
export function ModalLoadingFallback({ label = 'dialog', onClose }) {
  const dialogRef = useTemporaryDialog(onClose);
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Loading ${label}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="async-modal-loading"
    >
      <div className="relative w-full max-w-md rounded-2xl border ui-border-border ui-bg-surface shadow-2xl p-8 flex flex-col items-center text-center">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:ui-bg-soft ui-text-muted hover:ui-text-ink transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 ui-border-border-a20 border-t-brand-500 animate-spin mb-4" />
          <p className="ui-text-ink font-semibold text-base">Loading {label}...</p>
          <p className="text-xs ui-text-muted mt-1">Preparing your study workspace</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Accessible error state with visible retry action for workspace views.
 */
export function ViewErrorFallback({ label = 'workspace view', error, onRetry }) {
  const message = error?.message || 'Unable to download workspace view module.';
  return (
    <div
      role="alert"
      className="glass-panel ui-border-border-a30 ui-bg-soft rounded-2xl p-6 sm:p-8 my-8 text-center max-w-lg mx-auto shadow-xl"
      data-testid="async-view-error"
    >
      <div className="w-12 h-12 rounded-full ui-bg-surface border ui-border-border flex items-center justify-center mx-auto mb-4 text-amber-500 dark:text-amber-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold ui-text-ink mb-1">
        Unable to load {label}
      </h3>
      <p className="text-xs sm:text-sm ui-text-muted leading-relaxed mb-4">
        NextStep could not retrieve this view over the network. This can happen if your connection was interrupted or a new version was published.
      </p>
      {message && (
        <p className="text-[11px] font-mono ui-text-muted/80 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-lg mb-5 overflow-hidden text-ellipsis whitespace-nowrap">
          {message}
        </p>
      )}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          data-testid="async-retry-button"
        >
          <RefreshCw className="w-4 h-4" />
          Retry loading
        </button>
      </div>
    </div>
  );
}

/**
 * Accessible error state with visible retry action for dialogs.
 */
export function ModalErrorFallback({ label = 'dialog', error, onRetry, onClose }) {
  const dialogRef = useTemporaryDialog(onClose);
  const message = error?.message || 'Unable to download dialog module.';
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Error loading ${label}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="async-modal-error"
    >
      <div className="relative w-full max-w-md rounded-2xl border ui-border-border ui-bg-surface shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:ui-bg-soft ui-text-muted hover:ui-text-ink transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div role="alert" className="flex flex-col items-center w-full">
          <div className="w-12 h-12 rounded-full ui-bg-soft flex items-center justify-center mb-3 text-amber-500 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold ui-text-ink mb-1">
            Unable to open {label}
          </h3>
          <p className="text-xs ui-text-muted mb-4 leading-relaxed">
            This dialog could not be opened. Check your network connection and retry.
          </p>
          {message && (
            <p className="text-[11px] font-mono ui-text-muted/80 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-lg mb-5 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
              {message}
            </p>
          )}
          <div className="flex items-center gap-3 w-full justify-center">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border ui-border-border hover:ui-bg-soft ui-text-ink transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              data-testid="async-retry-button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry loading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * createLazyView creates a lazy-loaded component wrapper with fresh retry re-instantiation,
 * avoiding React 18's cached promise rejection pitfall.
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} importer
 * @param {string} viewLabel
 * @param {{ isModal?: boolean }} [options]
 */
export function createLazyView(importer, viewLabel, options = {}) {
  let lastFailedUrl = null;
  let loadedModule = null;

  const robustImporter = async () => {
    if (loadedModule) return loadedModule;
    try {
      if (lastFailedUrl) {
        // Bust browser's native ES module cache when retrying after a failed chunk fetch
        const cleanUrl = lastFailedUrl.split('?')[0];
        const freshUrl = `${cleanUrl}?retry=${Date.now()}`;
        loadedModule = await import(/* @vite-ignore */ freshUrl);
        return loadedModule;
      }
      loadedModule = await importer();
      return loadedModule;
    } catch (err) {
      const match = err?.message?.match(/https?:\/\/[^\s'")]+/);
      if (match) {
        const candidate = new URL(match[0], window.location.href);
        // Error text must never turn retry into an import from another origin.
        if (candidate.origin === window.location.origin && /\.[cm]?jsx?$/.test(candidate.pathname)) {
          lastFailedUrl = candidate.href;
        }
      }
      throw err;
    }
  };

  return function LazyViewWrapper(props) {
    const [retryKey, setRetryKey] = useState(0);

    // Re-instantiate React.lazy upon retry to avoid React 18 caching rejected promise state
    const LazyComponent = useMemo(() => React.lazy(robustImporter), [retryKey]);

    const handleRetry = useCallback(() => {
      setRetryKey((k) => k + 1);
    }, []);

    // A pending import may finish after cancellation; a closed modal must stay closed.
    if (options.isModal && !props.isOpen && !loadedModule) return null;

    const loadingFallback = options.isModal ? (
      <ModalLoadingFallback label={viewLabel} onClose={props.onClose} />
    ) : (
      <ViewLoadingFallback label={viewLabel} />
    );

    return (
      <ChunkErrorBoundary
        key={retryKey}
        label={viewLabel}
        isModal={Boolean(options.isModal)}
        onClose={props.onClose}
        onRetry={handleRetry}
      >
        <React.Suspense fallback={loadingFallback}>
          <LazyComponent {...props} />
        </React.Suspense>
      </ChunkErrorBoundary>
    );
  };
}
