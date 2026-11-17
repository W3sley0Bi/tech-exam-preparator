import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Flame, Lightbulb, X } from 'lucide-react-native';

import { Button, Pill, ProgressBar, Sheet } from '@/components/ui';
import { Explanation, QuestionCard } from '@/components/question';
import { CardView } from '@/components/lesson/CardView';
import { LessonView } from '@/components/lesson/LessonView';
import { cardFor } from '@/lib/cards';
import { lessonFor, sectionForQ } from '@/lib/lessons';
import { Markdown } from '@/components/markdown';
import { Mascot, MascotTip } from '@/components/mascot';
import { CURRICULUM, LEARN_BASE } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { ixAnswered, ixEmpty, letters, scoreOf } from '@/lib/logic/grading';
import {
  LESSON_SIZE, MAX_LEVEL, PASS_PCT, TEST_SIZE, lessonState, pickQuestions, questionXp, skillQs, unitPassed, unitQs,
} from '@/lib/logic/learn';
import { noteSection } from '@/lib/logic/notes';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import type { LessonOutcome, Question, Unit } from '@/lib/types';

type Step = 'learn' | 'quiz' | 'finish';
type Summary = { outcome: LessonOutcome; passed: boolean; scorePct: number; total: number };

function confirmQuit(t: (k: string) => string, onQuit: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(`${t('lesson.quitTitle')}\n${t('lesson.quitBody')}`)) onQuit();
    return;
  }
  Alert.alert(t('lesson.quitTitle'), t('lesson.quitBody'), [
    { text: t('lesson.keepGoing'), style: 'cancel' },
    { text: t('lesson.quit'), style: 'destructive', onPress: onQuit },
  ]);
}

function CountUp({ to, style }: { to: number; style: object }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (to <= 0) { setV(0); return; }
    const start = Date.now();
    const dur = 900;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to]);
  return <Text style={style}>{`+${v} XP`}</Text>;
}

function Ask({ q, isRetry, onChecked, onNext, skillId }: {
  q: Question; isRetry: boolean; skillId?: string; onChecked: (frac: number, ok: boolean) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, space, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [ixSel, setIxSel] = useState<(string | null)[]>(() => (q.ix ? ixEmpty(q) : []));
  const [checked, setChecked] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [cardSheet, setCardSheet] = useState(false);
  const sid = skillId ?? q.skill;
  const section = sid ? sectionForQ(sid, q.n) : undefined;
  const card = !section && sid ? cardFor(sid) : undefined;
  const hasReview = !!(section || card);
  const need = letters(q.answer).length || 1;
  const given = q.ix ? ixSel : selected;
  const ready = q.ix ? ixAnswered(q, ixSel) : selected.length >= need;
  const sc = useMemo(() => (checked ? scoreOf(q, given) : null), [checked, q, given]);

  const check = () => {
    if (!ready || checked) return;
    const r = scoreOf(q, given);
    setChecked(true);
    if (r.ok) haptics.success(); else haptics.error();
    onChecked(r.frac, r.ok);
  };

  const onChange = (v: any) => { if (q.ix) setIxSel(v); else setSelected(v); };
  const partial = !!sc && !sc.ok && q.ix && sc.frac > 0;
  const head = sc ? (sc.ok ? `✓ ${t('lesson.nice')}` : partial ? t('lesson.percentRight', { pct: Math.round(sc.frac * 100) }) : `✗ ${t('lesson.notQuite')}`) : '';
  const tint = sc ? (sc.ok ? colors.ok : colors.danger) : colors.line;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl, gap: space.md }}
      >
        {isRetry ? <Pill label={t('lesson.previousMistake')} tone="bad" /> : null}
        <QuestionCard q={q} mode="lesson" value={given as any} onChange={onChange} revealed={checked} />
      </ScrollView>
      <View
        style={{
          backgroundColor: sc ? (sc.ok ? colors.okBg : colors.dangerBg) : colors.card,
          borderTopWidth: 1, borderTopColor: tint, padding: space.lg, paddingBottom: Math.max(insets.bottom, space.lg), gap: space.sm,
        }}
      >
        {sc ? (
          <Animated.View entering={FadeInDown.duration(200)} style={{ gap: space.sm }}>
            <MascotTip context={sc.ok ? 'correct' : 'wrong'} seed={q.n} size={44} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.heavy, fontSize: fontSize.lg, color: sc.ok ? colors.ok : colors.danger }}>{head}</Text>
                {!sc.ok && q.mc ? (
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.ink }}>{t('lesson.correctAnswer', { answer: q.answer })}</Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button" accessibilityLabel={t('lesson.explanation')} hitSlop={8}
                onPress={() => { haptics.tap(); setSheet(true); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 8 }}
              >
                <Lightbulb size={18} color={colors.primary} />
                <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.primary }}>{t('lesson.explanation')}</Text>
              </Pressable>
            </View>
            {!sc.ok && hasReview ? (
              <Button title={t('lesson.reviewCard')} variant="secondary" icon={BookOpen} fullWidth onPress={() => { haptics.tap(); setCardSheet(true); }} />
            ) : null}
            <Button title={t('lesson.continue')} variant={sc.ok ? 'success' : 'danger'} size="lg" fullWidth onPress={onNext} />
          </Animated.View>
        ) : (
          <Button title={t('common.check')} size="lg" fullWidth disabled={!ready} onPress={check} />
        )}
      </View>
      <Sheet visible={sheet} onClose={() => setSheet(false)} title={t('lesson.explanation')}>
        <Explanation q={q} />
      </Sheet>
      {hasReview ? (
        <Sheet visible={cardSheet} onClose={() => setCardSheet(false)} title={t('lesson.reviewCard')}>
          {section ? <LessonView sections={[section]} /> : <CardView card={card!} />}
        </Sheet>
      ) : null}
    </View>
  );
}

