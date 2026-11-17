FINAL CONTRACT. `npx tsc --noEmit` passes in `mobile/`.

I did not run any of the pure-logic functions (grading, learn, plan, exam, practice, notes) or the store. They are only type-checked. `lib/data.ts` pulls in `data/images.ts`, which uses `require()` on PNGs, so those modules can't load in plain node.

Template files I kept because `app/(tabs)/*` still imports them: `components/{Themed,EditScreenInfo,StyledText,ExternalLink}.tsx` and `constants/Colors.ts`. The later tabs agent should delete them once it stops importing them. I made three minimal template fixes so the project compiles:
- `components/Themed.tsx`: prop types now use `ComponentProps`.
- `components/ExternalLink.tsx`: `href` cast to `never`.
- `app/(tabs)/_layout.tsx`: `href="/modal"` changed to `"/"`.

I also rewrote `app/+not-found.tsx` to be minimal.

I added two files you did not list: `lib/logic/util.ts` and `lib/mascot.ts`.

## lib/types.ts
```ts
type DomainKey='concepts'|'architecture'|'management'; type UnitDomain=DomainKey|'extra';
type IxKind='yesno'|'dropdown'|'match'|'multiselect';
interface IxItem{label:string;options:string[];answer:string}
interface Ix{kind:IxKind;prompt:string;items:IxItem[];options:string[];answers:string[];confidence:string;note:string}
interface Community{ans:string;pct:number}; interface Comment{u:number;c:string}
interface Question{n:number;domain:DomainKey;text:string;choices:Record<string,string>|null;mc:boolean;answer:string;site:string;community:Community[];desc:string;qimg:string[];aimg:string[];comments:Comment[];ix?:Ix;skill?:string;review_note?:string}
interface Note{id:string;title:string;md:string}; interface NoteRef{doc:string;h:string}
interface Skill{id:string;name:string;notes?:NoteRef[]}
interface Unit{id:string;domain:UnitDomain;title:string;path?:string;skills:Skill[]}
interface DomainInfo{label:string;weight:string;examCount:number}
type Given=readonly (string|null)[]   // MC: letters; multiselect: option texts; others: per-item value or null
interface AnswerRecord{tries:number;okCount:number;ok:boolean;at:number}
interface HistEntry{n:number;ok:boolean;at:number}; interface ActivityDay{answered:number;correct:number}
interface PracticeFilter{domain:'all'|DomainKey;status:'all'|'unseen'|'wrong'|'flagged';type:'all'|'mc'|'visual';order:'seq'|'random'}
interface PracticeState{f:PracticeFilter;list:number[];idx:number;single?:boolean}
interface ExamSession{list:number[];answers:Record<number,(string|null)[]>;flags:Record<number,1>;idx:number;ends:number;started:number}
interface ExamResultItem{n:number;given:string;ok:boolean}
interface ExamResult{at:number;total:number;correct:number;domains:Partial<Record<DomainKey,[number,number]>>;items:ExamResultItem[];score:number;minutes:number}
interface LessonState{level:number;best:number;seen:number[]}; interface UnitState{passed:boolean;best:number}
interface PathState{lessons:Record<string,LessonState>;units:Record<string,UnitState>;xp:number;days:Record<string,number>;unlockAll:boolean}
interface PlanState{exam:string;ready:string;start:string}
type SkillRating=0|1|2
interface ProgressData{ans:Record<number,AnswerRecord>;flags:Record<number,1>;exams:ExamResult[];skills:Record<string,SkillRating>;practice:PracticeState|null;exam:ExamSession|null;hist:HistEntry[];activity:Record<string,ActivityDay>;path:PathState;plan:PlanState}
interface Settings{reminderEnabled:boolean;reminderHour:number;reminderMinute:number;haptics:boolean}
type LessonKind='skill'|'test'
interface LessonResult{kind:LessonKind;id:string;results:Record<number,number>;total:number;questionXp:number}
interface I18nMessage{key:string;params?:Record<string,string|number>}
interface LessonOutcome{scorePct:number;passed:boolean;xp:number;message:I18nMessage|null;streak:number}
```
In the store, `path` and `plan` are never null. The web stores null or undefined before first use. Import turns a null `path` into a fresh one.

