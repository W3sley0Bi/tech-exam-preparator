// Design tokens ported from web/style.css (light + dark). Use via useTheme(); never hard-code colors in screens.
import { useEffect } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { useStore } from './store';

export const palette = {
  light: {
    paper: '#f5f7fa', card: '#ffffff', card2: '#eef2f7', ink: '#1b2430', grey: '#5d6b7c', line: '#d9e0e8',
    primary: '#0a66c2', primaryDeep: '#084f96', primaryBg: '#e3effb',
    ok: '#1a7f37', okBg: '#e4f4e8', danger: '#c62828', dangerBg: '#fbe7e7', warn: '#9a6700', warnBg: '#fff4d6',
    gold: '#e5a50a', onPrimary: '#ffffff',
  },
  dark: {
    paper: '#0f141a', card: '#171e26', card2: '#1f2832', ink: '#e6ebf1', grey: '#93a1b2', line: '#2c3744',
    primary: '#4ea1f3', primaryDeep: '#2f86de', primaryBg: '#15314d',
    ok: '#4cc26a', okBg: '#13301c', danger: '#f07272', dangerBg: '#3a1717', warn: '#e0b04a', warnBg: '#362a10',
    gold: '#e5a50a', onPrimary: '#ffffff',
  },
} as const;

// Exam domain + unit accent colors (same as the web app's pills and unit banners)
export const domainColors = {
  concepts: { fg: '#6b4fd8', bgLight: '#e8e1fb', bgDark: '#2a2147' },
  architecture: { fg: '#0a66c2', bgLight: '#e3effb', bgDark: '#15314d' },
  management: { fg: '#c98a0c', bgLight: '#fff4d6', bgDark: '#362a10' },
  extra: { fg: '#5d6b7c', bgLight: '#eef2f7', bgDark: '#1f2832' },
} as const;

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28, hero: 40 } as const;

export type Colors = { [K in keyof typeof palette.light]: string };
export type Domain = keyof typeof domainColors;

/** user's appearance setting (dark by default; 'system' follows the OS) */
export function useScheme(): 'dark' | 'light' {
  const appearance = useStore(s => s.settings.appearance) ?? 'dark';
  const os = useColorScheme() === 'light' ? 'light' : 'dark';
  return appearance === 'system' ? os : appearance;
}

/** call once at the root: forces native UI (SwiftUI hosts, tab bar, alerts, keyboard, status bar) to match */
export function useApplyAppearance() {
  const appearance = useStore(s => s.settings.appearance) ?? 'dark';
  useEffect(() => {
    if (Platform.OS === 'web' || typeof Appearance.setColorScheme !== 'function') return;
    Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
  }, [appearance]);
}

export function useTheme() {
  const scheme = useScheme();
  const colors: Colors = palette[scheme];
  return { scheme, colors, radius, space, fontSize, domainColors } as const;
}
