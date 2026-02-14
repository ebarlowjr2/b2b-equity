"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
  description: string | null;
};

type ProblemPost = {
  id: string;
  title: string;
  status: string;
  business_id: string;
};

export default function AppPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [posts, setPosts] = useState<ProblemPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
      }

      if (!profile) {
        router.replace("/onboarding");
        return;
      }

      const { data: businessRows, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, description")
        .order("created_at", { ascending: false });

      if (businessError) {
        setError(businessError.message);
      }

      const { data: postRows, error: postError } = await supabase
        .from("problem_posts")
        .select("id, title, status, business_id")
        .order("created_at", { ascending: false });

      if (postError) {
        setError(postError.message);
      }

      setBusinesses(businessRows ?? []);
      setPosts(postRows ?? []);
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
          <h1 className="text-2xl font-semibold">Founder workspace</h1>
          <p className="mt-2 text-sm text-slate-300">
            Signed in as {email ?? "unknown"}. Create businesses, post problems,
            and review proposals.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              href="/app/business/new"
            >
              New business
            </a>
            <a
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
              href="/app/posts/new"
            >
              New problem post
            </a>
            <a
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
              href="/app/market"
            >
              Browse market
            </a>
            <a
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
              href="/app/deals"
            >
              View deals
            </a>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Businesses</h2>
              <span className="text-xs text-slate-400">{businesses.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {businesses.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No businesses yet. Create one to get started.
                </p>
              ) : (
                businesses.map((business) => (
                  <div
                    key={business.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="text-sm font-semibold">{business.name}</div>
                    {business.description ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {business.description}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Problem posts</h2>
              <span className="text-xs text-slate-400">{posts.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {posts.length === 0 ? (
                <p className="text-sm text-slate-300">
                  No problem posts yet. Create one to invite proposals.
                </p>
              ) : (
                posts.map((post) => (
                  <a
                    key={post.id}
                    href={`/app/posts/${post.id}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{post.title}</div>
                      <span className="text-xs text-slate-400">{post.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      View proposals →
                    </p>
                  </a>
                ))
              )}
            </div>
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
