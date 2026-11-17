import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { List } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, ListRow, Sheet } from '@/components/ui';
import { Markdown } from '@/components/markdown';
import { DOMAINS, NOTES } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { headings } from '@/lib/logic/notes';
import { fontSize, useTheme } from '@/lib/theme';

export default function NoteDoc() {
  const { t } = useTranslation();
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ doc: string; h?: string; q?: string }>();
  const doc = String(p.doc ?? '');
  const note = NOTES.find(n => n.id === doc);
  const q = typeof p.q === 'string' ? p.q : undefined;
  const h = typeof p.h === 'string' ? p.h : undefined;

  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const ys = useRef<Record<string, number>>({});
  const mdTop = useRef(0);
  const [toc, setToc] = useState(false);
  const [pending, setPending] = useState<string | undefined>(h);

  useEffect(() => { setPending(h); }, [h, doc]);

  const jump = useCallback((id: string, animated = true) => {
    const y = ys.current[id];
    if (y == null) return false;
    scroll.current?.scrollTo({ y: Math.max(0, mdTop.current + y - 8), animated });
    return true;
  }, []);

  const onHeadingLayout = useCallback((id: string, y: number) => {
    ys.current[id] = y;
    setPending(cur => (cur === id ? (jump(id, false), undefined) : cur));
  }, [jump]);

  if (!note) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState title={t('notes.noNotes')} />
      </>
    );
  }

  const outline = headings(note.md).filter(x => x.level <= 2);
  const isDomain = doc in DOMAINS;

  return (
    <>
      <Stack.Screen
        options={{
          title: note.title,
          headerRight: () => (
            <Pressable
              accessibilityRole="button" accessibilityLabel={t('notes.onThisPage')} hitSlop={10}
              onPress={() => { haptics.tap(); setToc(true); }}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <List size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        ref={scroll}
        style={{ flex: 1, backgroundColor: colors.paper }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xxl, gap: space.lg, width: '100%', maxWidth: 720, alignSelf: 'center' }}
      >
        <View onLayout={e => { mdTop.current = e.nativeEvent.layout.y; }}>
          <Markdown md={note.md} highlight={q} onHeadingLayout={onHeadingLayout} />
        </View>
        {isDomain ? (
          <Button
            title={t('notes.practiceDomain')} size="lg" fullWidth
            onPress={() => router.push({ pathname: '/practice', params: { domain: doc, order: 'random' } } as never)}
          />
        ) : null}
      </ScrollView>
      <Sheet visible={toc} onClose={() => setToc(false)} title={t('notes.onThisPage')}>
        {outline.map((o, i) => (
          <View key={`${o.id}-${i}`} style={{ paddingLeft: (o.level - 1) * 14 }}>
            <ListRow
              title={o.text}
              onPress={() => {
                haptics.select();
                setToc(false);
                setTimeout(() => { if (!jump(o.id)) setPending(o.id); }, 350);
              }}
            />
          </View>
        ))}
        {outline.length === 0 ? <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.grey }}>{t('notes.noNotes')}</Text> : null}
      </Sheet>
    </>
  );
}
