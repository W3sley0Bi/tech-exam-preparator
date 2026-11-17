// Daily study reminder + one-off "streak at risk" reminder. No-op on web.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from './i18n';
import { pathStreak } from './logic/learn';
import { planStatus, type PlanInput } from './logic/plan';
import type { Settings } from './types';

const DAILY_ID = 'az900-daily-reminder';
const RISK_ID = 'az900-streak-risk';
const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export type ReminderState = PlanInput & { settings: Settings };

export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!cur.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function cancelAll(): Promise<void> {
  if (!supported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID);
    await Notifications.cancelScheduledNotificationAsync(RISK_ID);
  } catch {
    // nothing scheduled
  }
}

export async function scheduleDailyReminder(state: ReminderState): Promise<void> {
  if (!supported) return;
  try {
    await cancelAll();
    if (!state.settings.reminderEnabled) return;
    if (!(await ensurePermission())) return;

    const t = i18n.t.bind(i18n);
    const s = planStatus(state);
    const streak = pathStreak(state.path.days);
    const days = Math.max(0, s.daysToExam);
    const parts = [s.todo.length > 0
      ? s.todo.slice(0, 2).map(i => t(i.key, i.params)).join(' + ')
      : t('plan.questionsToday', { done: s.todayAct.answered, goal: s.todayGoal })];
    if (streak > 0) parts.push(`🔥 ${t('lesson.streak', { count: streak })} — keep it alive`);
    const title = days > 0 ? `AZ-900 · ${t('plan.banner.daysToExam', { count: days })}` : t('settings.reminderTitle');

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: { title, body: parts.join(' · ') },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: state.settings.reminderHour,
        minute: state.settings.reminderMinute,
      },
    });

    const now = new Date();
    const risk = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0);
    if (streak > 0 && s.todayAct.answered === 0 && risk.getTime() > now.getTime()) {
      await Notifications.scheduleNotificationAsync({
        identifier: RISK_ID,
        content: {
          title: `🔥 ${t('lesson.streak', { count: streak })}`,
          body: t('settings.reminderBody'),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: risk },
      });
    }
  } catch {
    // scheduling is best-effort
  }
}
