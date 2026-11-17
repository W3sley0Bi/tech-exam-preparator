import { Platform } from 'react-native';
import type { Colors } from '@/lib/theme';
import type { Tone } from './types';

export function toneColors(c: Colors, tone: Tone = 'primary'): { fg: string; bg: string } {
  switch (tone) {
    case 'ok': return { fg: c.ok, bg: c.okBg };
    case 'bad': return { fg: c.danger, bg: c.dangerBg };
    case 'warn': return { fg: c.warn, bg: c.warnBg };
    case 'neutral': return { fg: c.grey, bg: c.card2 };
    default: return { fg: c.primary, bg: c.primaryBg };
  }
}

/** Liquid Glass needs iOS 26+. */
export const supportsGlass = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;
