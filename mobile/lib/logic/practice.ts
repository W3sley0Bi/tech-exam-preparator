import { BY_N, QUESTIONS } from '../data';
import type { AnswerRecord, PracticeFilter, PracticeState, Question } from '../types';
import { shuffle } from './util';

export const DEFAULT_FILTER: PracticeFilter = { domain: 'all', status: 'all', type: 'all', order: 'seq' };

export function filterQuestions(state: { ans: Record<number, AnswerRecord>; flags: Record<number, 1> }, f: PracticeFilter): Question[] {
  return QUESTIONS.filter(q => {
    if (f.domain && f.domain !== 'all' && q.domain !== f.domain) return false;
    if (f.type === 'mc' && !q.mc) return false;
    if (f.type === 'visual' && q.mc) return false;
    const a = state.ans[q.n];
    if (f.status === 'unseen' && a) return false;
    if (f.status === 'wrong' && !(a && !a.ok)) return false;
    if (f.status === 'flagged' && !state.flags[q.n]) return false;
    return true;
  });
}

export function buildPractice(state: { ans: Record<number, AnswerRecord>; flags: Record<number, 1> }, f: PracticeFilter): PracticeState {
  let list = filterQuestions(state, f).map(q => q.n);
  if (f.order === 'random') list = shuffle(list);
  return { f, list, idx: 0 };
}

/** drops numbers no longer in the question bank */
export const sanitizePractice = (p: PracticeState): PracticeState => ({ ...p, list: p.list.filter(n => BY_N.has(n)) });

/** parse route search params (domain/status/type/order) into a filter; undefined if none present */
export function filterFromParams(p: Record<string, string | string[] | undefined>): PracticeFilter | undefined {
  const g = (k: string) => { const v = p[k]; return Array.isArray(v) ? v[0] : v; };
  if (!['domain', 'status', 'type', 'order'].some(k => g(k))) return undefined;
  return {
    domain: (g('domain') as PracticeFilter['domain']) || 'all', status: (g('status') as PracticeFilter['status']) || 'all',
    type: (g('type') as PracticeFilter['type']) || 'all', order: (g('order') as PracticeFilter['order']) || 'seq',
  };
}
