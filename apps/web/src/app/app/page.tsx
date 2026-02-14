"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AppPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
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

      if (!profile) {
        router.replace("/onboarding");
        return;
      }

      setEmail(data.session.user.email ?? null);
      setChecking(false);
    };

    loadSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        } else {
          setEmail(session.user.email ?? null);
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
          <p className="text-sm text-slate-400">Checking session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-lg font-semibold">Dashboard</div>
          <nav className="flex gap-4 text-sm text-slate-300">
            <a className="hover:text-white" href="/">
              Home
            </a>
            <button className="hover:text-white" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-2xl font-semibold">Protected App Area</h1>
          <p className="mt-2 text-sm text-slate-300">
            Signed in as {email ?? "unknown"}. The next steps will include
            business setup, problem posts, and proposal workflows.
          </p>
        </section>
      </div>
    </main>
  );
}
