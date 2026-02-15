"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Post = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  status: string;
  business_id: string;
};

type Proposal = {
  id: string;
  proposed_by: string;
  deliverables: string | null;
  timeline_days: number | null;
  equity_ask: number | null;
  status: string;
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

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
        .select("id, title, category, description, status, business_id")
        .eq("id", postId)
        .single();

      if (postError) {
        setError(postError.message);
        setLoading(false);
        return;
      }

      const { data: proposalData } = await supabase
        .from("proposals")
        .select("id, proposed_by, deliverables, timeline_days, equity_ask, status")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (!active) return;

      setPost(postData);
      setProposals(proposalData ?? []);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [postId, router]);

  const handleAccept = async (proposal: Proposal) => {
    if (!post) return;
    setError(null);
    setProcessing(proposal.id);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data: dealRows, error: dealError } = await supabase
      .from("deals")
      .insert({
        post_id: post.id,
        business_id: post.business_id,
        founder_id: session.user.id,
        helper_id: proposal.proposed_by,
      })
      .select("id")
      .single();

    if (dealError) {
      setError(dealError.message);
      setProcessing(null);
      return;
    }

    const units = proposal.equity_ask ?? 10;
    const { error: milestoneError } = await supabase
      .from("deal_milestones")
      .insert({
        deal_id: dealRows.id,
        title: "Initial milestone",
        acceptance_criteria: "Deliverables confirmed and accepted.",
        equity_grant_units: units,
      });

    if (milestoneError) {
      setError(milestoneError.message);
      setProcessing(null);
      return;
    }

    await supabase
      .from("proposals")
      .update({ status: "accepted" })
      .eq("id", proposal.id);

    await supabase
      .from("problem_posts")
      .update({ status: "matched" })
      .eq("id", post.id);

    setProcessing(null);
    router.push("/app");
  };

  const handleReject = async (proposal: Proposal) => {
    setError(null);
    setProcessing(proposal.id);

    const { error: rejectError } = await supabase
      .from("proposals")
      .update({ status: "rejected" })
      .eq("id", proposal.id);

    setProcessing(null);

    if (rejectError) {
      setError(rejectError.message);
      return;
    }

    setProposals((prev) =>
      prev.map((item) =>
        item.id === proposal.id ? { ...item, status: "rejected" } : item
      )
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Post not found.</p>
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
          <div className="text-sm font-semibold">Post details</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-[0.25em] text-emerald-400">
              {post.status}
            </div>
            <h1 className="text-2xl font-semibold">{post.title}</h1>
            {post.category ? (
              <p className="text-sm text-slate-300">{post.category}</p>
            ) : null}
            {post.description ? (
              <p className="text-sm text-slate-300">{post.description}</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Proposals</h2>
            <span className="text-xs text-slate-400">
              {proposals.length} total
            </span>
          </div>

          <div className="mt-4 grid gap-4">
            {proposals.length === 0 ? (
              <p className="text-sm text-slate-300">No proposals yet.</p>
            ) : (
              proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      Proposal {proposal.id.slice(0, 6)}
                    </div>
                    <div className="text-xs text-slate-400">{proposal.status}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    {proposal.deliverables || "No deliverables provided."}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Timeline: {proposal.timeline_days ?? "n/a"} days · Equity ask:{" "}
                    {proposal.equity_ask ?? "n/a"}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                      onClick={() => handleAccept(proposal)}
                      disabled={processing === proposal.id}
                    >
                      {processing === proposal.id ? "Accepting..." : "Accept proposal"}
                    </button>
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
                      onClick={() => handleReject(proposal)}
                      disabled={processing === proposal.id}
                    >
                      {processing === proposal.id ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))
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
