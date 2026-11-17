import { Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import type { ScreenScrollProps } from './types';

export function ScreenScroll({ children, contentStyle, refreshControl }: ScreenScrollProps) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const web = Platform.OS === 'web';
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={refreshControl}
      contentContainerStyle={[
        { padding: space.lg, gap: space.md, paddingBottom: space.xxl + (web ? insets.bottom : 0) },
        web && { width: '100%', maxWidth: 720, alignSelf: 'center' },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}
