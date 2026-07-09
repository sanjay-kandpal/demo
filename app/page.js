"use client";

import { useRef, useState } from "react";

const initialFormValues = {
  fullName: "",
  age: "",
  emiratesId: "",
  maritalStatus: "",
  dependents: "",
  employment: "",
  employerName: "",
  lengthOfService: "",
  income: "",
  otherIncome: "",
  debt: "",
  existingLoanType: "",
  creditCards: "",
  requestedLoan: "",
  downPayment: "",
  propertyLocation: "",
  nationality: false,
};

export default function Home() {
  const formRef = useRef(null);
  const [values, setValues] = useState(initialFormValues);
  const [eligibility, setEligibility] = useState(null);

  const updateValue = (event) => {
    const { id, value, type, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const calculateEligibility = () => {
    const form = formRef.current;
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const income = parseFloat(values.income);
    const debt = parseFloat(values.debt);
    const age = parseInt(values.age, 10);
    const isEligible = debt / income < 0.5 && age >= 21 && age <= 60;

    setEligibility(isEligible ? "eligible" : "review");
  };

  return (
    <>
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
        <header className="bg-surface w-full top-0 sticky border-b border-outline-variant z-50">
          <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md font-bold text-primary">
                ADHA
              </span>
            </div>
            <nav aria-label="Main Navigation" className="hidden md:flex gap-8 items-center">
              <a className="font-label-bold text-label-bold text-on-surface-variant hover:text-secondary transition-colors duration-300 ease-in-out py-2" href="#">About Us</a>
              <a aria-current="page" className="font-label-bold text-label-bold text-primary border-b-2 border-secondary pb-1 transition-all duration-300 ease-in-out" href="#">Services</a>
              <a className="font-label-bold text-label-bold text-on-surface-variant hover:text-secondary transition-colors duration-300 ease-in-out py-2" href="#">Projects</a>
            </nav>
            <div className="flex items-center gap-4">
              <button className="hidden md:block font-label-bold text-label-bold text-primary border-2 border-secondary hover:bg-secondary hover:text-on-secondary transition-colors duration-300 px-4 py-2 rounded" type="button">Contact Us</button>
              <button className="font-label-bold text-label-bold text-on-primary bg-primary hover:bg-primary-container transition-colors duration-300 px-6 py-2 rounded" type="button">Sign In</button>
            </div>
          </div>
        </header>
        <main className="flex-grow">
          <section className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60 mix-blend-multiply z-10"></div>
              <div className="absolute inset-0 bg-cover bg-center w-full h-full" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDQK1zlZP4-doz6KD8mWJHBnuNkyziBBlqSsFCCMWrqLCBkAvEUsQUxGFcPU1j5mguU3ePKyL37tB_RM4doPrLXrAvYu3-GdUQVlGY3zAE1M7aKam-NS4kOGZ3fgQo3j0mCUix0ZghRZ9vbjczr2laup1s6yf1EpJwRk18WS7HQia183oJHb-kgCKjLWxydrpgYBU_v1zipXvhSe06S2v2NdB-NJIwYp8or62C9UTLHGP17wcw7l-76_luNW6vVZjLCqpw')" }}></div>
            </div>
            <div className="relative z-20 text-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-on-primary">
              <h1 className="font-headline-display text-headline-display mb-6">Home Loan Eligibility Calculator</h1>
              <p className="font-body-lg text-body-lg max-w-2xl mx-auto opacity-90">Find the right housing support tailored for you. Calculate your eligibility instantly and take the first step towards securing your future home in Abu Dhabi.</p>
            </div>
          </section>
          <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
            <div className="max-w-4xl mx-auto bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 md:p-12 relative -mt-32 z-30">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-8 border-b border-surface-variant pb-4">Calculate Your Eligibility</h2>
              <form className="space-y-10" id="eligibility-form" ref={formRef}>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-6">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="fullName">Full Name</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="fullName" placeholder="e.g. Ahmed Ali" required type="text" value={values.fullName} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="age">Age</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="age" max="80" min="18" placeholder="e.g. 35" required type="number" value={values.age} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="emiratesId">Emirates ID Number</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="emiratesId" placeholder="784-XXXX-XXXXXXX-X" required type="text" value={values.emiratesId} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="maritalStatus">Marital Status</label><div className="relative"><select className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 appearance-none pr-10 transition-all" id="maritalStatus" required value={values.maritalStatus} onChange={updateValue}><option value="" disabled>Select Status</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select><span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span></div></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="dependents">Number of Dependents</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="dependents" min="0" placeholder="e.g. 2" required type="number" value={values.dependents} onChange={updateValue} /></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-6">Income &amp; Employment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="employment">Employment Type</label><div className="relative"><select className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 appearance-none pr-10 transition-all" id="employment" required value={values.employment} onChange={updateValue}><option value="" disabled>Select Employment</option><option value="government">Government</option><option value="private">Private Sector</option><option value="business">Business Owner</option><option value="retired">Retired</option></select><span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span></div></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="employerName">Employer Name</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="employerName" placeholder="e.g. ADNOC" required type="text" value={values.employerName} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="lengthOfService">Length of Service (Years)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="lengthOfService" min="0" placeholder="e.g. 5" required type="number" value={values.lengthOfService} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="income">Monthly Gross Income (AED)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="income" placeholder="e.g. 25000" required type="number" value={values.income} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="otherIncome">Other Monthly Income (AED)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="otherIncome" placeholder="e.g. 5000" type="number" value={values.otherIncome} onChange={updateValue} /></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-6">Financial Commitments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="debt">Monthly Debt / Installments (AED)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="debt" placeholder="e.g. 5000" required type="number" value={values.debt} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="existingLoanType">Existing Loan Type</label><div className="relative"><select className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 appearance-none pr-10 transition-all" id="existingLoanType" required value={values.existingLoanType} onChange={updateValue}><option value="" disabled>Select Type</option><option value="none">None</option><option value="personal">Personal Loan</option><option value="auto">Auto Loan</option><option value="mortgage">Mortgage</option></select><span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span></div></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="creditCards">Credit Card Minimums (AED)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="creditCards" placeholder="e.g. 1000" type="number" value={values.creditCards} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="requestedLoan">Requested Loan Amount (AED)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="requestedLoan" placeholder="e.g. 1000000" required type="number" value={values.requestedLoan} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="downPayment">Down Payment Amount (AED)</label><input className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all" id="downPayment" placeholder="e.g. 200000" required type="number" value={values.downPayment} onChange={updateValue} /></div>
                    <div className="flex flex-col"><label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="propertyLocation">Property Location</label><div className="relative"><select className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 appearance-none pr-10 transition-all" id="propertyLocation" required value={values.propertyLocation} onChange={updateValue}><option value="" disabled>Select Location</option><option value="abu-dhabi">Abu Dhabi City</option><option value="al-ain">Al Ain</option><option value="al-dhafra">Al Dhafra</option></select><span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span></div></div>
                  </div>
                </div>
                <div className="pt-4 pb-2 border-t border-surface-variant">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input className="peer appearance-none w-6 h-6 border-2 border-outline rounded checked:bg-primary checked:border-primary focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-all" id="nationality" required type="checkbox" checked={values.nationality} onChange={updateValue} />
                      <span className="material-symbols-outlined absolute text-on-primary opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[18px] font-bold">check</span>
                    </div>
                    <span className="font-body-md text-on-surface group-hover:text-primary transition-colors">I confirm that I am a UAE National holding a valid family book (Khulasat Al Qaid) issued by the Emirate of Abu Dhabi.</span>
                  </label>
                </div>
                <div className="pt-6">
                  <button className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary font-label-bold text-label-bold py-4 px-8 rounded transition-all duration-300 flex justify-center items-center gap-2 group" id="calculate-btn" type="button" onClick={calculateEligibility}>
                    Check Eligibility
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </form>
              {eligibility && (
                <div className={`mt-10 p-6 rounded-lg border-l-4 ${eligibility === "eligible" ? "border-primary bg-primary-container/10" : "border-error bg-error-container/20"}`}>
                  {eligibility === "eligible" ? (
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-[32px] text-primary fill">check_circle</span>
                      <div>
                        <h3 className="font-headline-md text-headline-md text-primary mb-2">Initial Eligibility Confirmed</h3>
                        <p className="font-body-md text-on-surface-variant mb-4">Based on the details provided, you meet the initial criteria for ADHA home loan support. Your debt-to-burden ratio falls within the acceptable range.</p>
                        <button className="bg-primary hover:bg-primary-container text-on-primary font-label-bold py-2 px-6 rounded transition-colors" type="button">Start Formal Application</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-[32px] text-error fill">info</span>
                      <div>
                        <h3 className="font-headline-md text-headline-md text-error mb-2">Further Review Required</h3>
                        <p className="font-body-md text-on-surface-variant mb-2">Based on the details provided, your current profile requires further consultation. Common reasons include:</p>
                        <ul className="list-disc list-inside font-body-md text-on-surface-variant ml-2 mb-4">
                          <li>Debt-to-burden ratio exceeding 50%</li>
                          <li>Age constraints for specific loan durations</li>
                        </ul>
                        <button className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-on-secondary font-label-bold py-2 px-6 rounded transition-colors" type="button">Book a Consultation</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
        <footer className="bg-surface-container-highest w-full bottom-0">
          <div className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between gap-8">
            <div className="flex flex-col gap-4">
              <span className="font-headline-md text-headline-md font-bold text-primary">ADHA</span>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Empowering citizens through sustainable housing solutions.</p>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-6 md:justify-end">
                <a className="font-body-md text-body-md text-on-surface-variant hover:underline transition-all opacity-90 hover:opacity-100" href="#">Privacy Policy</a>
                <a className="font-body-md text-body-md text-on-surface-variant hover:underline transition-all opacity-90 hover:opacity-100" href="#">Terms of Service</a>
                <a className="font-body-md text-body-md text-on-surface-variant hover:underline transition-all opacity-90 hover:opacity-100" href="#">Accessibility</a>
                <a className="font-body-md text-body-md text-on-surface-variant hover:underline transition-all opacity-90 hover:opacity-100" href="#">Sitemap</a>
              </div>
              <div className="md:text-right">
                <p className="font-body-md text-body-md text-on-surface-variant">© 2024 Abu Dhabi Housing Authority. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
