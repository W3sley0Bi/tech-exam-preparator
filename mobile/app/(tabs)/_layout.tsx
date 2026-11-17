import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/theme';
import { usePlanStatus } from '@/lib/store';

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const plan = usePlanStatus();
  const planBad = plan.overall === 'bad';

  return (
    <NativeTabs tintColor={colors.primary} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.learn')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="graduationcap.fill" md="school" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Label>{t('tabs.plan')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        {planBad ? <NativeTabs.Trigger.Badge>!</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice">
        <NativeTabs.Trigger.Label>{t('tabs.practice')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checklist" md="checklist" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exam">
        <NativeTabs.Trigger.Label>{t('tabs.exam')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="timer" md="timer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>{t('tabs.more')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="ellipsis.circle" md="more_horiz" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
