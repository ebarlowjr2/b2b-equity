export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-wide">b2b-equity</div>
          <nav className="flex gap-4 text-sm text-slate-300">
            <a className="hover:text-white" href="/login">Login</a>
            <a className="hover:text-white" href="/app">Dashboard</a>
          </nav>
        </header>

        <section className="flex flex-col gap-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">
            Equity-for-support marketplace
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Match founders with operators, and mint equity only when milestones ship.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Post problems, collect proposals, and approve deliverables. The cap table
            updates from the ledger, not a manual spreadsheet.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950"
              href="/login"
            >
              Get started
            </a>
            <a
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
              href="/app"
            >
              View dashboard
            </a>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Founder-ready flow",
              copy: "Create a business, post a problem, and accept a proposal in minutes.",
            },
            {
              title: "Milestones drive equity",
              copy: "Helpers submit evidence and founders approve before equity mints.",
            },
            {
              title: "Cap table by ledger",
              copy: "Ownership is computed from immutable equity ledger entries.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
            >
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
