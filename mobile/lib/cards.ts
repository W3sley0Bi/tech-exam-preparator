import cardsJson from '../data/cards.json';

export interface SkillCard {
  skill: string;
  facts: string[];
  pick: { when: string; use: string }[];
  traps: string[];
}

const BY_SKILL = new Map((cardsJson as unknown as SkillCard[]).map(c => [c.skill, c]));

export const cardFor = (skill: string): SkillCard | undefined => BY_SKILL.get(skill);
