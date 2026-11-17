import { Pressable, Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import type { SectionHeaderProps } from './types';

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 }, style]}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.primary }}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
