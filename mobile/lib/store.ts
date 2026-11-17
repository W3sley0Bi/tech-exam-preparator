// Single zustand store, persisted to AsyncStorage under 'az900.v1'.
// The data keys (ans, flags, exams, skills, practice, exam, hist, activity, path, plan) match the web app's localStorage
// object, so the web "Export progress" JSON imports 1:1 (and exportState() output imports into the web app).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BY_N } from './data';
import { applyLessonResult, emptyPath, pathStreak } from './logic/learn';
import { newExam, scoreExam } from './logic/exam';
import { buildPractice, DEFAULT_FILTER, sanitizePractice } from './logic/practice';
import { dayKey, planStatus, type PlanStatus } from './logic/plan';
import type {
  ActivityDay, AnswerRecord, ExamSession, HistEntry, LessonOutcome, LessonResult, PathState, PlanState, PracticeFilter,
  PracticeState, ProgressData, Settings, SkillRating,
} from './types';

export const STORAGE_KEY = 'az900.v1';
const DATA_KEYS = ['ans', 'flags', 'exams', 'skills', 'practice', 'exam', 'hist', 'activity', 'path', 'plan'] as const;

export const defaultPlan = (): PlanState => ({ exam: '2026-11-17', ready: '2026-11-14', start: dayKey() });
export const defaultSettings = (): Settings => ({ reminderEnabled: false, reminderHour: 19, reminderMinute: 0, haptics: true, appearance: 'dark' });
const emptyData = (): ProgressData => ({
  ans: {}, flags: {}, exams: [], skills: {}, practice: null, exam: null, hist: [], activity: {}, path: emptyPath(), plan: defaultPlan(),
});

export interface Actions {
  /** records one graded answer: ans[n], hist (cap 2000), activity[today] */
  record(n: number, ok: boolean): void;
  toggleFlag(n: number): void;

  /** builds a new practice set from a filter (shuffles when order=random) and stores it */
  startPractice(f: PracticeFilter): void;
  /** single-question set (from review / exam results); practice.single = true */
  startSingle(n: number): void;
  /** makes sure a non-empty practice set exists (drops removed questions, rebuilds from the saved filter if empty) */
  ensurePractice(): void;
  setPracticeIdx(i: number): void;

  /** creates a fresh 45-min exam session (13/17/15 questions per domain) */
  startExam(): void;
  /** sets the selection for question n (letters for MC, per-item values/option texts for interactive) */
  answerExam(n: number, sel: (string | null)[]): void;
  moveExam(i: number): void;
  toggleExamFlag(n: number): void;
  /** scores + records every question, pushes the result, clears the session. Returns the new result index (or null if no session) */
  submitExam(): number | null;
  /** throws the running session away without scoring */
  abandonExam(): void;

  /** applies a finished lesson / unit test to the path (xp, levels, unit pass). Does NOT call record(); the screen records each answer itself */
  finishLesson(r: LessonResult): LessonOutcome;
  addXp(n: number): void;
  setUnlockAll(v: boolean): void;
  /** v = null clears the rating */
  setSkillRating(skillName: string, v: SkillRating | null): void;

  setPlan(p: Partial<PlanState>): void;
  setSettings(s: Partial<Settings>): void;

