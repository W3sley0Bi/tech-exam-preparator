// Shared prop types for components/ui. Platform files (Foo.tsx / Foo.ios.tsx) must use these.
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { Domain } from '@/lib/theme';

export type Tone = 'primary' | 'ok' | 'bad' | 'warn' | 'neutral';
export type PillTone = 'neutral' | 'ok' | 'bad' | 'warn' | 'domain';

export interface SegmentedOption { value: string; label: string }
export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  label?: string;
  color?: string;
}

export interface SwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
}

export interface CardProps { children?: ReactNode; style?: StyleProp<ViewStyle> }
export interface GlassCardProps extends CardProps { tint?: string }

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface PillProps { label: string; tone?: PillTone; domain?: Domain; style?: StyleProp<ViewStyle> }

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: Tone;
  /** 0..1 target position */
  marker?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export interface StatTileProps { value: string | number; label: string; icon?: LucideIcon; tone?: Tone; style?: StyleProp<ViewStyle> }
export interface SectionHeaderProps { title: string; action?: { label: string; onPress: () => void }; style?: StyleProp<ViewStyle> }
export interface EmptyStateProps {
  icon?: LucideIcon; title: string; text?: string;
  action?: { label: string; onPress: () => void };
}
export interface ListRowProps {
  icon?: LucideIcon; title: string; subtitle?: string; right?: ReactNode;
  onPress?: () => void; chevron?: boolean; tone?: Tone; style?: StyleProp<ViewStyle>;
}
export interface SheetProps { visible: boolean; onClose: () => void; title?: string; children?: ReactNode }
export interface ScreenScrollProps { children?: ReactNode; contentStyle?: StyleProp<ViewStyle>; refreshControl?: React.ReactElement<any> }
