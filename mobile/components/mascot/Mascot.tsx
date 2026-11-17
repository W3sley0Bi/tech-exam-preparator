// Nimbus, the study cloud. Geometry mirrors design/nimbus.py (the icon + splash source).
import { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

export type MascotMood = 'idle' | 'happy' | 'think' | 'sad' | 'celebrate';

const INK = '#1b2430';
const OUTLINE = '#7fb3e8';
const BLUSH = '#ff9db0';
const PUFFS: [number, number, number][] = [[100, 104, 50], [56, 120, 34], [144, 120, 34], [76, 80, 30], [124, 74, 36]];

const MOODS: Record<MascotMood, { eyes: 'open' | 'happy'; look: [number, number]; mouth: 'smile' | 'open' | 'hmm' | 'frown' }> = {
  idle: { eyes: 'open', look: [0, 0], mouth: 'smile' },
  happy: { eyes: 'happy', look: [0, 0], mouth: 'open' },
  think: { eyes: 'open', look: [3, -4], mouth: 'hmm' },
  sad: { eyes: 'open', look: [0, 2], mouth: 'frown' },
  celebrate: { eyes: 'happy', look: [0, 0], mouth: 'open' },
};

function CloudBody() {
  const shapes = (props: { fill: string; stroke?: string; strokeWidth?: number }) => (
    <G {...props} strokeLinejoin="round">
      {PUFFS.map(([cx, cy, r]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
      <Rect x={54} y={112} width={92} height={46} rx={23} />
    </G>
  );
  // outline layer first, fill on top: a clean silhouette around the union of puffs
  return (
    <>
      {shapes({ fill: OUTLINE, stroke: OUTLINE, strokeWidth: 9 })}
      {shapes({ fill: 'url(#nb-body)' })}
      <Ellipse cx={70} cy={70} rx={14} ry={8} fill="#fff" opacity={0.9} transform="rotate(-30 70 70)" />
    </>
  );
}

function Eyes({ kind, look, blink }: { kind: 'open' | 'happy'; look: [number, number]; blink: boolean }) {
  const [dx, dy] = look;
  if (kind === 'happy') {
    return (
      <>
        {[82, 118].map(x => (
          <Path key={x} d={`M${x - 9} 116 Q${x} 104 ${x + 9} 116`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        ))}
      </>
    );
  }
  return (
    <>
      {[82, 118].map(x => blink ? (
        <Path key={x} d={`M${x + dx - 8} ${112 + dy} L${x + dx + 8} ${112 + dy}`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      ) : (
        <G key={x}>
          <Ellipse cx={x + dx} cy={112 + dy} rx={7.5} ry={10} fill={INK} />
          <Circle cx={x + dx + 2.5} cy={108 + dy} r={3} fill="#fff" />
        </G>
      ))}
    </>
  );
}

const MOUTHS = {
  smile: <Path d="M90 128 Q100 138 110 128" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />,
  open: (
    <>
      <Path d="M87 126 Q100 146 113 126 Z" fill={INK} />
      <Path d="M93 135 Q100 141 107 135 Q100 131 93 135Z" fill="#ff7a90" />
    </>
  ),
  hmm: <Path d="M93 132 Q101 128 109 131" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />,
  frown: <Path d="M90 135 Q100 126 110 135" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />,
};

function Extras({ mood }: { mood: MascotMood }) {
  if (mood === 'think') {
    return (
      <>
        <Circle cx={160} cy={58} r={5} fill="#9cc7f0" />
        <Circle cx={172} cy={42} r={7} fill="#9cc7f0" />
        <SvgText x={176} y={30} fontSize={26} fontWeight="700" fill="#0a66c2">?</SvgText>
      </>
    );
  }
  if (mood === 'sad') {
    return (
      <>
        <Path d="M72 101 L90 95" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <Path d="M128 101 L110 95" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <Path d="M150 84 Q156 96 150 100 Q144 96 150 84Z" fill="#6ec1ff" />
      </>
    );
  }
  if (mood === 'celebrate') {
    const confetti: [number, number, string, number][] = [
      [28, 50, '#e5a50a', -20], [176, 92, '#4cc26a', 25], [34, 150, '#6b4fd8', 40], [170, 150, '#f07272', -35], [40, 92, '#0a66c2', 10],
    ];
    return (
      <>
        <G transform="rotate(-12 112 46)">
          <Path d="M78 46 L112 32 L146 46 L112 60 Z" fill={INK} />
          <Rect x={98} y={50} width={28} height={12} rx={3} fill={INK} />
          <Path d="M146 46 L146 66" stroke="#e5a50a" strokeWidth={3} />
          <Circle cx={146} cy={68} r={4} fill="#e5a50a" />
        </G>
        {confetti.map(([x, y, c, r]) => (
          <Rect key={`${x}-${y}`} x={x} y={y} width={7} height={12} rx={2} fill={c} transform={`rotate(${r} ${x} ${y})`} />
        ))}
        {[[22, 118], [180, 66]].map(([x, y]) => (
          <Path key={x} fill="#e5a50a"
            d={`M${x} ${y - 8} L${x + 2.5} ${y - 2.5} L${x + 8} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 8} L${x - 2.5} ${y + 2.5} L${x - 8} ${y} L${x - 2.5} ${y - 2.5}Z`} />
        ))}
      </>
    );
  }
  return null;
}

export type MascotProps = {
  mood?: MascotMood;
  size?: number;
  /** gentle bob + blinking; celebrate/happy also bounce once when the mood changes */
  animated?: boolean;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Mascot({ mood = 'idle', size = 120, animated = true, shadow = true, style }: MascotProps) {
  const cfg = MOODS[mood];
  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!animated) return;
    bob.value = withRepeat(withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [animated, bob]);

  useEffect(() => {
    if (!animated) return;
    if (mood === 'happy' || mood === 'celebrate') {
      pop.value = withSequence(withTiming(1.12, { duration: 140 }), withSpring(1, { damping: 6 }));
    } else if (mood === 'sad') {
      pop.value = withSequence(withTiming(0.94, { duration: 160 }), withSpring(1, { damping: 10 }));
    }
  }, [mood, animated, pop]);

  useEffect(() => {
    if (!animated || cfg.eyes !== 'open') return;
    let close: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setBlink(true);
      close = setTimeout(() => setBlink(false), 130);
    }, 3400 + Math.random() * 1200);
    return () => { clearInterval(id); clearTimeout(close); };
  }, [animated, cfg.eyes]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }, { scale: pop.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, anim, style]} accessibilityRole="image" accessibilityLabel={`Nimbus, ${mood}`}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="nb-body" x1="0" y1="40" x2="0" y2="170" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="1" stopColor="#d6e8fb" />
          </LinearGradient>
        </Defs>
        {shadow && <Ellipse cx={100} cy={176} rx={52} ry={7} fill="#0a2540" opacity={0.12} />}
        <CloudBody />
        <Eyes kind={cfg.eyes} look={cfg.look} blink={blink} />
        {[66, 134].map(x => <Ellipse key={x} cx={x} cy={128} rx={9} ry={5} fill={BLUSH} opacity={0.65} />)}
        {MOUTHS[cfg.mouth]}
        <Extras mood={mood} />
      </Svg>
    </Animated.View>
  );
}
