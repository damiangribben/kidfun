/**
 * Kidfun's look: bright primaries on light yellow, black outlines and hard
 * offset shadows (neo-brutalist), Fredoka for headings and labels, Lexend for
 * body text. Light only, so both schemes share the same colours.
 */

import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

export const Palette = {
  ink: '#111111',
  blue: '#1F6BFF',
  red: '#FF3B30',
  yellow: '#FFC61A',
  green: '#22B35E',
  white: '#FFFFFF',
} as const;

const light = {
  text: '#1F2A44',
  background: '#FFFFE6',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#FFF9E5',
  textSecondary: '#5B6478',
  ink: Palette.ink,
} as const;

export const Colors = { light, dark: light } as const;

export type ThemeColor = keyof typeof light;

/** Font family names as loaded by useFonts in the root layout. */
export const Fonts = {
  display: 'Fredoka_600SemiBold',
  body: 'Lexend_400Regular',
  bodyMedium: 'Lexend_500Medium',
  bodyBold: 'Lexend_600SemiBold',
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

/** Black outline, hard offset shadow and blocky corners. */
export function brutal({
  radius = 12,
  shadow = 4,
  border = 3,
}: { radius?: number; shadow?: number; border?: number } = {}): ViewStyle {
  return {
    borderWidth: border,
    borderColor: Palette.ink,
    borderRadius: radius,
    boxShadow: [{ offsetX: shadow, offsetY: shadow, blurRadius: 0, color: Palette.ink }],
  };
}

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
