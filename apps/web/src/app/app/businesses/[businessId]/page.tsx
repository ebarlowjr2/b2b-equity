"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
};

type Review = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  name: string | null;
};

export default function BusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
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

      const { data: businessRow, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, description, owner_id")
        .eq("id", businessId)
        .maybeSingle();

      if (businessError) {
        setError(businessError.message);
      }

      if (businessRow) {
        const { data: ownerRow, error: ownerError } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", businessRow.owner_id)
          .maybeSingle();

        if (ownerError) {
          setError(ownerError.message);
        }

        setOwner(ownerRow ?? null);

        const { data: reviewRows, error: reviewError } = await supabase
          .from("reviews")
          .select("id, rating, text, created_at")
          .eq("reviewee_id", businessRow.owner_id)
          .order("created_at", { ascending: false });

        if (reviewError) {
          setError(reviewError.message);
        }

        const avg = reviewRows?.length
          ? reviewRows.reduce((sum, row) => sum + row.rating, 0) / reviewRows.length
          : null;

        setReviews(reviewRows ?? []);
        setAvgRating(avg);
      }

      setBusiness(businessRow ?? null);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [businessId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading business...</p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-300">Business not found.</p>
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
          <div className="text-sm font-semibold">Business</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-2xl font-semibold">{business.name}</h1>
          {business.description ? (
            <p className="mt-2 text-sm text-slate-300">{business.description}</p>
          ) : null}
          <div className="mt-4 text-sm text-slate-300">
            Founder: {owner?.name ?? business.owner_id.slice(0, 6)}
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Founder rating: {avgRating ? avgRating.toFixed(2) : "n/a"}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">Founder reviews</h2>
          <div className="mt-4 grid gap-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-300">No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="text-sm font-semibold">
                    Rating: {review.rating}/5
                  </div>
                  {review.text ? (
                    <p className="mt-2 text-sm text-slate-300">{review.text}</p>
                  ) : null}
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString()}
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
