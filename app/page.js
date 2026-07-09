"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    sessionStorage.setItem("adha_admin_logged_in", "true");
    sessionStorage.setItem("adha_admin_email", email || "admin@adha.gov.ae");
    router.push("/portal");
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/Adha_Logo.png" alt="ADHA" className="h-16 w-auto mb-4" />
          <h1 className="font-headline-lg text-headline-lg text-primary text-center">
            Admin Portal
          </h1>
          <p className="text-body-md text-on-surface-variant text-center mt-2">
            Sign in to review housing loan applications
          </p>
        </div>

        <form
          className="bg-surface border border-surface-variant rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all"
              id="email"
              placeholder="admin@adha.gov.ae"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="font-label-bold text-label-bold text-on-surface mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md py-3 px-4 transition-all"
              id="password"
              placeholder="••••••••"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-bold text-label-bold py-3 px-8 rounded transition-all duration-300"
            type="submit"
          >
            Sign In
          </button>
        </form>

        <p className="text-label-sm text-on-surface-variant text-center mt-6">
          Demo environment — any credentials will sign you in.
        </p>
      </div>
    </div>
  );
}
