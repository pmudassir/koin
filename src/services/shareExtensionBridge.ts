import {
  AppState,
  AppStateStatus,
  Platform,
  Linking,
  NativeModules,
} from "react-native";
import { showToast } from "../components/Toast";
import * as Clipboard from "expo-clipboard";
import { addTransaction } from "../storage/transactionStorage";
import { smartCategorize } from "./smartCategorizer";
import { Category } from "../models/Transaction";

const { ShareIntentModule } = NativeModules;

interface SharedTransactionData {
  koin_share: boolean;
  amount: number;
  merchant: string;
  note: string;
  ocrText?: string;
  timestamp: number;
}

const KOIN_PREFIX = "KOIN_SHARE:";

// Track if we already processed to avoid duplicates
let lastProcessedTimestamp = 0;

/**
 * Parse koin:// URL into transaction data
 */
function parseKoinURL(url: string): SharedTransactionData | null {
  try {
    if (!url.startsWith("koin://share")) return null;

    const queryString = url.split("?")[1];
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);
    const amount = parseFloat(params.get("amount") || "0");
    const merchant = decodeURIComponent(
      params.get("merchant") || "Shared Transaction",
    );
    const note = decodeURIComponent(params.get("note") || "");

    return {
      koin_share: true,
      amount,
      merchant,
      note,
      timestamp: Date.now(),
    };
  } catch (e) {
    console.warn("Error parsing koin URL:", e);
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
 * Create a transaction from shared data using smart categorization
 */
function createTransactionFromShare(data: SharedTransactionData): boolean {
  // Dedup check
  if (
    data.timestamp &&
    Math.abs(data.timestamp - lastProcessedTimestamp) < 5000
  ) {
    return false;
  }

  // Use smart categorizer with full OCR context
  const result = smartCategorize(
    data.merchant || "Shared Transaction",
    data.ocrText || data.note,
  );
  const amount = data.amount || 0;

  addTransaction({
    amount,
    merchant: data.merchant || "Shared Transaction",
    category: result.category as Category,
    isAutoDetected: true,
    note: data.note || data.ocrText || undefined,
  });

  lastProcessedTimestamp = data.timestamp || Date.now();
  console.log(
    `[Share] Smart categorized: ${data.merchant} -> ${result.category} (${result.confidence}, ${result.source})`,
  );
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
      await Clipboard.setStringAsync("");
    }
    return created;
  } catch (e) {
    console.warn("Clipboard check error:", e);
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
 * Check for Android share intent data
 */
async function checkAndroidShareIntent(): Promise<boolean> {
  if (Platform.OS !== "android" || !ShareIntentModule) return false;

  try {
    const sharedData = await ShareIntentModule.getSharedData();
    if (!sharedData) return false;

    console.log("[Share] Received Android share intent:", sharedData.type);

    if (sharedData.type === "text") {
      // Try to parse the text for transaction data
      const text = sharedData.text || "";
      const subject = sharedData.subject || "";
      const fullText = `${subject}\n${text}`;

      const result = smartCategorize("Shared Transaction", fullText);

      // Try to extract amount from text
      const amountMatch = fullText.match(
        /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      );
      const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : 0;

      // Try to extract merchant
      const merchantMatch = fullText.match(
        /(?:to|paid to|sent to)\s+([A-Za-z][A-Za-z\s.\-&']{1,40})/i,
      );
      const merchant = merchantMatch
        ? merchantMatch[1].trim()
        : "Shared Transaction";

      const data: SharedTransactionData = {
        koin_share: true,
        amount,
        merchant,
        note: text,
        ocrText: fullText,
        timestamp: Date.now(),
      };

      return createTransactionFromShare(data);
    } else if (sharedData.type === "image") {
      // OCR was performed natively via ML Kit
      const ocrText = sharedData.ocrText || "";
      const amount = sharedData.amount || 0;
      const merchant = sharedData.merchant || "Shared Transaction";

      if (amount <= 0 && !ocrText) return false;

      const data: SharedTransactionData = {
        koin_share: true,
        amount,
        merchant,
        note: `OCR: ${ocrText.substring(0, 200)}`,
        ocrText,
        timestamp: Date.now(),
      };

      return createTransactionFromShare(data);
    }
  } catch (e) {
    console.warn("Android share intent error:", e);
  }
  return false;
}

/**
 * Setup share listeners for both iOS and Android
 */
export function setupShareListener(onNewTransaction: () => void): () => void {
  // ── Android share intent handling ──
  if (Platform.OS === "android") {
    // Check immediately on mount (app opened via share)
    setTimeout(async () => {
      const found = await checkAndroidShareIntent();
      if (found) {
        onNewTransaction();
        showToast({
          type: "success",
          title: "Transaction Added",
          message: "Transaction added from share.",
        });
      }
    }, 500);

    // Re-check when app becomes foreground
    const appStateSub = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (nextState === "active") {
          setTimeout(async () => {
            const found = await checkAndroidShareIntent();
            if (found) {
              onNewTransaction();
              showToast({
                type: "success",
                title: "Transaction Added",
                message: "Transaction added from share.",
              });
            }
          }, 500);
        }
      },
    );

    return () => {
      appStateSub.remove();
    };
  }

  // ── iOS handling (URL scheme + clipboard) ──

  // 1. Handle URL scheme (when Share Extension opens main app)
  const handleURL = ({ url }: { url: string }) => {
    if (url.includes("expo-development-client")) return;

    const created = handleIncomingURL(url);
    if (created) {
      onNewTransaction();
      showToast({
        type: "success",
        title: "Transaction Added",
        message: "Transaction was added from the share.",
      });
    }
  };

  const linkingSub = Linking.addEventListener("url", handleURL);

  Linking.getInitialURL().then((url) => {
    if (url && !url.includes("expo-development-client")) {
      const created = handleIncomingURL(url);
      if (created) onNewTransaction();
    }
  });

  // 2. Check clipboard on foreground
  const handleAppStateChange = async (nextState: AppStateStatus) => {
    if (nextState === "active") {
      setTimeout(async () => {
        const found = await checkClipboard();
        if (found) {
          onNewTransaction();
          showToast({
            type: "success",
            title: "Transaction Added",
            message: "Transaction was added from the share.",
          });
        }
      }, 500);
    }
  };

  const appStateSub = AppState.addEventListener("change", handleAppStateChange);

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
