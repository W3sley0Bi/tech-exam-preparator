import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ListChecks } from 'lucide-react-native';
import { Card, GlassCard, ListRow, Pill, ProgressBar, ProgressRing, ScreenScroll, SectionHeader } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import type { MascotMood } from '@/components/mascot';
import { ActivityCalendar } from '@/components/plan/ActivityCalendar';
import { CheckRow } from '@/components/plan/CheckRow';
import { DateField } from '@/components/plan/DateField';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import { usePlanStatus, useStore } from '@/lib/store';
import { planCalendar, planPhases } from '@/lib/logic/plan';
import { parseDay, pct } from '@/lib/logic/util';
import { mascotLine } from '@/lib/mascot';
import * as haptics from '@/lib/haptics';

const fmtDay = (d: string) => parseDay(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function PlanScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const s = usePlanStatus();
  const activity = useStore(st => st.activity);
  const setPlan = useStore(st => st.setPlan);
  const pl = s.pl;

  const tone = s.ready ? 'ok' : s.overall;
  const toneColor = tone === 'ok' ? colors.ok : tone === 'warn' ? colors.warn : colors.danger;
  const verdict = s.ready ? t('plan.examReady') : t(`plan.status.${s.overall}`);
  const verdictSub = s.ready ? t('plan.verdict.ready') : s.overall === 'ok' ? t('plan.verdict.ok') : t('plan.verdict.behind');
  const mood: MascotMood = s.ready ? 'celebrate' : s.overall === 'ok' ? 'happy' : s.overall === 'warn' ? 'think' : 'sad';
  const tip = mascotLine(mood, s.readiness);
  const body = { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey } as const;
  const h = (children: string) => <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{children}</Text>;

  const cal = planCalendar(s, activity);
  const phases = planPhases(s);
  const domainLabel = (d: string) => t(`common.domain.${d}`);
  const dateRange = (a: string, b: string) => (a === b ? fmtDay(a) : `${fmtDay(a)} – ${fmtDay(b)}`);

  return (
    <ScreenScroll>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: fontSize.hero - 6, color: colors.ink }}>{t('tabs.plan')}</Text>

      <Animated.View entering={FadeInDown.duration(350)}>
        <GlassCard style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Mascot mood={mood} size={84} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.xl, color: toneColor }}>{verdict}</Text>
              <Text style={body}>{verdictSub}</Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.ink }}>{tip}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <ProgressRing value={s.readiness / 100} size={84} label={`${s.readiness}%`} color={toneColor} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{t('plan.readinessScore')}</Text>
              <Text style={body}>{t('plan.daysUntilExam')}</Text>
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.hero, color: colors.ink }}>{Math.max(0, s.daysToExam)}</Text>
          </View>
        </GlassCard>
      </Animated.View>

      <SectionHeader title={t('plan.todayHeading')} />
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{t('plan.questionsToday', { done: s.todayAct.answered, goal: s.todayGoal })}</Text>
          {s.todayAct.answered ? <Text style={body}>{t('plan.correctPct', { pct: pct(s.todayAct.correct, s.todayAct.answered) })}</Text> : null}
        </View>
        <ProgressBar tone="ok" value={Math.min(s.todayAct.answered, s.todayGoal) / (s.todayGoal || 1)} />
        {s.todo.map(item => (
          <ListRow key={item.key + item.route} icon={ListChecks} title={t(item.key, item.params)}
            onPress={() => { haptics.tap(); router.push(item.route as never); }} />
        ))}
      </Card>

      <SectionHeader title={t('plan.checksHeading')} />
      <Card style={{ gap: 16 }}>
        {s.checks.map(c => (
          <CheckRow key={c.id} label={t(`plan.check.${c.id}`)} status={c.done ? 'ok' : c.status} right={`${c.actual} / ${c.goal}`}
            value={c.actual} goal={c.goal} marker={c.expected}
            hint={c.done ? t('plan.doneLabel') : `${t(`plan.status.${c.status}`)}${c.due > c.actual ? ` ${t('plan.behindBy', { count: c.due - c.actual })}` : ''} — ${c.expected > c.actual ? `${t('plan.reachBy', { n: c.expected })} ` : ''}${t('plan.allBy', { date: fmtDay(c.by) })}`} />
        ))}
        {s.quality.map(q => {
          const max = q.unit === '%' ? 100 : 1000;
          const hint = q.hint ? t(q.hint.key, q.hint.key === 'plan.hint.takeMocks' && q.hint.params ? { ...q.hint.params, date: fmtDay(String(q.hint.params.date)) } : q.hint.params) : t(`plan.status.${q.status}`);
          return (
            <CheckRow key={q.id} label={t(`plan.quality.${q.id}`)} status={q.status}
              right={`${q.value === null ? t('common.dash') : q.value + q.unit} (${t('plan.goal', { goal: q.goal + q.unit })})`}
              value={q.value === null ? undefined : q.value} goal={max} marker={q.goal} hint={hint} />
          );
        })}
        <View style={{ gap: 10 }}>
          {h(t('plan.byDomain'))}
          {s.domainAcc.map(x => (
            <View key={x.d} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Pill tone="domain" domain={x.d} label={domainLabel(x.d)} />
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ink }}>{x.acc === null ? t('common.dash') : `${x.acc}%`}</Text>
              <Text style={body}>{t('plan.answered', { count: x.n })}</Text>
              {x.acc !== null && x.acc < 75 && x.n >= 10 ? (
                <Text accessibilityRole="link" onPress={() => router.push(`/practice?domain=${x.d}&status=wrong` as never)}
                  style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.danger, paddingVertical: 8 }}>{t('plan.weakDrill')}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title={t('plan.phasesHeading')} />
      <Card style={{ gap: 4 }}>
        {phases.map(ph => {
          const now = ph.state === 'now';
          return (
            <View key={ph.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 8, opacity: ph.state === 'past' ? 0.55 : 1 }}>
              <View style={{ width: 14, height: 14, marginTop: 3, borderRadius: 7, backgroundColor: ph.state === 'past' ? colors.ok : now ? colors.primary : 'transparent', borderWidth: ph.state === 'future' ? 2 : 0, borderColor: colors.line }} />
              <View style={[{ flex: 1, gap: 2 }, now && { backgroundColor: colors.primaryBg, borderRadius: 10, padding: 10, marginTop: -6 }]}>
                <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: now ? colors.primary : colors.ink }}>{t(`plan.phase.${ph.id}.name`)}</Text>
                <Text style={body}>{dateRange(ph.from, ph.to)}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.ink }}>{t(`plan.phase.${ph.id}.text`)}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <SectionHeader title={t('plan.activityHeading')} />
      <Card><ActivityCalendar days={cal} /></Card>

      <SectionHeader title={t('plan.settingsHeading')} />
      <Card>
        <DateField label={t('plan.examDate')} value={pl.exam} onChange={v => setPlan({ exam: v })} />
        <DateField label={t('plan.readyBy')} value={pl.ready} onChange={v => setPlan({ ready: v })} />
        <DateField label={t('plan.startedOn')} value={pl.start} onChange={v => setPlan({ start: v })} />
      </Card>
    </ScreenScroll>
  );
}
