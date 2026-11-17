import React, { useMemo, useState } from 'react';
import { DISPUTES } from '@/lib/disputes';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { Question } from '@/lib/types';
import { letters, sameSet } from '@/lib/logic/grading';
import { relatedNotes } from '@/lib/logic/notes';
import { useTheme } from '@/lib/theme';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { QuestionImages } from './QuestionImages';

function Linkified({ text, style, linkColor }: { text: string; style: object; linkColor: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g);
  return (
    <Text style={style} selectable>
      {parts.map((p, i) => /^https?:\/\//.test(p)
        ? <Text key={i} style={{ color: linkColor, textDecorationLine: 'underline' }} onPress={() => { void Linking.openURL(p); }}>{p}</Text>
        : <Text key={i}>{p}</Text>)}
    </Text>
  );
}

function Warn({ children }: { children: string }) {
  const { colors, radius, fontSize } = useTheme();
  return (
    <View style={[styles.warn, { backgroundColor: colors.warnBg, borderColor: colors.warn, borderRadius: radius.md }]}>
      <AlertTriangle size={18} color={colors.warn} style={{ marginTop: 2 }} />
      <Text style={{ flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function Explanation({ q }: { q: Question }) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const related = useMemo(() => relatedNotes(q), [q]);
  const comm = q.community;
  const base = { color: colors.ink, fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 21 };

  return (
    <Animated.View entering={FadeIn} layout={LinearTransition} style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.lg }]}>
      {q.mc && (
        <Text style={base}>
          {t('question.correctAnswer', { answer: '' })}
          <Text style={{ fontFamily: fonts.bold }}>{q.answer || t('common.dash')}</Text>
          {comm.length ? <Text style={{ color: colors.grey }}>{`  ·  ${t('question.communityVote', { votes: comm.map(c => `${c.ans} (${c.pct}%)`).join(', ') })}`}</Text> : null}
        </Text>
      )}
      {q.mc && q.site && comm.length > 0 && !sameSet(letters(q.site), letters(comm[0].ans)) && (
        <Warn>{t('question.siteMismatch', { site: q.site, comm: comm[0].ans })}</Warn>
      )}
      {q.review_note ? <Warn>{t('question.outdated', { note: q.review_note })}</Warn> : null}
      {q.ix?.note ? <Warn>{q.ix.note}</Warn> : null}
      {DISPUTES[q.n] ? <Warn>{DISPUTES[q.n]}</Warn> : null}
      {q.aimg.length > 0 && (
        <View>
          {q.ix ? <Text style={[base, { color: colors.grey, marginTop: 4 }]}>{t('question.answerImage')}</Text> : null}
          <QuestionImages keys={q.aimg} alt={t('question.answerImageAlt')} />
        </View>
      )}
      {q.desc ? <Linkified text={q.desc} style={base} linkColor={colors.primary} /> : null}

      {related.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={styles.inline}><BookOpen size={16} color={colors.grey} /><Text style={[base, { color: colors.grey, fontFamily: fonts.semibold }]}>{t('question.yourNotes')}</Text></View>
          <View style={styles.chips}>
            {related.map(r => (
              <Pressable key={`${r.note}-${r.h.id}`} accessibilityRole="link"
                onPress={() => { haptics.tap(); router.push({ pathname: '/notes/[doc]', params: { doc: r.note, h: r.h.id } } as never); }}
                style={({ pressed }) => [styles.chip, { backgroundColor: colors.primaryBg, borderRadius: radius.pill, opacity: pressed ? 0.7 : 1 }]}>
                <Text numberOfLines={2} style={{ color: colors.primary, fontFamily: fonts.medium, fontSize: fontSize.sm }}>{r.h.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {q.comments.length > 0 && (
        <View style={{ gap: 8 }}>
          <Pressable onPress={() => { haptics.tap(); setShowComments(s => !s); }} accessibilityRole="button" accessibilityState={{ expanded: showComments }} style={styles.commentsHead}>
            <Text style={{ flex: 1, color: colors.primary, fontFamily: fonts.semibold, fontSize: fontSize.sm }}>{t('question.comments', { count: q.comments.length })}</Text>
            {showComments ? <ChevronUp size={18} color={colors.primary} /> : <ChevronDown size={18} color={colors.primary} />}
          </Pressable>
          {showComments && q.comments.map((c, i) => (
            <Animated.View key={i} entering={FadeIn} style={[styles.comment, { backgroundColor: colors.card2, borderRadius: radius.md }]}>
              <View style={styles.inline}><ThumbsUp size={13} color={colors.grey} /><Text style={{ color: colors.grey, fontFamily: fonts.semibold, fontSize: fontSize.xs }}>{c.u}</Text></View>
              <Linkified text={c.c} style={base} linkColor={colors.primary} />
            </Animated.View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, padding: 14, gap: 12 },
  warn: { flexDirection: 'row', gap: 8, padding: 10, borderWidth: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
  commentsHead: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  comment: { padding: 10, gap: 4 },
});
