import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTabPad } from '@/lib/useTabPad';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Flag, Grid3x3 } from 'lucide-react-native';
import { Button, Pill, ProgressBar, Sheet } from '@/components/ui';
import { QuestionCard } from '@/components/question';
import { BY_N } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { examAnsweredCount, examSelection, examTimeLeft, formatTimeLeft } from '@/lib/logic/exam';
import { useStore } from '@/lib/store';
import { fontSize, useTheme } from '@/lib/theme';
import type { ExamSession } from '@/lib/types';
import { Palette } from './Palette';
import { confirmAction } from './confirm';

export function ExamRunner({ ex }: { ex: ExamSession }) {
  const { t } = useTranslation();
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const tabPad = useTabPad();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const scroller = useRef<any>(null);
  const submitted = useRef(false);

  const doSubmit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    const i = useStore.getState().submitExam();
    if (i != null) router.replace(`/exam?result=${i}` as never);
    else submitted.current = false;
  }, [router]);

  // wall-clock ticking; re-sync when the app returns to the foreground
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') tick(); });
    return () => { clearInterval(id); sub.remove(); };
  }, []);

  const left = examTimeLeft(ex, now);
  useEffect(() => { if (left === 0) doSubmit(); }, [left, doSubmit]);

  const n = ex.list[ex.idx];
  const q = BY_N.get(n);
  useEffect(() => { scroller.current?.scrollTo({ y: 0, animated: false }); }, [ex.idx]);
  if (!q) return null;

  const total = ex.list.length;
  const answered = examAnsweredCount(ex);
  const low = left < 5 * 60000;
  const flagged = !!ex.flags[n];
  const go = (i: number) => useStore.getState().moveExam(Math.max(0, Math.min(total - 1, i)));

  const submit = () => {
    const un = total - answered;
    confirmAction(
      t('exam.submitTitle'), un ? t('exam.submitUnanswered', { count: un }) : t('exam.submitAll'),
      t('exam.submit'), t('common.cancel'), doSubmit,
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{t('exam.questionOf', { idx: ex.idx + 1, total })}</Text>
          <Text accessibilityLabel={formatTimeLeft(left)} style={{ fontFamily: fonts.heavy, fontSize: fontSize.xl, color: low ? colors.danger : colors.ink, fontVariant: ['tabular-nums'] }}>{formatTimeLeft(left)}</Text>
        </View>
        <ProgressBar value={answered / total} tone={low ? 'bad' : 'primary'} height={6} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{t('exam.answeredCount', { count: answered })}</Text>
          <Pill label={t(`common.domain.${q.domain}`)} tone="domain" domain={q.domain} />
        </View>
      </View>

      <ScrollView ref={scroller} contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xl, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <Button
          title={flagged ? t('exam.marked') : t('exam.mark')} icon={Flag} variant={flagged ? 'primary' : 'secondary'}
          onPress={() => useStore.getState().toggleExamFlag(n)}
        />
        <QuestionCard
          key={n} q={q} mode="exam" revealed={false}
          value={examSelection(ex, n)}
          onChange={(v: (string | null)[]) => useStore.getState().answerExam(n, v)}
        />
      </ScrollView>

      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: (Platform.OS === 'ios' ? tabPad : insets.bottom) + space.md, gap: space.md, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line }}>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Button title={t('common.prev')} icon={ChevronLeft} variant="secondary" disabled={ex.idx === 0} onPress={() => go(ex.idx - 1)} style={{ flex: 1 }} />
          <Button title={t('exam.palette')} icon={Grid3x3} variant="secondary" onPress={() => setPaletteOpen(true)} style={{ flex: 1 }} />
          <Button title={t('common.next')} icon={ChevronRight} disabled={ex.idx >= total - 1} onPress={() => go(ex.idx + 1)} style={{ flex: 1 }} />
        </View>
        <Button title={t('exam.submit')} variant="success" fullWidth onPress={submit} />
      </View>

      <Sheet visible={paletteOpen} onClose={() => setPaletteOpen(false)} title={t('exam.palette')}>
        <Palette ex={ex} onJump={i => { go(i); haptics.tap(); setPaletteOpen(false); }} />
      </Sheet>
    </View>
  );
}
