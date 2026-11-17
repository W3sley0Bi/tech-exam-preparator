export const shuffle = <T,>(arr: readonly T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export const pct = (a: number, b: number): number => (b ? Math.round((a / b) * 100) : 0);

const p2 = (n: number) => String(n).padStart(2, '0');
/** LOCAL calendar day 'YYYY-MM-DD' (not UTC) so a late-evening session counts for the right day */
export const dayKey = (d: Date = new Date()): string => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const parseDay = (s: string): Date => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
