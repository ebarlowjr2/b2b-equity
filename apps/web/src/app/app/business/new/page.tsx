"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NewBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

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

    const { error: insertError } = await supabase.from("businesses").insert({
      owner_id: session.user.id,
      name: name.trim(),
      description: description.trim() || null,
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
          <div className="text-sm font-semibold">New business</div>
        </header>

        <form
          className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-2 text-sm">
            Business name
            <input
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            Description (optional)
            <textarea
              className="min-h-[120px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

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
            {saving ? "Saving..." : "Create business"}
          </button>
        </form>
      </div>
    </main>
  );
}
