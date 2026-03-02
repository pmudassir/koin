import { AppState, AppStateStatus, Platform } from 'react-native';
import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';
import { Transaction, Category } from '../models/Transaction';
import { categorize } from '../utils/categorization';

interface PendingShareTransaction {
  id: string;
  amount?: number;
  merchant?: string;
  timestamp: number;
  isAutoDetected: boolean;
  note?: string;
  originalText?: string;
}

/**
 * Check for pending transactions from the iOS Share Extension
 * The Share Extension saves data to App Group shared UserDefaults
 * This bridge reads that data when the app comes to foreground
 */
export function checkPendingShareTransactions(): PendingShareTransaction[] {
  // On iOS, we'd use react-native-shared-group-preferences or similar
  // to read from App Group UserDefaults (group.com.koin.app)
  // For now, we use MMKV as the bridge storage
  const pending = getItem<PendingShareTransaction[]>(STORAGE_KEYS.PENDING_SHARE);
  return pending || [];
}

export function clearPendingShareTransactions(): void {
  setItem(STORAGE_KEYS.PENDING_SHARE, []);
}

export function convertPendingToTransaction(
  pending: PendingShareTransaction,
  category: Category
): Omit<Transaction, 'id' | 'timestamp' | 'synced'> {
  return {
    amount: pending.amount || 0,
    merchant: pending.merchant || 'Unknown',
    category,
    isAutoDetected: true,
    note: pending.note,
  };
}

/**
 * Setup app state listener to check for Share Extension data
 * when app returns to foreground
 */
export function setupShareExtensionListener(
  onNewTransactions: (transactions: PendingShareTransaction[]) => void
): () => void {
  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      const pending = checkPendingShareTransactions();
      if (pending.length > 0) {
        onNewTransactions(pending);
      }
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  // Check immediately on setup
  const pending = checkPendingShareTransactions();
  if (pending.length > 0) {
    onNewTransactions(pending);
  }

  return () => subscription.remove();
}
