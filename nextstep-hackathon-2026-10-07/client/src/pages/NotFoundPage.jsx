import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="py-20 text-center space-y-4 max-w-md mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl ui-bg-surface border ui-border-border flex items-center justify-center mx-auto ui-text-ink">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold ui-text-ink">Page Not Found</h1>
      <p className="text-sm ui-text-muted">
        The requested path does not exist in the NextStep curriculum.
      </p>
      <div className="pt-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ui-bg-accent hover:ui-bg-accent ui-text-inverse text-xs sm:text-sm font-semibold transition-all shadow-glow"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
