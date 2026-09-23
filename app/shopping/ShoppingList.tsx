'use client';

import { useEffect, useState } from 'react';
import {
  formatLineAmount,
  lineKey,
  mergeShoppingList,
  shoppingListText,
  type ShoppingListEntry,
} from '@/lib/shared';
import { useTranslations } from 'next-intl';
import { addManual, clearList, readDone, readEntries, writeDone, writeEntries } from '@/lib/shoppingList';

export function ShoppingList() {
  const t = useTranslations('shopping');
  const recipe = useTranslations('recipe');
  const common = useTranslations('common');
  const amountFormat = { toTaste: recipe('toTaste'), decimal: common('decimal') };

  const [entries, setEntries] = useState<ShoppingListEntry[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [own, setOwn] = useState('');
  const [copied, setCopied] = useState(false);

  // Read after mount so the server and the client render the same first paint.
  useEffect(() => {
    setEntries(readEntries());
    setDone(readDone());
  }, []);

  const lines = mergeShoppingList(entries);
  const bought = lines.filter((line) => done.includes(line.key)).length;

  function toggle(key: string) {
    const next = done.includes(key) ? done.filter((x) => x !== key) : [...done, key];
    setDone(next);
    writeDone(next);
  }

  function removeLine(key: string) {
    const next = entries.filter((entry) => lineKey(entry.name, entry.unit) !== key);
    setEntries(next);
    writeEntries(next);

    const remaining = done.filter((x) => x !== key);
    setDone(remaining);
    writeDone(remaining);
  }

  function submitOwn(event: React.FormEvent) {
    event.preventDefault();
    if (!own.trim()) return;

    setEntries(addManual(own));
    setOwn('');
  }

  /** The share sheet where the browser has one, the clipboard everywhere else. */
  async function share() {
    const text = shoppingListText(t('title'), lines, done, amountFormat);

    if (navigator.share) {
      await navigator.share({ text }).catch(() => {
        // the user dismissed the sheet
      });
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearEverything() {
    clearList();
    setEntries([]);
    setDone([]);
  }

  return (
    <>
      <form
        onSubmit={submitOwn}
        className="animate-fade-in-up flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/3"
      >
        <input
          value={own}
          onChange={(event) => setOwn(event.target.value)}
          placeholder={t('ownPlaceholder')}
          aria-label={t('own')}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-95"
        >
          {t('addOwn')}
        </button>
      </form>

      {lines.length === 0 && (
        <p className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400">
          {t('empty')}
        </p>
      )}

      {lines.length > 0 && (
        <>
      <section className="animate-fade-in-up flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/3">
        <p className="text-xs tabular-nums text-slate-400">{t('boughtOf', { bought, total: lines.length })}</p>
        <ul className="-my-1 flex flex-col">
          {lines.map((line) => {
            const checked = done.includes(line.key);
            return (
              <li key={line.key}>
                <div className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-slate-50">
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggle(line.key)} className="peer sr-only" />
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 ${
                        checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                      }`}
                    >
                      <svg viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}>
                        <path d="M5 10.5L8.5 14L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="flex-1">
                      <span className={`block transition-colors ${checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {line.name}
                      </span>
                      {line.recipeTitles.length > 0 && (
                        <span className="block text-xs text-slate-400">
                          {t('fromRecipes', { recipes: line.recipeTitles.join(', ') })}
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 tabular-nums transition-colors ${checked ? 'text-slate-300 line-through' : 'text-slate-500'}`}>
                      {formatLineAmount(line, amountFormat)}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    aria-label={t('remove')}
                    className="shrink-0 rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                      <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        onClick={share}
        className="animate-fade-in-up rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-[0.99]"
        style={{ animationDelay: '40ms' }}
      >
        {copied ? t('copied') : t('share')}
      </button>

      <button
        type="button"
        onClick={clearEverything}
        className="animate-fade-in-up rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
        style={{ animationDelay: '80ms' }}
      >
        {t('clear')}
      </button>
        </>
      )}
    </>
  );
}
