import { Gauge, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground, font, foregroundColor, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding,
  progressViewStyle, tint, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type ExamCountdownProps = {
  daysToExam: number;
  examDate: string;
  readiness: number;
  status: 'ok' | 'warn' | 'bad' | 'ready';
  todayAnswered: number;
  todayGoal: number;
  streak: number;
};

const initialProps: ExamCountdownProps = {
  daysToExam: 0, examDate: '', readiness: 0, status: 'warn', todayAnswered: 0, todayGoal: 0, streak: 0,
};

function ExamCountdownWidget(props: ExamCountdownProps, environment: WidgetEnvironment) {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const blue = dark ? '#4ea1f3' : '#0a66c2';
  const ink = dark ? '#e6ebf1' : '#1b2430';
  const grey = dark ? '#93a1b2' : '#5d6b7c';
  const bg = dark ? '#0f141a' : '#f5f7fa';
  const dotColors = { ok: '#1a7f37', ready: '#1a7f37', warn: '#e5a50a', bad: '#c62828' };
  const dot = dotColors[props.status];
  const family = environment.widgetFamily;
  const days = Math.max(0, props.daysToExam);
  const readiness = Math.min(100, Math.max(0, props.readiness));
  const goal = Math.max(1, props.todayGoal);
  const progress = Math.min(1, props.todayAnswered / goal);
  const link = widgetURL('az900prep://plan');

  if (family === 'accessoryCircular') {
    return (
      <Gauge
        value={readiness / 100}
        currentValueLabel={<Text modifiers={[font({ size: 16, weight: 'bold' }), monospacedDigit()]}>{String(days)}</Text>}
        modifiers={[gaugeStyle('circularCapacity'), link]}
      />
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={2} modifiers={[link]}>
        <Text modifiers={[font({ size: 14, weight: 'semibold' }), lineLimit(1)]}>{`AZ-900 in ${days} days`}</Text>
        <Text modifiers={[font({ size: 12 }), lineLimit(1)]}>{`Readiness ${readiness}% · today ${props.todayAnswered}/${props.todayGoal}`}</Text>
        <ProgressView value={progress} modifiers={[progressViewStyle('linear')]} />
      </VStack>
    );
  }

  if (family === 'systemMedium') {
    return (
      <HStack spacing={16} modifiers={[padding({ all: 14 }), containerBackground(bg, 'widget'), link]}>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundColor(blue)]}>AZ-900</Text>
          <Text modifiers={[font({ size: 56, weight: 'heavy', design: 'rounded' }), foregroundColor(ink), monospacedDigit(), minimumScaleFactor(0.5), lineLimit(1)]}>
            {String(days)}
          </Text>
          <HStack spacing={5}>
            <Image systemName="circle.fill" size={8} color={dot} />
            <Text modifiers={[font({ size: 12 }), foregroundColor(grey)]}>days to exam</Text>
          </HStack>
        </VStack>
        <Spacer />
        <VStack alignment="leading" spacing={8}>
          <HStack spacing={12}>
            <Gauge
              value={readiness / 100}
              currentValueLabel={<Text modifiers={[font({ size: 13, weight: 'bold' }), monospacedDigit()]}>{`${readiness}%`}</Text>}
              modifiers={[gaugeStyle('circularCapacity'), tint(blue)]}
            />
            <VStack alignment="leading" spacing={2}>
              <HStack spacing={3}>
                <Image systemName="flame.fill" size={16} color="#f08a24" />
                <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundColor(ink), monospacedDigit()]}>{String(props.streak)}</Text>
              </HStack>
              <Text modifiers={[font({ size: 11 }), foregroundColor(grey)]}>day streak</Text>
            </VStack>
          </HStack>
          <ProgressView value={progress} modifiers={[progressViewStyle('linear'), tint(blue)]} />
          <Text modifiers={[font({ size: 11 }), foregroundColor(grey)]}>{`Today ${props.todayAnswered}/${props.todayGoal} questions`}</Text>
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={2} modifiers={[padding({ all: 14 }), containerBackground(bg, 'widget'), link]}>
      <HStack spacing={5}>
        <Image systemName="circle.fill" size={9} color={dot} />
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundColor(blue)]}>AZ-900</Text>
      </HStack>
      <Spacer />
      <Text modifiers={[font({ size: 64, weight: 'heavy', design: 'rounded' }), foregroundColor(ink), monospacedDigit(), minimumScaleFactor(0.5), lineLimit(1)]}>
        {String(days)}
      </Text>
      <Text modifiers={[font({ size: 13 }), foregroundColor(grey)]}>days to AZ-900</Text>
      <Spacer />
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundColor(ink)]}>{`Today ${props.todayAnswered}/${props.todayGoal}`}</Text>
    </VStack>
  );
}

export default createWidget<ExamCountdownProps>('ExamCountdown', ExamCountdownWidget, initialProps);