  /** accepts the web export JSON (string or parsed object); validates, replaces provided keys like web Object.assign */
  importState(json: string | unknown): { ok: true } | { ok: false; error: string };
  /** web-compatible JSON string (data keys only, no settings) */
  exportState(): string;
  /** deletes answers, flags, exams, skills, practice, exam, hist, activity, path; keeps plan + settings */
  resetAll(): void;
}
export type StoreState = ProgressData & { settings: Settings; hydrated: boolean } & Actions;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** validates/normalizes a (possibly partial) data object. Returns the accepted keys, or an error string. */
function parseData(raw: unknown): { data: Partial<ProgressData>; settings?: Partial<Settings> } | string {
  if (!isObj(raw)) return 'Not a JSON object';
  const out: Partial<ProgressData> = {};
  const bad = (k: string) => `Invalid "${k}"`;
  for (const k of ['ans', 'flags', 'skills', 'activity'] as const) {
    if (raw[k] === undefined) continue;
    if (!isObj(raw[k])) return bad(k);
    (out as Record<string, unknown>)[k] = raw[k];
  }
  for (const k of ['exams', 'hist'] as const) {
    if (raw[k] === undefined) continue;
    if (!Array.isArray(raw[k])) return bad(k);
    (out as Record<string, unknown>)[k] = raw[k];
  }
  for (const k of ['practice', 'exam'] as const) {
    if (raw[k] === undefined) continue;
    if (raw[k] !== null && !isObj(raw[k])) return bad(k);
    if (isObj(raw[k]) && !Array.isArray((raw[k] as Record<string, unknown>).list)) return bad(k);
    (out as Record<string, unknown>)[k] = raw[k];
  }
  if (raw.path !== undefined) {
    if (raw.path !== null && !isObj(raw.path)) return bad('path');
    const p = (raw.path || {}) as Partial<PathState>;
    out.path = { ...emptyPath(), ...p, lessons: p.lessons ?? {}, units: p.units ?? {}, days: p.days ?? {}, xp: Number(p.xp) || 0, unlockAll: !!p.unlockAll };
  }
  if (raw.plan !== undefined) {
    if (!isObj(raw.plan)) return bad('plan');
    const re = /^\d{4}-\d{2}-\d{2}$/;
    const pl = { ...defaultPlan(), ...raw.plan } as PlanState;
    if (![pl.exam, pl.ready, pl.start].every(s => typeof s === 'string' && re.test(s))) return bad('plan');
    out.plan = pl;
  }
  let settings: Partial<Settings> | undefined;
  if (isObj(raw.settings)) {
    const s = raw.settings, st: Partial<Settings> = {};
    if (typeof s.reminderEnabled === 'boolean') st.reminderEnabled = s.reminderEnabled;
    if (typeof s.haptics === 'boolean') st.haptics = s.haptics;
    if (typeof s.reminderHour === 'number') st.reminderHour = s.reminderHour;
    if (typeof s.reminderMinute === 'number') st.reminderMinute = s.reminderMinute;
    if (s.appearance === 'dark' || s.appearance === 'light' || s.appearance === 'system') st.appearance = s.appearance;
    settings = st;
  }
  if (!Object.keys(out).length) return 'No progress data found in this file';
  return { data: out, settings };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      settings: defaultSettings(),
      hydrated: false,

      record(n, ok) {
        set(s => {
          const prev = s.ans[n] || { tries: 0, okCount: 0, ok: false, at: 0 };
          const at = Date.now();
          const rec: AnswerRecord = { tries: prev.tries + 1, okCount: prev.okCount + (ok ? 1 : 0), ok, at };
          const hist: HistEntry[] = [...s.hist, { n, ok, at }];
          if (hist.length > 2000) hist.splice(0, hist.length - 2000);
          const day = dayKey();
          const a = s.activity[day] || { answered: 0, correct: 0 };
          const act: ActivityDay = { answered: a.answered + 1, correct: a.correct + (ok ? 1 : 0) };
          return { ans: { ...s.ans, [n]: rec }, hist, activity: { ...s.activity, [day]: act } };
        });
      },
      toggleFlag(n) {
        set(s => {
          const flags = { ...s.flags };
          if (flags[n]) delete flags[n]; else flags[n] = 1;
          return { flags };
        });
      },

      startPractice(f) { set(s => ({ practice: buildPractice(s, f) })); },
      startSingle(n) { set({ practice: { f: { ...DEFAULT_FILTER }, list: [n], idx: 0, single: true } }); },
      ensurePractice() {
        set(s => {
          let p: PracticeState | null = s.practice ? sanitizePractice(s.practice) : null;
          if (!p || !p.list.length) p = buildPractice(s, p?.f || DEFAULT_FILTER);
          return { practice: p };
        });
      },
      setPracticeIdx(i) { set(s => (s.practice ? { practice: { ...s.practice, idx: i } } : s)); },

      startExam() { set({ exam: newExam() }); },
      answerExam(n, sel) { set(s => (s.exam ? { exam: { ...s.exam, answers: { ...s.exam.answers, [n]: sel } } } : s)); },
      moveExam(i) { set(s => (s.exam && i >= 0 && i < s.exam.list.length ? { exam: { ...s.exam, idx: i } } : s)); },
      toggleExamFlag(n) {
        set(s => {
          if (!s.exam) return s;
          const flags = { ...s.exam.flags };
          if (flags[n]) delete flags[n]; else flags[n] = 1;
          return { exam: { ...s.exam, flags } };
        });
      },
      submitExam() {
        const ex = get().exam;
        if (!ex) return null;
        const { result, records } = scoreExam(ex);
        records.forEach(r => get().record(r.n, r.ok));
        const idx = get().exams.length;
        set(s => ({ exams: [...s.exams, result], exam: null }));
        return idx;
      },
      abandonExam() { set({ exam: null }); },

      finishLesson(r) {
        const { path, outcome } = applyLessonResult(get().path, r);
        set({ path });
        return outcome;
      },
      addXp(n) {
        set(s => {
          const day = dayKey();
          return { path: { ...s.path, xp: s.path.xp + n, days: { ...s.path.days, [day]: (s.path.days[day] || 0) + n } } };
        });
      },
      setUnlockAll(v) { set(s => ({ path: { ...s.path, unlockAll: v } })); },
      setSkillRating(k, v) {
        set(s => {
          const skills = { ...s.skills };
          if (v === null) delete skills[k]; else skills[k] = v;
          return { skills };
        });
      },

      setPlan(p) { set(s => ({ plan: { ...s.plan, ...p } })); },
      setSettings(p) { set(s => ({ settings: { ...s.settings, ...p } })); },

      importState(json) {
        let raw: unknown = json;
        if (typeof json === 'string') {
          try { raw = JSON.parse(json); } catch { return { ok: false, error: 'Could not read that file.' }; }
        }
        const parsed = parseData(raw);
        if (typeof parsed === 'string') return { ok: false, error: parsed };
        const { data, settings } = parsed;
        set(s => ({ ...data, settings: settings ? { ...s.settings, ...settings } : s.settings }));
        get().ensurePractice();
        return { ok: true };
      },
      exportState() {
        const s = get();
        const out: Record<string, unknown> = {};
        DATA_KEYS.forEach(k => { out[k] = s[k]; });
        return JSON.stringify(out, null, 2);
      },
      resetAll() {
        const { plan } = get();
        set({ ...emptyData(), plan });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => {
        const out: Record<string, unknown> = { settings: s.settings };
        DATA_KEYS.forEach(k => { out[k] = s[k]; });
        return out as unknown as StoreState;
      },
      // fill gaps with defaults so older / partial saves never crash selectors
      merge: (persisted, current) => {
        const parsed = isObj(persisted) ? parseData(persisted) : null;
        if (!parsed || typeof parsed === 'string') return current;
        return { ...current, ...parsed.data, settings: { ...current.settings, ...parsed.settings } };
      },
    },
  ),
);

