import { Alert, Platform } from 'react-native';

/** Cross-platform confirm: Alert on native, window.confirm on web. */
export function confirmAction(title: string, body: string, okLabel: string, cancelLabel: string, onOk: () => void, destructive = false): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${body}`)) onOk();
    return;
  }
  Alert.alert(title, body, [
    { text: cancelLabel, style: 'cancel' },
    { text: okLabel, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}
