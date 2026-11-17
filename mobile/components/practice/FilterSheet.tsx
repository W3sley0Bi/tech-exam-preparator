import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Segmented, Sheet } from '@/components/ui';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import type { PracticeFilter } from '@/lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  filter: PracticeFilter;
  onStart: (f: PracticeFilter) => void;
  onJump: (n: number) => void;
}

export function FilterSheet({ visible, onClose, filter, onStart, onJump }: Props) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();
  const [f, setF] = useState(filter);
  const [jump, setJump] = useState('');
  useEffect(() => { if (visible) setF(filter); }, [visible, filter]);
  const set = <K extends keyof PracticeFilter>(k: K, v: string) => setF(p => ({ ...p, [k]: v as PracticeFilter[K] }));
  const label = (k: string) => <Text style={{ fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.grey }}>{k}</Text>;
  const n = parseInt(jump, 10);

  return (
    <Sheet visible={visible} onClose={onClose} title={t('practice.filters')}>
      {label(t('practice.domain'))}
      <Segmented value={f.domain} onChange={v => set('domain', v)} options={[
        { value: 'all', label: t('practice.all') }, { value: 'concepts', label: t('common.domain.concepts') },
        { value: 'architecture', label: t('common.domain.architecture') }, { value: 'management', label: t('common.domain.management') },
      ]} />
      {label(t('practice.status'))}
      <Segmented value={f.status} onChange={v => set('status', v)} options={[
        { value: 'all', label: t('practice.all') }, { value: 'unseen', label: t('practice.unseen') },
        { value: 'wrong', label: t('practice.wrong') }, { value: 'flagged', label: t('practice.flagged') },
      ]} />
      {label(t('practice.type'))}
      <Segmented value={f.type} onChange={v => set('type', v)} options={[
        { value: 'all', label: t('practice.all') }, { value: 'mc', label: t('practice.mc') }, { value: 'visual', label: t('practice.visual') },
      ]} />
      {label(t('practice.order'))}
      <Segmented value={f.order} onChange={v => set('order', v)} options={[
        { value: 'seq', label: t('practice.seq') }, { value: 'random', label: t('practice.random') },
      ]} />
      <Button title={t('practice.startSet')} size="lg" fullWidth onPress={() => { onStart(f); onClose(); }} />
      {label(t('practice.jumpTo'))}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TextInput
          value={jump} onChangeText={s => setJump(s.replace(/[^0-9]/g, ''))} keyboardType="number-pad" returnKeyType="go"
          placeholder="#" placeholderTextColor={colors.grey} accessibilityLabel={t('practice.jumpTo')}
          onSubmitEditing={() => { if (n > 0) { onJump(n); onClose(); } }}
          style={{ flex: 1, minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 14, color: colors.ink, fontFamily: fonts.medium, fontSize: fontSize.lg }}
        />
        <Button title={t('common.continue')} variant="secondary" disabled={!(n > 0)} onPress={() => { onJump(n); onClose(); }} />
      </View>
    </Sheet>
  );
}
