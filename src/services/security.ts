import * as LocalAuthentication from 'expo-local-authentication';
import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';

export async function isBiometricsAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const available = await isBiometricsAvailable();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Koin',
    fallbackLabel: 'Use PIN',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  return result.success;
}

export function isBiometricsEnabled(): boolean {
  return getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED) ?? true;
}

export function setBiometricsEnabled(enabled: boolean): void {
  setItem(STORAGE_KEYS.BIOMETRICS_ENABLED, enabled);
}

export function getPinHash(): string | null {
  return getItem<string>(STORAGE_KEYS.PIN_HASH);
}

export function setPinHash(pin: string): void {
  // Simple hash for PIN (in production, use a proper hash)
  const hash = pin.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0).toString(36);
  setItem(STORAGE_KEYS.PIN_HASH, hash);
}

export function verifyPin(pin: string): boolean {
  const storedHash = getPinHash();
  if (!storedHash) return true; // No PIN set
  const hash = pin.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0).toString(36);
  return hash === storedHash;
}
