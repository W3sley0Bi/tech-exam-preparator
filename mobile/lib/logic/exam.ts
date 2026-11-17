import { BY_N, DOMAINS, QUESTIONS } from '../data';
import type { DomainKey, ExamResult, ExamSession, Given } from '../types';
import { givenText, gradable, ixAnswered, ixEmpty, scoreOf } from './grading';
import { shuffle } from './util';

export const EXAM_MINUTES = 45;
export const PASS = 700;

/** weighted pick of gradable questions per domain (13/17/15), then shuffled together */
export function newExam(now: number = Date.now()): ExamSession {
  const pick: number[] = [];
  for (const [d, info] of Object.entries(DOMAINS)) {
    pick.push(...shuffle(QUESTIONS.filter(q => q.domain === d && gradable(q))).slice(0, info.examCount).map(q => q.n));
  }
  return { list: shuffle(pick), answers: {}, flags: {}, idx: 0, ends: now + EXAM_MINUTES * 60000, started: now };
}

export const examTotal = (): number => Object.values(DOMAINS).reduce((s, d) => s + d.examCount, 0);
export const gradableCount = (): number => QUESTIONS.filter(gradable).length;

export function examIsDone(ex: ExamSession, n: number): boolean {
  const q = BY_N.get(n)!, a = ex.answers[n];
  return q.ix ? ixAnswered(q, a) : !!a?.length;
}
export const examAnsweredCount = (ex: ExamSession): number => ex.list.filter(n => examIsDone(ex, n)).length;
export const examSelection = (ex: ExamSession, n: number): (string | null)[] => {
  const q = BY_N.get(n)!;
  return ex.answers[n] || (q.ix ? ixEmpty(q) : []);
};
/** ms left, clamped at 0 */
export const examTimeLeft = (ex: ExamSession, now: number = Date.now()): number => Math.max(0, ex.ends - now);
export function formatTimeLeft(ms: number): string {
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Scores a session (partial credit for interactive questions). `records` are the per-question outcomes to feed store.record. */
export function scoreExam(ex: ExamSession, now: number = Date.now()): { result: ExamResult; records: { n: number; ok: boolean }[] } {
  const domains: Partial<Record<DomainKey, [number, number]>> = {};
  let correct = 0, points = 0;
  const records: { n: number; ok: boolean }[] = [];
  const items = ex.list.map(n => {
    const q = BY_N.get(n)!;
    const given: Given = ex.answers[n] || [];
    const { frac, ok } = scoreOf(q, given);
    if (ok) correct++;
    points += frac;
    const dm = domains[q.domain] || (domains[q.domain] = [0, 0]);
    dm[1]++; dm[0] += frac;
    records.push({ n, ok });
    return { n, given: givenText(q, given), ok };
  });
  return {
    records,
    result: {
      at: now, total: ex.list.length, correct, domains, items,
      score: Math.round(points / ex.list.length * 1000), minutes: Math.round((now - ex.started) / 60000),
    },
  };
}
