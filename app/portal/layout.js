"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: "dashboard" },
  { href: "/portal/assessment", label: "Beneficiary Assessment", icon: "fact_check" },
  { href: "/portal/settings", label: "Decision Engine Settings", icon: "tune" },
];

export default function PortalLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState({ ready: false, email: "" });

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("adha_admin_logged_in");
    if (!loggedIn) {
      router.replace("/");
      return;
    }
    // Auth state lives in sessionStorage (an external system); syncing it
    // into component state on mount is exactly this effect's job.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession({
      ready: true,
      email: sessionStorage.getItem("adha_admin_email") || "admin@adha.gov.ae",
    });
  }, [router]);

  const { ready, email } = session;

  const handleLogout = () => {
    sessionStorage.removeItem("adha_admin_logged_in");
    sessionStorage.removeItem("adha_admin_email");
    router.push("/");
  };

  if (!ready) {
    return <div className="bg-background min-h-screen" />;
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <aside className="w-64 shrink-0 bg-surface border-r border-outline-variant flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-outline-variant">
          <img src="/Adha_Logo.png" alt="ADHA" className="h-10 w-auto" />
        </div>
        <nav className="flex-grow py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded font-label-bold text-label-bold transition-colors duration-200 ${
                  active
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-outline-variant">
          <p className="text-label-sm text-on-surface-variant truncate mb-3">{email}</p>
          <button
            className="w-full flex items-center justify-center gap-2 border-2 border-secondary text-secondary hover:bg-secondary hover:text-on-secondary font-label-bold text-label-bold py-2 px-4 rounded transition-colors duration-300"
            type="button"
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-grow flex flex-col min-w-0">
        <header className="h-20 bg-surface border-b border-outline-variant flex items-center px-8 sticky top-0 z-10">
          <h1 className="font-headline-md text-headline-md text-primary">ADHA Admin Portal</h1>
        </header>
        <main className="flex-grow p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
