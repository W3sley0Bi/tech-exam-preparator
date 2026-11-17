// Keeps the home-screen widget and study reminders in step with the store. Call once from the root layout.
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { scheduleDailyReminder } from './notifications';
import { useStore } from './store';
import { syncWidget } from './widget';

function run(): void {
  const s = useStore.getState();
  if (!s.hydrated) return;
  syncWidget(s);
  void scheduleDailyReminder(s);
}

export function useBackgroundSync(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, 1000);
    };
    const unsub = useStore.subscribe((s, prev) => {
      if (
        s.hydrated !== prev.hydrated || s.activity !== prev.activity || s.path !== prev.path || s.exams !== prev.exams ||
        s.plan !== prev.plan || s.settings !== prev.settings
      ) schedule();
    });
    const sub = AppState.addEventListener('change', st => { if (st === 'active') schedule(); });
    schedule();
    return () => { unsub(); sub.remove(); if (timer) clearTimeout(timer); };
  }, []);
}
