import { Transaction, Category } from '../models/Transaction';
import { getTransactions } from '../storage/transactionStorage';

export interface Suggestion {
  merchant: string;
  amount: number;
  category: Category;
  icon: string;
  confidence: number; // 0-1
  source: 'recent' | 'frequency' | 'time' | 'amount';
}

/** Last 10 unique merchants */
export function getRecentSuggestions(): Suggestion[] {
  const transactions = getTransactions();
  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];

  for (const txn of transactions) {
    if (seen.has(txn.merchant)) continue;
    seen.add(txn.merchant);
    suggestions.push({
      merchant: txn.merchant,
      amount: txn.amount,
      category: txn.category,
      icon: getCategoryIcon(txn.category),
      confidence: 0.8,
      source: 'recent',
    });
    if (suggestions.length >= 10) break;
  }
  return suggestions;
}

/** Top merchants by frequency */
export function getFrequencyBasedSuggestions(): Suggestion[] {
  const transactions = getTransactions();
  const merchantCount: Record<string, { count: number; totalAmount: number; category: Category }> = {};

  for (const txn of transactions) {
    if (!merchantCount[txn.merchant]) {
      merchantCount[txn.merchant] = { count: 0, totalAmount: 0, category: txn.category };
    }
    merchantCount[txn.merchant].count++;
    merchantCount[txn.merchant].totalAmount += txn.amount;
  }

  return Object.entries(merchantCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([merchant, data]) => ({
      merchant,
      amount: Math.round(data.totalAmount / data.count),
      category: data.category,
      icon: getCategoryIcon(data.category),
      confidence: Math.min(data.count / 10, 1),
      source: 'frequency' as const,
    }));
}

/** Average amount per merchant */
export function getAmountPatterns(): Map<string, number> {
  const transactions = getTransactions();
  const merchantAmounts: Record<string, number[]> = {};

  for (const txn of transactions) {
    if (!merchantAmounts[txn.merchant]) merchantAmounts[txn.merchant] = [];
    merchantAmounts[txn.merchant].push(txn.amount);
  }

  const patterns = new Map<string, number>();
  for (const [merchant, amounts] of Object.entries(merchantAmounts)) {
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    patterns.set(merchant, Math.round(avg));
  }

  return patterns;
}

/** Get average amount for a specific merchant (case-insensitive) */
export function getAmountForMerchant(merchant: string): number | null {
  const patterns = getAmountPatterns();
  // Try exact match first
  const exact = patterns.get(merchant);
  if (exact) return exact;
  // Try case-insensitive
  const lower = merchant.toLowerCase();
  for (const [key, value] of patterns) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

/** Time-of-day based suggestions */
export function getTimeSuggestions(): Suggestion[] {
  const transactions = getTransactions();
  const currentHour = new Date().getHours();
  const timeWindow = 2; // +/- 2 hours

  const timeTxns = transactions.filter((txn) => {
    const txnHour = new Date(txn.timestamp).getHours();
    return Math.abs(txnHour - currentHour) <= timeWindow;
  });

  const merchantMap: Record<string, { count: number; totalAmount: number; category: Category }> = {};
  for (const txn of timeTxns) {
    if (!merchantMap[txn.merchant]) {
      merchantMap[txn.merchant] = { count: 0, totalAmount: 0, category: txn.category };
    }
    merchantMap[txn.merchant].count++;
    merchantMap[txn.merchant].totalAmount += txn.amount;
  }

  return Object.entries(merchantMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([merchant, data]) => ({
      merchant,
      amount: Math.round(data.totalAmount / data.count),
      category: data.category,
      icon: getCategoryIcon(data.category),
      confidence: Math.min(data.count / 5, 1),
      source: 'time' as const,
    }));
}

/** Combined & ranked suggestions */
export function getCombinedSuggestions(): Suggestion[] {
  const recent = getRecentSuggestions();
  const frequent = getFrequencyBasedSuggestions();
  const timeBased = getTimeSuggestions();

  // Merge all, prioritizing unique merchants
  const seen = new Set<string>();
  const all: Suggestion[] = [];

  // Time-based first (most contextual), then frequent, then recent
  for (const list of [timeBased, frequent, recent]) {
    for (const s of list) {
      if (!seen.has(s.merchant)) {
        seen.add(s.merchant);
        all.push(s);
      }
    }
  }

  return all.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

function getCategoryIcon(category: Category): string {
  const icons: Record<Category, string> = {
    Food: 'restaurant',
    Transport: 'directions-car',
    Groceries: 'shopping-cart',
    Bills: 'receipt-long',
    Shopping: 'shopping-bag',
    Health: 'favorite',
    Transfer: 'swap-horiz',
    Entertainment: 'movie',
    Others: 'more-horiz',
  };
  return icons[category] || 'more-horiz';
}
