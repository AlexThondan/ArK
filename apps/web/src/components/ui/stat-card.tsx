import { cn } from '@/lib/utils';

export function StatCard({
  title,
  value,
  hint,
  className
}: {
  title: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-white/25 bg-white/70 p-5 shadow-glass backdrop-blur dark:bg-slate-900/60', className)}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

