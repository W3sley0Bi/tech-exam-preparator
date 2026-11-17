import { createElement } from 'react';
import { Platform, Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';

export interface DateFieldProps { label: string; value: string; onChange: (day: string) => void }

// Web / Android fallback: native <input type=date> on web, plain text otherwise.
export function DateField({ label, value, onChange }: DateFieldProps) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, gap: 12 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{label}</Text>
      {Platform.OS === 'web'
        ? createElement('input', {
            type: 'date', value, 'aria-label': label,
            onChange: (e: { target: { value: string } }) => { if (e.target.value) onChange(e.target.value); },
            style: { fontFamily: 'inherit', fontSize: 15, padding: '8px 10px', borderRadius: radius.md, border: `1px solid ${colors.line}`, background: colors.card2, color: colors.ink },
          })
        : <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.grey }}>{value}</Text>}
    </View>
  );
}
