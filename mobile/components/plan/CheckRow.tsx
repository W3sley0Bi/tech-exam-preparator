import { Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';

export type CheckTone = 'ok' | 'warn' | 'bad' | 'na';

export function CheckRow({ label, status, right, value, goal, marker, hint }: {
  label: string; status: CheckTone; right: string; value?: number; goal?: number; marker?: number; hint?: string;
}) {
  const { colors } = useTheme();
  const c = status === 'ok' ? colors.ok : status === 'warn' ? colors.warn : status === 'bad' ? colors.danger : colors.grey;
  const g = goal || 1;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
        <Text style={{ flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.ink }}>{label}</Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{right}</Text>
      </View>
      {value != null ? (
        <ProgressBar value={Math.min(value, g) / g} tone={status === 'na' ? 'neutral' : status} marker={marker != null ? Math.min(marker, g) / g : undefined} />
      ) : null}
      {hint ? <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey }}>{hint}</Text> : null}
    </View>
  );
}
