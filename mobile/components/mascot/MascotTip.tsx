import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fonts } from '@/lib/fonts';
import { useTheme } from '@/lib/theme';
import { mascotLine, moodFor, type MascotContext } from '@/lib/mascot';
import { Mascot, MascotMood } from './Mascot';

/** A line for a mood/context from `mascot.<ctx>` (see lib/mascot.ts); numeric `seed` gives a stable pick. */
export function useMascotLine(ctx: MascotContext, seed?: number): string {
  const { i18n } = useTranslation();
  return useMemo(() => mascotLine(ctx, seed), [ctx, seed, i18n.language]);
}

export type MascotTipProps = {
  /** what's happening: a mood or a context like 'correct' | 'wrong' | 'lessonDone' (picks mood + line) */
  context?: MascotContext;
  /** override the mood derived from context */
  mood?: MascotMood;
  /** explicit text; falls back to a `mascot.<context>` line */
  text?: string;
  seed?: number;
  size?: number;
  /** bubble on the right of Nimbus (row) or below it (column) */
  layout?: 'row' | 'column';
  style?: StyleProp<ViewStyle>;
};

export function MascotTip({ context = 'idle', mood, text, seed, size = 72, layout = 'row', style }: MascotTipProps) {
  const { colors, radius, space, fontSize } = useTheme();
  const line = useMascotLine(context, seed);
  mood = mood ?? moodFor[context];
  const message = text ?? line;
  const row = layout === 'row';

  return (
    <View style={[{ flexDirection: row ? 'row' : 'column', alignItems: 'center', gap: space.sm }, style]}>
      <Mascot mood={mood} size={size} />
      {!!message && (
        <Animated.View
          key={message}
          entering={FadeInDown.duration(220)}
          style={[
            styles.bubble,
            { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.lg, padding: space.md },
            row ? { flex: 1 } : { alignSelf: 'stretch' },
          ]}>
          <View style={[styles.tail, row ? styles.tailLeft : styles.tailTop, { backgroundColor: colors.card, borderColor: colors.line }]} />
          <Text style={{ color: colors.ink, fontFamily: fonts.semibold, fontSize: fontSize.md, lineHeight: 21 }}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { borderWidth: 1 },
  tail: { position: 'absolute', width: 12, height: 12, borderWidth: 1, transform: [{ rotate: '45deg' }] },
  tailLeft: { left: -7, top: '50%', marginTop: -6, borderRightWidth: 0, borderTopWidth: 0 },
  tailTop: { top: -7, left: '50%', marginLeft: -6, borderRightWidth: 0, borderBottomWidth: 0 },
});
