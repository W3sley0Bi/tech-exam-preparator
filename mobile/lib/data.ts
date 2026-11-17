import { IMAGES } from '../data/images';
import curriculumJson from '../data/curriculum.json';
import notesJson from '../data/notes.json';
import questionsJson from '../data/questions.json';
import type { DomainInfo, DomainKey, Note, Question, Unit } from './types';

export const QUESTIONS = questionsJson as unknown as Question[];
export const NOTES = notesJson as unknown as Note[];
export const CURRICULUM = curriculumJson as unknown as Unit[];
export const BY_N: Map<number, Question> = new Map(QUESTIONS.map(q => [q.n, q]));

export const DOMAINS: Record<DomainKey, DomainInfo> = {
  concepts: { label: 'Cloud concepts', weight: '25–30%', examCount: 13 },
  architecture: { label: 'Architecture & services', weight: '35–40%', examCount: 17 },
  management: { label: 'Management & governance', weight: '30–35%', examCount: 15 },
};
export const DOMAIN_KEYS = Object.keys(DOMAINS) as DomainKey[];

export const LEARN_BASE = 'https://learn.microsoft.com/en-us/';

/** Resolves a question/note image key ('q/x.png', 'notes/x.png' or an http URL) for <Image source>. null if unknown. */
export function imageSource(key: string): number | { uri: string } | null {
  if (/^https?:\/\//i.test(key)) return { uri: key };
  const mod = IMAGES[key];
  return mod === undefined ? null : mod;
}
