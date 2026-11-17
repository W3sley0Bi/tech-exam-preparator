import { StyleSheet, View } from 'react-native';
import { Host, RoundedRectangle } from '@expo/ui/swift-ui';
import { glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/lib/theme';
import { supportsGlass } from './tone';
import { GlassCard as Fallback } from './GlassCard';
import type { GlassCardProps } from './types';

export function GlassCard({ children, style, tint }: GlassCardProps) {
  const { radius, space } = useTheme();
  if (!supportsGlass) return <Fallback style={style} tint={tint}>{children}</Fallback>;
  return (
    <View style={[{ borderRadius: radius.xl, padding: space.lg }, style]}>
      <Host style={StyleSheet.absoluteFill} pointerEvents="none">
        <RoundedRectangle
          cornerRadius={radius.xl}
          modifiers={[glassEffect({ glass: { variant: 'regular', tint }, shape: 'roundedRectangle', cornerRadius: radius.xl })]}
        />
      </Host>
      {children}
    </View>
  );
}
