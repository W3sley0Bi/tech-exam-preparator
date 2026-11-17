import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { fontSize, useTheme } from '@/lib/theme';
import type { ButtonProps } from './types';

const EDGE = 4;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ title, onPress, variant = 'primary', size = 'md', icon: Icon, disabled, fullWidth, style }: ButtonProps) {
  const { colors, radius } = useTheme();
  const p = useSharedValue(0);
  const faces = {
    primary: { face: colors.primary, edge: colors.primaryDeep, fg: colors.onPrimary },
    secondary: { face: colors.card, edge: colors.line, fg: colors.ink },
    ghost: { face: 'transparent', edge: 'transparent', fg: colors.primary },
    danger: { face: colors.danger, edge: '#8e1c1c', fg: colors.onPrimary },
    success: { face: colors.ok, edge: '#116028', fg: colors.onPrimary },
  }[variant];
  const chunky = variant !== 'ghost';
  const anim = useAnimatedStyle(() => ({
    borderBottomWidth: chunky ? EDGE - p.value * EDGE : 0,
    transform: [{ translateY: chunky ? p.value * EDGE : 0 }],
  }));
  const fg = disabled ? colors.grey : faces.fg;
  return (
    <AnimatedPressable
      accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => { p.value = withTiming(1, { duration: 70 }); }}
      onPressOut={() => { p.value = withTiming(0, { duration: 110 }); }}
      onPress={() => { haptics.tap(); onPress?.(); }}
      style={[
        {
          backgroundColor: disabled ? colors.card2 : faces.face, borderColor: disabled ? colors.line : faces.edge,
          borderRadius: radius.lg, paddingHorizontal: size === 'lg' ? 24 : 18, paddingVertical: size === 'lg' ? 15 : 11,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: fullWidth ? 'stretch' : 'flex-start',
          marginBottom: chunky ? 0 : EDGE,
        },
        anim, style,
      ]}
    >
      {Icon ? <Icon size={size === 'lg' ? 22 : 18} color={fg} strokeWidth={2.5} /> : null}
      <Text style={{ fontFamily: fonts.bold, fontSize: size === 'lg' ? fontSize.lg : fontSize.md, color: fg }}>{title}</Text>
    </AnimatedPressable>
  );
}
