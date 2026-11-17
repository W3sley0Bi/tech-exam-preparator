import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { Button, Card, Pill, ScreenScroll, SectionHeader, StatTile } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { BY_N, DOMAINS, DOMAIN_KEYS } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import { PASS } from '@/lib/logic/exam';
import { pct } from '@/lib/logic/util';
import { fontSize, useTheme } from '@/lib/theme';
import type { ExamResult as Result } from '@/lib/types';

export function ExamResultView({ e, onNew }: { e: Result; onNew: () => void }) {
  const { t } = useTranslation();
  const { colors, space, radius } = useTheme();
  const router = useRouter();
  const pass = e.score >= PASS;
  return (
    <ScreenScroll>
      <View>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heavy, fontSize: fontSize.xxl, color: colors.ink }}>{t('exam.resultTitle')}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey }}>
          {t('exam.resultSub', { date: new Date(e.at).toLocaleDateString(), minutes: e.minutes })}
        </Text>
      </View>

      <Card style={{ alignItems: 'center', gap: space.sm }}>
        <Mascot mood={pass ? 'celebrate' : 'sad'} size={110} />
        <Text style={{ fontFamily: fonts.heavy, fontSize: 64, lineHeight: 72, color: pass ? colors.ok : colors.danger }}>{e.score}</Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{t('exam.score', { pass: PASS })}</Text>
        <Pill label={pass ? t('exam.passTag') : t('exam.failTag')} tone={pass ? 'ok' : 'bad'} style={{ alignSelf: 'center' }} />
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile value={`${e.correct}/${e.total}`} label={t('exam.correct')} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {DOMAIN_KEYS.map(d => {
          const r = e.domains[d];
          return <StatTile key={d} value={r ? t('common.percent', { value: pct(r[0], r[1]) }) : t('common.dash')} label={DOMAINS[d].label} />;
        })}
      </View>

      <SectionHeader title={t('exam.answersHeading')} />
      <Card style={{ paddingVertical: space.xs }}>
        {e.items.map((it, k) => {
          const q = BY_N.get(it.n);
          if (!q) return null;
          const correct = q.mc ? q.answer : q.ix ? t('exam.seeQuestion') : '';
          const Icon = it.ok ? CheckCircle2 : XCircle;
          return (
            <Pressable
              key={it.n} accessibilityRole="button" onPress={() => router.push(`/question/${it.n}` as never)}
              style={({ pressed }) => ({ paddingVertical: space.md, gap: 6, opacity: pressed ? 0.6 : 1, borderTopWidth: k ? 1 : 0, borderTopColor: colors.line })}
            >
              <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
                <Icon size={20} color={it.ok ? colors.ok : colors.danger} />
                <Text numberOfLines={2} style={{ flex: 1, fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.ink }}>
                  {k + 1}. {q.text.replace(/\/\/IMG\/\//g, '').trim()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', alignItems: 'center', paddingLeft: 28 }}>
                <Pill label={t('exam.colYours') + ': ' + (it.given || t('common.dash'))} tone={it.ok ? 'ok' : 'bad'} />
                {!it.ok && correct ? <Pill label={t('exam.colCorrect') + ': ' + correct} tone="neutral" /> : null}
                <Pill label={t(`common.domain.${q.domain}`)} tone="domain" domain={q.domain} />
              </View>
            </Pressable>
          );
        })}
      </Card>

      <View style={{ gap: space.sm }}>
        <Button title={t('exam.newExam')} fullWidth onPress={onNew} />
        <Button title={t('exam.practiceMistakes')} variant="secondary" fullWidth onPress={() => router.push('/practice?status=wrong' as never)} />
      </View>
      <View style={{ height: radius.sm }} />
    </ScreenScroll>
  );
}
