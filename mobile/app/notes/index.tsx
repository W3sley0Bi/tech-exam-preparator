import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button, Card, EmptyState, ScreenScroll } from '@/components/ui';
import { DOMAINS, NOTES } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { headings, highlightParts, searchNotes } from '@/lib/logic/notes';
import { domainColors, fontSize, useTheme } from '@/lib/theme';
import type { DomainKey } from '@/lib/types';

const isDomain = (id: string): id is DomainKey => id in DOMAINS;

function Highlighted({ line, q }: { line: string; q: string }) {
  const { colors } = useTheme();
  return (
    <Text numberOfLines={3} style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey, lineHeight: 19 }}>
      {highlightParts(line, q).map((p, i) => (
        <Text key={i} style={p.match ? { backgroundColor: colors.warnBg, color: colors.warn, fontFamily: fonts.bold } : undefined}>{p.text}</Text>
      ))}
    </Text>
  );
}

export default function NotesIndex() {
  const { t } = useTranslation();
  const { colors, radius, space } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(typeof params.q === 'string' ? params.q : '');
  const web = Platform.OS !== 'ios';
  const query = q.trim();
  const res = useMemo(() => searchNotes(query), [query]);

  const groups = useMemo(() => {
    const m = new Map<string, { key: string; noteTitle: string; headingText: string; hits: typeof res.hits }>();
    res.hits.forEach(h => {
      const key = `${h.noteId}#${h.headingId}`;
      if (!m.has(key)) m.set(key, { key, noteTitle: h.noteTitle, headingText: h.headingText, hits: [] });
      m.get(key)!.hits.push(h);
    });
    return [...m.values()];
  }, [res]);

  const open = (doc: string, h: string, term?: string) => {
    haptics.tap();
    router.push({ pathname: '/notes/[doc]', params: { doc, ...(h ? { h } : {}), ...(term ? { q: term } : {}) } } as never);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: Platform.OS === 'ios'
            ? { placeholder: t('notes.searchPlaceholder'), onChangeText: (e: { nativeEvent: { text: string } }) => setQ(e.nativeEvent.text), hideWhenScrolling: false }
            : undefined,
        }}
      />
      <ScreenScroll>
        {web ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card2, borderRadius: radius.lg, paddingHorizontal: space.md, minHeight: 48 }}>
            <Search size={18} color={colors.grey} />
            <TextInput
              value={q} onChangeText={setQ} placeholder={t('notes.searchPlaceholder')} placeholderTextColor={colors.grey}
              accessibilityLabel={t('notes.searchPlaceholder')} autoCorrect={false} returnKeyType="search"
              style={[{ flex: 1, fontFamily: fonts.regular, fontSize: fontSize.lg, color: colors.ink, paddingVertical: 10 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
            />
          </View>
        ) : null}

        {query ? (
          <>
            <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.grey }}>
              {t('notes.searchTitle', { q: query })} · {t('notes.matches', { count: res.total })}
            </Text>
            {groups.length === 0 ? (
              <EmptyState icon={Search} title={t('notes.noMatches')} />
            ) : groups.map(g => (
              <Animated.View key={g.key} entering={FadeIn.duration(200)}>
                <Card style={{ padding: 0 }}>
                  <Pressable
                    accessibilityRole="button" accessibilityLabel={`${g.noteTitle}, ${g.headingText}`}
                    onPress={() => open(g.hits[0].noteId, g.hits[0].headingId, query)}
                    style={({ pressed }) => ({ padding: space.lg, gap: 6, minHeight: 48, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ink }}>
                      {g.noteTitle} › {g.headingText}
                    </Text>
                    {g.hits.slice(0, 3).map((h, i) => <Highlighted key={i} line={h.line} q={query} />)}
                    {g.hits.length > 3 ? <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.grey }}>+{g.hits.length - 3}</Text> : null}
                  </Pressable>
                </Card>
              </Animated.View>
            ))}
          </>
        ) : NOTES.length === 0 ? (
          <EmptyState title={t('notes.noNotes')} />
        ) : NOTES.map(n => {
          const hs = headings(n.md);
          const dom = isDomain(n.id) ? n.id : null;
          const accent = dom ? domainColors[dom].fg : colors.primary;
          const preview = hs.filter(h => h.level >= 2).slice(0, 4).map(h => h.text).join(' · ');
          return (
            <Animated.View key={n.id} entering={FadeIn.duration(200)}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 5, backgroundColor: accent }} />
                  <View style={{ flex: 1, padding: space.lg, gap: 8 }}>
                    <Pressable
                      accessibilityRole="button" accessibilityLabel={n.title} onPress={() => open(n.id, '')}
                      style={({ pressed }) => ({ gap: 6, minHeight: 48, opacity: pressed ? 0.6 : 1 })}
                    >
                      <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{n.title}</Text>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.xs, color: accent }}>{hs.length} §</Text>
                      {preview ? <Text numberOfLines={2} style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey }}>{preview}</Text> : null}
                    </Pressable>
                    {dom ? (
                      <Button
                        title={t('notes.practiceDomain')} variant="secondary"
                        onPress={() => router.push({ pathname: '/practice', params: { domain: dom, order: 'random' } } as never)}
                      />
                    ) : null}
                  </View>
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </ScreenScroll>
    </>
  );
}
