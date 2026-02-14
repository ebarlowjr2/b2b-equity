"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type DealRow = {
  id: string;
  status: string;
  business_id: string;
};

export default function DealsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<DealRow[]>([]);
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

      const { data: dealRows, error: dealError } = await supabase
        .from("deals")
        .select("id, status, business_id")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (dealError) {
        setError(dealError.message);
      }

      setDeals(dealRows ?? []);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading deals...</p>
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
          <div className="text-sm font-semibold">Deals</div>
        </header>

        <section className="grid gap-4">
          {deals.length === 0 ? (
            <p className="text-sm text-slate-300">No deals yet.</p>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                  {deal.status}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Deal {deal.id.slice(0, 6)} · Business {deal.business_id.slice(0, 6)}
                </div>
              </div>
            ))
          )}
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
