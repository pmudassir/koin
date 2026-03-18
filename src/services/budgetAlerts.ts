import {
  getTodayTotal,
  getDailyBudget,
  getWeeklyTotal,
  getMonthlyTotal,
} from '../storage/transactionStorage';
import { getCategoryBudgets } from '../storage/budgetStorage';
import { getTransactionsForDay } from '../storage/transactionStorage';
import {
  sendLocalNotification,
  getNotificationPreferences,
  hasNotificationPermission,
} from './notificationService';

/**
 * Check budget thresholds after each transaction and send alerts.
 * Called from addTransaction flow.
 */
export async function checkBudgetAlerts(): Promise<void> {
  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const prefs = getNotificationPreferences();
  const todayTotal = getTodayTotal();
  const dailyBudget = getDailyBudget();

  // 80% budget warning
  if (prefs.budgetWarning && todayTotal >= dailyBudget * 0.8 && todayTotal < dailyBudget) {
    const percent = Math.round((todayTotal / dailyBudget) * 100);
    await sendLocalNotification(
      'Budget Warning',
      `You've used ${percent}% of your daily budget (\u20B9${Math.round(todayTotal).toLocaleString('en-IN')}/\u20B9${Math.round(dailyBudget).toLocaleString('en-IN')})`,
      { type: 'budget-warning' },
    );
  }

  // Over budget
  if (prefs.overBudget && todayTotal > dailyBudget) {
    const overBy = todayTotal - dailyBudget;
    await sendLocalNotification(
      'Over Budget',
      `Daily budget exceeded by \u20B9${Math.round(overBy).toLocaleString('en-IN')}`,
      { type: 'over-budget' },
    );
  }

  // Category budget alerts
  if (prefs.categoryAlert) {
    await checkCategoryBudgetAlerts();
  }
}

async function checkCategoryBudgetAlerts(): Promise<void> {
  const categoryBudgets = getCategoryBudgets();
  if (Object.keys(categoryBudgets).length === 0) return;

  const todayTxns = getTransactionsForDay(new Date());
  const categoryTotals: Record<string, number> = {};

  for (const t of todayTxns) {
    if (t.type !== 'income') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  }

  for (const [category, budget] of Object.entries(categoryBudgets)) {
    const spent = categoryTotals[category] || 0;
    if (spent >= budget * 0.9 && spent <= budget) {
      await sendLocalNotification(
        `${category} Budget Alert`,
        `${category} spending hit ${Math.round((spent / budget) * 100)}% of your \u20B9${budget.toLocaleString('en-IN')} limit`,
        { type: 'category-alert', category },
      );
    }
  }
}
