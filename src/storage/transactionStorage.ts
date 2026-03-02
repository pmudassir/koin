import { randomUUID } from 'expo-crypto';
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
    id: randomUUID(),
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

  transactions[index] = { ...transactions[index], ...updates };
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

export function getWeeklyData(): { day: string; amount: number }[] {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
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

export function markTransactionsSynced(ids: string[]): void {
  const transactions = getTransactions();
  const idSet = new Set(ids);
  const updated = transactions.map((t) =>
    idSet.has(t.id) ? { ...t, synced: true } : t
  );
  setItem(STORAGE_KEYS.TRANSACTIONS, updated);
}
