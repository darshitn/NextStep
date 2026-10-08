import React from 'react';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function ErrorNotice({ error, onRetry, onDismiss }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message || 'An unexpected error occurred.';
  const code = error.code || (error.status ? `HTTP ${error.status}` : null);

  return (
    <div role="alert" className="glass-panel ui-border-border-a30 ui-bg-soft rounded-xl p-4 my-4 flex items-start gap-3 shadow-lg">
      <AlertCircle className="w-5 h-5 ui-text-ink shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold ui-text-ink">Unable to complete action</span>
          {code && (
            <span className="px-1.5 py-0.5 text-xs font-mono ui-bg-soft ui-text-ink rounded border ui-border-border-a50">
              {code}
            </span>
          )}
        </div>
        <p className="ui-text-ink-a90 mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ui-bg-soft hover:ui-bg-soft ui-text-ink rounded-lg border ui-border-border-a40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Action
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ui-text-ink-a60 hover:ui-text-ink transition-colors"
          title="Dismiss notice"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
