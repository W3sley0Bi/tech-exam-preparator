import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Database, Flag, Target, Trophy, CheckCircle2, ChevronRight, Play, Timer, RotateCcw, Settings as SettingsIcon } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Card, GlassCard, Pill, ProgressBar, ScreenScroll, SectionHeader, StatTile } from '@/components/ui';
import { DOMAINS, DOMAIN_KEYS, QUESTIONS } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { PASS } from '@/lib/logic/exam';
import { pct } from '@/lib/logic/util';
import { usePlanStatus, useStore } from '@/lib/store';
import { fontSize, useTheme } from '@/lib/theme';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, space } = useTheme();
  const ans = useStore((s) => s.ans);
  const flags = useStore((s) => s.flags);
  const exams = useStore((s) => s.exams);
  const practice = useStore((s) => s.practice);
  const exam = useStore((s) => s.exam);
  const ps = usePlanStatus();

  const go = (href: string) => { haptics.tap(); router.push(href as Href); };
  const total = QUESTIONS.length;
  const seen = QUESTIONS.filter((q) => ans[q.n]);
  const right = seen.filter((q) => ans[q.n].ok).length;
  const flagged = Object.keys(flags).length;
  const lastExam = exams[exams.length - 1];
  const dash = t('common.dash');

  const bannerText = ps.daysToExam < 0 ? t('plan.banner.examDone')
    : ps.daysToExam === 0 ? t('plan.banner.examDay')
    : t('plan.banner.daysToExam', { count: ps.daysToExam });

  const fmtDate = (at: number) => new Date(at).toLocaleDateString();
  const muted = { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey } as const;

  return (
    <ScreenScroll>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Pressable accessibilityRole="button" onPress={() => go('/plan')}>
          <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{bannerText}</Text>
              <Text style={muted}>
                {t('plan.banner.readiness', { pct: Math.round(ps.readiness) })} · {t('plan.banner.today', { done: ps.todayAct.answered, goal: ps.todayGoal })}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.grey} />
          </GlassCard>
        </Pressable>
      </Animated.View>

      <View>
        <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.ink }}>{t('dashboard.title')}</Text>
        <Text style={[muted, { marginTop: 4 }]}>{t('dashboard.subtitle', { count: total, pass: PASS })}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatTile value={`${seen.length}/${total}`} label={t('dashboard.attempted')} icon={Database} />
        <StatTile value={seen.length ? `${pct(right, seen.length)}%` : dash} label={t('dashboard.accuracy')} icon={Target} tone="ok" />
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <StatTile
            value={lastExam ? lastExam.score : dash}
            label={t('dashboard.lastExam')}
            icon={Trophy}
            tone={lastExam ? (lastExam.score >= PASS ? 'ok' : 'bad') : 'neutral'}
            style={{ flex: undefined }}
          />
          {lastExam ? (
            <Pill label={t(lastExam.score >= PASS ? 'common.pass' : 'common.fail')} tone={lastExam.score >= PASS ? 'ok' : 'bad'} style={{ position: 'absolute', top: 12, right: 12 }} />
          ) : null}
        </View>
        <StatTile value={flagged} label={t('dashboard.flagged')} icon={Flag} tone="warn" />
      </View>

      <View style={{ gap: space.sm }}>
        <Button title={practice ? t('dashboard.continuePractice') : t('dashboard.startPractice')} icon={Play} size="lg" fullWidth onPress={() => go('/practice')} />
        <Button title={exam ? t('dashboard.resumeExam') : t('dashboard.mockExam')} icon={Timer} variant="secondary" fullWidth onPress={() => go('/exam')} />
        <Button title={t('dashboard.retryMistakes')} icon={RotateCcw} variant="secondary" fullWidth onPress={() => go('/practice?status=wrong')} />
      </View>

      <SectionHeader title={t('dashboard.byDomain')} />
      {DOMAIN_KEYS.map((d) => {
        const qs = QUESTIONS.filter((q) => q.domain === d);
        const s = qs.filter((q) => ans[q.n]);
        const ok = s.filter((q) => ans[q.n].ok).length;
        return (
          <Card key={d} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pill label={DOMAINS[d].label} tone="domain" domain={d} />
              <Text style={muted}>{t('dashboard.examWeight', { weight: DOMAINS[d].weight })}</Text>
            </View>
            <Text style={[muted, { marginTop: 6 }]}>{t('dashboard.covered', { done: s.length, total: qs.length })}</Text>
            <ProgressBar value={qs.length ? s.length / qs.length : 0} />
            <Text style={muted}>{t('dashboard.accuracyLabel', { value: s.length ? `${pct(ok, s.length)}%` : dash })}</Text>
            <ProgressBar value={s.length ? ok / s.length : 0} tone="ok" />
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: 8 }}>
              <Button title={t('dashboard.practiceUnseen')} variant="secondary" style={{ flex: 1 }} onPress={() => go(`/practice?domain=${d}&status=unseen`)} />
              <Button title={t('dashboard.notes')} variant="ghost" style={{ flex: 1 }} onPress={() => go(`/notes/${d}`)} />
            </View>
          </Card>
        );
      })}

      {exams.length ? (
        <>
          <SectionHeader title={t('dashboard.examHistory')} />
          <Card style={{ paddingVertical: space.sm }}>
            {exams.map((e, i) => ({ e, i })).reverse().map(({ e, i }, k) => (
              <Pressable
                key={e.at}
                accessibilityRole="button"
                onPress={() => go(`/exam?result=${i}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, minHeight: 48,
                  borderTopWidth: k ? 1 : 0, borderTopColor: colors.line, opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{fmtDate(e.at)}</Text>
                  <Text style={muted}>{t('dashboard.colCorrect')} {e.correct}/{e.total}</Text>
                </View>
                <Text style={{ fontFamily: fonts.heavy, fontSize: fontSize.lg, color: colors.ink }}>{e.score}</Text>
                <Pill label={t(e.score >= PASS ? 'common.pass' : 'common.fail')} tone={e.score >= PASS ? 'ok' : 'bad'} />
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('settings.data')} />
      <Button title={`${t('settings.export')} / ${t('settings.import')}`} icon={SettingsIcon} variant="secondary" fullWidth onPress={() => go('/settings')} />
    </ScreenScroll>
  );
}
