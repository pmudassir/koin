import { Category, CATEGORY_COLORS } from "../models/Transaction";
import {
  getTransactionsForMonth,
  getTransactions,
  getTodayTotal,
  getDailyBudget,
  getWeeklyTotal,
  getMonthlyTotal,
  getMonthlyIncome,
} from "../storage/transactionStorage";

// ─── Types ────────────────────────────────────────────────

export interface MonthlyBreakdown {
  year: number;
  month: number;
  total: number;
  categories: Record<string, number>;
}

export interface InsightCard {
  id: string;
  icon: string; // MaterialIcons name
  title: string;
  description: string;
  tint: "red" | "green" | "blue" | "amber" | "purple";
  value?: string; // e.g., "+40%" or "-₹2,000"
}

export interface MonthTrend {
  label: string; // "Jan", "Feb", etc.
  amount: number;
  month: number;
  year: number;
}

// ─── Helpers ──────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatCurrency(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Data Functions ───────────────────────────────────────

/**
 * Get spending breakdown for a given month
 */
export function getMonthlyBreakdown(monthOffset: number = 0): MonthlyBreakdown {
  const now = new Date();
  const targetMonth = now.getMonth() + monthOffset;
  const targetYear = now.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  const transactions = getTransactionsForMonth(targetYear, normalizedMonth);
  const categories: Record<string, number> = {};
  let total = 0;

  for (const txn of transactions) {
    if (txn.type !== 'income') {
      categories[txn.category] = (categories[txn.category] || 0) + txn.amount;
      total += txn.amount;
    }
  }

  return { year: targetYear, month: normalizedMonth, total, categories };
}

/**
 * Get month-over-month change for total and per category
 */
