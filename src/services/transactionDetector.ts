import { NativeModules, NativeEventEmitter, Platform } from "react-native";

const { TransactionBridgeModule } = NativeModules;

export interface DetectedTransaction {
  amount: number;
  merchant: string;
  account: string;
  smsBody: string;
  sender: string;
  timestamp: number;
  source: "sms" | "notification";
}

/**
 * Android-only: Listens for bank SMS and payment app notifications
 * to auto-detect transactions.
 */
class TransactionDetector {
  private eventEmitter: NativeEventEmitter | null = null;
  private listener: any = null;

  /**
   * Check if we're on Android (this feature is Android-only)
   */
  isAvailable(): boolean {
    return Platform.OS === "android" && TransactionBridgeModule != null;
  }

  /**
   * Get current permission statuses
   */
  async getPermissionStatuses(): Promise<{
    notificationListener: boolean;
    smsPermission: boolean;
  }> {
    if (!this.isAvailable()) {
      return { notificationListener: false, smsPermission: false };
    }
    return TransactionBridgeModule.getPermissionStatuses();
  }

  /**
   * Check if notification listener is enabled
   */
  async isNotificationListenerEnabled(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return TransactionBridgeModule.isNotificationListenerEnabled();
  }

  /**
   * Open notification listener settings
   */
  openNotificationListenerSettings(): void {
    if (!this.isAvailable()) return;
    TransactionBridgeModule.openNotificationListenerSettings();
  }

  /**
   * Check if SMS permission is granted
   */
  async isSmsPermissionGranted(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return TransactionBridgeModule.isSmsPermissionGranted();
  }

  /**
   * Request SMS permission
   */
  requestSmsPermission(): void {
    if (!this.isAvailable()) return;
    TransactionBridgeModule.requestSmsPermission();
  }

  /**
   * Start listening for auto-detected transactions
   */
  startListening(callback: (transaction: DetectedTransaction) => void): void {
    if (!this.isAvailable()) return;

    this.stopListening(); // Clean up any existing listener

    this.eventEmitter = new NativeEventEmitter(TransactionBridgeModule);
    this.listener = this.eventEmitter.addListener(
      "onTransactionDetected",
      (event: DetectedTransaction) => {
        console.log(
          `Auto-detected transaction: ${event.merchant} = ${event.amount} (${event.source})`,
        );
        callback(event);
      },
    );
  }

  /**
   * Stop listening for transactions
   */
  stopListening(): void {
    if (this.listener) {
      this.listener.remove();
      this.listener = null;
    }
    this.eventEmitter = null;
  }
}

export const transactionDetector = new TransactionDetector();
