import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '@/lib/fonts';
import { useTheme } from '@/lib/theme';
import type { ProgressRingProps } from './types';

export function ProgressRing({ value, size = 72, label, color }: ProgressRingProps) {
  const { colors } = useTheme();
  const v = Math.max(0, Math.min(1, value));
  const stroke = Math.max(5, size / 9);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const text = label ?? `${Math.round(v * 100)}%`;
  return (
    <View
      accessible accessibilityRole="progressbar" accessibilityLabel={text}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.card2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={color ?? colors.primary} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - v)}
        />
      </Svg>
      <Text style={{ fontFamily: fonts.bold, fontSize: size / 4.2, color: colors.ink }}>{text}</Text>
    </View>
  );
}
