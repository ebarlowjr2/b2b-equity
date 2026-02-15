"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
};

type CapTableRow = {
  business_id: string;
  holder_user_id: string;
  units_sum: number;
};

type EquitySetting = {
  business_id: string;
  total_units: number;
};

type HolderSummary = {
  recipient_user_id: string;
  units: number;
};

export default function CapTablePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [capRows, setCapRows] = useState<CapTableRow[]>([]);
  const [settings, setSettings] = useState<EquitySetting | null>(null);
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

      const { data: businessRows, error: businessError } = await supabase
        .from("businesses")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (businessError) {
        setError(businessError.message);
      }

      setBusinesses(businessRows ?? []);
      setSelectedBusinessId(businessRows?.[0]?.id ?? "");
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedBusinessId) return;
    let active = true;

    const loadLedger = async () => {
      const { data: capTableRows, error: ledgerError } = await supabase
        .from("cap_table_view")
        .select("business_id, holder_user_id, units_sum")
        .eq("business_id", selectedBusinessId);

      if (!active) return;

      if (ledgerError) {
        setError(ledgerError.message);
      }

      const { data: settingsRow, error: settingsError } = await supabase
        .from("business_equity_settings")
        .select("business_id, total_units")
        .eq("business_id", selectedBusinessId)
        .maybeSingle();

      if (settingsError) {
        setError(settingsError.message);
      }

      setCapRows(capTableRows ?? []);
      setSettings(settingsRow ?? null);
    };

    loadLedger();

    return () => {
      active = false;
    };
  }, [selectedBusinessId]);

  const totals = useMemo(() => {
    const holders: HolderSummary[] = capRows.map((row) => ({
      recipient_user_id: row.holder_user_id,
      units: Number(row.units_sum),
    }));

    const totalUnits = settings?.total_units ?? 0;
    return { holders, totalUnits };
  }, [capRows, settings]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading cap table...</p>
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
          <div className="text-sm font-semibold">Cap table</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <label className="grid gap-2 text-sm">
            Business
            <select
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
              value={selectedBusinessId}
              onChange={(event) => setSelectedBusinessId(event.target.value)}
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 text-sm text-slate-300">
            Total units: {totals.totalUnits || "n/a"}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">Holders</h2>
          <div className="mt-4 grid gap-3">
            {totals.holders.length === 0 ? (
              <p className="text-sm text-slate-300">No ledger entries yet.</p>
            ) : (
              totals.holders.map((holder) => {
                const percent =
                  totals.totalUnits > 0
                    ? ((holder.units / totals.totalUnits) * 100).toFixed(2)
                    : "0.00";
                return (
                  <div
                    key={holder.recipient_user_id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="text-sm font-semibold">
                      Holder {holder.recipient_user_id.slice(0, 6)}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Units: {holder.units} · Ownership: {percent}%
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
