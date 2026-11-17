import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/lib/fonts';
import { fontSize, useTheme } from '@/lib/theme';
import { X } from 'lucide-react-native';
import type { SheetProps } from './types';

// iOS: native pageSheet presentation (drag to dismiss, Liquid Glass chrome on iOS 26). Web: slide-up modal.
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { colors, radius, space } = useTheme();
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  return (
    <Modal visible={visible} animationType="slide" transparent={!ios} presentationStyle={ios ? 'pageSheet' : undefined} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: ios ? colors.paper : 'rgba(0,0,0,0.4)' }}>
        {!ios ? <Pressable accessibilityLabel="Close" style={{ flex: 1 }} onPress={onClose} /> : null}
        <View style={[{ backgroundColor: colors.paper, maxHeight: ios ? '100%' : '85%', flex: ios ? 1 : undefined }, !ios && { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.ink, flex: 1 }}>{title ?? ''}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10}><X size={22} color={colors.grey} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: 0, paddingBottom: insets.bottom + space.xl, gap: space.md }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
