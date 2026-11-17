import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTabPad } from '@/lib/useTabPad';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal, SearchX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, EmptyState, Pill, ProgressBar } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { FilterSheet } from '@/components/practice/FilterSheet';
import { QuestionRunner } from '@/components/practice/QuestionRunner';
import { BY_N } from '@/lib/data';
import { DEFAULT_FILTER, filterFromParams } from '@/lib/logic/practice';
import { useHydrated, useStore } from '@/lib/store';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { fontSize, useTheme } from '@/lib/theme';

export default function PracticeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabPad = useTabPad();
  const params = useLocalSearchParams();
  const hydrated = useHydrated();
  const practice = useStore(s => s.practice);
  const [sheet, setSheet] = useState(false);
  const [done, setDone] = useState(false);

  const paramFilter = filterFromParams(params as Record<string, string | string[] | undefined>);
  const paramKey = paramFilter ? JSON.stringify(paramFilter) : '';
  useEffect(() => {
    if (!hydrated) return;
    const st = useStore.getState();
    if (paramFilter) { st.startPractice(paramFilter); setDone(false); router.setParams({ domain: undefined, status: undefined, type: undefined, order: undefined } as never); }
    else st.ensurePractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, paramKey]);

  const f = practice?.f ?? DEFAULT_FILTER;
  const list = practice?.list ?? [];
  const idx = Math.max(0, Math.min(practice?.idx ?? 0, list.length - 1));
  const q = list.length ? BY_N.get(list[idx]) : undefined;

  const go = useCallback((i: number) => { setDone(false); useStore.getState().setPracticeIdx(i); }, []);
  const next = useCallback(() => { if (idx < list.length - 1) go(idx + 1); else setDone(true); }, [idx, list.length, go]);
  const start = (nf: typeof f) => { useStore.getState().startPractice(nf); setDone(false); };
  const jump = (n: number) => {
    const i = list.indexOf(n);
    if (i >= 0) go(i); else if (BY_N.has(n)) router.push(`/question/${n}` as never);
  };

  const pills = useMemo(() => {
    const out: { label: string; tone?: 'domain'; domain?: 'concepts' | 'architecture' | 'management' }[] = [];
    out.push(f.domain === 'all' ? { label: t('practice.allDomains') } : { label: t(`common.domain.${f.domain}`), tone: 'domain', domain: f.domain });
    if (f.status !== 'all') out.push({ label: t(`practice.${f.status}`) });
    if (f.type !== 'all') out.push({ label: t(`practice.${f.type}`) });
    if (f.order !== 'seq') out.push({ label: t('practice.random') });
    return out;
  }, [f, t]);

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, gap: 10, backgroundColor: colors.paper }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: fontSize.hero - 6, color: colors.ink }}>{t('practice.title')}</Text>
        <Pressable
          accessibilityRole="button" accessibilityLabel={t('practice.filters')} onPress={() => { haptics.tap(); setSheet(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12 }}
        >
          <SlidersHorizontal size={20} color={colors.primary} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.primary }}>{t('practice.filters')}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {pills.map((p, i) => <Pill key={i} label={p.label} tone={p.tone} domain={p.domain} />)}
      </View>
      {list.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{t('practice.position', { idx: idx + 1, total: list.length })}</Text>
          <ProgressBar value={(idx + 1) / list.length} />
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      {header}
      {!hydrated || !practice ? null : !q ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}><Mascot mood="celebrate" size={120} /></View>
          <EmptyState icon={SearchX} title={t('practice.noMatch')} action={{ label: t('practice.newSet'), onPress: () => setSheet(true) }} />
        </View>
      ) : (
        <QuestionRunner
          key={q.n} q={q} swipe bottomPad={tabPad}
          hasPrev={idx > 0} hasNext={idx < list.length - 1}
          onPrev={() => go(idx - 1)} onNext={next}
          bottom={done ? (
            <Card style={{ alignItems: 'center', gap: 10, padding: 20 }}>
              <Mascot mood="celebrate" size={96} />
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink, textAlign: 'center' }}>{t('practice.endOfSet')}</Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button title={t('practice.newSet')} onPress={() => setSheet(true)} />
                <Button title={t('practice.backToDashboard')} variant="secondary" onPress={() => router.push('/dashboard' as never)} />
              </View>
            </Card>
          ) : null}
        />
      )}
      <FilterSheet visible={sheet} onClose={() => setSheet(false)} filter={f} onStart={start} onJump={jump} />
    </View>
  );
}
