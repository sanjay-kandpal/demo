"use client";

import { useState } from "react";
import { clearEngineConfigOverride } from "@/lib/assessment/engineConfigStorage";
import { settingsSections } from "./sections";

export default function EngineSettingsPage() {
  const [status, setStatus] = useState(null);

  const handleResetAll = () => {
    clearEngineConfigOverride();
    setStatus({ type: "success", message: "All settings reset to policy defaults." });
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Decision Engine Settings</h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            Tune the financial-feasibility and social-priority policy parameters used by the
            decision engine. Pick a section below — changes apply the next time an assessment
            is run or recalculated.
          </p>
        </div>
        <button
          className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded transition-colors duration-300"
          type="button"
          onClick={handleResetAll}
        >
          Reset All to Defaults
        </button>
      </div>

      {status && (
        <div className="mb-8 p-4 rounded-lg border-l-4 border-primary bg-primary-container/10 text-on-surface-variant">
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <a
            key={section.slug}
            href={`/portal/settings/${section.slug}`}
            className="group bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-3 hover:border-secondary transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-lowest text-primary">
                <span className="material-symbols-outlined text-[22px]">{section.icon}</span>
              </span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary group-hover:translate-x-1 transition-all duration-200">
                chevron_right
              </span>
            </div>
            <p className="font-label-bold text-label-bold text-on-surface">{section.title}</p>
            <p className="text-label-sm text-on-surface-variant">{section.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
