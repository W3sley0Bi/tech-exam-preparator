// Study plan / on-track tracker. Phases: learn the whole path by (ready − 4d), cover the question bank by (ready − 2d),
// mock exams in the final days; "ready" = all checks green by the ready date.
import { CURRICULUM, DOMAIN_KEYS, QUESTIONS } from '../data';
import type { DomainKey, ProgressData } from '../types';
import { gradable } from './grading';
import { dayKey, parseDay } from './util';
import { lessonState, unitPassed, unitTestReady } from './learn';

const DAY = 86400000;
export const COVERAGE_TARGET = 0.9, ACC_TARGET = 80, MOCK_TARGET = 800, MOCKS_NEEDED = 3;

export { dayKey, parseDay };
export const addDays = (s: string, n: number): string => { const d = parseDay(s); d.setDate(d.getDate() + n); return dayKey(d); };
export const daysBetween = (a: string, b: string): number => Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / DAY);

export type Status = 'ok' | 'warn' | 'bad';
export type QualityStatus = Status | 'na';
export type CheckId = 'lessons' | 'units' | 'questions' | 'mocks';
export type QualityId = 'accuracy' | 'mock';
export interface PlanCheck {
  id: CheckId; actual: number; goal: number; by: string; expected: number; due: number; status: Status; done: boolean;
}
export interface PlanQuality {
  id: QualityId; value: number | null; unit: '%' | ''; goal: number; status: QualityStatus;
  /** i18n key (plan.hint.*) or null, with params */
  hint: { key: string; params?: Record<string, string | number> } | null;
}
export interface TodoItem { key: string; params: Record<string, number>; route: string }
export interface PlanStatus {
  pl: ProgressData['plan']; t: string; learnBy: string; coverBy: string;
  checks: PlanCheck[]; quality: PlanQuality[]; readiness: number; overall: Status; ready: boolean;
  todo: TodoItem[]; todayAct: { answered: number; correct: number }; todayGoal: number;
  domainAcc: { d: DomainKey; n: number; acc: number | null }[];
  daysToExam: number; daysToReady: number;
}
export type PlanInput = Pick<ProgressData, 'ans' | 'hist' | 'exams' | 'activity' | 'path' | 'plan'>;

