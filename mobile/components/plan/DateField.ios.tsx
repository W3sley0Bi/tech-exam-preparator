import { View } from 'react-native';
import { DatePicker, Host } from '@expo/ui/swift-ui';
import { dayKey, parseDay } from '@/lib/logic/util';
import type { DateFieldProps } from './DateField';

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <View style={{ minHeight: 48, justifyContent: 'center' }}>
      <Host matchContents>
        <DatePicker
          title={label}
          selection={parseDay(value)}
          displayedComponents={['date']}
          onDateChange={(d: Date) => onChange(dayKey(d))}
        />
      </Host>
    </View>
  );
}
