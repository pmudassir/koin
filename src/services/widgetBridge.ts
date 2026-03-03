import { Platform } from "react-native";
import { setItem } from "../storage/mmkv";

const WIDGET_DATA_KEY = "widget_data";

/**
 * Update widget data in MMKV storage.
 * Uses lazy require() to avoid circular dependency with transactionStorage.
 */
export function updateWidgetData(): void {
  if (Platform.OS !== "ios") return;

  // Use setTimeout + lazy require to break the circular dependency
  // transactionStorage → widgetBridge → transactionStorage
  setTimeout(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const storage = require("../storage/transactionStorage");
      const today = new Date();
      const todayTransactions = storage.getTransactionsForDay(today);
      const recentTxns = todayTransactions.slice(0, 3).map((txn: any) => ({
        merchant: txn.merchant,
        amount: txn.amount,
        category: txn.category,
        time: new Date(txn.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      }));

      const data = {
        todaySpent: storage.getTodayTotal(),
        budget: storage.getDailyBudget(),
        budgetPeriod: storage.getBudgetPeriod(),
        periodSpent: storage.getPeriodTotal(),
        recentTransactions: recentTxns,
        updatedAt: Date.now(),
      };

      setItem(WIDGET_DATA_KEY, data);
    } catch (error) {
      console.warn("Failed to update widget data:", error);
    }
  }, 0);
}
