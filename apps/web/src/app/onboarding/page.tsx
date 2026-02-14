"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const roles = [
  { value: "founder", label: "Founder", helper: "I run the business" },
  { value: "helper", label: "Helper", helper: "I help founders ship work" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"founder" | "helper" | "">("");
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile) {
        router.replace("/app");
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

    if (!role) {
      setError("Choose a role to continue.");
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: session.user.id,
      name: name.trim() || null,
      role,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.replace("/app");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
          <p className="text-sm text-slate-400">Preparing onboarding...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-sm text-slate-400">b2b-equity</div>
          <button
            className="text-sm text-slate-300 hover:text-white"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-2xl font-semibold">Choose your role</h1>
          <p className="mt-2 text-sm text-slate-300">
            This helps us tailor your workspace. You can update it later.
          </p>

          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm">
              Name (optional)
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Founder"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              {roles.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRole(item.value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    role === item.value
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <div className="text-base font-semibold">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-300">
                    {item.helper}
                  </div>
                </button>
              ))}
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
              {saving ? "Saving..." : "Continue to dashboard"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
