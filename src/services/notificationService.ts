import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getItem, setItem, STORAGE_KEYS } from '../storage/mmkv';

// ─── Types ────────────────────────────────────────────────

export interface NotificationPreferences {
  budgetWarning: boolean;
  overBudget: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
  categoryAlert: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  budgetWarning: true,
  overBudget: true,
  dailyReminder: true,
  weeklySummary: true,
  categoryAlert: true,
};

// ─── Configuration ────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permission ───────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Preferences ──────────────────────────────────────────

export function getNotificationPreferences(): NotificationPreferences {
  return getItem<NotificationPreferences>(STORAGE_KEYS.NOTIFICATION_PREFS) || DEFAULT_PREFS;
}

export function setNotificationPreferences(prefs: NotificationPreferences): void {
  setItem(STORAGE_KEYS.NOTIFICATION_PREFS, prefs);
}

export function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean,
): void {
  const prefs = getNotificationPreferences();
  setNotificationPreferences({ ...prefs, [key]: value });
}

// ─── Scheduling ───────────────────────────────────────────

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null, // immediate
  });
}

export async function scheduleDailyReminder(): Promise<void> {
  // Cancel existing daily reminders first
  await cancelScheduledNotifications('daily-reminder');

  const prefs = getNotificationPreferences();
  if (!prefs.dailyReminder) return;

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log your expenses',
      body: "Don't forget to track today's spending!",
      data: { type: 'daily-reminder' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
    identifier: 'daily-reminder',
  });
}

export async function scheduleWeeklySummary(): Promise<void> {
  await cancelScheduledNotifications('weekly-summary');

  const prefs = getNotificationPreferences();
  if (!prefs.weeklySummary) return;

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Summary',
      body: 'Check your spending summary for this week.',
      data: { type: 'weekly-summary' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 20,
      minute: 0,
    },
    identifier: 'weekly-summary',
  });
}

async function cancelScheduledNotifications(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Setup ────────────────────────────────────────────────

export async function setupNotifications(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await scheduleDailyReminder();
  await scheduleWeeklySummary();
}
