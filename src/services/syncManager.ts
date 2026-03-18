import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getItem, STORAGE_KEYS } from '../storage/mmkv';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

type SyncListener = (status: SyncStatus) => void;

let currentStatus: SyncStatus = 'idle';
let lastSyncTime: number | null = null;
const listeners: Set<SyncListener> = new Set();
let isOnline = true;

// Initialize network monitoring
NetInfo.addEventListener((state: NetInfoState) => {
  const wasOnline = isOnline;
  isOnline = state.isConnected === true && state.isInternetReachable !== false;

  if (!isOnline && wasOnline) {
    setStatus('offline');
  } else if (isOnline && !wasOnline && currentStatus === 'offline') {
    setStatus('idle');
  }
});

function setStatus(status: SyncStatus) {
  currentStatus = status;
  if (status === 'success') {
    lastSyncTime = Date.now();
  }
  for (const listener of listeners) {
    listener(status);
  }
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

export function getIsOnline(): boolean {
  return isOnline;
}

export function getLastSyncTime(): number | null {
  return lastSyncTime ?? getItem<number>(STORAGE_KEYS.LAST_SYNC);
}

export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Run a sync operation with status tracking and retry logic.
 * Wraps the actual Firebase sync to add error surfacing.
 */
export async function runSync(
  syncFn: () => Promise<void>,
  maxRetries: number = 3,
): Promise<boolean> {
  if (!isOnline) {
    setStatus('offline');
    return false;
  }

  setStatus('syncing');

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await syncFn();
      setStatus('success');
      return true;
    } catch (error) {
      lastError = error;
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  console.warn('Sync failed after retries:', lastError);
  setStatus('error');
  return false;
}

/**
 * Format last sync time as a human-readable relative string.
 */
export function formatLastSync(): string {
  const time = getLastSyncTime();
  if (!time) return 'Never synced';

  const diff = Date.now() - time;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(time).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}
