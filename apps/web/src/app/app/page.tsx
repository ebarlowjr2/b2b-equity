export default function AppPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-lg font-semibold">Dashboard</div>
          <nav className="flex gap-4 text-sm text-slate-300">
            <a className="hover:text-white" href="/">Home</a>
            <a className="hover:text-white" href="/login">Logout</a>
          </nav>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h1 className="text-2xl font-semibold">Protected App Area</h1>
          <p className="mt-2 text-sm text-slate-300">
            This dashboard will be protected by Supabase auth in the next step.
          </p>
        </section>
      </div>
    </main>
  );
}
