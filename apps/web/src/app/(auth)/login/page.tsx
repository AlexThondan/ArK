'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      });
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/20 bg-white/70 p-6 shadow-glass backdrop-blur dark:bg-slate-900/60">
        <h1 className="text-xl font-semibold">Sign in to Company Suite</h1>
        <div className="mt-4 space-y-3">
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input name="password" type="password" required placeholder="Password" className="w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <button type="submit" className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white">
          Sign In
        </button>
      </form>
    </div>
  );
}

