import { getItem, setItem, STORAGE_KEYS } from './mmkv';

/** Get per-category budget limits */
export function getCategoryBudgets(): Record<string, number> {
  return getItem<Record<string, number>>(STORAGE_KEYS.CATEGORY_BUDGETS) || {};
}

/** Set budget for a specific category */
export function setCategoryBudget(category: string, amount: number): void {
  const budgets = getCategoryBudgets();
  const updated = { ...budgets, [category]: amount };
  setItem(STORAGE_KEYS.CATEGORY_BUDGETS, updated);
}

/** Remove budget for a specific category */
export function removeCategoryBudget(category: string): void {
  const budgets = getCategoryBudgets();
  const { [category]: _, ...rest } = budgets;
  setItem(STORAGE_KEYS.CATEGORY_BUDGETS, rest);
}

/** Get budget for a specific category (returns null if not set) */
export function getCategoryBudget(category: string): number | null {
  const budgets = getCategoryBudgets();
  return budgets[category] ?? null;
}
