import { NextResponse } from "next/server";
import { assess } from "@/lib/assessment/engine";
import { housingSituationTable, employmentStabilityTable } from "@/lib/assessment/config";

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = {
    age: num(body.age),
    dependents: num(body.dependents),
    employment: body.employment,
    monthlyIncome: num(body.monthlyIncome),
    otherIncome: num(body.otherIncome) || 0,
    existingMonthlyDebt: num(body.existingMonthlyDebt) || 0,
    creditCardMinimums: num(body.creditCardMinimums) || 0,
    requestedLoanAmount: num(body.requestedLoanAmount),
    financingRatePercent: num(body.financingRatePercent),
    requestedTenureYears: num(body.requestedTenureYears),
    aecbScore: num(body.aecbScore),
    housingSituation: body.housingSituation,
    vulnerabilityFlagCount: num(body.vulnerabilityFlagCount) || 0,
    firstTimeBeneficiary: Boolean(body.firstTimeBeneficiary),
  };

  const errors = [];
  const requiredNumeric = [
    "age",
    "dependents",
    "monthlyIncome",
    "requestedLoanAmount",
    "financingRatePercent",
    "requestedTenureYears",
    "aecbScore",
  ];
  for (const field of requiredNumeric) {
    if (Number.isNaN(input[field])) errors.push(`"${field}" must be a number.`);
  }
  if (!employmentStabilityTable[input.employment]) {
    errors.push(`"employment" must be one of: ${Object.keys(employmentStabilityTable).join(", ")}.`);
  }
  if (!housingSituationTable[input.housingSituation]) {
    errors.push(`"housingSituation" must be one of: ${Object.keys(housingSituationTable).join(", ")}.`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed.", details: errors }, { status: 400 });
  }

  const result = assess(input);
  return NextResponse.json(result);
}
