import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import * as haptics from '@/lib/haptics';
import type { SegmentedProps } from './types';

export function Segmented({ options, value, onChange, style }: SegmentedProps) {
  return (
    <Host matchContents={{ vertical: true }} style={[{ width: '100%' }, style]}>
      <Picker
        selection={value}
        onSelectionChange={(v: string) => { haptics.select(); onChange(v); }}
        modifiers={[pickerStyle('segmented')]}
      >
        {options.map((o) => <Text key={o.value} modifiers={[tag(o.value)]}>{o.label}</Text>)}
      </Picker>
    </Host>
  );
}
