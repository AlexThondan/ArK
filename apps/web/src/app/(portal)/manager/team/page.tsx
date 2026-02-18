import { StatCard } from '@/components/ui/stat-card';

export default function ManagerTeamPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Team Size" value={18} />
        <StatCard title="Task Completion" value="84%" />
        <StatCard title="Absentee Rate" value="4.9%" />
      </div>
      <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-glass backdrop-blur dark:bg-slate-900/60">
        Team productivity, KPI trends, and resource allocation go here.
      </div>
    </div>
  );
}

