'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function LineKpiChart({ data, dataKey }: { data: Array<Record<string, string | number>>; dataKey: string }) {
  return (
    <div className="h-72 rounded-2xl border border-white/20 bg-white/70 p-4 shadow-glass backdrop-blur dark:bg-slate-900/60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

