import { Pressable, Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { fontSize, useTheme } from '@/lib/theme';
import type { SegmentedProps } from './types';

export function Segmented({ options, value, onChange, style }: SegmentedProps) {
  const { colors, radius } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[{ flexDirection: 'row', backgroundColor: colors.card2, borderRadius: radius.md, padding: 2 }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => { if (!on) { haptics.select(); onChange(o.value); } }}
            style={{ flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: radius.md - 2, backgroundColor: on ? colors.card : 'transparent' }}
          >
            <Text numberOfLines={1} style={{ fontFamily: on ? fonts.semibold : fonts.medium, fontSize: fontSize.sm, color: on ? colors.ink : colors.grey }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
