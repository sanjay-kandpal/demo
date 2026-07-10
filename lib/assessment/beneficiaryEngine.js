// Client-side port of the "Assessment" sheet in
// ADHA_Feasibility_Social_Assessment.xlsx. Cell-for-cell faithful: the
// piecewise score curves and the enhanced-outcome block intentionally differ
// from the simpler linear engine in ./engine.js. Policy constants are pulled
// through mergeConfig so Engine Settings overrides still apply.

import { mergeConfig, calculateInstallment } from "./engine";
import { decisionMatrix, decisionCategory, dependantsScoring } from "./config";

// Configuration!A82:F89 — income recognition & stability by source.
export const incomeSources = [
  { key: "salaryPrimary", label: "Salary – primary (applicant)", recognition: 1, stability: 100, note: "Documented, stable" },
  { key: "allowances", label: "Allowances – housing / social", recognition: 1, stability: 90, note: "Count only if permanent/guaranteed" },
  { key: "salaryCoApplicant", label: "Salary – co-applicant", recognition: 1, stability: 95, note: "Documented spouse/co-borrower income" },
  { key: "rental", label: "Rental income", recognition: 0.75, stability: 65, note: "Haircut for voids/maintenance; needs tenancy + title" },
  { key: "business", label: "Business / trade-licence income", recognition: 0.6, stability: 45, note: "Averaged from audited accounts / statements" },
  { key: "dividends", label: "Dividends from shares", recognition: 0.5, stability: 35, note: "Least reliable; needs 2–3yr track record" },
  { key: "fixedIncome", label: "Fixed income / sukuk", recognition: 0.75, stability: 70, note: "Prefer sukuk; review interest-bearing for Sharia fit" },
  { key: "pension", label: "Pension / other", recognition: 1, stability: 90, note: "Stable; mind age-at-maturity" },
];

// Worked example from the sheet ("Example – Applicant B").
export const defaultIncomeRows = {
  salaryPrimary: { gross: 18000, verified: true },
  allowances: { gross: 3000, verified: true },
  salaryCoApplicant: { gross: 0, verified: true },
  rental: { gross: 8000, verified: true },
  business: { gross: 5000, verified: true },
  dividends: { gross: 2000, verified: true },
  fixedIncome: { gross: 0, verified: true },
  pension: { gross: 0, verified: true },
};

export const defaultApplicantInputs = {
  applicantName: "Example – Applicant B",
  aecbScore: 720,
  age: 40,
  householdMembers: 5,
  dependents: 3,
  housingSituation: "renting_overcrowded",
  vulnerabilityFlagCount: 0,
  firstTimeBeneficiary: true,
  existingMonthlyObligations: 6000,
  requestedLoanAmount: 1200000,
  financingRatePercent: 0,
  requestedTenureYears: 25,
};

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Anchors hardcoded inside the sheet's DBR-score formula (Assessment!B38),
// not exposed in its Configuration sheet.
const DBR_FULL_SCORE_AT = 0.35;
const DBR_HALF_SCORE_AT = 0.5;