export default function LessonScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, radius, space, fontSize } = useTheme();
  const insets = useSafeAreaInsets();

  const isTest = mode === 'test';
  const found = useMemo(() => {
    let skill: { id: string; name: string; notes?: { doc: string; h: string }[] } | null = null;
    let unit: Unit | undefined = isTest ? CURRICULUM.find(u => u.id === id) : undefined;
    if (!isTest) for (const u of CURRICULUM) for (const s of u.skills) if (s.id === id) { skill = s; unit = u; }
    return unit ? { unit, skill } : null;
  }, [id, isTest]);

  const [step, setStep] = useState<Step>('learn');
  const [notesOpen, setNotesOpen] = useState(false);
  const [run, setRun] = useState(0);
  const [cur, setCur] = useState<{ q: Question; isRetry: boolean; key: number } | null>(null);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);

  const queue = useRef<Question[]>([]);
  const retry = useRef<Question[]>([]);
  const results = useRef<Record<number, number>>({});
  const xp = useRef(0);
  const finished = useRef(false);

  const pool = useMemo(() => {
    if (!found) return [] as Question[];
    return isTest ? unitQs(found.unit) : skillQs(found.skill!.id);
  }, [found, isTest]);

  // number of questions a run would have (preview for the learn card); recomputed on restart
  const preview = useMemo(() => Math.min(pool.length, isTest ? TEST_SIZE : LESSON_SIZE), [pool, isTest]);
  const level = useStore(s => (found?.skill ? lessonState(s.path, found.skill.id).level : 0));
  const unitDone = useStore(s => (found ? unitPassed(s.path, found.unit) : false));

  const sections = useMemo(
    () => (found?.skill?.notes ?? []).map(r => noteSection(r.doc, r.h)).filter((s): s is { title: string; md: string } => !!s),
    [found],
  );

  const skillCard = found?.skill ? cardFor(found.skill.id) : undefined;
  const skillLesson = found?.skill ? lessonFor(found.skill.id) : undefined;

  const close = useCallback(() => router.back(), [router]);
  const onClose = () => {
    if (step === 'quiz') confirmQuit(t, close); else close();
  };

  const finish = () => {
    if (finished.current || !found) return;
    finished.current = true;
    const vals = Object.values(results.current);
    const n = total;
    const scorePct = n ? Math.round((vals.reduce((a, b) => a + b, 0) / n) * 100) : 100;
    const outcome = useStore.getState().finishLesson({
      kind: isTest ? 'test' : 'skill',
      id: isTest ? found.unit.id : found.skill!.id,
      results: results.current,
      total: n,
      questionXp: xp.current,
    });
    if (outcome.passed) haptics.success();
    setSummary({ outcome, passed: outcome.passed, scorePct: outcome.scorePct ?? scorePct, total: n });
    setStep('finish');
  };

  const advance = () => {
    if (queue.current.length) setCur(c => ({ q: queue.current.shift()!, isRetry: false, key: (c?.key ?? 0) + 1 }));
    else if (retry.current.length) setCur(c => ({ q: retry.current.shift()!, isRetry: true, key: (c?.key ?? 0) + 1 }));
    else finish();
  };

  const start = () => {
    if (!found) return;
    const st = useStore.getState();
    const seen = found.skill ? lessonState(st.path, found.skill.id).seen : [];
    const picked = pickQuestions(pool, seen, isTest ? TEST_SIZE : LESSON_SIZE, st.ans);
    queue.current = picked.slice();
    retry.current = [];
    results.current = {};
    xp.current = 0;
    finished.current = false;
    setTotal(picked.length);
    setDone(0);
    setSummary(null);
    if (!picked.length) {
      // reading-only lesson: completes immediately
      finished.current = true;
      const outcome = st.finishLesson({ kind: isTest ? 'test' : 'skill', id: isTest ? found.unit.id : found.skill!.id, results: {}, total: 0, questionXp: 0 });
      haptics.success();
      setSummary({ outcome, passed: outcome.passed, scorePct: outcome.scorePct ?? 100, total: 0 });
      setStep('finish');
      return;
    }
    setCur({ q: queue.current.shift()!, isRetry: false, key: 0 });
    setStep('quiz');
  };

  const onChecked = (q: Question, isRetry: boolean) => (frac: number, ok: boolean) => {
    if (isRetry) return;
    results.current[q.n] = frac;
    useStore.getState().record(q.n, ok);
    xp.current += questionXp(frac, ok);
    if (!ok) retry.current.push(q);
    setDone(Object.keys(results.current).length);
  };

  const restart = () => {
    setRun(r => r + 1);
    setCur(null);
    setSummary(null);
    setStep('learn');
  };

  if (!found) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg }}>
        <Mascot mood="sad" size={120} />
        <Button title={t('common.back')} onPress={close} />
      </View>
    );
  }

  const title = isTest ? found.unit.title : found.skill!.name;
  const url = found.unit.path ? `${LEARN_BASE}${found.unit.path}` : null;
  const progress = step === 'finish' ? 1 : total ? done / total : 0;
  const heading = { fontFamily: fonts.heavy, color: colors.ink } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: Platform.OS === 'web' ? space.md : insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 }}
        >
          <X size={26} color={colors.grey} strokeWidth={2.5} />
        </Pressable>
        <ProgressBar value={progress} tone="ok" height={12} style={{ flex: 1 }} />
        <Text numberOfLines={1} style={{ maxWidth: 120, fontFamily: fonts.semibold, fontSize: fontSize.xs, color: colors.grey }}>{title}</Text>
      </View>

      {step === 'learn' && (
        <Animated.View key={`learn-${run}`} entering={FadeIn.duration(250)} exiting={SlideOutLeft.duration(200)} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}>
            <MascotTip context="lessonStart" seed={run} size={72} />
            <View style={{ gap: space.xs }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.grey }}>
                {isTest ? t('lesson.unitTest') : t('lesson.lessonLevel', { level, max: MAX_LEVEL })}
              </Text>
              <Text accessibilityRole="header" style={{ ...heading, fontSize: fontSize.xxl }}>{title}</Text>
            </View>
            {isTest ? (
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: 22, color: colors.ink }}>
                {t(unitDone ? 'lesson.testIntroPassed' : 'lesson.testIntro', { count: preview, pct: PASS_PCT })}
              </Text>
            ) : null}
            {!isTest && skillLesson ? <LessonView sections={skillLesson.sections} /> : !isTest && skillCard ? <CardView card={skillCard} /> : null}
            {isTest ? null : sections.length ? (
              <View style={{ gap: space.sm }}>
                <Pressable
                  accessibilityRole="button" accessibilityState={{ expanded: notesOpen }}
                  onPress={() => { haptics.tap(); setNotesOpen(o => !o); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
                >
                  <BookOpen size={16} color={colors.grey} />
                  <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.grey }}>{skillCard || skillLesson ? t('lesson.yourNotes') : t('lesson.fromNotes')}</Text>
                  {notesOpen ? <ChevronUp size={18} color={colors.grey} /> : <ChevronDown size={18} color={colors.grey} />}
                </Pressable>
                {notesOpen ? sections.map((s, i) => (
                  <View key={i} style={{ backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: space.md }}>
                    <Markdown md={s.md} compact />
                  </View>
                )) : null}
              </View>
            ) : skillCard || skillLesson ? null : (
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.grey }}>{t('lesson.noNotes')}</Text>
            )}
            {url ? (
              <Pressable
                accessibilityRole="link" onPress={() => { haptics.tap(); WebBrowser.openBrowserAsync(url).catch(() => {}); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
              >
                <ExternalLink size={16} color={colors.primary} />
                <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.primary }}>{t('lesson.learnPath')}</Text>
              </Pressable>
            ) : null}
            {!preview && !isTest ? (
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{t('lesson.noQuestions')}</Text>
            ) : null}
            <Button
              size="lg" fullWidth onPress={start}
              title={!preview ? t('lesson.markRead') : isTest ? t('lesson.startTest') : t('lesson.startQuiz', { count: preview })}
            />
          </ScrollView>
        </Animated.View>
      )}

      {step === 'quiz' && cur && (
        <Animated.View key={`q-${run}-${cur.key}`} entering={SlideInRight.duration(250)} style={{ flex: 1 }}>
          <Ask q={cur.q} skillId={found.skill?.id} isRetry={cur.isRetry} onChecked={onChecked(cur.q, cur.isRetry)} onNext={advance} />
        </Animated.View>
      )}

      {step === 'finish' && summary && (
        <Animated.View key="finish" entering={SlideInRight.duration(280)} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, alignItems: 'center', paddingBottom: space.xxl }}>
            <Mascot mood={summary.passed ? 'celebrate' : 'sad'} size={170} />
            <Text accessibilityRole="header" style={{ ...heading, fontSize: fontSize.xxl, textAlign: 'center' }}>
              {summary.passed ? (isTest ? t('lesson.testPassedTitle') : t('lesson.completeTitle')) : t('lesson.almostTitle')}
            </Text>
            {summary.total > 0 ? (
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.xl, color: summary.passed ? colors.ok : colors.warn }}>
                {t('lesson.score', { pct: summary.scorePct })}
              </Text>
            ) : null}
            <CountUp to={summary.outcome.xp} style={{ fontFamily: fonts.heavy, fontSize: fontSize.hero, color: colors.gold }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flame size={20} color={colors.warn} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>
                {t('lesson.streak', { count: summary.outcome.streak })}
              </Text>
            </View>
            {summary.outcome.message ? (
              <Animated.View entering={FadeInDown.delay(400)} style={{ backgroundColor: colors.okBg, borderRadius: radius.lg, paddingVertical: space.md, paddingHorizontal: space.lg }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ok, textAlign: 'center' }}>
                  {t(summary.outcome.message.key, summary.outcome.message.params)}
                </Text>
              </Animated.View>
            ) : null}
            {!summary.passed ? (
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey, textAlign: 'center' }}>{t('lesson.needPct', { pct: PASS_PCT })}</Text>
            ) : null}
            <View style={{ alignSelf: 'stretch', gap: space.md, marginTop: space.md }}>
              <Button title={t('lesson.continue')} size="lg" fullWidth onPress={close} />
              {summary.total > 0 ? (
                <Button title={summary.passed ? t('lesson.practiceAgain') : t('lesson.tryAgain')} variant="secondary" size="lg" fullWidth onPress={restart} />
              ) : null}
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
