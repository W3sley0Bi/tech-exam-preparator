import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, Eye, Flag, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button, Pill, ScreenScroll } from '@/components/ui';
import { QuestionCard } from '@/components/question';
import { Mascot } from '@/components/mascot';
import { gradable, ixAnswered, ixEmpty, ixScore, letters, needCount, sameSet } from '@/lib/logic/grading';
import { useStore } from '@/lib/store';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { Question } from '@/lib/types';

export interface QuestionRunnerProps {
  q: Question;
  /** shown in the head row, e.g. "3 / 40" */
  position?: string;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  /** called by Next, and after a self-grade / after checking when this is the last question */
  onNext?: () => void;
  /** enable horizontal swipe for prev/next */
  swipe?: boolean;
  /** called after a self-grade button; defaults to onNext */
  onSelfGraded?: () => void;
  /** extra content rendered above the question (inside the scroll) */
  top?: React.ReactNode;
  /** extra content under the question (e.g. end-of-set card) */
  bottom?: React.ReactNode;
  /** extra space under the footer (floating tab bar) */
  bottomPad?: number;
  /** adds a trailing close control in the head row */
  onClose?: () => void;
}

export function QuestionRunner({ q, position, hasPrev, hasNext, onPrev, onNext, swipe, onSelfGraded, top, bottom, bottomPad = 0, onClose }: QuestionRunnerProps) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const prev = useStore(s => s.ans[q.n]);
  const flagged = useStore(s => !!s.flags[q.n]);
  const need = needCount(q);
  const [mc, setMc] = useState<string[]>([]);
  const [ix, setIx] = useState<(string | null)[]>(() => (q.ix ? ixEmpty(q) : []));
  const [checked, setChecked] = useState(false);
  const auto = gradable(q);
  const ready = q.ix ? ixAnswered(q, ix) : mc.length >= need;

  const result = useMemo(() => {
    if (!checked || !auto) return null;
    if (q.ix) { const s = ixScore(q, ix); return { ok: s.ok, got: s.got, total: s.total }; }
    return { ok: sameSet(mc, letters(q.answer)), got: 0, total: 0 };
  }, [checked, auto, q, ix, mc]);

  const check = () => {
    if (checked || !ready) return;
    const ok = q.ix ? ixScore(q, ix).ok : sameSet(mc, letters(q.answer));
    setChecked(true);
    if (ok) haptics.success(); else haptics.error();
    useStore.getState().record(q.n, ok);
  };
  const reveal = () => { haptics.tap(); setChecked(true); };
  const selfGrade = (ok: boolean) => {
    if (ok) haptics.success(); else haptics.error();
    useStore.getState().record(q.n, ok);
    (onSelfGraded ?? onNext)?.();
  };

  const pan = Gesture.Pan().runOnJS(true).enabled(!!swipe).activeOffsetX([-30, 30]).failOffsetY([-18, 18]).onEnd(e => {
    if (e.translationX < -70 && hasNext) { haptics.select(); onNext?.(); }
    else if (e.translationX > 70 && hasPrev) { haptics.select(); onPrev?.(); }
  });

  const tone = result ? (result.ok ? 'ok' : 'bad') : 'neutral';
  const bannerBg = tone === 'ok' ? colors.okBg : tone === 'bad' ? colors.dangerBg : colors.card;
  const bannerFg = tone === 'ok' ? colors.ok : tone === 'bad' ? colors.danger : colors.ink;
  const bannerTitle = !auto ? t('practice.answerTitle')
    : result?.ok ? t('practice.correctTitle')
      : q.ix ? t('practice.partialTitle', { got: result?.got ?? 0, total: result?.total ?? 0 })
        : t('practice.incorrectTitle');

  const body = (
    <ScreenScroll contentStyle={{ paddingBottom: 24 }}>
      {top}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{t('common.question', { n: q.n })}</Text>
        <Pill label={t(`common.domain.${q.domain}`)} tone="domain" domain={q.domain} />
        {!auto && <Pill label={t('practice.selfGraded')} />}
        {prev && (
          <Pill
            label={prev.ok ? t('practice.lastCorrect', { ok: prev.okCount, tries: prev.tries }) : t('practice.lastWrong', { ok: prev.okCount, tries: prev.tries })}
            tone={prev.ok ? 'ok' : 'bad'}
          />
        )}
        <View style={{ flex: 1 }} />
        {position ? <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{position}</Text> : null}
        <Pressable
          accessibilityRole="button" accessibilityLabel={flagged ? t('common.unflag') : t('common.flag')} accessibilityState={{ selected: flagged }}
          onPress={() => { haptics.tap(); useStore.getState().toggleFlag(q.n); }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Flag size={22} color={flagged ? colors.warn : colors.grey} fill={flagged ? colors.warn : 'transparent'} />
        </Pressable>
        {onClose && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} color={colors.grey} />
          </Pressable>
        )}
      </View>

      {checked && (
        <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: bannerBg, borderRadius: radius.lg, padding: 14 }}>
          {auto ? <Mascot size={44} mood={result?.ok ? 'happy' : 'sad'} animated={false} shadow={false} /> : null}
          {auto && (result?.ok ? <Check size={22} color={bannerFg} strokeWidth={3} /> : <X size={22} color={bannerFg} strokeWidth={3} />)}
          <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: fontSize.lg, color: bannerFg }}>{bannerTitle}</Text>
        </Animated.View>
      )}

      <QuestionCard
        q={q} mode="practice" revealed={checked}
        value={q.ix ? ix : mc}
        onChange={(v: any) => { if (checked) return; haptics.select(); if (q.ix) setIx(v); else setMc(v); }}
      />

      {!auto && checked && (
        <Animated.View entering={FadeIn} style={{ gap: 10 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{t('practice.howDid')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title={t('practice.gotRight')} variant="success" icon={Check} onPress={() => selfGrade(true)} style={{ flex: 1 }} />
            <Button title={t('practice.gotWrong')} variant="danger" icon={X} onPress={() => selfGrade(false)} style={{ flex: 1 }} />
          </View>
        </Animated.View>
      )}
      {bottom}
    </ScreenScroll>
  );

  const hasNav = !!(onPrev || onNext);
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <GestureDetector gesture={pan}><View style={{ flex: 1 }}>{body}</View></GestureDetector>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, paddingBottom: 12 + (onClose ? insets.bottom : bottomPad), borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper }}>
        {hasNav && <Button title={t('common.prev')} variant="secondary" icon={ChevronLeft} disabled={!hasPrev} onPress={onPrev} />}
        <View style={{ flex: 1 }}>
          {auto
            ? <Button title={t('common.check')} fullWidth disabled={checked || !ready} onPress={check} />
            : <Button title={t('practice.reveal')} icon={Eye} fullWidth disabled={checked} onPress={reveal} />}
        </View>
        {hasNav && <Button title={t('common.next')} variant="secondary" icon={ChevronRight} disabled={!onNext || (!hasNext && !checked)} onPress={onNext} />}
      </View>
    </View>
  );
}
