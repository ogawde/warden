import { APP_NAME, FINDING_CATEGORIES } from "@warden/contracts";

const seedRepository = {
  name: "warden-demo/debt-lab",
  defaultBranch: "main",
  monitoringEnabled: true
};

export default function RepositoryDashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {APP_NAME} Repository Dashboard
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Milestone M0 placeholder dashboard for a single monitored repository.
      </p>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-medium text-slate-900">Repository</h2>
        <dl className="mt-4 grid gap-3 text-sm text-slate-700">
          <div className="flex justify-between">
            <dt>Name</dt>
            <dd>{seedRepository.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Default branch</dt>
            <dd>{seedRepository.defaultBranch}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Monitoring</dt>
            <dd>{seedRepository.monitoringEnabled ? "Enabled" : "Disabled"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-medium text-slate-900">
          MVP Finding Categories
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {FINDING_CATEGORIES.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
