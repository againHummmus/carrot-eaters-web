import { formatAmount, type AmountFormat } from './recipes';

/**
 * The shopping list is a cooking aid like the old per-recipe checklist, so it lives in the
 * client (localStorage in the browser, SharedPreferences on the phone) rather than the database.
 * One entry per ingredient per recipe; the same ingredient coming from several recipes is only
 * merged when the list is shown.
 */
export interface ShoppingListEntry {
  /** `MANUAL_RECIPE_ID` for a line the user typed themselves. */
  recipe_id: string;
  /** Empty for a line the user typed themselves: there is no recipe to name. */
  recipe_title: string;
  ingredient_id: string;
  name: string;
  /** Already scaled to the servings the user picked. Null means an unmeasured ingredient. */
  amount: number | null;
  unit: string | null;
}

/** Stands in for a recipe on the lines the user added by hand. */
export const MANUAL_RECIPE_ID = 'manual';

/**
 * The amount to show against a line. "to taste" is a recipe's way of describing an
 * unmeasured ingredient, so a line the user typed themselves gets no amount at all.
 */
export function formatLineAmount(line: ShoppingListLine, format: AmountFormat = {}): string {
  if (line.amount === null && line.recipeTitles.length === 0) return '';
  return formatAmount(line.amount, line.unit, format);
}

/**
 * The list as plain text, ready to paste into a messenger. Only what is still to be
 * bought: a line already ticked off is not something the reader needs to pick up.
 */
export function shoppingListText(
  title: string,
  lines: ShoppingListLine[],
  done: string[],
  format: AmountFormat = {}
): string {
  const rows = lines
    .filter((line) => !done.includes(line.key))
    .map((line) => {
      const amount = formatLineAmount(line, format);
      return amount ? `— ${line.name}, ${amount}` : `— ${line.name}`;
    });

  return [title, '', ...rows].join('\n');
}

/** Several entries of the same ingredient, added up. */
export interface ShoppingListLine {
  key: string;
  name: string;
  amount: number | null;
  unit: string | null;
  recipeTitles: string[];
}

/** Identifies one ingredient of one recipe, so adding it twice replaces rather than duplicates. */
export function entryKey(recipeId: string, ingredientId: string): string {
  return `${recipeId}:${ingredientId}`;
}

/**
 * What counts as "the same product": the name, ignoring case and padding, together with the unit.
 * Two amounts in different units cannot be added up, so they stay separate lines.
 */
export function lineKey(name: string, unit: string | null): string {
  return `${name.trim().toLowerCase()}|${unit?.trim().toLowerCase() ?? ''}`;
}

/**
 * Adds up entries that describe the same product, keeping the order in which they were added.
 * A line is unmeasured only when every entry behind it is; otherwise the measured ones are summed
 * and the unmeasured ones fold into that total.
 */
export function mergeShoppingList(entries: ShoppingListEntry[]): ShoppingListLine[] {
  const lines = new Map<string, ShoppingListLine>();

  for (const entry of entries) {
    const key = lineKey(entry.name, entry.unit);
    const existing = lines.get(key);

    if (!existing) {
      lines.set(key, {
        key,
        name: entry.name.trim(),
        amount: entry.amount,
        unit: entry.unit,
        recipeTitles: entry.recipe_title ? [entry.recipe_title] : [],
      });
      continue;
    }

    if (entry.amount !== null) {
      existing.amount = (existing.amount ?? 0) + entry.amount;
    }
    if (entry.recipe_title && !existing.recipeTitles.includes(entry.recipe_title)) {
      existing.recipeTitles.push(entry.recipe_title);
    }
  }

  return [...lines.values()];
}
