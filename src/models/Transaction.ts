export type Category =
  | 'Food'
  | 'Transport'
  | 'Groceries'
  | 'Bills'
  | 'Shopping'
  | 'Health'
  | 'Transfer'
  | 'Entertainment'
  | 'Others';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  timestamp: number;
  isAutoDetected: boolean;
  note?: string;
  synced?: boolean;
}

export const CATEGORY_ICONS: Record<Category, string> = {
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

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Food: { bg: 'rgba(217, 119, 6, 0.2)', text: '#f59e0b' },
  Transport: { bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa' },
  Groceries: { bg: 'rgba(22, 163, 74, 0.2)', text: '#4ade80' },
  Bills: { bg: 'rgba(5, 150, 105, 0.2)', text: '#34d399' },
  Shopping: { bg: 'rgba(147, 51, 234, 0.2)', text: '#c084fc' },
  Health: { bg: 'rgba(220, 38, 38, 0.2)', text: '#f87171' },
  Transfer: { bg: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee' },
  Entertainment: { bg: 'rgba(219, 39, 119, 0.2)', text: '#f472b6' },
  Others: { bg: 'rgba(100, 116, 139, 0.3)', text: '#94a3b8' },
};
