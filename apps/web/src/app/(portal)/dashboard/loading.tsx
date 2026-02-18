export default function DashboardLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-28 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
      ))}
    </div>
  );
}

