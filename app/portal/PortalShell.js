"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { key: "overview", href: "/portal/overview", label: "Overview", icon: "insights" },
  { key: "settings", href: "/portal/settings", label: "Decision Engine Configuration", icon: "tune" },
  {
    key: "dashboard",
    href: "/portal",
    label: "Dashboard",
    icon: "dashboard",
    // Manual expand via the +/− button, auto-collapse on leaving the section.
    autoExpand: false,
    sectionMatch: (pathname) =>
      pathname === "/portal" ||
      pathname === "/portal/assessment" ||
      pathname.startsWith("/portal/applicants"),
    children: [
      { href: "/portal/assessment", label: "Beneficiary Assessment", icon: "fact_check" },
    ],
  },
];

function navLinkClass(active) {
  return `flex items-center gap-3 px-4 py-3 rounded font-label-bold text-label-bold transition-colors duration-200 ${
    active
      ? "bg-primary text-on-primary"
      : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
  }`;
}

function NavGroup({ item, pathname, expanded, onToggle }) {
  const parentActive = pathname === item.href;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-1 rounded transition-colors duration-200 ${
          parentActive ? "bg-primary text-on-primary" : ""
        }`}
      >
        <a
          href={item.href}
          className={`flex-1 min-w-0 flex items-center gap-3 px-4 py-3 rounded font-label-bold text-label-bold transition-colors duration-200 ${
            parentActive
              ? "text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          {item.label}
        </a>
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 flex items-center justify-center w-10 h-12 rounded transition-colors duration-200 ${
            parentActive
              ? "text-on-primary hover:bg-black/10"
              : "text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary"
          }`}
          aria-expanded={expanded}
          aria-label={expanded ? `Hide ${item.label} sections` : `Show ${item.label} sections`}
        >
          <span className="material-symbols-outlined text-[20px]">{expanded ? "remove" : "add"}</span>
        </button>
      </div>
      {/* grid-rows 0fr -> 1fr animates the reveal without measuring heights */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`ml-4 space-y-1 border-l border-outline-variant pl-2 transition-opacity duration-300 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            {item.children.map((child) => (
              <a key={child.href} href={child.href} className={navLinkClass(pathname === child.href)}>
                <span className="material-symbols-outlined text-[20px]">{child.icon}</span>
                {child.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState({ ready: false, email: "" });
  const [expandedGroups, setExpandedGroups] = useState({});

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

  useEffect(() => {
    // Route-driven expand/collapse: leaving a group's section collapses it;
    // groups marked autoExpand open as soon as the route enters their section.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedGroups((prev) => {
      const next = { ...prev };
      for (const item of navItems) {
        if (!item.children) continue;
        if (!item.sectionMatch(pathname)) next[item.key] = false;
        else if (item.autoExpand) next[item.key] = true;
      }
      return next;
    });
  }, [pathname]);

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
        <nav className="flex-grow py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <NavGroup
                  key={item.key}
                  item={item}
                  pathname={pathname}
                  expanded={Boolean(expandedGroups[item.key])}
                  onToggle={() =>
                    setExpandedGroups((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                  }
                />
              );
            }

            const active = pathname === item.href;
            return (
              <a key={item.href} href={item.href} className={navLinkClass(active)}>
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
