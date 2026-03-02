import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Transaction } from '../models/Transaction';
import {
  getTransactions,
  markTransactionsSynced,
} from '../storage/transactionStorage';
import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBxvpWoLKYmpZM3PyBfAS968FZr1Y7aZv4',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'koin-finance-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'koin-finance-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'koin-finance-app.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1068940728534',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1068940728534:web:729c2d235fed4470b89177',
};

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

export function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    return true;
  } catch (error) {
    console.warn('Firebase init failed (offline mode):', error);
    return false;
  }
}

export async function signIn(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    setItem(STORAGE_KEYS.USER_ID, result.user.uid);
    return result.user;
  } catch (error) {
    console.warn('Sign in failed:', error);
    return null;
  }
}

export function getCurrentUserId(): string | null {
  return getItem<string>(STORAGE_KEYS.USER_ID);
}

export async function syncTransactions(): Promise<void> {
  if (!db) return;
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const localTxns = getTransactions();
    const unsyncedTxns = localTxns.filter((t) => !t.synced);

    const syncedIds: string[] = [];
    for (const txn of unsyncedTxns) {
      try {
        const txnRef = doc(db, `users/${userId}/transactions`, txn.id);
        await setDoc(txnRef, {
          ...txn,
          synced: true,
          updatedAt: Timestamp.now(),
        });
        syncedIds.push(txn.id);
      } catch (e) {
        console.warn('Failed to sync transaction:', txn.id, e);
      }
    }

    if (syncedIds.length > 0) {
      markTransactionsSynced(syncedIds);
    }

    const txnCollection = collection(db, `users/${userId}/transactions`);
    const snapshot = await getDocs(txnCollection);

    const remoteTxns: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Transaction;
      remoteTxns.push({ ...data, id: docSnap.id, synced: true });
    });

    const localMap = new Map(localTxns.map((t) => [t.id, t]));
    for (const remote of remoteTxns) {
      const local = localMap.get(remote.id);
      if (!local || remote.timestamp > local.timestamp) {
        localMap.set(remote.id, remote);
      }
    }

    const merged = Array.from(localMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const { setItem: mmkvSet } = await import('../storage/mmkv');
    mmkvSet(STORAGE_KEYS.TRANSACTIONS, merged);
    mmkvSet(STORAGE_KEYS.LAST_SYNC, Date.now());
  } catch (error) {
    console.warn('Sync failed (will retry later):', error);
  }
}
