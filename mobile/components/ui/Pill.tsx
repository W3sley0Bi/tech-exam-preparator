import { Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import { domainColors, fontSize, radius, useTheme } from '@/lib/theme';
import { toneColors } from './tone';
import type { PillProps } from './types';

export function Pill({ label, tone = 'neutral', domain, style }: PillProps) {
  const { colors, scheme } = useTheme();
  let fg: string; let bg: string;
  if (tone === 'domain' && domain) {
    const d = domainColors[domain];
    fg = d.fg; bg = scheme === 'dark' ? d.bgDark : d.bgLight;
  } else ({ fg, bg } = toneColors(colors, tone === 'domain' ? 'neutral' : tone));
  return (
    <View style={[{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }, style]}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.xs, color: fg }}>{label}</Text>
    </View>
  );
}
