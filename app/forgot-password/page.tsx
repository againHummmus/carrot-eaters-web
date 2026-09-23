'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword');

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // A bare path, no query string: Supabase matches the return address against
    // its allowlist literally, and anything extra is the usual reason it falls
    // back to the site root instead.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    // Whether the address is registered is not something to reveal here, so the
    // same confirmation follows either way.
    if (error && error.status !== 400) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="animate-fade-in-up flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 rounded-2xl shadow-sm shadow-emerald-500/30" />
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>

        {sent ? (
          <p className="animate-fade-in rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t('sent')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder={t('email')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {error && <p className="animate-fade-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 font-medium text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            {t('back')}
          </Link>
        </p>
        <LocaleSwitcher compact />
      </div>
    </main>
  );
}
