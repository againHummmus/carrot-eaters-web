'use client';

import { useEffect, useState } from 'react';
import {
  formatAmount,
  scaleAmount,
  scaleNutrients,
  type RecipeIngredient,
  type RecipeWithIngredients,
} from '@/lib/shared';
import { useTranslations } from 'next-intl';
import { addEntry, readEntries, removeEntry } from '@/lib/shoppingList';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 50;

export function RecipeDetail({ recipe }: { recipe: RecipeWithIngredients }) {
  const t = useTranslations('recipe');
  const shopping = useTranslations('shopping');
  const common = useTranslations('common');
  const nutrients = useTranslations('day');
  const amountFormat = { toTaste: t('toTaste'), decimal: common('decimal') };
  const [servings, setServings] = useState(1);
  const [inList, setInList] = useState<string[]>([]);
  const totals = scaleNutrients(recipe, servings);

  // Read after mount so the server and the client render the same first paint.
  useEffect(() => {
    setInList(
      readEntries()
        .filter((entry) => entry.recipe_id === recipe.id)
        .map((entry) => entry.ingredient_id)
    );
  }, [recipe.id]);

  /** The amount that lands in the list is the one on screen, so it follows the servings picker. */
  function toggleInList(ingredient: RecipeIngredient) {
    if (inList.includes(ingredient.id)) {
      removeEntry(recipe.id, ingredient.id);
      setInList((current) => current.filter((x) => x !== ingredient.id));
      return;
    }

    addEntry({
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      ingredient_id: ingredient.id,
      name: ingredient.name,
      amount: scaleAmount(ingredient.amount, servings),
      unit: ingredient.unit,
    });
    setInList((current) => [...current, ingredient.id]);
  }

  const step = (delta: number) =>
    setServings((current) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, current + delta)));

  const stepButton = 'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white';

  return (
    <>
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{recipe.title}</h1>
        {recipe.description && <p className="mt-1 text-sm text-slate-500">{recipe.description}</p>}
      </div>

      <section
        className="animate-fade-in-up flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/3"
        style={{ animationDelay: '40ms' }}
      >
        <div>
          <p className="text-sm font-medium text-slate-700">{t('servings')}</p>
          <p className="text-xs text-slate-400">{t('servingsHint')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={() => step(-1)} disabled={servings <= MIN_SERVINGS} aria-label={t('fewerServings')} className={stepButton}>
            −
          </button>
          <span className="w-8 text-center text-lg font-semibold tabular-nums text-slate-900">{servings}</span>
          <button type="button" onClick={() => step(1)} disabled={servings >= MAX_SERVINGS} aria-label={t('moreServings')} className={stepButton}>
            +
          </button>
        </div>
      </section>

      <section
        className="animate-fade-in-up flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/3"
        style={{ animationDelay: '80ms' }}
      >
        <h2 className="text-sm font-medium text-slate-500">
          {t('ingredients')} · {t('servingsCount', { count: servings })}
        </h2>
        <ul className="-my-1 flex flex-col">
          {recipe.ingredients.map((ingredient) => {
            const added = inList.includes(ingredient.id);
            return (
              <li key={ingredient.id}>
                <div className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-slate-50">
                  <span className="flex-1 text-slate-700">{ingredient.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {formatAmount(scaleAmount(ingredient.amount, servings), ingredient.unit, amountFormat)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleInList(ingredient)}
                    aria-label={added ? shopping('remove') : shopping('add')}
                    aria-pressed={added}
                    title={added ? shopping('remove') : shopping('add')}
                    className={`shrink-0 rounded-full p-1.5 transition-colors ${
                      added ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill={added ? 'currentColor' : 'none'} className="h-5 w-5">
                      <path
                        d="M5.5 9.5h13l-1.2 8a2 2 0 0 1-2 1.7H8.7a2 2 0 0 1-2-1.7l-1.2-8Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path d="M9 9.5 12 4l3 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="animate-fade-in-up flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/3"
        style={{ animationDelay: '120ms' }}
      >
        <h2 className="text-sm font-medium text-slate-500">
          {t('nutrition')} · {t('servingsCount', { count: servings })}
        </h2>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums text-slate-900">{Math.round(totals.kcal)}</span>
          <span className="text-sm text-slate-400">{common('kcal')}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {[
            { label: nutrients('protein'), value: totals.protein },
            { label: nutrients('fat'), value: totals.fat },
            { label: nutrients('carbs'), value: totals.carbs },
          ].map((macro) => (
            <div key={macro.label} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-400">{macro.label}</p>
              <p className="font-medium tabular-nums text-slate-800">
                {Math.round(macro.value)} {common('g')}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 text-sm">
          {[
            { label: nutrients('fiber'), value: totals.fiber, unit: common('g') },
            { label: nutrients('sugar'), value: totals.sugar, unit: common('g') },
            { label: nutrients('saturatedFat'), value: totals.saturated_fat, unit: common('g') },
            { label: nutrients('cholesterol'), value: totals.cholesterol, unit: common('mg') },
            { label: nutrients('sodium'), value: totals.sodium, unit: common('mg') },
          ].map((nutrient) => (
            <div key={nutrient.label} className="flex justify-between gap-3">
              <span className="text-slate-500">{nutrient.label}</span>
              <span className="shrink-0 tabular-nums text-slate-600">
                {nutrient.value === null ? '—' : `${Math.round(nutrient.value)} ${nutrient.unit}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {recipe.steps.length > 0 && (
        <section
          className="animate-fade-in-up flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/3"
          style={{ animationDelay: '160ms' }}
        >
          <h2 className="text-sm font-medium text-slate-500">{t('steps')}</h2>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((stepText, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
                  {i + 1}
                </span>
                <span className="pt-0.5">{stepText}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
