// Pushes the exam countdown snapshot to the iOS home-screen widget. No-op off iOS.
import { Platform } from 'react-native';
import { pathStreak } from './logic/learn';
import { planStatus, type PlanInput } from './logic/plan';

export type WidgetState = PlanInput;

export function widgetProps(state: WidgetState) {
  const s = planStatus(state);
  return {
    daysToExam: Math.max(0, s.daysToExam),
    examDate: s.pl.exam,
    readiness: Math.round(s.readiness),
    status: s.ready ? ('ready' as const) : s.overall,
    todayAnswered: s.todayAct.answered,
    todayGoal: s.todayGoal,
    streak: pathStreak(state.path.days),
  };
}

export function syncWidget(state: WidgetState): void {
  if (Platform.OS !== 'ios') return;
  try {
    // lazy require keeps the widget module (and its native dependency) out of web/android bundles
    const ExamCountdown = require('../widgets/ExamCountdown').default as { updateSnapshot(p: ReturnType<typeof widgetProps>): void };
    ExamCountdown.updateSnapshot(widgetProps(state));
  } catch {
    // widget extension unavailable (e.g. Expo Go); ignore
  }
}
