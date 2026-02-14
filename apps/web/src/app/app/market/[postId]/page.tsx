"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Post = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  equity_min: number | null;
  equity_max: number | null;
  status: string;
};

export default function MarketPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [deliverables, setDeliverables] = useState("");
  const [timelineDays, setTimelineDays] = useState("");
  const [equityAsk, setEquityAsk] = useState("");
  const [saving, setSaving] = useState(false);
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

      const { data: postData, error: postError } = await supabase
        .from("problem_posts")
        .select(
          "id, title, category, description, equity_min, equity_max, status"
        )
        .eq("id", postId)
        .single();

      if (!active) return;

      if (postError) {
        setError(postError.message);
      } else {
        setPost(postData);
      }

      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [postId, router]);

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

    const { error: insertError } = await supabase.from("proposals").insert({
      post_id: postId,
      proposed_by: session.user.id,
      deliverables: deliverables.trim() || null,
      timeline_days: timelineDays ? Number(timelineDays) : null,
      equity_ask: equityAsk ? Number(equityAsk) : null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/app/deals");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading post...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-300">Post not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm text-slate-400 hover:text-white" href="/app/market">
            ← Back
          </a>
          <div className="text-sm font-semibold">Submit proposal</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            {post.status}
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{post.title}</h1>
          {post.category ? (
            <p className="mt-2 text-sm text-slate-300">{post.category}</p>
          ) : null}
          {post.description ? (
            <p className="mt-2 text-sm text-slate-400">{post.description}</p>
          ) : null}
        </section>

        <form
          className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-2 text-sm">
            Deliverables
            <textarea
              className="min-h-[120px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
              value={deliverables}
              onChange={(event) => setDeliverables(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Timeline (days)
            <input
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
              value={timelineDays}
              onChange={(event) => setTimelineDays(event.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Equity ask (units or %)
            <input
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
              value={equityAsk}
              onChange={(event) => setEquityAsk(event.target.value)}
              inputMode="decimal"
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
            {saving ? "Submitting..." : "Submit proposal"}
          </button>
        </form>
      </div>
    </main>
  );
}
