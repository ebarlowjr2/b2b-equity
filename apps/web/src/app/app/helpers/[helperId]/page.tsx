"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  name: string | null;
};

type Review = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
};

export default function HelperProfilePage() {
  const router = useRouter();
  const params = useParams();
  const helperId = params.helperId as string;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
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

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", helperId)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
      }

      const { data: reviewRows, error: reviewError } = await supabase
        .from("reviews")
        .select("id, rating, text, created_at")
        .eq("reviewee_id", helperId)
        .order("created_at", { ascending: false });

      if (reviewError) {
        setError(reviewError.message);
      }

      const avg = reviewRows?.length
        ? reviewRows.reduce((sum, row) => sum + row.rating, 0) / reviewRows.length
        : null;

      setProfile(profileRow ?? null);
      setReviews(reviewRows ?? []);
      setAvgRating(avg);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [helperId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading helper profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-300">Helper not found.</p>
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
          <div className="text-sm font-semibold">Helper profile</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="text-lg font-semibold">
            {profile.name ?? `Helper ${profile.id.slice(0, 6)}`}
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Average rating: {avgRating ? avgRating.toFixed(2) : "n/a"}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold">Reviews</h2>
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
