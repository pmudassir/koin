function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import { Transaction } from '../models/Transaction';
import { getItem, setItem, STORAGE_KEYS } from './mmkv';

export function getTransactions(): Transaction[] {
  return getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) || [];
}

export function addTransaction(
  txn: Omit<Transaction, 'id' | 'timestamp' | 'synced'>
): Transaction {
  const transactions = getTransactions();
  const newTxn: Transaction = {
    ...txn,
    id: generateId(),
    timestamp: Date.now(),
    synced: false,
  };
  transactions.unshift(newTxn);
  setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  return newTxn;
}

export function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Transaction | null {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return null;

  transactions[index] = { ...transactions[index], ...updates, synced: false };
  setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  return transactions[index];
}

export function deleteTransaction(id: string): boolean {
  const transactions = getTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  if (filtered.length === transactions.length) return false;
  setItem(STORAGE_KEYS.TRANSACTIONS, filtered);
  return true;
}

export function getTransactionsForDay(date: Date): Transaction[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return getTransactions().filter(
    (t) => t.timestamp >= start.getTime() && t.timestamp <= end.getTime()
  );
}

export function getTodayTotal(): number {
  return getTransactionsForDay(new Date()).reduce(
    (sum, t) => sum + t.amount,
    0
  );
}

export function getWeeklyTotal(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return getTransactions()
    .filter((t) => t.timestamp >= monday.getTime())
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyTotal(): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  return getTransactions()
    .filter((t) => t.timestamp >= monthStart.getTime())
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getPeriodTotal(): number {
  const period = getBudgetPeriod();
  if (period === 'weekly') return getWeeklyTotal();
  if (period === 'monthly') return getMonthlyTotal();
  return getTodayTotal();
}

export function getWeeklyData(): { day: string; amount: number }[] {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
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

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

export function getBudgetPeriod(): BudgetPeriod {
  return getItem<BudgetPeriod>('budget_period') || 'daily';
}

export function setBudgetPeriod(period: BudgetPeriod): void {
  setItem('budget_period', period);
}

export function markTransactionsSynced(ids: string[]): void {
  const transactions = getTransactions();
  const idSet = new Set(ids);
  const updated = transactions.map((t) =>
    idSet.has(t.id) ? { ...t, synced: true } : t
  );
  setItem(STORAGE_KEYS.TRANSACTIONS, updated);
}
