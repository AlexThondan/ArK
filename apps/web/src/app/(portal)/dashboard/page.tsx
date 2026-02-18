'use client';

import { motion } from 'framer-motion';
import { LineKpiChart } from '@/components/charts/line-kpi-chart';
import { StatCard } from '@/components/ui/stat-card';

const attendanceTrend = [
  { name: 'Mon', value: 8.1 },
  { name: 'Tue', value: 8.4 },
  { name: 'Wed', value: 7.9 },
  { name: 'Thu', value: 8.3 },
  { name: 'Fri', value: 8.0 }
];

const teamProductivity = [
  { name: 'W1', value: 72 },
  { name: 'W2', value: 78 },
  { name: 'W3', value: 84 },
  { name: 'W4', value: 88 }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Headcount" value="1,248" hint="+4.8% MoM" />
        <StatCard title="Attrition Rate" value="3.2%" hint="-0.7% QoQ" />
        <StatCard title="Payroll Cost" value="$2.4M" hint="Current month" />
        <StatCard title="Active Users" value="987" hint="Across all portals" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Employee: Attendance Trend</h2>
          <LineKpiChart data={attendanceTrend} dataKey="value" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Manager: Team Productivity</h2>
          <LineKpiChart data={teamProductivity} dataKey="value" />
        </motion.div>
      </section>

      <section className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-glass backdrop-blur dark:bg-slate-900/60">
        <h3 className="text-lg font-semibold">Announcements</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>Policy update: expense reimbursement cycle is now weekly.</li>
          <li>Q2 performance review forms open on March 1, 2026.</li>
          <li>Payroll processing closes on February 26, 2026.</li>
        </ul>
      </section>
    </div>
  );
}

