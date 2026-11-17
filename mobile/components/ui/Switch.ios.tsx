import { Host, Toggle } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import * as haptics from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import type { SwitchProps } from './types';

export function Switch({ label, value, onChange, style }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <Host matchContents={{ vertical: true }} style={[{ width: '100%' }, style]}>
      <Toggle label={label} isOn={value} onIsOnChange={(v) => { haptics.tap(); onChange(v); }} modifiers={[tint(colors.primary)]} />
    </Host>
  );
}
