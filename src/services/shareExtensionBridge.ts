import { AppState, AppStateStatus, Platform, Linking, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { addTransaction } from '../storage/transactionStorage';
import { categorize } from '../utils/categorization';
import { Category } from '../models/Transaction';

interface SharedTransactionData {
  koin_share: boolean;
  amount: number;
  merchant: string;
  note: string;
  ocrText?: string;
  timestamp: number;
}

const KOIN_PREFIX = 'KOIN_SHARE:';

// Track if we already processed to avoid duplicates
let lastProcessedTimestamp = 0;

/**
 * Parse koin:// URL into transaction data
 */
function parseKoinURL(url: string): SharedTransactionData | null {
  try {
    if (!url.startsWith('koin://share')) return null;

    const queryString = url.split('?')[1];
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);
    const amount = parseFloat(params.get('amount') || '0');
    const merchant = decodeURIComponent(params.get('merchant') || 'Shared Transaction');
    const note = decodeURIComponent(params.get('note') || '');

    return {
      koin_share: true,
      amount,
      merchant,
      note,
      timestamp: Date.now(),
    };
  } catch (e) {
    console.warn('Error parsing koin URL:', e);
    return null;
  }
}

/**
 * Parse clipboard content for Koin share data
 */
function parseClipboard(content: string): SharedTransactionData | null {
  if (!content || !content.startsWith(KOIN_PREFIX)) return null;

  try {
    const jsonStr = content.substring(KOIN_PREFIX.length);
    const data = JSON.parse(jsonStr) as SharedTransactionData;
    if (!data.koin_share) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Create a transaction from shared data
 */
function createTransactionFromShare(data: SharedTransactionData): boolean {
  // Dedup check
  if (data.timestamp && Math.abs(data.timestamp - lastProcessedTimestamp) < 5000) {
    return false;
  }

  const category = data.merchant ? categorize(data.merchant) : 'Others';
  const amount = data.amount || 0;

  addTransaction({
    amount,
    merchant: data.merchant || 'Shared Transaction',
    category: category as Category,
    isAutoDetected: true,
    note: data.note || data.ocrText || undefined,
  });

  lastProcessedTimestamp = data.timestamp || Date.now();
  console.log('✅ Created transaction from share:', data.merchant, amount);
  return true;
}

/**
 * Check clipboard for shared transaction data
 */
async function checkClipboard(): Promise<boolean> {
  try {
    const hasString = await Clipboard.hasStringAsync();
    if (!hasString) return false;

    const content = await Clipboard.getStringAsync();
    const data = parseClipboard(content);
    if (!data) return false;

    const created = createTransactionFromShare(data);
    if (created) {
      // Clear clipboard
      await Clipboard.setStringAsync('');
    }
    return created;
  } catch (e) {
    console.warn('Clipboard check error:', e);
    return false;
  }
}

/**
 * Handle incoming koin:// URL
 */
function handleIncomingURL(url: string | null): boolean {
  if (!url) return false;

  const data = parseKoinURL(url);
  if (!data) return false;

  return createTransactionFromShare(data);
}

/**
 * Setup both URL scheme and clipboard listeners
 */
export function setupShareListener(
  onNewTransaction: () => void
): () => void {
  if (Platform.OS !== 'ios') return () => {};

  // 1. Handle URL scheme (when Share Extension opens main app)
  const handleURL = ({ url }: { url: string }) => {
    // Ignore expo development client URLs
    if (url.includes('expo-development-client')) return;

    const created = handleIncomingURL(url);
    if (created) {
      onNewTransaction();
      Alert.alert(
        '✅ Transaction Added',
        'Transaction was added from the share.',
        [{ text: 'OK' }]
      );
    }
  };

  // Listen for incoming URLs
  const linkingSub = Linking.addEventListener('url', handleURL);

  // Check if app was opened via URL
  Linking.getInitialURL().then((url) => {
    if (url && !url.includes('expo-development-client')) {
      const created = handleIncomingURL(url);
      if (created) onNewTransaction();
    }
  });

  // 2. Check clipboard on foreground (fallback if URL scheme didn't work)
  const handleAppStateChange = async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      // Small delay to let clipboard sync
      setTimeout(async () => {
        const found = await checkClipboard();
        if (found) {
          onNewTransaction();
          Alert.alert(
            '✅ Transaction Added',
            'Transaction was added from the share.',
            [{ text: 'OK' }]
          );
        }
      }, 500);
    }
  };

  const appStateSub = AppState.addEventListener('change', handleAppStateChange);

  // 3. Also check clipboard immediately
  setTimeout(async () => {
    const found = await checkClipboard();
    if (found) onNewTransaction();
  }, 1000);

  return () => {
    linkingSub.remove();
    appStateSub.remove();
  };
}
