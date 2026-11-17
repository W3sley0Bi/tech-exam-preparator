import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import { toneColors } from './tone';
import type { ListRowProps } from './types';

export function ListRow({ icon: Icon, title, subtitle, right, onPress, chevron, tone = 'primary', style }: ListRowProps) {
  const { colors, radius } = useTheme();
  const { fg, bg } = toneColors(colors, tone);
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      disabled={!onPress} onPress={onPress}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: pressed ? 0.6 : 1 }, style]}
    >
      {Icon ? (
        <View style={{ width: 34, height: 34, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={fg} strokeWidth={2.3} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{title}</Text>
        {subtitle ? <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey, marginTop: 1 }}>{subtitle}</Text> : null}
      </View>
      {right}
      {chevron ?? !!onPress ? <ChevronRight size={18} color={colors.grey} /> : null}
    </Pressable>
  );
}
