import { Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react-native';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { LessonSection } from '@/lib/lessons';

/** Question-targeted lesson sections, Microsoft Learn style. */
export function LessonView({ sections }: { sections: LessonSection[] }) {
  const { t } = useTranslation();
  const { colors, radius, space, fontSize } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      {sections.map((s, i) => (
        <View key={i} style={{ backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.heavy, fontSize: fontSize.lg, color: colors.ink }}>{s.title}</Text>
          {s.points.map((p, j) => (
            <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.primary }}>•</Text>
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: 22, color: colors.ink }}>{p}</Text>
            </View>
          ))}
          {s.link ? (
            <Pressable
              accessibilityRole="link" onPress={() => { haptics.tap(); WebBrowser.openBrowserAsync(s.link!).catch(() => {}); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 }}
            >
              <ExternalLink size={14} color={colors.primary} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.primary }}>{t('lesson.readOnLearn')}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
