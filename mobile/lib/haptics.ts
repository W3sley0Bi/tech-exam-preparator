import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useStore } from './store';

const on = () => Platform.OS !== 'web' && useStore.getState().settings.haptics;

/** light impact: buttons, toggles */
export const tap = (): void => { if (on()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
/** selection tick: picking a choice / changing a segment */
export const select = (): void => { if (on()) void Haptics.selectionAsync().catch(() => {}); };
/** correct answer, lesson passed */
export const success = (): void => { if (on()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
/** wrong answer */
export const error = (): void => { if (on()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); };
