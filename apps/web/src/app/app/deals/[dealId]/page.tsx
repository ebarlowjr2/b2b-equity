"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Deal = {
  id: string;
  status: string;
  business_id: string;
  founder_id: string;
  helper_id: string;
};

type Milestone = {
  id: string;
  title: string;
  acceptance_criteria: string | null;
  equity_grant_units: number;
  status: string;
};

type Evidence = {
  id: string;
  milestone_id: string;
  evidence_url: string | null;
  notes: string | null;
  created_at: string;
};

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.dealId as string;
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [evidence, setEvidence] = useState<Record<string, Evidence[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      setUserId(sessionData.session.user.id);

      const { data: dealRow, error: dealError } = await supabase
        .from("deals")
        .select("id, status, business_id, founder_id, helper_id")
        .eq("id", dealId)
        .single();

      if (dealError) {
        setError(dealError.message);
        setLoading(false);
        return;
      }

      const { data: milestoneRows, error: milestoneError } = await supabase
        .from("deal_milestones")
        .select("id, title, acceptance_criteria, equity_grant_units, status")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });

      if (milestoneError) {
        setError(milestoneError.message);
      }

      const milestoneIds = (milestoneRows ?? []).map((item) => item.id);
      let evidenceRows: Evidence[] = [];
      if (milestoneIds.length > 0) {
        const { data: evidenceData, error: evidenceError } = await supabase
          .from("milestone_evidence")
          .select("id, milestone_id, evidence_url, notes, created_at")
          .in("milestone_id", milestoneIds)
          .order("created_at", { ascending: false });

        if (evidenceError) {
          setError(evidenceError.message);
        }

        evidenceRows = evidenceData ?? [];
      }

      const grouped: Record<string, Evidence[]> = {};
      for (const row of evidenceRows) {
        if (!grouped[row.milestone_id]) {
          grouped[row.milestone_id] = [];
        }
        grouped[row.milestone_id].push(row);
      }

      setDeal(dealRow);
      setMilestones(milestoneRows ?? []);
      setEvidence(grouped);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [dealId, router]);

  const handleUpload = async (milestoneId: string, file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(milestoneId);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const filePath = `${session.user.id}/${milestoneId}/${Date.now()}-${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("milestone-evidence")
      .upload(filePath, file, { upsert: false });

    if (storageError) {
      setError(storageError.message);
      setUploading(null);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("milestone-evidence")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("milestone_evidence").insert({
      milestone_id: milestoneId,
      submitted_by: session.user.id,
      evidence_url: publicUrl.publicUrl,
      notes: notes[milestoneId]?.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setUploading(null);
      return;
    }

    router.refresh();
    setUploading(null);
  };

  const handleApprove = async (milestoneId: string) => {
    setError(null);
    setApproving(milestoneId);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/approve_milestone`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ milestone_id: milestoneId }),
    });

    if (!response.ok) {
      const message = await response.text();
      setError(message);
      setApproving(null);
      return;
    }

    router.refresh();
    setApproving(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading deal...</p>
        </div>
      </main>
    );
  }

  if (!deal) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-300">Deal not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm text-slate-400 hover:text-white" href="/app/deals">
            ← Back
          </a>
          <div className="text-sm font-semibold">Deal details</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            {deal.status}
          </div>
          <h1 className="mt-2 text-xl font-semibold">Deal {deal.id.slice(0, 6)}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Business {deal.business_id.slice(0, 6)}
          </p>
        </section>

        <section className="grid gap-4">
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-300">No milestones yet.</p>
          ) : (
            milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{milestone.title}</div>
                  <span className="text-xs text-slate-400">{milestone.status}</span>
                </div>
                {milestone.acceptance_criteria ? (
                  <p className="mt-2 text-sm text-slate-300">
                    {milestone.acceptance_criteria}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">
                  Equity units: {milestone.equity_grant_units}
                </p>

                <div className="mt-4 grid gap-3">
                  {userId === deal.helper_id ? (
                    <>
                      <label className="grid gap-2 text-xs text-slate-400">
                        Upload evidence
                        <input
                          type="file"
                          className="text-sm"
                          onChange={(event) =>
                            handleUpload(
                              milestone.id,
                              event.target.files?.[0] ?? null
                            )
                          }
                          disabled={uploading === milestone.id}
                        />
                      </label>
                      <textarea
                        className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                        placeholder="Evidence notes (optional)"
                        value={notes[milestone.id] ?? ""}
                        onChange={(event) =>
                          setNotes((prev) => ({
                            ...prev,
                            [milestone.id]: event.target.value,
                          }))
                        }
                      />
                    </>
                  ) : null}

                  {userId === deal.founder_id ? (
                    <button
                      className="w-fit rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
                      onClick={() => handleApprove(milestone.id)}
                      disabled={approving === milestone.id}
                    >
                      {approving === milestone.id
                        ? "Approving..."
                        : "Approve milestone"}
                    </button>
                  ) : null}

                  {evidence[milestone.id]?.length ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Evidence
                      </div>
                      <ul className="mt-2 grid gap-2 text-sm text-slate-300">
                        {evidence[milestone.id].map((item) => (
                          <li key={item.id}>
                            <a
                              className="text-emerald-300 hover:text-emerald-200"
                              href={item.evidence_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.evidence_url ?? "Evidence link"}
                            </a>
                            {item.notes ? (
                              <p className="mt-1 text-xs text-slate-400">
                                {item.notes}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
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
