import { NOTES } from '../data';
import type { Question } from '../types';

export interface Heading { level: number; text: string; id: string }

export const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** h1–h3 headings of a markdown doc */
export function headings(md: string): Heading[] {
  const out: Heading[] = [];
  md.split('\n').forEach(l => { const m = l.match(/^(#{1,3})\s+(.+)/); if (m) out.push({ level: m[1].length, text: m[2].trim(), id: slug(m[2]) }); });
  return out;
}

/** the markdown from heading `h` (slug) up to the next heading of equal or higher level */
export function noteSection(doc: string, h: string): { title: string; md: string } | null {
  const note = NOTES.find(n => n.id === doc); if (!note) return null;
  const lines = note.md.split('\n'); let start = -1, level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,4})\s+(.+)/);
    if (!m) continue;
    if (start < 0 && slug(m[2]) === h) { start = i; level = m[1].length; }
    else if (start >= 0 && m[1].length <= level) return { title: note.title, md: lines.slice(start, i).join('\n') };
  }
  return start >= 0 ? { title: note.title, md: lines.slice(start).join('\n') } : null;
}

const STOP = new Set('describe azure purpose with that this from your which what when following using about other their there these into each should company'.split(' '));
export interface RelatedNote { note: string; noteTitle: string; h: Heading; score: number }
/** up to 3 note headings whose significant words appear in the question + choices */
export function relatedNotes(q: Question): RelatedNote[] {
  const qt = (q.text + ' ' + Object.values(q.choices || {}).join(' ')).toLowerCase();
  const hits: RelatedNote[] = [];
  NOTES.forEach(n => headings(n.md).forEach(h => {
    const words = h.text.toLowerCase().match(/[a-z]{4,}/g) || [];
    const sig = words.filter(w => !STOP.has(w));
    const score = sig.filter(w => qt.includes(w)).length;
    if (score && score >= Math.min(2, sig.length)) hits.push({ note: n.id, noteTitle: n.title, h, score });
  }));
  return hits.sort((a, b) => b.score - a.score).slice(0, 3);
}

export interface NoteHit { noteId: string; noteTitle: string; headingId: string; headingText: string; line: string }
/** case-insensitive literal line search over all notes, with the nearest preceding heading as context */
export function searchNotes(query: string, limit = 200): { total: number; hits: NoteHit[] } {
  const q = query.trim();
  if (!q) return { total: 0, hits: [] };
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const hits: NoteHit[] = [];
  NOTES.forEach(n => {
    let cur = { text: n.title, id: '' };
    n.md.split('\n').forEach(l => {
      const h = l.match(/^#{1,3}\s+(.+)/); if (h) cur = { text: h[1], id: slug(h[1]) };
      if (re.test(l)) hits.push({ noteId: n.id, noteTitle: n.title, headingId: cur.id, headingText: cur.text, line: l.trim() });
    });
  });
  return { total: hits.length, hits: hits.slice(0, limit) };
}

/** split a line into plain / matched parts for highlighting */
export function highlightParts(line: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text: line, match: false }];
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return line.split(re).map((text, i) => ({ text, match: i % 2 === 1 })).filter(p => p.text);
}

/** short search term for a skill name (used to deep-link into notes search from the official guide) */
export function searchTerm(skill: string): string {
  const m = skill.match(/\(([^)]+)\)/);
  if (m && m[1].length <= 6) return m[1];
  return skill.replace(/^(Describe|Define|Compare|Identify|Purpose of)\s+(the\s+)?/i, '').split(/[,:]/)[0].replace(/\b(options|types|benefits)\b/gi, '').trim().split(' ').slice(0, 3).join(' ');
}
