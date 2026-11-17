import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays, GraduationCap, ListChecks, MoreHorizontal, Timer } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';
import { useTheme } from '@/lib/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grey,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 60 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.learn'), tabBarIcon: ({ color }) => <GraduationCap size={22} color={color} /> }} />
      <Tabs.Screen name="plan" options={{ title: t('tabs.plan'), tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }} />
      <Tabs.Screen name="practice" options={{ title: t('tabs.practice'), tabBarIcon: ({ color }) => <ListChecks size={22} color={color} /> }} />
      <Tabs.Screen name="exam" options={{ title: t('tabs.exam'), tabBarIcon: ({ color }) => <Timer size={22} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more'), tabBarIcon: ({ color }) => <MoreHorizontal size={22} color={color} /> }} />
    </Tabs>
  );
}
