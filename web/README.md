# AZ-900 Prep

Plain HTML/CSS/JS study app for AZ-900 (Microsoft Azure Fundamentals).

- **Questions**: 472 exam questions scraped from examprepper.co (AZ-900, exam id 63)
- **Notes**: your Obsidian notes (`AZ-900`)
- **Official**: skills outline from the Microsoft Learn study guide (skills measured as of July 20, 2026)

## Learn path (start here)

Duolingo-style path over the official skills outline: 12 units (official skill groups + one for older exam topics),
61 lessons (one per skill). Each lesson = the matching sections of your notes + Microsoft Learn link, then a 6-question
quiz of **real Examprepper questions** tagged to that skill (missed ones come back at the end). 80% passes and levels the
lesson up (max 3, later levels pull questions you haven't seen). Every unit ends with a 10-question unit test that unlocks
the next unit — or take it early to jump ahead. XP, daily goal (50 XP) and streak are tracked.

Question → skill tags and skill → notes sections were assigned by Claude Sonnet subagents
(`data/convert/out/skills-*.json`, `skill-notes.json`); the curriculum is `data/curriculum.json`. No questions were written.

## Exam plan (Plan tab)

Exam Tue 17 Nov 2026, target ready Sat 14 Nov (both editable). Phases: Learn until 10 Nov → mock exams 11–14 Nov →
buffer → exam. Pace checks compare you with where you should be by end of yesterday (linear from the plan start):
lessons (all by 10 Nov), unit tests (follow finished units), questions attempted (90% of the bank by 12 Nov),
3 mock exams by 14 Nov. Quality checks: accuracy of last 100 answers ≥ 80%, avg of last 3 mocks ≥ 800 (pass is 700).
Today's to-do is recalculated daily from what is left. A banner on Learn and Dashboard shows the status.

## Open

Double-click `index.html`, or:

```bash
open ~/Public/az900-prep/index.html
```

Progress is saved in the browser's localStorage. Use Dashboard → Export/Import to back it up.

## Rebuild after editing notes

```bash
cp /path/to/vault/*.md notes/
python3 build.py
```

## Grading

- Multiple choice (209): graded against the community's top vote when ≥50%, otherwise the site's suggested answer. A warning shows when the two disagree, or when the answer was flagged as outdated.
- Hotspot / drag & drop (263): 261 were converted by Claude Sonnet subagents from the question/answer images into
  Yes/No, drop-down, match and multi-select questions (`data/convert/SPEC.md` → `data/convert/out/*.json`), auto-graded with
  partial credit. The official answer image is still shown after checking. 2 stay reveal-and-self-grade.
- Domains: tagged per the official outline by the same subagents (concepts 90 · architecture 204 · management 178).
- Mock exam: 45 questions (13 / 17 / 15 by domain), all question types, 45 minutes, partial credit, pass at 700/1000.
