import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/theme';
import type { GlassCardProps } from './types';

// Web / Android fallback: semi-transparent themed card.
export function GlassCard({ children, style, tint }: GlassCardProps) {
  const { colors, radius, space, scheme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tint ?? (scheme === 'dark' ? 'rgba(23,30,38,0.72)' : 'rgba(255,255,255,0.72)'),
          borderRadius: radius.xl, padding: space.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