## lib/data.ts
```ts
QUESTIONS: Question[]; NOTES: Note[]; CURRICULUM: Unit[]; BY_N: Map<number,Question>
DOMAINS: Record<DomainKey,DomainInfo>   // examCount 13/17/15; weights '25–30%','35–40%','30–35%'
DOMAIN_KEYS: DomainKey[]; LEARN_BASE='https://learn.microsoft.com/en-us/'
imageSource(key:string): number|{uri:string}|null
```
Render images with `<Image source={imageSource(key)!}/>` from expo-image, and skip the image if it returns null. Question image keys are `'q/…'` and note image keys are `'notes/…'`. `http(s)` URLs come back as `{uri}`. Use `{LEARN_BASE}{unit.path}` for the Microsoft Learn link.

## lib/logic/util.ts
```ts
shuffle<T>(a:readonly T[]):T[]; pct(a:number,b:number):number
dayKey(d?:Date):string; parseDay(s:string):Date
```

## lib/logic/grading.ts
```ts
letters(s?:string|null):string[]; sameSet(a:readonly string[],b:readonly string[]):boolean; gradable(q:Question):boolean
ixEmpty(q):(string|null)[]; ixAnswered(q,sel?:Given|null):boolean
ixScore(q,sel?:Given|null):{got:number;total:number;ok:boolean}
scoreOf(q,given?:Given|null):{frac:number;ok:boolean}; givenText(q,given?:Given|null):string
needCount(q):number                                   // letters(q.answer).length||1
toggleSelection(sel:readonly string[],k:string,need:number):string[]
cleanText(q):string                                   // strips //IMG// and trailing "Hot Area" style labels (for ix questions)
splitImgText(text:string):string[]                    // text.split('//IMG//'); the UI inserts qimg[i] between parts, leftovers go after
```

## lib/logic/learn.ts
```ts
LESSON_SIZE=6; TEST_SIZE=10; PASS_PCT=80; MAX_LEVEL=3; DAILY_GOAL=50
emptyPath():PathState
skillQs(id:string):Question[]; unitQs(u:Unit):Question[]
lessonState(p:PathState,id:string):LessonState; unitPassed(p,u:Unit):boolean
unitUnlocked(p,ui:number):boolean; lessonUnlocked(p,ui:number,si:number):boolean; unitTestReady(p,ui:number):boolean
pickQuestions(pool:Question[],seen:readonly number[],size:number,ans:Record<number,AnswerRecord>):Question[]
currentLessonId(p):string|null                        // gets the START bubble
questionXp(frac:number,ok:boolean):number             // 10 correct, 5 partial, 0 wrong (first attempt only)
pathStreak(days:Record<string,number>,today?:string):number
applyLessonResult(path:PathState,r:LessonResult,today?:string):{path:PathState;outcome:LessonOutcome}  // pure
dailyGoalPct(todayXp:number):number
```
`outcome.message` is `{key:'lesson.unitComplete'}` or `{key:'lesson.levelReached',params:{level}}`, or null. `outcome.xp` includes the pass bonus (+10 for a lesson, +50 for a unit test).

