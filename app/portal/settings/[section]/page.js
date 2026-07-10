"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveEngineConfigOverride } from "@/lib/assessment/engineConfigStorage";
import {
  getSection,
  savedDisplayState,
  defaultDisplayState,
  toOverride,
  weightSumOf,
} from "../sections";

function Field({ label, suffix, value, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="font-label-bold text-label-bold text-on-surface mb-2">{label}</label>
      <div className="relative">
        <input
          className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function WeightSum({ sum }) {
  const ok = Math.abs(sum - 100) < 0.01;
  return (
    <p className={`text-label-sm font-label-bold mt-4 ${ok ? "text-primary" : "text-error"}`}>
      Sum: {sum.toFixed(1)}% {ok ? "✓" : "— must equal 100%"}
    </p>
  );
}

export default function SettingsSectionPage() {
  const params = useParams();
  const router = useRouter();
  const section = getSection(params.section);

  // Full display state so saving rebuilds the complete override; this page
  // only ever edits its own section's keys.
  const [d, setD] = useState(savedDisplayState);
  const [status, setStatus] = useState(null);

  if (!section) {
    return (
      <div className="bg-surface border border-surface-variant rounded-xl p-8 text-center">
        <p className="text-body-md text-on-surface-variant mb-4">Settings section not found.</p>
        <button
          className="text-secondary font-label-bold text-label-bold"
          type="button"
          onClick={() => router.push("/portal/settings")}
        >
          Back to Decision Engine Settings
        </button>
      </div>
    );
  }

  const set = (key) => (value) => {
    setD((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const sum = section.weightSum ? weightSumOf(d, section.weightSum) : null;
  const sumOk = sum === null || Math.abs(sum - 100) < 0.01;

  const handleSave = () => {
    if (!sumOk) {
      setStatus({ type: "error", message: "Component weights must sum to exactly 100% before saving." });
      return;
    }
    saveEngineConfigOverride(toOverride(d));
    setStatus({ type: "success", message: "Saved — applies to the next assessment run for any applicant." });
  };

  const handleReset = () => {
    const defaults = defaultDisplayState();
    setD((prev) => {
      const next = { ...prev };
      for (const field of section.fields) next[field.key] = defaults[field.key];
      return next;
    });
    setStatus({ type: "success", message: "Section reset to policy defaults — click Save Changes to apply." });
  };

  return (
    <div>
      <button
        className="flex items-center gap-1 text-secondary font-label-bold text-label-bold mb-6"
        type="button"
        onClick={() => router.push("/portal/settings")}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        All Decision Engine Settings
      </button>

      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-[32px] text-primary mt-1">{section.icon}</span>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">{section.title}</h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">{section.description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded transition-colors duration-300"
            type="button"
            onClick={handleReset}
          >
            Reset Section
          </button>
          <button
            className="bg-primary hover:bg-primary-container text-on-primary font-label-bold text-label-bold py-3 px-6 rounded transition-all duration-300"
            type="button"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`mb-8 p-4 rounded-lg border-l-4 ${
            status.type === "error"
              ? "border-error bg-error-container/20"
              : "border-primary bg-primary-container/10"
          } text-on-surface-variant`}
        >
          {status.message}
        </div>
      )}

      <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              suffix={field.suffix}
              value={d[field.key]}
              onChange={set(field.key)}
            />
          ))}
        </div>
        {sum !== null && <WeightSum sum={sum} />}
      </div>
    </div>
  );
}
