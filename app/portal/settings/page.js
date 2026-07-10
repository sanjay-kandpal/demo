"use client";

import { useMemo, useState } from "react";
import { mergeConfig } from "@/lib/assessment/engine";
import {
  loadEngineConfigOverride,
  saveEngineConfigOverride,
  clearEngineConfigOverride,
} from "@/lib/assessment/engineConfigStorage";

const housingLabels = {
  owns_adequate: "Owns adequate home",
  renting_adequate: "Renting – adequate",
  family_adequate: "Living with family – adequate",
  renting_overcrowded: "Renting – overcrowded",
  family_overcrowded: "Living with family – overcrowded",
  inadequate_unsafe: "Inadequate / unsafe",
};

// Flattens the engine's nested config shape into percent-friendly display
// state, and back again into the shape assess(input, configOverride) expects.
const toDisplay = (merged) => ({
  finDbr: merged.financialWeights.dbr * 100,
  finResidual: merged.financialWeights.residualIncomePerMember * 100,
  finAecb: merged.financialWeights.aecbConduct * 100,
  finIncomeStability: merged.financialWeights.incomeStability * 100,
  finStress: merged.financialWeights.stressResilience * 100,

  socHousing: merged.socialWeights.housingSituation * 100,
  socDependants: merged.socialWeights.dependants * 100,
  socIncomeBand: merged.socialWeights.incomeBand * 100,
  socVulnerability: merged.socialWeights.vulnerabilityFlags * 100,
  socImpact: merged.socialWeights.expectedImpact * 100,

  bandFinHigh: merged.bandThresholds.financial.high,
  bandFinMedium: merged.bandThresholds.financial.medium,
  bandSocHigh: merged.bandThresholds.social.high,
  bandSocMedium: merged.bandThresholds.social.medium,

  floor: merged.livingStandardFloor.floor,
  comfortable: merged.livingStandardFloor.comfortable,

  aecbHardFloor: merged.aecbScale.hardFloor,
  aecbMin: merged.aecbScale.min,
  aecbMax: merged.aecbScale.max,

  minAge: merged.hardGates.minAge,
  maxAgeAtMaturity: merged.hardGates.maxAgeAtMaturity,
  dbrHardCeiling: merged.hardGates.dbrHardCeiling * 100,
  maxTenureYears: merged.hardGates.maxTenureYears,
  tenureExtension: merged.hardGates.tenureExtensionOnEnhancementYears,

  rateShock: merged.stressTest.financingRateShock * 100,
  incomeHaircut: merged.stressTest.incomeHaircut * 100,
  stressedDbrPass: merged.stressTest.stressedDbrPass * 100,

  ftbYes: merged.impactAndVulnerability.firstTimeBeneficiary.yes,
  ftbNo: merged.impactAndVulnerability.firstTimeBeneficiary.no,
  vulnPerFlag: merged.impactAndVulnerability.vulnerabilityPointsPerFlag,

  incomeLowestUpper: merged.incomeBandTable[0].upper,
  incomeLowestScore: merged.incomeBandTable[0].score,
  incomeLowUpper: merged.incomeBandTable[1].upper,
  incomeLowScore: merged.incomeBandTable[1].score,
  incomeMiddleUpper: merged.incomeBandTable[2].upper,
  incomeMiddleScore: merged.incomeBandTable[2].score,
  incomeUpperUpper: merged.incomeBandTable[3].upper,
  incomeUpperScore: merged.incomeBandTable[3].score,
  incomeHighestScore: merged.incomeBandTable[4].score,

  housing: Object.fromEntries(
    Object.keys(housingLabels).map((key) => [key, merged.housingSituationTable[key].score])
  ),
});

