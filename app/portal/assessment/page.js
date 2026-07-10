"use client";

import { useEffect, useMemo, useState } from "react";
import {
  incomeSources,
  defaultIncomeRows,
  defaultApplicantInputs,
  computeBeneficiaryAssessment,
} from "@/lib/assessment/beneficiaryEngine";
import { loadEngineConfigOverride } from "@/lib/assessment/engineConfigStorage";

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

const aed = (value) =>
  `AED ${Math.round(value).toLocaleString()}`;
const pct = (value, decimals = 1) => `${(value * 100).toFixed(decimals)}%`;
const score1 = (value) => (Math.round(value * 10) / 10).toLocaleString();

function StatusPill({ ok, okLabel = "Verified", pendingLabel = "Pending" }) {
  return (
    <span
      className={`inline-block text-label-sm font-label-bold py-1 px-3 rounded-full whitespace-nowrap ${
        ok
          ? "bg-primary-fixed text-on-primary-fixed"
          : "bg-secondary-container text-on-secondary-container"
      }`}
    >
      {ok ? okLabel : pendingLabel}
    </span>
  );
}

function GatePill({ pass }) {
  return (
    <span
      className={`inline-block text-label-sm font-label-bold py-1 px-3 rounded-full ${
        pass ? "bg-primary-fixed text-on-primary-fixed" : "bg-error-container text-on-error-container"
      }`}
    >
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function BandChip({ band }) {
  const styles = {
    High: "bg-primary-fixed text-on-primary-fixed",
    Medium: "bg-secondary-container text-on-secondary-container",
    Low: "bg-error-container text-on-error-container",
  };
  return (
    <span className={`inline-block text-label-sm font-label-bold py-1 px-3 rounded-full ${styles[band]}`}>
      {band}
    </span>
  );
}

// A single computed line mirroring one row of the Excel sheet: label on the
// left with the formula as a muted caption, value on the right.
function CalcRow({ label, formula, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-surface-variant last:border-0">
      <div className="min-w-0">
        <p className="font-label-bold text-label-bold text-on-surface">{label}</p>
        {formula && <p className="text-label-sm text-on-surface-variant font-mono mt-0.5">{formula}</p>}
      </div>
      <div className="text-right shrink-0 font-label-bold text-label-bold text-on-surface">{children}</div>
    </div>
  );
}

function ScoreRow({ label, formula, score, weight }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-surface-variant last:border-0">
      <div className="min-w-0">
        <p className="font-label-bold text-label-bold text-on-surface">
          {label} <span className="text-on-surface-variant font-normal">· weight {Math.round(weight * 100)}%</span>
        </p>
        {formula && <p className="text-label-sm text-on-surface-variant font-mono mt-0.5">{formula}</p>}
      </div>
      <span className="font-headline-md text-headline-md text-primary shrink-0">{score1(score)}</span>
    </div>
  );
}

function SectionCard({ title, subtitle, children, aside }) {
  return (
    <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="font-headline-md text-headline-md text-primary">{title}</h3>
          {subtitle && <p className="text-body-md text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4";

export default function BeneficiaryAssessmentPage() {
  const [incomeRows, setIncomeRows] = useState(defaultIncomeRows);
  const [inputs, setInputs] = useState(defaultApplicantInputs);
  const [editingKey, setEditingKey] = useState(null);
  const [configOverride, setConfigOverride] = useState(null);

  // Engine Settings overrides live in localStorage; read after mount to keep
  // the server and first client render identical.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfigOverride(loadEngineConfigOverride());
  }, []);

  const result = useMemo(
    () => computeBeneficiaryAssessment(incomeRows, inputs, configOverride || {}),
    [incomeRows, inputs, configOverride]
  );

  const allVerified = result.schedule.every((row) => row.gross <= 0 || row.verified);

  const updateIncomeRow = (key, patch) => {
    setIncomeRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const updateInput = (event) => {
    const { id, value, type, checked } = event.target;
    setInputs((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  };

  const style = categoryStyles[result.decision.category];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Beneficiary Assessment</h2>
          <p className="text-body-md text-on-surface-variant">
            Recognised-income basis. Edit the income schedule and inputs — results recompute automatically.
          </p>
        </div>
        <StatusPill
          ok={allVerified}
          okLabel="Income verified"
          pendingLabel="Pending verification"
        />
      </div>

      {/* INCOME SCHEDULE — Assessment rows 4–15 */}
      <SectionCard
        title="Income Schedule"
        subtitle="Recognised (AED) = IF(Verified = Yes, Gross × Recognition %, 0)"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-surface-variant">
                <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant">Income source</th>
                <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant text-right">Gross monthly (AED)</th>
                <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant text-right">Recognition %</th>
                <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant text-center">Verified?</th>
                <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant text-right">Recognised (AED)</th>
                <th className="py-3 px-4 font-label-bold text-label-bold text-on-surface-variant text-center">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {result.schedule.map((row) => {
                const editing = editingKey === row.key;
                return (
                  <tr key={row.key} className="border-b border-surface-variant hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-body-md text-on-surface">{row.label}</p>
                      <p className="text-label-sm text-on-surface-variant">{row.note}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editing ? (
                        <input
                          className={`${inputClass} !py-2 !px-3 text-right w-36`}
                          type="number"
                          min="0"
                          value={incomeRows[row.key].gross}
                          onChange={(e) => updateIncomeRow(row.key, { gross: e.target.value })}
                        />
                      ) : (
                        <span className="text-body-md text-on-surface">{row.gross.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-body-md text-on-surface-variant">
                      {Math.round(row.recognition * 100)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editing ? (
                        <div className="inline-flex rounded overflow-hidden border border-outline-variant">
                          <button
                            type="button"
                            className={`py-1.5 px-3 text-label-sm font-label-bold transition-colors ${
                              row.verified ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant"
                            }`}
                            onClick={() => updateIncomeRow(row.key, { verified: true })}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className={`py-1.5 px-3 text-label-sm font-label-bold transition-colors ${
                              !row.verified ? "bg-secondary text-on-secondary" : "bg-surface-container-lowest text-on-surface-variant"
                            }`}
                            onClick={() => updateIncomeRow(row.key, { verified: false })}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <span className="text-body-md text-on-surface">{row.verified ? "Yes" : "No"}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-label-bold text-label-bold text-on-surface">
                      {Math.round(row.recognised).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusPill ok={row.verified} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        aria-label={editing ? `Done editing ${row.label}` : `Edit ${row.label}`}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                          editing
                            ? "bg-primary text-on-primary"
                            : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
                        }`}
                        onClick={() => setEditingKey(editing ? null : row.key)}
                      >
                        <span className="material-symbols-outlined text-[20px]">{editing ? "check" : "edit"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-surface-container-lowest border-t-2 border-outline-variant">
                <td className="py-3 px-4 font-label-bold text-label-bold text-on-surface">TOTAL — gross / recognised</td>
                <td className="py-3 px-4 text-right font-label-bold text-label-bold text-on-surface">
                  {result.income.grossTotal.toLocaleString()}
                </td>
                <td colSpan={2}></td>
                <td className="py-3 px-4 text-right font-label-bold text-label-bold text-primary">
                  {Math.round(result.income.recognisedIncome).toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-surface-container-lowest">
                <td className="py-3 px-4" colSpan={4}>
                  <p className="font-label-bold text-label-bold text-on-surface">Blended income-stability score (0–100)</p>
                  <p className="text-label-sm text-on-surface-variant font-mono">= Σ(Recognised × Stability) ÷ Σ(Recognised)</p>
                </td>
                <td className="py-3 px-4 text-right font-headline-md text-headline-md text-primary">
                  {score1(result.income.incomeStabilityScore)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* APPLICANT & LOAN INPUTS — Assessment rows 17–29 */}
      <SectionCard title="Applicant &amp; Loan Inputs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="applicantName">Applicant ID / name</label>
            <input className={inputClass} id="applicantName" type="text" value={inputs.applicantName} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="aecbScore">AECB credit score (300–900)</label>
            <input className={inputClass} id="aecbScore" type="number" min="300" max="900" value={inputs.aecbScore} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="age">Applicant age (years)</label>
            <input className={inputClass} id="age" type="number" min="18" max="80" value={inputs.age} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="householdMembers">Household members (count)</label>
            <input className={inputClass} id="householdMembers" type="number" min="1" value={inputs.householdMembers} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="dependents">Dependants (count)</label>
            <input className={inputClass} id="dependents" type="number" min="0" value={inputs.dependents} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="housingSituation">Housing situation</label>
            <select className={inputClass} id="housingSituation" value={inputs.housingSituation} onChange={updateInput}>
              {Object.entries(housingLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="vulnerabilityFlagCount">Vulnerability flags (0–4)</label>
            <input className={inputClass} id="vulnerabilityFlagCount" type="number" min="0" max="4" value={inputs.vulnerabilityFlagCount} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="existingMonthlyObligations">Existing monthly obligations (AED)</label>
            <input className={inputClass} id="existingMonthlyObligations" type="number" min="0" value={inputs.existingMonthlyObligations} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedLoanAmount">Loan amount requested (AED)</label>
            <input className={inputClass} id="requestedLoanAmount" type="number" min="0" value={inputs.requestedLoanAmount} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="financingRatePercent">Financing rate (% p.a.) — 0 for qard hasan</label>
            <input className={inputClass} id="financingRatePercent" type="number" min="0" step="0.01" value={inputs.financingRatePercent} onChange={updateInput} />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedTenureYears">Proposed tenure (years)</label>
            <input className={inputClass} id="requestedTenureYears" type="number" min="1" max="30" value={inputs.requestedTenureYears} onChange={updateInput} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer self-end pb-3">
            <input className="w-5 h-5" id="firstTimeBeneficiary" type="checkbox" checked={inputs.firstTimeBeneficiary} onChange={updateInput} />
            <span className="font-body-md text-on-surface">First-time beneficiary</span>
          </label>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FINANCIAL FEASIBILITY — Assessment rows 31–44 */}
        <SectionCard
          title="Financial Feasibility"
          aside={
            <div className="text-right">
              <p className="font-headline-lg text-headline-lg text-primary">{score1(result.financial.score)}</p>
              <BandChip band={result.financial.band} />
            </div>
          }
        >
          <CalcRow label="Recognised monthly income" formula="= Income Schedule total">
            {aed(result.income.recognisedIncome)}
          </CalcRow>
          <CalcRow label="Base instalment" formula="= PMT(rate ÷ 12, tenure × 12, −loan)">
            {aed(result.financial.installment)}
          </CalcRow>
          <CalcRow label="Post-instalment DBR" formula="= (obligations + instalment) ÷ recognised income">
            {pct(result.financial.dbr)}
          </CalcRow>
          <CalcRow label="Residual income" formula="= income − obligations − instalment">
            {aed(result.financial.residualIncome)}
          </CalcRow>
          <CalcRow label="Residual income per member" formula="= residual ÷ household members">
            {aed(result.financial.residualPerMember)}
          </CalcRow>

          <p className="font-label-bold text-label-bold text-on-surface-variant mt-6 mb-1">Component scores (0–100)</p>
          <ScoreRow
            label="DBR score"
            formula="100 @ ≤35% · 100→50 @ 35–50% · 50→0 @ 50%–ceiling"
            score={result.financial.components.dbr.score}
            weight={result.financial.components.dbr.weight}
          />
          <ScoreRow
            label="Residual score"
            formula="0→40 below floor (3,000) · 40→100 to comfortable (6,000)"
            score={result.financial.components.residual.score}
            weight={result.financial.components.residual.weight}
          />
          <ScoreRow
            label="AECB score"
            formula="0→40 from 300 to hard floor · 40→100 to 900"
            score={result.financial.components.aecb.score}
            weight={result.financial.components.aecb.weight}
          />
          <ScoreRow
            label="Income-stability score"
            formula="= blended score from income schedule"
            score={result.financial.components.incomeStability.score}
            weight={result.financial.components.incomeStability.weight}
          />
          <ScoreRow
            label="Stress-resilience score"
            formula="100 pass+age OK · 60 pass · 40 ≤ceiling · else 0"
            score={result.financial.components.stressResilience.score}
            weight={result.financial.components.stressResilience.weight}
          />

          <div className="mt-4 p-4 bg-surface-container-lowest rounded-lg">
            <p className="text-label-sm text-on-surface-variant font-mono mb-1">
              Stress test: instalment @ rate+3% = {aed(result.stress.stressedInstallment)} · income −20% = {aed(result.stress.stressedIncome)} · stressed DBR = {pct(result.stress.stressedDbr)}
            </p>
          </div>
        </SectionCard>

        {/* SOCIAL PRIORITY — Assessment rows 46–53 */}
        <SectionCard
          title="Social Priority"
          aside={
            <div className="text-right">
              <p className="font-headline-lg text-headline-lg text-primary">{score1(result.social.score)}</p>
              <BandChip band={result.social.band} />
            </div>
          }
        >
          <ScoreRow
            label="Housing-situation score"
            formula={`lookup: ${housingLabels[inputs.housingSituation]}`}
            score={result.social.components.housing.score}
            weight={result.social.components.housing.weight}
          />
          <ScoreRow
            label="Dependants score"
            formula="= MIN(100, dependants × 20)"
            score={result.social.components.dependants.score}
            weight={result.social.components.dependants.weight}
          />
          <ScoreRow
            label="Income-band score"
            formula={`bracket: ${result.social.components.incomeBand.label}`}
            score={result.social.components.incomeBand.score}
            weight={result.social.components.incomeBand.weight}
          />
          <ScoreRow
            label="Vulnerability score"
            formula="= MIN(100, flags × 25)"
            score={result.social.components.vulnerability.score}
            weight={result.social.components.vulnerability.weight}
          />
          <ScoreRow
            label="Expected-impact score"
            formula='= IF(first-time = "Yes", 100, 20)'
            score={result.social.components.expectedImpact.score}
            weight={result.social.components.expectedImpact.weight}
          />
        </SectionCard>
      </div>

      {/* ELIGIBILITY GATES — Assessment rows 55–61 */}
      <SectionCard
        title="Eligibility Gates"
        aside={<GatePill pass={result.gates.passed} />}
      >
        <CalcRow label="Age at maturity" formula="= age + proposed tenure">
          {result.gates.ageAtMaturity} years
        </CalcRow>
        <CalcRow label="Age gate" formula="age ≥ 21 AND age at maturity ≤ 70">
          <GatePill pass={result.gates.age} />
        </CalcRow>
        <CalcRow label="AECB gate" formula="AECB score ≥ hard floor">
          <GatePill pass={result.gates.aecb} />
        </CalcRow>
        <CalcRow label="DBR gate" formula="post-instalment DBR ≤ hard ceiling">
          <GatePill pass={result.gates.dbr} />
        </CalcRow>
        <CalcRow label="Gate detail">{result.gates.detail}</CalcRow>
      </SectionCard>

      {/* DECISION — Assessment rows 63–69 */}
      <div className={`p-6 md:p-8 rounded-xl border-l-4 ${style.border} ${style.bg}`}>
        <div className="flex items-start gap-4 mb-6">
          <span className={`material-symbols-outlined text-[32px] ${style.iconClass}`}>{style.icon}</span>
          <div>
            <h3 className={`font-headline-md text-headline-md mb-1 ${style.title}`}>{result.decision.decision}</h3>
            <p className="text-body-md text-on-surface-variant">
              Matrix key: <span className="font-mono font-bold">{result.decision.matrixKey}</span> — Financial band ×
              Social band lookup in the decision matrix.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
            <p className="text-label-sm text-on-surface-variant">Grant / subsidy</p>
            <p className="font-headline-md text-headline-md text-primary">{result.decision.grantPercent}%</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
            <p className="text-label-sm text-on-surface-variant">Target DBR (instalment cap)</p>
            <p className="font-headline-md text-headline-md text-primary">
              {result.decision.targetDbr != null ? pct(result.decision.targetDbr, 0) : "n/a"}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
            <p className="text-label-sm text-on-surface-variant">Tenure treatment</p>
            <p className="font-headline-md text-headline-md text-primary">{result.decision.tenure}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 text-center">
            <p className="text-label-sm text-on-surface-variant">Gates</p>
            <p className="font-headline-md text-headline-md text-primary">{result.gates.passed ? "Pass" : "Fail"}</p>
          </div>
        </div>
        <p className="text-body-md text-on-surface-variant">
          <span className="font-label-bold">Conditions:</span> {result.decision.conditions}
        </p>
      </div>

      {/* ENHANCED OUTCOME — Assessment rows 71–78 */}
      <SectionCard
        title="Enhanced Outcome — Mechanism Applied"
        aside={
          result.decision.targetDbr != null ? (
            <StatusPill
              ok={result.enhanced.meetsTargetDbr === "Yes"}
              okLabel="Meets target DBR"
              pendingLabel="Above target DBR"
            />
          ) : null
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
          <div>
            <CalcRow label="Grant amount" formula="= loan × grant %">
              {aed(result.enhanced.grantAmount)}
            </CalcRow>
            <CalcRow label="Financed amount after grant" formula="= loan − grant amount">
              {aed(result.enhanced.financedAmount)}
            </CalcRow>
            <CalcRow
              label="Enhanced tenure"
              formula='= IF(Extended, MIN(max tenure, tenure + 5, 70 − age), tenure)'
            >
              {result.enhanced.tenureYears} years
            </CalcRow>
          </div>
          <div>
            <CalcRow label="Enhanced instalment" formula="= PMT(rate ÷ 12, enhanced tenure × 12, −financed)">
              {aed(result.enhanced.installment)}
            </CalcRow>
            <CalcRow label="Enhanced DBR" formula="= (obligations + enhanced instalment) ÷ income">
              {pct(result.enhanced.dbr)}
            </CalcRow>
            <CalcRow label="Enhanced residual per member" formula="= (income − obligations − enhanced instalment) ÷ members">
              {aed(result.enhanced.residualPerMember)}
            </CalcRow>
          </div>
        </div>
        <CalcRow label="Meets target DBR?" formula="= enhanced DBR ≤ target DBR">
          {result.enhanced.meetsTargetDbr}
        </CalcRow>
      </SectionCard>
    </div>
  );
}
