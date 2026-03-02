import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

let _storage: MMKV | null = null;

function getStorage(): MMKV {
  if (!_storage) {
    _storage = createMMKV({ id: 'koin-storage' });
  }
  return _storage;
}

export function getItem<T>(key: string): T | null {
  const value = getStorage().getString(key);
  if (value === undefined) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  getStorage().set(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  getStorage().remove(key);
}

export function hasKey(key: string): boolean {
  return getStorage().contains(key);
}


// Storage keys constants
export const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  DAILY_BUDGET: 'daily_budget',
  PIN_HASH: 'pin_hash',
  LAST_SYNC: 'last_sync',
  USER_ID: 'user_id',
  PENDING_SHARE: 'pending_share',
  BIOMETRICS_ENABLED: 'biometrics_enabled',
} as const;
