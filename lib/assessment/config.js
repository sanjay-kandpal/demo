// Single source of truth for the housing-loan feasibility & social-priority
// policy parameters. Tune values here rather than in the engine code.

export const financialWeights = {
  dbr: 0.30,
  residualIncomePerMember: 0.30,
  aecbConduct: 0.20,
  incomeStability: 0.10,
  stressResilience: 0.10,
};

export const socialWeights = {
  housingSituation: 0.30,
  dependants: 0.25,
  incomeBand: 0.20,
  vulnerabilityFlags: 0.15,
  expectedImpact: 0.10,
};

export const bandThresholds = {
  financial: { high: 70, medium: 45 },
  social: { high: 65, medium: 40 },
};

export const livingStandardFloor = {
  floor: 3000, // AED per household member — 0 score at/below this
  comfortable: 6000, // AED per household member — full score at/above this
};

export const aecbScale = {
  hardFloor: 550, // below this: hard decline gate (300-549 = "V Poor")
  min: 300,
  max: 900,
};

export const hardGates = {
  minAge: 21,
  maxAgeAtMaturity: 70,
  dbrHardCeiling: 0.60,
  maxTenureYears: 25,
  // Income band with an extended max tenor (360 months) per policy note.
  extendedTenure: { minIncome: 21000, maxIncome: 40000, maxTenureYears: 30 },
  tenureExtensionOnEnhancementYears: 5,
};

export const stressTest = {
  financingRateShock: 0.03,
  incomeHaircut: 0.20,
  stressedDbrPass: 0.50,
};

export const impactAndVulnerability = {
  firstTimeBeneficiary: { yes: 100, no: 20 },
  vulnerabilityPointsPerFlag: 25,
  vulnerabilityCap: 100,
};

// Recognised monthly income (AED) -> social score. Upper bound is inclusive;
// the last bracket has no upper bound.
export const incomeBandTable = [
  { label: "Lowest", upper: 15000, score: 100 },
  { label: "Low", upper: 25000, score: 75 },
  { label: "Middle", upper: 40000, score: 50 },
  { label: "Upper", upper: 60000, score: 25 },
  { label: "Highest", upper: null, score: 10 },
];

export const housingSituationTable = {
  owns_adequate: { label: "Owns adequate home", score: 0 },
  renting_adequate: { label: "Renting – adequate", score: 40 },
  family_adequate: { label: "Living with family – adequate", score: 55 },
  renting_overcrowded: { label: "Renting – overcrowded", score: 70 },
  family_overcrowded: { label: "Living with family – overcrowded", score: 85 },
  inadequate_unsafe: { label: "Inadequate / unsafe", score: 100 },
};

// Employment type -> income-stability score. Not specified by the source
// sheet as a table; assumed ordering, tune as needed.
export const employmentStabilityTable = {
  government: 100,
  private: 70,
  business: 50,
  retired: 40,
};

// Dependants -> social score. Not specified by the source sheet as a table;
// assumed linear scale (20 pts/dependant, capped at 100), tune as needed.
export const dependantsScoring = {
  pointsPerDependant: 20,
  cap: 100,
};

// Financial|Social band decision matrix.
export const decisionMatrix = {
  "High|High": {
    decision: "Approve – Priority",
    grantPercent: 0,
    targetDbr: 0.35,
    tenure: "Standard",
    conditions: "Priority queue position; standard terms",
  },
  "High|Medium": {
    decision: "Approve",
    grantPercent: 0,
    targetDbr: 0.35,
    tenure: "Standard",
    conditions: "Standard terms",
  },
  "High|Low": {
    decision: "Refer to Partner-Bank",
    grantPercent: 0,
    targetDbr: null,
    tenure: "n/a",
    conditions:
      "Above-floor capacity, below social floor — divert to commercial product",
  },
  "Medium|High": {
    decision: "Approve + Enhancement",
    grantPercent: 15,
    targetDbr: 0.30,
    tenure: "Extended",
    conditions: "Grant top-up; financial counselling",
  },
  "Medium|Medium": {
    decision: "Approve",
    grantPercent: 5,
    targetDbr: 0.35,
    tenure: "Standard",
    conditions: "Standard terms; optional counselling",
  },
  "Medium|Low": {
    decision: "Approve – Monitor",
    grantPercent: 0,
    targetDbr: 0.35,
    tenure: "Standard",
    conditions: "Approve with conduct monitoring",
  },
  "Low|High": {
    decision: "Approve + Full Enhancement",
    grantPercent: 30,
    targetDbr: 0.40,
    tenure: "Extended",
    conditions:
      "Max grant; co-applicant; forbearance pre-auth; counselling",
  },
  "Low|Medium": {
    decision: "Approve w/ Mitigants",
    grantPercent: 20,
    targetDbr: 0.42,
    tenure: "Extended",
    conditions: "Grant; co-applicant; counselling",
  },
  "Low|Low": {
    decision: "Decline / Defer",
    grantPercent: 0,
    targetDbr: null,
    tenure: "n/a",
    conditions:
      "Defer; enrol in financial development plan and re-assess",
  },
};

// Buckets the final decision text into one of the three UI-level outcomes.
export const decisionCategory = (decisionLabel) => {
  if (decisionLabel.startsWith("Refer to Partner-Bank")) return "refer";
  if (decisionLabel.startsWith("Decline")) return "decline";
  return "approve";
};