## lib/logic/plan.ts
```ts
dayKey; parseDay; addDays(s:string,n:number):string; daysBetween(a:string,b:string):number
COVERAGE_TARGET=0.9; ACC_TARGET=80; MOCK_TARGET=800; MOCKS_NEEDED=3
type Status='ok'|'warn'|'bad'; type QualityStatus=Status|'na'; type CheckId='lessons'|'units'|'questions'|'mocks'; type QualityId='accuracy'|'mock'
interface PlanCheck{id:CheckId;actual;goal;by:string;expected;due;status:Status;done:boolean}
interface PlanQuality{id:QualityId;value:number|null;unit:'%'|'';goal:number;status:QualityStatus;hint:{key:string;params?:Record<string,string|number>}|null}
interface TodoItem{key:string;params:Record<string,number>;route:string}
interface PlanStatus{pl:PlanState;t:string;learnBy:string;coverBy:string;checks:PlanCheck[];quality:PlanQuality[];readiness:number;overall:Status;ready:boolean;todo:TodoItem[];todayAct:{answered:number;correct:number};todayGoal:number;domainAcc:{d:DomainKey;n:number;acc:number|null}[];daysToExam:number;daysToReady:number}
type PlanInput=Pick<ProgressData,'ans'|'hist'|'exams'|'activity'|'path'|'plan'>
planStatus(state:PlanInput,today?:string):PlanStatus
type PhaseId='learn'|'mocks'|'buffer'|'exam'; interface Phase{id:PhaseId;from:string;to:string;state:'past'|'now'|'future'}
planPhases(s:Pick<PlanStatus,'pl'|'learnBy'|'t'>):Phase[]
interface CalDay{day:string;answered:number;level:0|1|2|3;tag:''|'exam'|'ready'|'learn';today:boolean;future:boolean}
planCalendar(s:Pick<PlanStatus,'pl'|'learnBy'|'t'>,activity:ProgressData['activity']):CalDay[]
todayGoal(s:PlanStatus):number
```
- Todo items use `t(item.key, item.params)`. The todo routes are `/learn`, `/practice?status=unseen&order=random`, `/exam`, `/practice?status=wrong&order=random` and `/review`.
- Check labels are `t('plan.check.'+id)`. Quality labels are `t('plan.quality.'+id)`. A hint is `t(hint.key, hint.params)`.
- For `plan.hint.takeMocks`, the `date` param is a dayKey that the UI must format first.
- Status labels are `t('plan.status.'+status)`.
- Phase names and text are `plan.phase.<id>.name` and `plan.phase.<id>.text`.

## lib/logic/exam.ts
```ts
EXAM_MINUTES=45; PASS=700
newExam(now?:number):ExamSession; examTotal():number; gradableCount():number
examIsDone(ex,n):boolean; examAnsweredCount(ex):number; examSelection(ex,n):(string|null)[]
examTimeLeft(ex,now?):number; formatTimeLeft(ms):string          // 'm:ss'
scoreExam(ex,now?):{result:ExamResult;records:{n:number;ok:boolean}[]}
```

## lib/logic/practice.ts
```ts
DEFAULT_FILTER:PracticeFilter
filterQuestions(state:{ans;flags},f:PracticeFilter):Question[]
buildPractice(state:{ans;flags},f):PracticeState
sanitizePractice(p:PracticeState):PracticeState
filterFromParams(p:Record<string,string|string[]|undefined>):PracticeFilter|undefined   // undefined if none of domain/status/type/order is present
```

## lib/logic/notes.ts
```ts
interface Heading{level:number;text:string;id:string}
slug(s):string; headings(md):Heading[]                      // h1–h3
noteSection(doc:string,h:string):{title:string;md:string}|null
interface RelatedNote{note:string;noteTitle:string;h:Heading;score:number}
relatedNotes(q:Question):RelatedNote[]                      // max 3
interface NoteHit{noteId;noteTitle;headingId;headingText;line}
searchNotes(query:string,limit=200):{total:number;hits:NoteHit[]}
highlightParts(line:string,query:string):{text:string;match:boolean}[]
searchTerm(skillName:string):string                         // for official guide → notes?q=
```

## lib/store.ts
Persisted under `'az900.v1'` through AsyncStorage. Exports: `STORAGE_KEY`, `defaultPlan()`, `defaultSettings()`, `useStore`, `StoreState`, `Actions`.

**State:** `ProgressData & {settings:Settings; hydrated:boolean}`.
- The data keys are `ans, flags, exams, skills, practice, exam, hist, activity, path, plan`.
- The default plan is `{exam:'2026-11-17', ready:'2026-11-14', start: first-launch day}`.
- The default settings are `{reminderEnabled:false, reminderHour:19, reminderMinute:0, haptics:true}`.

