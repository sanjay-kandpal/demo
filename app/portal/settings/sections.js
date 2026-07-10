// Registry of the Decision Engine Settings sections plus the flat
// display-state <-> engine-config conversion helpers. Each section renders as
// its own page at /portal/settings/[slug] and as a sidebar child item.

import { mergeConfig } from "@/lib/assessment/engine";
import {
  incomeBandTable as defaultIncomeBandTable,
  housingSituationTable as defaultHousingSituationTable,
} from "@/lib/assessment/config";
import { loadEngineConfigOverride } from "@/lib/assessment/engineConfigStorage";

export const housingLabels = {
  owns_adequate: "Owns adequate home",
  renting_adequate: "Renting – adequate",
  family_adequate: "Living with family – adequate",
  renting_overcrowded: "Renting – overcrowded",
  family_overcrowded: "Living with family – overcrowded",
  inadequate_unsafe: "Inadequate / unsafe",
};

// Flattens the engine's nested config shape into percent-friendly display
// state (all keys flat so section pages can edit any subset of it).
export const toDisplay = (merged) => ({
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

  hs_owns_adequate: merged.housingSituationTable.owns_adequate.score,
  hs_renting_adequate: merged.housingSituationTable.renting_adequate.score,
  hs_family_adequate: merged.housingSituationTable.family_adequate.score,
  hs_renting_overcrowded: merged.housingSituationTable.renting_overcrowded.score,
  hs_family_overcrowded: merged.housingSituationTable.family_overcrowded.score,
  hs_inadequate_unsafe: merged.housingSituationTable.inadequate_unsafe.score,
});

// Rebuilds the full override shape assess(input, configOverride) expects.
// Bracket/situation labels are not editable, so they come from the defaults.
export const toOverride = (d) => ({
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
    { ...defaultIncomeBandTable[0], upper: Number(d.incomeLowestUpper), score: Number(d.incomeLowestScore) },
    { ...defaultIncomeBandTable[1], upper: Number(d.incomeLowUpper), score: Number(d.incomeLowScore) },
    { ...defaultIncomeBandTable[2], upper: Number(d.incomeMiddleUpper), score: Number(d.incomeMiddleScore) },
    { ...defaultIncomeBandTable[3], upper: Number(d.incomeUpperUpper), score: Number(d.incomeUpperScore) },
    { ...defaultIncomeBandTable[4], upper: null, score: Number(d.incomeHighestScore) },
  ],
  housingSituationTable: Object.fromEntries(
    Object.keys(housingLabels).map((key) => [
      key,
      { ...defaultHousingSituationTable[key], score: Number(d[`hs_${key}`]) },
    ])
  ),
});

// Display state seeded from the saved override (or policy defaults).
export const savedDisplayState = () => toDisplay(mergeConfig(loadEngineConfigOverride() || {}));

// Display state for the untouched policy defaults.
export const defaultDisplayState = () => toDisplay(mergeConfig({}));

