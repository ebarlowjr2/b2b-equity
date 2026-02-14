export default function LoginPage() {
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
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-slate-300">
            Supabase auth will live here. For now this is a placeholder screen.
          </p>
          <div className="mt-6 grid gap-3">
            <button className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
              Sign in
            </button>
            <button className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold">
              Create account
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
