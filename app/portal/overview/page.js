"use client";

// Placeholder — content to be defined.
export default function OverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Overview</h2>
        <p className="text-body-md text-on-surface-variant">
          A summary of portal activity will appear here.
        </p>
      </div>

      <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-16 text-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/60 mb-4">insights</span>
        <p className="font-label-bold text-label-bold text-on-surface mb-1">Nothing here yet</p>
        <p className="text-label-sm text-on-surface-variant">This page is a placeholder — content coming soon.</p>
      </div>
    </div>
  );
}
