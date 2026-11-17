import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom space for content that sits in a tab screen: the floating native tab bar overlays it on iOS. */
export function useTabPad(): number {
  const { bottom } = useSafeAreaInsets();
  return Platform.OS === 'ios' ? bottom + 56 : 0;
}
