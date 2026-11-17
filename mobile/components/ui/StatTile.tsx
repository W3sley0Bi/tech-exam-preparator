import { Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import { Card } from './Card';
import { toneColors } from './tone';
import type { StatTileProps } from './types';

export function StatTile({ value, label, icon: Icon, tone = 'primary', style }: StatTileProps) {
  const { colors } = useTheme();
  const { fg } = toneColors(colors, tone);
  return (
    <Card style={[{ flex: 1, gap: 4, padding: 14 }, style]}>
      <View accessible accessibilityLabel={`${label}: ${value}`} style={{ gap: 4 }}>
        {Icon ? <Icon size={20} color={fg} strokeWidth={2.4} /> : null}
        <Text style={{ fontFamily: fonts.heavy, fontSize: fontSize.xl, color: tone === 'primary' ? colors.ink : fg }}>{value}</Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.grey }}>{label}</Text>
      </View>
    </Card>
  );
}
