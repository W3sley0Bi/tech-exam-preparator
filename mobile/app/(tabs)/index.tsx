import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { BookOpen, Lock, LockOpen, Play, Star, Trophy } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { CURRICULUM, DOMAINS } from '@/lib/data';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import {
  DAILY_GOAL, MAX_LEVEL, TEST_SIZE, currentLessonId, lessonState, lessonUnlocked, skillQs,
  unitPassed, unitQs, unitTestReady, unitUnlocked,
} from '@/lib/logic/learn';
import { usePlanStatus, useStore, useStreak, useTodayXp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';
import type { Colors } from '@/lib/theme';

const OFFSETS = [0, 55, 85, 55, 0, -55, -85, -55];
const NODE = 72;
const DEPTH = 7;
const WRAP_W = 170; // + max zigzag offset (85) must stay inside half a 375pt screen

function confirmAsk(title: string, body: string | undefined, okLabel: string, cancelLabel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(body ? `${title}\n${body}` : title)) onOk();
    return;
  }
  Alert.alert(title, body, [
    { text: cancelLabel, style: 'cancel' },
    { text: okLabel, onPress: onOk },
  ]);
}

type NodeState = 'locked' | 'open' | 'done' | 'gold';

function Chunky({
  state, face, shape, children, onPress, label, disabled,
}: {
  state: NodeState; face: string; shape: 'round' | 'square'; children: React.ReactNode;
  onPress: () => void; label: string; disabled?: boolean;
}) {
  const { colors } = useTheme();
  const press = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (state === 'open') {
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    } else pulse.value = 0;
  }, [state, pulse]);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * DEPTH }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.4 }],
  }));
  const r = shape === 'round' ? NODE / 2 : 22;
  const locked = state === 'locked';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => { press.value = withTiming(1, { duration: 70 }); }}
      onPressOut={() => { press.value = withTiming(0, { duration: 120 }); }}
      onPress={onPress}
      style={{ width: NODE, height: NODE + DEPTH }}
    >
      {state === 'open' && (
        <Animated.View
          pointerEvents="none"
          style={[{
            position: 'absolute', top: 0, left: 0, width: NODE, height: NODE, borderRadius: r,
            borderWidth: 4, borderColor: face,
          }, ringStyle]}
        />
      )}
      <View
        style={{
          position: 'absolute', top: DEPTH, left: 0, width: NODE, height: NODE, borderRadius: r,
          backgroundColor: locked ? colors.line : face,
        }}
      >
        <View style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: 'rgba(0,0,0,0.28)' }]} />
      </View>
      <Animated.View
        style={[{
          position: 'absolute', top: 0, left: 0, width: NODE, height: NODE, borderRadius: r,
          backgroundColor: locked ? colors.card2 : face, alignItems: 'center', justifyContent: 'center',
          borderWidth: locked ? 2 : 0, borderColor: colors.line,
        }, faceStyle]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function StartBubble({ side }: { side: 'left' | 'right' }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 650, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 650, easing: Easing.inOut(Easing.quad) }),
      ), -1, false,
    );
  }, [y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <>
      <Animated.View style={[{ alignItems: 'center', marginBottom: 6 }, st]}>
        <View
          style={{
            backgroundColor: colors.card, borderColor: colors.line, borderWidth: 2, borderRadius: radius.lg,
            paddingHorizontal: 14, paddingVertical: 6,
          }}
        >
          <Text style={{ fontFamily: fonts.heavy, fontSize: 14, letterSpacing: 1, color: colors.primary }}>
            {t('learn.start')}
          </Text>
        </View>
        <View
          style={{
            width: 12, height: 12, backgroundColor: colors.card, borderColor: colors.line,
            borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }], marginTop: -7,
          }}
        />
      </Animated.View>
      <View
        pointerEvents="none"
        style={[{ position: 'absolute', top: 8 }, side === 'left' ? { left: 2 } : { right: 2 }]}
      >
        <Mascot mood="think" size={64} />
      </View>
    </>
  );
}

function Dots({ level, colors }: { level: number; colors: Colors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
      {[1, 2, 3].map(l => (
        <View
          key={l}
          style={{
            width: 9, height: 9, borderRadius: 5,
            backgroundColor: level >= l ? colors.gold : colors.line,
          }}
        />
      ))}
    </View>
  );
}

