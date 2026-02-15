"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

      const { data: rows, error: fetchError } = await supabase
        .from("notifications")
        .select("id, title, body, link_url, read_at, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      }

      setNotifications(rows ?? []);
      setLoading(false);
    };

    init();

    return () => {
      active = false;
    };
  }, [router]);

  const markRead = async (id: string) => {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
          <p className="text-sm text-slate-400">Loading notifications...</p>
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
          <div className="text-sm font-semibold">Notifications</div>
        </header>

        <section className="grid gap-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-300">No notifications yet.</p>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                {item.body ? (
                  <p className="mt-2 text-sm text-slate-300">{item.body}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {item.link_url ? (
                    <a
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
                      href={item.link_url}
                    >
                      View
                    </a>
                  ) : null}
                  {item.read_at ? (
                    <span className="text-xs text-slate-400">Read</span>
                  ) : (
                    <button
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
                      onClick={() => markRead(item.id)}
                    >
                      Mark read
                    </button>
                  )}
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
