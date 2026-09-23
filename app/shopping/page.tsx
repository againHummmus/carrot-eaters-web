import { redirect } from 'next/navigation';
import { requireUser, fetchProfile } from '@/lib/auth';
import { AppHeader } from '@/components/AppHeader';
import { getTranslations } from 'next-intl/server';
import { ShoppingList } from './ShoppingList';

export default async function ShoppingPage() {
  const t = await getTranslations('shopping');
  const { supabase, userId } = await requireUser();
  const profile = await fetchProfile(supabase, userId);
  if (!profile) redirect('/onboarding');

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pb-24 pt-4">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
        </div>

        <ShoppingList />
      </main>
    </div>
  );
}
