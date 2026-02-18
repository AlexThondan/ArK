export default function AttendancePage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-glass backdrop-blur dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <p className="mt-2 text-sm text-slate-500">Check-in/out and timesheet tracking.</p>
        <div className="mt-4 flex gap-2">
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">Check In</button>
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Check Out</button>
        </div>
      </div>
    </div>
  );
}