export function computeBeneficiaryAssessment(incomeRows, inputs, configOverride = {}) {
  const {
    financialWeights,
    socialWeights,
    bandThresholds,
    livingStandardFloor,
    aecbScale,
    hardGates,
    stressTest,
    impactAndVulnerability,
    incomeBandTable,
    housingSituationTable,
  } = mergeConfig(configOverride);

  // --- Income schedule (rows 6–15) ---
  const schedule = incomeSources.map((source) => {
    const row = incomeRows[source.key] ?? { gross: 0, verified: false };
    const gross = num(row.gross);
    const recognised = row.verified ? gross * source.recognition : 0;
    return { ...source, gross, verified: Boolean(row.verified), recognised };
  });
  const grossTotal = schedule.reduce((sum, r) => sum + r.gross, 0);
  const recognisedIncome = schedule.reduce((sum, r) => sum + r.recognised, 0);
  const incomeStabilityScore =
    recognisedIncome > 0
      ? schedule.reduce((sum, r) => sum + r.recognised * r.stability, 0) / recognisedIncome
      : 0;

  const age = num(inputs.age);
  const householdMembers = num(inputs.householdMembers);
  const dependents = num(inputs.dependents);
  const aecbScore = num(inputs.aecbScore);
  const vulnerabilityFlagCount = num(inputs.vulnerabilityFlagCount);
  const obligations = num(inputs.existingMonthlyObligations);
  const loanAmount = num(inputs.requestedLoanAmount);
  const ratePercent = num(inputs.financingRatePercent);
  const tenureYears = num(inputs.requestedTenureYears);

  // --- Financial feasibility (rows 31–44) ---
  const installment = calculateInstallment(loanAmount, ratePercent, tenureYears);
  const dbr = recognisedIncome > 0 ? (obligations + installment) / recognisedIncome : 0;
  const residualIncome = recognisedIncome - obligations - installment;
  const residualPerMember = householdMembers > 0 ? residualIncome / householdMembers : 0;

  // B38: 100 up to 35% DBR, 100→50 to 50%, 50→0 to the hard ceiling.
  const ceiling = hardGates.dbrHardCeiling;
  let dbrScore;
  if (dbr <= DBR_FULL_SCORE_AT) dbrScore = 100;
  else if (dbr <= DBR_HALF_SCORE_AT)
    dbrScore = 100 - ((dbr - DBR_FULL_SCORE_AT) / (DBR_HALF_SCORE_AT - DBR_FULL_SCORE_AT)) * 50;
  else if (dbr <= ceiling) dbrScore = 50 - ((dbr - DBR_HALF_SCORE_AT) / (ceiling - DBR_HALF_SCORE_AT)) * 50;
  else dbrScore = 0;

  // B39: 0→40 below the floor, 40→100 between floor and comfortable.
  const { floor, comfortable } = livingStandardFloor;
  let residualScore;
  if (residualPerMember >= comfortable) residualScore = 100;
  else if (residualPerMember <= floor) residualScore = (residualPerMember / floor) * 40;
  else residualScore = 40 + ((residualPerMember - floor) / (comfortable - floor)) * 60;
  residualScore = Math.min(100, Math.max(0, residualScore));

  // B40: 0→40 from scale min to the hard floor, 40→100 to scale max.
  let aecbConductScore;
  if (aecbScore < aecbScale.hardFloor)
    aecbConductScore = ((aecbScore - aecbScale.min) / (aecbScale.hardFloor - aecbScale.min)) * 40;
  else
    aecbConductScore = 40 + ((aecbScore - aecbScale.hardFloor) / (aecbScale.max - aecbScale.hardFloor)) * 60;
  aecbConductScore = Math.min(100, Math.max(0, aecbConductScore));

  // --- Stress test (rows 81–83) ---
  const stressedInstallment = calculateInstallment(
    loanAmount,
    ratePercent + stressTest.financingRateShock * 100,
    tenureYears
  );
  const stressedIncome = recognisedIncome * (1 - stressTest.incomeHaircut);
  const stressedDbr = stressedIncome > 0 ? (obligations + stressedInstallment) / stressedIncome : 0;

  // B42: banded 100 / 60 / 40 / 0 (not linear).
  const ageAtMaturity = age + tenureYears;
  let stressResilienceScore;
  if (stressedDbr <= stressTest.stressedDbrPass && ageAtMaturity <= hardGates.maxAgeAtMaturity)
    stressResilienceScore = 100;
  else if (stressedDbr <= stressTest.stressedDbrPass) stressResilienceScore = 60;
  else if (stressedDbr <= ceiling) stressResilienceScore = 40;
  else stressResilienceScore = 0;

  const financialScore =
    dbrScore * financialWeights.dbr +
    residualScore * financialWeights.residualIncomePerMember +
    aecbConductScore * financialWeights.aecbConduct +
    incomeStabilityScore * financialWeights.incomeStability +
    stressResilienceScore * financialWeights.stressResilience;
  const financialBand =
    financialScore >= bandThresholds.financial.high
      ? "High"
      : financialScore >= bandThresholds.financial.medium
        ? "Medium"
        : "Low";

  // --- Social priority (rows 46–53) ---
  const housingScore = housingSituationTable[inputs.housingSituation]?.score ?? 0;
  const dependantsScore = Math.min(dependantsScoring.cap, dependents * dependantsScoring.pointsPerDependant);
  const incomeBand =
    incomeBandTable.find((b) => b.upper === null || recognisedIncome <= b.upper) ??
    incomeBandTable[incomeBandTable.length - 1];
  const vulnerabilityScore = Math.min(
    impactAndVulnerability.vulnerabilityCap,
    vulnerabilityFlagCount * impactAndVulnerability.vulnerabilityPointsPerFlag
  );
  const expectedImpactScore = inputs.firstTimeBeneficiary
    ? impactAndVulnerability.firstTimeBeneficiary.yes
    : impactAndVulnerability.firstTimeBeneficiary.no;

  const socialScore =
    housingScore * socialWeights.housingSituation +
    dependantsScore * socialWeights.dependants +
    incomeBand.score * socialWeights.incomeBand +
    vulnerabilityScore * socialWeights.vulnerabilityFlags +
    expectedImpactScore * socialWeights.expectedImpact;
  const socialBand =
    socialScore >= bandThresholds.social.high
      ? "High"
      : socialScore >= bandThresholds.social.medium
        ? "Medium"
        : "Low";

  // --- Eligibility gates (rows 55–61) ---
  const ageGate = age >= hardGates.minAge && ageAtMaturity <= hardGates.maxAgeAtMaturity;
  const aecbGate = aecbScore >= aecbScale.hardFloor;
  const dbrGate = dbr <= ceiling;
  const gatesPassed = ageGate && aecbGate && dbrGate;
  const gateDetail = gatesPassed
    ? "All gates passed"
    : `Failed: ${[!ageGate && "Age", !aecbGate && "AECB", !dbrGate && "DBR"].filter(Boolean).join(" ")}`;

  // --- Decision (rows 63–69) ---
  const matrixKey = `${financialBand}|${socialBand}`;
  const matrixEntry = decisionMatrix[matrixKey];
  const decision = gatesPassed
    ? {
        decision: matrixEntry.decision,
        category: decisionCategory(matrixEntry.decision),
        grantPercent: matrixEntry.grantPercent,
        targetDbr: matrixEntry.targetDbr,
        tenure: matrixEntry.tenure,
        conditions: matrixEntry.conditions,
      }
    : {
        decision: `Ineligible – ${gateDetail}`,
        category: "decline",
        grantPercent: 0,
        targetDbr: null,
        tenure: "n/a",
        conditions: gateDetail,
      };

  // --- Enhanced outcome (rows 71–78) ---
  const grantAmount = loanAmount * (decision.grantPercent / 100);
  const financedAmount = loanAmount - grantAmount;
  const enhancedTenure =
    decision.tenure === "Extended"
      ? Math.min(
          hardGates.maxTenureYears,
          tenureYears + hardGates.tenureExtensionOnEnhancementYears,
          hardGates.maxAgeAtMaturity - age
        )
      : tenureYears;
  const enhancedInstallment = calculateInstallment(financedAmount, ratePercent, enhancedTenure);
  const enhancedDbr = recognisedIncome > 0 ? (obligations + enhancedInstallment) / recognisedIncome : 0;
  const enhancedResidualPerMember =
    householdMembers > 0 ? (recognisedIncome - obligations - enhancedInstallment) / householdMembers : 0;
  const meetsTargetDbr = decision.targetDbr == null ? "n/a" : enhancedDbr <= decision.targetDbr ? "Yes" : "No";

  return {
    schedule,
    income: { grossTotal, recognisedIncome, incomeStabilityScore },
    financial: {
      installment,
      dbr,
      residualIncome,
      residualPerMember,
      components: {
        dbr: { score: dbrScore, weight: financialWeights.dbr },
        residual: { score: residualScore, weight: financialWeights.residualIncomePerMember },
        aecb: { score: aecbConductScore, weight: financialWeights.aecbConduct },
        incomeStability: { score: incomeStabilityScore, weight: financialWeights.incomeStability },
        stressResilience: { score: stressResilienceScore, weight: financialWeights.stressResilience },
      },
      score: financialScore,
      band: financialBand,
    },
    social: {
      components: {
        housing: { score: housingScore, weight: socialWeights.housingSituation },
        dependants: { score: dependantsScore, weight: socialWeights.dependants },
        incomeBand: { score: incomeBand.score, label: incomeBand.label, weight: socialWeights.incomeBand },
        vulnerability: { score: vulnerabilityScore, weight: socialWeights.vulnerabilityFlags },
        expectedImpact: { score: expectedImpactScore, weight: socialWeights.expectedImpact },
      },
      score: socialScore,
      band: socialBand,
    },
    gates: {
      ageAtMaturity,
      age: ageGate,
      aecb: aecbGate,
      dbr: dbrGate,
      passed: gatesPassed,
      detail: gateDetail,
    },
    decision: { ...decision, matrixKey },
    enhanced: {
      grantAmount,
      financedAmount,
      tenureYears: enhancedTenure,
      installment: enhancedInstallment,
      dbr: enhancedDbr,
      residualPerMember: enhancedResidualPerMember,
      meetsTargetDbr,
    },
    stress: { stressedInstallment, stressedIncome, stressedDbr },
  };
}
