import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react-native';
import { Button, Card, ListRow, Pill, ScreenScroll, SectionHeader } from '@/components/ui';
import { MascotTip } from '@/components/mascot';
import { ExamResultView } from '@/components/exam/ExamResult';
import { ExamRunner } from '@/components/exam/ExamRunner';
import { DOMAINS } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import { EXAM_MINUTES, PASS, examTotal, gradableCount } from '@/lib/logic/exam';
import { useStore } from '@/lib/store';
import { fontSize, useTheme } from '@/lib/theme';

export default function ExamScreen() {
  const { t } = useTranslation();
  const { colors, space } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ result?: string }>();
  const session = useStore(s => s.exam);
  const exams = useStore(s => s.exams);

  const resultIdx = params.result != null && params.result !== '' ? Number(params.result) : null;
  const selected = resultIdx != null ? exams[resultIdx] : undefined;

  const startNew = () => {
    useStore.getState().startExam();
    router.setParams({ result: '' });
  };

  if (selected) return <ExamResultView e={selected} onNew={startNew} />;
  if (session) return <ExamRunner ex={session} />;

  const gc = gradableCount();
  const history = exams.map((e, i) => ({ e, i })).reverse();
  return (
    <ScreenScroll>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.heavy, fontSize: fontSize.hero, color: colors.ink }}>{t('tabs.exam')}</Text>
      <Card style={{ gap: space.md }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 22, color: colors.ink }}>
          {t('exam.intro', { count: examTotal(), minutes: EXAM_MINUTES, pass: PASS })}
        </Text>
        <View style={{ gap: 4 }}>
          {Object.values(DOMAINS).map(d => (
            <Text key={d.label} style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.ink }}>
              {t('exam.domainLine', { label: d.label, count: d.examCount, weight: d.weight })}
            </Text>
          ))}
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey }}>{t('exam.drawn', { count: gc })}</Text>
      </Card>
      <MascotTip context="think" />
      <Button title={t('exam.start')} icon={Play} size="lg" fullWidth disabled={!gc} onPress={startNew} />

      <SectionHeader title={t('exam.historyHeading')} />
      <Card style={{ paddingVertical: space.xs }}>
        {history.length === 0 ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.grey, paddingVertical: space.md }}>{t('exam.noHistory')}</Text>
        ) : history.map(({ e, i }) => {
          const pass = e.score >= PASS;
          return (
            <ListRow
              key={e.at + '-' + i} title={`${e.score}`} subtitle={`${new Date(e.at).toLocaleDateString()} · ${e.correct}/${e.total}`}
              right={<Pill label={pass ? t('exam.passTag') : t('exam.failTag')} tone={pass ? 'ok' : 'bad'} />}
              onPress={() => router.push(`/exam?result=${i}` as never)}
            />
          );
        })}
      </Card>
    </ScreenScroll>
  );
}
