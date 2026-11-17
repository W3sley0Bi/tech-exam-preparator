import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { BookOpen, ClipboardList, LayoutDashboard, NotebookText, Settings } from 'lucide-react-native';
import { GlassCard, ListRow, ScreenScroll, Card } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import { usePlanStatus, useStore, useStreak } from '@/lib/store';
import { tap } from '@/lib/haptics';

function Stat({ value, label }: { value: string | number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: fontSize.xl, color: colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.grey, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const streak = useStreak();
  const xp = useStore((s) => s.path.xp);
  const ans = useStore((s) => s.ans);
  const flags = useStore((s) => s.flags);
  const plan = usePlanStatus();

  const reviewCount = useMemo(() => {
    const set = new Set<number>(Object.keys(flags).map(Number));
    for (const k of Object.keys(ans)) if (!ans[Number(k)].ok) set.add(Number(k));
    return set.size;
  }, [ans, flags]);

  const go = (href: string) => () => { tap(); router.push(href as never); };

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: t('more.title'), headerLargeTitle: true, headerTransparent: false }} />
      <GlassCard style={{ gap: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Mascot mood="idle" size={96} />
          <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink, marginTop: 4 }}>{t('mascot.name')}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Stat value={streak} label={t('learn.streak', { count: streak })} />
          <Stat value={xp} label={t('learn.xp', { count: xp })} />
          <Stat value={Math.max(plan.daysToExam, 0)} label={t('plan.daysUntilExam')} />
        </View>
      </GlassCard>

      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon={LayoutDashboard} title={t('more.dashboard')} subtitle={t('more.dashboardHint')} onPress={go('/dashboard')} />
        <ListRow icon={ClipboardList} tone="warn" title={t('more.review')} subtitle={`${t('more.reviewHint')} · ${reviewCount}`} onPress={go('/review')} />
        <ListRow icon={NotebookText} title={t('more.notes')} subtitle={t('more.notesHint')} onPress={go('/notes')} />
        <ListRow icon={BookOpen} tone="ok" title={t('more.official')} subtitle={t('more.officialHint')} onPress={go('/official')} />
        <ListRow icon={Settings} tone="neutral" title={t('more.settings')} subtitle={t('more.settingsHint')} onPress={go('/settings')} />
      </Card>

      <View style={{ alignItems: 'center', gap: 2, marginTop: 8 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.grey }}>
          {t('settings.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.grey }}>Made for AZ-900 · questions from Examprepper</Text>
      </View>
    </ScreenScroll>
  );
}
