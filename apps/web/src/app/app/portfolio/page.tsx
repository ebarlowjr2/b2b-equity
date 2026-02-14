"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LedgerRow = {
  id: string;
  business_id: string;
  recipient_user_id: string;
  units: number;
};

type Business = {
  id: string;
  name: string;
};

type EquitySetting = {
  business_id: string;
  total_units: number;
};

type PortfolioRow = {
  business_id: string;
  business_name: string;
  units: number;
  total_units: number | null;
};

export default function PortfolioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [settings, setSettings] = useState<EquitySetting[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      const { data: ledgerRows, error: ledgerError } = await supabase
        .from("equity_ledger_entries")
        .select("id, business_id, recipient_user_id, units")
        .eq("recipient_user_id", sessionData.session.user.id);

      if (ledgerError) {
        setError(ledgerError.message);
      }

      const businessIds = (ledgerRows ?? []).map((row) => row.business_id);

      const { data: businessRows, error: businessError } = await supabase
        .from("businesses")
        .select("id, name")
        .in("id", businessIds.length ? businessIds : ["00000000-0000-0000-0000-000000000000"]);

      if (businessError) {
        setError(businessError.message);
      }

      const { data: settingsRows, error: settingsError } = await supabase
        .from("business_equity_settings")
        .select("business_id, total_units")
        .in("business_id", businessIds.length ? businessIds : ["00000000-0000-0000-0000-000000000000"]);

      if (settingsError) {
        setError(settingsError.message);
      }

      setLedger(ledgerRows ?? []);
      setBusinesses(businessRows ?? []);
      setSettings(settingsRows ?? []);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [router]);

  const portfolio = useMemo(() => {
    const businessMap = new Map(businesses.map((b) => [b.id, b.name]));
    const settingsMap = new Map(settings.map((s) => [s.business_id, s.total_units]));
    const totals: Record<string, number> = {};

    ledger.forEach((row) => {
      totals[row.business_id] = (totals[row.business_id] ?? 0) + Number(row.units);
    });

    return Object.entries(totals).map(([business_id, units]) => ({
      business_id,
      business_name: businessMap.get(business_id) ?? business_id.slice(0, 6),
      units,
      total_units: settingsMap.get(business_id) ?? null,
    })) as PortfolioRow[];
  }, [ledger, businesses, settings]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading portfolio...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm text-slate-400 hover:text-white" href="/app">
            ← Back
          </a>
          <div className="text-sm font-semibold">Helper portfolio</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">Equity earned</h2>
          <div className="mt-4 grid gap-3">
            {portfolio.length === 0 ? (
              <p className="text-sm text-slate-300">No equity earned yet.</p>
            ) : (
              portfolio.map((row) => {
                const percent =
                  row.total_units && row.total_units > 0
                    ? ((row.units / row.total_units) * 100).toFixed(2)
                    : "n/a";
                return (
                  <div
                    key={row.business_id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="text-sm font-semibold">{row.business_name}</div>
                    <div className="mt-2 text-xs text-slate-400">
                      Units: {row.units} · Ownership: {percent}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {error ? (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
