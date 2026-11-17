import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Question } from '@/lib/types';
import { cleanText, splitImgText } from '@/lib/logic/grading';
import { useTheme } from '@/lib/theme';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { Choices } from './Choices';
import { Interactive } from './Interactive';
import { QuestionImage, QuestionImages } from './QuestionImages';
import { Explanation } from './Explanation';

export interface QuestionCardProps {
  q: Question;
  value: string[] | (string | null)[];
  onChange: (v: any) => void;
  revealed: boolean;
  mode?: 'practice' | 'exam' | 'lesson';
  compact?: boolean;
}

function InlineBody({ q, size }: { q: Question; size: number }) {
  const { colors } = useTheme();
  const parts = splitImgText(q.text);
  const imgs = q.qimg.slice();
  const style = { color: colors.ink, fontFamily: fonts.medium, fontSize: size, lineHeight: size * 1.5 };
  const out: React.ReactNode[] = [];
  parts.forEach((p, i) => {
    const txt = p.trim();
    if (txt) out.push(<Text key={`t${i}`} style={style} selectable>{txt}</Text>);
    if (i < parts.length - 1) { const k = imgs.shift(); if (k) out.push(<QuestionImage key={`i${i}`} imgKey={k} />); }
  });
  imgs.forEach((k, i) => out.push(<QuestionImage key={`r${i}`} imgKey={k} />));
  return <View style={{ gap: 8 }}>{out}</View>;
}

export function QuestionCard({ q, value, onChange, revealed, mode = 'practice', compact }: QuestionCardProps) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  const [showImg, setShowImg] = useState(false);
  const size = compact ? fontSize.md : fontSize.lg;
  const showExplain = revealed && mode !== 'exam';

  return (
    <View style={{ gap: compact ? 12 : 16 }}>
      {q.ix && (
        <View style={[styles.tag, { backgroundColor: colors.primaryBg, borderRadius: radius.pill }]}>
          <Text style={{ color: colors.primary, fontFamily: fonts.semibold, fontSize: fontSize.xs }}>{t(`question.ixLabel.${q.ix.kind}`)}</Text>
        </View>
      )}
      {q.ix ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.ink, fontFamily: fonts.medium, fontSize: size, lineHeight: size * 1.5 }} selectable>{cleanText(q)}</Text>
          {q.qimg.length > 0 && (
            <>
              <Pressable onPress={() => { haptics.tap(); setShowImg(s => !s); }} accessibilityRole="button" accessibilityState={{ expanded: showImg }} style={styles.toggle}>
                <Text style={{ color: colors.primary, fontFamily: fonts.medium, fontSize: fontSize.sm }}>{showImg ? t('question.hideImage') : t('question.showImage')}</Text>
                {showImg ? <ChevronUp size={16} color={colors.primary} /> : <ChevronDown size={16} color={colors.primary} />}
              </Pressable>
              {showImg && <Animated.View entering={FadeIn}><QuestionImages keys={q.qimg} /></Animated.View>}
            </>
          )}
        </View>
      ) : (
        <InlineBody q={q} size={size} />
      )}

      <Animated.View layout={LinearTransition}>
        {q.ix
          ? <Interactive q={q} value={value as (string | null)[]} onChange={onChange} revealed={revealed} />
          : q.choices
            ? <Choices q={q} value={value as string[]} onChange={onChange} revealed={revealed} />
            : null}
      </Animated.View>

      {showExplain && <Explanation q={q} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4 },
  toggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