export function planStatus(state: PlanInput, today: string = dayKey()): PlanStatus {
  const pl = state.plan, t = today, path = state.path, ans = state.ans;
  const learnBy = addDays(pl.ready, -4), coverBy = addDays(pl.ready, -2);
  // expected progress after `daysDone` full days of the plan (today counts once it is over)
  const linear = (total: number, deadline: string, daysDone = daysBetween(pl.start, t) + 1) => {
    const span = daysBetween(pl.start, deadline);
    if (span <= 0) return total;
    return total * Math.min(1, Math.max(0, daysDone / (span + 1)));
  };
  const elapsed = daysBetween(pl.start, t); // full days before today
  const status = (actual: number, expected: number): Status => actual >= expected - 0.001 ? 'ok' : actual >= expected * 0.8 ? 'warn' : 'bad';

  const lessonsTotal = CURRICULUM.reduce((s, u) => s + u.skills.length, 0);
  const lessonsDone = CURRICULUM.reduce((s, u) => s + u.skills.filter(sk => lessonState(path, sk.id).level > 0).length, 0);
  const unitsTotal = CURRICULUM.length;
  const unitsDone = CURRICULUM.filter(u => unitPassed(path, u)).length;
  const unitsReady = CURRICULUM.filter((u, ui) => unitPassed(path, u) || unitTestReady(path, ui)).length;
  const bank = QUESTIONS.filter(gradable);
  const covered = bank.filter(q => ans[q.n]).length;
  const coverGoal = Math.ceil(bank.length * COVERAGE_TARGET);
  const recent = state.hist.slice(-100);
  const acc = recent.length ? Math.round(recent.filter(h => h.ok).length / recent.length * 100) : null;
  const mocks = state.exams.filter(e => e.total >= 30);
  const last3 = mocks.slice(-MOCKS_NEEDED);
  const mockAvg = last3.length ? Math.round(last3.reduce((s, e) => s + e.score, 0) / last3.length) : null;
  const mockSpan = daysBetween(learnBy, pl.ready) + 1;
  const mockDue = (d: string) => d < learnBy ? 0 : Math.min(MOCKS_NEEDED, Math.ceil(MOCKS_NEEDED * (daysBetween(learnBy, d) + 1) / mockSpan));
  const mockExpected = t < learnBy ? 0 : Math.min(MOCKS_NEEDED, Math.ceil(MOCKS_NEEDED * (daysBetween(learnBy, t) + 1) / mockSpan));

  const domainAcc = DOMAIN_KEYS.map(d => {
    const seen = QUESTIONS.filter(q => q.domain === d && ans[q.n]);
    return { d, n: seen.length, acc: seen.length ? Math.round(seen.filter(q => ans[q.n].ok).length / seen.length * 100) : null };
  });

  // expected = target by end of today (shown); due = where you should be by end of yesterday (judged)
  const raw: Omit<PlanCheck, 'status' | 'done'>[] = [
    { id: 'lessons', actual: lessonsDone, goal: lessonsTotal, by: learnBy,
      expected: Math.ceil(linear(lessonsTotal, learnBy)), due: Math.floor(linear(lessonsTotal, learnBy, elapsed)) },
    // unit tests follow the lessons: every unit whose lessons are all done should have its test passed (one may be pending)
    { id: 'units', actual: unitsDone, goal: unitsTotal, by: learnBy, expected: unitsReady, due: Math.max(0, unitsReady - 1) },
    { id: 'questions', actual: covered, goal: coverGoal, by: coverBy,
      expected: Math.ceil(linear(coverGoal, coverBy)), due: Math.floor(linear(coverGoal, coverBy, elapsed)) },
    { id: 'mocks', actual: Math.min(mocks.length, MOCKS_NEEDED), goal: MOCKS_NEEDED, by: pl.ready,
      expected: mockExpected, due: mockDue(addDays(t, -1)) },
  ];
  const checks: PlanCheck[] = raw.map(c => ({ ...c, status: status(c.actual, c.due), done: c.actual >= c.goal }));

  // quality checks: thresholds, not pace
  const quality: PlanQuality[] = [
    { id: 'accuracy', value: acc, unit: '%', goal: ACC_TARGET,
      status: acc === null || recent.length < 30 ? 'na' : acc >= ACC_TARGET ? 'ok' : acc >= ACC_TARGET - 10 ? 'warn' : 'bad',
      hint: recent.length < 30 ? { key: 'plan.hint.answersNeeded', params: { have: recent.length, need: 30 } } : null },
    { id: 'mock', value: mockAvg, unit: '', goal: MOCK_TARGET,
      status: mockAvg === null ? 'na' : mockAvg >= MOCK_TARGET ? 'ok' : mockAvg >= 700 ? 'warn' : 'bad',
      hint: mockAvg === null ? { key: 'plan.hint.takeMocks', params: { date: learnBy } } : { key: 'plan.hint.passMark' } },
  ];

  const pctOf = (a: number, b: number) => b ? Math.min(1, a / b) : 1;
  const readiness = Math.round(100 * (
    0.25 * pctOf(lessonsDone, lessonsTotal) + 0.10 * pctOf(unitsDone, unitsTotal) + 0.20 * pctOf(covered, coverGoal) +
    0.25 * (acc === null || recent.length < 30 ? 0 : pctOf(acc, ACC_TARGET)) +
    0.20 * (mockAvg === null ? 0 : pctOf(mockAvg, MOCK_TARGET) * pctOf(mocks.length, MOCKS_NEEDED))));

  // quality only counts toward the verdict once enough is measured (accuracy) or the mock phase started
  const states: Status[] = [...checks.map(c => c.status),
    ...quality.filter(q => q.status !== 'na' && (q.unit === '%' || t >= learnBy)).map(q => q.status as Status)];
  const overall: Status = states.includes('bad') ? 'bad' : states.includes('warn') ? 'warn' : 'ok';
  const ready = checks.every(c => c.done) && quality.every(q => q.status === 'ok');

  // today's to-do, recalculated from what's left
  const daysTo = (d: string) => Math.max(1, daysBetween(t, d) + 1);
  const todo: TodoItem[] = [];
  if (t <= learnBy && lessonsDone < lessonsTotal) {
    todo.push({ key: 'plan.todo.lessons', params: { count: Math.ceil((lessonsTotal - lessonsDone) / daysTo(learnBy)) }, route: '/learn' });
    if (unitsDone < unitsTotal) todo.push({ key: 'plan.todo.unitTest', params: { count: unitsTotal - unitsDone }, route: '/learn' });
  }
  if (t <= coverBy && covered < coverGoal) {
    todo.push({ key: 'plan.todo.newQuestions', params: { count: Math.ceil((coverGoal - covered) / daysTo(coverBy)) }, route: '/practice?status=unseen&order=random' });
  }
  if (t >= learnBy && t <= pl.ready) todo.push({ key: 'plan.todo.mock', params: {}, route: '/exam' });
  if (QUESTIONS.some(q => ans[q.n] && !ans[q.n].ok)) todo.push({ key: 'plan.todo.wrong', params: {}, route: '/practice?status=wrong&order=random' });
  if (t > pl.ready) todo.unshift({ key: 'plan.todo.light', params: {}, route: '/review' });
  const todayAct = state.activity[t] || { answered: 0, correct: 0 };
  const todayGoal = t <= coverBy ? Math.ceil(Math.max(0, coverGoal - covered + todayAct.answered) / daysTo(coverBy)) : 45;

  return { pl, t, learnBy, coverBy, checks, quality, readiness, overall, ready, todo, todayAct, todayGoal, domainAcc,
    daysToExam: daysBetween(t, pl.exam), daysToReady: daysBetween(t, pl.ready) };
}