**Actions** (read them with `useStore(s=>s.fn)` or `useStore.getState().fn`):
```ts
record(n:number,ok:boolean):void                   // ans + hist (cap 2000) + activity[local day]
toggleFlag(n:number):void
startPractice(f:PracticeFilter):void               // builds the list, shuffles if order=random, idx 0
startSingle(n:number):void                         // practice={f:default,list:[n],idx:0,single:true}
ensurePractice():void                              // prunes missing questions; rebuilds from the saved filter if the list is empty
setPracticeIdx(i:number):void
startExam():void                                   // 45 questions, 45 min
answerExam(n:number,sel:(string|null)[]):void
moveExam(i:number):void
toggleExamFlag(n:number):void
submitExam():number|null                           // scores, calls record per question, pushes the result, clears the session; returns the result index in exams
abandonExam():void
finishLesson(r:LessonResult):LessonOutcome         // updates path + xp; does NOT call record()
addXp(n:number):void
setUnlockAll(v:boolean):void
setSkillRating(skillName:string,v:SkillRating|null):void   // null clears; the UI passes null when the same level is tapped again
setPlan(p:Partial<PlanState>):void
setSettings(p:Partial<Settings>):void
importState(json:string|unknown):{ok:true}|{ok:false;error:string}  // accepts the web export JSON; replaces only the keys present, like web Object.assign
exportState():string                               // web-compatible JSON, data keys only (no settings)
resetAll():void                                    // wipes progress, keeps plan + settings
```

**Hooks and helpers:**
```ts
useHydrated():boolean; useSettings():Settings
useStreak():number; useTodayXp():number
usePlanStatus(today?:string):PlanStatus            // memoised on its inputs
getExamSession():ExamSession|null; questionRecord(n):AnswerRecord|undefined; hasQuestion(n):boolean
```

**Selector rule:** select individual slices, e.g. `useStore(s=>s.ans)`. Don't select a freshly built object or array without `useShallow`. The exam screen also needs a ticking `now` in local state, because the store does not re-render on a timer. Call `submitExam()` when `examTimeLeft(ex)===0`.

**Lesson flow:**
1. Pick questions with `pickQuestions(pool, lessonState(path,id).seen, LESSON_SIZE or TEST_SIZE, ans)`.
2. On the first attempt only, call `record(q.n,ok)`, set `results[q.n]=frac`, add `questionXp(frac,ok)` to the running XP, and queue wrong answers for one retry.
3. At the end, call `finishLesson({kind,id,results,total,questionXp})`.

## lib/haptics.ts
```ts
tap():void      // light impact
select():void   // selection tick
success():void  // correct answer, lesson passed
error():void    // wrong answer
```
All four respect `settings.haptics` and do nothing on web.

## lib/mascot.ts
```ts
type Mood='idle'|'happy'|'think'|'sad'|'celebrate'
type MascotContext=Mood|'correct'|'wrong'|'lessonStart'|'lessonDone'|'lessonRetry'|'streak'|'examDone'|'welcomeBack'
mascotLine(ctx:MascotContext,seed?:number):string      // seed gives a stable pick across re-renders
moodFor:Record<MascotContext,Mood>
```
The mascot name is `t('mascot.name')`, which is "Azzy".

