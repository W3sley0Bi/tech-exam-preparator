import { Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import { Button } from './Button';
import type { EmptyStateProps } from './types';

export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
      {Icon ? <Icon size={40} color={colors.grey} strokeWidth={1.8} /> : null}
      <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink, textAlign: 'center' }}>{title}</Text>
      {text ? <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.grey, textAlign: 'center' }}>{text}</Text> : null}
      {action ? <Button title={action.label} onPress={action.onPress} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}
