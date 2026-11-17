import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui';
import { QuestionRunner } from '@/components/practice/QuestionRunner';
import { BY_N } from '@/lib/data';
import { useTheme } from '@/lib/theme';

export default function QuestionModal() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const q = BY_N.get(parseInt(String(n), 10));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/' as never));

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top > 20 ? 8 : insets.top }}>
      {q ? (
        <QuestionRunner key={q.n} q={q} onClose={close} onSelfGraded={close} />
      ) : (
        <EmptyState icon={SearchX} title={t('practice.noMatch')} action={{ label: t('common.close'), onPress: close }} />
      )}
    </View>
  );
}
