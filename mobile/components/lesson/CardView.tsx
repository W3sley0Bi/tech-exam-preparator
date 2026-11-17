import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lightbulb, Target } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';
import { useTheme } from '@/lib/theme';
import type { SkillCard } from '@/lib/cards';

/** Key facts / "pick it when" / traps for one skill. */
export function CardView({ card }: { card: SkillCard }) {
  const { t } = useTranslation();
  const { colors, radius, space, fontSize } = useTheme();
  const head = (Icon: typeof Target, label: string, color: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon size={16} color={color} />
      <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.sm, color, letterSpacing: 0.3 }}>{label.toUpperCase()}</Text>
    </View>
  );
  const box = { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm } as const;
  const body = { fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: 22, color: colors.ink } as const;
  return (
    <View style={{ gap: space.md }}>
      <View style={box}>
        {head(Lightbulb, t('lesson.cardFacts'), colors.primary)}
        {card.facts.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={[body, { color: colors.primary }]}>•</Text>
            <Text style={[body, { flex: 1 }]}>{f}</Text>
          </View>
        ))}
      </View>
      {card.pick.length > 0 && (
        <View style={box}>
          {head(Target, t('lesson.cardPick'), colors.ok)}
          {card.pick.map((p, i) => (
            <View key={i} style={{ gap: 2 }}>
              <Text style={[body, { color: colors.grey }]}>{p.when}</Text>
              <Text style={[body, { fontFamily: fonts.bold }]}>→ {p.use}</Text>
            </View>
          ))}
        </View>
      )}
      {card.traps.length > 0 && (
        <View style={box}>
          {head(AlertTriangle, t('lesson.cardTraps'), colors.warn)}
          {card.traps.map((x, i) => <Text key={i} style={body}>{x}</Text>)}
        </View>
      )}
    </View>
  );
}
