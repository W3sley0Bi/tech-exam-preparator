import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/theme';
import type { CardProps } from './types';

export function Card({ children, style }: CardProps) {
  const { colors, radius, space, scheme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg,
          borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line,
        },
        scheme === 'light' && Platform.OS !== 'android' && {
          shadowColor: '#1b2430', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
