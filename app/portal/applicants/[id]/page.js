"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getApplicantById } from "@/lib/applicants";

const vulnerabilityOptions = [
  { id: "disability", label: "Person with disability in household" },
  { id: "elderly", label: "Elderly member (60+) with no other support" },
  { id: "single_parent", label: "Single-parent household" },
  { id: "widowed", label: "Widowed applicant" },
  { id: "unemployed_spouse", label: "Unemployed spouse / sole earner" },
  { id: "chronic_illness", label: "Chronic illness in household" },
];

const employmentLabels = {
  government: "Government",
  private: "Private Sector",
  business: "Business Owner",
  retired: "Retired",
};

const housingLabels = {
  owns_adequate: "Owns adequate home",
  renting_adequate: "Renting – adequate",
  family_adequate: "Living with family – adequate",
  renting_overcrowded: "Renting – overcrowded",
  family_overcrowded: "Living with family – overcrowded",
  inadequate_unsafe: "Inadequate / unsafe",
};

const categoryStyles = {
  approve: {
    border: "border-primary",
    bg: "bg-primary-container/10",
    icon: "check_circle",
    iconClass: "text-primary",
    title: "text-primary",
  },
  refer: {
    border: "border-secondary",
    bg: "bg-secondary-container/20",
    icon: "call_split",
    iconClass: "text-secondary",
    title: "text-secondary",
  },
  decline: {
    border: "border-error",
    bg: "bg-error-container/20",
    icon: "info",
    iconClass: "text-error",
    title: "text-error",
  },
};

function ScoreRow({ label, value, score, weight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-variant last:border-0">
      <div>
        <p className="font-label-bold text-label-bold text-on-surface">{label}</p>
        <p className="text-label-sm text-on-surface-variant">
          value: {String(value)} · weight {Math.round(weight * 100)}%
        </p>
      </div>
      <span className="font-headline-md text-headline-md text-primary">{score}</span>
    </div>
  );
}

