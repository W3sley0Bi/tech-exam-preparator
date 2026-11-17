// Learning path (Duolingo-style). Units = official skill groups, lessons = skills.
// Lesson quizzes only use real exam questions tagged to the skill. All functions are pure (state passed in).
import { CURRICULUM, QUESTIONS } from '../data';
import type { AnswerRecord, LessonOutcome, LessonResult, LessonState, PathState, Question, Unit } from '../types';
import { gradable } from './grading';
import { dayKey, pct, shuffle } from './util';

export const LESSON_SIZE = 6, TEST_SIZE = 10, PASS_PCT = 80, MAX_LEVEL = 3, DAILY_GOAL = 50;

export const emptyPath = (): PathState => ({ lessons: {}, units: {}, xp: 0, days: {}, unlockAll: false });

export const skillQs = (id: string): Question[] => QUESTIONS.filter(q => q.skill === id && gradable(q));
export const unitQs = (u: Unit): Question[] => u.skills.flatMap(s => skillQs(s.id));
export const lessonState = (p: PathState, id: string): LessonState => p.lessons[id] || { level: 0, best: 0, seen: [] };
export const unitPassed = (p: PathState, u: Unit): boolean => !!p.units[u.id]?.passed;

export function unitUnlocked(p: PathState, i: number): boolean {
  return p.unlockAll || i === 0 || unitPassed(p, CURRICULUM[i - 1]) || unitPassed(p, CURRICULUM[i]);
}
export function lessonUnlocked(p: PathState, ui: number, si: number): boolean {
  if (!unitUnlocked(p, ui)) return false;
  if (si === 0 || p.unlockAll || unitPassed(p, CURRICULUM[ui])) return true;
  return lessonState(p, CURRICULUM[ui].skills[si - 1].id).level > 0;
}
export const unitTestReady = (p: PathState, ui: number): boolean => CURRICULUM[ui].skills.every(s => lessonState(p, s.id).level > 0);

/** prefer questions not yet seen in this lesson, then ones answered wrong, then the rest */
export function pickQuestions(pool: Question[], seen: readonly number[], size: number, ans: Record<number, AnswerRecord>): Question[] {
  const rank = (q: Question) => (seen.includes(q.n) ? 2 : 0) + (ans[q.n] && !ans[q.n].ok ? -1 : 0);
  return shuffle(pool).sort((a, b) => rank(a) - rank(b)).slice(0, size);
}

/** first available, unfinished lesson (gets the START bubble) */
export function currentLessonId(p: PathState): string | null {
  for (let ui = 0; ui < CURRICULUM.length; ui++) {
    const u = CURRICULUM[ui];
    for (let si = 0; si < u.skills.length; si++) {
      if (lessonUnlocked(p, ui, si) && lessonState(p, u.skills[si].id).level === 0) return u.skills[si].id;
    }
  }
  return null;
}

/** XP for one first-attempt answer: 10 correct, 5 partial credit, 0 wrong */
export const questionXp = (frac: number, ok: boolean): number => (ok ? 10 : frac > 0 ? 5 : 0);

/** streak of consecutive days with xp; alive until today ends */
export function pathStreak(days: Record<string, number>, today: string = dayKey()): number {
  const [y, m, d0] = today.split('-').map(Number);
  const d = new Date(y, m - 1, d0);
  let s = 0;
  if (!days[today]) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

/** Port of web finish(): returns the new path (xp + days + lesson/unit progress), score and message. Does not mutate. */
export function applyLessonResult(path: PathState, r: LessonResult, today: string = dayKey()):
  { path: PathState; outcome: LessonOutcome } {
  const fracs = Object.values(r.results);
  const scorePct = r.total ? Math.round(fracs.reduce((a, b) => a + b, 0) / r.total * 100) : 100;
  const passed = scorePct >= PASS_PCT;
  const isTest = r.kind === 'test';
  let xp = r.questionXp;
  if (passed) xp += isTest ? 50 : 10;

  const next: PathState = {
    ...path,
    xp: path.xp + xp,
    days: { ...path.days, [today]: (path.days[today] || 0) + xp },
    lessons: { ...path.lessons },
    units: { ...path.units },
  };
  let message: LessonOutcome['message'] = null;
  if (isTest) {
    const unit = CURRICULUM.find(u => u.id === r.id);
    if (unit) {
      const prev = next.units[unit.id] || { passed: false, best: 0 };
      const us = { ...prev, best: Math.max(prev.best, scorePct) };
      if (passed && !us.passed) {
        us.passed = true;
        unit.skills.forEach(s => {
          const ls = lessonState(next, s.id);
          next.lessons[s.id] = { ...ls, level: Math.max(ls.level, 1) };
        });
        message = { key: 'lesson.unitComplete' };
      }
      next.units[unit.id] = us;
    }
  } else {
    const ls = { ...lessonState(next, r.id) };
    ls.best = Math.max(ls.best, scorePct);
    ls.seen = [...new Set([...ls.seen, ...Object.keys(r.results).map(Number)])];
    if (passed && ls.level < MAX_LEVEL) { ls.level++; message = { key: 'lesson.levelReached', params: { level: ls.level } }; }
    next.lessons[r.id] = ls;
  }
  return { path: next, outcome: { scorePct, passed, xp, message, streak: pathStreak(next.days, today) } };
}

export const dailyGoalPct = (todayXp: number): number => Math.min(100, pct(todayXp, DAILY_GOAL));
