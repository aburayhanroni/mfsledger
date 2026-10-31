import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0E0F14] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#12131A] rounded-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-sm bg-[#C5A880]/15 text-[#9E7B4F] dark:text-[#C5A880] flex items-center justify-center mx-auto border border-[#C5A880]/30 shadow-xs">
          <Store className="w-6 h-6" />
        </div>

        <div>
          <span className="text-2xl font-bold font-mono text-[#8C6B3F] dark:text-[#C5A880]">404</span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">Page Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            The page you requested does not exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-full h-10 px-4 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] active:scale-[0.98] text-slate-950 rounded-sm shadow-sm transition items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Mutual Ledger</span>
        </Link>
      </div>
    </div>
  );
}

