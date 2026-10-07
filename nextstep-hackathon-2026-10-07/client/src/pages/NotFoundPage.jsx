import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="py-20 text-center space-y-4 max-w-md mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-slate-700/60 flex items-center justify-center mx-auto text-brand-400">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
      <p className="text-sm text-slate-400">
        The requested path does not exist in the NextStep curriculum.
      </p>
      <div className="pt-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-glow"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
