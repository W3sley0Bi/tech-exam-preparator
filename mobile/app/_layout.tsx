import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../lib/i18n';
import { fontAssets, fonts } from '../lib/fonts';
import { useHydrated } from '../lib/store';
import { palette, useApplyAppearance, useTheme } from '../lib/theme';
import { useBackgroundSync } from '../lib/useBackgroundSync';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrated = useHydrated();
  // never block on slow font delivery (web dev server); system font until Inter arrives
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => { const id = setTimeout(() => setFontTimeout(true), 2500); return () => clearTimeout(id); }, []);
  const ready = (fontsLoaded || !!fontError || fontTimeout) && hydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { scheme, colors } = useTheme();
  const { t } = useTranslation();
  useBackgroundSync(); // widget snapshot + daily reminders follow the store (after hydration)
  useApplyAppearance();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    dark: scheme === 'dark',
    colors: { ...base.colors, primary: colors.primary, background: colors.paper, card: colors.card, text: colors.ink, border: colors.line, notification: colors.danger },
  };
  const page = {
    headerShown: true,
    headerLargeTitle: true,
    headerTransparent: false,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: palette[scheme].paper },
    headerLargeStyle: { backgroundColor: palette[scheme].paper },
    headerTintColor: colors.primary,
    headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
    headerLargeTitleStyle: { fontFamily: fonts.heavy, color: colors.ink },
    headerBackButtonDisplayMode: 'minimal',
  } as const;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.paper } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="lesson/[id]" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="question/[n]" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="dashboard" options={{ ...page, title: t('dashboard.navTitle') }} />
            <Stack.Screen name="review" options={{ ...page, title: t('review.title') }} />
            <Stack.Screen name="notes/index" options={{ ...page, title: t('notes.title') }} />
            <Stack.Screen name="notes/[doc]" options={{ ...page, headerLargeTitle: false, title: '' }} />
            <Stack.Screen name="official" options={{ ...page, title: t('official.title') }} />
            <Stack.Screen name="settings" options={{ ...page, title: t('settings.title') }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
