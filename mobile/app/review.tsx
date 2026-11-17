import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Pill, Segmented } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { QUESTIONS } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { useStore } from '@/lib/store';
import { fontSize, useTheme } from '@/lib/theme';
import type { Question } from '@/lib/types';

type Tab = 'wrong' | 'flagged' | 'shaky';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const ans = useStore((s) => s.ans);
  const flags = useStore((s) => s.flags);
  const [tab, setTab] = useState<Tab>('wrong');

  const lists = useMemo(() => ({
    wrong: QUESTIONS.filter((q) => ans[q.n] && !ans[q.n].ok),
    flagged: QUESTIONS.filter((q) => flags[q.n]),
    shaky: QUESTIONS.filter((q) => { const a = ans[q.n]; return a && a.ok && a.okCount < a.tries; }),
  }), [ans, flags]);

  const data = lists[tab];
  const go = (href: string) => { haptics.tap(); router.push(href as Href); };
  const web = Platform.OS === 'web';

  const header = (
    <View style={{ gap: space.md, paddingBottom: space.md }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.grey }}>{t('review.subtitle')}</Text>
      <Segmented
        value={tab}
        onChange={(v) => { haptics.select(); setTab(v as Tab); }}
        options={[
          { value: 'wrong', label: `${t('common.wrong')} ${lists.wrong.length}` },
          { value: 'flagged', label: `${t('common.flagged')} ${lists.flagged.length}` },
          { value: 'shaky', label: `Shaky ${lists.shaky.length}` },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title={t('review.drillWrong', { count: lists.wrong.length })} fullWidth={false} style={{ flex: 1 }}
          disabled={!lists.wrong.length} onPress={() => go('/practice?status=wrong&order=random')} />
        <Button title={t('review.drillFlagged', { count: lists.flagged.length })} variant="secondary" style={{ flex: 1 }}
          disabled={!lists.flagged.length} onPress={() => go('/practice?status=flagged')} />
      </View>
      <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>
        {t(tab === 'wrong' ? 'review.wrongHeading' : tab === 'flagged' ? 'review.flaggedHeading' : 'review.shakyHeading', { count: data.length })}
      </Text>
    </View>
  );

  const renderItem = ({ item: q }: { item: Question }) => {
    const a = ans[q.n];
    const text = q.text.replace(/\/\/IMG\/\//g, ' ').replace(/\s+/g, ' ').trim();
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => go(`/question/${q.n}`)}
        style={({ pressed }) => ({
          backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, gap: 8, minHeight: 48,
          borderWidth: 1, borderColor: colors.line, opacity: pressed ? 0.7 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text style={{ fontFamily: fonts.heavy, fontSize: fontSize.md, color: colors.primary }}>#{q.n}</Text>
          <Pill label={t(`common.domain.${q.domain}`)} tone="domain" domain={q.domain} />
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.grey }}>
            {a ? t('review.record', { ok: a.okCount, tries: a.tries }) : t('common.dash')}
          </Text>
        </View>
        <Text numberOfLines={3} style={{ fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.ink }}>
          {text.length > 160 ? `${text.slice(0, 160)}…` : text}
        </Text>
      </Pressable>
    );
  };

  const emptyText = tab === 'wrong' ? t('review.emptyWrong') : tab === 'flagged' ? t('review.emptyFlagged') : t('review.emptyShaky');

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentInsetAdjustmentBehavior="automatic"
      data={data}
      keyExtractor={(q) => String(q.n)}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      ListEmptyComponent={
        <View style={{ alignItems: 'center' }}>
          <Mascot mood="happy" size={110} />
          <EmptyState title={emptyText} />
        </View>
      }
      contentContainerStyle={[
        { padding: space.lg, paddingBottom: space.xxl + (web ? insets.bottom : 0) },
        web && { width: '100%', maxWidth: 720, alignSelf: 'center' },
      ]}
    />
  );
}
