import { Platform } from "react-native";
import { setItem } from "../storage/mmkv";

const WIDGET_DATA_KEY = "widget_data";

let budgetWidget: any = null;
let quickAddWidget: any = null;

/**
 * Initialize widget instances. Call once on app startup.
 */
export function initWidgets(): void {
  if (Platform.OS !== "ios") return;

  try {
    const { createWidget } = require("expo-widgets");
    const BudgetWidgetComponent = require("../../widgets/BudgetWidget").default;
    const QuickAddWidgetComponent = require("../../widgets/QuickAddWidget").default;

    budgetWidget = createWidget("BudgetWidget", BudgetWidgetComponent);
    quickAddWidget = createWidget("QuickAddWidget", QuickAddWidgetComponent);
  } catch (error) {
    console.warn("Widget init failed:", error);
  }
}

/**
 * Update widget data in MMKV storage and push to native widgets.
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
      const todaySpent = storage.getTodayTotal();
      const budget = storage.getDailyBudget();

      // Category breakdown for today
      const categoryMap: Record<string, number> = {};
      for (const txn of todayTransactions) {
        if (txn.type !== "income") {
          categoryMap[txn.category] = (categoryMap[txn.category] || 0) + txn.amount;
        }
      }
      const topCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, amount]) => ({ name, amount }));

      const recentTxns = todayTransactions.slice(0, 5).map((txn: any) => ({
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
        todaySpent,
        budget,
        budgetPeriod: storage.getBudgetPeriod(),
        periodSpent: storage.getPeriodTotal(),
        recentTransactions: recentTxns,
        topCategories,
        updatedAt: Date.now(),
      };

      // Store in MMKV
      setItem(WIDGET_DATA_KEY, data);

      // Push to native widgets via expo-widgets
      if (budgetWidget) {
        budgetWidget.updateSnapshot({ todaySpent, budget, topCategories });
      }
      if (quickAddWidget) {
        quickAddWidget.updateSnapshot({ todaySpent });
      }
    } catch (error) {
      console.warn("Failed to update widget data:", error);
    }
  }, 0);
}
