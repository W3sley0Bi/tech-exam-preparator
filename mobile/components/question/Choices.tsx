import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Check, X, CircleDot } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Question } from '@/lib/types';
import { letters, needCount, toggleSelection } from '@/lib/logic/grading';
import { useTheme } from '@/lib/theme';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';

export function Choices({ q, value, onChange, revealed }: { q: Question; value: readonly string[]; onChange: (v: string[]) => void; revealed: boolean }) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  if (!q.choices) return null;
  const correct = letters(q.answer);
  const need = needCount(q);
  return (
    <View style={{ gap: 10 }}>
      {need > 1 && <Text style={[styles.hint, { color: colors.grey, fontFamily: fonts.medium, fontSize: fontSize.sm }]}>{t('question.selectN', { count: need })}</Text>}
      {Object.entries(q.choices).map(([k, text]) => {
        const on = value.includes(k);
        const right = correct.includes(k);
        let bg = on ? colors.primaryBg : colors.card, border = on ? colors.primary : colors.line, keyBg = on ? colors.primary : colors.card2, keyFg = on ? colors.onPrimary : colors.grey;
        let icon: React.ReactNode = null;
        if (revealed && correct.length) {
          if (right && on) { bg = colors.okBg; border = colors.ok; keyBg = colors.ok; keyFg = '#fff'; icon = <Check size={20} color={colors.ok} />; }
          else if (right) { bg = colors.okBg; border = colors.ok; keyBg = colors.card; keyFg = colors.ok; icon = <CircleDot size={20} color={colors.ok} />; }
          else if (on) { bg = colors.dangerBg; border = colors.danger; keyBg = colors.danger; keyFg = '#fff'; icon = <X size={20} color={colors.danger} />; }
        }
        return (
          <Animated.View key={k} layout={LinearTransition} entering={FadeIn}>
            <Pressable
              disabled={revealed}
              onPress={() => { haptics.select(); onChange(toggleSelection(value, k, need)); }}
              accessibilityRole={need > 1 ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: on, disabled: revealed }}
              style={({ pressed }) => [styles.row, { backgroundColor: bg, borderColor: border, borderRadius: radius.lg, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.key, { backgroundColor: keyBg, borderRadius: need > 1 ? radius.sm : 16 }]}>
                <Text style={{ color: keyFg, fontFamily: fonts.bold, fontSize: fontSize.md }}>{k}</Text>
              </View>
              <Text style={[styles.text, { color: colors.ink, fontFamily: fonts.regular, fontSize: fontSize.md }]}>{text}</Text>
              {icon}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1.5 },
  key: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, lineHeight: 22 },
});