const toOverride = (d, incomeBandTable, housingSituationTable) => ({
  financialWeights: {
    dbr: d.finDbr / 100,
    residualIncomePerMember: d.finResidual / 100,
    aecbConduct: d.finAecb / 100,
    incomeStability: d.finIncomeStability / 100,
    stressResilience: d.finStress / 100,
  },
  socialWeights: {
    housingSituation: d.socHousing / 100,
    dependants: d.socDependants / 100,
    incomeBand: d.socIncomeBand / 100,
    vulnerabilityFlags: d.socVulnerability / 100,
    expectedImpact: d.socImpact / 100,
  },
  bandThresholds: {
    financial: { high: Number(d.bandFinHigh), medium: Number(d.bandFinMedium) },
    social: { high: Number(d.bandSocHigh), medium: Number(d.bandSocMedium) },
  },
  livingStandardFloor: { floor: Number(d.floor), comfortable: Number(d.comfortable) },
  aecbScale: { hardFloor: Number(d.aecbHardFloor), min: Number(d.aecbMin), max: Number(d.aecbMax) },
  hardGates: {
    minAge: Number(d.minAge),
    maxAgeAtMaturity: Number(d.maxAgeAtMaturity),
    dbrHardCeiling: d.dbrHardCeiling / 100,
    maxTenureYears: Number(d.maxTenureYears),
    tenureExtensionOnEnhancementYears: Number(d.tenureExtension),
  },
  stressTest: {
    financingRateShock: d.rateShock / 100,
    incomeHaircut: d.incomeHaircut / 100,
    stressedDbrPass: d.stressedDbrPass / 100,
  },
  impactAndVulnerability: {
    firstTimeBeneficiary: { yes: Number(d.ftbYes), no: Number(d.ftbNo) },
    vulnerabilityPointsPerFlag: Number(d.vulnPerFlag),
  },
  incomeBandTable: [
    { ...incomeBandTable[0], upper: Number(d.incomeLowestUpper), score: Number(d.incomeLowestScore) },
    { ...incomeBandTable[1], upper: Number(d.incomeLowUpper), score: Number(d.incomeLowScore) },
    { ...incomeBandTable[2], upper: Number(d.incomeMiddleUpper), score: Number(d.incomeMiddleScore) },
    { ...incomeBandTable[3], upper: Number(d.incomeUpperUpper), score: Number(d.incomeUpperScore) },
    { ...incomeBandTable[4], upper: null, score: Number(d.incomeHighestScore) },
  ],
  housingSituationTable: Object.fromEntries(
    Object.keys(housingLabels).map((key) => [
      key,
      { ...housingSituationTable[key], score: Number(d.housing[key]) },
    ])
  ),
});

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

