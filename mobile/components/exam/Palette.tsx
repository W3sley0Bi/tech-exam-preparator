import { Pressable, Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { fontSize, useTheme } from '@/lib/theme';
import { examIsDone } from '@/lib/logic/exam';
import type { ExamSession } from '@/lib/types';

export function Palette({ ex, onJump }: { ex: ExamSession; onJump: (i: number) => void }) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ex.list.map((n, i) => {
        const done = examIsDone(ex, n), flag = !!ex.flags[n], cur = i === ex.idx;
        const bg = done ? colors.primaryBg : colors.card2;
        return (
          <Pressable
            key={n} accessibilityRole="button"
            accessibilityLabel={`${i + 1}${done ? ', answered' : ''}${flag ? ', marked' : ''}`}
            onPress={() => { haptics.select(); onJump(i); }}
            style={{
              width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: bg, borderWidth: cur ? 2.5 : 1.5, borderColor: cur ? colors.primary : flag ? colors.warn : colors.line,
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.md, color: done ? colors.primary : colors.ink }}>{i + 1}</Text>
            {flag ? <View style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warn }} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
