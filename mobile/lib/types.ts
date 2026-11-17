// Shared types. State shapes (AnswerRecord … PlanState) mirror the web app's localStorage object 1:1.
export type DomainKey = 'concepts' | 'architecture' | 'management';
export type UnitDomain = DomainKey | 'extra';

export type IxKind = 'yesno' | 'dropdown' | 'match' | 'multiselect';
export interface IxItem { label: string; options: string[]; answer: string }
export interface Ix {
  kind: IxKind;
  prompt: string;
  /** yesno / dropdown / match rows (empty for multiselect) */
  items: IxItem[];
  /** multiselect only */
  options: string[];
  answers: string[];
  confidence: string;
  note: string;
}

export interface Community { ans: string; pct: number }
export interface Comment { u: number; c: string }

export interface Question {
  n: number;
  domain: DomainKey;
  /** may contain //IMG// placeholders where qimg images belong */
  text: string;
  choices: Record<string, string> | null;
  /** true = classic multiple choice with letter answer */
  mc: boolean;
  /** e.g. "B" or "AC"; '' for non-mc */
  answer: string;
  site: string;
  community: Community[];
  desc: string;
  qimg: string[];
  aimg: string[];
  comments: Comment[];
  ix?: Ix;
  skill?: string;
  review_note?: string;
}

export interface Note { id: string; title: string; md: string }
export interface NoteRef { doc: string; h: string }
export interface Skill { id: string; name: string; notes?: NoteRef[] }
export interface Unit { id: string; domain: UnitDomain; title: string; path?: string; skills: Skill[] }
export interface DomainInfo { label: string; weight: string; examCount: number }

/** Selection for a question: MC = letters, multiselect = option texts, yesno/dropdown/match = per-item value or null. */
export type Given = readonly (string | null)[];

// ---- persisted state (web-compatible)
export interface AnswerRecord { tries: number; okCount: number; ok: boolean; at: number }
export interface HistEntry { n: number; ok: boolean; at: number }
export interface ActivityDay { answered: number; correct: number }

export interface PracticeFilter {
  domain: 'all' | DomainKey;
  status: 'all' | 'unseen' | 'wrong' | 'flagged';
  type: 'all' | 'mc' | 'visual';
  order: 'seq' | 'random';
}
export interface PracticeState { f: PracticeFilter; list: number[]; idx: number; single?: boolean }

export interface ExamSession {
  list: number[];
  answers: Record<number, (string | null)[]>;
  flags: Record<number, 1>;
  idx: number;
  /** epoch ms deadline */
  ends: number;
  started: number;
}
export interface ExamResultItem { n: number; given: string; ok: boolean }
export interface ExamResult {
  at: number;
  total: number;
  correct: number;
  /** domain -> [points earned (fractional), question count] */
  domains: Partial<Record<DomainKey, [number, number]>>;
  items: ExamResultItem[];
  /** 0..1000 */
  score: number;
  minutes: number;
}

export interface LessonState { level: number; best: number; seen: number[] }
export interface UnitState { passed: boolean; best: number }
export interface PathState {
  lessons: Record<string, LessonState>;
  units: Record<string, UnitState>;
  xp: number;
  /** local day -> xp earned */
  days: Record<string, number>;
  unlockAll: boolean;
}
export interface PlanState { exam: string; ready: string; start: string }

/** skill rating: 0 weak, 1 ok, 2 strong */
export type SkillRating = 0 | 1 | 2;

export interface ProgressData {
  ans: Record<number, AnswerRecord>;
  flags: Record<number, 1>;
  exams: ExamResult[];
  skills: Record<string, SkillRating>;
  practice: PracticeState | null;
  exam: ExamSession | null;
  hist: HistEntry[];
  activity: Record<string, ActivityDay>;
  path: PathState;
  plan: PlanState;
}

export type Appearance = 'dark' | 'light' | 'system';
export interface Settings { reminderEnabled: boolean; reminderHour: number; reminderMinute: number; haptics: boolean; appearance: Appearance }

export type LessonKind = 'skill' | 'test';
export interface LessonResult {
  kind: LessonKind;
  /** skill id (kind 'skill') or unit id (kind 'test') */
  id: string;
  /** question n -> fraction 0..1 on FIRST attempt */
  results: Record<number, number>;
  /** number of questions in the lesson queue */
  total: number;
  /** XP earned from questions during the lesson (see questionXp) */
  questionXp: number;
}
export interface I18nMessage { key: string; params?: Record<string, string | number> }
export interface LessonOutcome {
  scorePct: number;
  passed: boolean;
  /** total xp granted including pass bonus */
  xp: number;
  message: I18nMessage | null;
  streak: number;
}
