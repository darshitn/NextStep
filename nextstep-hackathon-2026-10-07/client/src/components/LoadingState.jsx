import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading your practice plan...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-brand-500/40 animate-ping" />
        </div>
      </div>
      <p className="text-slate-300 font-medium text-sm tracking-wide">{message}</p>
      <p className="text-slate-500 text-xs mt-1">Calibrating deterministic schedule...</p>
    </div>
  );
}
