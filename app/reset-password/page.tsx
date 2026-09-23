'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

const MIN_PASSWORD = 6;

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // The link arrives either as a PKCE code or, depending on the email template,
  // as a token hash. Either one has to become a session before the password can
  // be changed; landing here already signed in is the third possibility.
  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tokenHash = params.get('token_hash');

    async function openSession(): Promise<boolean> {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        return !error;
      }
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
        return !error;
      }
      const { data } = await supabase.auth.getSession();
      return data.session !== null;
    }

    openSession().then((opened) => {
      setReady(opened);
      // Keep the one-time token out of the address bar and the history.
      if (opened && (code || tokenHash)) {
        window.history.replaceState(null, '', '/reset-password');
      }
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD) {
      setError(t('tooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('mismatch'));
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="animate-fade-in-up flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 rounded-2xl shadow-sm shadow-emerald-500/30" />
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>

        {ready === false ? (
          <p className="animate-fade-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{t('expired')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={t('password')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={t('confirm')}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {error && <p className="animate-fade-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || ready === null}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 font-medium text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>
        )}

        <LocaleSwitcher compact />
      </div>
    </main>
  );
}
