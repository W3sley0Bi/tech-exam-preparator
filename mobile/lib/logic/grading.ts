import type { Given, Question } from '../types';

export const letters = (s: string | undefined | null): string[] => (s || '').replace(/[^A-Z]/g, '').split('').filter(Boolean);
export const sameSet = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every(x => b.includes(x));
/** auto-gradable: classic MC or converted interactive question */
export const gradable = (q: Question): boolean => q.mc || !!q.ix;

/** empty selection: [] for multiselect, one null per row otherwise */
export function ixEmpty(q: Question): (string | null)[] {
  const ix = q.ix!;
  return ix.kind === 'multiselect' ? [] : ix.items.map(() => null);
}
export function ixAnswered(q: Question, sel: Given | null | undefined): boolean {
  if (!sel) return false;
  return q.ix!.kind === 'multiselect' ? sel.length > 0 : sel.every(v => v !== null);
}
export function ixScore(q: Question, sel?: Given | null): { got: number; total: number; ok: boolean } {
  const ix = q.ix!;
  const s = sel || ixEmpty(q);
  if (ix.kind === 'multiselect') {
    const ans = ix.answers;
    const hit = s.filter(o => o !== null && ans.includes(o)).length, miss = s.filter(o => o === null || !ans.includes(o)).length;
    return { got: Math.max(0, hit - miss), total: ans.length, ok: sameSet(s as string[], ans) };
  }
  const got = ix.items.filter((it, i) => s[i] === it.answer).length;
  return { got, total: ix.items.length, ok: got === ix.items.length };
}
/** fraction of points (MC all-or-nothing; interactive gets partial credit like the real exam) */
export function scoreOf(q: Question, given?: Given | null): { frac: number; ok: boolean } {
  if (q.ix) { const s = ixScore(q, given); return { frac: s.got / s.total, ok: s.ok }; }
  const ok = sameSet((given || []) as string[], letters(q.answer));
  return { frac: ok ? 1 : 0, ok };
}
export function givenText(q: Question, given?: Given | null): string {
  if (!given || !given.length) return '—';
  if (q.mc) return given.join('');
  const s = ixScore(q, given);
  return `${s.got}/${s.total}`;
}
/** number of answers an MC question needs (1 if unknown) */
export const needCount = (q: Question): number => letters(q.answer).length || 1;
/** toggle a choice: single-answer replaces, multi-answer toggles */
export function toggleSelection(sel: readonly string[], k: string, need: number): string[] {
  return need === 1 ? [k] : sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k];
}
/** question text for display: strips //IMG// markers and trailing "Hot Area" style labels (used for ix questions) */
export const cleanText = (q: Question): string =>
  q.text.replace(/\/\/IMG\/\//g, '').replace(/\n(Hot Area|Select and Place|Answer Area):?\s*$/i, '').trim();
/** split text on //IMG// markers: alternating text parts; images are consumed from qimg in order by the UI */
export const splitImgText = (text: string): string[] => text.split('//IMG//');
