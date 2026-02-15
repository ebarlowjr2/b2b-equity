"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type PostRow = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  equity_min: number | null;
  equity_max: number | null;
  status: string;
};

export default function MarketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
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

      const { data: postRows, error: postError } = await supabase
        .from("problem_posts")
        .select("id, title, category, description, equity_min, equity_max, status")
        .in("status", ["open", "in_review"])
        .order("created_at", { ascending: false });

      if (!active) return;

      if (postError) {
        setError(postError.message);
      }

      setPosts(postRows ?? []);
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
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading market...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm text-slate-400 hover:text-white" href="/app">
            ← Back
          </a>
          <div className="text-sm font-semibold">Problem market</div>
        </header>

        <section className="grid gap-4">
          {posts.length === 0 ? (
            <p className="text-sm text-slate-300">No open problems yet.</p>
          ) : (
            posts.map((post) => (
              <a
                key={post.id}
                href={`/app/market/${post.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-600"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                      {post.status}
                    </div>
                    <h2 className="text-lg font-semibold">{post.title}</h2>
                  </div>
                  <div className="text-xs text-slate-400">
                    Equity range: {post.equity_min ?? "n/a"} - {post.equity_max ?? "n/a"}
                  </div>
                </div>
                {post.category ? (
                  <p className="mt-2 text-sm text-slate-300">{post.category}</p>
                ) : null}
                {post.description ? (
                  <p className="mt-2 text-sm text-slate-400">{post.description}</p>
                ) : null}
              </a>
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
