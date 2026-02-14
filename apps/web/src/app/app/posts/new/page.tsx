"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
};

export default function NewProblemPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const [businessId, setBusinessId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [equityMin, setEquityMin] = useState("");
  const [equityMax, setEquityMax] = useState("");

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      const { data: businessRows } = await supabase
        .from("businesses")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (!active) return;

      setBusinesses(businessRows ?? []);
      setBusinessId(businessRows?.[0]?.id ?? "");
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const { error: insertError } = await supabase.from("problem_posts").insert({
      business_id: businessId,
      created_by: session.user.id,
      title: title.trim(),
      category: category.trim() || null,
      description: description.trim() || null,
      equity_min: equityMin ? Number(equityMin) : null,
      equity_max: equityMax ? Number(equityMax) : null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/app");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm text-slate-400 hover:text-white" href="/app">
            ← Back
          </a>
          <div className="text-sm font-semibold">New problem post</div>
        </header>

        {businesses.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <p className="text-sm text-slate-300">
              Create a business first before posting a problem.
            </p>
            <a
              className="mt-4 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              href="/app/business/new"
            >
              Create business
            </a>
          </section>
        ) : (
          <form
            className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
            onSubmit={handleSubmit}
          >
            <label className="grid gap-2 text-sm">
              Business
              <select
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Title
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Category
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Description
              <textarea
                className="min-h-[120px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Equity min (%)
                <input
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                  value={equityMin}
                  onChange={(event) => setEquityMin(event.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Equity max (%)
                <input
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                  value={equityMax}
                  onChange={(event) => setEquityMax(event.target.value)}
                  inputMode="decimal"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Create post"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
