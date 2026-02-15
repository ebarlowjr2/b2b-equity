"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  role: "founder" | "helper";
};

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/app" },
  { label: "Market", href: "/app/market" },
  { label: "Deals", href: "/app/deals" },
  { label: "Cap Table", href: "/app/cap-table" },
  { label: "Portfolio", href: "/app/portfolio" },
  { label: "Notifications", href: "/app/notifications" },
  { label: "Settings", href: "/app/settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      if (!sessionData.session) {
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();

      if (!active) return;

      setProfile(profileRow ?? null);

      if (profileRow?.role === "founder") {
        const { data: businessRows } = await supabase
          .from("businesses")
          .select("id, name")
          .order("created_at", { ascending: false });

        if (!active) return;

        setBusinesses(businessRows ?? []);
        setSelectedBusinessId(businessRows?.[0]?.id ?? "");
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const activeLabel = useMemo(() => {
    const match = navItems.find((item) => pathname === item.href);
    return match?.label ?? "";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 flex-col gap-6 border-r border-slate-800 px-6 py-8 md:flex">
          <div className="text-lg font-semibold">b2b-equity</div>
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">{activeLabel}</div>
              <div className="hidden text-xs text-slate-500 md:block">
                {profile?.role === "founder" ? "Founder" : "Helper"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile?.role === "founder" ? (
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  Active business
                  <select
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100"
                    value={selectedBusinessId}
                    onChange={(event) => setSelectedBusinessId(event.target.value)}
                  >
                    {businesses.length === 0 ? (
                      <option value="">No businesses</option>
                    ) : (
                      businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              ) : null}

              <Link
                href="/app/notifications"
                className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-white"
              >
                Notifications
              </Link>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
