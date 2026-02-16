"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const trimmedEmail = email.trim();

    const { error: authError } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: trimmedEmail,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup") {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.push(searchParams.get("redirect") ?? "/onboarding");
      } else {
        setMessage("Check your email for a confirmation link.");
      }
      return;
    }

    router.push(searchParams.get("redirect") ?? "/app");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm text-slate-400 hover:text-white" href="/">
            ← Back
          </a>
          <div className="text-sm font-semibold">b2b-equity</div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-2xl font-semibold">
            {mode === "signin" ? "Login" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {mode === "signin"
              ? "Welcome back. Enter your credentials to continue."
              : "Create an account to start posting or proposing."}
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleAuth}>
            <label className="grid gap-2 text-sm">
              Email
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Password
              <input
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
                {message}
              </p>
            ) : null}

            <button
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Working..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-300">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              className="text-emerald-300 hover:text-emerald-200"
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
