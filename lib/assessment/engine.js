import {
  financialWeights as defaultFinancialWeights,
  socialWeights as defaultSocialWeights,
  bandThresholds as defaultBandThresholds,
  livingStandardFloor as defaultLivingStandardFloor,
  aecbScale as defaultAecbScale,
  hardGates as defaultHardGates,
  stressTest as defaultStressTest,
  impactAndVulnerability as defaultImpactAndVulnerability,
  incomeBandTable as defaultIncomeBandTable,
  housingSituationTable as defaultHousingSituationTable,
  employmentStabilityTable,
  dependantsScoring,
  decisionMatrix,
  decisionCategory,
} from "./config";

// Merges an admin-supplied partial config (see app/portal/settings) on top of
// the policy defaults from ./config. Only the sections exposed in the Engine
// Settings screen are overridable; decision matrix, employment-stability and
// dependants scoring stay fixed.
export const mergeConfig = (overrides = {}) => ({
  financialWeights: { ...defaultFinancialWeights, ...overrides.financialWeights },
  socialWeights: { ...defaultSocialWeights, ...overrides.socialWeights },
  bandThresholds: {
    financial: { ...defaultBandThresholds.financial, ...overrides.bandThresholds?.financial },
    social: { ...defaultBandThresholds.social, ...overrides.bandThresholds?.social },
  },
  livingStandardFloor: { ...defaultLivingStandardFloor, ...overrides.livingStandardFloor },
  aecbScale: { ...defaultAecbScale, ...overrides.aecbScale },
  hardGates: {
    ...defaultHardGates,
    ...overrides.hardGates,
    extendedTenure: defaultHardGates.extendedTenure,
  },
  stressTest: { ...defaultStressTest, ...overrides.stressTest },
  impactAndVulnerability: {
    ...defaultImpactAndVulnerability,
    ...overrides.impactAndVulnerability,
    firstTimeBeneficiary: {
      ...defaultImpactAndVulnerability.firstTimeBeneficiary,
      ...overrides.impactAndVulnerability?.firstTimeBeneficiary,
    },
  },
  incomeBandTable: overrides.incomeBandTable ?? defaultIncomeBandTable,
  housingSituationTable: overrides.housingSituationTable ?? defaultHousingSituationTable,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Linear interpolation between two anchor points, clamped to [loScore, hiScore].
const scoreLinear = (value, loX, loScore, hiX, hiScore) => {
  if (hiX === loX) return hiScore;
  const t = clamp((value - loX) / (hiX - loX), 0, 1);
  return loScore + t * (hiScore - loScore);
};

// Standard amortising-loan monthly instalment.
export const calculateInstallment = (principal, annualRatePercent, tenureYears) => {
  const n = Math.round(tenureYears * 12);
  if (n <= 0) return principal;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
};

const bandFromScore = (score, thresholds) => {
  if (score >= thresholds.high) return "High";
  if (score >= thresholds.medium) return "Medium";
  return "Low";
};

const lookupIncomeBand = (recognizedIncome, incomeBandTable) => {
  for (const bracket of incomeBandTable) {
    if (bracket.upper === null || recognizedIncome <= bracket.upper) {
      return bracket;
    }
  }
  return incomeBandTable[incomeBandTable.length - 1];
};

const maxTenureForIncome = (recognizedIncome, hardGates) => {
  const { minIncome, maxIncome, maxTenureYears } = hardGates.extendedTenure;
  if (recognizedIncome >= minIncome && recognizedIncome <= maxIncome) {
    return maxTenureYears;
  }
  return hardGates.maxTenureYears;
};

/**
 * Runs the full hard-gate + scoring + decision pipeline.
 * `input` fields — see app/api/assessment/route.js for the expected shape.
 * `configOverride` — optional partial policy config from the Engine Settings
 * screen; merged on top of the defaults in ./config.
 * Returns { eligible, decision, financial, social, stress, gates, explanation }.
 */
export function assess(input, configOverride = {}) {
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

  const {
    age,
    dependents,
    employment,
    monthlyIncome,
    otherIncome,
    existingMonthlyDebt,
    creditCardMinimums,
    requestedLoanAmount,
    financingRatePercent,
    requestedTenureYears,
    aecbScore,
    housingSituation,
    vulnerabilityFlagCount,
    firstTimeBeneficiary,
  } = input;

  const recognizedIncome = monthlyIncome + otherIncome;
  const householdSize = dependents + 1;
  const otherMonthlyDebt = existingMonthlyDebt + creditCardMinimums;

  const gateFailures = [];

  // --- Hard gates ---
  if (age < hardGates.minAge) {
    gateFailures.push(`Applicant age ${age} is below the minimum age of ${hardGates.minAge}.`);
  }
  const maxTenureByAge = hardGates.maxAgeAtMaturity - age;
  if (maxTenureByAge <= 0) {
    gateFailures.push(
      `Applicant would exceed the maximum maturity age of ${hardGates.maxAgeAtMaturity} at any tenure.`
    );
  }

  if (aecbScore < aecbScale.hardFloor) {
    gateFailures.push(
      `AECB score ${aecbScore} is below the hard floor of ${aecbScale.hardFloor}.`
    );
  }

  const allowedTenure = Math.max(
    1,
    Math.min(requestedTenureYears, maxTenureForIncome(recognizedIncome, hardGates), Math.max(maxTenureByAge, 1))
  );

  const installment = calculateInstallment(requestedLoanAmount, financingRatePercent, allowedTenure);
  const totalMonthlyDebt = otherMonthlyDebt + installment;
  const dbr = recognizedIncome > 0 ? totalMonthlyDebt / recognizedIncome : 1;

  if (dbr > hardGates.dbrHardCeiling) {
    gateFailures.push(
      `Debt-burden ratio ${(dbr * 100).toFixed(1)}% exceeds the hard ceiling of ${(hardGates.dbrHardCeiling * 100).toFixed(0)}%.`
    );
  }

  if (gateFailures.length > 0) {
    return {
      eligible: false,
      decision: {
        decision: "Decline",
        category: "decline",
        grantPercent: 0,
        targetDbr: null,
        tenure: "n/a",
        conditions: "Hard gate failed — see explanation.",
      },
      gates: { passed: false, failures: gateFailures },
      financial: null,
      social: null,
      stress: null,
      explanation: {
        summary: "Application declined at hard-gate stage, before scoring.",
        gateFailures,
      },
    };
  }

  // --- Stress test (feeds the "stress resilience" financial component) ---
  const stressedInstallment = calculateInstallment(
    requestedLoanAmount,
    financingRatePercent + stressTest.financingRateShock * 100,
    allowedTenure
  );
  const stressedIncome = recognizedIncome * (1 - stressTest.incomeHaircut);
  const stressedDbr = stressedIncome > 0 ? (otherMonthlyDebt + stressedInstallment) / stressedIncome : 1;
  const stressPass = stressedDbr <= stressTest.stressedDbrPass;
  // 100 at/below the pass threshold, tapering to 0 at pass threshold + 20pts.
  const stressResilienceScore = scoreLinear(
    stressedDbr,
    stressTest.stressedDbrPass,
    100,
    stressTest.stressedDbrPass + 0.20,
    0
  );

  // --- Financial Feasibility components ---
  const dbrScore = scoreLinear(dbr, 0, 100, hardGates.dbrHardCeiling, 0);

  const residualIncome = recognizedIncome - totalMonthlyDebt;
  const residualPerMember = residualIncome / householdSize;
  const residualScore = scoreLinear(
    residualPerMember,
    livingStandardFloor.floor,
    0,
    livingStandardFloor.comfortable,
    100
  );

  const aecbConductScore = scoreLinear(aecbScore, aecbScale.min, 0, aecbScale.max, 100);

  const incomeStabilityScore = employmentStabilityTable[employment] ?? 0;

  const financialScore =
    dbrScore * financialWeights.dbr +
    residualScore * financialWeights.residualIncomePerMember +
    aecbConductScore * financialWeights.aecbConduct +
    incomeStabilityScore * financialWeights.incomeStability +
    stressResilienceScore * financialWeights.stressResilience;

  const financialBand = bandFromScore(financialScore, bandThresholds.financial);

  // --- Social Priority components ---
  const housingScore = housingSituationTable[housingSituation]?.score ?? 0;

  const dependantsScore = clamp(
    dependents * dependantsScoring.pointsPerDependant,
    0,
    dependantsScoring.cap
  );

  const incomeBand = lookupIncomeBand(recognizedIncome, incomeBandTable);
  const incomeBandScore = incomeBand.score;

  const vulnerabilityScore = clamp(
    vulnerabilityFlagCount * impactAndVulnerability.vulnerabilityPointsPerFlag,
    0,
    impactAndVulnerability.vulnerabilityCap
  );

  const expectedImpactScore = firstTimeBeneficiary
    ? impactAndVulnerability.firstTimeBeneficiary.yes
    : impactAndVulnerability.firstTimeBeneficiary.no;

  const socialScore =
    housingScore * socialWeights.housingSituation +
    dependantsScore * socialWeights.dependants +
    incomeBandScore * socialWeights.incomeBand +
    vulnerabilityScore * socialWeights.vulnerabilityFlags +
    expectedImpactScore * socialWeights.expectedImpact;

  const socialBand = bandFromScore(socialScore, bandThresholds.social);

  // --- Decision matrix lookup ---
  const matrixKey = `${financialBand}|${socialBand}`;
  const matrixEntry = decisionMatrix[matrixKey];
  const category = decisionCategory(matrixEntry.decision);

  return {
    eligible: true,
    decision: {
      decision: matrixEntry.decision,
      category,
      grantPercent: matrixEntry.grantPercent,
      targetDbr: matrixEntry.targetDbr,
      tenure: matrixEntry.tenure,
      conditions: matrixEntry.conditions,
      appliedTenureYears: allowedTenure,
    },
    gates: { passed: true, failures: [] },
    financial: {
      score: Math.round(financialScore * 10) / 10,
      band: financialBand,
      components: {
        dbr: { value: dbr, score: Math.round(dbrScore * 10) / 10, weight: financialWeights.dbr },
        residualIncomePerMember: {
          value: Math.round(residualPerMember),
          score: Math.round(residualScore * 10) / 10,
          weight: financialWeights.residualIncomePerMember,
        },
        aecbConduct: {
          value: aecbScore,
          score: Math.round(aecbConductScore * 10) / 10,
          weight: financialWeights.aecbConduct,
        },
        incomeStability: {
          value: employment,
          score: incomeStabilityScore,
          weight: financialWeights.incomeStability,
        },
        stressResilience: {
          value: Math.round(stressedDbr * 1000) / 1000,
          score: Math.round(stressResilienceScore * 10) / 10,
          weight: financialWeights.stressResilience,
        },
      },
    },
    social: {
      score: Math.round(socialScore * 10) / 10,
      band: socialBand,
      components: {
        housingSituation: { value: housingSituation, score: housingScore, weight: socialWeights.housingSituation },
        dependants: { value: dependents, score: dependantsScore, weight: socialWeights.dependants },
        incomeBand: { value: incomeBand.label, score: incomeBandScore, weight: socialWeights.incomeBand },
        vulnerabilityFlags: {
          value: vulnerabilityFlagCount,
          score: vulnerabilityScore,
          weight: socialWeights.vulnerabilityFlags,
        },
        expectedImpact: {
          value: firstTimeBeneficiary,
          score: expectedImpactScore,
          weight: socialWeights.expectedImpact,
        },
      },
    },
    stress: {
      pass: stressPass,
      stressedDbr: Math.round(stressedDbr * 1000) / 1000,
      stressedInstallment: Math.round(stressedInstallment),
    },
    explanation: {
      summary: `Financial band ${financialBand} × Social band ${socialBand} → ${matrixEntry.decision}.`,
      installment: Math.round(installment),
      dbr: Math.round(dbr * 1000) / 1000,
      residualPerMember: Math.round(residualPerMember),
      allowedTenureYears: allowedTenure,
    },
  };
}
