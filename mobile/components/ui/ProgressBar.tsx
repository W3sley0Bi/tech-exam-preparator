import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { toneColors } from './tone';
import type { ProgressBarProps } from './types';

export function ProgressBar({ value, tone = 'primary', marker, height = 8, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(1, value));
  const w = useSharedValue(v);
  useEffect(() => { w.value = withTiming(v, { duration: 450 }); }, [v, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View
      accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={[{ height, borderRadius: height / 2, backgroundColor: colors.card2, justifyContent: 'center' }, style]}
    >
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: toneColors(colors, tone).fg }, fill]} />
      {marker != null ? (
        <View style={{ position: 'absolute', left: `${Math.max(0, Math.min(1, marker)) * 100}%`, top: -3, bottom: -3, width: 2, backgroundColor: colors.ink, opacity: 0.6, borderRadius: 1 }} />
      ) : null}
    </View>
  );
}
