import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getTransactionsForDateRange } from '../storage/transactionStorage';
import { Transaction } from '../models/Transaction';

/**
 * Generate CSV string from transactions.
 */
function transactionsToCSV(transactions: Transaction[]): string {
  const header = 'Date,Time,Merchant,Category,Amount,Type,Note';
  const rows = transactions.map((t) => {
    const date = new Date(t.timestamp);
    const dateStr = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const type = t.type === 'income' ? 'income' : 'expense';
    const merchant = `"${t.merchant.replace(/"/g, '""')}"`;
    const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';

    return `${dateStr},${timeStr},${merchant},${t.category},${t.amount},${type},${note}`;
  });

  return [header, ...rows].join('\n');
}

/**
 * Export transactions to CSV and share.
 */
export async function exportToCSV(startDate: Date, endDate: Date): Promise<void> {
  const transactions = getTransactionsForDateRange(startDate, endDate);

  if (transactions.length === 0) {
    throw new Error('No transactions found for this date range.');
  }

  const csv = transactionsToCSV(transactions);
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  const fileName = `koin_${startStr}_to_${endStr}.csv`;

  const file = new File(Paths.cache, fileName);
  file.create();
  file.write(csv);

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Koin Transactions',
    UTI: 'public.comma-separated-values-text',
  });
}

/**
 * Get preset date ranges for export.
 */
export function getExportPresets(): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  return [
    { label: 'This Month', start: thisMonthStart, end: today },
    { label: 'Last Month', start: lastMonthStart, end: lastMonthEnd },
    { label: 'Last 3 Months', start: threeMonthsAgo, end: today },
  ];
}