export const settingsSections = [
  {
    slug: "financial-weights",
    title: "Financial Feasibility — component weights",
    navLabel: "Financial weights",
    icon: "account_balance",
    description: "How the five financial components combine into the feasibility score.",
    weightSum: ["finDbr", "finResidual", "finAecb", "finIncomeStability", "finStress"],
    fields: [
      { key: "finDbr", label: "DBR (post-instalment)", suffix: "%" },
      { key: "finResidual", label: "Residual income per member", suffix: "%" },
      { key: "finAecb", label: "AECB conduct", suffix: "%" },
      { key: "finIncomeStability", label: "Income stability (from mix)", suffix: "%" },
      { key: "finStress", label: "Stress resilience", suffix: "%" },
    ],
  },
  {
    slug: "social-weights",
    title: "Social Priority — component weights",
    navLabel: "Social weights",
    icon: "diversity_3",
    description: "How the five social components combine into the priority score.",
    weightSum: ["socHousing", "socDependants", "socIncomeBand", "socVulnerability", "socImpact"],
    fields: [
      { key: "socHousing", label: "Housing situation", suffix: "%" },
      { key: "socDependants", label: "Dependants", suffix: "%" },
      { key: "socIncomeBand", label: "Income band", suffix: "%" },
      { key: "socVulnerability", label: "Vulnerability flags", suffix: "%" },
      { key: "socImpact", label: "Expected impact", suffix: "%" },
    ],
  },
  {
    slug: "band-thresholds",
    title: "Band thresholds",
    navLabel: "Band thresholds",
    icon: "linear_scale",
    description: "Score cut-offs that map financial and social scores to High / Medium / Low bands.",
    fields: [
      { key: "bandFinHigh", label: "Financial — High score ≥" },
      { key: "bandFinMedium", label: "Financial — Medium score ≥" },
      { key: "bandSocHigh", label: "Social — High score ≥" },
      { key: "bandSocMedium", label: "Social — Medium score ≥" },
    ],
  },
  {
    slug: "living-standard-floor",
    title: "Living-standard floor — residual / member",
    navLabel: "Living-standard floor",
    icon: "savings",
    description: "Residual income per household member anchoring the residual score.",
    fields: [
      { key: "floor", label: "Floor — minimum acceptable", suffix: "AED" },
      { key: "comfortable", label: "Comfortable — full score", suffix: "AED" },
    ],
  },
  {
    slug: "aecb-scale",
    title: "AECB scale",
    navLabel: "AECB scale",
    icon: "credit_score",
    description: "Credit-score range and the hard decline floor.",
    fields: [
      { key: "aecbHardFloor", label: "Hard floor (gate)" },
      { key: "aecbMin", label: "Scale minimum" },
      { key: "aecbMax", label: "Scale maximum" },
    ],
  },
  {
    slug: "hard-gates",
    title: "Hard gates & tenure",
    navLabel: "Hard gates & tenure",
    icon: "gavel",
    description: "Age limits, DBR ceiling and tenure rules applied before scoring.",
    fields: [
      { key: "minAge", label: "Minimum age" },
      { key: "maxAgeAtMaturity", label: "Maximum age at maturity" },
      { key: "dbrHardCeiling", label: "DBR hard ceiling", suffix: "%" },
      { key: "maxTenureYears", label: "Maximum tenure (years)" },
      { key: "tenureExtension", label: "Tenure extension on enhancement", suffix: "yrs" },
    ],
  },
  {
    slug: "stress-test",
    title: "Stress test",
    navLabel: "Stress test",
    icon: "monitor_heart",
    description: "Rate shock and income haircut for the stressed-DBR check.",
    fields: [
      { key: "rateShock", label: "Financing-rate shock (+)", suffix: "%" },
      { key: "incomeHaircut", label: "Income haircut", suffix: "%" },
      { key: "stressedDbrPass", label: "Stressed-DBR pass ≤", suffix: "%" },
    ],
  },
  {
    slug: "impact-vulnerability",
    title: "Impact & vulnerability",
    navLabel: "Impact & vulnerability",
    icon: "volunteer_activism",
    description: "First-time-beneficiary scores and points per vulnerability flag.",
    fields: [
      { key: "ftbYes", label: "First-time beneficiary — Yes score" },
      { key: "ftbNo", label: "First-time beneficiary — No score" },
      { key: "vulnPerFlag", label: "Vulnerability — points per flag (cap 100)" },
    ],
  },
  {
    slug: "income-bands",
    title: "Income-band social scoring (recognised monthly AED)",
    navLabel: "Income bands",
    icon: "payments",
    description: "Income brackets and the social score each bracket earns.",
    fields: [
      { key: "incomeLowestUpper", label: "Lowest — upper bound", suffix: "AED" },
      { key: "incomeLowestScore", label: "Lowest — score" },
      { key: "incomeLowUpper", label: "Low — upper bound", suffix: "AED" },
      { key: "incomeLowScore", label: "Low — score" },
      { key: "incomeMiddleUpper", label: "Middle — upper bound", suffix: "AED" },
      { key: "incomeMiddleScore", label: "Middle — score" },
      { key: "incomeUpperUpper", label: "Upper — upper bound", suffix: "AED" },
      { key: "incomeUpperScore", label: "Upper — score" },
      { key: "incomeHighestScore", label: "Highest (above) — score" },
    ],
  },
  {
    slug: "housing-scores",
    title: "Housing situation — social score lookup",
    navLabel: "Housing scores",
    icon: "home_work",
    description: "Social score for each housing situation.",
    fields: Object.entries(housingLabels).map(([key, label]) => ({
      key: `hs_${key}`,
      label,
    })),
  },
];

export const getSection = (slug) => settingsSections.find((s) => s.slug === slug) ?? null;

export const weightSumOf = (d, keys) => keys.reduce((sum, key) => sum + Number(d[key] || 0), 0);
