export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0E0F14] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-800 border-t-[#C5A880] rounded-full animate-spin"></div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading ledger...</span>
      </div>
    </div>
  );
}

