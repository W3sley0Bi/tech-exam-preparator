import i18n from './i18n';

export type Mood = 'idle' | 'happy' | 'think' | 'sad' | 'celebrate';
/** contextual line groups under mascot.* in en.json (each an array of short lines) */
export type MascotContext = Mood | 'correct' | 'wrong' | 'lessonStart' | 'lessonDone' | 'lessonRetry' | 'streak' | 'examDone' | 'welcomeBack';

/** random line for a mood/context; pass `seed` (e.g. question n) for a stable pick across re-renders */
export function mascotLine(ctx: MascotContext, seed?: number): string {
  const lines = i18n.t(`mascot.${ctx}`, { returnObjects: true }) as unknown;
  if (!Array.isArray(lines) || !lines.length) return '';
  const i = seed === undefined ? Math.floor(Math.random() * lines.length) : Math.abs(Math.trunc(seed)) % lines.length;
  return String(lines[i]);
}
/** mood to show for a given context */
export const moodFor: Record<MascotContext, Mood> = {
  idle: 'idle', happy: 'happy', think: 'think', sad: 'sad', celebrate: 'celebrate', correct: 'happy', wrong: 'sad',
  lessonStart: 'idle', lessonDone: 'celebrate', lessonRetry: 'sad', streak: 'celebrate', examDone: 'celebrate', welcomeBack: 'happy',
};