## i18n keys (`lib/locales/en.json`)
Keys are listed with `{params}`. Plural keys have `_one` and `_other` variants and take `count`. Entries marked `[]` are arrays of lines, read through `mascotLine`.
```
common: ok cancel close done back next prev continue check retry reset delete save start resume yes no loading dash flag flagged unflag share import export of{a,b} question{n} correct wrong pass fail domain.{concepts,architecture,management,extra} openLink error percent{value} minutes_{one,other}{count}
tabs: learn plan practice exam more
more: title dashboard dashboardHint review reviewHint notes notesHint official officialHint settings settingsHint
learn: title streak_{one,other}{count} xp{count} todayGoal{xp,goal} unlockAll unitLabel{n,domain} unitProgress{done,total} nodeQuestions{count} start unitTest unitTestPassed unitTestJump jumpTitle jumpBody jumpConfirm levelOf{level,max} locked noQuestions
lesson: lessonLevel{level,max} unitTest testIntro{count,pct} testIntroPassed{count,pct} fromNotes noNotes learnPath startQuiz{count} startTest noQuestions markRead previousMistake examQuestion{n} nice notQuite percentRight{pct} correctAnswer{answer} explanation quitTitle quitBody quit keepGoing completeTitle testPassedTitle almostTitle score{pct} xpGained{xp} streak_{one,other}{count} levelReached{level} unitComplete needPct{pct} practiceAgain tryAgain continue
plan: title subtitle{exam,ready} subtitleDays_{one,other}{count} banner.{daysToExam_{one,other}{count},examDay,examDone,readiness{pct},today{done,goal}} status.{ok,warn,bad,na} examReady verdict.{ready,ok,behind} readinessScore daysUntilExam todayHeading questionsToday{done,goal} correctPct{pct} todo.{lessons{count},unitTest{count},newQuestions{count},mock,wrong,light} checksHeading check.{lessons,units,questions,mocks} quality.{accuracy,mock} hint.{answersNeeded{have,need},takeMocks{date},passMark} doneLabel behindBy{count} reachBy{n} allBy{date} goal{goal} byDomain answered{count} weakDrill phasesHeading phase.{learn,mocks,buffer,exam}.{name,text} activityHeading legend.{learn,ready,exam,questions} settingsHeading examDate readyBy startedOn
practice: title filters domain status type order jumpTo startSet allDomains all unseen wrong flagged mc visual seq random noMatch endOfSet backToDashboard newSet reveal position{idx,total} lastCorrect{ok,tries} lastWrong{ok,tries} selfGraded howDid gotRight gotWrong answerTitle correctTitle incorrectTitle partialTitle{got,total} continueSet startPractice
exam: title intro{count,minutes,pass} domainLine{label,count,weight} drawn{count} start resume questionOf{idx,total} mark marked submit submitTitle submitAll submitUnanswered_{one,other}{count} answeredCount{count} timeUp abandon abandonBody resultTitle resultSub{date,minutes} passTag failTag score{pass} correct answersHeading colQuestion colDomain colYours colCorrect seeQuestion newExam practiceMistakes historyHeading noHistory palette
review: title subtitle drillWrong{count} drillFlagged{count} wrongHeading{count} flaggedHeading{count} shakyHeading{count} emptyWrong emptyFlagged emptyShaky record{ok,tries}
dashboard: navTitle title subtitle{count,pass} attempted accuracy lastExam flagged startPractice continuePractice resumeExam mockExam retryMistakes byDomain examWeight{weight} covered{done,total} accuracyLabel{value} practiceUnseen notes examHistory colDate colScore colCorrect
notes: title searchPlaceholder searchTitle{q} matches_{one,other}{count} noMatches noNotes practiceDomain onThisPage relatedNotes docs
official: title heading subtitle{rated,total,strong} links studyGuide studyGuideHint certPage certHint practiceAssessment sandbox sandboxHint erz learnPath myNotes practiceQuestions notesLink level.{weak,ok,strong}
settings: title reminders reminderEnabled reminderTime reminderDenied reminderTitle reminderBody feedback haptics plan data export exportDone import importConfirmTitle importConfirmBody importOk importError reset resetTitle resetBody resetDone unlockAll about version{v}
question: ixLabel.{yesno,dropdown,match,multiselect} selectN{count} selectAll select showImage hideImage answerImage correctAnswer{answer} communityVote{votes} siteMismatch{site,comm} outdated{note} yourNotes comments{count} questionImage answerImageAlt number{n}
mascot: name idle[] happy[] think[] sad[] celebrate[] correct[] wrong[] lessonStart[] lessonDone[] lessonRetry[] streak[] examDone[] welcomeBack[]
```
- `common.domain.<key>` and `DOMAINS[d].label` carry the same English labels.
- Dates are not formatted by i18n. Format them with `toLocaleDateString` before passing them as params.

