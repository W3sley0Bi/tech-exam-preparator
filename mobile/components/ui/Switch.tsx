import { Switch as RNSwitch, Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { fontSize, useTheme } from '@/lib/theme';
import type { SwitchProps } from './types';

export function Switch({ label, value, onChange, style }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, style]}>
      <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.ink }}>{label}</Text>
      <RNSwitch
        accessibilityLabel={label} value={value}
        onValueChange={(v) => { haptics.tap(); onChange(v); }}
        trackColor={{ true: colors.primary, false: colors.line }}
      />
    </View>
  );
}