export default function ApplicantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicant = getApplicantById(params.id);

  const formRef = useRef(null);
  const [proceeded, setProceeded] = useState(false);
  const [values, setValues] = useState(() =>
    applicant
      ? {
          age: applicant.age,
          dependents: applicant.dependents,
          employment: applicant.employment,
          monthlyIncome: applicant.monthlyIncome,
          otherIncome: applicant.otherIncome,
          existingMonthlyDebt: applicant.existingMonthlyDebt,
          creditCardMinimums: applicant.creditCardMinimums,
          requestedLoanAmount: applicant.requestedLoanAmount,
          financingRatePercent: applicant.financingRatePercent,
          requestedTenureYears: applicant.requestedTenureYears,
          aecbScore: applicant.aecbScore,
          housingSituation: applicant.housingSituation,
          firstTimeBeneficiary: applicant.firstTimeBeneficiary,
        }
      : {}
  );
  const [vulnerabilities, setVulnerabilities] = useState(applicant?.vulnerabilityFlags ?? []);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!applicant) {
    return (
      <div className="bg-surface border border-surface-variant rounded-xl p-8 text-center">
        <p className="text-body-md text-on-surface-variant mb-4">Applicant not found.</p>
        <button
          className="text-secondary font-label-bold text-label-bold"
          type="button"
          onClick={() => router.push("/portal")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const updateValue = (event) => {
    const { id, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  const toggleVulnerability = (id) => {
    setVulnerabilities((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const runAssessment = async () => {
    const form = formRef.current;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          vulnerabilityFlagCount: vulnerabilities.length,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.details ? data.details.join(" ") : data.error || "Assessment failed.");
        return;
      }
      setResult(data);
    } catch (err) {
      setError("Unable to reach the assessment service.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    setProceeded(true);
    runAssessment();
  };

  const style = result ? categoryStyles[result.decision.category] : null;

  return (
    <div>
      <button
        className="flex items-center gap-1 text-secondary font-label-bold text-label-bold mb-6"
        type="button"
        onClick={() => router.push("/portal")}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Dashboard
      </button>

      <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 md:p-12 mb-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-1">{applicant.fullName}</h1>
            <p className="text-body-md text-on-surface-variant">{applicant.emiratesId}</p>
          </div>
          <span className="inline-block bg-secondary-container text-on-secondary-container text-label-sm font-label-bold py-1 px-3 rounded-full h-fit">
            {applicant.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-surface-container-lowest rounded-lg p-4">
            <p className="text-label-sm text-on-surface-variant">Age</p>
            <p className="font-label-bold text-label-bold text-on-surface">{applicant.age}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4">
            <p className="text-label-sm text-on-surface-variant">Employment</p>
            <p className="font-label-bold text-label-bold text-on-surface">
              {employmentLabels[applicant.employment]}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4">
            <p className="text-label-sm text-on-surface-variant">Housing</p>
            <p className="font-label-bold text-label-bold text-on-surface">
              {housingLabels[applicant.housingSituation]}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4">
            <p className="text-label-sm text-on-surface-variant">Requested Loan</p>
            <p className="font-label-bold text-label-bold text-on-surface">
              AED {applicant.requestedLoanAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {!proceeded && (
          <div className="pt-6">
            <button
              className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary font-label-bold text-label-bold py-4 px-8 rounded transition-all duration-300 flex justify-center items-center gap-2 group"
              type="button"
              onClick={handleProceed}
            >
              Proceed to Assessment
              <svg
                aria-hidden="true"
                className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {proceeded && (
        <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 md:p-12">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Engine Assessment</h2>
          <p className="text-body-md text-on-surface-variant mb-8">
            Review and adjust the applicant&apos;s details, then recalculate to see the updated decision.
          </p>

          <form className="space-y-10" ref={formRef}>
            <div>
              <h3 className="font-headline-md text-headline-md text-primary mb-6">Personal &amp; Household</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="age">Age</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="age" min="18" max="80" required type="number" value={values.age} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="dependents">Number of Dependants</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="dependents" min="0" required type="number" value={values.dependents} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="housingSituation">Housing Situation</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="housingSituation" required value={values.housingSituation} onChange={updateValue}>
                    <option value="" disabled>Select situation</option>
                    {Object.entries(housingLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-headline-md text-headline-md text-primary mb-6">Income &amp; Employment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="employment">Employment Type</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="employment" required value={values.employment} onChange={updateValue}>
                    <option value="" disabled>Select employment</option>
                    {Object.entries(employmentLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="monthlyIncome">Monthly Gross Income (AED)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="monthlyIncome" required type="number" value={values.monthlyIncome} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="otherIncome">Other Monthly Income (AED)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="otherIncome" type="number" value={values.otherIncome} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="aecbScore">AECB Score (300–900)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="aecbScore" min="300" max="900" required type="number" value={values.aecbScore} onChange={updateValue} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-headline-md text-headline-md text-primary mb-6">Debt &amp; Requested Financing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="existingMonthlyDebt">Existing Monthly Debt (AED)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="existingMonthlyDebt" type="number" value={values.existingMonthlyDebt} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="creditCardMinimums">Credit Card Minimums (AED)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="creditCardMinimums" type="number" value={values.creditCardMinimums} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedLoanAmount">Requested Loan Amount (AED)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="requestedLoanAmount" required type="number" value={values.requestedLoanAmount} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="financingRatePercent">Financing / Profit Rate (% p.a.)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="financingRatePercent" required step="0.01" type="number" value={values.financingRatePercent} onChange={updateValue} />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedTenureYears">Requested Tenure (Years)</label>
                  <input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4" id="requestedTenureYears" min="1" max="30" required type="number" value={values.requestedTenureYears} onChange={updateValue} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-headline-md text-headline-md text-primary mb-6">Social &amp; Impact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input className="w-5 h-5" id="firstTimeBeneficiary" type="checkbox" checked={values.firstTimeBeneficiary} onChange={updateValue} />
                  <span className="font-body-md text-on-surface">First-time housing-support beneficiary</span>
                </label>
              </div>
              <p className="font-label-bold text-label-bold text-on-surface mb-3">Vulnerability flags (select all that apply)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vulnerabilityOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      className="w-5 h-5"
                      type="checkbox"
                      checked={vulnerabilities.includes(option.id)}
                      onChange={() => toggleVulnerability(option.id)}
                    />
                    <span className="text-body-md text-on-surface">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary font-label-bold text-label-bold py-4 px-8 rounded transition-all duration-300 disabled:opacity-50"
                disabled={loading}
                type="button"
                onClick={runAssessment}
              >
                {loading ? "Recalculating…" : "Recalculate Decision"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-8 p-4 rounded-lg border-l-4 border-error bg-error-container/20 text-on-surface-variant">
              {error}
            </div>
          )}

          {result && (
            <div className={`mt-10 p-6 md:p-8 rounded-lg border-l-4 ${style.border} ${style.bg}`}>
              <div className="flex items-start gap-4 mb-6">
                <span className={`material-symbols-outlined text-[32px] ${style.iconClass}`}>{style.icon}</span>
                <div>
                  <h3 className={`font-headline-md text-headline-md mb-1 ${style.title}`}>{result.decision.decision}</h3>
                  <p className="text-body-md text-on-surface-variant">{result.explanation.summary}</p>
                </div>
              </div>

              {result.eligible ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Grant</p>
                      <p className="font-headline-md text-headline-md text-primary">{result.decision.grantPercent}%</p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Target DBR</p>
                      <p className="font-headline-md text-headline-md text-primary">
                        {result.decision.targetDbr != null ? `${Math.round(result.decision.targetDbr * 100)}%` : "n/a"}
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Tenure</p>
                      <p className="font-headline-md text-headline-md text-primary">{result.decision.tenure}</p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Applied tenure</p>
                      <p className="font-headline-md text-headline-md text-primary">{result.decision.appliedTenureYears}y</p>
                    </div>
                  </div>

                  <p className="text-body-md text-on-surface-variant mb-8">
                    <span className="font-label-bold">Conditions:</span> {result.decision.conditions}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-label-bold text-label-bold text-on-surface mb-3">
                        Financial Feasibility — {result.financial.score} ({result.financial.band})
                      </h4>
                      <ScoreRow label="DBR (post-instalment)" value={`${Math.round(result.financial.components.dbr.value * 100)}%`} score={result.financial.components.dbr.score} weight={result.financial.components.dbr.weight} />
                      <ScoreRow label="Residual income / member" value={`AED ${result.financial.components.residualIncomePerMember.value}`} score={result.financial.components.residualIncomePerMember.score} weight={result.financial.components.residualIncomePerMember.weight} />
                      <ScoreRow label="AECB conduct" value={result.financial.components.aecbConduct.value} score={result.financial.components.aecbConduct.score} weight={result.financial.components.aecbConduct.weight} />
                      <ScoreRow label="Income stability" value={result.financial.components.incomeStability.value} score={result.financial.components.incomeStability.score} weight={result.financial.components.incomeStability.weight} />
                      <ScoreRow label="Stress resilience" value={`stressed DBR ${Math.round(result.financial.components.stressResilience.value * 100)}%`} score={result.financial.components.stressResilience.score} weight={result.financial.components.stressResilience.weight} />
                    </div>
                    <div>
                      <h4 className="font-label-bold text-label-bold text-on-surface mb-3">
                        Social Priority — {result.social.score} ({result.social.band})
                      </h4>
                      <ScoreRow label="Housing situation" value={result.social.components.housingSituation.value} score={result.social.components.housingSituation.score} weight={result.social.components.housingSituation.weight} />
                      <ScoreRow label="Dependants" value={result.social.components.dependants.value} score={result.social.components.dependants.score} weight={result.social.components.dependants.weight} />
                      <ScoreRow label="Income band" value={result.social.components.incomeBand.value} score={result.social.components.incomeBand.score} weight={result.social.components.incomeBand.weight} />
                      <ScoreRow label="Vulnerability flags" value={result.social.components.vulnerabilityFlags.value} score={result.social.components.vulnerabilityFlags.score} weight={result.social.components.vulnerabilityFlags.weight} />
                      <ScoreRow label="Expected impact" value={result.social.components.expectedImpact.value ? "First-time" : "Repeat"} score={result.social.components.expectedImpact.score} weight={result.social.components.expectedImpact.weight} />
                    </div>
                  </div>
                </>
              ) : (
                <ul className="list-disc list-inside text-body-md text-on-surface-variant space-y-1">
                  {result.gates.failures.map((failure) => (
                    <li key={failure}>{failure}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
