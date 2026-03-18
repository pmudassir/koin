import { v4 as uuidv4 } from "uuid";
import { Transaction } from "../models/Transaction";
import { getItem, setItem, STORAGE_KEYS } from "./mmkv";

export function getTransactions(): Transaction[] {
  return getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
}

export function addTransaction(
  txn: Omit<Transaction, "id" | "timestamp" | "synced">,
): Transaction {
  const transactions = getTransactions();
  const newTxn: Transaction = {
    ...txn,
    id: uuidv4(),
    timestamp: Date.now(),
    synced: false,
  };
  transactions.unshift(newTxn);
  setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

  // Fire budget alert check (async, non-blocking)
  if (txn.type !== 'income') {
    import('../services/budgetAlerts').then((m) => m.checkBudgetAlerts()).catch(() => {});
  }
  // Update widgets
  import('../services/widgetBridge').then((m) => m.updateWidgetData()).catch(() => {});

  return newTxn;
}

export function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
): Transaction | null {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return null;

  transactions[index] = { ...transactions[index], ...updates, synced: false };
  setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

  import('../services/widgetBridge').then((m) => m.updateWidgetData()).catch(() => {});
  return transactions[index];
}

export function deleteTransaction(id: string): boolean {
  const transactions = getTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  if (filtered.length === transactions.length) return false;
  setItem(STORAGE_KEYS.TRANSACTIONS, filtered);
  import('../services/widgetBridge').then((m) => m.updateWidgetData()).catch(() => {});
  return true;
}

export function getTransactionsForDay(date: Date): Transaction[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return getTransactions().filter(
    (t) => t.timestamp >= start.getTime() && t.timestamp <= end.getTime(),
  );
}

export function getTodayTotal(): number {
  return getTransactionsForDay(new Date())
    .filter((t) => t.type !== 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getWeeklyTotal(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return getTransactions()
    .filter((t) => t.type !== 'income' && t.timestamp >= monday.getTime())
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyTotal(): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  return getTransactions()
    .filter((t) => t.type !== 'income' && t.timestamp >= monthStart.getTime())
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getPeriodTotal(): number {
  const period = getBudgetPeriod();
  if (period === "weekly") return getWeeklyTotal();
  if (period === "monthly") return getMonthlyTotal();
  return getTodayTotal();
}

export function getWeeklyData(): { day: string; amount: number }[] {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  return days.map((label, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + mondayOffset + i);
    const dayTxns = getTransactionsForDay(date);
    return {
      day: label,
      amount: dayTxns.reduce((sum, t) => sum + t.amount, 0),
    };
  });
}

export function getCategoryBreakdown(): {
  category: string;
  amount: number;
  percentage: number;
}[] {
  const transactions = getTransactions();
  const categoryMap: Record<string, number> = {};
  const total = transactions.reduce((sum, t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    return sum + t.amount;
  }, 0);

  return Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getDailyBudget(): number {
  return getItem<number>(STORAGE_KEYS.DAILY_BUDGET) || 2500;
}

export function setDailyBudget(budget: number): void {
  setItem(STORAGE_KEYS.DAILY_BUDGET, budget);
}

export type BudgetPeriod = "daily" | "weekly" | "monthly";

export function getBudgetPeriod(): BudgetPeriod {
  return getItem<BudgetPeriod>(STORAGE_KEYS.BUDGET_PERIOD) || "daily";
}

export function setBudgetPeriod(period: BudgetPeriod): void {
  setItem(STORAGE_KEYS.BUDGET_PERIOD, period);
}

export function markTransactionsSynced(ids: string[]): void {
  const transactions = getTransactions();
  const idSet = new Set(ids);
  const updated = transactions.map((t) =>
    idSet.has(t.id) ? { ...t, synced: true } : t,
  );
  setItem(STORAGE_KEYS.TRANSACTIONS, updated);
}

export function getTransactionsForMonth(
  year: number,
  month: number,
): Transaction[] {
  const start = new Date(year, month, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month + 1, 0);
  end.setHours(23, 59, 59, 999);

  return getTransactions().filter(
    (t) => t.timestamp >= start.getTime() && t.timestamp <= end.getTime(),
  );
}

export function getTransactionsForDateRange(
  startDate: Date,
  endDate: Date,
): Transaction[] {
  return getTransactions().filter(
    (t) =>
      t.timestamp >= startDate.getTime() && t.timestamp <= endDate.getTime(),
  );
}

export interface SearchFilters {
  categories?: string[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export function searchTransactions(
  query: string,
  filters?: SearchFilters,
): Transaction[] {
  let results = getTransactions();

  // Text search: match merchant, note, or category
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter(
      (t) =>
        t.merchant.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)),
    );
  }

  // Category filter
  if (filters?.categories && filters.categories.length > 0) {
    const cats = new Set(filters.categories.map((c) => c.toLowerCase()));
    results = results.filter((t) => cats.has(t.category.toLowerCase()));
  }

  // Date range filter
  if (filters?.startDate) {
    const start = filters.startDate.getTime();
    results = results.filter((t) => t.timestamp >= start);
  }
  if (filters?.endDate) {
    const end = filters.endDate.getTime();
    results = results.filter((t) => t.timestamp <= end);
  }

  // Amount range filter
  if (filters?.minAmount !== undefined) {
    results = results.filter((t) => t.amount >= filters.minAmount!);
  }
  if (filters?.maxAmount !== undefined) {
    results = results.filter((t) => t.amount <= filters.maxAmount!);
  }

  return results;
}

/** Helper to check if a transaction is an expense (backward compatible) */
function isExpense(t: Transaction): boolean {
  return t.type !== 'income';
}

/** Get today's income */
export function getTodayIncome(): number {
  return getTransactionsForDay(new Date())
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Get monthly income */
export function getMonthlyIncome(): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  return getTransactions()
    .filter((t) => t.type === 'income' && t.timestamp >= monthStart.getTime())
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Get net balance (income - expenses) for a date range */
export function getNetBalance(startDate: Date, endDate: Date): number {
  const txns = getTransactionsForDateRange(startDate, endDate);
  return txns.reduce((sum, t) => {
    if (t.type === 'income') return sum + t.amount;
    return sum - t.amount;
  }, 0);
}
