import { Category, CATEGORY_COLORS } from "../models/Transaction";
import {
  getTransactionsForMonth,
  getTransactions,
  getTodayTotal,
  getDailyBudget,
  getWeeklyTotal,
  getMonthlyTotal,
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
    categories[txn.category] = (categories[txn.category] || 0) + txn.amount;
    total += txn.amount;
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
  const monthlyTotal = getMonthlyTotal();

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
      description: `${biggestIncrease.category} is up ${biggestIncrease.change}% (${formatCurrency(biggestIncrease.previous)} → ${formatCurrency(biggestIncrease.current)}).`,
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

  // 6. Transaction count insight
  const txnCount = getTransactionsForMonth(
    new Date().getFullYear(),
    new Date().getMonth(),
  ).length;

  if (txnCount > 0) {
    const avgPerTxn = current.total / txnCount;
    insights.push({
      id: "avg-transaction",
      icon: "analytics",
      title: "Avg Transaction",
      description: `Your average spend is ${formatCurrency(avgPerTxn)} across ${txnCount} transactions this month.`,
      tint: "blue",
      value: formatCurrency(avgPerTxn),
    });
  }

  // 7. Empty state
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
