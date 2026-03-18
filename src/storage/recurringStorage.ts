import { v4 as uuidv4 } from 'uuid';
import { Category, TransactionType } from '../models/Transaction';
import { getItem, setItem, STORAGE_KEYS } from './mmkv';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  type?: TransactionType;
  frequency: RecurringFrequency;
  nextDueDate: number; // timestamp
  enabled: boolean;
  note?: string;
  createdAt: number;
}

export function getRecurringTransactions(): RecurringTransaction[] {
  return getItem<RecurringTransaction[]>(STORAGE_KEYS.RECURRING_TRANSACTIONS) || [];
}

export function addRecurring(
  txn: Omit<RecurringTransaction, 'id' | 'createdAt'>,
): RecurringTransaction {
  const recurring = getRecurringTransactions();
  const newItem: RecurringTransaction = {
    ...txn,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  recurring.push(newItem);
  setItem(STORAGE_KEYS.RECURRING_TRANSACTIONS, recurring);
  return newItem;
}

export function updateRecurring(
  id: string,
  updates: Partial<RecurringTransaction>,
): RecurringTransaction | null {
  const recurring = getRecurringTransactions();
  const index = recurring.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updated = { ...recurring[index], ...updates };
  const newList = [...recurring];
  newList[index] = updated;
  setItem(STORAGE_KEYS.RECURRING_TRANSACTIONS, newList);
  return updated;
}

export function deleteRecurring(id: string): boolean {
  const recurring = getRecurringTransactions();
  const filtered = recurring.filter((r) => r.id !== id);
  if (filtered.length === recurring.length) return false;
  setItem(STORAGE_KEYS.RECURRING_TRANSACTIONS, filtered);
  return true;
}

export function getOverdueRecurring(): RecurringTransaction[] {
  const now = Date.now();
  return getRecurringTransactions().filter(
    (r) => r.enabled && r.nextDueDate <= now,
  );
}

/** Calculate the next due date after processing */
export function advanceNextDueDate(
  current: number,
  frequency: RecurringFrequency,
): number {
  const date = new Date(current);
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.getTime();
}
