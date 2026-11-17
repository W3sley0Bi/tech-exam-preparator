import lessonsJson from '../data/lessons.json';

export interface LessonSection { title: string; points: string[]; qs: number[]; link?: string }
export interface SkillLesson { skill: string; sections: LessonSection[] }

const BY_SKILL = new Map((lessonsJson as unknown as SkillLesson[]).map(l => [l.skill, l]));

export const lessonFor = (skill: string): SkillLesson | undefined => BY_SKILL.get(skill);

/** the section that teaches the concept behind question n (undefined if none) */
export const sectionForQ = (skill: string, n: number): LessonSection | undefined =>
  BY_SKILL.get(skill)?.sections.find(s => s.qs.includes(n));
