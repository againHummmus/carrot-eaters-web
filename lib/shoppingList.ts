'use client';

import { entryKey, MANUAL_RECIPE_ID, type ShoppingListEntry } from '@/lib/shared';

/** Same place the per-recipe checklist used to live: the browser, not the database. */
const ENTRIES_KEY = 'shopping-list';
const DONE_KEY = 'shopping-list-done';

function read<T>(key: string, isValid: (value: unknown) => value is T): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage disabled: the list just does not survive a reload
  }
}

function isEntry(value: unknown): value is ShoppingListEntry {
  return typeof value === 'object' && value !== null && 'ingredient_id' in value && 'recipe_id' in value;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function readEntries(): ShoppingListEntry[] {
  return read(ENTRIES_KEY, isEntry);
}

export function writeEntries(entries: ShoppingListEntry[]): void {
  write(ENTRIES_KEY, entries);
}

export function readDone(): string[] {
  return read(DONE_KEY, isString);
}

export function writeDone(keys: string[]): void {
  write(DONE_KEY, keys);
}

export function addEntry(entry: ShoppingListEntry): ShoppingListEntry[] {
  const key = entryKey(entry.recipe_id, entry.ingredient_id);
  const next = [
    ...readEntries().filter((existing) => entryKey(existing.recipe_id, existing.ingredient_id) !== key),
    entry,
  ];
  writeEntries(next);
  return next;
}

/** A line the user typed rather than took from a recipe: a name and nothing else. */
export function addManual(name: string): ShoppingListEntry[] {
  return addEntry({
    recipe_id: MANUAL_RECIPE_ID,
    recipe_title: '',
    ingredient_id: `${Date.now()}`,
    name: name.trim(),
    amount: null,
    unit: null,
  });
}

export function removeEntry(recipeId: string, ingredientId: string): ShoppingListEntry[] {
  const key = entryKey(recipeId, ingredientId);
  const next = readEntries().filter((entry) => entryKey(entry.recipe_id, entry.ingredient_id) !== key);
  writeEntries(next);
  return next;
}

export function clearList(): void {
  try {
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(DONE_KEY);
  } catch {
    // ignore
  }
}