## Routes (`app/_layout.tsx`)
Stack screens: `(tabs)` (headerShown false), `lesson/[id]`, `question/[n]`, `dashboard`, `review`, `notes/index`, `notes/[doc]`, `official`, `settings`, `+not-found`.
- `lesson/[id]` is a fullScreenModal with `gestureEnabled: false` and no header. It has no title option.
- `question/[n]` is a modal with no header. The question screen renders its own chrome.
- `dashboard`, `review`, `notes/index`, `official` and `settings` are pushed screens with a native large-title header, and `headerTransparent` is false. The titles come from `t('dashboard.navTitle')`, `t('review.title')`, `t('notes.title')`, `t('official.title')` and `t('settings.title')`.
- `notes/[doc]` is a pushed screen with a small title. The screen sets its own title through `Stack.Screen options`.
- `unstable_settings.anchor` is `'(tabs)'`. `ErrorBoundary` is exported from expo-router.
- The layout keeps the splash up until the fonts and the store are ready, and wraps everything in GestureHandlerRootView, SafeAreaProvider and a navigation ThemeProvider.

Hrefs the app uses:
- `/learn` is the tab index and its route name is owned by the tabs agent. The other tab hrefs are `/plan`, `/practice`, `/exam` and `/more`.
- `/practice?domain=&status=&type=&order=` has all four params optional. Parse them with `filterFromParams(useLocalSearchParams())`.
- `/practice?n=<n>` is not defined. Use `router.push('/question/<n>')` for single questions instead.
- `/exam?result=<index>` shows an exam result. The index is the position in `exams`, i.e. what `submitExam()` returns.
- `/lesson/<skillId>?mode=skill` and `/lesson/<unitId>?mode=test`.
- `/question/<n>`.
- `/notes?q=<text>` opens search. `/notes/<docId>?h=<headingSlug>&q=<text>` opens a note. `docId` is one of `concepts`, `architecture`, `management` or `practice`.
- `/dashboard`, `/review`, `/official` and `/settings`.
## COMPONENT APIs (wave 1 — import from barrels)
### components/ui (import { Button, Card, ... } from "@/components/ui") — types.ts:
```ts
// Shared prop types for components/ui. Platform files (Foo.tsx / Foo.ios.tsx) must use these.
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { Domain } from '@/lib/theme';

export type Tone = 'primary' | 'ok' | 'bad' | 'warn' | 'neutral';
export type PillTone = 'neutral' | 'ok' | 'bad' | 'warn' | 'domain';

export interface SegmentedOption { value: string; label: string }
export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  label?: string;
  color?: string;
}

export interface SwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

export interface CardProps { children?: ReactNode; style?: StyleProp<ViewStyle> }
export interface GlassCardProps extends CardProps { tint?: string }

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface PillProps { label: string; tone?: PillTone; domain?: Domain; style?: StyleProp<ViewStyle> }

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: Tone;
  /** 0..1 target position */
  marker?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export interface StatTileProps { value: string | number; label: string; icon?: LucideIcon; tone?: Tone; style?: StyleProp<ViewStyle> }
export interface SectionHeaderProps { title: string; action?: { label: string; onPress: () => void }; style?: StyleProp<ViewStyle> }
export interface EmptyStateProps {
  icon?: LucideIcon; title: string; text?: string;
  action?: { label: string; onPress: () => void };
}
export interface ListRowProps {
  icon?: LucideIcon; title: string; subtitle?: string; right?: ReactNode;
  onPress?: () => void; chevron?: boolean; tone?: Tone; style?: StyleProp<ViewStyle>;
}
export interface SheetProps { visible: boolean; onClose: () => void; title?: string; children?: ReactNode }
export interface ScreenScrollProps { children?: ReactNode; contentStyle?: StyleProp<ViewStyle>; refreshControl?: React.ReactElement<any> }
```
### components/question (QuestionCard, Explanation, QuestionImages, Choices, Interactive)
```ts
16:export interface QuestionCardProps {
17-  q: Question;
18-  value: string[] | (string | null)[];
19-  onChange: (v: any) => void;
20-  revealed: boolean;
21-  mode?: 'practice' | 'exam' | 'lesson';
22-  compact?: boolean;
23-}
24-
25-function InlineBody({ q, size }: { q: Question; size: number }) {
26-  const { colors } = useTheme();
27-  const parts = splitImgText(q.text);
28-  const imgs = q.qimg.slice();
29-  const style = { color: colors.ink, fontFamily: fonts.medium, fontSize: size, lineHeight: size * 1.5 };
30-  const out: React.ReactNode[] = [];
31-  parts.forEach((p, i) => {
32-    const txt = p.trim();
33-    if (txt) out.push(<Text key={`t${i}`} style={style} selectable>{txt}</Text>);
34-    if (i < parts.length - 1) { const k = imgs.shift(); if (k) out.push(<QuestionImage key={`i${i}`} imgKey={k} />); }
35-  });
36-  imgs.forEach((k, i) => out.push(<QuestionImage key={`r${i}`} imgKey={k} />));
37-  return <View style={{ gap: 8 }}>{out}</View>;
38-}
39-
40-export function QuestionCard({ q, value, onChange, revealed, mode = 'practice', compact }: QuestionCardProps) {
41-  const { colors, radius, fontSize } = useTheme();
components/question/QuestionCard.tsx:40:export function QuestionCard({ q, value, onChange, revealed, mode = 'practice', compact }: QuestionCardProps) {
components/question/Choices.tsx:12:export function Choices({ q, value, onChange, revealed }: { q: Question; value: readonly string[]; onChange: (v: string[]) => void; revealed: boolean }) {
components/question/Explanation.tsx:36:export function Explanation({ q }: { q: Question }) {
components/question/Interactive.tsx:70:export function Interactive({ q, value, onChange, revealed }: { q: Question; value: Sel; onChange: (v: (string | null)[]) => void; revealed: boolean }) {
components/question/QuestionImages.tsx:41:export function QuestionImage({ imgKey, alt }: { imgKey: string; alt?: string }) {
components/question/QuestionImages.tsx:70:export function QuestionImages({ keys, alt }: { keys: readonly string[]; alt?: string }) {
```
### components/markdown
```ts
10:export interface MarkdownProps {
11-  md: string;
12-  highlight?: string;
13-  /** y is relative to the Markdown container; add the container's own offset in the screen */
14-  onHeadingLayout?: (id: string, y: number) => void;
15-  compact?: boolean;
16-}
17-
18-const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });
19-
20-function openLink(href: string) {
21-  if (/^https?:\/\//i.test(href)) WebBrowser.openBrowserAsync(href).catch(() => Linking.openURL(href).catch(() => {}));
22-  else if (/^(mailto:|tel:)/i.test(href)) Linking.openURL(href).catch(() => {});
```
### components/mascot (Nimbus) — import { Mascot, MascotTip, useMascotLine, mascotLine, moodFor } from "@/components/mascot"
```ts
Mascot props: { mood?: 'idle'|'happy'|'think'|'sad'|'celebrate'; size?: number (default 120); animated?: boolean; shadow?: boolean; style? }
export type MascotTipProps = {
  /** what's happening: a mood or a context like 'correct' | 'wrong' | 'lessonDone' (picks mood + line) */
  context?: MascotContext;
  /** override the mood derived from context */
  mood?: MascotMood;
  /** explicit text; falls back to a `mascot.<context>` line */
  text?: string;
  seed?: number;
  size?: number;
  /** bubble on the right of Nimbus (row) or below it (column) */
  layout?: 'row' | 'column';
  style?: StyleProp<ViewStyle>;
};

export function MascotTip({ context = 'idle', mood, text, seed, size = 72, layout = 'row', style }: MascotTipProps) {
5:export type MascotContext = Mood | 'correct' | 'wrong' | 'lessonStart' | 'lessonDone' | 'lessonRetry' | 'streak' | 'examDone' | 'welcomeBack';
```
### lib/widget.ts, lib/notifications.ts, lib/useBackgroundSync.ts (already wired in app/_layout.tsx)
```ts
6:export type WidgetState = PlanInput;
8:export function widgetProps(state: WidgetState) {
21:export function syncWidget(state: WidgetState): void {
19:export type ReminderState = PlanInput & { settings: Settings };
21:export async function ensurePermission(): Promise<boolean> {
33:export async function cancelAll(): Promise<void> {
43:export async function scheduleDailyReminder(state: ReminderState): Promise<void> {
15:export function useBackgroundSync(): void {
```
