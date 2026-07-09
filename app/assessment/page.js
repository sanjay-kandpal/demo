"use client";

import { useRef, useState } from "react";

const initialValues = {
  age: "",
  dependents: "",
  employment: "",
  monthlyIncome: "",
  otherIncome: "",
  existingMonthlyDebt: "",
  creditCardMinimums: "",
  requestedLoanAmount: "",
  financingRatePercent: "",
  requestedTenureYears: "",
  aecbScore: "",
  housingSituation: "",
  firstTimeBeneficiary: false,
};

const vulnerabilityOptions = [
  { id: "disability", label: "Person with disability in household" },
  { id: "elderly", label: "Elderly member (60+) with no other support" },
  { id: "single_parent", label: "Single-parent household" },
  { id: "widowed", label: "Widowed applicant" },
  { id: "unemployed_spouse", label: "Unemployed spouse / sole earner" },
  { id: "chronic_illness", label: "Chronic illness in household" },
];

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

export default function AssessmentPage() {
  const formRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateValue = (event) => {
    const { id, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  const toggleVulnerability = (id) => {
    setVulnerabilities((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    const form = formRef.current;
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

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

  const style = result ? categoryStyles[result.decision.category] : null;

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <header className="bg-surface w-full top-0 sticky border-b border-outline-variant z-50">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
          <span className="font-headline-md text-headline-md font-bold text-primary">ADHA</span>
          <span className="font-label-bold text-label-bold text-on-surface-variant">
            Financial Feasibility &amp; Social Priority Assessment
          </span>
        </div>
      </header>

      <main className="flex-grow py-12 md:py-16 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto w-full">
        <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 md:p-12">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
            Loan Assessment
          </h1>
          <p className="text-body-md text-on-surface-variant mb-8">
            Enter applicant details to compute the financial feasibility and social
            priority decision.
          </p>

          <form className="space-y-10" id="assessment-form" ref={formRef}>
            <div>
              <h2 className="font-headline-md text-headline-md text-primary mb-6">
                Personal &amp; Household
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="age">
                    Age
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="age"
                    min="18"
                    max="80"
                    required
                    type="number"
                    value={values.age}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="dependents">
                    Number of Dependants
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="dependents"
                    min="0"
                    required
                    type="number"
                    value={values.dependents}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="housingSituation">
                    Housing Situation
                  </label>
                  <select
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="housingSituation"
                    required
                    value={values.housingSituation}
                    onChange={updateValue}
                  >
                    <option value="" disabled>Select situation</option>
                    <option value="owns_adequate">Owns adequate home</option>
                    <option value="renting_adequate">Renting – adequate</option>
                    <option value="family_adequate">Living with family – adequate</option>
                    <option value="renting_overcrowded">Renting – overcrowded</option>
                    <option value="family_overcrowded">Living with family – overcrowded</option>
                    <option value="inadequate_unsafe">Inadequate / unsafe</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-headline-md text-headline-md text-primary mb-6">
                Income &amp; Employment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="employment">
                    Employment Type
                  </label>
                  <select
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="employment"
                    required
                    value={values.employment}
                    onChange={updateValue}
                  >
                    <option value="" disabled>Select employment</option>
                    <option value="government">Government</option>
                    <option value="private">Private Sector</option>
                    <option value="business">Business Owner</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="monthlyIncome">
                    Monthly Gross Income (AED)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="monthlyIncome"
                    required
                    type="number"
                    value={values.monthlyIncome}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="otherIncome">
                    Other Monthly Income (AED)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="otherIncome"
                    type="number"
                    value={values.otherIncome}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="aecbScore">
                    AECB Score (300–900)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="aecbScore"
                    min="300"
                    max="900"
                    required
                    type="number"
                    value={values.aecbScore}
                    onChange={updateValue}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-headline-md text-headline-md text-primary mb-6">
                Debt &amp; Requested Financing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="existingMonthlyDebt">
                    Existing Monthly Debt (AED)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="existingMonthlyDebt"
                    type="number"
                    value={values.existingMonthlyDebt}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="creditCardMinimums">
                    Credit Card Minimums (AED)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="creditCardMinimums"
                    type="number"
                    value={values.creditCardMinimums}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedLoanAmount">
                    Requested Loan Amount (AED)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="requestedLoanAmount"
                    required
                    type="number"
                    value={values.requestedLoanAmount}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="financingRatePercent">
                    Financing / Profit Rate (% p.a.)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="financingRatePercent"
                    required
                    step="0.01"
                    type="number"
                    value={values.financingRatePercent}
                    onChange={updateValue}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedTenureYears">
                    Requested Tenure (Years)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4"
                    id="requestedTenureYears"
                    min="1"
                    max="30"
                    required
                    type="number"
                    value={values.requestedTenureYears}
                    onChange={updateValue}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-headline-md text-headline-md text-primary mb-6">
                Social &amp; Impact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    className="w-5 h-5"
                    id="firstTimeBeneficiary"
                    type="checkbox"
                    checked={values.firstTimeBeneficiary}
                    onChange={updateValue}
                  />
                  <span className="font-body-md text-on-surface">
                    First-time housing-support beneficiary
                  </span>
                </label>
              </div>
              <p className="font-label-bold text-label-bold text-on-surface mb-3">
                Vulnerability flags (select all that apply)
              </p>
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
                onClick={submit}
              >
                {loading ? "Assessing…" : "Submit Assessment"}
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
                <span className={`material-symbols-outlined text-[32px] ${style.iconClass}`}>
                  {style.icon}
                </span>
                <div>
                  <h3 className={`font-headline-md text-headline-md mb-1 ${style.title}`}>
                    {result.decision.decision}
                  </h3>
                  <p className="text-body-md text-on-surface-variant">
                    {result.explanation.summary}
                  </p>
                </div>
              </div>

              {result.eligible ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Grant</p>
                      <p className="font-headline-md text-headline-md text-primary">
                        {result.decision.grantPercent}%
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Target DBR</p>
                      <p className="font-headline-md text-headline-md text-primary">
                        {result.decision.targetDbr != null
                          ? `${Math.round(result.decision.targetDbr * 100)}%`
                          : "n/a"}
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Tenure</p>
                      <p className="font-headline-md text-headline-md text-primary">
                        {result.decision.tenure}
                      </p>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
                      <p className="text-label-sm text-on-surface-variant">Applied tenure</p>
                      <p className="font-headline-md text-headline-md text-primary">
                        {result.decision.appliedTenureYears}y
                      </p>
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
      </main>
    </div>
  );
}
