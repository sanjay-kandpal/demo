"use client";

import { useRouter } from "next/navigation";
import { applicants } from "@/lib/applicants";

const employmentLabels = {
  government: "Government",
  private: "Private Sector",
  business: "Business Owner",
  retired: "Retired",
};

const currency = (value) => `AED ${value.toLocaleString()}`;

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Applications</h2>
        <p className="text-body-md text-on-surface-variant">
          {applicants.length} applications awaiting review
        </p>
      </div>

      <div className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-surface-variant">
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant">Applicant</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant">Emirates ID</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant">Employment</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant">Requested Loan</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant">Submitted</th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant">Status</th>
              <th className="py-4 px-6"></th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr
                key={applicant.id}
                className="border-b border-surface-variant last:border-0 hover:bg-surface-container-lowest transition-colors cursor-pointer"
                onClick={() => router.push(`/portal/applicants/${applicant.id}`)}
              >
                <td className="py-4 px-6 font-label-bold text-label-bold text-on-surface">{applicant.fullName}</td>
                <td className="py-4 px-6 text-body-md text-on-surface-variant">{applicant.emiratesId}</td>
                <td className="py-4 px-6 text-body-md text-on-surface-variant">
                  {employmentLabels[applicant.employment] ?? applicant.employment}
                </td>
                <td className="py-4 px-6 text-body-md text-on-surface-variant">
                  {currency(applicant.requestedLoanAmount)}
                </td>
                <td className="py-4 px-6 text-body-md text-on-surface-variant">{applicant.submittedDate}</td>
                <td className="py-4 px-6">
                  <span className="inline-block bg-secondary-container text-on-secondary-container text-label-sm font-label-bold py-1 px-3 rounded-full">
                    {applicant.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
