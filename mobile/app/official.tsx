import { useMemo } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { BookOpen, ClipboardCheck, FlaskConical, GraduationCap, PlayCircle, ScrollText } from 'lucide-react-native';
import { Button, Card, ListRow, Pill, ScreenScroll, SectionHeader } from '@/components/ui';
import { CURRICULUM, DOMAINS, DOMAIN_KEYS, LEARN_BASE } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { useStore } from '@/lib/store';
import { fontSize, useTheme } from '@/lib/theme';
import type { SkillRating } from '@/lib/types';

const LINKS = {
  guide: `${LEARN_BASE}credentials/certifications/resources/study-guides/az-900`,
  cert: `${LEARN_BASE}credentials/certifications/azure-fundamentals/`,
  assessment: `${LEARN_BASE}credentials/certifications/exams/az-900/practice/assessment?assessment-type=practice&assessmentId=23`,
  sandbox: 'https://aka.ms/examdemo',
  erz: `${LEARN_BASE}shows/exam-readiness-zone/`,
};

function open(url: string) {
  haptics.tap();
  if (Platform.OS === 'web') { Linking.openURL(url).catch(() => {}); return; }
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
}

const LEVELS: { v: SkillRating; key: 'weak' | 'ok' | 'strong' }[] = [{ v: 0, key: 'weak' }, { v: 1, key: 'ok' }, { v: 2, key: 'strong' }];

function Rating({ name }: { name: string }) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();
  const cur = useStore((s) => s.skills[name]);
  const tones = [
    { fg: colors.danger, bg: colors.dangerBg },
    { fg: colors.warn, bg: colors.warnBg },
    { fg: colors.ok, bg: colors.okBg },
  ];
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
      {LEVELS.map(({ v, key }) => {
        const on = cur === v;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${name}: ${t(`official.level.${key}`)}`}
            onPress={() => { haptics.select(); useStore.getState().setSkillRating(name, on ? null : v); }}
            style={{
              flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md,
              backgroundColor: on ? tones[v].bg : colors.card2, borderWidth: 1.5, borderColor: on ? tones[v].fg : 'transparent',
            }}
          >
            <Text style={{ fontFamily: on ? fonts.bold : fonts.medium, fontSize: fontSize.sm, color: on ? tones[v].fg : colors.grey }}>
              {t(`official.level.${key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OfficialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, space } = useTheme();
  const skills = useStore((s) => s.skills);

  const domains = useMemo(
    () => DOMAIN_KEYS.map((d) => {
      const units = CURRICULUM.filter((u) => u.domain === d);
      return { d, path: units.find((u) => u.path)?.path, units };
    }).filter((x) => x.units.length),
    [],
  );
  const { total, rated, strong } = useMemo(() => {
    const all = domains.flatMap((x) => x.units.flatMap((u) => u.skills.map((s) => s.name)));
    return { total: all.length, rated: all.filter((k) => skills[k] !== undefined).length, strong: all.filter((k) => skills[k] === 2).length };
  }, [domains, skills]);

  const go = (href: string) => { haptics.tap(); router.push(href as Href); };

  return (
    <ScreenScroll>
      <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.grey, lineHeight: 22 }}>
        {t('official.subtitle', { rated, total, strong })}
      </Text>

      <Card style={{ paddingVertical: space.xs }}>
        <ListRow icon={ScrollText} title={t('official.studyGuide')} subtitle={t('official.studyGuideHint')} onPress={() => open(LINKS.guide)} />
        <ListRow icon={GraduationCap} title={t('official.certPage')} subtitle={t('official.certHint')} onPress={() => open(LINKS.cert)} />
        <ListRow icon={ClipboardCheck} title={t('official.practiceAssessment')} onPress={() => open(LINKS.assessment)} />
        <ListRow icon={FlaskConical} title={t('official.sandbox')} subtitle={t('official.sandboxHint')} onPress={() => open(LINKS.sandbox)} />
        <ListRow icon={PlayCircle} title={t('official.erz')} onPress={() => open(LINKS.erz)} />
      </Card>

      {domains.map(({ d, path, units }) => (
        <View key={d} style={{ gap: space.sm }}>
          <SectionHeader title={DOMAINS[d].label} style={{ marginTop: space.md }} />
          <Pill label={DOMAINS[d].weight} tone="domain" domain={d} style={{ alignSelf: 'flex-start' }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {path ? <Button title={t('official.learnPath')} variant="secondary" icon={BookOpen} onPress={() => open(`${LEARN_BASE}${path}`)} /> : null}
            <Button title={t('official.myNotes')} variant="secondary" onPress={() => go(`/notes/${d}`)} />
            <Button title={t('official.practiceQuestions')} variant="secondary" onPress={() => go(`/practice?domain=${d}&order=random`)} />
          </View>
          {units.map((u) => (
            <Card key={u.id} style={{ gap: space.md }}>
              <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ink }}>{u.title}</Text>
              {u.skills.map((s) => (
                <View key={s.id}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.ink, lineHeight: 21 }}>{s.name}</Text>
                  <Rating name={s.name} />
                </View>
              ))}
            </Card>
          ))}
        </View>
      ))}
    </ScreenScroll>
  );
}
