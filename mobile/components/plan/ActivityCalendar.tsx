import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CalDay } from '@/lib/logic/plan';
import { parseDay } from '@/lib/logic/util';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';

const CELL = 34;

export function ActivityCalendar({ days }: { days: CalDay[] }) {
  const { colors, radius, scheme } = useTheme();
  const { t } = useTranslation();
  const shade = (l: number) => {
    if (l === 0) return colors.card2;
    const a = l === 1 ? 0.25 : l === 2 ? 0.55 : 0.95;
    return scheme === 'dark' ? `rgba(76,194,106,${a})` : `rgba(26,127,55,${a})`;
  };
  const tagColor = (tag: CalDay['tag']) => tag === 'exam' ? colors.danger : tag === 'ready' ? colors.gold : tag === 'learn' ? colors.primary : null;
  const Swatch = ({ bg, border }: { bg?: string; border?: string }) => (
    <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: bg ?? 'transparent', borderWidth: border ? 2 : 0, borderColor: border }} />
  );
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {days.map(d => {
          const tc = tagColor(d.tag);
          return (
            <View
              key={d.day} accessible accessibilityLabel={`${parseDay(d.day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.answered} ${t('plan.legend.questions')}`}
              style={{
                width: CELL, height: CELL, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
                backgroundColor: shade(d.level), opacity: d.future ? 0.55 : 1,
                borderWidth: d.today ? 2 : tc ? 2 : 0, borderColor: d.today ? colors.ink : tc ?? 'transparent',
              }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.xs, color: d.level >= 2 ? '#fff' : colors.ink }}>{parseDay(d.day).getDate()}</Text>
              {tc && !d.today ? <View style={{ position: 'absolute', bottom: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: tc }} /> : null}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        {[[0, '0'], [1, '1–19'], [2, '20–44'], [3, '45+']].map(([l, txt]) => (
          <View key={String(l)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Swatch bg={shade(l as number)} /><Text style={{ fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.grey }}>{txt}</Text>
          </View>
        ))}
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.grey }}>{t('plan.legend.questions')}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        {([['learn', colors.primary], ['ready', colors.gold], ['exam', colors.danger]] as const).map(([k, c]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Swatch border={c} /><Text style={{ fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.grey }}>{t(`plan.legend.${k}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