export type PhaseId = 'learn' | 'mocks' | 'buffer' | 'exam';
export interface Phase { id: PhaseId; from: string; to: string; state: 'past' | 'now' | 'future' }
export function planPhases(s: Pick<PlanStatus, 'pl' | 'learnBy' | 't'>): Phase[] {
  const pl = s.pl;
  const defs: [PhaseId, string, string][] = [
    ['learn', pl.start, s.learnBy], ['mocks', addDays(s.learnBy, 1), pl.ready],
    ['buffer', addDays(pl.ready, 1), addDays(pl.exam, -1)], ['exam', pl.exam, pl.exam],
  ];
  return defs.map(([id, from, to]) => ({ id, from, to, state: s.t > to ? 'past' : s.t >= from ? 'now' : 'future' }));
}

export interface CalDay { day: string; answered: number; level: 0 | 1 | 2 | 3; tag: '' | 'exam' | 'ready' | 'learn'; today: boolean; future: boolean }
/** calendar from plan start to exam day, shaded by questions answered (0 / 1–19 / 20–44 / 45+) */
export function planCalendar(s: Pick<PlanStatus, 'pl' | 'learnBy' | 't'>, activity: ProgressData['activity']): CalDay[] {
  const out: CalDay[] = [];
  const { pl } = s;
  for (let d = pl.start; d <= pl.exam; d = addDays(d, 1)) {
    const a = activity[d]?.answered || 0;
    out.push({ day: d, answered: a, level: a === 0 ? 0 : a < 20 ? 1 : a < 45 ? 2 : 3,
      tag: d === pl.exam ? 'exam' : d === pl.ready ? 'ready' : d === s.learnBy ? 'learn' : '', today: d === s.t, future: d > s.t });
  }
  return out;
}

/** today's target in questions (used by banners); same number planStatus().todayGoal returns */
export const todayGoal = (s: PlanStatus): number => s.todayGoal;