export function getMonthOverMonthChange(): {
  totalChange: number;
  categoryChanges: Array<{
    category: string;
    change: number;
    current: number;
    previous: number;
  }>;
} {
  const current = getMonthlyBreakdown(0);
  const previous = getMonthlyBreakdown(-1);

  const totalChange = percentChange(current.total, previous.total);

  // Get all categories from both months
  const allCategories = new Set([
    ...Object.keys(current.categories),
    ...Object.keys(previous.categories),
  ]);

  const categoryChanges = Array.from(allCategories)
    .map((category) => ({
      category,
      change: percentChange(
        current.categories[category] || 0,
        previous.categories[category] || 0,
      ),
      current: current.categories[category] || 0,
      previous: previous.categories[category] || 0,
    }))
    .filter((c) => c.current > 0 || c.previous > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return { totalChange, categoryChanges };
}

/**
 * Get spending trend for last N months
 */
export function getSpendingTrend(months: number = 6): MonthTrend[] {
  const result: MonthTrend[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const breakdown = getMonthlyBreakdown(-i);
    result.push({
      label: MONTH_LABELS[d.getMonth()],
      amount: breakdown.total,
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }

  return result;
}

// ─── AI Insights Generation ──────────────────────────────

/**
 * Generate natural-language insight cards based on spending data
 */
export function generateInsights(): InsightCard[] {
  const insights: InsightCard[] = [];
  const { totalChange, categoryChanges } = getMonthOverMonthChange();
  const current = getMonthlyBreakdown(0);
  const todaySpent = getTodayTotal();
  const dailyBudget = getDailyBudget();
  const allTxns = getTransactions();

  // 1. Overall monthly trend
  if (current.total > 0) {
    if (totalChange > 0) {
      insights.push({
        id: "monthly-increase",
        icon: "trending-up",
        title: "Spending Up",
        description: `You've spent ${totalChange}% more this month compared to last month.`,
        tint: "red",
        value: `+${totalChange}%`,
      });
    } else if (totalChange < 0) {
      insights.push({
        id: "monthly-decrease",
        icon: "trending-down",
        title: "Spending Down",
        description: `Great job! You've spent ${Math.abs(totalChange)}% less than last month.`,
        tint: "green",
        value: `${totalChange}%`,
      });
    }
  }

  // 2. Top spending category
  const sortedCategories = Object.entries(current.categories).sort(
    (a, b) => b[1] - a[1],
  );

  if (sortedCategories.length > 0) {
    const [topCategory, topAmount] = sortedCategories[0];
    const topPercent =
      current.total > 0 ? Math.round((topAmount / current.total) * 100) : 0;
    insights.push({
      id: "top-category",
      icon: "star",
      title: `${topCategory} Leads`,
      description: `${topCategory} is your biggest spend at ${formatCurrency(topAmount)} (${topPercent}% of total).`,
      tint: "purple",
      value: formatCurrency(topAmount),
    });
  }

  // 3. Category with biggest increase
  const biggestIncrease = categoryChanges.find(
    (c) => c.change > 20 && c.current > 100,
  );
  if (biggestIncrease) {
    insights.push({
      id: "category-spike",
      icon: "arrow-upward",
      title: `${biggestIncrease.category} Spike`,
      description: `${biggestIncrease.category} is up ${biggestIncrease.change}% (${formatCurrency(biggestIncrease.previous)} \u2192 ${formatCurrency(biggestIncrease.current)}).`,
      tint: "amber",
      value: `+${biggestIncrease.change}%`,
    });
  }

  // 4. Category with biggest decrease
  const biggestDecrease = categoryChanges.find(
    (c) => c.change < -20 && c.previous > 100,
  );
  if (biggestDecrease) {
    insights.push({
      id: "category-saving",
      icon: "savings",
      title: `Saved on ${biggestDecrease.category}`,
      description: `Nice! ${biggestDecrease.category} spending dropped ${Math.abs(biggestDecrease.change)}%.`,
      tint: "green",
      value: `${biggestDecrease.change}%`,
    });
  }

  // 5. Daily budget insight
  if (todaySpent > dailyBudget) {
    const overBy = todaySpent - dailyBudget;
    insights.push({
      id: "over-budget-today",
      icon: "warning",
      title: "Over Budget Today",
      description: `You've exceeded today's budget by ${formatCurrency(overBy)}.`,
      tint: "red",
      value: `-${formatCurrency(overBy)}`,
    });
  } else if (todaySpent > 0 && todaySpent < dailyBudget * 0.5) {
    insights.push({
      id: "under-budget",
      icon: "thumb-up",
      title: "Looking Good!",
      description: `You've only spent ${formatCurrency(todaySpent)} today. Keep it up!`,
      tint: "green",
    });
  }

  // 6. Transaction count + average
  const now = new Date();
  const monthTxns = getTransactionsForMonth(now.getFullYear(), now.getMonth())
    .filter((t) => t.type !== 'income');

  if (monthTxns.length > 0) {
    const avgPerTxn = current.total / monthTxns.length;
    insights.push({
      id: "avg-transaction",
      icon: "analytics",
      title: "Avg Transaction",
      description: `Your average spend is ${formatCurrency(avgPerTxn)} across ${monthTxns.length} transactions this month.`,
      tint: "blue",
      value: formatCurrency(avgPerTxn),
    });
  }

  // ─── Enhanced Insights V2 ──────────────────────────────

  // 7. Weekend vs weekday spending
  const thisMonthTxns = getTransactionsForMonth(now.getFullYear(), now.getMonth())
    .filter((t) => t.type !== 'income');

  if (thisMonthTxns.length >= 5) {
    let weekdayTotal = 0;
    let weekdayDays = 0;
    let weekendTotal = 0;
    let weekendDays = 0;

    const daysSeen = new Set<string>();
    for (const t of thisMonthTxns) {
      const d = new Date(t.timestamp);
      const dayKey = d.toISOString().split('T')[0];
      const dow = d.getDay();
      const isWeekend = dow === 0 || dow === 6;

      if (!daysSeen.has(dayKey)) {
        daysSeen.add(dayKey);
        if (isWeekend) weekendDays++;
        else weekdayDays++;
      }

      if (isWeekend) weekendTotal += t.amount;
      else weekdayTotal += t.amount;
    }

    const avgWeekday = weekdayDays > 0 ? weekdayTotal / weekdayDays : 0;
    const avgWeekend = weekendDays > 0 ? weekendTotal / weekendDays : 0;

    if (avgWeekend > 0 && avgWeekday > 0) {
      const ratio = Math.round((avgWeekend / avgWeekday) * 10) / 10;
      if (ratio >= 1.5) {
        insights.push({
          id: "weekend-spending",
          icon: "weekend",
          title: "Weekend Spender",
          description: `You spend ${ratio}x more on weekends (${formatCurrency(avgWeekend)}/day vs ${formatCurrency(avgWeekday)}/day).`,
          tint: "amber",
          value: `${ratio}x`,
        });
      } else if (ratio <= 0.7) {
        insights.push({
          id: "weekday-spending",
          icon: "work",
          title: "Weekday Spender",
          description: `Your weekday spending (${formatCurrency(avgWeekday)}/day) is higher than weekends (${formatCurrency(avgWeekend)}/day).`,
          tint: "blue",
        });
      }
    }
  }

  // 8. Merchant frequency
  if (thisMonthTxns.length >= 3) {
    const merchantCounts: Record<string, number> = {};
    for (const t of thisMonthTxns) {
      merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1;
    }

    const topMerchant = Object.entries(merchantCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (topMerchant && topMerchant[1] >= 4) {
      // Compare to last month
      const lastMonthTxns = getTransactionsForMonth(
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
        now.getMonth() === 0 ? 11 : now.getMonth() - 1,
      ).filter((t) => t.merchant === topMerchant[0] && t.type !== 'income');

      const lastCount = lastMonthTxns.length;
      const desc = lastCount > 0
        ? `You've visited ${topMerchant[0]} ${topMerchant[1]} times this month (vs ${lastCount} last month).`
        : `You've visited ${topMerchant[0]} ${topMerchant[1]} times this month.`;

      insights.push({
        id: "merchant-frequency",
        icon: "store",
        title: "Frequent Spot",
        description: desc,
        tint: topMerchant[1] > (lastCount || 0) * 1.5 ? "amber" : "blue",
        value: `${topMerchant[1]}x`,
      });
    }
  }

  // 9. Time-of-day pattern
  if (thisMonthTxns.length >= 5) {
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const t of thisMonthTxns) {
      const hour = new Date(t.timestamp).getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning += t.amount;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon += t.amount;
      else if (hour >= 17 && hour < 21) timeSlots.evening += t.amount;
      else timeSlots.night += t.amount;
    }

    const total = Object.values(timeSlots).reduce((s, v) => s + v, 0);
    const sorted = Object.entries(timeSlots).sort((a, b) => b[1] - a[1]);
    const [peakTime, peakAmount] = sorted[0];
    const peakPercent = total > 0 ? Math.round((peakAmount / total) * 100) : 0;

    if (peakPercent >= 40) {
      const timeLabels: Record<string, string> = {
        morning: 'morning (6am-12pm)',
        afternoon: 'afternoon (12-5pm)',
        evening: 'evening (5-9pm)',
        night: 'night (9pm-6am)',
      };
      insights.push({
        id: "time-pattern",
        icon: "schedule",
        title: "Peak Spending Time",
        description: `${peakPercent}% of your spending happens in the ${timeLabels[peakTime]}.`,
        tint: "purple",
        value: `${peakPercent}%`,
      });
    }
  }

  // 10. Savings rate (if income data available)
  const monthlyIncome = getMonthlyIncome();
  if (monthlyIncome > 0 && current.total > 0) {
    const savingsRate = Math.round(((monthlyIncome - current.total) / monthlyIncome) * 100);
    if (savingsRate > 0) {
      insights.push({
        id: "savings-rate",
        icon: "savings",
        title: "Savings Rate",
        description: `You saved ${savingsRate}% of your income this month (${formatCurrency(monthlyIncome - current.total)}).`,
        tint: savingsRate >= 20 ? "green" : "amber",
        value: `${savingsRate}%`,
      });
    } else {
      insights.push({
        id: "negative-savings",
        icon: "warning",
        title: "Overspending",
        description: `You've spent ${formatCurrency(current.total - monthlyIncome)} more than your income this month.`,
        tint: "red",
        value: formatCurrency(current.total - monthlyIncome),
      });
    }
  }

  // 11. Monthly projection
  const dayOfMonth = now.getDate();
  if (dayOfMonth >= 5 && current.total > 0) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projected = Math.round((current.total / dayOfMonth) * daysInMonth);
    const previous = getMonthlyBreakdown(-1);

    if (previous.total > 0) {
      const projChange = percentChange(projected, previous.total);
      const direction = projChange > 0 ? "more" : "less";
      insights.push({
        id: "monthly-projection",
        icon: "auto-graph",
        title: "Month Projection",
        description: `At this pace, you'll spend ${formatCurrency(projected)} this month (${Math.abs(projChange)}% ${direction} than last month).`,
        tint: projChange > 10 ? "red" : projChange < -10 ? "green" : "blue",
        value: formatCurrency(projected),
      });
    }
  }

  // Empty state
  if (insights.length === 0) {
    insights.push({
      id: "getting-started",
      icon: "lightbulb",
      title: "Start Tracking",
      description: "Add expenses to see personalized spending insights here.",
      tint: "blue",
    });
  }

  return insights;
}
