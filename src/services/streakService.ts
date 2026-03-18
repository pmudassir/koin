import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';
import { getTransactionsForDay } from '../storage/transactionStorage';
import { getDailyBudget, getTodayTotal } from '../storage/transactionStorage';

export interface StreakData {
  /** Consecutive days the user logged at least one transaction */
  loggingStreak: number;
  /** Consecutive days under budget */
  underBudgetStreak: number;
  /** Last date (YYYY-MM-DD) a transaction was logged */
  lastLogDate: string | null;
  /** Last date (YYYY-MM-DD) user was under budget */
  lastUnderBudgetDate: string | null;
  /** Total days tracked (any transaction logged) */
  totalDaysTracked: number;
}

const DEFAULT_STREAK: StreakData = {
  loggingStreak: 0,
  underBudgetStreak: 0,
  lastLogDate: null,
  lastUnderBudgetDate: null,
  totalDaysTracked: 0,
};

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getStreakData(): StreakData {
  return getItem<StreakData>(STORAGE_KEYS.STREAK_DATA) || DEFAULT_STREAK;
}

/**
 * Call this after addTransaction() to update streaks.
 * Idempotent: safe to call multiple times per day.
 */
export function updateStreak(): StreakData {
  const streak = getStreakData();
  const today = todayString();
  const yesterday = yesterdayString();

  // Already updated today
  if (streak.lastLogDate === today) return streak;

  const updated: StreakData = { ...streak };

  // Logging streak
  if (streak.lastLogDate === yesterday) {
    updated.loggingStreak = streak.loggingStreak + 1;
  } else if (streak.lastLogDate !== today) {
    updated.loggingStreak = 1;
  }
  updated.lastLogDate = today;
  updated.totalDaysTracked = streak.totalDaysTracked + 1;

  // Under-budget streak (check yesterday's budget)
  const budget = getDailyBudget();
  const todayTotal = getTodayTotal();

  if (todayTotal <= budget) {
    if (streak.lastUnderBudgetDate === yesterday) {
      updated.underBudgetStreak = streak.underBudgetStreak + 1;
    } else {
      updated.underBudgetStreak = 1;
    }
    updated.lastUnderBudgetDate = today;
  }

  setItem(STORAGE_KEYS.STREAK_DATA, updated);
  return updated;
}

/**
 * Get the mascot mood based on logging streak.
 * idle (<3d), greet (3-7d), smart (7-14d), celebrate (14+d)
 */
export function getMascotMood(streak: number): 'idle' | 'greet' | 'smart' | 'celebrate' {
  if (streak >= 14) return 'celebrate';
  if (streak >= 7) return 'smart';
  if (streak >= 3) return 'greet';
  return 'idle';
}