function SectionCard({ title, children }) {
  return (
    <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 mb-8">
      <h2 className="font-headline-md text-headline-md text-primary mb-6">{title}</h2>
      {children}
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

export default function EngineSettingsPage() {
  const initial = useMemo(() => {
    const saved = loadEngineConfigOverride();
    const merged = mergeConfig(saved || {});
    return { display: toDisplay(merged), incomeBandTable: merged.incomeBandTable, housingSituationTable: merged.housingSituationTable };
  }, []);

  const [d, setD] = useState(initial.display);
  const [status, setStatus] = useState(null);

  const set = (key) => (value) => {
    setD((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const setHousing = (key) => (value) => {
    setD((prev) => ({ ...prev, housing: { ...prev.housing, [key]: value } }));
    setStatus(null);
  };

  const financialSum =
    Number(d.finDbr || 0) +
    Number(d.finResidual || 0) +
    Number(d.finAecb || 0) +
    Number(d.finIncomeStability || 0) +
    Number(d.finStress || 0);

  const socialSum =
    Number(d.socHousing || 0) +
    Number(d.socDependants || 0) +
    Number(d.socIncomeBand || 0) +
    Number(d.socVulnerability || 0) +
    Number(d.socImpact || 0);

  const financialOk = Math.abs(financialSum - 100) < 0.01;
  const socialOk = Math.abs(socialSum - 100) < 0.01;

  const handleSave = () => {
    if (!financialOk || !socialOk) {
      setStatus({ type: "error", message: "Component weights must each sum to exactly 100% before saving." });
      return;
    }
    const override = toOverride(d, initial.incomeBandTable, initial.housingSituationTable);
    saveEngineConfigOverride(override);
    setStatus({ type: "success", message: "Saved — applies to the next assessment run for any applicant." });
  };

  const handleReset = () => {
    clearEngineConfigOverride();
    const merged = mergeConfig({});
    setD(toDisplay(merged));
    setStatus({ type: "success", message: "Reset to policy defaults." });
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Decision Engine Settings</h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            Tune the financial-feasibility and social-priority policy parameters used by the
            decision engine. Changes apply the next time an assessment is run or recalculated.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded transition-colors duration-300"
            type="button"
            onClick={handleReset}
          >
            Reset to Defaults
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

      <SectionCard title="Financial Feasibility — component weights">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="DBR (post-instalment)" suffix="%" value={d.finDbr} onChange={set("finDbr")} />
          <Field label="Residual income per member" suffix="%" value={d.finResidual} onChange={set("finResidual")} />
          <Field label="AECB conduct" suffix="%" value={d.finAecb} onChange={set("finAecb")} />
          <Field label="Income stability (from mix)" suffix="%" value={d.finIncomeStability} onChange={set("finIncomeStability")} />
          <Field label="Stress resilience" suffix="%" value={d.finStress} onChange={set("finStress")} />
        </div>
        <WeightSum sum={financialSum} />
      </SectionCard>

      <SectionCard title="Social Priority — component weights">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="Housing situation" suffix="%" value={d.socHousing} onChange={set("socHousing")} />
          <Field label="Dependants" suffix="%" value={d.socDependants} onChange={set("socDependants")} />
          <Field label="Income band" suffix="%" value={d.socIncomeBand} onChange={set("socIncomeBand")} />
          <Field label="Vulnerability flags" suffix="%" value={d.socVulnerability} onChange={set("socVulnerability")} />
          <Field label="Expected impact" suffix="%" value={d.socImpact} onChange={set("socImpact")} />
        </div>
        <WeightSum sum={socialSum} />
      </SectionCard>

      <SectionCard title="Band thresholds">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="Financial — High score ≥" value={d.bandFinHigh} onChange={set("bandFinHigh")} />
          <Field label="Financial — Medium score ≥" value={d.bandFinMedium} onChange={set("bandFinMedium")} />
          <Field label="Social — High score ≥" value={d.bandSocHigh} onChange={set("bandSocHigh")} />
          <Field label="Social — Medium score ≥" value={d.bandSocMedium} onChange={set("bandSocMedium")} />
        </div>
      </SectionCard>

      <SectionCard title="Living-standard floor — residual / member">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="Floor — minimum acceptable" suffix="AED" value={d.floor} onChange={set("floor")} />
          <Field label="Comfortable — full score" suffix="AED" value={d.comfortable} onChange={set("comfortable")} />
        </div>
      </SectionCard>

      <SectionCard title="AECB scale">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="Hard floor (gate)" value={d.aecbHardFloor} onChange={set("aecbHardFloor")} />
          <Field label="Scale minimum" value={d.aecbMin} onChange={set("aecbMin")} />
          <Field label="Scale maximum" value={d.aecbMax} onChange={set("aecbMax")} />
        </div>
      </SectionCard>

      <SectionCard title="Hard gates & tenure">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="Minimum age" value={d.minAge} onChange={set("minAge")} />
          <Field label="Maximum age at maturity" value={d.maxAgeAtMaturity} onChange={set("maxAgeAtMaturity")} />
          <Field label="DBR hard ceiling" suffix="%" value={d.dbrHardCeiling} onChange={set("dbrHardCeiling")} />
          <Field label="Maximum tenure (years)" value={d.maxTenureYears} onChange={set("maxTenureYears")} />
          <Field label="Tenure extension on enhancement" suffix="yrs" value={d.tenureExtension} onChange={set("tenureExtension")} />
        </div>
      </SectionCard>

      <SectionCard title="Stress test">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="Financing-rate shock (+)" suffix="%" value={d.rateShock} onChange={set("rateShock")} />
          <Field label="Income haircut" suffix="%" value={d.incomeHaircut} onChange={set("incomeHaircut")} />
          <Field label="Stressed-DBR pass ≤" suffix="%" value={d.stressedDbrPass} onChange={set("stressedDbrPass")} />
        </div>
      </SectionCard>

      <SectionCard title="Impact & vulnerability">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label="First-time beneficiary — Yes score" value={d.ftbYes} onChange={set("ftbYes")} />
          <Field label="First-time beneficiary — No score" value={d.ftbNo} onChange={set("ftbNo")} />
          <Field label="Vulnerability — points per flag (cap 100)" value={d.vulnPerFlag} onChange={set("vulnPerFlag")} />
        </div>
      </SectionCard>

      <SectionCard title="Income-band social scoring (recognised monthly AED)">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-surface-variant">
                <th className="py-3 pr-4 font-label-bold text-label-bold text-on-surface-variant">Bracket</th>
                <th className="py-3 pr-4 font-label-bold text-label-bold text-on-surface-variant">Upper bound (AED)</th>
                <th className="py-3 pr-4 font-label-bold text-label-bold text-on-surface-variant">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-surface-variant">
                <td className="py-3 pr-4 text-body-md text-on-surface">Lowest</td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeLowestUpper} onChange={set("incomeLowestUpper")} /></td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeLowestScore} onChange={set("incomeLowestScore")} /></td>
              </tr>
              <tr className="border-b border-surface-variant">
                <td className="py-3 pr-4 text-body-md text-on-surface">Low</td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeLowUpper} onChange={set("incomeLowUpper")} /></td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeLowScore} onChange={set("incomeLowScore")} /></td>
              </tr>
              <tr className="border-b border-surface-variant">
                <td className="py-3 pr-4 text-body-md text-on-surface">Middle</td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeMiddleUpper} onChange={set("incomeMiddleUpper")} /></td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeMiddleScore} onChange={set("incomeMiddleScore")} /></td>
              </tr>
              <tr className="border-b border-surface-variant">
                <td className="py-3 pr-4 text-body-md text-on-surface">Upper</td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeUpperUpper} onChange={set("incomeUpperUpper")} /></td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeUpperScore} onChange={set("incomeUpperScore")} /></td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-body-md text-on-surface">Highest (above)</td>
                <td className="py-3 pr-4 text-body-md text-on-surface-variant">n/a</td>
                <td className="py-3 pr-4"><Field label="" value={d.incomeHighestScore} onChange={set("incomeHighestScore")} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Housing situation — social score lookup">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(housingLabels).map(([key, label]) => (
            <Field key={key} label={label} value={d.housing[key]} onChange={setHousing(key)} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
