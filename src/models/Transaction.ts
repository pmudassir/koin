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

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  timestamp: number;
  isAutoDetected: boolean;
  type?: TransactionType; // defaults to 'expense' for backward compat
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

// Opaque Tailwind 100-shade bg + 600-shade icon for light theme
export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; icon: string }> = {
  Food: { bg: '#FFEDD5', text: '#EA580C', icon: '#EA580C' },         // orange
  Transport: { bg: '#DBEAFE', text: '#2563EB', icon: '#2563EB' },    // blue
  Groceries: { bg: '#FEF9C3', text: '#CA8A04', icon: '#CA8A04' },    // yellow
  Bills: { bg: '#DCFCE7', text: '#16A34A', icon: '#16A34A' },        // green
  Shopping: { bg: '#F3E8FF', text: '#9333EA', icon: '#9333EA' },      // purple
  Health: { bg: '#FEE2E2', text: '#DC2626', icon: '#DC2626' },       // red
  Transfer: { bg: '#CFFAFE', text: '#0891B2', icon: '#0891B2' },     // cyan
  Entertainment: { bg: '#FDF4FF', text: '#C026D3', icon: '#C026D3' }, // fuchsia
  Others: { bg: '#F1F5F9', text: '#64748B', icon: '#64748B' },       // slate
};
