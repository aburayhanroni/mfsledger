'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0E0F14] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#12131A] rounded-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-sm bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800/40 shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Something went wrong</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            An unexpected error occurred while loading ledger data.
          </p>
          {error?.message && (
            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-sm text-[11px] font-mono text-slate-600 dark:text-slate-400 text-left overflow-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <button
          onClick={() => reset()}
          className="w-full h-10 px-4 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] active:scale-[0.98] text-slate-950 rounded-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}