// `hydrated` is runtime-only; any set() after this also persists defaults, fixing plan.start on first launch.
const markHydrated = () => useStore.setState({ hydrated: true });
if (useStore.persist.hasHydrated()) markHydrated(); else useStore.persist.onFinishHydration(markHydrated);

// ---- selectors / hooks
export const useHydrated = (): boolean => useStore(s => s.hydrated);
export const useSettings = (): Settings => useStore(s => s.settings);
/** current day streak (consecutive days with xp) */
export const useStreak = (): number => useStore(s => pathStreak(s.path.days));
/** xp earned today */
export const useTodayXp = (): number => useStore(s => s.path.days[dayKey()] || 0);
/** whole plan status; recomputed when its inputs change (pass `today` to override) */
export function usePlanStatus(today?: string): PlanStatus {
  const ans = useStore(s => s.ans), hist = useStore(s => s.hist), exams = useStore(s => s.exams);
  const activity = useStore(s => s.activity), path = useStore(s => s.path), plan = useStore(s => s.plan);
  return useMemo(() => planStatus({ ans, hist, exams, activity, path, plan }, today), [ans, hist, exams, activity, path, plan, today]);
}
export const getExamSession = (): ExamSession | null => useStore.getState().exam;
export const questionRecord = (n: number): AnswerRecord | undefined => useStore.getState().ans[n];
export const hasQuestion = (n: number): boolean => BY_N.has(n);
