'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarClock, ClipboardList, LayoutDashboard, Settings, ShieldCheck, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/attendance', label: 'Attendance', icon: CalendarClock },
  { href: '/leave', label: 'Leave', icon: Bell },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/manager/team', label: 'Manager Team', icon: Users },
  { href: '/hr/analytics', label: 'HR Analytics', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Admin', icon: Settings }
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-[1500px] gap-6 p-4 md:grid-cols-[260px_1fr] md:p-6">
        <aside className="rounded-3xl border border-white/20 bg-white/70 p-4 shadow-glass backdrop-blur dark:bg-slate-900/70">
          <h1 className="px-2 py-3 text-xl font-semibold">Company Suite</h1>
          <nav className="mt-2 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                    active
                      ? 'bg-brand-500/15 text-brand-900 dark:text-brand-100'
                      : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/70'
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="space-y-4">
          <header className="flex items-center justify-between rounded-3xl border border-white/20 bg-white/70 px-5 py-4 shadow-glass backdrop-blur dark:bg-slate-900/70">
            <p className="text-sm text-slate-500">Premium Enterprise HRMS</p>
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
              onClick={() => document.documentElement.classList.toggle('dark')}
            >
              Toggle Theme
            </button>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