function Stat({ value, label, colors, color, flex = 1, onPress }: {
  value: string; label: string; colors: Colors; color?: string; flex?: number; onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={{ flex, alignItems: 'center' }}>
      <Text numberOfLines={1} style={{ fontFamily: fonts.heavy, fontSize: 16, color: color ?? colors.ink }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.grey, marginTop: 1 }}>{label}</Text>
    </Pressable>
  );
}

export default function LearnScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, scheme, domainColors } = useTheme();
  const path = useStore(s => s.path);
  const streak = useStreak();
  const todayXp = useTodayXp();
  const plan = usePlanStatus();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const current = useMemo(() => currentLessonId(path), [path]);

  // auto-scroll: sum the nested onLayout offsets of the current lesson (once)
  const pos = useRef({ path: 0, unit: 0, nodes: 0, wrap: 0, got: 0, done: false });
  const mark = (k: 'path' | 'unit' | 'nodes' | 'wrap') => (e: LayoutChangeEvent) => {
    const p = pos.current;
    p[k] = e.nativeEvent.layout.y;
    p.got |= { path: 1, unit: 2, nodes: 4, wrap: 8 }[k];
    if (p.got === 15 && !p.done) {
      p.done = true;
      const y = p.path + p.unit + p.nodes + p.wrap;
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 220), animated: false }), 30);
    }
  };

  const toggleUnlock = useCallback(() => {
    haptics.tap();
    confirmAsk(t('learn.unlockAll'), undefined, t('common.yes'), t('common.cancel'), () => {
      useStore.getState().setUnlockAll(!useStore.getState().path.unlockAll);
    });
  }, [t]);

  const openTest = (uid: string, ready: boolean) => {
    haptics.tap();
    const go = () => router.push(`/lesson/${uid}?mode=test` as never);
    if (ready) go();
    else confirmAsk(t('learn.jumpTitle'), t('learn.jumpBody'), t('learn.jumpConfirm'), t('common.cancel'), go);
  };

  const dailyPct = Math.min(1, todayXp / DAILY_GOAL);
  const statusColor = plan.overall === 'ok' ? colors.ok : plan.overall === 'warn' ? colors.warn : colors.danger;
  const examText = plan.daysToExam > 0
    ? t('plan.banner.daysToExam', { count: plan.daysToExam })
    : plan.daysToExam === 0 ? t('plan.banner.examDay') : t('plan.banner.examDone');

  let nodeIdx = 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen
        options={{
          title: t('learn.title'),
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable
              onPress={toggleUnlock}
              accessibilityRole="button"
              accessibilityLabel={t('learn.unlockAll')}
              accessibilityState={{ selected: path.unlockAll }}
              hitSlop={8}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              {path.unlockAll
                ? <LockOpen size={22} color={colors.primary} />
                : <Lock size={22} color={colors.grey} />}
            </Pressable>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: space.xxl * 2 },
          Platform.OS === 'web' && { width: '100%', maxWidth: 720, alignSelf: 'center' },
        ]}
      >
        {/* stats: one compact row, each with a label */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: space.lg }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.line,
              borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, paddingVertical: 10,
            }}
          >
            <Stat value={`🔥 ${streak}`} label="Day streak" colors={colors} />
            <Stat value={`⚡ ${path.xp}`} label="Total XP" colors={colors} />
            <Stat value={`${todayXp}/${DAILY_GOAL}`} label="XP today" colors={colors} color={dailyPct >= 1 ? colors.ok : undefined} />
            <Stat
              value={plan.daysToExam > 0 ? `${plan.daysToExam}d` : plan.daysToExam === 0 ? 'Today' : 'Done'}
              label={`Exam · ${Math.round(plan.readiness)}% ready`}
              colors={colors} color={statusColor} flex={1.5}
              onPress={() => { haptics.tap(); router.push('/plan' as never); }}
            />
            <Pressable
              onPress={toggleUnlock}
              accessibilityRole="button"
              accessibilityLabel={t('learn.unlockAll')}
              hitSlop={8}
              style={{ paddingHorizontal: 12 }}
            >
              {path.unlockAll ? <LockOpen size={18} color={colors.primary} /> : <Lock size={18} color={colors.grey} />}
            </Pressable>
          </View>
        </View>

        {/* path */}
        <View onLayout={mark('path')} style={{ paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.xl }}>
          {CURRICULUM.map((u, ui) => {
            const unlocked = unitUnlocked(path, ui);
            const dc = domainColors[u.domain];
            const done = u.skills.filter(sk => lessonState(path, sk.id).level > 0).length;
            const passed = unitPassed(path, u);
            const testReady = unlocked && unitTestReady(path, ui);
            const testState: NodeState = passed ? 'gold' : testReady ? 'open' : 'locked';
            const domainLabel = DOMAINS[u.domain as keyof typeof DOMAINS]?.label ?? t('common.domain.extra');
            const hasCurrent = current != null && u.skills.some(sk => sk.id === current);
            return (
              <View key={u.id} onLayout={hasCurrent ? mark('unit') : undefined}>
                <View
                  style={{
                    backgroundColor: dc.fg, borderRadius: radius.xl, padding: space.lg,
                    flexDirection: 'row', alignItems: 'center',
                    opacity: unlocked ? (scheme === 'dark' ? 0.95 : 1) : 0.45,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}>
                      {t('learn.unitLabel', { n: ui + 1, domain: domainLabel }).toUpperCase()}
                    </Text>
                    <Text style={{ fontFamily: fonts.heavy, fontSize: 19, color: '#fff' }}>{u.title}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#fff' }}>
                      {t('learn.unitProgress', { done, total: u.skills.length })}
                    </Text>
                  </View>
                </View>

                <View
                  onLayout={hasCurrent ? mark('nodes') : undefined}
                  style={{ alignItems: 'center', paddingTop: space.xl, gap: space.xl }}
                >
                  {u.skills.map((sk, si) => {
                    const st = lessonState(path, sk.id);
                    const open = lessonUnlocked(path, ui, si);
                    const n = skillQs(sk.id).length;
                    const state: NodeState = !open ? 'locked' : st.level >= MAX_LEVEL ? 'gold' : st.level > 0 ? 'done' : 'open';
                    const face = state === 'gold' ? colors.gold : state === 'done' ? colors.ok : dc.fg;
                    const off = OFFSETS[nodeIdx++ % OFFSETS.length];
                    const isCur = sk.id === current;
                    const Icon = !open ? Lock : st.level > 0 ? Star : n ? Play : BookOpen;
                    return (
                      <View
                        key={sk.id}
                        onLayout={isCur ? mark('wrap') : undefined}
                        style={{ width: WRAP_W, alignItems: 'center', transform: [{ translateX: off }] }}
                      >
                        {isCur && <StartBubble side={off > 0 ? 'left' : 'right'} />}
                        <Chunky
                          state={state}
                          face={face}
                          shape="round"
                          disabled={!open}
                          label={sk.name}
                          onPress={() => { haptics.tap(); router.push(`/lesson/${sk.id}?mode=skill` as never); }}
                        >
                          <Icon
                            size={30}
                            color={state === 'locked' ? colors.grey : colors.onPrimary}
                            fill={state === 'done' || state === 'gold' ? colors.onPrimary : 'none'}
                          />
                        </Chunky>
                        <Dots level={st.level} colors={colors} />
                        <Text
                          numberOfLines={2}
                          style={{
                            marginTop: 6, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 14,
                            color: open ? colors.ink : colors.grey,
                          }}
                        >
                          {sk.name}
                          <Text style={{ fontFamily: fonts.medium, color: colors.grey }}>
                            {' · '}{n ? t('learn.nodeQuestions', { count: n }) : t('learn.noQuestions')}
                          </Text>
                        </Text>
                      </View>
                    );
                  })}

                  {/* unit test */}
                  <View style={{ width: WRAP_W, alignItems: 'center' }}>
                    <Chunky
                      state={testState}
                      face={testState === 'gold' ? colors.gold : dc.fg}
                      shape="square"
                      label={t('learn.unitTest')}
                      onPress={() => openTest(u.id, passed || testReady)}
                    >
                      <Trophy size={32} color={testState === 'locked' ? colors.grey : colors.onPrimary} />
                    </Chunky>
                    <Text style={{ marginTop: 12, fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textAlign: 'center' }}>
                      {passed ? t('learn.unitTestPassed') : testReady ? t('learn.unitTest') : t('learn.unitTestJump')}
                      <Text style={{ fontFamily: fonts.medium, color: colors.grey }}>
                        {' · '}{t('learn.nodeQuestions', { count: Math.min(TEST_SIZE, unitQs(u).length) })}
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: { fontFamily: fonts.bold, fontSize: 14 },
});
