import { StatCard } from '@/components/ui/stat-card';

export default function HrAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Headcount" value="1,248" />
        <StatCard title="Attrition" value="3.2%" />
        <StatCard title="Payroll Cost" value="$2.4M" />
        <StatCard title="Hiring Funnel" value="210/44/12/8" />
      </div>
    </div>
  );
}

